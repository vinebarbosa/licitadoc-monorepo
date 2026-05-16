import { expect, type Page, test } from "@playwright/test";

async function mockAuthenticatedApp(page: Page) {
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
          onboardingStatus: "complete",
          createdAt: "2026-04-25T00:00:00.000Z",
          updatedAt: "2026-04-25T00:00:00.000Z",
        },
      },
    });
  });

  await page.route("**/api/processes/**", async (route) => {
    await route.fulfill({
      json: {
        items: [],
        page: 1,
        pageSize: 5,
        total: 0,
        totalPages: 0,
      },
    });
  });
}

test("public routes do not show the contextual help widget", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", { name: "Documentos para Contratações Públicas" }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Abrir ajuda" })).toHaveCount(0);
});

test("authenticated app shell shows a responsive contextual help widget", async ({ page }) => {
  await mockAuthenticatedApp(page);

  await page.goto("/app");

  await expect(page.getByRole("button", { name: "Abrir ajuda" })).toBeVisible();
  await page.getByRole("button", { name: "Abrir ajuda" }).click();

  await expect(page.getByRole("region", { name: "Ajuda do LicitaDoc" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Ajuda na Central de Trabalho" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Sugestões" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Ações rápidas" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Falar com suporte" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Gerar documento" })).toHaveCount(0);

  await page.getByRole("button", { name: "Ações rápidas" }).click();
  await expect(page.getByRole("button", { name: "Gerar documento" })).toBeVisible();

  await page.setViewportSize({ width: 390, height: 844 });
  const panel = page.getByRole("region", { name: "Ajuda do LicitaDoc" });
  await expect(panel).toBeVisible();

  const box = await panel.boundingBox();
  expect(box).not.toBeNull();
  expect(box?.x).toBeGreaterThanOrEqual(0);
  expect(box?.width).toBeLessThanOrEqual(390);
});

test("authenticated help widget support flow stays inside the panel", async ({ page }) => {
  await mockAuthenticatedApp(page);

  await page.goto("/app");

  await page.getByRole("button", { name: "Abrir ajuda" }).click();
  await page.getByRole("button", { name: "Falar com suporte" }).click();

  await expect(page.getByRole("button", { name: "Anexar captura de tela" })).toBeVisible();
  await expect(page.getByText("Rota")).toHaveCount(0);
  await expect(page.getByRole("textbox", { name: "Descrição para o suporte" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Iniciar chat" })).toBeDisabled();

  await page.getByRole("button", { name: "Anexar captura de tela" }).click();
  await expect(page.getByRole("button", { name: "Remover captura de tela" })).toBeVisible();
  await page
    .getByRole("textbox", { name: "Descrição para o suporte" })
    .fill("Não consigo continuar um documento");
  await page.getByRole("button", { name: "Iniciar chat" }).click();

  await expect(page.getByText(/Atendimento LD-HOME/)).toBeVisible();
  await expect(page.getByRole("img", { name: "Prévia da captura de tela anexada" })).toBeVisible();
  await expect(page.getByText("Captura de tela")).toBeVisible();
  await expect(page.getByText("Não consigo continuar um documento")).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Mensagem para o suporte" })).toBeVisible();

  await page.getByRole("textbox", { name: "Mensagem para o suporte" }).fill("Aparece erro");
  await page.getByRole("button", { name: "Enviar mensagem para o suporte" }).click();

  await expect(page.getByText("Aparece erro")).toBeVisible();
  await expect(page.getByText(/Entendi o erro/)).toBeVisible();

  await page.getByRole("button", { name: "Voltar ao assistente" }).click();
  await expect(page.getByRole("textbox", { name: "Mensagem para ajuda" })).toBeVisible();
});

test("authenticated help widget shows support history and reopens requests", async ({ page }) => {
  await mockAuthenticatedApp(page);

  await page.goto("/app");

  await page.getByRole("button", { name: "Abrir ajuda" }).click();
  await page.getByRole("button", { name: "Falar com suporte" }).click();
  await page.getByRole("button", { name: "Meus atendimentos" }).click();

  await expect(page.getByText("Meus atendimentos")).toBeVisible();
  await expect(
    page.getByRole("button", { name: /Dúvida sobre documento em geração/ }),
  ).toBeVisible();
  await expect(page.getByText("Resolvido")).toBeVisible();

  await page.getByRole("button", { name: /Dúvida sobre documento em geração/ }).click();

  await expect(page.getByText(/Atendimento LD-DOCUMENTOS-1233/)).toBeVisible();
  await expect(page.getByText("O documento ficou em geração por muito tempo.")).toBeVisible();
  await expect(page.getByText("Este atendimento foi resolvido.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Novo atendimento" })).toBeVisible();
});
