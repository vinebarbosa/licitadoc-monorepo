import { expect, test } from "@playwright/test";

test("authenticated user can navigate to documents listing page", async ({ page }) => {
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

  await page.route("**/api/documents/**", async (route) => {
    const pathname = new URL(route.request().url()).pathname;

    if (pathname === "/api/documents/document-1") {
      await route.fulfill({
        json: {
          id: "document-1",
          name: "DFD - PE-2024-045",
          organizationId: "organization-1",
          processId: "process-1",
          processNumber: "PE-2024-045",
          type: "dfd",
          status: "completed",
          responsibles: ["Maria Costa"],
          createdAt: "2024-03-20T00:00:00.000Z",
          updatedAt: "2024-03-20T00:00:00.000Z",
          draftContent: "DOCUMENTO DE FORMALIZACAO DE DEMANDA\n\nContratacao de Servicos de TI.",
          storageKey: null,
        },
      });
      return;
    }

    await route.fulfill({
      json: {
        items: [
          {
            id: "document-1",
            name: "DFD - PE-2024-045",
            organizationId: "organization-1",
            processId: "process-1",
            processNumber: "PE-2024-045",
            type: "dfd",
            status: "completed",
            responsibles: ["Maria Costa"],
            createdAt: "2024-03-20T00:00:00.000Z",
            updatedAt: "2024-03-20T00:00:00.000Z",
          },
          {
            id: "document-2",
            name: "ETP - PE-2024-045",
            organizationId: "organization-1",
            processId: "process-1",
            processNumber: "PE-2024-045",
            type: "etp",
            status: "generating",
            responsibles: ["Maria Costa"],
            createdAt: "2024-03-21T00:00:00.000Z",
            updatedAt: "2024-03-21T00:00:00.000Z",
          },
        ],
      },
    });
  });

  await page.goto("/app/documentos");

  await expect(page.getByRole("heading", { name: "Documentos" })).toBeVisible();
  await expect(page.getByRole("link", { name: /Novo Documento/ })).toBeVisible();

  await expect(page.getByRole("link", { name: "DFD - PE-2024-045" })).toBeVisible();
  await expect(page.getByRole("link", { name: "ETP - PE-2024-045" })).toBeVisible();

  await expect(page.getByText("Total")).toBeVisible();
  await expect(page.getByText("Concluídos")).toBeVisible();
});

test("authenticated user can open a document preview page", async ({ page }) => {
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

  await page.route("**/api/documents/document-1", async (route) => {
    await route.fulfill({
      json: {
        id: "document-1",
        name: "DFD - PE-2024-045",
        organizationId: "organization-1",
        processId: "process-1",
        processNumber: "PE-2024-045",
        type: "dfd",
        status: "completed",
        responsibles: ["Maria Costa"],
        createdAt: "2024-03-20T00:00:00.000Z",
        updatedAt: "2024-03-20T00:00:00.000Z",
        draftContent:
          "# DOCUMENTO DE FORMALIZACAO DE DEMANDA (DFD)\n\n**Processo:** PE-2024-045\n\n## 1. Objeto\n\nContratacao de Servicos de TI para suporte tecnico especializado.\n\n- Suporte a infraestrutura de rede\n- Manutencao de servidores\n\n| Item | Valor |\n|------|-------|\n| Suporte mensal | R$ 5.000,00 |\n",
        storageKey: null,
      },
    });
  });

  await page.goto("/app/documento/document-1/preview");

  await expect(page.getByRole("heading", { name: "DFD - PE-2024-045" })).toBeVisible();
  await expect(page.getByText("Preview do Documento")).toBeVisible();

  // Markdown content renders as semantic elements
  await expect(
    page.getByRole("heading", { level: 1, name: /DOCUMENTO DE FORMALIZACAO DE DEMANDA/ }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { level: 2, name: /1\. Objeto/ })).toBeVisible();
  await expect(page.getByText(/Contratacao de Servicos de TI/)).toBeVisible();
  await expect(page.getByRole("table")).toBeVisible();
  await expect(page.locator("article").getByRole("list")).toBeVisible();
});
