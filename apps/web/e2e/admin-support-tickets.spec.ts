import { expect, type Page, test } from "@playwright/test";

async function mockAdminSession(page: Page) {
  await page.route("**/api/auth/get-session", async (route) => {
    await route.fulfill({
      json: {
        session: {
          id: "session-1",
          token: "session-token",
          userId: "admin-1",
          expiresAt: "2026-05-25T00:00:00.000Z",
          createdAt: "2026-04-25T00:00:00.000Z",
          updatedAt: "2026-04-25T00:00:00.000Z",
        },
        user: {
          id: "admin-1",
          name: "Maria Silva",
          email: "maria@licitadoc.test",
          role: "admin",
          organizationId: null,
          onboardingStatus: "complete",
          createdAt: "2026-04-25T00:00:00.000Z",
          updatedAt: "2026-04-25T00:00:00.000Z",
        },
      },
    });
  });
}

test("admin can manage a support ticket from the support queue", async ({ page }) => {
  await mockAdminSession(page);

  await page.goto("/admin/chamados");

  await expect(page.getByRole("heading", { name: "Chamados de suporte" })).toBeVisible();
  await expect(page.locator('a[href="/admin/chamados"]')).toBeVisible();
  await expect(page.getByText("LD-SUP-1918").first()).toBeVisible();
  await expect(
    page.getByRole("img", { name: "Preview da captura enviada pelo usuario" }),
  ).toBeVisible();

  await page.getByLabel("Buscar").fill("preview");
  const previewTicket = page.getByRole("button", { name: /LD-SUP-1907/ });
  await expect(previewTicket).toBeVisible();
  await previewTicket.click();
  await expect(page.getByRole("heading", { name: "Preview do documento nao abre" })).toBeVisible();

  await page.getByRole("button", { name: /Assumir/ }).click();
  await expect(page.getByText(/por Maria Silva/)).toBeVisible();

  await page
    .getByLabel("Resposta ao usuario")
    .fill("Conferi a previa e liberei uma nova tentativa.");
  await page.getByRole("button", { name: "Enviar resposta" }).click();
  await expect(
    page.getByText("Conferi a previa e liberei uma nova tentativa.").nth(1),
  ).toBeVisible();

  await page.getByRole("button", { name: "Resolver" }).click();
  await expect(
    page.getByText("Este chamado foi resolvido. Reabra para responder novamente."),
  ).toBeVisible();

  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByRole("heading", { name: "Chamados de suporte" })).toBeVisible();
  await expect(
    page.getByText("Conferi a previa e liberei uma nova tentativa.").nth(1),
  ).toBeVisible();
});
