import { expect, test } from "@playwright/test";

test("Admin Login successfully", async ({ page }) => {
  await page.goto("/login");
  await page.getByTestId("login-email").fill("admin01@email.com");
  await page.getByTestId("login-password").fill("Admin01@email.com");
  await page.getByTestId("login-submit").click();
  await page.waitForTimeout(1000);

  await page.waitForURL("/dashboard");
  await expect(page).toHaveTitle(/Dashboard/);
});

test("User Login successfully", async ({ page }) => {
  await page.goto("/login");
  await page.getByTestId("login-email").fill("user01@email.com");
  await page.getByTestId("login-password").fill("User01@email.com");
  await page.getByTestId("login-submit").click();
  await page.waitForTimeout(1000);

  await page.waitForURL("/home");
  await expect(page).toHaveTitle(/Home/);
});

test("Support Login successfully", async ({ page }) => {
  await page.goto("/login");
  await page.getByTestId("login-email").fill("support01@email.com");
  await page.getByTestId("login-password").fill("Support01@email.com");
  await page.getByTestId("login-submit").click();
  await page.waitForTimeout(1000);

  await page.waitForURL("/chat");
  await expect(page).toHaveTitle(/Chat/);
});

test("Login with wrong credentials", async ({ page }) => {
  await page.goto("/login");
  await page.getByTestId("login-email").fill("user01@email.com");
  await page.getByTestId("login-password").fill("wrong_password");
  await page.getByTestId("login-submit").click();

  await expect(page.getByText("Invalid credentials!")).toBeVisible({
    timeout: 3000,
  });
});

test("Navigate to create account page", async ({ page }) => {
  await page.goto("/login");
  await page.getByTestId("register-link").click();
  await page.waitForURL("/register");
  await page.getByTestId("register-title").isVisible();
});

test("Update to English locale", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByText("Don't have an account? Sign up")).toBeVisible();
  await page.getByTestId("es-locale-select").click();
  await page.waitForTimeout(1000);

  await page.getByTestId("en-locale-select").click();
  await expect(page.getByText("Don't have an account? Sign up")).toBeVisible();
});

test("Update to Spanish locale", async ({ page }) => {
  await page.goto("/login");
  await page.getByTestId("es-locale-select").click();

  await expect(
    page.getByText("¿No tienes una cuenta? Regístrate"),
  ).toBeVisible();
});

test("Update to Brazilian Portuguese locale", async ({ page }) => {
  await page.goto("/login");
  await page.getByTestId("pt-br-locale-select").click();

  await expect(page.getByText("Não tem uma conta? Cadastre-se")).toBeVisible();
});

test("Update to Portuguese locale", async ({ page }) => {
  await page.goto("/login");
  await page.getByTestId("pt-pt-locale-select").click();

  await expect(page.getByText("Não tem conta? Registe-se")).toBeVisible();
});

test("Update to Romanian locale", async ({ page }) => {
  await page.goto("/login");
  await page.getByTestId("ro-locale-select").click();

  await expect(page.getByText("Nu ai cont? Înregistrează-te")).toBeVisible();
});
