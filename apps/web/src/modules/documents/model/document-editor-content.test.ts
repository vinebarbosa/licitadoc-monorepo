import { describe, expect, it } from "vitest";
import {
  documentMarkdownToEditorHtml,
  editorHtmlToDocumentMarkdown,
  getDocumentContentHash,
} from "./document-editor-content";

describe("document editor content adapter", () => {
  it("converts procurement Markdown into editor HTML", () => {
    const html = documentMarkdownToEditorHtml(
      [
        "# Documento",
        "",
        "Texto com **negrito**, *italico* e [referencia](https://example.com).",
        "",
        "- Item um",
        "- Item dois",
        "",
        "> Observacao institucional.",
      ].join("\n"),
    );

    expect(html).toContain("<h1>Documento</h1>");
    expect(html).toContain("<strong>negrito</strong>");
    expect(html).toContain("<em>italico</em>");
    expect(html).toContain('<a href="https://example.com">referencia</a>');
    expect(html).toContain("<li>Item um</li>");
    expect(html).toContain("<blockquote>");
  });

  it("normalizes plain generated institutional text before opening the editor", () => {
    const html = documentMarkdownToEditorHtml(
      [
        "DOCUMENTO DE FORMALIZAÇÃO DE DEMANDA (DFD)",
        "1. DADOS DA SOLICITAÇÃO",
        "Unidade Orçamentária: 06.001 - Secretaria Municipal de Educação - Número da Solicitação: não informado - Data de Emissão: 07/05/2026 - Processo Vinculado: PE-2026-01 - Responsável: Vinícius Barbosa",
        "2. CONTEXTO E NECESSIDADE DA DEMANDA",
        "A realização do Carnaval constitui evento de relevância institucional.",
      ].join("\n"),
    );

    expect(html).toContain("<h1>DOCUMENTO DE FORMALIZAÇÃO DE DEMANDA (DFD)</h1>");
    expect(html).toContain("<h2>1. DADOS DA SOLICITAÇÃO</h2>");
    expect(html).toContain("<strong>Unidade Orçamentária:</strong>");
    expect(html).toContain("<strong>Número da Solicitação:</strong>");
    expect(html).toContain("<h2>2. CONTEXTO E NECESSIDADE DA DEMANDA</h2>");
    expect(html).toContain("<p>A realização do Carnaval constitui evento");
  });

  it("recovers sections when generated text arrives as one wrapped line", () => {
    const html = documentMarkdownToEditorHtml(
      "DOCUMENTO DE FORMALIZAÇÃO DE DEMANDA (DFD) 1. DADOS DA SOLICITAÇÃO Unidade Orçamentária: 06.001 - Secretaria Municipal de Educação - Responsável: Vinícius Barbosa 2. CONTEXTO E NECESSIDADE DA DEMANDA Texto institucional revisável.",
    );

    expect(html).toContain("<h1>DOCUMENTO DE FORMALIZAÇÃO DE DEMANDA (DFD)</h1>");
    expect(html).toContain("<h2>1. DADOS DA SOLICITAÇÃO</h2>");
    expect(html).toContain("<strong>Responsável:</strong>");
    expect(html).toContain("<h2>2. CONTEXTO E NECESSIDADE DA DEMANDA</h2>");
  });

  it("serializes editor HTML back to canonical Markdown-like content", () => {
    const markdown = editorHtmlToDocumentMarkdown(
      [
        "<h1>Documento</h1>",
        '<p>Texto com <strong>negrito</strong>, <em>italico</em> e <a href="https://example.com">referencia</a>.</p>',
        "<ol><li>Primeiro</li><li>Segundo</li></ol>",
        "<blockquote><p>Observacao institucional.</p></blockquote>",
      ].join(""),
    );

    expect(markdown).toContain("# Documento");
    expect(markdown).toContain("**negrito**");
    expect(markdown).toContain("_italico_");
    expect(markdown).toContain("[referencia](https://example.com)");
    expect(markdown).toContain("1. Primeiro");
    expect(markdown).toContain("> Observacao institucional.");
  });

  it("handles empty content and stable SHA-256 hashes", async () => {
    expect(documentMarkdownToEditorHtml("   ")).toBe("");
    expect(editorHtmlToDocumentMarkdown("")).toBe("");
    await expect(getDocumentContentHash("Conteudo atual.")).resolves.toBe(
      "sha256:e6213a8154f4c82e7bb909407fde5aeb2ee66869b9b5d324626c07344013e1c6",
    );
  });
});
