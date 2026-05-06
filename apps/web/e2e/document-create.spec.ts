import { expect, test } from "@playwright/test";

const SESSION_FIXTURE = {
  session: {
    id: "session-1",
    token: "session-token",
    userId: "user-1",
    expiresAt: "2026-05-25T00:00:00.000Z",
    createdAt: "2026-04-25T00:00:00.000Z",
    updatedAt: "2026-04-25T00:00:00.000Z",
  },
  user: {
    id: "user-1",
    name: "Maria Silva",
    email: "maria@licitadoc.test",
    role: "member",
    organizationId: "organization-1",
    createdAt: "2026-04-25T00:00:00.000Z",
    updatedAt: "2026-04-25T00:00:00.000Z",
  },
};

const PROCESSES_FIXTURE = {
  items: [
    {
      id: "process-1",
      organizationId: "organization-1",
      type: "pregao-eletronico",
      processNumber: "PE-2024-045",
      externalId: null,
      issuedAt: "2024-03-01T00:00:00.000Z",
      object: "Contratação de Serviços de TI",
      justification: "Necessidade de suporte técnico especializado.",
      responsibleName: "Maria Costa",
      status: "em_edicao",
      sourceKind: null,
      sourceReference: null,
      sourceMetadata: null,
      departmentIds: ["department-1"],
      createdAt: "2024-03-01T00:00:00.000Z",
      updatedAt: "2024-03-28T00:00:00.000Z",
      documents: {
        completedCount: 1,
        totalRequiredCount: 4,
        completedTypes: ["dfd"],
        missingTypes: ["etp", "tr", "minuta"],
      },
      listUpdatedAt: "2024-03-28T00:00:00.000Z",
    },
  ],
  page: 1,
  pageSize: 100,
  total: 1,
  totalPages: 1,
};

const DOCUMENT_CREATED_FIXTURE = {
  id: "document-created",
  name: "DFD - PE-2024-045",
  organizationId: "organization-1",
  processId: "process-1",
  processNumber: "PE-2024-045",
  type: "dfd",
  status: "generating",
  responsibles: ["Maria Silva"],
  createdAt: "2026-04-26T00:00:00.000Z",
  updatedAt: "2026-04-26T00:00:00.000Z",
};

test("authenticated user can reach /app/documento/novo and complete the create flow", async ({
  page,
}) => {
  const browserErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") {
      browserErrors.push(message.text());
    }
  });
  page.on("pageerror", (error) => {
    browserErrors.push(error.message);
  });

  await page.route("**/api/auth/get-session", async (route) => {
    await route.fulfill({ json: SESSION_FIXTURE });
  });

  await page.route("**/api/processes/**", async (route) => {
    await route.fulfill({ json: PROCESSES_FIXTURE });
  });

  await page.route("**/api/documents/**", async (route) => {
    if (route.request().method() === "POST") {
      await route.fulfill({ status: 201, json: DOCUMENT_CREATED_FIXTURE });
    } else {
      await route.fulfill({ json: { items: [] } });
    }
  });

  await page.goto("/app/documento/novo");

  // Page renders inside the protected shell
  await expect(page.getByRole("heading", { name: "Novo Documento" })).toBeVisible();
  await expect(page.getByText("Selecione o tipo de documento que deseja criar")).toBeVisible();

  // All four type cards are visible
  await expect(page.getByRole("button", { name: "Selecionar DFD" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Selecionar ETP" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Selecionar TR" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Selecionar Minuta" })).toBeVisible();

  // Select the DFD type
  await page.getByRole("button", { name: "Selecionar DFD" }).click();
  await expect(page.getByText("Selecionado")).toBeVisible();

  // Select a process
  await page.getByRole("combobox").click();
  await page.getByRole("option", { name: /PE-2024-045/ }).click();

  // Name should be auto-generated
  const nameInput = page.getByLabel("Nome do Documento");
  await expect(nameInput).toHaveValue("DFD - PE-2024-045");

  // Submit
  await page.getByRole("button", { name: /Criar e Editar/i }).click();

  // Should navigate to documents list after success
  await expect(page).toHaveURL(/\/app\/documentos$/);

  expect(browserErrors.filter((e) => !e.includes("favicon"))).toHaveLength(0);
});
