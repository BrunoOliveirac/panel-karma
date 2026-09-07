import { expect, test } from "../../fixtures/auth.fixture";

test("Should keep an authenticated user off login", async ({ userPage }) => {
  await userPage.goto("/login");
  await userPage.waitForURL("/home");
  await expect(userPage).toHaveTitle(/Home/);
});

test("Should log out and block protected routes", async ({ userPage }) => {
  await expect(userPage).toHaveURL("/home");

  const logoutResponse = userPage.waitForResponse(
    (response) =>
      response.url().includes("/api/logout") &&
      response.request().method() === "POST",
  );

  await userPage.getByTestId("logout").click({ force: true });
  expect((await logoutResponse).ok()).toBeTruthy();

  await expect(userPage).toHaveURL(/\/login$/);
  await expect(userPage.getByTestId("login-title")).toBeVisible();

  await userPage.goto("/home");
  await expect(userPage).toHaveURL(/\/login$/);
  await expect(userPage.getByTestId("login-title")).toBeVisible();
});
