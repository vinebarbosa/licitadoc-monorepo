import { fireEvent, screen, waitFor } from "@testing-library/react";
import { HttpResponse, http } from "msw";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it } from "vitest";
import {
  authenticatedSessionResponse,
  departmentsListResponse,
  organizationsListResponse,
} from "@/test/msw/fixtures";
import { server } from "@/test/msw/server";
import { renderWithProviders } from "@/test/render";
import { ProcessCreatePage } from "./process-create-page";

function renderCreatePage(initialEntry = "/app/processo/novo") {
  return renderWithProviders(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/app/processo/novo" element={<ProcessCreatePage />} />
        <Route path="/app/processos" element={<div>Processos listados</div>} />
        <Route path="/app/processo/:processId" element={<div>Detalhe criado</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

function createProcessResponse(overrides: Record<string, unknown> = {}) {
  return {
    id: "process-created",
    organizationId: "organization-1",
    procurementMethod: "licitacao",
    biddingModality: "pregao",
    processNumber: "PROC-2026-001",
    externalId: null,
    issuedAt: "2026-01-08T00:00:00.000Z",
    title: "Título do processo",
    object: "Objeto do processo",
    justification: "Justificativa do processo",
    responsibleName: "Maria Silva",
    status: "draft",
    departmentIds: ["department-1"],
    items: [],
    summary: {
      itemCount: 0,
      componentCount: 0,
      estimatedTotalValue: 0,
    },
    createdAt: "2026-04-26T00:00:00.000Z",
    updatedAt: "2026-04-26T00:00:00.000Z",
    ...overrides,
  };
}

async function fillRequiredFields(processNumber = "PROC-2026-001") {
  fireEvent.change(await screen.findByLabelText(/Número do processo/i), {
    target: { value: processNumber },
  });
  fireEvent.change(screen.getByLabelText(/Data de emissão/i), {
    target: { value: "2026-01-08" },
  });
  fireEvent.change(screen.getByLabelText(/Responsável/i), {
    target: { value: "Maria Silva" },
  });
  fireEvent.change(screen.getByLabelText(/Título do processo/i), {
    target: { value: "Título do processo" },
  });
  fireEvent.change(screen.getByLabelText(/Objeto da contratação/i), {
    target: { value: "Objeto do processo" },
  });
  fireEvent.change(screen.getByLabelText(/Justificativa/i), {
    target: { value: "Justificativa do processo" },
  });
}

async function goToLinksStep() {
  fireEvent.click(screen.getByRole("button", { name: "Continuar" }));
  expect(await screen.findByText("Vínculos Institucionais")).toBeInTheDocument();
}

async function selectDefaultDepartment() {
  const checkbox = await screen.findByRole("checkbox");

  if (checkbox.getAttribute("aria-checked") !== "true") {
    fireEvent.click(checkbox);
  }
}

async function goToItemsStep() {
  fireEvent.click(screen.getByRole("button", { name: "Continuar" }));
  expect(await screen.findByText("Itens do Processo")).toBeInTheDocument();
}

async function goToReviewStep() {
  fireEvent.click(screen.getByRole("button", { name: "Continuar" }));
  expect(await screen.findByText("Revisão Final")).toBeInTheDocument();
}

async function reachReviewStep(processNumber = "PROC-2026-001") {
  await fillRequiredFields(processNumber);
  await goToLinksStep();
  await selectDefaultDepartment();
  await goToItemsStep();
  await goToReviewStep();
}

describe("ProcessCreatePage", () => {
  beforeEach(() => {
    server.use(
      http.get("http://localhost:3333/api/auth/get-session", () =>
        HttpResponse.json(authenticatedSessionResponse),
      ),
      http.get("http://localhost:3333/api/organizations/", () =>
        HttpResponse.json(organizationsListResponse),
      ),
      http.get("http://localhost:3333/api/departments/", () =>
        HttpResponse.json(departmentsListResponse),
      ),
    );
  });

  it("submits reviewed process data with the canonical API payload", async () => {
    let requestBody: unknown = null;
    let usersRequestCount = 0;

    server.use(
      http.get("http://localhost:3333/api/users/", () => {
        usersRequestCount += 1;

        return HttpResponse.json({ message: "Forbidden" }, { status: 403 });
      }),
      http.post("http://localhost:3333/api/processes/", async ({ request }) => {
        requestBody = await request.json();

        return HttpResponse.json(createProcessResponse(), { status: 201 });
      }),
    );

    renderCreatePage();

    expect(await screen.findByRole("heading", { name: "Novo Processo" })).toBeInTheDocument();

    await reachReviewStep();
    fireEvent.click(screen.getByRole("button", { name: /Criar Processo/ }));

    await waitFor(() => {
      expect(requestBody).toMatchObject({
        procurementMethod: "licitacao",
        biddingModality: "pregao",
        processNumber: "PROC-2026-001",
        title: "Título do processo",
        object: "Objeto do processo",
        justification: "Justificativa do processo",
        responsibleName: "Maria Silva",
        status: "draft",
        departmentIds: ["department-1"],
        items: [],
      });
    });
    expect(screen.getByText("Detalhe criado")).toBeInTheDocument();
    expect(usersRequestCount).toBe(0);
  });

  it("submits simple items as structured canonical data", async () => {
    let requestBody: { items: Array<Record<string, unknown>> } = { items: [] };

    server.use(
      http.post("http://localhost:3333/api/processes/", async ({ request }) => {
        requestBody = (await request.json()) as { items: Array<Record<string, unknown>> };

        return HttpResponse.json(createProcessResponse({ processNumber: "PROC-ITENS" }), {
          status: 201,
        });
      }),
    );

    renderCreatePage();

    await fillRequiredFields("PROC-ITENS");
    await goToLinksStep();
    await selectDefaultDepartment();
    await goToItemsStep();

    fireEvent.click(screen.getByRole("button", { name: "Item simples" }));
    fireEvent.change(screen.getByLabelText("Código do item 1"), {
      target: { value: "0005909" },
    });
    fireEvent.change(screen.getByLabelText("Título do item 1"), {
      target: { value: "Pote plástico" },
    });
    fireEvent.change(screen.getByLabelText("Descrição do item 1"), {
      target: { value: "Pote plástico com tampa" },
    });
    fireEvent.change(screen.getByLabelText("Quantidade do item 1"), {
      target: { value: "2" },
    });
    fireEvent.change(screen.getByLabelText("Unidade do item 1"), {
      target: { value: "UN" },
    });
    fireEvent.change(screen.getByLabelText("Valor unitário do item 1"), {
      target: { value: "12,50" },
    });

    await goToReviewStep();
    fireEvent.click(screen.getByRole("button", { name: /Criar Processo/ }));

    await waitFor(() => {
      expect(requestBody.items).toEqual([
        expect.objectContaining({
          kind: "simple",
          code: "0005909",
          title: "Pote plástico",
          description: "Pote plástico com tampa",
          quantity: "2",
          unit: "UN",
          unitValue: "12,50",
          totalValue: "25.00",
        }),
      ]);
    });
  });

  it("submits kit items with separated component descriptions", async () => {
    let requestBody: { items: Array<Record<string, unknown>> } = { items: [] };

    server.use(
      http.post("http://localhost:3333/api/processes/", async ({ request }) => {
        requestBody = (await request.json()) as { items: Array<Record<string, unknown>> };

        return HttpResponse.json(createProcessResponse({ processNumber: "PROC-KIT" }), {
          status: 201,
        });
      }),
    );

    renderCreatePage();

    await fillRequiredFields("PROC-KIT");
    await goToLinksStep();
    await selectDefaultDepartment();
    await goToItemsStep();

    fireEvent.click(screen.getByRole("button", { name: "Kit" }));
    fireEvent.change(screen.getByLabelText("Código do item 1"), {
      target: { value: "KIT-001" },
    });
    fireEvent.change(screen.getByLabelText("Título do item 1"), {
      target: { value: "Kit escolar" },
    });
    fireEvent.change(screen.getByLabelText("Quantidade do item 1"), {
      target: { value: "100" },
    });
    fireEvent.change(screen.getByLabelText("Unidade do item 1"), {
      target: { value: "KIT" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Adicionar componente ao item 1/i }));
    fireEvent.change(screen.getByLabelText("Título do componente 1 do item 1"), {
      target: { value: "Caderno brochura" },
    });
    fireEvent.change(screen.getByLabelText("Descrição do componente 1 do item 1"), {
      target: { value: "Caderno 96 folhas" },
    });
    fireEvent.change(screen.getByLabelText("Quantidade do componente 1 do item 1"), {
      target: { value: "2" },
    });
    fireEvent.change(screen.getByLabelText("Unidade do componente 1 do item 1"), {
      target: { value: "UN" },
    });

    await goToReviewStep();
    expect(screen.getByText(/Kit escolar/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Criar Processo/ }));

    await waitFor(() => {
      expect(requestBody.items[0]).toMatchObject({
        kind: "kit",
        code: "KIT-001",
        title: "Kit escolar",
        quantity: "100",
        unit: "KIT",
        components: [
          {
            title: "Caderno brochura",
            description: "Caderno 96 folhas",
            quantity: "2",
            unit: "UN",
          },
        ],
      });
    });
    expect(requestBody.items[0]).not.toHaveProperty("description");
  });

  it("shows organization selection for admin sessions", async () => {
    server.use(
      http.get("http://localhost:3333/api/auth/get-session", () =>
        HttpResponse.json({
          ...authenticatedSessionResponse,
          user: {
            ...authenticatedSessionResponse.user,
            role: "admin",
            organizationId: null,
          },
        }),
      ),
    );

    renderCreatePage();

    await fillRequiredFields();
    await goToLinksStep();

    expect(await screen.findByLabelText(/Organização/i)).toHaveTextContent(
      "Prefeitura de Sao Paulo",
    );
  });

  it("shows required field validation before advancing from the data step", async () => {
    renderCreatePage();

    expect(await screen.findByRole("heading", { name: "Novo Processo" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Continuar" }));

    expect(await screen.findByText("Informe o número do processo")).toBeInTheDocument();
    expect(screen.getByText("Informe a data de emissão")).toBeInTheDocument();
    expect(screen.getByText("Informe o responsável")).toBeInTheDocument();
    expect(screen.getByText("Informe o título do processo")).toBeInTheDocument();
    expect(screen.getByText("Descreva o objeto da contratação")).toBeInTheDocument();
    expect(screen.getByText("Informe a justificativa")).toBeInTheDocument();
  });

  it("shows backend rejection errors without leaving the form", async () => {
    server.use(
      http.post("http://localhost:3333/api/processes/", () =>
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

    renderCreatePage();

    await reachReviewStep("PROC-CONFLICT");
    fireEvent.click(screen.getByRole("button", { name: /Criar Processo/ }));

    expect(await screen.findByText("Process number already exists.")).toBeInTheDocument();
    expect(screen.getByText("Revisão Final")).toBeInTheDocument();
  });
});
