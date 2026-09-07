import { expect, test } from "@playwright/test";

test("Should send guests from a protected route to login", async ({ page }) => {
  await page.goto("/clients");
  await page.waitForURL("/login");
  await expect(page.getByTestId("login-title")).toBeVisible();
});

test("Should send guests from the app root to login", async ({ page }) => {
  await page.goto("/");
  await page.waitForURL("/login");
  await expect(page.getByTestId("login-title")).toBeVisible();
});
