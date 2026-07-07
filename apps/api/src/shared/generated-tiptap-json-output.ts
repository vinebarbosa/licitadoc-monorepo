import type { GeneratedDocumentType } from "./text-generation/types";
import {
  type TiptapDocumentJson,
  type TiptapNodeJson,
  tiptapJsonToDocumentText,
} from "./tiptap-json";

export type GeneratedTiptapJsonOutputValidationIssue = {
  code: string;
  message: string;
  path: string;
};

export class GeneratedTiptapJsonOutputValidationError extends Error {
  issues: GeneratedTiptapJsonOutputValidationIssue[];

  constructor(issues: GeneratedTiptapJsonOutputValidationIssue[]) {
    super("Generated Tiptap JSON output is invalid.");
    this.name = "GeneratedTiptapJsonOutputValidationError";
    this.issues = issues;
  }
}

const allowedBlockNodeTypes = new Set([
  "blockquote",
  "bulletList",
  "codeBlock",
  "heading",
  "horizontalRule",
  "orderedList",
  "paragraph",
]);
const allowedInlineNodeTypes = new Set(["hardBreak", "text"]);
const allowedContainerNodeTypes = new Set(["doc", "listItem"]);
const allowedMarkTypes = new Set(["bold", "code", "italic", "strike", "underline"]);
const maxNodeCount = 1_000;
const maxTextLength = 60_000;
const maxDepth = 8;

function normalizeSearchText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasRawHtml(value: string) {
  return /<\/?[a-z][a-z0-9-]*(?:\s[^>]*)?>/i.test(value);
}

function pushIssue(
  issues: GeneratedTiptapJsonOutputValidationIssue[],
  code: string,
  message: string,
  path: string,
) {
  issues.push({ code, message, path });
}

function validateAttrs({
  attrs,
  issues,
  nodeType,
  path,
}: {
  attrs: unknown;
  issues: GeneratedTiptapJsonOutputValidationIssue[];
  nodeType: string;
  path: string;
}) {
  if (attrs === undefined) {
    return;
  }

  if (!isRecord(attrs)) {
    pushIssue(issues, "invalid_attrs", "Node attributes must be an object.", `${path}.attrs`);
    return;
  }

  const allowed = new Set<string>();

  if (nodeType === "heading") {
    allowed.add("level");
    allowed.add("textAlign");
  }

  if (nodeType === "paragraph") {
    allowed.add("indentLevel");
    allowed.add("noFirstLineIndent");
    allowed.add("signatureClosingPart");
    allowed.add("textAlign");
  }

  if (nodeType === "orderedList") {
    allowed.add("start");
  }

  for (const key of Object.keys(attrs)) {
    if (!allowed.has(key)) {
      pushIssue(issues, "unsupported_attrs", `Unsupported attribute "${key}".`, `${path}.attrs`);
    }
  }

  if (nodeType === "heading") {
    const level = attrs.level;

    if (level !== 1 && level !== 2 && level !== 3) {
      pushIssue(issues, "invalid_heading_level", "Heading level must be 1, 2, or 3.", path);
    }
  }

  if (nodeType === "paragraph") {
    const indentLevel = attrs.indentLevel;

    if (
      indentLevel !== undefined &&
      (typeof indentLevel !== "number" ||
        !Number.isInteger(indentLevel) ||
        indentLevel < 0 ||
        indentLevel > 6)
    ) {
      pushIssue(issues, "invalid_indent", "Paragraph indentLevel must be 0 through 6.", path);
    }

    if (attrs.noFirstLineIndent !== undefined && typeof attrs.noFirstLineIndent !== "boolean") {
      pushIssue(issues, "invalid_indent", "Paragraph noFirstLineIndent must be boolean.", path);
    }

    if (
      attrs.signatureClosingPart !== undefined &&
      attrs.signatureClosingPart !== "date" &&
      attrs.signatureClosingPart !== "name" &&
      attrs.signatureClosingPart !== "role"
    ) {
      pushIssue(
        issues,
        "invalid_signature_attr",
        "signatureClosingPart must be date, name, or role.",
        path,
      );
    }
  }

  if (
    (nodeType === "paragraph" || nodeType === "heading") &&
    attrs.textAlign !== undefined &&
    attrs.textAlign !== "left" &&
    attrs.textAlign !== "center" &&
    attrs.textAlign !== "right" &&
    attrs.textAlign !== "justify"
  ) {
    pushIssue(issues, "invalid_text_align", "textAlign is not supported.", path);
  }

  if (
    nodeType === "orderedList" &&
    attrs.start !== undefined &&
    (typeof attrs.start !== "number" ||
      !Number.isInteger(attrs.start) ||
      attrs.start < 1 ||
      attrs.start > 999)
  ) {
    pushIssue(
      issues,
      "invalid_ordered_list",
      "orderedList start must be a positive integer.",
      path,
    );
  }
}

