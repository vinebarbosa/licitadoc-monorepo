import { createHash } from "node:crypto";
import { eq } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import type { Actor } from "../../authorization/actor";
import { documents } from "../../db";
import { BadRequestError } from "../../shared/errors/bad-request-error";
import { ConflictError } from "../../shared/errors/conflict-error";
import { NotFoundError } from "../../shared/errors/not-found-error";
import {
  supportedGeneratedDocumentTypes,
  type TextGenerationProvider,
} from "../../shared/text-generation/types";
import { canManageDocument } from "./documents.policies";
import type {
  ApplyDocumentTextAdjustmentInput,
  SuggestDocumentTextAdjustmentInput,
} from "./documents.schemas";
import { type StoredDocument, serializeDocumentDetail } from "./documents.shared";

type SelectionContext = {
  prefix?: string;
  suffix?: string;
};

type AdjustmentTarget = {
  end: number;
  start: number;
};

type MarkdownProjection = {
  renderedText: string;
  sourceOffsets: number[];
};

type NormalizedProjection = {
  sourceOffsets: number[];
  text: string;
};

const TONE_SAMPLE_MAX_LENGTH = 6000;
const CONTEXT_MAX_LENGTH = 1500;

function normalizeInputText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function assertNonEmptyText(value: string, message: string) {
  const next = normalizeInputText(value);

  if (!next) {
    throw new BadRequestError(message);
  }

  return next;
}

function assertCompletedDraft(document: StoredDocument) {
  const draftContent = document.draftContent?.trim();

  if (document.status !== "completed" || !draftContent) {
    throw new BadRequestError("Document must be completed and contain draft content.");
  }

  return document.draftContent ?? "";
}

function asGeneratedDocumentType(type: string) {
  if (
    !supportedGeneratedDocumentTypes.includes(
      type as (typeof supportedGeneratedDocumentTypes)[number],
    )
  ) {
    throw new BadRequestError("Document type does not support text adjustment.");
  }

  return type as (typeof supportedGeneratedDocumentTypes)[number];
}

function truncateMiddle(value: string, maxLength: number) {
  if (value.length <= maxLength) {
    return value;
  }

  const half = Math.floor((maxLength - 20) / 2);

  return `${value.slice(0, half)}\n\n[...]\n\n${value.slice(value.length - half)}`;
}

function getBoundedContext(
  content: string,
  selectedText: string,
  context?: SelectionContext,
  sourceTarget?: AdjustmentTarget,
) {
  if (sourceTarget) {
    return {
      before: content.slice(
        Math.max(0, sourceTarget.start - CONTEXT_MAX_LENGTH),
        sourceTarget.start,
      ),
      after: content.slice(sourceTarget.end, sourceTarget.end + CONTEXT_MAX_LENGTH),
    };
  }

  const exactIndex = content.indexOf(selectedText);

  if (exactIndex >= 0) {
    const before = content.slice(Math.max(0, exactIndex - CONTEXT_MAX_LENGTH), exactIndex);
    const after = content.slice(
      exactIndex + selectedText.length,
      exactIndex + selectedText.length + CONTEXT_MAX_LENGTH,
    );

    return { before, after };
  }

  return {
    before: context?.prefix ?? "",
    after: context?.suffix ?? "",
  };
}

export function getDocumentContentHash(content: string) {
  return `sha256:${createHash("sha256").update(content).digest("hex")}`;
}

export function buildDocumentTextAdjustmentPrompt({
  content,
  documentType,
  instruction,
  selectedText,
  selectionContext,
  sourceTarget,
}: {
  content: string;
  documentType: string;
  instruction: string;
  selectedText: string;
  selectionContext?: SelectionContext;
  sourceTarget?: AdjustmentTarget;
}) {
  const context = getBoundedContext(content, selectedText, selectionContext, sourceTarget);

  return [
    "Você é um assistente especializado em documentos administrativos de contratações públicas municipais no Brasil.",
    "Reescreva apenas o trecho selecionado conforme a solicitação do usuário.",
    "",
    "Regras obrigatórias:",
    "- Preserve o tom formal, institucional e técnico-jurídico do documento.",
    "- Não acrescente fatos, valores, datas, nomes, fundamentos legais ou conclusões que não estejam no trecho ou no contexto.",
    "- Não reescreva outras seções do documento.",
    "- Responda somente com o texto substituto, sem comentários, Markdown extra, aspas, explicações ou cercas de código.",
    "",
    `Tipo de documento: ${documentType.toUpperCase()}`,
    "",
    "Solicitação do usuário:",
    instruction,
    "",
    "Trecho selecionado:",
    selectedText,
    "",
    "Contexto anterior próximo:",
    context.before || "Não informado.",
    "",
    "Contexto posterior próximo:",
    context.after || "Não informado.",
    "",
    "Amostra do documento para manter o tom:",
    truncateMiddle(content, TONE_SAMPLE_MAX_LENGTH),
  ].join("\n");
}

