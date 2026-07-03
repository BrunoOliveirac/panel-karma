import { expect, test } from "../../../fixtures/auth.fixture";

test("Should show an empty list of members", async ({ emptyUserPage }) => {
  await emptyUserPage.goto("/members");
  await expect(emptyUserPage.getByTestId("spinner")).toBeHidden();
  await expect(emptyUserPage.getByText("Members not found")).toBeVisible();
});

test("Should show a list of members", async ({ userPage }) => {
  await userPage.goto("/members");
  await expect(userPage.getByTestId("spinner")).toBeHidden();
  await expect(userPage.getByTestId("member-row").first()).toBeVisible();
});

test("Should change the page", async ({ userPage }) => {
  await userPage.goto("/members");
  await expect(userPage.getByTestId("spinner")).toBeHidden();
  await expect(userPage.getByTestId("member-row").first()).toBeVisible();

  const secondPageElement = userPage.getByTestId("pagination-link-2");

  if (await secondPageElement.isVisible()) {
    await secondPageElement.click();
    await expect(secondPageElement).toHaveAttribute("data-active", "true");
  }
});

test("Should filter the list", async ({ userPage }) => {
  await userPage.goto("/members");
  await expect(userPage.getByTestId("spinner")).toBeHidden();
  await expect(userPage.getByTestId("member-row").first()).toBeVisible();

  const firstMemberRow = userPage.getByTestId("member-row").first();
  const memberName =
    (await firstMemberRow.locator("td").first().textContent())?.trim() ?? "";

  const filterElement = userPage.getByTestId("list-members-search");
  await filterElement.fill(memberName.slice(0, 3));
  await expect(userPage.getByText(memberName)).toBeVisible();
});

test("Should show an empty list at filter", async ({ userPage }) => {
  await userPage.goto("/members");
  await expect(userPage.getByTestId("spinner")).toBeHidden();
  await expect(userPage.getByTestId("member-row").first()).toBeVisible();

  const filterElement = userPage.getByTestId("list-members-search");
  await filterElement.fill("filtering member");
  await expect(userPage.getByText("Members not found")).toBeVisible();
});

test("User cancels unlink member confirmation", async ({ userPage }) => {
  await userPage.goto("/members");
  await expect(userPage.getByTestId("spinner")).toBeHidden();
  const firstMemberElement = userPage.getByTestId("member-row").first();
  await expect(firstMemberElement).toBeVisible();

  const firstMemberId = await firstMemberElement.getAttribute("id");
  await userPage.getByTestId(`unlink-member-${firstMemberId}`).click();

  await expect(userPage.getByText("Are you sure?")).toBeVisible();
  await userPage.getByRole("button", { name: "Cancel" }).click();
  await expect(userPage.getByText("Are you sure?")).not.toBeVisible();
});

test("User confirm the member unlink", async ({ userPage }) => {
  await userPage.goto("/members");
  await expect(userPage.getByTestId("spinner")).toBeHidden();
  const firstMemberElement = userPage.getByTestId("member-row").first();
  await expect(firstMemberElement).toBeVisible();

  const firstMemberId = await firstMemberElement.getAttribute("id");
  await userPage.getByTestId(`unlink-member-${firstMemberId}`).click();

  await expect(userPage.getByText("Are you sure?")).toBeVisible();
  await userPage.getByRole("button", { name: "Confirm" }).click();
  await expect(userPage.getByText("Are you sure?")).not.toBeVisible();

  await expect(
    userPage.getByTestId(`unlink-member-${firstMemberId}`),
  ).not.toBeVisible();
});

test("Should open the member create modal", async ({ userPage }) => {
  await userPage.goto("/members");
  await expect(userPage.getByTestId("spinner")).toBeHidden();
  await userPage.getByTestId("create-member").click();
  await expect(userPage.getByText("Member Details")).toBeVisible();
  await expect(userPage.getByText("Confirm password")).toBeVisible();
});

test("Should open the manage projects modal", async ({ userPage }) => {
  await userPage.goto("/members");
  await expect(userPage.getByTestId("spinner")).toBeHidden();

  const firstMemberElement = userPage.getByTestId("member-row").first();
  await expect(firstMemberElement).toBeVisible();

  const firstMemberId = await firstMemberElement.getAttribute("id");
  await userPage.getByTestId(`manage-projects-member-${firstMemberId}`).click();

  await expect(userPage.getByText("Manage projects")).toBeVisible();
});
