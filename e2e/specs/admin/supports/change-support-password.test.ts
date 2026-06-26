import { expect, test } from "../../../fixtures/auth.fixture";

const validPassword = "Support01@email.com";

test("Should close the change password modal", async ({ adminPage }) => {
  await adminPage.goto("/supports");
  await expect(adminPage.getByTestId("spinner")).toBeHidden();

  const firstSupportElement = adminPage.getByTestId("support-row").first();
  await expect(firstSupportElement).toBeVisible();

  const firstSupportId = await firstSupportElement.getAttribute("id");
  await adminPage
    .getByTestId(`change-support-password-${firstSupportId}`)
    .click();

  await expect(adminPage.getByText("Change password")).toBeVisible();
  await adminPage.getByTestId("change-support-password-cancel").click();
  await expect(
    adminPage.getByTestId("change-support-password-modal"),
  ).not.toBeVisible();
});

test("Should not submit with an empty password", async ({ adminPage }) => {
  await adminPage.goto("/supports");
  await expect(adminPage.getByTestId("spinner")).toBeHidden();

  const firstSupportElement = adminPage.getByTestId("support-row").first();
  const firstSupportId = await firstSupportElement.getAttribute("id");

  await adminPage
    .getByTestId(`change-support-password-${firstSupportId}`)
    .click();

  await adminPage.getByTestId("change-support-password-save").click();
  await expect(adminPage.getByText("This field is required")).toHaveCount(2);
});

test("Should update the password successfully", async ({ adminPage }) => {
  await adminPage.goto("/supports");
  await expect(adminPage.getByTestId("spinner")).toBeHidden();

  const firstSupportElement = adminPage.getByTestId("support-row").first();
  const firstSupportId = await firstSupportElement.getAttribute("id");

  await adminPage
    .getByTestId(`change-support-password-${firstSupportId}`)
    .click();

  await adminPage.getByTestId("change-support-password").fill(validPassword);

  await adminPage
    .getByTestId("change-support-confirm-password")
    .fill(validPassword);

  await adminPage.getByTestId("change-support-password-save").click();

  await expect(
    adminPage.getByTestId("change-support-password-modal"),
  ).not.toBeVisible();
});
