import { screen } from "@testing-library/react";
import { HttpResponse, http } from "msw";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { DocumentEditPage } from "@/modules/documents";
import { server } from "@/test/msw/server";
import { renderWithProviders } from "@/test/render";

function renderDocumentEditPage(initialEntry = "/app/documento/document-1") {
  return renderWithProviders(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/app/documento/:documentId" element={<DocumentEditPage />} />
        <Route path="/app/documento/:documentId/preview" element={<div>Preview</div>} />
        <Route path="/app/documentos" element={<div>Documentos</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("DocumentEditPage", () => {
  it("loads completed document JSON into the validated editor UI", async () => {
    const { container } = renderDocumentEditPage();

    expect(
      await screen.findByRole("heading", { name: "Formalização de Demanda - PE-2024-045" }),
    ).toBeInTheDocument();
    expect(container.querySelector("[data-document-editor-workspace]")).toBeInTheDocument();
    expect(await screen.findByLabelText("Editor demo de documento")).toHaveTextContent(
      "Contratacao de Servicos de TI",
    );
    expect(screen.getByRole("button", { name: "Salvar" })).toBeDisabled();
    expect(screen.getByRole("link", { name: /Preview/i })).toHaveAttribute(
      "href",
      "/app/documento/document-1/preview",
    );
    expect(screen.getByText("Salvo")).toBeInTheDocument();
  });

  it("surfaces non-editable lifecycle states", async () => {
    renderDocumentEditPage("/app/documento/document-2");
    expect(await screen.findByText("Documento em geração")).toBeInTheDocument();
    expect(screen.queryByLabelText("Editor demo de documento")).not.toBeInTheDocument();

    renderDocumentEditPage("/app/documento/document-3");
    expect(await screen.findByText("Geração do documento falhou")).toBeInTheDocument();

    renderDocumentEditPage("/app/documento/document-empty");
    expect(await screen.findByText("Documento sem conteúdo")).toBeInTheDocument();
  });

  it("shows unavailable and retryable detail states", async () => {
    server.use(
      http.get("http://localhost:3333/api/documents/:documentId", ({ params }) => {
        if (params.documentId === "document-404") {
          return HttpResponse.json(
            { error: "not_found", message: "Documento não encontrado.", details: null },
            { status: 404 },
          );
        }

        return HttpResponse.json(
          { error: "internal_server_error", message: "Falha.", details: null },
          { status: 500 },
        );
      }),
    );

    renderDocumentEditPage("/app/documento/document-404");
    expect(await screen.findByText("Documento não encontrado")).toBeInTheDocument();

    renderDocumentEditPage("/app/documento/document-500");
    expect(await screen.findByText("Não foi possível carregar o documento")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Tentar novamente" })).toBeInTheDocument();
  });
});