function findExactCandidates(content: string, selectedText: string) {
  const candidates: AdjustmentTarget[] = [];
  let index = content.indexOf(selectedText);

  while (index >= 0) {
    candidates.push({ start: index, end: index + selectedText.length });
    index = content.indexOf(selectedText, index + selectedText.length);
  }

  return candidates;
}

function targetMatchesContext(
  content: string,
  target: AdjustmentTarget,
  context?: SelectionContext,
) {
  if (context?.prefix && !content.slice(0, target.start).endsWith(context.prefix)) {
    return false;
  }

  if (context?.suffix && !content.slice(target.end).startsWith(context.suffix)) {
    return false;
  }

  return true;
}

function isWhitespaceChar(char: string) {
  return /\s/.test(char);
}

function isHyphenChar(char: string) {
  return char === "-" || char === "\u2010" || char === "\u2011" || char === "\u00ad";
}

function isWordChar(char: string) {
  return /[\p{L}\p{N}]/u.test(char);
}

function findPreviousNonWhitespaceIndex(value: string, index: number) {
  for (let i = index; i >= 0; i--) {
    if (!isWhitespaceChar(value[i])) {
      return i;
    }
  }

  return -1;
}

function findNextNonWhitespaceIndex(value: string, index: number) {
  for (let i = index; i < value.length; i++) {
    if (!isWhitespaceChar(value[i])) {
      return i;
    }
  }

  return -1;
}

function isVisualHyphenationBreak(value: string, index: number) {
  if (!isHyphenChar(value[index])) {
    return false;
  }

  const nextIndex = findNextNonWhitespaceIndex(value, index + 1);

  if (nextIndex <= index + 1) {
    return false;
  }

  const previousIndex = findPreviousNonWhitespaceIndex(value, index - 1);

  if (previousIndex < 0 || nextIndex < 0) {
    return false;
  }

  return isWordChar(value[previousIndex]) && isWordChar(value[nextIndex]);
}

function normalizeProjectedText({
  dropHyphenationBreaks = false,
  sourceOffsets,
  text,
}: {
  dropHyphenationBreaks?: boolean;
  sourceOffsets?: number[];
  text: string;
}): NormalizedProjection {
  const normalizedChars: string[] = [];
  const normalizedOffsets: number[] = [];
  let lastWasWhitespace = true;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];

    if (char === "\u00ad") {
      continue;
    }

    if (dropHyphenationBreaks && isVisualHyphenationBreak(text, i)) {
      const nextIndex = findNextNonWhitespaceIndex(text, i + 1);
      i = nextIndex - 1;
      continue;
    }

    if (isWhitespaceChar(char)) {
      if (!lastWasWhitespace) {
        normalizedChars.push(" ");
        normalizedOffsets.push(sourceOffsets?.[i] ?? i);
      }

      lastWasWhitespace = true;
      continue;
    }

    normalizedChars.push(char);
    normalizedOffsets.push(sourceOffsets?.[i] ?? i);
    lastWasWhitespace = false;
  }

  if (normalizedChars.at(-1) === " ") {
    normalizedChars.pop();
    normalizedOffsets.pop();
  }

  return {
    sourceOffsets: normalizedOffsets,
    text: normalizedChars.join(""),
  };
}

