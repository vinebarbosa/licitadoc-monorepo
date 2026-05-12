import { fireEvent, screen, waitFor } from "@testing-library/react";
import { HttpResponse, http } from "msw";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { authenticatedSessionResponse } from "@/test/msw/fixtures";
import { server } from "@/test/msw/server";
import { renderWithProviders } from "@/test/render";
import { ProcessCreatePage } from "./process-create-page";

const extractExpenseRequestFromPdf = vi.fn();

vi.mock("../model/expense-request-pdf", () => ({
  extractExpenseRequestFromPdf: (...args: unknown[]) => extractExpenseRequestFromPdf(...args),
}));

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

async function fillRequiredFields(processNumber = "PROC-2026-001") {
  fireEvent.change(screen.getByLabelText("Numero do processo"), {
    target: { value: processNumber },
  });
  fireEvent.change(screen.getByLabelText("Data de emissao"), {
    target: { value: "2026-01-08" },
  });
  fireEvent.change(screen.getByLabelText("Objeto"), {
    target: { value: "Objeto do processo" },
  });
  fireEvent.change(screen.getByLabelText("Justificativa"), {
    target: { value: "Justificativa do processo" },
  });
  fireEvent.change(screen.getByLabelText("Responsavel"), {
    target: { value: "Maria Costa" },
  });
}

async function goToLinksStep() {
  fireEvent.click(screen.getByRole("button", { name: "Continuar" }));
  expect(await screen.findByText("Vinculos")).toBeInTheDocument();
}

async function selectDefaultDepartment() {
  const checkbox = await screen.findByRole("checkbox");

  if (checkbox.getAttribute("aria-checked") !== "true") {
    fireEvent.click(checkbox);
  }
}

async function goToItemsStep() {
  fireEvent.click(screen.getByRole("button", { name: "Continuar" }));
  expect(await screen.findByText("Itens da Solicitação")).toBeInTheDocument();
}

async function goToReviewStep() {
  fireEvent.click(screen.getByRole("button", { name: "Continuar" }));
  expect(await screen.findByText("Revisão da Solicitação")).toBeInTheDocument();
}

async function reachReviewStep(processNumber = "PROC-2026-001") {
  await fillRequiredFields(processNumber);
  await goToLinksStep();
  await selectDefaultDepartment();
  await goToItemsStep();
  await goToReviewStep();
}

function createExtraction(overrides: Record<string, unknown> = {}) {
  const expenseRequestItems = [
    {
      id: "pdf-item-1",
      code: "0005091",
      description: "Servico extraido",
      quantity: "1",
      unit: "SERVI",
      unitValue: "0,00",
      totalValue: "0,00",
      source: "pdf",
    },
  ];
  const extractedFields = {
    budgetUnitCode: "06.001",
    budgetUnitName: "Secretaria de Educacao",
    issueDate: "2026-01-08",
    item: {
      code: "0005091",
      description: "Servico extraido",
      quantity: "1",
      unit: "SERVI",
      unitValue: "0,00",
      totalValue: "0,00",
    },
    itemDescription: "Servico extraido",
    items: [
      {
        code: "0005091",
        description: "Servico extraido",
        quantity: "1",
        unit: "SERVI",
        unitValue: "0,00",
        totalValue: "0,00",
      },
    ],
    object: "Objeto extraido",
    organizationCnpj: "00.000.000/0001-00",
    organizationName: "Prefeitura",
    processType: "Servico",
    requestNumber: "6",
    responsibleName: "Maria PDF",
    responsibleRole: null,
    totalValue: "0,00",
  };

  return {
    fileName: "SD.pdf",
    rawText: "text",
    suggestions: {
      type: "Servico",
      processNumber: "SD-6-2026",
      externalId: "6",
      issuedAt: "2026-01-08",
      title: "Servico extraido",
      object: "Objeto extraido",
      justification: "Justificativa extraida",
      responsibleName: "Maria PDF",
      expenseRequestItems,
      sourceKind: "expense_request",
      sourceReference: "SD-6-2026",
      sourceMetadata: { extractedFields, warnings: [] },
    },
    extractedFields,
    warnings: [],
    ...overrides,
  };
}

