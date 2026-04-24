import { expect, test } from "@playwright/test";
import { anonymousSessionResponse, healthOkResponse } from "../src/test/msw/fixtures";

test("home route renders with deterministic backend responses", async ({ page }) => {
  await page.route("http://localhost:3333/health", async (route) => {
    await route.fulfill({ json: healthOkResponse });
  });

  await page.route("http://localhost:3333/api/auth/get-session", async (route) => {
    await route.fulfill({ json: anonymousSessionResponse });
  });

  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Licitadoc" })).toBeVisible();
  await expect(page.getByText("Health: ok")).toBeVisible();
  await expect(page.getByText("Session: sem sessao ativa")).toBeVisible();
});
