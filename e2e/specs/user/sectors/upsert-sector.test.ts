import { Page } from "@playwright/test";
import { expect, test } from "../../../fixtures/auth.fixture";

const handleEditSector = async (userPage: Page) => {
  const firstSectorElement = userPage.getByTestId("sector-row").first();
  await expect(firstSectorElement).toBeVisible();

  const firstSectorId = await firstSectorElement.getAttribute("id");
  await userPage.getByTestId(`edit-sector-${firstSectorId}`).click();

  await expect(userPage.getByText("Sector Details")).toBeVisible();
};

test("Should close the sector upsert modal", async ({ userPage }) => {
  await userPage.goto("/sectors");
  await expect(userPage.getByTestId("spinner")).toBeHidden();

  await userPage.getByTestId("create-sector").click();
  await expect(userPage.getByText("Sector Details")).toBeVisible();
  await userPage.getByTestId("upsert-sector-cancel").click();
  await expect(userPage.getByText("Sector Details")).not.toBeVisible();
});

test("Should not submit with an empty name", async ({ userPage }) => {
  await userPage.goto("/sectors");
  await expect(userPage.getByTestId("spinner")).toBeHidden();

  await userPage.getByTestId("create-sector").click();
  await expect(userPage.getByText("Sector Details")).toBeVisible();

  await userPage.getByTestId("upsert-sector-save").click();
  await expect(userPage.getByText("This field is required")).toBeVisible();
});

test("Should create a sector successfully", async ({ userPage }) => {
  await userPage.goto("/sectors");
  await expect(userPage.getByTestId("spinner")).toBeHidden();

  await userPage.getByTestId("create-sector").click();
  await expect(userPage.getByText("Sector Details")).toBeVisible();
  const now = new Date().getTime().toString().slice(-5);

  await userPage.getByTestId("upsert-sector-name").fill(`Sector ${now}`);
  // Inactivate the sector
  await userPage.getByTestId("upsert-sector-active").click();

  await userPage.getByTestId("upsert-sector-save").click();
  await expect(userPage.getByText("Sector Details")).not.toBeVisible();

  const filterElement = userPage.getByTestId("list-sectors-search");
  await filterElement.fill(now);
  await expect(userPage.getByText(`Sector ${now}`)).toBeVisible();
});

test("Should edit a sector successfully", async ({ userPage }) => {
  await userPage.goto("/sectors");
  await expect(userPage.getByTestId("spinner")).toBeHidden();

  await handleEditSector(userPage);

  const now = new Date().getTime().toString().slice(-5);
  await userPage.getByTestId("upsert-sector-name").fill(`Sector ${now}`);
  await userPage.getByTestId("upsert-sector-save").click();

  await expect(userPage.getByText("Sector Details")).not.toBeVisible();

  const filterElement = userPage.getByTestId("list-sectors-search");
  await filterElement.fill(now);
  await expect(userPage.getByText(`Sector ${now}`)).toBeVisible();
});
