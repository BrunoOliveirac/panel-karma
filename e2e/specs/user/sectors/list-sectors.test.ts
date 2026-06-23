import { expect, test } from "../../../fixtures/auth.fixture";

test("Should show an empty list of sectors", async ({ emptyUserPage }) => {
  await emptyUserPage.goto("/sectors");
  await expect(emptyUserPage.getByTestId("spinner")).toBeHidden();
  await expect(emptyUserPage.getByText("Sectors not found")).toBeVisible();
});

test("Should show a list of sectors", async ({ emptyUserPage }) => {
  await emptyUserPage.goto("/sectors");
  await expect(emptyUserPage.getByTestId("spinner")).toBeHidden();
  await expect(emptyUserPage.getByText("Sectors not found")).toBeVisible();
});

test("Should change the page", async ({ userPage }) => {
  await userPage.goto("/sectors");
  await expect(userPage.getByTestId("spinner")).toBeHidden();
  await expect(userPage.getByTestId("sector-row").first()).toBeVisible();

  const secondPageElement = userPage.getByTestId("pagination-link-3");
  await secondPageElement.click();
  await expect(secondPageElement).toHaveAttribute("data-active", "true");
});

test("Should filter the list", async ({ userPage }) => {
  await userPage.goto("/sectors");
  await expect(userPage.getByTestId("spinner")).toBeHidden();
  await expect(userPage.getByTestId("sector-row").first()).toBeVisible();

  const filterElement = userPage.getByTestId("list-sectors-search");
  await filterElement.fill("Sector 0");
  await expect(userPage.getByTestId("pagination-link-3")).not.toBeVisible();
});

test("Should show an empty list at filter", async ({ userPage }) => {
  await userPage.goto("/sectors");
  await expect(userPage.getByTestId("spinner")).toBeHidden();
  await expect(userPage.getByTestId("sector-row").first()).toBeVisible();

  const filterElement = userPage.getByTestId("list-sectors-search");
  await filterElement.fill("filtering sector");
  await expect(userPage.getByText("Sectors not found")).toBeVisible();
});

test("User cancels delete sector confirmation", async ({ userPage }) => {
  await userPage.goto("/sectors");
  await expect(userPage.getByTestId("spinner")).toBeHidden();
  const firstClientElement = userPage.getByTestId("sector-row").first();
  await expect(firstClientElement).toBeVisible();

  const firstSectorId = await firstClientElement.getAttribute("id");
  await userPage.getByTestId(`delete-sector-${firstSectorId}`).click();

  await expect(userPage.getByText("Are you sure?")).toBeVisible();
  await userPage.getByRole("button", { name: "Cancel" }).click();
  await expect(userPage.getByText("Are you sure?")).not.toBeVisible();
});

test("User confirm the sector deletion", async ({ userPage }) => {
  await userPage.goto("/sectors");
  await expect(userPage.getByTestId("spinner")).toBeHidden();
  const firstSectorElement = userPage.getByTestId("sector-row").first();
  await expect(firstSectorElement).toBeVisible();

  const firstSectorId = await firstSectorElement.getAttribute("id");
  await userPage.getByTestId(`delete-sector-${firstSectorId}`).click();

  await expect(userPage.getByText("Are you sure?")).toBeVisible();
  await userPage.getByRole("button", { name: "Confirm" }).click();
  await expect(userPage.getByText("Are you sure?")).not.toBeVisible();

  await expect(
    userPage.getByTestId(`delete-sector-${firstSectorId}`),
  ).not.toBeVisible();
});

test("Should deactivate sector status", async ({ userPage }) => {
  await userPage.goto("/sectors");
  await expect(userPage.getByTestId("spinner")).toBeHidden();

  const activeSectorRow = userPage
    .getByTestId("sector-row")
    .filter({ has: userPage.getByTestId("active-sector-status") })
    .first();
  await expect(activeSectorRow).toBeVisible();

  const sectorId = await activeSectorRow.getAttribute("id");
  if (!sectorId) throw new Error("Sector id not found");

  const sectorRow = userPage.locator(
    `[data-slot="sector-row"][id="${sectorId}"]`,
  );

  await sectorRow.getByTestId(`toggle-sector-status-${sectorId}`).click();
  await expect(sectorRow.getByTestId("inactive-sector-status")).toBeVisible();
});

test("Should activate sector status", async ({ userPage }) => {
  await userPage.goto("/sectors");
  await expect(userPage.getByTestId("spinner")).toBeHidden();

  const inactiveSectorRow = userPage
    .getByTestId("sector-row")
    .filter({ has: userPage.getByTestId("inactive-sector-status") })
    .first();

  await expect(inactiveSectorRow).toBeVisible();
  const sectorId = await inactiveSectorRow.getAttribute("id");

  if (!sectorId) throw new Error("Sector id not found");

  const sectorRow = userPage.locator(
    `[data-slot="sector-row"][id="${sectorId}"]`,
  );

  await sectorRow.getByTestId(`toggle-sector-status-${sectorId}`).click();
  await expect(sectorRow.getByTestId("active-sector-status")).toBeVisible();
});

test("Should open the sector create modal", async ({ userPage }) => {
  await userPage.goto("/sectors");
  await expect(userPage.getByTestId("spinner")).toBeHidden();
  userPage.getByTestId("create-sector").click();
  await expect(userPage.getByText("Sector Details")).toBeVisible();
});

test("Should open the client edit modal", async ({ userPage }) => {
  await userPage.goto("/sectors");
  await expect(userPage.getByTestId("spinner")).toBeHidden();

  const firstSectorElement = userPage.getByTestId("sector-row").first();
  await expect(firstSectorElement).toBeVisible();

  const firstSectorId = await firstSectorElement.getAttribute("id");
  await userPage.getByTestId(`edit-sector-${firstSectorId}`).click();

  await expect(userPage.getByText("Sector Details")).toBeVisible();
});
