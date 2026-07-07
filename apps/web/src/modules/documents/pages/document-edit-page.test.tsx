import { fireEvent, screen, waitFor } from "@testing-library/react";
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

    expect(await screen.findByRole("heading", { name: "DFD - PE-2024-045" })).toBeInTheDocument();
    expect(container.querySelector("[data-document-editor-workspace]")).toBeInTheDocument();
    expect(await screen.findByLabelText("Editor do documento")).toHaveTextContent(
      "Contratacao de Servicos de TI",
    );
    expect(container.querySelector(".document-pagination-surface")).not.toBeInTheDocument();
    expect(container.querySelector("[data-document-pagination-content]")).not.toBeInTheDocument();
    expect(screen.getByRole("toolbar", { name: "Ferramentas de formatação" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Salvar" })).toBeDisabled();
    expect(screen.getByRole("link", { name: /Preview/i })).toHaveAttribute(
      "href",
      "/app/documento/document-1/preview",
    );
    expect(screen.getByText("Salvo")).toBeInTheDocument();
    expect(screen.queryByLabelText("Editor demo de documento")).not.toBeInTheDocument();
    expect(
      screen.queryByPlaceholderText("Diga à IA o que precisa mudar neste trecho..."),
    ).toBeNull();
    expect(screen.queryByText("IA revisando")).not.toBeInTheDocument();
  });

  it("applies header formatting commands and enables saving", async () => {
    renderDocumentEditPage();

    expect(await screen.findByLabelText("Editor do documento")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Salvar" })).toBeDisabled();

    fireEvent.click(screen.getByRole("button", { name: "Centralizar" }));

    await waitFor(() => expect(screen.getByRole("button", { name: "Salvar" })).toBeEnabled());
    expect(screen.getByText("Alterações não salvas")).toBeInTheDocument();
  });

  it("surfaces non-editable lifecycle states", async () => {
    renderDocumentEditPage("/app/documento/document-2");
    expect(await screen.findByText("Documento em geração")).toBeInTheDocument();
    expect(screen.queryByLabelText("Editor do documento")).not.toBeInTheDocument();

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