function validateMarks({
  issues,
  marks,
  path,
}: {
  issues: GeneratedTiptapJsonOutputValidationIssue[];
  marks: unknown;
  path: string;
}) {
  if (marks === undefined) {
    return;
  }

  if (!Array.isArray(marks) || marks.length > 8) {
    pushIssue(issues, "invalid_marks", "Marks must be a small array.", path);
    return;
  }

  marks.forEach((mark: unknown, index) => {
    const markPath = `${path}[${index}]`;

    if (!isRecord(mark) || typeof mark.type !== "string") {
      pushIssue(issues, "invalid_mark", "Mark must have a type.", markPath);
      return;
    }

    if (!allowedMarkTypes.has(mark.type)) {
      pushIssue(issues, "unsupported_mark", `Unsupported mark "${mark.type}".`, markPath);
    }

    if (mark.attrs !== undefined) {
      pushIssue(
        issues,
        "unsupported_mark_attrs",
        "Generated marks must not include attrs.",
        markPath,
      );
    }
  });
}

function collectInlineText(node: TiptapNodeJson): string {
  if (node.type === "text") {
    return node.text ?? "";
  }

  return (node.content ?? []).map((child) => collectInlineText(child)).join("");
}

function collectHeadings(node: TiptapNodeJson): string[] {
  const current = node.type === "heading" ? [collectInlineText(node)] : [];

  return current.concat((node.content ?? []).flatMap((child) => collectHeadings(child)));
}

