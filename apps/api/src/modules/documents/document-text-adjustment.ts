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

type MarkdownBlockType = "blank" | "heading" | "list-item" | "paragraph";

type MarkdownBlock = {
  contentEnd: number;
  contentStart: number;
  end: number;
  headingLevel?: number;
  renderedEnd: number;
  renderedStart: number;
  start: number;
  text: string;
  type: MarkdownBlockType;
};

type MarkdownProjection = {
  blocks: MarkdownBlock[];
  renderedText: string;
  sourceOffsets: number[];
};

type NormalizedProjection = {
  sourceOffsets: number[];
  text: string;
};

type SelectionConflictReason = "ambiguous" | "context_mismatch" | "no_match";

type SelectionConflictDetails = {
  candidateCount?: number;
  reason: SelectionConflictReason;
};

type AdjustmentSourceMetadata = {
  blockType: "heading" | "heading-plus-body" | "list-item" | "mixed" | "paragraph" | "unknown";
  nearbyMarkdown: string;
  nextHeading?: string;
  previousHeading?: string;
  selectedSourceText: string;
};

const TONE_SAMPLE_MAX_LENGTH = 6000;
const CONTEXT_MAX_LENGTH = 1500;

function normalizeInputText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function foldTextForMatching(value: string) {
  return normalizeInputText(value).toLocaleLowerCase("pt-BR");
}

