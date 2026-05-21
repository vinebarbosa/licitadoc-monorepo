import { fireEvent, screen, waitFor } from "@testing-library/react";
import { HttpResponse, http } from "msw";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  ExpenseRequestPdfError,
  parseTopDownExpenseRequestText,
} from "@/modules/processes/model/expense-request-pdf";
import {
  authenticatedSessionResponse,
  currentOrganizationResponse,
  departmentsListResponse,
  organizationsListResponse,
} from "@/test/msw/fixtures";
import { server } from "@/test/msw/server";
import { renderWithProviders } from "@/test/render";
import { ProcessCreatePage } from "./process-create-page";

const { extractExpenseRequestFromPdfMock } = vi.hoisted(() => ({
  extractExpenseRequestFromPdfMock: vi.fn(),
}));

vi.mock("@/modules/processes/model/expense-request-pdf", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/modules/processes/model/expense-request-pdf")>();

  return {
    ...actual,
    extractExpenseRequestFromPdf: extractExpenseRequestFromPdfMock,
  };
});

const sdImportText = `
PRACA 05 DE ABRIL, 180, CENTRO
CNPJ: 00.000.000/0001-00
Solicitacao de Despesa
MUNICIPIO DE PUREZA
Unidade Orcamentaria: 06.001 - Secretaria de Educacao
N Solicitacao:
6
Data Emissao:
08/01/2026
Processo:
Servico
Classificacao:
Contratacao de apresentacao artistica musical
Objeto:
Justificativa da necessidade importada.
Item Descricao
Contratacao de show 12345 1 10.000,00 10.000,00 UND
Valor Total
10.000,00
Secretaria Municipal
Maria Responsavel
123.456.789-00
`;

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

function createSdFile(name = "SD.pdf") {
  return new File(["pdf"], name, { type: "application/pdf" });
}

function mockSuccessfulSdImport(fileName = "SD.pdf") {
  extractExpenseRequestFromPdfMock.mockResolvedValueOnce(
    parseTopDownExpenseRequestText(sdImportText, fileName),
  );
}

