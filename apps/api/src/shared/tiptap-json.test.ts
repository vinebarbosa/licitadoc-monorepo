import assert from "node:assert/strict";
import { test } from "vitest";
import { documentTextToTiptapJson, tiptapJsonToDocumentText } from "./tiptap-json";

function getNodeText(node: unknown): string {
  if (!node || typeof node !== "object") {
    return "";
  }

  const record = node as { content?: unknown[]; text?: unknown };

  if (typeof record.text === "string") {
    return record.text;
  }

  return (record.content ?? []).map(getNodeText).join("");
}

function getParagraphByText(content: unknown, text: string) {
  const doc = content as { content?: Array<{ attrs?: Record<string, unknown>; type?: string }> };
  const paragraph = (doc.content ?? []).find(
    (node) => node.type === "paragraph" && getNodeText(node).trim() === text,
  );

  assert.ok(paragraph, `Expected paragraph with text: ${text}`);

  return paragraph;
}

test("documentTextToTiptapJson aligns canonical signature closing block", () => {
  const content = documentTextToTiptapJson(`# DOCUMENTO DE FORMALIZACAO DE DEMANDA (DFD)

## 5. REQUISITOS ESSENCIAIS

Conteudo administrativo.

Fortaleza/CE, 08 de janeiro de 2026.

Ana Souza

Secretaria Municipal`);

  assert.deepEqual(getParagraphByText(content, "Fortaleza/CE, 08 de janeiro de 2026.").attrs, {
    noFirstLineIndent: true,
    signatureClosingPart: "date",
    textAlign: "right",
  });
  assert.deepEqual(getParagraphByText(content, "Ana Souza").attrs, {
    noFirstLineIndent: true,
    signatureClosingPart: "name",
    textAlign: "center",
  });
  assert.deepEqual(getParagraphByText(content, "Secretaria Municipal").attrs, {
    noFirstLineIndent: true,
    signatureClosingPart: "role",
    textAlign: "center",
  });
  assert.match(tiptapJsonToDocumentText(content), /Fortaleza\/CE, 08 de janeiro de 2026\./);
  assert.doesNotMatch(tiptapJsonToDocumentText(content), /_{8,}/);
});
