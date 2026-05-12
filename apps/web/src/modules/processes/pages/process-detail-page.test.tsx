import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { HttpResponse, http } from "msw";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { toast } from "sonner";
import { describe, expect, it, vi } from "vitest";
import { ProcessDetailPage } from "@/modules/processes";
import {
  processDetailItemsSourceMetadata,
  processDetailLegacyItemSourceMetadata,
  processDetailResponse,
} from "@/test/msw/fixtures";
import { server } from "@/test/msw/server";
import { renderWithProviders } from "@/test/render";

vi.mock("sonner", () => ({ toast: { info: vi.fn(), success: vi.fn(), error: vi.fn() } }));

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
  it("renders the migrated detail layout with process summary and document cards", async () => {
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
    expect(screen.getByText("Pregao Eletronico")).toBeInTheDocument();
    expect(screen.getByText("06.001 - Secretaria de Educacao")).toBeInTheDocument();
    expect(screen.getByText("Maria Costa")).toBeInTheDocument();
    expect(screen.getByText("R$ 450.000,00")).toBeInTheDocument();
    expect(screen.getByText("Documentos do Processo")).toBeInTheDocument();
    expect(screen.getByText("Documento de Formalização de Demanda")).toBeInTheDocument();
    expect(screen.getByText("Estudo Técnico Preliminar")).toBeInTheDocument();
    expect(screen.getByText("Termo de Referência")).toBeInTheDocument();
    expect(screen.getByText("Minuta do Contrato")).toBeInTheDocument();
  });

  it("renders solicitation items below justification with values and components", async () => {
    server.use(
      http.get("http://localhost:3333/api/processes/:processId", () =>
        HttpResponse.json({
          ...processDetailResponse,
          sourceMetadata: processDetailItemsSourceMetadata,
        }),
      ),
    );

    renderProcessDetailPage();

    const itemSection = await screen.findByRole("region", { name: "Itens da Solicitação" });
    const justificationLabel = screen.getByText("Justificativa");

    expect(
      justificationLabel.compareDocumentPosition(itemSection) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(within(itemSection).getByText("3 itens")).toBeInTheDocument();
    expect(within(itemSection).getByText("Pote plástico com tampa")).toBeInTheDocument();
    expect(
      within(itemSection).getByText("Pote plástico de no mínimo 1L com tampa e trava lateral."),
    ).toBeInTheDocument();
    expect(within(itemSection).getAllByText("Qtd.")).toHaveLength(4);
    expect(within(itemSection).getAllByText("500")).toHaveLength(2);
    expect(within(itemSection).getAllByText("unidade")).toHaveLength(3);
    expect(within(itemSection).getByText("R$ 8,50")).toBeInTheDocument();
    expect(within(itemSection).getByText("R$ 4.250,00")).toBeInTheDocument();
    expect(within(itemSection).getByText("Componentes")).toBeInTheDocument();
    expect(within(itemSection).getByText("Embalagem personalizada")).toBeInTheDocument();
    expect(within(itemSection).getByText("Cartão comemorativo")).toBeInTheDocument();
    expect(
      within(itemSection).getByText(/descrição longa para validar quebra de linha/i),
    ).toBeInTheDocument();
  });

  it("renders legacy singular item metadata and skips incorrect missing-field placeholders", async () => {
    server.use(
      http.get("http://localhost:3333/api/processes/:processId", () =>
        HttpResponse.json({
          ...processDetailResponse,
          sourceMetadata: processDetailLegacyItemSourceMetadata,
        }),
      ),
    );

    renderProcessDetailPage();

    const itemSection = await screen.findByRole("region", { name: "Itens da Solicitação" });

    expect(within(itemSection).getByText("1 item")).toBeInTheDocument();
    expect(within(itemSection).getByText("LEG-1")).toBeInTheDocument();
    expect(
      within(itemSection).getByText("Item legado extraído em formato singular"),
    ).toBeInTheDocument();
    expect(within(itemSection).getByText("10")).toBeInTheDocument();
    expect(within(itemSection).getByText("caixa")).toBeInTheDocument();
    expect(within(itemSection).queryByText(/undefined|null|NaN/)).not.toBeInTheDocument();
  });

  it("does not render the solicitation item section when metadata has no usable items", async () => {
    server.use(
      http.get("http://localhost:3333/api/processes/:processId", () =>
        HttpResponse.json({
          ...processDetailResponse,
          sourceMetadata: {
            extractedFields: {
              items: [{ quantity: "2" }, null],
              item: { unit: "caixa" },
            },
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

  it("renders completed, in-editing, pending, and error document card states with action links", async () => {
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
    expect(within(trCard as HTMLElement).getByText("Pendente")).toBeInTheDocument();
    expect((trCard as HTMLElement).querySelector('[data-status-icon="clock-3"]')).not.toBeNull();
    expect(within(minutaCard as HTMLElement).getByText("Erro")).toBeInTheDocument();
    expect(
      (minutaCard as HTMLElement).querySelector('[data-status-icon="alert-triangle"]'),
    ).not.toBeNull();
    expect(within(trCard as HTMLElement).getByRole("link", { name: "Gerar" })).toHaveAttribute(
      "href",
      "/app/documento/novo?tipo=tr&processo=process-1",
    );
    expect(within(trCard as HTMLElement).queryByRole("link", { name: "Criar" })).toBeNull();
    expect(
      within(dfdCard as HTMLElement).getByRole("link", { name: "Gerar novamente" }),
    ).toHaveAttribute("href", "/app/documento/novo?tipo=dfd&processo=process-1");
    expect(within(dfdCard as HTMLElement).getByRole("link", { name: "Editar" })).toHaveAttribute(
      "href",
      "/app/documento/document-1",
    );
    expect(
      within(dfdCard as HTMLElement).getByRole("link", { name: "Visualizar" }),
    ).toHaveAttribute("href", "/app/documento/document-1/preview");
    expect(within(etpCard as HTMLElement).getByRole("link", { name: "Editar" })).toHaveAttribute(
      "href",
      "/app/documento/document-2",
    );
    expect(
      within(etpCard as HTMLElement).getByRole("link", { name: "Visualizar" }),
    ).toHaveAttribute("href", "/app/documento/document-2/preview");

    const dfdOverflowTrigger = within(dfdCard as HTMLElement).getByRole("button", {
      name: "Mais ações",
    });

    fireEvent.pointerDown(dfdOverflowTrigger);

    const duplicateItem = await screen.findByRole("menuitem", { name: "Duplicar" });

    expect(duplicateItem).not.toHaveAttribute("aria-disabled", "true");
    expect(duplicateItem.querySelector('[data-action-icon="copy"]')).not.toBeNull();

    fireEvent.click(duplicateItem);

    expect(toast.info).toHaveBeenCalledWith("Duplicação de documentos ainda não está disponível.");
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