function validateNode({
  depth,
  issues,
  node,
  path,
  state,
}: {
  depth: number;
  issues: GeneratedTiptapJsonOutputValidationIssue[];
  node: unknown;
  path: string;
  state: { nodeCount: number; textLength: number };
}) {
  state.nodeCount += 1;

  if (state.nodeCount > maxNodeCount) {
    pushIssue(issues, "too_many_nodes", "Generated document has too many nodes.", path);
  }

  if (depth > maxDepth) {
    pushIssue(issues, "too_deep", "Generated document nesting is too deep.", path);
  }

  if (!isRecord(node) || typeof node.type !== "string") {
    pushIssue(issues, "invalid_node", "Node must have a string type.", path);
    return;
  }

  const nodeType = node.type;
  const isRoot = path === "$";
  const allowedNode =
    (isRoot && nodeType === "doc") ||
    allowedBlockNodeTypes.has(nodeType) ||
    allowedInlineNodeTypes.has(nodeType) ||
    allowedContainerNodeTypes.has(nodeType);

  if (!allowedNode) {
    pushIssue(issues, "unsupported_node", `Unsupported node "${nodeType}".`, path);
  }

  if (nodeType === "doc" && !isRoot) {
    pushIssue(issues, "nested_doc", "doc node is only allowed at the root.", path);
  }

  if (isRoot && nodeType !== "doc") {
    pushIssue(issues, "invalid_root", "Root node must be doc.", path);
  }

  validateAttrs({ attrs: node.attrs, issues, nodeType, path });

  if (node.marks !== undefined) {
    if (nodeType !== "text") {
      pushIssue(issues, "invalid_marks", "Only text nodes may include marks.", `${path}.marks`);
    }

    validateMarks({ issues, marks: node.marks, path: `${path}.marks` });
  }

  if (node.text !== undefined) {
    if (nodeType !== "text") {
      pushIssue(issues, "invalid_text", "Only text nodes may include text.", `${path}.text`);
    } else if (typeof node.text !== "string" || node.text.length === 0) {
      pushIssue(issues, "invalid_text", "Text node must include non-empty text.", `${path}.text`);
    } else {
      state.textLength += node.text.length;

      if (hasRawHtml(node.text)) {
        pushIssue(issues, "raw_html", "Generated text must not include raw HTML.", `${path}.text`);
      }
    }
  }

  const content = node.content;

  if (content !== undefined && !Array.isArray(content)) {
    pushIssue(issues, "invalid_content", "Node content must be an array.", `${path}.content`);
    return;
  }

  if (nodeType === "doc" && (!Array.isArray(content) || content.length === 0)) {
    pushIssue(issues, "empty_document", "Generated document must contain blocks.", path);
  }

  if (nodeType === "text" || nodeType === "hardBreak" || nodeType === "horizontalRule") {
    if (content !== undefined) {
      pushIssue(issues, "invalid_content", `${nodeType} must not include content.`, path);
    }
    return;
  }

  if (
    (nodeType === "paragraph" || nodeType === "heading" || nodeType === "codeBlock") &&
    (!Array.isArray(content) || content.length === 0)
  ) {
    pushIssue(issues, "empty_block", `${nodeType} must include inline content.`, path);
  }

  if (
    (nodeType === "bulletList" || nodeType === "orderedList") &&
    (!Array.isArray(content) || content.length === 0)
  ) {
    pushIssue(issues, "empty_list", `${nodeType} must include list items.`, path);
  }

  content?.forEach((child, index) => {
    const childType = isRecord(child) ? child.type : null;

    if (
      (nodeType === "paragraph" || nodeType === "heading" || nodeType === "codeBlock") &&
      childType !== "text" &&
      childType !== "hardBreak"
    ) {
      pushIssue(issues, "invalid_child", `${nodeType} may only contain inline nodes.`, path);
    }

    if ((nodeType === "bulletList" || nodeType === "orderedList") && childType !== "listItem") {
      pushIssue(issues, "invalid_child", `${nodeType} may only contain listItem nodes.`, path);
    }

    validateNode({
      depth: depth + 1,
      issues,
      node: child,
      path: `${path}.content[${index}]`,
      state,
    });
  });
}

function validateDocumentFamily({
  document,
  documentType,
  issues,
}: {
  document: TiptapDocumentJson;
  documentType: GeneratedDocumentType;
  issues: GeneratedTiptapJsonOutputValidationIssue[];
}) {
  const headings = collectHeadings(document).map(normalizeSearchText);
  const hasHeading = (pattern: RegExp) => headings.some((heading) => pattern.test(heading));

  const familyRules: Record<GeneratedDocumentType, RegExp[]> = {
    dfd: [/\bestudo tecnico preliminar\b/, /\btermo de referencia\b/, /\bminuta\b/, /\bclausula\b/],
    etp: [
      /\bdocumento de formalizacao de demanda\b/,
      /\btermo de referencia\b/,
      /\bminuta\b/,
      /\bclausula\b/,
    ],
    minuta: [
      /\bdocumento de formalizacao de demanda\b/,
      /\bestudo tecnico preliminar\b/,
      /\btermo de referencia\b/,
    ],
    tr: [
      /\bdocumento de formalizacao de demanda\b/,
      /\bestudo tecnico preliminar\b/,
      /\bminuta\b/,
      /\bclausula\b/,
    ],
  };

  for (const pattern of familyRules[documentType]) {
    if (hasHeading(pattern)) {
      pushIssue(
        issues,
        "document_family_mismatch",
        `Generated ${documentType} contains a heading from another document family.`,
        "$",
      );
    }
  }
}

export function validateGeneratedTiptapJsonOutput({
  document,
  expectedDocumentType,
}: {
  document: unknown;
  expectedDocumentType: GeneratedDocumentType;
}): TiptapDocumentJson {
  const issues: GeneratedTiptapJsonOutputValidationIssue[] = [];
  const state = { nodeCount: 0, textLength: 0 };

  validateNode({ depth: 0, issues, node: document, path: "$", state });

  if (state.textLength > maxTextLength) {
    pushIssue(issues, "too_much_text", "Generated document text is too long.", "$");
  }

  if (issues.length === 0) {
    const tiptapDocument = document as TiptapDocumentJson;
    const text = tiptapJsonToDocumentText(tiptapDocument);

    if (!text.trim()) {
      pushIssue(issues, "empty_document", "Generated document must contain text.", "$");
    }

    validateDocumentFamily({
      document: tiptapDocument,
      documentType: expectedDocumentType,
      issues,
    });

    if (issues.length === 0) {
      return tiptapDocument;
    }
  }

  throw new GeneratedTiptapJsonOutputValidationError(issues);
}

