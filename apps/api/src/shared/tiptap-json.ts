import { createHash } from "node:crypto";

export type TiptapMarkJson = {
  attrs?: Record<string, unknown>;
  type: string;
};

export type TiptapNodeJson = {
  attrs?: Record<string, unknown>;
  content?: TiptapNodeJson[];
  marks?: TiptapMarkJson[];
  text?: string;
  type: string;
};

export type TiptapDocumentJson = TiptapNodeJson & {
  content?: TiptapNodeJson[];
  type: "doc";
};

export const emptyTiptapDocumentJson: TiptapDocumentJson = {
  type: "doc",
  content: [{ type: "paragraph" }],
};

export function isTiptapDocumentJson(value: unknown): value is TiptapDocumentJson {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const record = value as Record<string, unknown>;

  return record.type === "doc";
}

function textNode(text: string, marks?: TiptapMarkJson[]): TiptapNodeJson {
  return marks?.length ? { type: "text", marks, text } : { type: "text", text };
}

function parseInlineText(text: string): TiptapNodeJson[] {
  const nodes: TiptapNodeJson[] = [];
  const pattern = /(\*\*[^*]+\*\*|__[^_]+__|\*[^*\s][^*]*\*|_[^_\s][^_]*_)/g;
  let cursor = 0;

  for (const match of text.matchAll(pattern)) {
    const index = match.index ?? 0;
    const raw = match[0];

    if (index > cursor) {
      nodes.push(textNode(text.slice(cursor, index)));
    }

    if (raw.startsWith("**") || raw.startsWith("__")) {
      nodes.push(textNode(raw.slice(2, -2), [{ type: "bold" }]));
    } else {
      nodes.push(textNode(raw.slice(1, -1), [{ type: "italic" }]));
    }

    cursor = index + raw.length;
  }

  if (cursor < text.length) {
    nodes.push(textNode(text.slice(cursor)));
  }

  return nodes.length > 0 ? nodes : [textNode(text)];
}

function paragraph(text: string): TiptapNodeJson {
  return {
    type: "paragraph",
    content: parseInlineText(text),
  };
}

function heading(level: number, text: string): TiptapNodeJson {
  return {
    type: "heading",
    attrs: { level: Math.min(3, Math.max(1, level)) },
    content: parseInlineText(text),
  };
}

function listItem(text: string): TiptapNodeJson {
  return {
    type: "listItem",
    content: [paragraph(text)],
  };
}

function collectParagraph(lines: string[], startIndex: number) {
  const paragraphLines: string[] = [];
  let index = startIndex;

  while (index < lines.length) {
    const line = lines[index] ?? "";

    if (!line.trim()) {
      break;
    }

    if (/^\s{0,3}#{1,6}\s+/.test(line) || /^\s*(?:[-*+]|\d+[.)])\s+/.test(line)) {
      break;
    }

    paragraphLines.push(line.trim());
    index += 1;
  }

  return {
    index,
    text: paragraphLines.join(" "),
  };
}

