import { Buffer } from "node:buffer";
import { expect, test } from "@playwright/test";

test("authenticated user can open and submit the process creation form", async ({ page }) => {
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
    await route.fulfill({
      json: {
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
      },
    });
  });
  await page.route("**/api/departments/**", async (route) => {
    await route.fulfill({
      json: {
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
      },
    });
  });
  await page.route("**/api/processes/", async (route) => {
    if (route.request().method() === "POST") {
      await route.fulfill({
        status: 201,
        json: {
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
      });
      return;
    }

    await route.fulfill({
      json: {
        items: [],
        page: 1,
        pageSize: 10,
        total: 0,
        totalPages: 0,
      },
    });
  });

  await page.goto("/app/processo/novo");

  await expect(page.getByRole("heading", { name: "Novo Processo" })).toBeVisible();
  await expect(page.getByText("Importar PDF TopDown")).toHaveCount(0);

  await page.getByRole("button", { name: "Importar SD" }).click();
  await expect(page.getByRole("dialog", { name: "Importar SD TopDown" })).toBeVisible();
  await page.getByLabel("Selecionar PDF TopDown").setInputFiles({
    name: "invalid.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.from("%PDF-1.4\n"),
  });
  await expect(page.getByText("PDF nao lido")).toBeVisible();
  expect(browserErrors.join("\n")).not.toContain("GlobalWorkerOptions.workerSrc");
  await page.getByRole("button", { name: "Cancelar" }).click();
  await expect(page.getByRole("dialog", { name: "Importar SD TopDown" })).toHaveCount(0);

  await page.getByLabel("Numero do processo").fill("PROC-2026-001");
  await page.getByLabel("Data de emissao").fill("2026-01-08");
  await page.getByLabel("Objeto").fill("Objeto do processo");
  await page.getByLabel("Justificativa").fill("Justificativa do processo");
  await page.getByLabel("Responsavel").fill("Maria Costa");
  await page.getByText("06.001 - Secretaria de Educacao").click();
  await page.getByRole("button", { name: /Criar Processo/ }).click();

  await expect(page).toHaveURL(/\/app\/processos\?created=process-created/);
});