export function parseGeneratedTiptapJsonOutputText(
  text: string,
  { expectedDocumentType }: { expectedDocumentType: GeneratedDocumentType },
) {
  let parsed: unknown;

  try {
    parsed = JSON.parse(text);
  } catch {
    throw new GeneratedTiptapJsonOutputValidationError([
      {
        code: "malformed_json",
        message: "Provider response must be a single JSON object.",
        path: "$",
      },
    ]);
  }

  return validateGeneratedTiptapJsonOutput({ document: parsed, expectedDocumentType });
}

function inlineNodeJsonSchema(): Record<string, unknown> {
  return {
    anyOf: [
      {
        type: "object",
        additionalProperties: false,
        required: ["type", "text"],
        properties: {
          type: { const: "text" },
          text: { type: "string", minLength: 1 },
          marks: {
            type: "array",
            maxItems: 8,
            items: {
              type: "object",
              additionalProperties: false,
              required: ["type"],
              properties: {
                type: { enum: Array.from(allowedMarkTypes) },
              },
            },
          },
        },
      },
      {
        type: "object",
        additionalProperties: false,
        required: ["type"],
        properties: {
          type: { const: "hardBreak" },
        },
      },
    ],
  };
}

function attrsJsonSchemas() {
  return {
    headingAttrs: {
      type: "object",
      additionalProperties: false,
      required: ["level"],
      properties: {
        level: { enum: [1, 2, 3] },
        textAlign: { enum: ["left", "center", "right", "justify"] },
      },
    },
    orderedListAttrs: {
      type: "object",
      additionalProperties: false,
      properties: {
        start: { type: "integer", minimum: 1, maximum: 999 },
      },
    },
    paragraphAttrs: {
      type: "object",
      additionalProperties: false,
      properties: {
        indentLevel: { type: "integer", minimum: 0, maximum: 6 },
        noFirstLineIndent: { type: "boolean" },
        signatureClosingPart: { enum: ["date", "name", "role"] },
        textAlign: { enum: ["left", "center", "right", "justify"] },
      },
    },
  };
}

export function createGeneratedTiptapJsonOutputJsonSchema() {
  const inlineNode = inlineNodeJsonSchema();

  return {
    type: "object",
    additionalProperties: false,
    required: ["type", "content"],
    properties: {
      type: { const: "doc" },
      content: {
        type: "array",
        minItems: 1,
        maxItems: 400,
        items: { $ref: "#/$defs/blockNode" },
      },
    },
    $defs: {
      ...attrsJsonSchemas(),
      inlineNode,
      inlineContent: {
        type: "array",
        minItems: 1,
        maxItems: 200,
        items: { $ref: "#/$defs/inlineNode" },
      },
      blockNode: {
        anyOf: [
          {
            type: "object",
            additionalProperties: false,
            required: ["type", "content"],
            properties: {
              type: { const: "paragraph" },
              attrs: { $ref: "#/$defs/paragraphAttrs" },
              content: { $ref: "#/$defs/inlineContent" },
            },
          },
          {
            type: "object",
            additionalProperties: false,
            required: ["type", "attrs", "content"],
            properties: {
              type: { const: "heading" },
              attrs: { $ref: "#/$defs/headingAttrs" },
              content: { $ref: "#/$defs/inlineContent" },
            },
          },
          {
            type: "object",
            additionalProperties: false,
            required: ["type", "content"],
            properties: {
              type: { const: "bulletList" },
              content: {
                type: "array",
                minItems: 1,
                maxItems: 200,
                items: { $ref: "#/$defs/listItem" },
              },
            },
          },
          {
            type: "object",
            additionalProperties: false,
            required: ["type", "content"],
            properties: {
              type: { const: "orderedList" },
              attrs: { $ref: "#/$defs/orderedListAttrs" },
              content: {
                type: "array",
                minItems: 1,
                maxItems: 200,
                items: { $ref: "#/$defs/listItem" },
              },
            },
          },
          {
            type: "object",
            additionalProperties: false,
            required: ["type"],
            properties: {
              type: { const: "horizontalRule" },
            },
          },
          {
            type: "object",
            additionalProperties: false,
            required: ["type", "content"],
            properties: {
              type: { const: "blockquote" },
              content: {
                type: "array",
                minItems: 1,
                maxItems: 80,
                items: { $ref: "#/$defs/blockNode" },
              },
            },
          },
          {
            type: "object",
            additionalProperties: false,
            required: ["type", "content"],
            properties: {
              type: { const: "codeBlock" },
              content: { $ref: "#/$defs/inlineContent" },
            },
          },
        ],
      },
      listItem: {
        type: "object",
        additionalProperties: false,
        required: ["type", "content"],
        properties: {
          type: { const: "listItem" },
          content: {
            type: "array",
            minItems: 1,
            maxItems: 20,
            items: { $ref: "#/$defs/blockNode" },
          },
        },
      },
    },
  };
}