export function documentTextToTiptapJson(content: string | null | undefined): TiptapDocumentJson {
  const normalized = (content ?? "").replace(/\r\n?/g, "\n").trim();

  if (!normalized) {
    return emptyTiptapDocumentJson;
  }

  const lines = normalized.split("\n");
  const nodes: TiptapNodeJson[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index] ?? "";
    const trimmed = line.trim();

    if (!trimmed) {
      index += 1;
      continue;
    }

    const headingMatch = trimmed.match(/^(#{1,6})\s+(.+)$/);

    if (headingMatch) {
      nodes.push(heading(headingMatch[1]?.length ?? 1, headingMatch[2] ?? ""));
      index += 1;
      continue;
    }

    if (/^\s*\|/.test(trimmed)) {
      const tableLines: string[] = [];

      while (index < lines.length && /^\s*\|/.test((lines[index] ?? "").trim())) {
        tableLines.push((lines[index] ?? "").trim());
        index += 1;
      }

      nodes.push({
        type: "codeBlock",
        content: [textNode(tableLines.join("\n"))],
      });
      continue;
    }

    if (/^-{3,}$/.test(trimmed)) {
      nodes.push({ type: "horizontalRule" });
      index += 1;
      continue;
    }

    const unorderedItems: string[] = [];

    while (index < lines.length) {
      const match = (lines[index] ?? "").match(/^\s*[-*+]\s+(.+)$/);

      if (!match) {
        break;
      }

      unorderedItems.push(match[1] ?? "");
      index += 1;
    }

    if (unorderedItems.length > 0) {
      nodes.push({
        type: "bulletList",
        content: unorderedItems.map(listItem),
      });
      continue;
    }

    const orderedItems: string[] = [];

    while (index < lines.length) {
      const match = (lines[index] ?? "").match(/^\s*\d+[.)]\s+(.+)$/);

      if (!match) {
        break;
      }

      orderedItems.push(match[1] ?? "");
      index += 1;
    }

    if (orderedItems.length > 0) {
      nodes.push({
        type: "orderedList",
        attrs: { start: 1 },
        content: orderedItems.map(listItem),
      });
      continue;
    }

    const nextParagraph = collectParagraph(lines, index);

    if (nextParagraph.text) {
      nodes.push(paragraph(nextParagraph.text));
      index = nextParagraph.index;
      continue;
    }

    index += 1;
  }

  return {
    type: "doc",
    content: nodes.length > 0 ? nodes : emptyTiptapDocumentJson.content,
  };
}

function renderMarkedText(text: string, marks: TiptapMarkJson[] = []) {
  return marks.reduce((current, mark) => {
    if (mark.type === "bold") {
      return `**${current}**`;
    }

    if (mark.type === "italic") {
      return `*${current}*`;
    }

    if (mark.type === "strike") {
      return `~~${current}~~`;
    }

    if (mark.type === "code") {
      return `\`${current}\``;
    }

    if (mark.type === "link" && typeof mark.attrs?.href === "string") {
      return `[${current}](${mark.attrs.href})`;
    }

    return current;
  }, text);
}

function renderInline(nodes: TiptapNodeJson[] = []): string {
  return nodes
    .map((node) => {
      if (node.type === "text") {
        return renderMarkedText(node.text ?? "", node.marks);
      }

      if (node.type === "hardBreak") {
        return "\n";
      }

      return renderInline(node.content);
    })
    .join("");
}

function renderListItem(node: TiptapNodeJson) {
  const parts = (node.content ?? [])
    .map((child) => renderBlock(child))
    .filter((value) => value.trim().length > 0);

  return parts.join("\n").trim();
}

function renderBlock(node: TiptapNodeJson, orderedIndex?: number): string {
  if (node.type === "heading") {
    const level = Number(node.attrs?.level ?? 1);

    return `${"#".repeat(Math.min(6, Math.max(1, level)))} ${renderInline(node.content).trim()}`;
  }

  if (node.type === "paragraph") {
    return renderInline(node.content).trim();
  }

  if (node.type === "blockquote") {
    return renderInline(node.content)
      .split("\n")
      .map((line) => `> ${line}`)
      .join("\n")
      .trim();
  }

  if (node.type === "codeBlock") {
    return renderInline(node.content).trim();
  }

  if (node.type === "horizontalRule") {
    return "---";
  }

  if (node.type === "bulletList") {
    return (node.content ?? [])
      .map((item) => `- ${renderListItem(item)}`)
      .join("\n")
      .trim();
  }

  if (node.type === "orderedList") {
    return (node.content ?? [])
      .map((item, index) => `${orderedIndex ?? index + 1}. ${renderListItem(item)}`)
      .join("\n")
      .trim();
  }

  if (node.type === "listItem") {
    return renderListItem(node);
  }

  return renderInline(node.content).trim();
}

export function tiptapJsonToDocumentText(content: TiptapDocumentJson): string {
  return (content.content ?? [])
    .map((node) => renderBlock(node))
    .filter((value) => value.trim().length > 0)
    .join("\n\n")
    .trim();
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(",")}]`;
  }

  const record = value as Record<string, unknown>;

  return `{${Object.keys(record)
    .filter((key) => record[key] !== undefined)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`)
    .join(",")}}`;
}

export function getTiptapJsonContentHash(content: TiptapDocumentJson) {
  return `sha256:${createHash("sha256").update(stableStringify(content)).digest("hex")}`;
}
