import { expect, test } from "../../../fixtures/auth.fixture";

const validPassword = "Password1!";

test("Should close the member create modal", async ({ userPage }) => {
  await userPage.goto("/members");
  await expect(userPage.getByTestId("spinner")).toBeHidden();

  await userPage.getByTestId("create-member").click();
  await expect(userPage.getByText("Member Details")).toBeVisible();
  await userPage.getByTestId("create-member-cancel").click();
  await expect(userPage.getByText("Member Details")).not.toBeVisible();
});

test("Should not submit with an empty name", async ({ userPage }) => {
  await userPage.goto("/members");
  await expect(userPage.getByTestId("spinner")).toBeHidden();

  await userPage.getByTestId("create-member").click();
  await expect(userPage.getByText("Member Details")).toBeVisible();

  await userPage.getByTestId("create-member-save").click();
  await expect(userPage.getByText("This field is required")).toHaveCount(4);
});

test("Should create a member successfully", async ({ userPage }) => {
  await userPage.goto("/members");
  await expect(userPage.getByTestId("spinner")).toBeHidden();

  await userPage.getByTestId("create-member").click();
  await expect(userPage.getByText("Member Details")).toBeVisible();
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
  await expect(userPage.getByText("Member Details")).not.toBeVisible();

  const filterElement = userPage.getByTestId("list-members-search");
  await filterElement.fill(now);
  await expect(userPage.getByText(`Member ${now}`)).toBeVisible();
});

test("Should see error at validate e-mail", async ({ userPage }) => {
  await userPage.goto("/members");
  await expect(userPage.getByTestId("spinner")).toBeHidden();

  const firstMemberRow = userPage.getByTestId("member-row").first();
  await expect(firstMemberRow).toBeVisible();
  const email = await firstMemberRow.locator("td").nth(1).innerText();

  await userPage.getByTestId("create-member").click();
  await expect(userPage.getByText("Member Details")).toBeVisible();

  const emailElement = userPage.getByTestId("create-member-email");
  await emailElement.fill(email);
  await emailElement.blur();

  await expect(
    userPage.getByText("This e-mail is already in use!"),
  ).toBeVisible();
});
