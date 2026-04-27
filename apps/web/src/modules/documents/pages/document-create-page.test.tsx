import { fireEvent, screen, waitFor } from "@testing-library/react";
import { HttpResponse, http } from "msw";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DocumentCreatePage } from "@/modules/documents";
import { documentCreateResponse, processesListResponse } from "@/test/msw/fixtures";
import { server } from "@/test/msw/server";
import { renderWithProviders } from "@/test/render";

vi.mock("sonner", () => ({ toast: { info: vi.fn(), success: vi.fn(), error: vi.fn() } }));

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async (importActual) => {
  const actual = await importActual<typeof import("react-router-dom")>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

beforeEach(() => {
  mockNavigate.mockClear();
  vi.mocked(toast.success).mockClear();
  vi.mocked(toast.error).mockClear();
});

function renderDocumentCreatePage(initialEntry = "/app/documento/novo") {
  return renderWithProviders(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/app/documento/novo" element={<DocumentCreatePage />} />
        <Route path="/app/documentos" element={<div>Documentos</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("DocumentCreatePage", () => {
  describe("4.1 – Validated UI and deep links", () => {
    it("renders the heading, all four type cards, and the process selector", async () => {
      renderDocumentCreatePage();

      expect(screen.getByRole("heading", { name: "Novo Documento" })).toBeInTheDocument();
      expect(
        screen.getByText("Selecione o tipo de documento que deseja criar"),
      ).toBeInTheDocument();

      expect(screen.getByText("DFD")).toBeInTheDocument();
      expect(screen.getByText("ETP")).toBeInTheDocument();
      expect(screen.getByText("TR")).toBeInTheDocument();
      expect(screen.getByText("Minuta")).toBeInTheDocument();

      expect(screen.getByRole("combobox")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Criar e Editar/i })).toBeInTheDocument();
    });

    it("preselects the DFD card when ?tipo=dfd is in the URL", async () => {
      renderDocumentCreatePage("/app/documento/novo?tipo=dfd");

      // The DFD card should show the "Selecionado" badge
      await waitFor(() => {
        expect(screen.getByText("Selecionado")).toBeInTheDocument();
      });

      // Confirm it's in the DFD context
      const dfdCard = screen.getByRole("button", { name: "Selecionar DFD" });
      expect(dfdCard).toHaveTextContent("Selecionado");
    });

    it("ignores an invalid ?tipo= value and leaves all cards unselected", () => {
      renderDocumentCreatePage("/app/documento/novo?tipo=invalido");

      expect(screen.queryByText("Selecionado")).not.toBeInTheDocument();
    });

    it("preselects the process from ?processo= once the list loads", async () => {
      server.use(
        http.get("http://localhost:3333/api/processes/", () =>
          HttpResponse.json(processesListResponse),
        ),
      );

      renderDocumentCreatePage("/app/documento/novo?processo=process-1");

      await waitFor(() => {
        const combobox = screen.getByRole("combobox");
        expect(combobox).toHaveTextContent(/PE-2024-045/);
      });
    });
  });

  describe("4.2 – Name suggestion, submission, and error", () => {
    it("generates the suggested name when type and process are both selected", async () => {
      server.use(
        http.get("http://localhost:3333/api/processes/", () =>
          HttpResponse.json(processesListResponse),
        ),
      );

      renderDocumentCreatePage();

      // Wait for processes to load
      await waitFor(() => {
        expect(screen.queryByText(/Carregando processos/)).not.toBeInTheDocument();
      });

      // Select DFD card
      fireEvent.click(screen.getByRole("button", { name: "Selecionar DFD" }));

      // Open select and choose process
      fireEvent.click(screen.getByRole("combobox"));
      const option = await screen.findByRole("option", { name: /PE-2024-045/ });
      fireEvent.click(option);

      // Name field should now have the suggested value
      const nameInput = screen.getByLabelText("Nome do Documento");
      expect((nameInput as HTMLInputElement).value).toBe("DFD - PE-2024-045");
    });

    it("allows overriding the suggested name", async () => {
      server.use(
        http.get("http://localhost:3333/api/processes/", () =>
          HttpResponse.json(processesListResponse),
        ),
      );

      renderDocumentCreatePage();

      await waitFor(() => {
        expect(screen.queryByText(/Carregando processos/)).not.toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole("button", { name: "Selecionar DFD" }));
      fireEvent.click(screen.getByRole("combobox"));
      const option = await screen.findByRole("option", { name: /PE-2024-045/ });
      fireEvent.click(option);

      const nameInput = screen.getByLabelText("Nome do Documento") as HTMLInputElement;
      fireEvent.change(nameInput, { target: { value: "Meu DFD Personalizado" } });

      expect(nameInput.value).toBe("Meu DFD Personalizado");
    });

    it("calls the create mutation and navigates to /app/documentos on success", async () => {
      server.use(
        http.get("http://localhost:3333/api/processes/", () =>
          HttpResponse.json(processesListResponse),
        ),
        http.post("http://localhost:3333/api/documents/", () =>
          HttpResponse.json(documentCreateResponse, { status: 201 }),
        ),
      );

      renderDocumentCreatePage();

      await waitFor(() => {
        expect(screen.queryByText(/Carregando processos/)).not.toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole("button", { name: "Selecionar DFD" }));
      fireEvent.click(screen.getByRole("combobox"));
      const option = await screen.findByRole("option", { name: /PE-2024-045/ });
      fireEvent.click(option);

      fireEvent.click(screen.getByRole("button", { name: /Criar e Editar/i }));

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith("Documento criado com sucesso.");
      });

      expect(mockNavigate).toHaveBeenCalledWith("/app/documentos");
    });

    it("shows an error toast and stays on page when the create mutation fails", async () => {
      server.use(
        http.get("http://localhost:3333/api/processes/", () =>
          HttpResponse.json(processesListResponse),
        ),
        http.post("http://localhost:3333/api/documents/", () =>
          HttpResponse.json(
            { error: "forbidden", message: "Sem permissão para criar documentos.", details: null },
            { status: 403 },
          ),
        ),
      );

      renderDocumentCreatePage();

      await waitFor(() => {
        expect(screen.queryByText(/Carregando processos/)).not.toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole("button", { name: "Selecionar ETP" }));
      fireEvent.click(screen.getByRole("combobox"));
      const option = await screen.findByRole("option", { name: /PE-2024-045/ });
      fireEvent.click(option);

      fireEvent.click(screen.getByRole("button", { name: /Criar e Editar/i }));

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("Sem permissão para criar documentos.");
      });

      expect(mockNavigate).not.toHaveBeenCalledWith("/app/documentos");
      expect(screen.getByRole("heading", { name: "Novo Documento" })).toBeInTheDocument();
    });

    it("submit button is disabled when type or process is not selected", () => {
      renderDocumentCreatePage();

      const submitButton = screen.getByRole("button", { name: /Criar e Editar/i });
      expect(submitButton).toBeDisabled();
    });
  });

  describe("4.3 – Picker states", () => {
    it("shows loading indicator while processes are loading", async () => {
      server.use(
        http.get("http://localhost:3333/api/processes/", async () => {
          await new Promise(() => {});
          return HttpResponse.json(processesListResponse);
        }),
      );

      renderDocumentCreatePage();

      expect(screen.getByText(/Carregando processos/)).toBeInTheDocument();
    });

    it("shows empty state message when no processes are available", async () => {
      server.use(
        http.get("http://localhost:3333/api/processes/", () =>
          HttpResponse.json({ items: [], page: 1, pageSize: 100, total: 0, totalPages: 0 }),
        ),
      );

      renderDocumentCreatePage();

      await waitFor(() => {
        expect(screen.queryByText(/Carregando processos/)).not.toBeInTheDocument();
      });

      // Open the select to see the empty state
      fireEvent.click(screen.getByRole("combobox"));

      await waitFor(() => {
        expect(screen.getByText("Nenhum processo disponível.")).toBeInTheDocument();
      });
    });

    it("ignores an unknown ?processo= value and leaves the picker unselected", async () => {
      server.use(
        http.get("http://localhost:3333/api/processes/", () =>
          HttpResponse.json(processesListResponse),
        ),
      );

      renderDocumentCreatePage("/app/documento/novo?processo=unknown-id");

      await waitFor(() => {
        expect(screen.queryByText(/Carregando processos/)).not.toBeInTheDocument();
      });

      // The combobox should not display any known process data for an unknown ID
      const combobox = screen.getByRole("combobox");
      expect(combobox).not.toHaveTextContent("PE-2024-045");
    });
  });
});