function projectMarkdownSource(source: string): MarkdownProjection {
  const renderedChars: string[] = [];
  const sourceOffsets: number[] = [];
  const lines = source.split("\n");
  let sourceOffset = 0;

  for (let li = 0; li < lines.length; li++) {
    const line = lines[li];
    let i = 0;

    // Skip ATX heading markers (e.g. "## ")
    const headingMatch = /^(#{1,6} )/.exec(line);

    if (headingMatch) {
      i += headingMatch[1].length;
      sourceOffset += headingMatch[1].length;
    } else {
      // Skip list markers (e.g. "- ", "  * ", "  + ")
      const listMatch = /^(\s*[-*+] )/.exec(line);

      if (listMatch) {
        i += listMatch[1].length;
        sourceOffset += listMatch[1].length;
      }
    }

    while (i < line.length) {
      // Bold+italic: ***...*** or ___...___
      if (line.startsWith("***", i) || line.startsWith("___", i)) {
        const marker = line.slice(i, i + 3);
        const closeIdx = line.indexOf(marker, i + 3);

        if (closeIdx >= 0) {
          sourceOffset += 3;
          i += 3;

          while (i < closeIdx) {
            renderedChars.push(line[i]);
            sourceOffsets.push(sourceOffset);
            sourceOffset++;
            i++;
          }

          sourceOffset += 3;
          i += 3;
          continue;
        }
      }

      // Bold: **...** or __...__ (but not ***)
      if (
        (line.startsWith("**", i) && !line.startsWith("***", i)) ||
        (line.startsWith("__", i) && !line.startsWith("___", i))
      ) {
        const marker = line.slice(i, i + 2);
        const closeIdx = line.indexOf(marker, i + 2);

        if (closeIdx >= 0 && !line.startsWith(marker + marker[0], closeIdx)) {
          sourceOffset += 2;
          i += 2;

          while (i < closeIdx) {
            renderedChars.push(line[i]);
            sourceOffsets.push(sourceOffset);
            sourceOffset++;
            i++;
          }

          sourceOffset += 2;
          i += 2;
          continue;
        }
      }

      // Italic: *...* or _..._ (single, not double)
      if (
        (line[i] === "*" && !line.startsWith("**", i)) ||
        (line[i] === "_" && !line.startsWith("__", i))
      ) {
        const marker = line[i];
        const closeIdx = line.indexOf(marker, i + 1);

        if (closeIdx >= 0 && !line.startsWith(marker + marker, closeIdx)) {
          sourceOffset++;
          i++;

          while (i < closeIdx) {
            renderedChars.push(line[i]);
            sourceOffsets.push(sourceOffset);
            sourceOffset++;
            i++;
          }

          sourceOffset++;
          i++;
          continue;
        }
      }

      // Regular character
      renderedChars.push(line[i]);
      sourceOffsets.push(sourceOffset);
      sourceOffset++;
      i++;
    }

    // Add newline between lines (not after the last line)
    if (li < lines.length - 1) {
      renderedChars.push("\n");
      sourceOffsets.push(sourceOffset);
      sourceOffset++;
    }
  }

  return { renderedText: renderedChars.join(""), sourceOffsets };
}

function findMarkdownAwareCandidates(content: string, selectedText: string): AdjustmentTarget[] {
  const { renderedText, sourceOffsets } = projectMarkdownSource(content);
  const normalizedRenderedText = normalizeProjectedText({
    sourceOffsets,
    text: renderedText,
  });
  const normalizedSelectedText = normalizeProjectedText({
    dropHyphenationBreaks: true,
    text: selectedText,
  }).text;
  const candidates: AdjustmentTarget[] = [];

  if (!normalizedSelectedText) {
    return candidates;
  }

  let renderedIdx = normalizedRenderedText.text.indexOf(normalizedSelectedText);

  while (renderedIdx >= 0) {
    const lastIdx = renderedIdx + normalizedSelectedText.length - 1;
    const start = normalizedRenderedText.sourceOffsets[renderedIdx];
    const endBase = normalizedRenderedText.sourceOffsets[lastIdx];

    if (typeof start === "number" && typeof endBase === "number") {
      candidates.push({
        start,
        end: endBase + 1,
      });
    }

    renderedIdx = normalizedRenderedText.text.indexOf(
      normalizedSelectedText,
      renderedIdx + normalizedSelectedText.length,
    );
  }

  return candidates;
}

export function resolveDocumentTextAdjustmentTarget({
  content,
  selectedText,
  selectionContext,
}: {
  content: string;
  selectedText: string;
  selectionContext?: SelectionContext;
}) {
  // Strategy 1: exact source match
  const exactCandidates = findExactCandidates(content, selectedText).filter((target) =>
    targetMatchesContext(content, target, selectionContext),
  );

  if (exactCandidates.length === 1) {
    return exactCandidates[0];
  }

  if (exactCandidates.length > 1) {
    throw new ConflictError("Selected text could not be resolved unambiguously.");
  }

  // Strategy 2: Markdown-aware fallback (maps rendered text back to source offsets)
  const markdownCandidates = findMarkdownAwareCandidates(content, selectedText).filter((target) =>
    targetMatchesContext(content, target, selectionContext),
  );

  if (markdownCandidates.length !== 1) {
    throw new ConflictError("Selected text could not be resolved unambiguously.");
  }

  return markdownCandidates[0];
}

async function findManagedDocument({
  actor,
  db,
  documentId,
}: {
  actor: Actor;
  db: FastifyInstance["db"];
  documentId: string;
}) {
  const document = await db.query.documents.findFirst({
    where: (table, { eq: equals }) => equals(table.id, documentId),
  });

  if (!document) {
    throw new NotFoundError("Document not found.");
  }

  canManageDocument(actor, document.organizationId);

  return document;
}

export async function suggestDocumentTextAdjustment({
  actor,
  db,
  documentId,
  input,
  textGeneration,
}: {
  actor: Actor;
  db: FastifyInstance["db"];
  documentId: string;
  input: SuggestDocumentTextAdjustmentInput;
  textGeneration: TextGenerationProvider;
}) {
  const document = await findManagedDocument({ actor, db, documentId });
  const content = assertCompletedDraft(document);
  const selectedText = assertNonEmptyText(input.selectedText, "Selected text is required.");
  const instruction = assertNonEmptyText(input.instruction, "Adjustment instruction is required.");
  const documentType = asGeneratedDocumentType(document.type);

  // Resolve target before calling provider so ambiguous/unresolvable selections fail early
  const target = resolveDocumentTextAdjustmentTarget({
    content,
    selectedText,
    selectionContext: input.selectionContext,
  });

  const prompt = buildDocumentTextAdjustmentPrompt({
    content,
    documentType,
    instruction,
    selectedText,
    selectionContext: input.selectionContext,
    sourceTarget: target,
  });
  const response = await textGeneration.generateText({
    documentType,
    prompt,
    subject: {
      documentId: document.id,
      organizationId: document.organizationId,
      processId: document.processId,
    },
  });
  const replacementText = response.text.trim();

  if (!replacementText) {
    throw new BadRequestError("Text adjustment provider returned empty content.");
  }

  return {
    selectedText,
    replacementText,
    sourceContentHash: getDocumentContentHash(content),
    sourceTarget: {
      start: target.start,
      end: target.end,
      sourceText: content.slice(target.start, target.end),
    },
  };
}

export async function applyDocumentTextAdjustment({
  actor,
  db,
  documentId,
  input,
}: {
  actor: Actor;
  db: FastifyInstance["db"];
  documentId: string;
  input: ApplyDocumentTextAdjustmentInput;
}) {
  const document = await findManagedDocument({ actor, db, documentId });
  const content = assertCompletedDraft(document);
  const replacementText = assertNonEmptyText(
    input.replacementText,
    "Replacement text is required.",
  );

  if (input.sourceContentHash !== getDocumentContentHash(content)) {
    throw new ConflictError(
      "Document content changed after the adjustment suggestion was created.",
    );
  }

  const { start, end, sourceText } = input.sourceTarget;

  if (content.slice(start, end) !== sourceText) {
    throw new ConflictError("Source target no longer matches the current document content.");
  }

  const nextContent = `${content.slice(0, start)}${replacementText}${content.slice(end)}`;
  const [updatedDocument] = await db
    .update(documents)
    .set({
      draftContent: nextContent,
      updatedAt: new Date(),
    })
    .where(eq(documents.id, document.id))
    .returning();

  return serializeDocumentDetail(updatedDocument);
}