async function applySuccessfulSdImport(fileName = "SD.pdf") {
  mockSuccessfulSdImport(fileName);
  fireEvent.click(await screen.findByRole("button", { name: "Importar Solicitação de Despesa" }));
  expect(screen.getByRole("button", { name: "Selecionar PDF" })).toBeInTheDocument();
  expect(screen.getByText("Arraste o PDF aqui ou selecione o arquivo")).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText("Arquivo PDF"), {
    target: { files: [createSdFile(fileName)] },
  });

  expect(await screen.findByText("SD-6-2026")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Aplicar" }));
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

function fillManualSimpleItem() {
  fireEvent.click(screen.getByRole("button", { name: "Item simples" }));
  fireEvent.change(screen.getByLabelText("Código do item 1"), {
    target: { value: "0005909" },
  });
  fireEvent.change(screen.getByLabelText("Título do item 1"), {
    target: { value: "Pote manual" },
  });
  fireEvent.change(screen.getByLabelText("Descrição do item 1"), {
    target: { value: "Pote manual com tampa" },
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
    extractExpenseRequestFromPdfMock.mockReset();
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
    );
  });

  it("submits reviewed process data with the canonical API payload", async () => {
    let requestBody: unknown = null;
    let usersRequestCount = 0;
    let currentOrganizationRequestCount = 0;

    server.use(
      http.get("http://localhost:3333/api/organizations/me", () => {
        currentOrganizationRequestCount += 1;

        return HttpResponse.json(currentOrganizationResponse);
      }),
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
    expect(currentOrganizationRequestCount).toBeGreaterThan(0);
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
    let currentOrganizationRequestCount = 0;

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
      http.get("http://localhost:3333/api/organizations/me", () => {
        currentOrganizationRequestCount += 1;

        return HttpResponse.json(currentOrganizationResponse);
      }),
    );

    renderCreatePage();

    await fillRequiredFields();
    await goToLinksStep();

    expect(await screen.findByLabelText(/Organização/i)).toHaveTextContent(
      "Prefeitura de Sao Paulo",
    );
    expect(currentOrganizationRequestCount).toBe(0);
  });

  it("shows the reference-data alert when current organization loading fails for non-admin", async () => {
    server.use(
      http.get("http://localhost:3333/api/organizations/me", () =>
        HttpResponse.json(
          {
            error: "not_found",
            message: "Organization not found.",
            details: null,
          },
          { status: 404 },
        ),
      ),
    );

    renderCreatePage();

    expect(
      await screen.findByText("Não foi possível carregar os dados de referência"),
    ).toBeInTheDocument();
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

  it("opens the SD import dialog and cancels without changing the form", async () => {
    renderCreatePage();

    fireEvent.change(await screen.findByLabelText(/Número do processo/i), {
      target: { value: "PROC-MANUAL" },
    });
    mockSuccessfulSdImport();

    fireEvent.click(screen.getByRole("button", { name: "Importar Solicitação de Despesa" }));
    expect(screen.getByRole("button", { name: "Selecionar PDF" })).toBeInTheDocument();
    expect(screen.getByText("Arraste o PDF aqui ou selecione o arquivo")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Arquivo PDF"), {
      target: { files: [createSdFile()] },
    });

    expect(await screen.findByText("Prévia extraída")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));

    expect(screen.getByLabelText(/Número do processo/i)).toHaveValue("PROC-MANUAL");
    expect(
      screen.queryByText("Dados importados da Solicitação de despesa"),
    ).not.toBeInTheDocument();
  });

  it("applies imported SD data to editable wizard fields", async () => {
    renderCreatePage();

    await applySuccessfulSdImport();

    expect(screen.getByLabelText(/Número do processo/i)).toHaveValue("SD-6-2026");
    expect(screen.getByLabelText(/ID externo/i)).toHaveValue("6");
    expect(screen.getByLabelText(/Data de emissão/i)).toHaveValue("2026-01-08");
    expect(screen.getByLabelText(/Responsável/i)).toHaveValue("Maria Responsavel");
    expect(screen.getByText("Dados importados da Solicitação de despesa")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/Objeto da contratação/i), {
      target: { value: "Objeto revisado pelo usuário" },
    });
    expect(screen.getByLabelText(/Objeto da contratação/i)).toHaveValue(
      "Objeto revisado pelo usuário",
    );

    await goToLinksStep();
    expect(screen.getByText(/Unidades selecionadas \(1\)/)).toBeInTheDocument();
  });

  it("reports an import failure and lets the user recover with another PDF", async () => {
    extractExpenseRequestFromPdfMock.mockRejectedValueOnce(
      new ExpenseRequestPdfError("Arquivo não reconhecido.", "unrecognized_sd"),
    );
    renderCreatePage();

    fireEvent.click(await screen.findByRole("button", { name: "Importar Solicitação de Despesa" }));
    expect(screen.getByRole("button", { name: "Selecionar PDF" })).toBeInTheDocument();
    expect(screen.getByText("Arraste o PDF aqui ou selecione o arquivo")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Arquivo PDF"), {
      target: { files: [createSdFile("relatorio.pdf")] },
    });

    expect(
      await screen.findByText(
        "O arquivo não foi reconhecido como uma Solicitação de Despesa TopDown.",
      ),
    ).toBeInTheDocument();

    mockSuccessfulSdImport("SD-recuperada.pdf");
    fireEvent.change(screen.getByLabelText("Arquivo PDF"), {
      target: { files: [createSdFile("SD-recuperada.pdf")] },
    });

    expect(await screen.findByText("SD-6-2026")).toBeInTheDocument();
    expect(screen.queryByText("Importação não concluída")).not.toBeInTheDocument();
  });

  it("submits reviewed values after importing SD without unsupported source fields", async () => {
    let requestBody: Record<string, unknown> | null = null;

    server.use(
      http.post("http://localhost:3333/api/processes/", async ({ request }) => {
        requestBody = (await request.json()) as Record<string, unknown>;

        return HttpResponse.json(createProcessResponse({ processNumber: "SD-6-2026" }), {
          status: 201,
        });
      }),
    );

    renderCreatePage();

    await applySuccessfulSdImport();
    fireEvent.change(screen.getByLabelText(/Objeto da contratação/i), {
      target: { value: "Objeto revisado pelo usuário" },
    });

    await goToLinksStep();
    await goToItemsStep();
    await goToReviewStep();
    fireEvent.click(screen.getByRole("button", { name: /Criar Processo/ }));

    await waitFor(() => {
      expect(requestBody).toMatchObject({
        processNumber: "SD-6-2026",
        externalId: "6",
        object: "Objeto revisado pelo usuário",
        responsibleName: "Maria Responsavel",
        departmentIds: ["department-1"],
        items: [],
      });
      expect(requestBody).not.toHaveProperty("sourceKind");
      expect(requestBody).not.toHaveProperty("sourceReference");
      expect(requestBody).not.toHaveProperty("sourceMetadata");
    });
  });

  it("preserves manually added items when SD data is applied", async () => {
    let requestBody: { items: Array<Record<string, unknown>> } | null = null;

    server.use(
      http.post("http://localhost:3333/api/processes/", async ({ request }) => {
        requestBody = (await request.json()) as { items: Array<Record<string, unknown>> };

        return HttpResponse.json(createProcessResponse({ processNumber: "SD-6-2026" }), {
          status: 201,
        });
      }),
    );

    renderCreatePage();

    await fillRequiredFields("PROC-MANUAL-ITEM");
    await goToLinksStep();
    await selectDefaultDepartment();
    await goToItemsStep();
    fillManualSimpleItem();

    await applySuccessfulSdImport();

    expect(screen.getByLabelText("Código do item 1")).toHaveValue("0005909");
    expect(screen.getByLabelText("Título do item 1")).toHaveValue("Pote manual");

    await goToReviewStep();
    fireEvent.click(screen.getByRole("button", { name: /Criar Processo/ }));

    await waitFor(() => {
      expect(requestBody?.items).toEqual([
        expect.objectContaining({
          kind: "simple",
          code: "0005909",
          title: "Pote manual",
          description: "Pote manual com tampa",
          quantity: "2",
          unit: "UN",
          unitValue: "12,50",
          totalValue: "25.00",
        }),
      ]);
      expect(requestBody?.items).toHaveLength(1);
    });
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
