import { expect, test } from "@playwright/test";

test("authenticated user can open process detail from the processes listing", async ({ page }) => {
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

  await page.route("**/api/processes**", async (route) => {
    const url = new URL(route.request().url());

    if (url.pathname === "/api/processes/") {
      await route.fulfill({
        json: {
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
                completedCount: 2,
                totalRequiredCount: 4,
                completedTypes: ["dfd", "etp"],
                missingTypes: ["tr", "minuta"],
              },
              listUpdatedAt: "2024-03-28T00:00:00.000Z",
            },
          ],
          page: 1,
          pageSize: 10,
          total: 1,
          totalPages: 1,
        },
      });
      return;
    }

    if (url.pathname === "/api/processes/process-1") {
      await route.fulfill({
        json: {
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
          createdAt: "2024-03-15T00:00:00.000Z",
          updatedAt: "2024-03-28T00:00:00.000Z",
          departments: [
            {
              id: "department-1",
              organizationId: "organization-1",
              name: "Secretaria de Educacao",
              budgetUnitCode: "06.001",
              label: "06.001 - Secretaria de Educacao",
            },
          ],
          estimatedValue: "R$ 450.000,00",
          documents: [
            {
              type: "dfd",
              label: "DFD",
              title: "Documento de Formalização de Demanda",
              description: "Justificativa da necessidade de contratação",
              status: "concluido",
              documentId: "document-1",
              lastUpdatedAt: "2024-03-20T00:00:00.000Z",
              progress: null,
              availableActions: {
                create: false,
                edit: true,
                view: true,
              },
            },
            {
              type: "etp",
              label: "ETP",
              title: "Estudo Técnico Preliminar",
              description: "Análise técnica e levantamento de soluções",
              status: "em_edicao",
              documentId: "document-2",
              lastUpdatedAt: "2024-03-28T00:00:00.000Z",
              progress: 75,
              availableActions: {
                create: false,
                edit: true,
                view: true,
              },
            },
            {
              type: "tr",
              label: "TR",
              title: "Termo de Referência",
              description: "Especificações técnicas e requisitos",
              status: "pendente",
              documentId: null,
              lastUpdatedAt: null,
              progress: null,
              availableActions: {
                create: true,
                edit: false,
                view: false,
              },
            },
            {
              type: "minuta",
              label: "Minuta",
              title: "Minuta do Contrato",
              description: "Cláusulas e condições contratuais",
              status: "erro",
              documentId: "document-3",
              lastUpdatedAt: "2024-03-26T00:00:00.000Z",
              progress: null,
              availableActions: {
                create: false,
                edit: true,
                view: true,
              },
            },
          ],
          detailUpdatedAt: "2024-03-28T00:00:00.000Z",
        },
      });
      return;
    }

    await route.fallback();
  });

  await page.goto("/app/processos");

  await expect(page.getByRole("heading", { name: "Processos de Contratação" })).toBeVisible();
  await page.getByRole("link", { name: "PE-2024-045" }).click();

  await expect(page).toHaveURL(/\/app\/processo\/process-1$/);
  await expect(page.getByRole("heading", { name: "Contratação de Serviços de TI" })).toBeVisible();
  await expect(page.getByText("Documentos do Processo")).toBeVisible();
  await expect(page.getByText("Estudo Técnico Preliminar")).toBeVisible();
  await expect(page.getByText("R$ 450.000,00")).toBeVisible();
});
