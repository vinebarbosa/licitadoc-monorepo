import { fireEvent, screen, waitFor } from "@testing-library/react";
import { HttpResponse, http } from "msw";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it } from "vitest";
import {
  authenticatedSessionResponse,
  currentOrganizationResponse,
  departmentsListResponse,
  organizationsListResponse,
  processDetailResponse,
} from "@/test/msw/fixtures";
import { server } from "@/test/msw/server";
import { renderWithProviders } from "@/test/render";
import { ProcessEditPage } from "./process-edit-page";

function renderEditPage(initialEntry = "/app/processo/process-1/editar") {
  return renderWithProviders(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/app/processo/:processId/editar" element={<ProcessEditPage />} />
        <Route path="/app/processo/:processId" element={<div>Detalhe atualizado</div>} />
        <Route path="/app/processos" element={<div>Processos listados</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

async function goToLinksStep() {
  fireEvent.click(screen.getByRole("button", { name: "Continuar" }));
  expect(await screen.findByText("Vínculos Institucionais")).toBeInTheDocument();
}

async function goToItemsStep() {
  fireEvent.click(screen.getByRole("button", { name: "Continuar" }));
  expect(await screen.findByText("Itens do Processo")).toBeInTheDocument();
}

async function goToReviewStep() {
  fireEvent.click(screen.getByRole("button", { name: "Continuar" }));
  expect(await screen.findByText("Revisão Final")).toBeInTheDocument();
}

describe("ProcessEditPage", () => {
  beforeEach(() => {
    server.use(
      http.get("http://localhost:3333/api/auth/get-session", () =>
        HttpResponse.json(authenticatedSessionResponse),
      ),
      http.get("http://localhost:3333/api/organizations/me", () =>
        HttpResponse.json(currentOrganizationResponse),
      ),
      http.get("http://localhost:3333/api/organizations/", () =>
        HttpResponse.json(organizationsListResponse),
      ),
      http.get("http://localhost:3333/api/departments/", () =>
        HttpResponse.json(departmentsListResponse),
      ),
      http.get("http://localhost:3333/api/processes/:processId", () =>
        HttpResponse.json(processDetailResponse),
      ),
    );
  });

  it("prefills the wizard with process detail data and keeps organization fixed", async () => {
    renderEditPage();

    expect(await screen.findByRole("heading", { name: "Editar Processo" })).toBeInTheDocument();
    expect(screen.getByDisplayValue("PE-2024-045")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Maria Costa")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Serviços de TI")).toBeInTheDocument();

    await goToLinksStep();

    expect(screen.queryByLabelText(/Organização/i)).not.toBeInTheDocument();
    expect(screen.getByText(/Unidades selecionadas \(1\)/)).toBeInTheDocument();

    await goToItemsStep();

    expect(screen.getByDisplayValue("Pote plástico")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Kit escolar")).toBeInTheDocument();
  });

  it("loads additional organization departments from the API during editing", async () => {
    server.use(
      http.get("http://localhost:3333/api/departments/", () =>
        HttpResponse.json({
          ...departmentsListResponse,
          items: [
            ...departmentsListResponse.items,
            {
              id: "department-2",
              name: "Secretaria de Saude",
              slug: "secretaria-de-saude",
              organizationId: "organization-1",
              budgetUnitCode: "07.001",
              responsibleName: "Ana Souza",
              responsibleRole: "Secretaria",
              createdAt: "2026-04-01T00:00:00.000Z",
              updatedAt: "2026-04-01T00:00:00.000Z",
            },
          ],
          total: 2,
          totalPages: 1,
        }),
      ),
    );

    renderEditPage();

    expect(await screen.findByRole("heading", { name: "Editar Processo" })).toBeInTheDocument();

    await goToLinksStep();

    expect(screen.getByText("Secretaria de Educacao")).toBeInTheDocument();
    expect(screen.getByText("Secretaria de Saude")).toBeInTheDocument();
    expect(screen.getByText("Código: 07.001")).toBeInTheDocument();
  });

  it("submits the edited process with the canonical update payload and redirects to detail", async () => {
    let requestBody: unknown = null;

    server.use(
      http.patch("http://localhost:3333/api/processes/:processId", async ({ request }) => {
        requestBody = await request.json();

        return HttpResponse.json({
          ...processDetailResponse,
          processNumber: "PE-2024-045-A",
          title: "Serviços de TI atualizados",
        });
      }),
    );

    renderEditPage();

    fireEvent.change(await screen.findByLabelText(/Número do processo/i), {
      target: { value: "PE-2024-045-A" },
    });
    fireEvent.change(screen.getByLabelText(/Título do processo/i), {
      target: { value: "Serviços de TI atualizados" },
    });

    await goToLinksStep();
    await goToItemsStep();
    await goToReviewStep();

    expect(screen.getByText("Pote plástico com tampa")).toBeInTheDocument();
    expect(screen.getByText("Componentes do kit")).toBeInTheDocument();
    expect(screen.getByText(/Caderno 96 folhas/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Salvar alterações/ }));

    await waitFor(() => {
      expect(requestBody).toMatchObject({
        procurementMethod: "licitacao",
        biddingModality: "pregao",
        processNumber: "PE-2024-045-A",
        title: "Serviços de TI atualizados",
        object: "Contratação de Serviços de TI",
        justification: "Necessidade de suporte técnico especializado.",
        responsibleName: "Maria Costa",
        departmentIds: ["department-1"],
        items: [
          expect.objectContaining({
            kind: "simple",
            code: "0005909",
            title: "Pote plástico",
          }),
          expect.objectContaining({
            kind: "kit",
            code: "KIT-001",
            title: "Kit escolar",
          }),
        ],
      });
    });

    expect(screen.getByText("Detalhe atualizado")).toBeInTheDocument();
  });

  it("shows backend rejection errors without leaving the edit flow", async () => {
    server.use(
      http.patch("http://localhost:3333/api/processes/:processId", () =>
        HttpResponse.json(
          {
            error: "conflict",
            message: "Process number already exists.",
            details: null,
          },
          { status: 409 },
        ),
      ),
    );

    renderEditPage();

    fireEvent.change(await screen.findByLabelText(/Número do processo/i), {
      target: { value: "PROC-CONFLICT" },
    });

    await goToLinksStep();
    await goToItemsStep();
    await goToReviewStep();

    fireEvent.click(screen.getByRole("button", { name: /Salvar alterações/ }));

    expect(await screen.findByText("Process number already exists.")).toBeInTheDocument();
    expect(screen.getByText("Revisão Final")).toBeInTheDocument();
  });

  it("shows the not-found state when the process is outside the visible scope", async () => {
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

    renderEditPage();

    expect(await screen.findByText("Processo não encontrado")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Voltar para Processos" })).toHaveAttribute(
      "href",
      "/app/processos",
    );
  });
});
