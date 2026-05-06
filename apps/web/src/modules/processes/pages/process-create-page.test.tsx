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

  fireEvent.click(await screen.findByText("06.001 - Secretaria de Educacao"));
}

function createExtraction(overrides: Record<string, unknown> = {}) {
  return {
    fileName: "SD.pdf",
    rawText: "text",
    suggestions: {
      type: "Servico",
      processNumber: "SD-6-2026",
      externalId: "6",
      issuedAt: "2026-01-08",
      object: "Objeto extraido",
      justification: "Justificativa extraida",
      responsibleName: "Maria PDF",
      sourceKind: "expense_request",
      sourceReference: "SD-6-2026",
      sourceMetadata: { warnings: [] },
    },
    extractedFields: {
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
      object: "Objeto extraido",
      organizationCnpj: "00.000.000/0001-00",
      organizationName: "Prefeitura",
      processType: "Servico",
      requestNumber: "6",
      responsibleName: "Maria PDF",
      responsibleRole: null,
      totalValue: "0,00",
    },
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

    await fillRequiredFields();
    fireEvent.click(screen.getByRole("button", { name: /Criar Processo/ }));

    await waitFor(() => {
      expect(requestBody).toMatchObject({
        type: "pregao",
        processNumber: "PROC-2026-001",
        issuedAt: "2026-01-08T00:00:00.000Z",
        object: "Objeto do processo",
        justification: "Justificativa do processo",
        responsibleName: "Maria Costa",
        departmentIds: ["department-1"],
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
    expect(screen.queryByDisplayValue("SD-6-2026")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Aplicar dados" }));

    expect(await screen.findByDisplayValue("SD-6-2026")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Objeto extraido")).toBeInTheDocument();
    expect(screen.getByText("Dados importados de SD.pdf")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Objeto"), {
      target: { value: "Objeto revisado" },
    });

    expect(screen.getByDisplayValue("Objeto revisado")).toBeInTheDocument();
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

    fireEvent.click(screen.getByRole("button", { name: "Importar SD" }));
    fireEvent.change(await screen.findByLabelText("Selecionar PDF TopDown"), {
      target: { files: [new File(["pdf"], "SD.pdf", { type: "application/pdf" })] },
    });

    expect(await screen.findByText("Preview de SD.pdf")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));

    expect(screen.getByDisplayValue("PROC-MANUAL")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Objeto manual")).toBeInTheDocument();
    expect(screen.queryByText("Dados importados de SD.pdf")).not.toBeInTheDocument();
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

    await fillRequiredFields("PROC-CONFLICT");
    fireEvent.click(screen.getByRole("button", { name: /Criar Processo/ }));

    expect(await screen.findByText("Process number already exists.")).toBeInTheDocument();
  });
});