export function buildGeneratedTiptapJsonOutputInstructions(documentType: GeneratedDocumentType) {
  const familyRules: Record<GeneratedDocumentType, string[]> = {
    dfd: [
      'Generate only a DFD ("DOCUMENTO DE FORMALIZACAO DE DEMANDA").',
      "Do not include ETP, TR, Minuta, market-study, risk-matrix, or contractual clause sections.",
    ],
    etp: [
      'Generate only an ETP ("ESTUDO TECNICO PRELIMINAR").',
      "Do not include DFD, TR, Minuta, or contractual clause sections.",
    ],
    minuta: [
      'Generate only a Minuta/contract draft ("MINUTA DE CONTRATO").',
      "Do not include DFD, ETP, TR, market-study, or technical-study sections.",
    ],
    tr: [
      'Generate only a TR ("TERMO DE REFERENCIA").',
      "Do not include DFD, ETP, Minuta, or contractual clause headings outside TR scope.",
    ],
  };

  return [
    "Return only one JSON object matching the constrained Tiptap document format.",
    'The root object must be {"type":"doc","content":[...]}',
    "Do not wrap the JSON in Markdown fences.",
    "Do not return Markdown, HTML, DOCX, OOXML, base64, or LicitaDoc AST.",
    "Allowed nodes: doc, heading, paragraph, text, hardBreak, bulletList, orderedList, listItem, blockquote, codeBlock, horizontalRule.",
    "Allowed marks: bold, italic, strike, code, underline. Do not include mark attrs.",
    "Allowed heading attrs: level 1, 2, or 3, and optional textAlign.",
    "Allowed paragraph attrs: indentLevel, noFirstLineIndent, signatureClosingPart, and textAlign.",
    "Use placeholders as plain paragraph text when required facts are unknown; never invent facts.",
    ...familyRules[documentType],
  ].join("\n");
}

export function buildGeneratedTiptapJsonOutputPrompt({
  documentType,
  sourcePrompt,
  validationError,
}: {
  documentType: GeneratedDocumentType;
  sourcePrompt: string;
  validationError?: GeneratedTiptapJsonOutputValidationError;
}) {
  return [
    "Voce e o gerador direto de JSON Tiptap do LicitaDoc.",
    "Produza o documento final diretamente no formato JSON Tiptap restrito, preservando apenas fatos suportados pelo contexto.",
    "Se instrucoes antigas mencionarem Markdown, ignore-as apenas quanto ao formato de saida: a saida final obrigatoria e JSON Tiptap.",
    validationError
      ? "A tentativa anterior falhou na validacao. Corrija apenas o JSON Tiptap conforme os erros informados."
      : null,
    "",
    "## Contrato de saida",
    buildGeneratedTiptapJsonOutputInstructions(documentType),
    "",
    "## Erros de validacao anteriores",
    validationError ? JSON.stringify(validationError.issues, null, 2) : "[]",
    "",
    "## Contexto e instrucoes documentais",
    sourcePrompt,
  ]
    .filter((part): part is string => typeof part === "string")
    .join("\n");
}
