import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { HttpResponse, http } from "msw";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { ProcessDetailPage } from "@/modules/processes";
import { processDetailResponse } from "@/test/msw/fixtures";
import { server } from "@/test/msw/server";
import { renderWithProviders } from "@/test/render";

function renderProcessDetailPage(initialEntry = "/app/processo/process-1") {
  return renderWithProviders(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/app/processo/:processId" element={<ProcessDetailPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("ProcessDetailPage", () => {
  it("renders the validated detail layout with API-backed process sections", async () => {
    server.use(
      http.get("http://localhost:3333/api/processes/:processId", () =>
        HttpResponse.json(processDetailResponse),
      ),
    );

    renderProcessDetailPage();

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Serviços de TI" })).toBeInTheDocument();
    });

    expect(screen.getByText("Contratação de Serviços de TI")).toBeInTheDocument();
    expect(screen.getByText("PE-2024-045")).toBeInTheDocument();
    expect(screen.getByText("Licitação")).toBeInTheDocument();
    expect(screen.getByText("Pregão")).toBeInTheDocument();
    expect(screen.getByText("Maria Costa")).toBeInTheDocument();
    expect(screen.getByText("Prefeitura Municipal de Exemplo")).toBeInTheDocument();
    expect(screen.getByText("Secretaria de Educacao")).toBeInTheDocument();
    expect(screen.getAllByText("R$ 25,00")).toHaveLength(2);
    expect(screen.getByText("Documentos do Processo")).toBeInTheDocument();
    expect(screen.getByText("Documento de Formalização de Demanda")).toBeInTheDocument();
    expect(screen.getByText("Estudo Técnico Preliminar")).toBeInTheDocument();
    expect(screen.getByText("Termo de Referência")).toBeInTheDocument();
    expect(screen.getByText("Minuta do Contrato")).toBeInTheDocument();
  });

  it("renders native solicitation items below justification with expandable kit components", async () => {
    server.use(
      http.get("http://localhost:3333/api/processes/:processId", () =>
        HttpResponse.json(processDetailResponse),
      ),
    );

    renderProcessDetailPage();

    const itemSection = await screen.findByRole("region", { name: "Itens da Solicitação" });
    const justificationLabel = screen.getByText("Justificativa");

    expect(
      justificationLabel.compareDocumentPosition(itemSection) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(within(itemSection).getByText("2 itens")).toBeInTheDocument();
    expect(within(itemSection).getByText("Pote plástico")).toBeInTheDocument();
    expect(within(itemSection).getByText("Pote plástico com tampa")).toBeInTheDocument();
    expect(within(itemSection).getByText("#0005909")).toBeInTheDocument();
    expect(within(itemSection).getAllByText("R$ 25,00")).toHaveLength(1);
    expect(within(itemSection).getByText("#KIT-001")).toBeInTheDocument();
    expect(within(itemSection).getByText("Kit escolar")).toBeInTheDocument();

    fireEvent.click(within(itemSection).getByRole("button", { name: "Ver 1 componentes" }));

    expect(within(itemSection).getByText("Caderno brochura")).toBeInTheDocument();
    expect(within(itemSection).getByText("Caderno 96 folhas")).toBeInTheDocument();
  });

  it("does not render the solicitation item section when the API has no items", async () => {
    server.use(
      http.get("http://localhost:3333/api/processes/:processId", () =>
        HttpResponse.json({
          ...processDetailResponse,
          items: [],
          summary: {
            itemCount: 0,
            componentCount: 0,
            estimatedTotalValue: null,
          },
        }),
      ),
    );

    renderProcessDetailPage();

    await waitFor(() => {
      expect(screen.getByText("Documentos do Processo")).toBeInTheDocument();
    });

    expect(screen.queryByRole("region", { name: "Itens da Solicitação" })).not.toBeInTheDocument();
  });

  it("renders document card states with generation and preview actions", async () => {
    server.use(
      http.get("http://localhost:3333/api/processes/:processId", () =>
        HttpResponse.json(processDetailResponse),
      ),
    );

    renderProcessDetailPage();

    await waitFor(() => {
      expect(screen.getByText("DFD")).toBeInTheDocument();
    });

    const dfdCard = screen.getByText("DFD").closest('[data-slot="card"]');
    const etpCard = screen.getByText("ETP").closest('[data-slot="card"]');
    const trCard = screen.getByText("TR").closest('[data-slot="card"]');
    const minutaCard = screen.getByText("Minuta").closest('[data-slot="card"]');

    expect(dfdCard).not.toBeNull();
    expect(etpCard).not.toBeNull();
    expect(trCard).not.toBeNull();
    expect(minutaCard).not.toBeNull();

    expect(within(dfdCard as HTMLElement).getByText("Concluido")).toBeInTheDocument();
    expect(
      (dfdCard as HTMLElement).querySelector('[data-status-icon="check-circle-2"]'),
    ).not.toBeNull();
    expect(within(etpCard as HTMLElement).getByText("Em edicao")).toBeInTheDocument();
    expect((etpCard as HTMLElement).querySelector('[data-status-icon="clock-3"]')).not.toBeNull();
    expect(within(etpCard as HTMLElement).getByText("75%")).toBeInTheDocument();
    expect(within(trCard as HTMLElement).getByText("Não gerado")).toBeInTheDocument();
    expect((trCard as HTMLElement).querySelector('[data-status-icon="clock-3"]')).not.toBeNull();
    expect(within(minutaCard as HTMLElement).getByText("Erro")).toBeInTheDocument();
    expect(
      (minutaCard as HTMLElement).querySelector('[data-status-icon="alert-triangle"]'),
    ).not.toBeNull();
    expect(within(trCard as HTMLElement).getByRole("link", { name: "Gerar" })).toHaveAttribute(
      "href",
      "/app/documento/novo?tipo=tr&processo=process-1",
    );
    expect(
      within(trCard as HTMLElement)
        .getByRole("link", { name: "Gerar" })
        .querySelector('[data-action-icon="file-plus-2"]'),
    ).not.toBeNull();
    expect(
      within(dfdCard as HTMLElement).getByRole("link", { name: "Gerar novamente" }),
    ).toHaveAttribute("href", "/app/documento/novo?tipo=dfd&processo=process-1");
    expect(
      within(dfdCard as HTMLElement).getByRole("link", { name: "Visualizar" }),
    ).toHaveAttribute("href", "/app/documento/document-1/preview");
    expect(within(dfdCard as HTMLElement).queryByRole("link", { name: "Editar" })).toBeNull();
    expect(within(dfdCard as HTMLElement).queryByRole("button", { name: "Mais ações" })).toBeNull();
    expect(screen.queryByRole("menuitem", { name: "Duplicar" })).toBeNull();
  });

  it("shows a loading state before rendering an API failure", async () => {
    server.use(
      http.get("http://localhost:3333/api/processes/:processId", () =>
        HttpResponse.json(
          {
            error: "internal_server_error",
            message: "Falha ao carregar.",
          },
          { status: 500 },
        ),
      ),
    );

    renderProcessDetailPage();

    expect(screen.getByText("Carregando processo...")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("Não foi possível carregar o processo")).toBeInTheDocument();
    });

    expect(screen.getByRole("button", { name: "Tentar novamente" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Voltar para Processos" })).toHaveAttribute(
      "href",
      "/app/processos",
    );
  });

  it("shows a recoverable not-found state for missing process details", async () => {
    server.use(
      http.get("http://localhost:3333/api/processes/:processId", () =>
        HttpResponse.json(
          {
            error: "not_found",
            message: "Process not found.",
            details: null,
          },
          { status: 404 },
        ),
      ),
    );

    renderProcessDetailPage();

    await waitFor(() => {
      expect(screen.getByText("Processo não encontrado")).toBeInTheDocument();
    });

    expect(screen.queryByRole("button", { name: "Tentar novamente" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Voltar para Processos" })).toHaveAttribute(
      "href",
      "/app/processos",
    );
  });
});
