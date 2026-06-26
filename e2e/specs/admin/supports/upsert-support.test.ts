import { Page } from "@playwright/test";
import { expect, test } from "../../../fixtures/auth.fixture";

const validPassword = "Password1!";

const handleEditSupport = async (adminPage: Page) => {
  const firstSupportElement = adminPage.getByTestId("support-row").first();
  await expect(firstSupportElement).toBeVisible();

  const firstSupportId = await firstSupportElement.getAttribute("id");
  await adminPage.getByTestId(`edit-support-${firstSupportId}`).click();

  await expect(adminPage.getByText("Support Details")).toBeVisible();
};

test("Should close the support upsert modal", async ({ adminPage }) => {
  await adminPage.goto("/supports");
  await expect(adminPage.getByTestId("spinner")).toBeHidden();

  await adminPage.getByTestId("create-support").click();
  await expect(adminPage.getByText("Support Details")).toBeVisible();
  await adminPage.getByTestId("upsert-support-cancel").click();
  await expect(adminPage.getByText("Support Details")).not.toBeVisible();
});

test("Should not submit with an empty name", async ({ adminPage }) => {
  await adminPage.goto("/supports");
  await expect(adminPage.getByTestId("spinner")).toBeHidden();

  await adminPage.getByTestId("create-support").click();
  await expect(adminPage.getByText("Support Details")).toBeVisible();

  await adminPage.getByTestId("upsert-support-save").click();
  await expect(adminPage.getByText("This field is required")).toHaveCount(4);
});

test("Should create a support successfully", async ({ adminPage }) => {
  await adminPage.goto("/supports");
  await expect(adminPage.getByTestId("spinner")).toBeHidden();

  await adminPage.getByTestId("create-support").click();
  await expect(adminPage.getByText("Support Details")).toBeVisible();
  const now = new Date().getTime().toString().slice(-5);

  await adminPage.getByTestId("upsert-support-name").fill(`Support ${now}`);
  await adminPage
    .getByTestId("upsert-support-email")
    .fill(`support${now}@email.com`);
  await adminPage.getByTestId("upsert-support-password").fill(validPassword);
  await adminPage
    .getByTestId("upsert-support-confirm-password")
    .fill(validPassword);

  await adminPage.getByTestId("upsert-support-save").click();
  await expect(adminPage.getByText("Support Details")).not.toBeVisible();

  const filterElement = adminPage.getByTestId("list-supports-search");
  await filterElement.fill(now);
  await expect(adminPage.getByText(`Support ${now}`)).toBeVisible();
});

test("Should edit a support successfully", async ({ adminPage }) => {
  await adminPage.goto("/supports");
  await expect(adminPage.getByTestId("spinner")).toBeHidden();

  await handleEditSupport(adminPage);

  const now = new Date().getTime().toString().slice(-5);
  await adminPage.getByTestId("upsert-support-name").fill(`Support ${now}`);
  await adminPage.getByTestId("upsert-support-save").click();

  await expect(adminPage.getByText("Support Details")).not.toBeVisible();

  const filterElement = adminPage.getByTestId("list-supports-search");
  await filterElement.fill(now);
  await expect(adminPage.getByText(`Support ${now}`)).toBeVisible();
});
