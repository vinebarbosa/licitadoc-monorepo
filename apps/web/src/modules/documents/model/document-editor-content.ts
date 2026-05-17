import { marked } from "marked";
import TurndownService from "turndown";

const administrativeFieldLabels = [
  "Unidade Orçamentária",
  "Unidade Orcamentaria",
  "Número da Solicitação",
  "Numero da Solicitacao",
  "Data de Emissão",
  "Data de Emissao",
  "Processo Vinculado",
  "Objeto da Solicitação",
  "Objeto da Solicitacao",
  "Órgão Solicitante",
  "Orgao Solicitante",
  "Responsável",
  "Responsavel",
];

const turndown = new TurndownService({
  bulletListMarker: "-",
  codeBlockStyle: "fenced",
  headingStyle: "atx",
});

turndown.keep(["u"]);

function hasMarkdownStructure(content: string) {
  return /(^|\n)\s{0,3}(#{1,6}\s|[-*]\s|>\s|\|.+\|)/.test(content);
}

function splitAdministrativeFields(line: string) {
  const matches = administrativeFieldLabels
    .flatMap((label) => {
      const index = line.toLocaleLowerCase("pt-BR").indexOf(`${label}:`.toLocaleLowerCase("pt-BR"));

      return index >= 0 ? [{ index, label: line.slice(index, index + label.length) }] : [];
    })
    .sort((a, b) => a.index - b.index);

  if (matches.length === 0 || (matches.length === 1 && matches[0].index > 0)) {
    return null;
  }

  return matches
    .map((match, index) => {
      const valueStart = match.index + match.label.length + 1;
      const valueEnd = matches[index + 1]?.index ?? line.length;
      const value = line
        .slice(valueStart, valueEnd)
        .replace(/^[\s\-–—]+|[\s\-–—]+$/g, "")
        .trim();

      return value ? `- **${match.label}:** ${value}` : null;
    })
    .filter((item): item is string => item !== null);
}

function splitNumberedHeading(line: string) {
  const prefixMatch = line.match(/^(\d{1,2}\.\s+)/u);

  if (!prefixMatch) {
    return null;
  }

  const bodyStart = prefixMatch[0].length;
  const firstLowerOffset = line.slice(bodyStart).search(/\p{Ll}/u);

  if (firstLowerOffset < 0) {
    return { title: line, rest: "" };
  }

  const firstLowerIndex = bodyStart + firstLowerOffset;
  const wordStart = line.lastIndexOf(" ", firstLowerIndex) + 1;

  if (wordStart <= bodyStart) {
    return null;
  }

  const previousWordEnd = wordStart - 1;
  const previousWordStart = line.lastIndexOf(" ", previousWordEnd - 1) + 1;
  const previousWord = line.slice(previousWordStart, previousWordEnd).trim();
  const tailStart =
    /^\p{Lu}$/u.test(previousWord) && previousWordStart > bodyStart ? previousWordStart : wordStart;
  const title = line.slice(0, tailStart).trim();
  const rest = line.slice(tailStart).trim();

  if (!/\p{Lu}/u.test(title.slice(bodyStart))) {
    return null;
  }

  return { title, rest };
}

function appendPlainInstitutionalBlock(blocks: string[], line: string) {
  const fields = splitAdministrativeFields(line);

  blocks.push(fields ? fields.join("\n") : line);
}

function normalizePlainInstitutionalText(content: string) {
  if (hasMarkdownStructure(content)) {
    return content;
  }

  const preparedContent = content.replace(
    /([^\n])\s+(?=\d+\.\s+[\p{Lu}\p{N}][\p{Lu}\p{N}\s,;:()/%\-–—]+(?:\s|$))/gu,
    "$1\n",
  );
  const blocks: string[] = [];

  for (const rawLine of preparedContent.split(/\r?\n/)) {
    const line = rawLine.trim();

    if (!line) {
      continue;
    }

    if (/^DOCUMENTO\b/i.test(line)) {
      blocks.push(`# ${line}`);
      continue;
    }

    const numberedHeading = splitNumberedHeading(line);

    if (numberedHeading) {
      blocks.push(`## ${numberedHeading.title}`);

      if (numberedHeading.rest) {
        appendPlainInstitutionalBlock(blocks, numberedHeading.rest);
      }
      continue;
    }

    appendPlainInstitutionalBlock(blocks, line);
  }

  return blocks.join("\n\n");
}

export function documentMarkdownToEditorHtml(markdown: string) {
  const content = normalizePlainInstitutionalText(markdown.trim());

  if (!content) {
    return "";
  }

  return marked.parse(content, {
    async: false,
    breaks: false,
    gfm: true,
  }) as string;
}

export function editorHtmlToDocumentMarkdown(html: string) {
  const markdown = turndown.turndown(html).trim();

  return markdown.replace(/^(\d+\.) {2,}/gm, "$1 ").replace(/\n{3,}/g, "\n\n");
}

export async function getDocumentContentHash(content: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(content));
  const hash = Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");

  return `sha256:${hash}`;
}
