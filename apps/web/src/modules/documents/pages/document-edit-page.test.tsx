import { fireEvent, screen, waitFor } from "@testing-library/react";
import { HttpResponse, http } from "msw";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { DocumentEditPage } from "@/modules/documents";
import { documentDetailResponse } from "@/test/msw/fixtures";
import { server } from "@/test/msw/server";
import { renderWithProviders } from "@/test/render";

function renderDocumentEditPage(initialEntry = "/app/documento/document-1") {
  return renderWithProviders(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/app/documento/:documentId" element={<DocumentEditPage />} />
        <Route path="/app/documentos" element={<div>Documentos</div>} />
        <Route path="/app/processo/:processId" element={<div>Processo vinculado</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("DocumentEditPage", () => {
  it("loads a completed document into the institutional editor", async () => {
    const { container } = renderDocumentEditPage();

    expect(await screen.findByRole("heading", { name: "DFD - PE-2024-045" })).toBeInTheDocument();
    expect(container.querySelector("[data-document-editor-workspace]")).toBeInTheDocument();
    expect(container.querySelector("[data-document-editor-topbar]")).toBeInTheDocument();
    expect(container.querySelector("[data-document-editor-metadata]")).toHaveTextContent(
      "Formalização de Demanda",
    );
    expect(screen.getByRole("link", { name: "Preview" })).toHaveAttribute(
      "href",
      "/app/documento/document-1/preview",
    );
    await waitFor(() => expect(screen.getByRole("button", { name: "Salvar" })).toBeDisabled());
    expect(screen.getByText("Salvo")).toBeInTheDocument();
    expect(await screen.findByLabelText("Editor do documento")).toHaveTextContent(
      "Contratacao de Servicos de TI",
    );
    expect(screen.getByRole("toolbar", { name: "Ferramentas do editor" })).toBeInTheDocument();
    expect(screen.getByText("Formalização de Demanda")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "PE-2024-045" })).toHaveAttribute(
      "href",
      "/app/processo/process-1",
    );
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

  it("exposes formatting controls and save shortcut", async () => {
    const shortcutSpy = vi.spyOn(window, "addEventListener");

    renderDocumentEditPage();

    expect(await screen.findByLabelText("Editor do documento")).toBeInTheDocument();
    for (const label of [
      "Parágrafo",
      "Título 1",
      "Título 2",
      "Negrito",
      "Itálico",
      "Sublinhado",
      "Lista com marcadores",
      "Lista numerada",
      "Citação",
      "Link",
      "Desfazer",
      "Refazer",
    ]) {
      expect(screen.getByRole("button", { name: label })).toBeInTheDocument();
    }

    expect(shortcutSpy).toHaveBeenCalledWith("keydown", expect.any(Function));
    shortcutSpy.mockRestore();
  });

  it("keeps edited work visible when save conflicts", async () => {
    server.use(
      http.patch("http://localhost:3333/api/documents/:documentId", () =>
        HttpResponse.json(
          {
            error: "conflict",
            message: "Document content changed before this save completed.",
            details: null,
          },
          { status: 409 },
        ),
      ),
    );

    renderDocumentEditPage();

    const editor = await screen.findByLabelText("Editor do documento");
    editor.innerHTML = "<p>Texto revisado no editor.</p>";
    fireEvent.input(editor);

    await waitFor(() => expect(screen.getByText("Alterações não salvas")).toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: "Salvar" }));

    expect(await screen.findByText("Conteúdo alterado")).toBeInTheDocument();
    expect(editor).toHaveTextContent("Texto revisado no editor.");
  });

  it("saves edited content and clears dirty state", async () => {
    let receivedBody: { draftContent?: string; sourceContentHash?: string } | null = null;

    server.use(
      http.patch("http://localhost:3333/api/documents/:documentId", async ({ request }) => {
        receivedBody = (await request.json()) as typeof receivedBody;

        return HttpResponse.json({
          ...documentDetailResponse,
          draftContent: receivedBody?.draftContent,
          updatedAt: "2024-04-01T00:00:00.000Z",
        });
      }),
    );

    renderDocumentEditPage();

    const editor = await screen.findByLabelText("Editor do documento");
    editor.innerHTML = "<p>Texto salvo pelo editor.</p>";
    fireEvent.input(editor);

    await waitFor(() => expect(screen.getByText("Alterações não salvas")).toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: "Salvar" }));

    await waitFor(() => expect(screen.getByText("Salvo")).toBeInTheDocument());
    expect(receivedBody).not.toBeNull();
    const savedBody = receivedBody as unknown as {
      draftContent: string;
      sourceContentHash: string;
    };
    expect(savedBody.draftContent).toContain("Texto salvo pelo editor.");
    expect(savedBody.sourceContentHash).toMatch(/^sha256:/);
  });
});
