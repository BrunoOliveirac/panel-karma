import { Page } from "@playwright/test";
import { expect, test } from "../../fixtures/auth.fixture";

const validPassword = "Password1!";

const openCreateMemberModal = async (userPage: Page) => {
  await userPage.getByTestId("create-member").click();
  await expect(userPage.getByTestId("create-member-modal")).toBeVisible();
  await expect(userPage.getByTestId("spinner")).toBeHidden();
};

const selectFirstProject = async (userPage: Page) => {
  await userPage.getByTestId("create-member-projects").click();

  const firstOption = userPage.getByRole("option").first();
  await expect(firstOption).toBeVisible();

  const projectName = (await firstOption.textContent())?.trim() ?? "";
  await firstOption.click();

  return projectName;
};

test("Should close the member create modal", async ({ userPage }) => {
  await userPage.goto("/members");
  await expect(userPage.getByTestId("spinner")).toBeHidden();

  await openCreateMemberModal(userPage);
  await userPage.getByTestId("create-member-cancel").click();
  await expect(userPage.getByTestId("create-member-modal")).not.toBeVisible();
});

test("Should not submit with an empty name", async ({ userPage }) => {
  await userPage.goto("/members");
  await expect(userPage.getByTestId("spinner")).toBeHidden();

  await openCreateMemberModal(userPage);
  await userPage.getByTestId("create-member-save").click();
  await expect(userPage.getByText("This field is required")).toHaveCount(4);
});

test("Should not submit when passwords do not match", async ({ userPage }) => {
  await userPage.goto("/members");
  await expect(userPage.getByTestId("spinner")).toBeHidden();

  await openCreateMemberModal(userPage);
  const now = new Date().getTime().toString().slice(-5);

  await userPage.getByTestId("create-member-name").fill(`Member ${now}`);
  await userPage
    .getByTestId("create-member-email")
    .fill(`member${now}@email.com`);
  await userPage.getByTestId("create-member-password").fill(validPassword);
  await userPage
    .getByTestId("create-member-confirm-password")
    .fill("Password2!");

  await userPage.getByTestId("create-member-save").click();
  await expect(userPage.getByText("Passwords do not match")).toBeVisible();
  await expect(userPage.getByTestId("create-member-modal")).toBeVisible();
});

test("Should create a member successfully", async ({ userPage }) => {
  await userPage.goto("/members");
  await expect(userPage.getByTestId("spinner")).toBeHidden();

  await openCreateMemberModal(userPage);
  const now = new Date().getTime().toString().slice(-5);

  await userPage.getByTestId("create-member-name").fill(`Member ${now}`);
  await userPage
    .getByTestId("create-member-email")
    .fill(`member${now}@email.com`);
  await userPage.getByTestId("create-member-password").fill(validPassword);
  await userPage
    .getByTestId("create-member-confirm-password")
    .fill(validPassword);

  await userPage.getByTestId("create-member-save").click();
  await expect(userPage.getByTestId("create-member-modal")).not.toBeVisible();

  const filterElement = userPage.getByTestId("list-members-search");
  await filterElement.fill(now);
  await expect(userPage.getByText(`Member ${now}`)).toBeVisible();
});

test("Should create a member with projects successfully", async ({
  userPage,
}) => {
  await userPage.goto("/members");
  await expect(userPage.getByTestId("spinner")).toBeHidden();

  await openCreateMemberModal(userPage);
  const now = new Date().getTime().toString().slice(-5);

  await userPage.getByTestId("create-member-name").fill(`Member ${now}`);
  await userPage
    .getByTestId("create-member-email")
    .fill(`member${now}@email.com`);

  const projectName = await selectFirstProject(userPage);
  expect(projectName.length).toBeGreaterThan(0);

  await userPage.getByTestId("create-member-password").fill(validPassword);
  await userPage
    .getByTestId("create-member-confirm-password")
    .fill(validPassword);

  await userPage.getByTestId("create-member-save").click();
  await expect(userPage.getByTestId("create-member-modal")).not.toBeVisible();

  const filterElement = userPage.getByTestId("list-members-search");
  await filterElement.fill(now);
  await expect(userPage.getByText(`Member ${now}`)).toBeVisible();
});

test("Should see error when e-mail is already linked", async ({ userPage }) => {
  await userPage.goto("/members");
  await expect(userPage.getByTestId("spinner")).toBeHidden();

  const firstMemberRow = userPage.getByTestId("member-row").first();
  await expect(firstMemberRow).toBeVisible();
  const email = await firstMemberRow.locator("td").nth(1).innerText();

  await openCreateMemberModal(userPage);

  const emailElement = userPage.getByTestId("create-member-email");
  await emailElement.fill(email);
  await emailElement.blur();

  await expect(
    userPage.getByText("This member is already linked!"),
  ).toBeVisible();
});

