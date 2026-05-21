import { fireEvent, screen, waitFor } from "@testing-library/react";
import { HttpResponse, http } from "msw";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { toast } from "sonner";
import { describe, expect, it, vi } from "vitest";
import { AppSidebar } from "@/modules/app-shell/components/app-sidebar";
import { DocumentsPage } from "@/modules/documents";
import { SidebarProvider } from "@/shared/ui/sidebar";
import { documentsListResponse } from "@/test/msw/fixtures";
import { server } from "@/test/msw/server";
import { renderWithProviders } from "@/test/render";

vi.mock("sonner", () => ({ toast: { info: vi.fn(), success: vi.fn(), error: vi.fn() } }));

const authSessionMock = vi.hoisted(() => ({
  role: "admin" as "admin" | "organization_owner" | "member" | null,
  session: {
    user: {
      id: "admin-1",
      name: "Maria Silva",
      email: "maria@licitadoc.test",
      organizationId: null as string | null,
    },
  },
}));

vi.mock("@/modules/auth", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/modules/auth")>();

  return {
    ...actual,
    useAuthSession: () => authSessionMock,
    useSignOut: () => ({
      isPending: false,
      mutateAsync: vi.fn(),
    }),
  };
});

function LocationProbe() {
  const location = useLocation();

  return <div data-testid="location">{`${location.pathname}${location.search}`}</div>;
}

function openSelect(trigger: HTMLElement) {
  fireEvent.pointerDown(trigger, { button: 0, ctrlKey: false, pointerType: "mouse" });
}

function renderDocumentsPage(initialEntry = "/app/documentos") {
  return renderWithProviders(
    <MemoryRouter initialEntries={[initialEntry]}>
      <LocationProbe />
      <Routes>
        <Route path="/app/documentos" element={<DocumentsPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

function renderDocumentsPageWithSidebar(initialEntry = "/app/documentos") {
  return renderWithProviders(
    <MemoryRouter initialEntries={[initialEntry]}>
      <SidebarProvider>
        <AppSidebar />
        <LocationProbe />
        <Routes>
          <Route path="/app/documentos" element={<DocumentsPage />} />
        </Routes>
      </SidebarProvider>
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

    renderDocumentsPage("/app/documentos?tipo=tr");

    await waitFor(() => {
      expect(screen.getByText("Nenhum documento encontrado")).toBeInTheDocument();
    });

    expect(screen.getAllByRole("combobox")[0]).toHaveTextContent("TR");
    expect(screen.queryByRole("link", { name: "DFD - PE-2024-045" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "ETP - PE-2024-045" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Minuta - PE-2024-043" })).not.toBeInTheDocument();
  });

  it("updates URL and rows when page filters change", async () => {
    server.use(
      http.get("http://localhost:3333/api/documents/", () =>
        HttpResponse.json(documentsListResponse),
      ),
    );

    renderDocumentsPage();

    expect(await screen.findByRole("link", { name: "DFD - PE-2024-045" })).toBeInTheDocument();

    openSelect(screen.getAllByRole("combobox")[0]);
    fireEvent.click(await screen.findByRole("option", { name: "ETP" }));

    await waitFor(() => {
      expect(screen.getByTestId("location")).toHaveTextContent("/app/documentos?tipo=etp");
    });
    expect(screen.getByRole("link", { name: "ETP - PE-2024-045" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "DFD - PE-2024-045" })).not.toBeInTheDocument();

    openSelect(screen.getAllByRole("combobox")[1]);
    fireEvent.click(await screen.findByRole("option", { name: "Em edição" }));

    await waitFor(() => {
      expect(screen.getByTestId("location")).toHaveTextContent(
        "/app/documentos?tipo=etp&status=em_edicao",
      );
    });

    fireEvent.change(screen.getByRole("textbox", { name: "Buscar documentos" }), {
      target: { value: "PE-2024-045" },
    });

    await waitFor(() => {
      expect(screen.getByTestId("location")).toHaveTextContent(
        "/app/documentos?search=PE-2024-045&tipo=etp&status=em_edicao",
      );
    });
  });

  it("falls back to default filters for invalid query values", async () => {
    server.use(
      http.get("http://localhost:3333/api/documents/", () =>
        HttpResponse.json(documentsListResponse),
      ),
    );

    renderDocumentsPage("/app/documentos?tipo=invalido&status=invalido");

    expect(await screen.findByRole("link", { name: "DFD - PE-2024-045" })).toBeInTheDocument();
    expect(screen.getAllByRole("combobox")[0]).toHaveTextContent("Todos");
    expect(screen.getAllByRole("combobox")[1]).toHaveTextContent("Todos");
  });

  it("reacts to sidebar document type links while the documents page is mounted", async () => {
    server.use(
      http.get("http://localhost:3333/api/documents/", () =>
        HttpResponse.json(documentsListResponse),
      ),
    );

    renderDocumentsPageWithSidebar("/app/documentos?tipo=tr");

    await waitFor(() => {
      expect(screen.getByText("Nenhum documento encontrado")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("link", { name: "ETP" }));

    await waitFor(() => {
      expect(screen.getByTestId("location")).toHaveTextContent("/app/documentos?tipo=etp");
    });
    expect(screen.getAllByRole("combobox")[0]).toHaveTextContent("ETP");
    expect(screen.getByRole("link", { name: "ETP - PE-2024-045" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "DFD - PE-2024-045" })).not.toBeInTheDocument();
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
