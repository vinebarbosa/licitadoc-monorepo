import { expect, test } from "@playwright/test";

test("public auth routes render expected content", async ({ page }) => {
  await page.goto("/entrar");
  await expect(page.getByRole("heading", { name: "Acesse sua conta" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Esqueceu a senha?" })).toBeVisible();

  await page.goto("/cadastro");
  await expect(page.getByRole("heading", { name: "Solicite seu acesso" })).toBeVisible();
  await expect(page.getByRole("button", { name: /Solicitar acesso/ })).toBeVisible();

  await page.goto("/recuperar-senha");
  await expect(page.getByRole("heading", { name: "Recuperar senha" })).toBeVisible();
  await expect(page.getByRole("button", { name: /Enviar instruções/ })).toBeVisible();
});

test("fallback routes render recovery navigation", async ({ page }) => {
  await page.goto("/nao-autorizado");
  await expect(
    page.getByRole("heading", { name: "Você não tem permissão para esta área" }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: /Voltar para o início/ })).toBeVisible();

  await page.goto("/rota-inexistente");
  await expect(page.getByRole("heading", { name: "Página não encontrada" })).toBeVisible();
  await expect(page.getByRole("link", { name: /Voltar para a página inicial/ })).toBeVisible();
});