describe("ProcessCreatePage", () => {
  beforeEach(() => {
    extractExpenseRequestFromPdf.mockReset();
  });

  it("submits reviewed manual process data", async () => {
    let requestBody: unknown = null;

    server.use(
      http.get("http://localhost:3333/api/auth/get-session", () =>
        HttpResponse.json(authenticatedSessionResponse),
      ),
      http.post("http://localhost:3333/api/processes/", async ({ request }) => {
        requestBody = await request.json();

        return HttpResponse.json(
          {
            id: "process-created",
            organizationId: "organization-1",
            type: "pregao",
            processNumber: "PROC-2026-001",
            externalId: null,
            issuedAt: "2026-01-08T00:00:00.000Z",
            title: "Objeto do processo",
            object: "Objeto do processo",
            justification: "Justificativa do processo",
            responsibleName: "Maria Costa",
            status: "draft",
            sourceKind: null,
            sourceReference: null,
            sourceMetadata: null,
            departmentIds: ["department-1"],
            createdAt: "2026-04-26T00:00:00.000Z",
            updatedAt: "2026-04-26T00:00:00.000Z",
          },
          { status: 201 },
        );
      }),
    );

    renderCreatePage();

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Novo Processo" })).toBeInTheDocument();
    });

    await reachReviewStep();
    fireEvent.click(screen.getByRole("button", { name: /Criar Processo/ }));

    await waitFor(() => {
      expect(requestBody).toMatchObject({
        type: "pregao",
        processNumber: "PROC-2026-001",
        issuedAt: "2026-01-08T00:00:00.000Z",
        title: "Objeto do processo",
        object: "Objeto do processo",
        justification: "Justificativa do processo",
        responsibleName: "Maria Costa",
        departmentIds: ["department-1"],
      });
    });
  });

  it("adds, edits, removes, and submits manual SD items in metadata", async () => {
    let requestBody: unknown = null;

    server.use(
      http.get("http://localhost:3333/api/auth/get-session", () =>
        HttpResponse.json(authenticatedSessionResponse),
      ),
      http.post("http://localhost:3333/api/processes/", async ({ request }) => {
        requestBody = await request.json();

        return HttpResponse.json(
          {
            id: "process-created",
            organizationId: "organization-1",
            type: "pregao",
            processNumber: "PROC-ITENS",
            externalId: null,
            issuedAt: "2026-01-08T00:00:00.000Z",
            title: "Objeto do processo",
            object: "Objeto do processo",
            justification: "Justificativa do processo",
            responsibleName: "Maria Costa",
            status: "draft",
            sourceKind: null,
            sourceReference: null,
            sourceMetadata: null,
            departmentIds: ["department-1"],
            createdAt: "2026-04-26T00:00:00.000Z",
            updatedAt: "2026-04-26T00:00:00.000Z",
          },
          { status: 201 },
        );
      }),
    );

    renderCreatePage();

    await fillRequiredFields("PROC-ITENS");
    await goToLinksStep();
    await selectDefaultDepartment();
    await goToItemsStep();
    fireEvent.click(screen.getByRole("button", { name: "Item simples" }));
    fireEvent.change(screen.getByLabelText("Codigo do item 1"), {
      target: { value: "0005909" },
    });
    fireEvent.change(screen.getByLabelText("Título do item 1"), {
      target: { value: "Pote plastico" },
    });
    fireEvent.change(screen.getByLabelText("Descricao do item 1"), {
      target: { value: "Pote plastico" },
    });
    fireEvent.change(screen.getByLabelText("Quantidade do item 1"), {
      target: { value: "550" },
    });
    fireEvent.change(screen.getByLabelText("Unidade do item 1"), {
      target: { value: "UN" },
    });
    fireEvent.change(screen.getByLabelText("Valor unitario do item 1"), {
      target: { value: "0,00" },
    });
    fireEvent.change(screen.getByLabelText("Valor total do item 1"), {
      target: { value: "0,00" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Item simples" }));
    fireEvent.change(screen.getByLabelText("Descricao do item 2"), {
      target: { value: "Linha removida" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Remover item 2" }));

    await goToReviewStep();
    fireEvent.click(screen.getByRole("button", { name: /Criar Processo/ }));

    await waitFor(() => {
      expect(requestBody).toMatchObject({
        sourceMetadata: {
          extractedFields: {
            item: {
              code: "0005909",
              title: "Pote plastico",
              description: "Pote plastico",
            },
            items: [
              {
                code: "0005909",
                title: "Pote plastico",
                description: "Pote plastico",
                quantity: "550",
                unit: "UN",
                unitValue: "0,00",
                totalValue: "0,00",
              },
            ],
          },
          source: {
            inputMode: "native_form",
          },
        },
      });
    });
    expect(JSON.stringify(requestBody)).not.toContain("Linha removida");
  });

  it("submits kit items with separated components in metadata", async () => {
    let requestBody: unknown = null;

    server.use(
      http.get("http://localhost:3333/api/auth/get-session", () =>
        HttpResponse.json(authenticatedSessionResponse),
      ),
      http.post("http://localhost:3333/api/processes/", async ({ request }) => {
        requestBody = await request.json();

        return HttpResponse.json(
          {
            id: "process-created",
            organizationId: "organization-1",
            type: "pregao",
            processNumber: "PROC-KIT",
            externalId: null,
            issuedAt: "2026-01-08T00:00:00.000Z",
            title: "Objeto do processo",
            object: "Objeto do processo",
            justification: "Justificativa do processo",
            responsibleName: "Maria Costa",
            status: "draft",
            sourceKind: null,
            sourceReference: null,
            sourceMetadata: null,
            departmentIds: ["department-1"],
            createdAt: "2026-04-26T00:00:00.000Z",
            updatedAt: "2026-04-26T00:00:00.000Z",
          },
          { status: 201 },
        );
      }),
    );

    renderCreatePage();

    await fillRequiredFields("PROC-KIT");
    await goToLinksStep();
    await selectDefaultDepartment();
    await goToItemsStep();

    fireEvent.click(screen.getByRole("button", { name: "Kit" }));
    fireEvent.change(screen.getByLabelText("Título do item 1"), {
      target: { value: "Kit escolar" },
    });
    fireEvent.change(screen.getByLabelText("Descricao do item 1"), {
      target: { value: "Conjunto de materiais escolares" },
    });
    fireEvent.change(screen.getByLabelText("Quantidade do item 1"), {
      target: { value: "100" },
    });
    fireEvent.change(screen.getByLabelText("Unidade do item 1"), {
      target: { value: "KIT" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Adicionar componente" }));
    fireEvent.change(screen.getByLabelText("Título do componente 1 do item 1"), {
      target: { value: "Caderno brochura" },
    });
    fireEvent.change(screen.getByLabelText("Descricao do componente 1 do item 1"), {
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
    expect(screen.getByText("Caderno brochura")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Criar Processo/ }));

    await waitFor(() => {
      expect(requestBody).toMatchObject({
        sourceMetadata: {
          extractedFields: {
            items: [
              {
                kind: "kit",
                title: "Kit escolar",
                description: "Conjunto de materiais escolares",
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
              },
            ],
          },
          source: {
            inputMode: "native_form",
          },
        },
      });
    });
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

    expect(await screen.findByLabelText("Organizacao")).toBeInTheDocument();
  });

  it("opens a subtle import dialog and applies previewed PDF data", async () => {
    extractExpenseRequestFromPdf.mockResolvedValue(createExtraction());
    server.use(
      http.get("http://localhost:3333/api/auth/get-session", () =>
        HttpResponse.json(authenticatedSessionResponse),
      ),
    );

    renderCreatePage();

    expect(screen.queryByText("Importar PDF TopDown")).not.toBeInTheDocument();

    fireEvent.click(await screen.findByRole("button", { name: "Importar SD" }));
    expect(await screen.findByRole("dialog")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Selecionar PDF TopDown"), {
      target: { files: [new File(["pdf"], "SD.pdf", { type: "application/pdf" })] },
    });

    expect(await screen.findByText("Preview de SD.pdf")).toBeInTheDocument();
    expect(screen.getAllByText("Servico extraido").length).toBeGreaterThan(0);
    expect(screen.getByText("Itens encontrados")).toBeInTheDocument();
    expect(screen.getByText("1 item")).toBeInTheDocument();
    expect(screen.queryByDisplayValue("SD-6-2026")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Aplicar dados" }));

    expect(await screen.findByDisplayValue("SD-6-2026")).toBeInTheDocument();
    expect(screen.getByLabelText("Título")).toHaveValue("Servico extraido");
    expect(screen.getByDisplayValue("Objeto extraido")).toBeInTheDocument();
    expect(screen.getByText("Dados importados de SD.pdf")).toBeInTheDocument();
    await goToLinksStep();
    await selectDefaultDepartment();
    await goToItemsStep();
    expect(screen.getByText("Itens da Solicitação")).toBeInTheDocument();
    expect(screen.getByLabelText("Codigo do item 1")).toHaveValue("0005091");
    expect(screen.getByLabelText("Descricao do item 1")).toHaveValue("Servico extraido");

    fireEvent.click(screen.getByRole("button", { name: "Voltar" }));
    fireEvent.click(screen.getByRole("button", { name: "Voltar" }));
    fireEvent.change(await screen.findByLabelText("Objeto"), {
      target: { value: "Objeto revisado" },
    });

    expect(screen.getByLabelText("Objeto")).toHaveValue("Objeto revisado");
  });

  it("keeps form values unchanged when the import dialog is cancelled", async () => {
    extractExpenseRequestFromPdf.mockResolvedValue(createExtraction());
    renderCreatePage();

    fireEvent.change(await screen.findByLabelText("Numero do processo"), {
      target: { value: "PROC-MANUAL" },
    });
    fireEvent.change(screen.getByLabelText("Objeto"), {
      target: { value: "Objeto manual" },
    });
    fireEvent.change(screen.getByLabelText("Título"), {
      target: { value: "Titulo manual" },
    });
    fireEvent.change(screen.getByLabelText("Data de emissao"), {
      target: { value: "2026-01-08" },
    });
    fireEvent.change(screen.getByLabelText("Justificativa"), {
      target: { value: "Justificativa manual" },
    });
    fireEvent.change(screen.getByLabelText("Responsavel"), {
      target: { value: "Maria Costa" },
    });
    await goToLinksStep();
    await selectDefaultDepartment();
    await goToItemsStep();
    fireEvent.click(screen.getByRole("button", { name: "Item simples" }));
    fireEvent.change(screen.getByLabelText("Descricao do item 1"), {
      target: { value: "Item manual preservado" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Importar SD" }));
    fireEvent.change(await screen.findByLabelText("Selecionar PDF TopDown"), {
      target: { files: [new File(["pdf"], "SD.pdf", { type: "application/pdf" })] },
    });

    expect(await screen.findByText("Preview de SD.pdf")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));

    expect(screen.getByDisplayValue("Item manual preservado")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Voltar" }));
    fireEvent.click(screen.getByRole("button", { name: "Voltar" }));
    expect(await screen.findByDisplayValue("PROC-MANUAL")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Titulo manual")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Objeto manual")).toBeInTheDocument();
    expect(screen.queryByText("Dados importados de SD.pdf")).not.toBeInTheDocument();
  });

  it("replaces applied PDF item rows when a second import is applied", async () => {
    extractExpenseRequestFromPdf.mockResolvedValueOnce(createExtraction()).mockResolvedValueOnce(
      createExtraction({
        fileName: "SD-2.pdf",
        suggestions: {
          ...createExtraction().suggestions,
          processNumber: "SD-7-2026",
          expenseRequestItems: [
            {
              id: "pdf-item-2",
              code: "0005910",
              description: "Kit com 2 potes",
              quantity: "550",
              unit: "KIT",
              unitValue: "0,00",
              totalValue: "0,00",
              source: "pdf",
            },
          ],
        },
        extractedFields: {
          ...createExtraction().extractedFields,
          items: [
            {
              code: "0005910",
              description: "Kit com 2 potes",
              quantity: "550",
              unit: "KIT",
              unitValue: "0,00",
              totalValue: "0,00",
            },
          ],
        },
      }),
    );

    renderCreatePage();

    fireEvent.click(await screen.findByRole("button", { name: "Importar SD" }));
    fireEvent.change(screen.getByLabelText("Selecionar PDF TopDown"), {
      target: { files: [new File(["pdf"], "SD.pdf", { type: "application/pdf" })] },
    });
    expect(await screen.findByText("Preview de SD.pdf")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Aplicar dados" }));
    await goToLinksStep();
    await selectDefaultDepartment();
    await goToItemsStep();
    expect(await screen.findByLabelText("Codigo do item 1")).toHaveValue("0005091");

    fireEvent.click(screen.getByRole("button", { name: "Substituir PDF" }));
    fireEvent.change(await screen.findByLabelText("Selecionar PDF TopDown"), {
      target: { files: [new File(["pdf"], "SD-2.pdf", { type: "application/pdf" })] },
    });
    expect(await screen.findByText("Preview de SD-2.pdf")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Aplicar dados" }));

    expect(await screen.findByLabelText("Codigo do item 1")).toHaveValue("0005910");
    expect(screen.getByLabelText("Descricao do item 1")).toHaveValue("Kit com 2 potes");
    expect(screen.queryByLabelText("Descricao do item 2")).not.toBeInTheDocument();
  });

  it("shows parsing error categories inside the import dialog", async () => {
    extractExpenseRequestFromPdf
      .mockRejectedValueOnce(
        Object.assign(new Error("O PDF nao parece ser uma Solicitacao de Despesa TopDown."), {
          reason: "unrecognized_sd",
        }),
      )
      .mockRejectedValueOnce(
        Object.assign(new Error("Campos obrigatorios nao foram encontrados."), {
          reason: "missing_required_fields",
        }),
      );

    renderCreatePage();

    fireEvent.click(await screen.findByRole("button", { name: "Importar SD" }));
    fireEvent.change(screen.getByLabelText("Selecionar PDF TopDown"), {
      target: { files: [new File(["pdf"], "relatorio.pdf", { type: "application/pdf" })] },
    });

    expect(await screen.findByText("Solicitacao nao reconhecida")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Selecionar PDF TopDown"), {
      target: { files: [new File(["pdf"], "SD-incompleta.pdf", { type: "application/pdf" })] },
    });

    expect(await screen.findByText("Dados obrigatorios ausentes")).toBeInTheDocument();
  });

  it("shows matching warnings without treating the PDF as unreadable", async () => {
    extractExpenseRequestFromPdf.mockResolvedValue(
      createExtraction({
        extractedFields: {
          ...createExtraction().extractedFields,
          budgetUnitCode: "99.999",
        },
      }),
    );

    renderCreatePage();

    fireEvent.click(await screen.findByRole("button", { name: "Importar SD" }));
    fireEvent.change(screen.getByLabelText("Selecionar PDF TopDown"), {
      target: { files: [new File(["pdf"], "SD.pdf", { type: "application/pdf" })] },
    });

    expect(await screen.findByText("Preview de SD.pdf")).toBeInTheDocument();
    expect(
      screen.getByText("Unidade orcamentaria extraida nao foi encontrada no cadastro."),
    ).toBeInTheDocument();
    expect(screen.queryByText("PDF nao lido")).not.toBeInTheDocument();
  });

  it("shows diagnostic PDF extraction and backend rejection errors without leaving the form", async () => {
    extractExpenseRequestFromPdf.mockRejectedValue(
      Object.assign(new Error("PDF sem texto selecionavel."), { reason: "empty_text" }),
    );
    server.resetHandlers(
      http.get("http://localhost:3333/api/auth/get-session", () =>
        HttpResponse.json(authenticatedSessionResponse),
      ),
      http.get("http://localhost:3333/api/departments/", () =>
        HttpResponse.json({
          items: [
            {
              id: "department-1",
              name: "Secretaria de Educacao",
              slug: "secretaria-de-educacao",
              organizationId: "organization-1",
              budgetUnitCode: "06.001",
              responsibleName: "Maria Costa",
              responsibleRole: "Secretaria",
              createdAt: "2026-04-01T00:00:00.000Z",
              updatedAt: "2026-04-01T00:00:00.000Z",
            },
          ],
          page: 1,
          pageSize: 100,
          total: 1,
          totalPages: 1,
        }),
      ),
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

    fireEvent.click(await screen.findByRole("button", { name: "Importar SD" }));
    fireEvent.change(screen.getByLabelText("Selecionar PDF TopDown"), {
      target: { files: [new File(["pdf"], "SD.pdf", { type: "application/pdf" })] },
    });

    expect(await screen.findByText("PDF nao lido")).toBeInTheDocument();
    expect(await screen.findByText("PDF sem texto selecionavel.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));

    await reachReviewStep("PROC-CONFLICT");
    fireEvent.click(screen.getByRole("button", { name: /Criar Processo/ }));

    expect(await screen.findByText("Process number already exists.")).toBeInTheDocument();
  });
});