test("Should see error when e-mail is already in use", async ({ userPage }) => {
  await userPage.goto("/members");
  await expect(userPage.getByTestId("spinner")).toBeHidden();

  await openCreateMemberModal(userPage);

  const emailElement = userPage.getByTestId("create-member-email");
  await emailElement.fill("user01@email.com");
  await emailElement.blur();

  await expect(
    userPage.getByText("This e-mail is already in use!"),
  ).toBeVisible();
});

// Creates a member, unlinks it, then cancels the "link existing member" prompt.
test("User cancels linking an existing member", async ({ userPage }) => {
  await userPage.goto("/members");
  await expect(userPage.getByTestId("spinner")).toBeHidden();

  await openCreateMemberModal(userPage);
  const now = new Date().getTime().toString().slice(-5);
  const memberName = `Member ${now}`;
  const memberEmail = `member${now}@email.com`;

  await userPage.getByTestId("create-member-name").fill(memberName);
  await userPage.getByTestId("create-member-email").fill(memberEmail);
  await userPage.getByTestId("create-member-password").fill(validPassword);

  await userPage
    .getByTestId("create-member-confirm-password")
    .fill(validPassword);

  await userPage.getByTestId("create-member-save").click();
  await expect(userPage.getByTestId("create-member-modal")).not.toBeVisible();

  // Wait for the filtered result before unlinking. Filling the search is async;
  // grabbing `.first()` too early can unlink a different member from the full list.
  const filterElement = userPage.getByTestId("list-members-search");
  await filterElement.fill(now);
  await expect(userPage.getByText(memberName)).toBeVisible();

  const memberRow = userPage.getByTestId("member-row").first();
  const memberId = await memberRow.getAttribute("id");
  await userPage.getByTestId(`unlink-member-${memberId}`).click();
  await expect(userPage.getByText("Are you sure?")).toBeVisible();
  await userPage.getByRole("button", { name: "Confirm" }).click();
  await expect(userPage.getByText("Member unlinked successfully!")).toBeVisible();
  await expect(userPage.getByText(memberName)).not.toBeVisible();

  // Re-enter the same e-mail to open the link confirmation, then cancel it.
  await openCreateMemberModal(userPage);
  const emailElement = userPage.getByTestId("create-member-email");
  await emailElement.fill(memberEmail);
  await emailElement.blur();

  await expect(
    userPage.getByTestId("create-member-link-confirm"),
  ).toBeVisible();
  await userPage.getByTestId("create-member-link-cancel").click();
  await expect(
    userPage.getByTestId("create-member-link-confirm"),
  ).not.toBeVisible();
  await expect(userPage.getByTestId("create-member-modal")).toBeVisible();
});

// Creates a member, unlinks it, then confirms the "link existing member" prompt.
test("User confirms linking an existing member", async ({ userPage }) => {
  await userPage.goto("/members");
  await expect(userPage.getByTestId("spinner")).toBeHidden();

  await openCreateMemberModal(userPage);
  const now = new Date().getTime().toString().slice(-5);
  const memberName = `Member ${now}`;
  const memberEmail = `member${now}@email.com`;

  await userPage.getByTestId("create-member-name").fill(memberName);
  await userPage.getByTestId("create-member-email").fill(memberEmail);
  await userPage.getByTestId("create-member-password").fill(validPassword);

  await userPage
    .getByTestId("create-member-confirm-password")
    .fill(validPassword);

  await userPage.getByTestId("create-member-save").click();
  await expect(userPage.getByTestId("create-member-modal")).not.toBeVisible();

  // Wait for the filtered result before unlinking. Filling the search is async;
  // grabbing `.first()` too early can unlink a different member from the full list.
  const filterElement = userPage.getByTestId("list-members-search");
  await filterElement.fill(now);
  await expect(userPage.getByText(memberName)).toBeVisible();

  const memberRow = userPage.getByTestId("member-row").first();
  const memberId = await memberRow.getAttribute("id");
  await userPage.getByTestId(`unlink-member-${memberId}`).click();
  await expect(userPage.getByText("Are you sure?")).toBeVisible();
  await userPage.getByRole("button", { name: "Confirm" }).click();
  await expect(userPage.getByText("Member unlinked successfully!")).toBeVisible();
  await expect(userPage.getByText(memberName)).not.toBeVisible();

  // Re-enter the same e-mail, confirm linking, and check the member is listed again.
  await openCreateMemberModal(userPage);
  const emailElement = userPage.getByTestId("create-member-email");
  await emailElement.fill(memberEmail);
  await emailElement.blur();

  await expect(
    userPage.getByTestId("create-member-link-confirm"),
  ).toBeVisible();
  await userPage.getByTestId("create-member-link-confirm-btn").click();
  await expect(userPage.getByTestId("create-member-modal")).not.toBeVisible();

  await filterElement.fill(now);
  await expect(userPage.getByText(memberName)).toBeVisible();
});
