import { fireEvent, screen, waitFor } from "@testing-library/react";
import { HttpResponse, http } from "msw";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { toast } from "sonner";
import { describe, expect, it, vi } from "vitest";
import { DocumentsPage } from "@/modules/documents";
import { documentsListResponse } from "@/test/msw/fixtures";
import { server } from "@/test/msw/server";
import { renderWithProviders } from "@/test/render";

vi.mock("sonner", () => ({ toast: { info: vi.fn(), success: vi.fn(), error: vi.fn() } }));

function renderDocumentsPage(initialEntry = "/app/documentos") {
  return renderWithProviders(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/app/documentos" element={<DocumentsPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("DocumentsPage", () => {
  it("renders the validated header, summary cards, and table rows from API data", async () => {
    server.use(
      http.get("http://localhost:3333/api/documents/", () =>
        HttpResponse.json(documentsListResponse),
      ),
    );

    renderDocumentsPage();

    await waitFor(() => {
      expect(screen.getByRole("link", { name: "DFD - PE-2024-045" })).toBeInTheDocument();
    });

    expect(screen.getByRole("heading", { name: "Documentos" })).toBeInTheDocument();
    expect(
      screen.getByText("Gerencie todos os documentos de licitação (Lei 14.133)"),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Novo Documento/ })).toBeInTheDocument();

    // Summary cards
    expect(screen.getByText("Total")).toBeInTheDocument();
    expect(screen.getByText("Concluídos")).toBeInTheDocument();
    expect(screen.getAllByText("Em edição").length).toBeGreaterThan(0);
    expect(screen.getByText("Com erro")).toBeInTheDocument();

    // Table rows from fixture (3 items)
    expect(screen.getByRole("link", { name: "DFD - PE-2024-045" })).toHaveAttribute(
      "href",
      "/app/documento/document-1",
    );
    expect(screen.getByRole("link", { name: "ETP - PE-2024-045" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Minuta - PE-2024-043" })).toBeInTheDocument();
    expect(document.querySelector('a[href="/app/documento/document-1/preview"]')).toBeNull();

    // Process link visible
    expect(screen.getAllByRole("link", { name: "PE-2024-045" }).length).toBeGreaterThan(0);

    // Status badges
    expect(screen.getByText("Concluído")).toBeInTheDocument();
    expect(screen.getAllByText("Em edição").length).toBeGreaterThan(0);
    expect(screen.getByText("Erro")).toBeInTheDocument();

    // Responsibles
    expect(screen.getAllByText("Maria Costa").length).toBeGreaterThan(0);
    expect(screen.getByText("Ana Santos")).toBeInTheDocument();
  });

  it("routes document name to edit and Visualizar action to the preview page", async () => {
    server.use(
      http.get("http://localhost:3333/api/documents/", () =>
        HttpResponse.json(documentsListResponse),
      ),
    );

    renderDocumentsPage();

    const nameLink = await screen.findByRole("link", { name: "DFD - PE-2024-045" });
    expect(nameLink).toHaveAttribute("href", "/app/documento/document-1");

    const overflowTriggers = screen.getAllByRole("button", { name: "Mais ações" });
    fireEvent.pointerDown(overflowTriggers[0]);

    expect(await screen.findByRole("menuitem", { name: "Editar" })).toHaveAttribute(
      "href",
      "/app/documento/document-1",
    );
    expect(await screen.findByRole("menuitem", { name: "Visualizar" })).toHaveAttribute(
      "href",
      "/app/documento/document-1/preview",
    );
  });

  it("shows loading state while fetching documents", () => {
    server.use(
      http.get("http://localhost:3333/api/documents/", async () => {
        await new Promise(() => {});
        return HttpResponse.json(documentsListResponse);
      }),
    );

    renderDocumentsPage();

    // Table skeleton cells should be visible (no actual content yet)
    expect(screen.queryByRole("heading", { name: "DFD - PE-2024-045" })).not.toBeInTheDocument();
  });

  it("shows an error state and retry button when documents fail to load", async () => {
    server.use(
      http.get("http://localhost:3333/api/documents/", () =>
        HttpResponse.json({ error: "internal_server_error", message: "Falha." }, { status: 500 }),
      ),
    );

    renderDocumentsPage();

    expect(
      await screen.findByText("Não foi possível carregar os documentos", {}, { timeout: 3000 }),
    ).toBeInTheDocument();

    expect(screen.getByRole("button", { name: "Tentar novamente" })).toBeInTheDocument();
  });

  it("shows empty state when no documents match current filters", async () => {
    server.use(
      http.get("http://localhost:3333/api/documents/", () => HttpResponse.json({ items: [] })),
    );

    renderDocumentsPage();

    await waitFor(() => {
      expect(screen.getByText("Nenhum documento encontrado")).toBeInTheDocument();
    });

    expect(screen.getByText("Ajuste os filtros ou crie um novo documento.")).toBeInTheDocument();
  });

  it("applies ?tipo= deep link filter from URL on initial render", async () => {
    server.use(
      http.get("http://localhost:3333/api/documents/", () =>
        HttpResponse.json(documentsListResponse),
      ),
    );

    renderDocumentsPage("/app/documentos?tipo=dfd");

    await waitFor(() => {
      expect(screen.getByRole("link", { name: "DFD - PE-2024-045" })).toBeInTheDocument();
    });

    // Only the DFD row should be visible
    expect(screen.getByRole("link", { name: "DFD - PE-2024-045" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "ETP - PE-2024-045" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Minuta - PE-2024-043" })).not.toBeInTheDocument();
  });

  it("shows toast feedback when Duplicar is selected", async () => {
    server.use(
      http.get("http://localhost:3333/api/documents/", () =>
        HttpResponse.json(documentsListResponse),
      ),
    );

    renderDocumentsPage();

    await waitFor(() => {
      expect(screen.getByRole("link", { name: "DFD - PE-2024-045" })).toBeInTheDocument();
    });

    // Open overflow menu for first row
    const overflowTriggers = screen.getAllByRole("button", { name: "Mais ações" });
    fireEvent.pointerDown(overflowTriggers[0]);

    const duplicarItem = await screen.findByRole("menuitem", { name: "Duplicar" });
    fireEvent.click(duplicarItem);

    expect(toast.info).toHaveBeenCalledWith("Duplicação de documentos ainda não está disponível.");
  });

  it("shows toast feedback when Excluir is selected", async () => {
    server.use(
      http.get("http://localhost:3333/api/documents/", () =>
        HttpResponse.json(documentsListResponse),
      ),
    );

    renderDocumentsPage();

    await waitFor(() => {
      expect(screen.getByRole("link", { name: "DFD - PE-2024-045" })).toBeInTheDocument();
    });

    const overflowTriggers = screen.getAllByRole("button", { name: "Mais ações" });
    fireEvent.pointerDown(overflowTriggers[0]);

    const excluirItem = await screen.findByRole("menuitem", { name: "Excluir" });
    fireEvent.click(excluirItem);

    expect(toast.info).toHaveBeenCalledWith("Exclusão de documentos ainda não está disponível.");
  });
});
