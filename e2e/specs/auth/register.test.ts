import { expect, test } from "@playwright/test";

test("Create user account successfully", async ({ page }) => {
  await page.goto("/register");
  const currentTime = new Date().getTime();
  const password = `User${currentTime}@email.com`;

  await page.getByTestId("register-name").fill(`User ${currentTime}`);
  await page.getByTestId("register-email").fill(password.toLocaleLowerCase());
  await page.getByTestId("register-password").fill(password);
  await page.getByTestId("register-confirm-password").fill(password);

  await page.getByTestId("register-submit").click();
  await page.waitForTimeout(1000);

  await page.waitForURL("/home");
  await expect(page).toHaveTitle(/Home/);
});

test("Should not create user account with same email", async ({ page }) => {
  await page.goto("/register");
  await page.getByTestId("register-name").fill("User Test 01");
  await page.getByTestId("register-email").fill("user01@email.com");
  await page.getByTestId("register-password").fill("User01@email.com");
  await page.getByTestId("register-confirm-password").fill("User01@email.com");

  await page.getByTestId("register-submit").click();

  await expect(
    page.getByText("We were unable to create your account!"),
  ).toBeVisible({ timeout: 3000 });
});

test("Navigate to login page", async ({ page }) => {
  await page.goto("/register");
  await page.getByTestId("login-link").click();
  await page.waitForURL("/login");
  await page.getByTestId("login-title").isVisible();
});
