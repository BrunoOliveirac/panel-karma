import { UserTypeEnum } from "@/lib/enums/user-type.enum";
import { expect, test } from "@playwright/test";
import { login } from "../../helpers/login.helper";

test("Admin Login successfully", async ({ page }) => {
  await login({
    page,
    type: UserTypeEnum.ADMIN,
    email: "admin01@email.com",
    password: "Admin01@email.com",
  });

  await expect(page).toHaveTitle(/Dashboard/);
});

test("User Login successfully", async ({ page }) => {
  await login({
    page,
    type: UserTypeEnum.USER,
    email: "user01@email.com",
    password: "User01@email.com",
  });

  await expect(page).toHaveTitle(/Home/);
});

test("Support Login successfully", async ({ page }) => {
  await login({
    page,
    type: UserTypeEnum.SUPPORT,
    email: "support01@email.com",
    password: "Support01@email.com",
  });

  await expect(page).toHaveTitle(/Chat/);
});

test("Login with wrong credentials", async ({ page }) => {
  await page.goto("/login");
  await page.getByTestId("en-locale-select").click();
  await expect(page.getByText("Don't have an account? Sign up")).toBeVisible();

  await page.getByTestId("login-email").fill("user01@email.com");
  await page.getByTestId("login-password").fill("WrongPassword1!");

  const loginResponse = page.waitForResponse(
    (response) =>
      response.url().includes("/auth/login") &&
      response.request().method() === "POST",
  );

  await page.getByTestId("login-submit").click();
  const response = await loginResponse;

  // 401 = invalid credentials; 429 = temporary lock after too many attempts
  if (response.status() === 429) {
    await expect(
      page.getByText(
        "Too many failed attempts. Your account is locked for 15 minutes.",
      ),
    ).toBeVisible({ timeout: 5000 });
  } else {
    expect(response.status()).toBe(401);

    await expect(page.getByText("Invalid credentials!")).toBeVisible({
      timeout: 5000,
    });
  }
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

  await expect(page.getByText("Não tem uma conta? Registe-se")).toBeVisible();
});

test("Update to Romanian locale", async ({ page }) => {
  await page.goto("/login");
  await page.getByTestId("ro-locale-select").click();

  await expect(page.getByText("Nu ai un cont? Înregistrează-te")).toBeVisible();
});
