import { expect, test } from "@playwright/test";

test("landing route renders public marketing content", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", { name: "Documentos para Contratações Públicas" }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: /Solicitar Acesso/ }).first()).toBeVisible();
  await expect(page.getByText("Tudo que você precisa para suas contratações")).toBeVisible();
  await expect(page.getByText("Desenvolvido para o setor público brasileiro")).toBeVisible();
});
