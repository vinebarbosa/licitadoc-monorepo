import assert from "node:assert/strict";
import { test } from "vitest";
import {
  createGeneratedTiptapJsonOutputJsonSchema,
  GeneratedTiptapJsonOutputValidationError,
  parseGeneratedTiptapJsonOutputText,
  validateGeneratedTiptapJsonOutput,
} from "./generated-tiptap-json-output";
import {
  invalidGeneratedTiptapHtmlFixture,
  invalidGeneratedTiptapWrongFamilyFixture,
  validGeneratedTiptapDfdFixture,
  validGeneratedTiptapEtpFixture,
  validGeneratedTiptapMinutaFixture,
  validGeneratedTiptapTrFixture,
} from "./generated-tiptap-json-output.fixtures";
import { tiptapJsonToDocumentText } from "./tiptap-json";

test("validateGeneratedTiptapJsonOutput accepts valid generated fixtures", () => {
  assert.equal(
    validateGeneratedTiptapJsonOutput({
      document: validGeneratedTiptapDfdFixture,
      expectedDocumentType: "dfd",
    }).type,
    "doc",
  );
  assert.equal(
    validateGeneratedTiptapJsonOutput({
      document: validGeneratedTiptapEtpFixture,
      expectedDocumentType: "etp",
    }).type,
    "doc",
  );
  assert.equal(
    validateGeneratedTiptapJsonOutput({
      document: validGeneratedTiptapTrFixture,
      expectedDocumentType: "tr",
    }).type,
    "doc",
  );
  assert.equal(
    validateGeneratedTiptapJsonOutput({
      document: validGeneratedTiptapMinutaFixture,
      expectedDocumentType: "minuta",
    }).type,
    "doc",
  );
});

test("validateGeneratedTiptapJsonOutput rejects unsafe or unsupported content", () => {
  assert.throws(
    () =>
      validateGeneratedTiptapJsonOutput({
        document: invalidGeneratedTiptapHtmlFixture,
        expectedDocumentType: "dfd",
      }),
    (error: unknown) =>
      error instanceof GeneratedTiptapJsonOutputValidationError &&
      error.issues.some((issue) => issue.code === "raw_html"),
  );

  assert.throws(
    () =>
      validateGeneratedTiptapJsonOutput({
        document: {
          type: "doc",
          content: [
            {
              type: "paragraph",
              attrs: { class: "external" },
              content: [{ type: "text", text: "Conteudo" }],
            },
          ],
        },
        expectedDocumentType: "dfd",
      }),
    (error: unknown) =>
      error instanceof GeneratedTiptapJsonOutputValidationError &&
      error.issues.some((issue) => issue.code === "unsupported_attrs"),
  );
});

test("validateGeneratedTiptapJsonOutput rejects document family mismatches", () => {
  assert.throws(
    () =>
      validateGeneratedTiptapJsonOutput({
        document: invalidGeneratedTiptapWrongFamilyFixture,
        expectedDocumentType: "dfd",
      }),
    (error: unknown) =>
      error instanceof GeneratedTiptapJsonOutputValidationError &&
      error.issues.some((issue) => issue.code === "document_family_mismatch"),
  );
});

test("parseGeneratedTiptapJsonOutputText requires a single JSON object", () => {
  assert.throws(
    () =>
      parseGeneratedTiptapJsonOutputText(
        `\`\`\`json\n${JSON.stringify(validGeneratedTiptapDfdFixture)}\n\`\`\``,
        {
          expectedDocumentType: "dfd",
        },
      ),
    (error: unknown) =>
      error instanceof GeneratedTiptapJsonOutputValidationError &&
      error.issues.some((issue) => issue.code === "malformed_json"),
  );
});

test("generated Tiptap JSON projects deterministically to compatibility text", () => {
  const text = tiptapJsonToDocumentText(validGeneratedTiptapDfdFixture);

  assert.match(text, /DOCUMENTO DE FORMALIZACAO DE DEMANDA/);
  assert.match(text, /Contratacao de servicos continuados/);
  assert.equal(text, tiptapJsonToDocumentText(validGeneratedTiptapDfdFixture));
});

test("createGeneratedTiptapJsonOutputJsonSchema describes a doc root", () => {
  const schema = createGeneratedTiptapJsonOutputJsonSchema() as {
    properties?: { type?: { const?: string } };
  };

  assert.equal(schema.properties?.type?.const, "doc");
});
