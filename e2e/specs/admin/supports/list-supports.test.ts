import { expect, test } from "../../../fixtures/auth.fixture";

test("Should show a list of supports", async ({ adminPage }) => {
  await adminPage.goto("/supports");
  await expect(adminPage.getByTestId("spinner")).toBeHidden();
  await expect(adminPage.getByTestId("support-row").first()).toBeVisible();
});

test("Should change the page", async ({ adminPage }) => {
  await adminPage.goto("/supports");
  await expect(adminPage.getByTestId("spinner")).toBeHidden();
  await expect(adminPage.getByTestId("support-row").first()).toBeVisible();

  const secondPageElement = adminPage.getByTestId("pagination-link-2");

  if (await secondPageElement.isVisible()) {
    await secondPageElement.click();
    await expect(secondPageElement).toHaveAttribute("data-active", "true");
  }
});

test("Should filter the list", async ({ adminPage }) => {
  await adminPage.goto("/supports");
  await expect(adminPage.getByTestId("spinner")).toBeHidden();
  await expect(adminPage.getByTestId("support-row").first()).toBeVisible();

  const firstSupportRow = adminPage.getByTestId("support-row").first();
  const supportName =
    (await firstSupportRow.locator("td").first().textContent())?.trim() ?? "";

  const filterElement = adminPage.getByTestId("list-supports-search");
  await filterElement.fill(supportName.slice(0, 3));
  await expect(adminPage.getByText(supportName)).toBeVisible();
});

test("Should show an empty list at filter", async ({ adminPage }) => {
  await adminPage.goto("/supports");
  await expect(adminPage.getByTestId("spinner")).toBeHidden();
  await expect(adminPage.getByTestId("support-row").first()).toBeVisible();

  const filterElement = adminPage.getByTestId("list-supports-search");
  await filterElement.fill("filtering support");
  await expect(adminPage.getByText("Supports not found")).toBeVisible();
});

test("User cancels delete support confirmation", async ({ adminPage }) => {
  await adminPage.goto("/supports");
  await expect(adminPage.getByTestId("spinner")).toBeHidden();
  const firstSupportElement = adminPage.getByTestId("support-row").first();
  await expect(firstSupportElement).toBeVisible();

  const firstSupportId = await firstSupportElement.getAttribute("id");
  await adminPage.getByTestId(`delete-support-${firstSupportId}`).click();

  await expect(adminPage.getByText("Are you sure?")).toBeVisible();
  await adminPage.getByRole("button", { name: "Cancel" }).click();
  await expect(adminPage.getByText("Are you sure?")).not.toBeVisible();
});

test("User confirm the support deletion", async ({ adminPage }) => {
  await adminPage.goto("/supports");
  await expect(adminPage.getByTestId("spinner")).toBeHidden();
  const firstSupportElement = adminPage.getByTestId("support-row").first();
  await expect(firstSupportElement).toBeVisible();

  const firstSupportId = await firstSupportElement.getAttribute("id");
  await adminPage.getByTestId(`delete-support-${firstSupportId}`).click();

  await expect(adminPage.getByText("Are you sure?")).toBeVisible();
  await adminPage.getByRole("button", { name: "Confirm" }).click();
  await expect(adminPage.getByText("Are you sure?")).not.toBeVisible();

  await expect(
    adminPage.getByTestId(`delete-support-${firstSupportId}`),
  ).not.toBeVisible();
});

test("Should deactivate support status", async ({ adminPage }) => {
  await adminPage.goto("/supports");
  await expect(adminPage.getByTestId("spinner")).toBeHidden();

  const activeSupportRow = adminPage
    .getByTestId("support-row")
    .filter({ has: adminPage.getByTestId("active-support-status") })
    .first();
  await expect(activeSupportRow).toBeVisible();

  const supportId = await activeSupportRow.getAttribute("id");
  if (!supportId) throw new Error("Support id not found");

  const supportRow = adminPage.locator(
    `[data-slot="support-row"][id="${supportId}"]`,
  );

  await supportRow.getByTestId(`toggle-support-status-${supportId}`).click();
  await expect(supportRow.getByTestId("inactive-support-status")).toBeVisible();
});

test("Should activate support status", async ({ adminPage }) => {
  await adminPage.goto("/supports");
  await expect(adminPage.getByTestId("spinner")).toBeHidden();

  const inactiveSupportRow = adminPage
    .getByTestId("support-row")
    .filter({ has: adminPage.getByTestId("inactive-support-status") })
    .first();

  await expect(inactiveSupportRow).toBeVisible();
  const supportId = await inactiveSupportRow.getAttribute("id");

  if (!supportId) throw new Error("Support id not found");

  const supportRow = adminPage.locator(
    `[data-slot="support-row"][id="${supportId}"]`,
  );

  await supportRow.getByTestId(`toggle-support-status-${supportId}`).click();
  await expect(supportRow.getByTestId("active-support-status")).toBeVisible();
});

test("Should open the support create modal", async ({ adminPage }) => {
  await adminPage.goto("/supports");
  await expect(adminPage.getByTestId("spinner")).toBeHidden();
  await adminPage.getByTestId("create-support").click();
  await expect(adminPage.getByText("Support Details")).toBeVisible();
  await expect(adminPage.getByText("Confirm password")).toBeVisible();
});

test("Should open the support edit modal", async ({ adminPage }) => {
  await adminPage.goto("/supports");
  await expect(adminPage.getByTestId("spinner")).toBeHidden();

  const firstSupportElement = adminPage.getByTestId("support-row").first();
  await expect(firstSupportElement).toBeVisible();

  const firstSupportId = await firstSupportElement.getAttribute("id");
  await adminPage.getByTestId(`edit-support-${firstSupportId}`).click();

  await expect(adminPage.getByText("Support Details")).toBeVisible();
  await expect(adminPage.getByText("Confirm password")).not.toBeVisible();
});

test("Should open the change password modal", async ({ adminPage }) => {
  await adminPage.goto("/supports");
  await expect(adminPage.getByTestId("spinner")).toBeHidden();

  const firstSupportElement = adminPage.getByTestId("support-row").first();
  await expect(firstSupportElement).toBeVisible();

  const firstSupportId = await firstSupportElement.getAttribute("id");
  await adminPage
    .getByTestId(`change-support-password-${firstSupportId}`)
    .click();

  await expect(adminPage.getByText("Change password")).toBeVisible();
});
