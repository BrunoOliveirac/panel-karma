import { expect, test } from "../../fixtures/auth.fixture";

test("Should redirect a user away from an admin route", async ({ userPage }) => {
  await userPage.goto("/dashboard");
  await userPage.waitForURL("/home");
  await expect(userPage).toHaveTitle(/Home/);
});

test("Should redirect a member away from a user route", async ({
  memberPage,
}) => {
  await memberPage.goto("/members");
  await memberPage.waitForURL("/clients");
  await expect(memberPage).toHaveTitle(/Clients/);
});

test("Should redirect an admin away from a user route", async ({
  adminPage,
}) => {
  await adminPage.goto("/clients");
  await adminPage.waitForURL("/dashboard");
  await expect(adminPage).toHaveTitle(/Dashboard/);
});

test("Should redirect a support away from a user route", async ({
  supportPage,
}) => {
  await supportPage.goto("/clients");
  await supportPage.waitForURL("/chat");
  await expect(supportPage).toHaveTitle(/Chat/);
});