function assertNonEmptyText(
  value: string,
  message: string,
  options: { preserveWhitespace?: boolean } = {},
) {
  const next = options.preserveWhitespace ? value.trim() : normalizeInputText(value);

  if (!normalizeInputText(next)) {
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

function getOverlappingBlocks(blocks: MarkdownBlock[], target: AdjustmentTarget) {
  return blocks.filter((block) => block.end >= target.start && block.start <= target.end);
}

function getAdjustmentSourceMetadata(
  content: string,
  target: AdjustmentTarget,
): AdjustmentSourceMetadata {
  const projection = projectMarkdownSource(content);
  const selectedSourceText = content.slice(target.start, target.end);
  const overlappingBlocks = getOverlappingBlocks(projection.blocks, target).filter(
    (block) => block.type !== "blank",
  );
  const blockTypes = new Set(overlappingBlocks.map((block) => block.type));
  const hasHeading = blockTypes.has("heading");
  const hasBody = overlappingBlocks.some((block) => block.type !== "heading");
  const previousHeading = projection.blocks
    .filter((block) => block.type === "heading" && block.end < target.start)
    .at(-1)?.text;
  const nextHeading = projection.blocks.find(
    (block) => block.type === "heading" && block.start > target.end,
  )?.text;
  let blockType: AdjustmentSourceMetadata["blockType"] = "unknown";

  if (hasHeading && hasBody) {
    blockType = "heading-plus-body";
  } else if (blockTypes.size === 1 && blockTypes.has("heading")) {
    blockType = "heading";
  } else if (blockTypes.size === 1 && blockTypes.has("list-item")) {
    blockType = "list-item";
  } else if (blockTypes.size === 1 && blockTypes.has("paragraph")) {
    blockType = "paragraph";
  } else if (blockTypes.size > 1) {
    blockType = "mixed";
  }

  return {
    blockType,
    nearbyMarkdown: content.slice(
      Math.max(0, target.start - CONTEXT_MAX_LENGTH),
      Math.min(content.length, target.end + CONTEXT_MAX_LENGTH),
    ),
    nextHeading,
    previousHeading,
    selectedSourceText,
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
  const sourceMetadata = sourceTarget ? getAdjustmentSourceMetadata(content, sourceTarget) : null;
  const selectedSourceText = sourceMetadata?.selectedSourceText ?? selectedText;
  const structuralGuidance = sourceMetadata
    ? [
        `Formato do alvo: ${sourceMetadata.blockType}.`,
        sourceMetadata.previousHeading
          ? `Título anterior/de contexto: ${sourceMetadata.previousHeading}.`
          : null,
        sourceMetadata.nextHeading
          ? `Próximo título após o alvo: ${sourceMetadata.nextHeading}.`
          : null,
        sourceMetadata.blockType === "paragraph"
          ? "O alvo é somente corpo de texto: devolva apenas parágrafo(s), sem repetir ou criar título."
          : null,
        sourceMetadata.blockType === "heading-plus-body"
          ? "O alvo contém título e corpo: mantenha o título em linha Markdown própria e o corpo em parágrafo separado, salvo pedido explícito para mudar o título."
          : null,
        sourceMetadata.blockType === "list-item"
          ? "O alvo é item/lista: preserve a estrutura de lista salvo pedido explícito para transformar em parágrafo."
          : null,
      ]
        .filter(Boolean)
        .join("\n")
    : "Formato do alvo: não identificado.";

  return [
    "Você é um assistente especializado em documentos administrativos de contratações públicas municipais no Brasil.",
    "Reescreva apenas o trecho selecionado conforme a solicitação do usuário, preservando a estrutura documental existente.",
    "",
    "Regras obrigatórias:",
    "- Preserve o tom formal, institucional e técnico-jurídico do documento.",
    "- Não acrescente fatos, valores, datas, nomes, fundamentos legais ou conclusões que não estejam no trecho ou no contexto.",
    "- Não reescreva outras seções do documento.",
    "- Preserve a estrutura Markdown do trecho original: títulos continuam como títulos, parágrafos continuam como parágrafos e listas continuam como listas, salvo se o usuário pedir explicitamente outra estrutura.",
    "- Se o trecho tiver título de seção seguido de conteúdo, mantenha o título separado e reescreva apenas o conteúdo quando o pedido for de clareza, legibilidade ou linguagem.",
    "- Não transforme parágrafos em título, não coloque o corpo inteiro em caixa alta e não use negrito/caixa alta como substituto de estrutura.",
    "- Responda somente com o texto substituto em Markdown compatível com o trecho original, sem comentários, aspas, explicações ou cercas de código.",
    "",
    `Tipo de documento: ${documentType.toUpperCase()}`,
    "",
    "Solicitação do usuário:",
    instruction,
    "",
    "Trecho selecionado como aparece para o usuário:",
    selectedText,
    "",
    "Trecho selecionado em Markdown original que será substituído:",
    selectedSourceText,
    "",
    "Formato e limites estruturais do trecho:",
    structuralGuidance,
    "",
    "Markdown próximo ao trecho:",
    sourceMetadata?.nearbyMarkdown ?? "Não informado.",
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

function targetMatchesProjectedContext(
  content: string,
  target: AdjustmentTarget,
  context?: SelectionContext,
) {
  if (!context?.prefix && !context?.suffix) {
    return true;
  }

  const { renderedText, sourceOffsets } = projectMarkdownSource(content);
  const targetRenderedStart = sourceOffsets.findIndex((offset) => offset >= target.start);
  const targetRenderedEnd =
    sourceOffsets.findLastIndex((offset) => offset >= target.start && offset < target.end) + 1;

  if (targetRenderedStart < 0 || targetRenderedEnd <= targetRenderedStart) {
    return false;
  }

  const renderedBefore = normalizeProjectedText({
    text: renderedText.slice(0, targetRenderedStart),
  }).text;
  const renderedAfter = normalizeProjectedText({
    text: renderedText.slice(targetRenderedEnd),
  }).text;
  const prefix = context.prefix ? foldTextForMatching(context.prefix) : null;
  const suffix = context.suffix ? foldTextForMatching(context.suffix) : null;
  const foldedRenderedBefore = foldTextForMatching(renderedBefore);
  const foldedRenderedAfter = foldTextForMatching(renderedAfter);

  if (prefix && !foldedRenderedBefore.endsWith(prefix)) {
    return false;
  }

  if (suffix && !foldedRenderedAfter.startsWith(suffix)) {
    return false;
  }

  return true;
}

function targetMatchesSelectionContext(
  content: string,
  target: AdjustmentTarget,
  context?: SelectionContext,
) {
  return (
    targetMatchesContext(content, target, context) ||
    targetMatchesProjectedContext(content, target, context)
  );
}

function createUnresolvedSelectionError(
  details: SelectionConflictDetails = { reason: "no_match" },
) {
  return new ConflictError(
    "Não foi possível localizar esse trecho de forma única no documento. Selecione um trecho maior ou mais específico.",
    details,
  );
}

function getUniqueAdjustmentTarget(candidates: AdjustmentTarget[]) {
  const uniqueCandidates = Array.from(
    new Map(
      candidates.map((candidate) => [`${candidate.start}:${candidate.end}`, candidate]),
    ).values(),
  );

  if (uniqueCandidates.length === 0) {
    return null;
  }

  if (uniqueCandidates.length > 1) {
    throw createUnresolvedSelectionError({
      candidateCount: uniqueCandidates.length,
      reason: "ambiguous",
    });
  }

  return uniqueCandidates[0];
}

function getLineBounds(content: string, target: AdjustmentTarget) {
  const start = content.lastIndexOf("\n", Math.max(0, target.start - 1)) + 1;
  const nextLineBreak = content.indexOf("\n", target.end);
  const end = nextLineBreak >= 0 ? nextLineBreak : content.length;

  return { start, end };
}

function shouldExpandMarkdownBlockTarget(content: string, target: AdjustmentTarget) {
  const sourceText = content.slice(target.start, target.end);

  if (!sourceText.includes("\n")) {
    return false;
  }

  const { start: lineStart, end: lineEnd } = getLineBounds(content, target);
  const firstLine = content.slice(lineStart, lineEnd);
  const firstLinePrefix = content.slice(lineStart, target.start);
  const hasMarkdownHeadingLine = /^#{1,6}\s+/.test(firstLine);
  const hasMarkdownListLine = /^\s*(?:[-*+]|\d+[.)])\s+/.test(firstLine);
  const startsInsideInlineMarker = /(?:\*\*|__|\*|_|`)$/.test(firstLinePrefix);
  const includesMarkdownHeadingLine = /\n#{1,6}\s+/.test(sourceText);
  const includesMarkdownListLine = /\n\s*(?:[-*+]|\d+[.)])\s+/.test(sourceText);

  return (
    hasMarkdownHeadingLine ||
    hasMarkdownListLine ||
    startsInsideInlineMarker ||
    includesMarkdownHeadingLine ||
    includesMarkdownListLine
  );
}

function expandMarkdownBlockTarget(content: string, target: AdjustmentTarget) {
  if (!shouldExpandMarkdownBlockTarget(content, target)) {
    return target;
  }

  return getLineBounds(content, target);
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

  if (!value.slice(index + 1, nextIndex).includes("\n")) {
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

function getMarkdownLineMetadata(line: string) {
  const headingMatch = /^(#{1,6})\s+/.exec(line);

  if (headingMatch) {
    return {
      contentOffset: headingMatch[0].length,
      headingLevel: headingMatch[1].length,
      type: "heading" as const,
    };
  }

  const listMatch = /^(\s*(?:[-*+]|\d+[.)])\s+)/.exec(line);

  if (listMatch) {
    return {
      contentOffset: listMatch[1].length,
      type: "list-item" as const,
    };
  }

  return {
    contentOffset: 0,
    type: line.trim() ? ("paragraph" as const) : ("blank" as const),
  };
}

function projectMarkdownSource(source: string): MarkdownProjection {
  const blocks: MarkdownBlock[] = [];
  const renderedChars: string[] = [];
  const sourceOffsets: number[] = [];
  const lines = source.split("\n");
  let sourceOffset = 0;

  for (let li = 0; li < lines.length; li++) {
    const line = lines[li];
    const lineStartSourceOffset = sourceOffset;
    const renderedStart = renderedChars.length;
    const lineMetadata = getMarkdownLineMetadata(line);
    let i = lineMetadata.contentOffset;
    sourceOffset += lineMetadata.contentOffset;

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

    blocks.push({
      contentEnd: lineStartSourceOffset + line.length,
      contentStart: lineStartSourceOffset + lineMetadata.contentOffset,
      end: lineStartSourceOffset + line.length,
      headingLevel: lineMetadata.headingLevel,
      renderedEnd: renderedChars.length,
      renderedStart,
      start: lineStartSourceOffset,
      text: line.slice(lineMetadata.contentOffset),
      type: lineMetadata.type,
    });

    // Add newline between lines (not after the last line)
    if (li < lines.length - 1) {
      renderedChars.push("\n");
      sourceOffsets.push(sourceOffset);
      sourceOffset++;
    }
  }

  return { blocks, renderedText: renderedChars.join(""), sourceOffsets };
}

function findMarkdownAwareCandidates(
  content: string,
  selectedText: string,
  options: { caseInsensitive?: boolean } = {},
): AdjustmentTarget[] {
  const { renderedText, sourceOffsets } = projectMarkdownSource(content);
  const normalizedRenderedText = normalizeProjectedText({
    sourceOffsets,
    text: renderedText,
  });
  const selectedProjection = normalizeProjectedText({
    dropHyphenationBreaks: true,
    text: selectedText,
  });
  const renderedHaystack = options.caseInsensitive
    ? normalizedRenderedText.text.toLocaleLowerCase("pt-BR")
    : normalizedRenderedText.text;
  const normalizedSelectedText = options.caseInsensitive
    ? selectedProjection.text.toLocaleLowerCase("pt-BR")
    : selectedProjection.text;
  const candidates: AdjustmentTarget[] = [];

  if (!normalizedSelectedText) {
    return candidates;
  }

  let renderedIdx = renderedHaystack.indexOf(normalizedSelectedText);

  while (renderedIdx >= 0) {
    const lastIdx = renderedIdx + normalizedSelectedText.length - 1;
    const start = normalizedRenderedText.sourceOffsets[renderedIdx];
    const endBase = normalizedRenderedText.sourceOffsets[lastIdx];

    if (typeof start === "number" && typeof endBase === "number") {
      candidates.push(expandMarkdownBlockTarget(content, { start, end: endBase + 1 }));
    }

    renderedIdx = renderedHaystack.indexOf(
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
  const contextMismatchCandidates: AdjustmentTarget[] = [];
  const exactRawCandidates = findExactCandidates(content, selectedText).map((target) =>
    expandMarkdownBlockTarget(content, target),
  );
  const exactCandidates = exactRawCandidates.filter((target) =>
    targetMatchesSelectionContext(content, target, selectionContext),
  );
  const exactTarget = getUniqueAdjustmentTarget(exactCandidates);

  if (exactTarget) {
    return exactTarget;
  }

  if (exactRawCandidates.length > 0) {
    contextMismatchCandidates.push(...exactRawCandidates);
  }

  // Strategy 2: Markdown-aware fallback (maps rendered text back to source offsets)
  const markdownRawCandidates = findMarkdownAwareCandidates(content, selectedText);
  const markdownCandidates = markdownRawCandidates.filter((target) =>
    targetMatchesSelectionContext(content, target, selectionContext),
  );
  const markdownTarget = getUniqueAdjustmentTarget(markdownCandidates);

  if (markdownTarget) {
    return markdownTarget;
  }

  if (markdownRawCandidates.length > 0) {
    contextMismatchCandidates.push(...markdownRawCandidates);
  }

  const canUseCaseInsensitiveMatching = Boolean(
    selectionContext?.prefix || selectionContext?.suffix,
  );
  const foldedRawCandidates = canUseCaseInsensitiveMatching
    ? findMarkdownAwareCandidates(content, selectedText, { caseInsensitive: true })
    : [];
  const foldedCandidates = foldedRawCandidates.filter((target) =>
    targetMatchesSelectionContext(content, target, selectionContext),
  );
  const foldedTarget = getUniqueAdjustmentTarget(foldedCandidates);

  if (foldedTarget) {
    return foldedTarget;
  }

  if (foldedRawCandidates.length > 0) {
    contextMismatchCandidates.push(...foldedRawCandidates);
  }

  const uniqueContextMismatchCandidateCount = new Set(
    contextMismatchCandidates.map((candidate) => `${candidate.start}:${candidate.end}`),
  ).size;

  throw createUnresolvedSelectionError(
    uniqueContextMismatchCandidateCount > 0
      ? {
          candidateCount: uniqueContextMismatchCandidateCount,
          reason: "context_mismatch",
        }
      : { reason: "no_match" },
  );
}

function instructionMayChangeDocumentStructure(instruction: string) {
  return /\b(?:t[ií]tulo|cabe[çc]alho|estrutura|formato|formata[çc][aã]o|markdown|t[oó]pico|se[çc][aã]o|lista|bullet|marcador|par[aá]grafo)\b/i.test(
    instruction,
  );
}

function instructionMayChangeHeading(instruction: string) {
  return /\b(?:t[ií]tulo|cabe[çc]alho|se[çc][aã]o|renomear|remover|excluir)\b/i.test(instruction);
}

function stripProviderOutputWrappers(value: string) {
  let next = value.trim();
  const fenceMatch = /^```(?:markdown|md|text)?\s*\n([\s\S]*?)\n```$/i.exec(next);

  if (fenceMatch) {
    next = fenceMatch[1].trim();
  }

  const quoteMatch = /^(["'“”‘’])([\s\S]*)(["'“”‘’])$/.exec(next);

  if (quoteMatch) {
    next = quoteMatch[2].trim();
  }

  return next;
}

function removeLeadingHeadingText({
  headingText,
  replacementText,
}: {
  headingText: string;
  replacementText: string;
}) {
  const lowerHeading = headingText.toLocaleLowerCase("pt-BR");
  const lowerReplacement = replacementText.toLocaleLowerCase("pt-BR");

  if (!lowerReplacement.startsWith(lowerHeading)) {
    return replacementText;
  }

  return replacementText
    .slice(headingText.length)
    .replace(/^[\s:.;,-]+/, "")
    .trim();
}

function normalizeAdjustmentReplacement({
  instruction,
  replacementText,
  sourceMetadata,
  sourceText,
}: {
  instruction: string;
  replacementText: string;
  sourceMetadata?: AdjustmentSourceMetadata;
  sourceText: string;
}) {
  const metadata =
    sourceMetadata ??
    getAdjustmentSourceMetadata(sourceText, {
      start: 0,
      end: sourceText.length,
    });
  const trimmedReplacement = stripProviderOutputWrappers(replacementText);
  const canChangeHeading = instructionMayChangeHeading(instruction);

  if (
    metadata.nextHeading &&
    foldTextForMatching(trimmedReplacement).includes(foldTextForMatching(metadata.nextHeading))
  ) {
    throw new BadRequestError(
      "Text adjustment provider returned content outside the selected target.",
    );
  }

  if (metadata.blockType === "paragraph" && !canChangeHeading) {
    if (/^#{1,6}\s+/m.test(trimmedReplacement)) {
      throw new BadRequestError("Text adjustment provider returned unsafe heading content.");
    }

    return trimmedReplacement;
  }

  if (instructionMayChangeDocumentStructure(instruction) && canChangeHeading) {
    return trimmedReplacement;
  }

  if (/^#{1,6}\s+/.test(trimmedReplacement)) {
    return trimmedReplacement;
  }

  const leadingHeadingMatch = /^(#{1,6}\s+)([^\n]+)\n+([\s\S]+)/.exec(sourceText);

  if (!leadingHeadingMatch) {
    return trimmedReplacement;
  }

  const [, headingMarker, headingText] = leadingHeadingMatch;
  const body = removeLeadingHeadingText({
    headingText: headingText.trim(),
    replacementText: trimmedReplacement,
  });
  const headingLine = `${headingMarker}${headingText.trim()}`;

  return body ? `${headingLine}\n\n${body}` : headingLine;
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
  const selectedText = assertNonEmptyText(input.selectedText, "Selected text is required.", {
    preserveWhitespace: true,
  });
  const instruction = assertNonEmptyText(input.instruction, "Adjustment instruction is required.");
  const documentType = asGeneratedDocumentType(document.type);

  // Resolve target before calling provider so ambiguous/unresolvable selections fail early
  const target = resolveDocumentTextAdjustmentTarget({
    content,
    selectedText,
    selectionContext: input.selectionContext,
  });
  const sourceMetadata = getAdjustmentSourceMetadata(content, target);

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
  const replacementText = normalizeAdjustmentReplacement({
    instruction,
    replacementText: response.text,
    sourceMetadata,
    sourceText: content.slice(target.start, target.end),
  });

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
