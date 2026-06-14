import { expect, test } from "../../../fixtures/auth.fixture";

test("Should close the client upsert modal", async ({ userPage }) => {
  await userPage.goto("/clients");
  await expect(userPage.getByTestId("spinner")).toBeHidden();
  userPage.getByTestId("create-client").click();
  await expect(userPage.getByText("Client Details")).toBeVisible();
  await userPage.getByTestId("upsert-client-cancel").click();
  await expect(userPage.getByText("Client Details")).not.toBeVisible();
});

test("Should open the client edit modal", async ({ userPage }) => {
  await userPage.goto("/clients");
  await expect(userPage.getByTestId("spinner")).toBeHidden();
  userPage.getByTestId("client-card").first().click();
  await expect(userPage.getByText("Client Details")).toBeVisible();
  await expect(userPage.getByTestId("copy-link")).toBeVisible();
});

test("Should open the edit client modal after reload", async ({ userPage }) => {
  await userPage.goto("/clients");
  await expect(userPage.getByTestId("spinner")).toBeHidden();

  const firstBook = userPage.getByTestId("client-card").first();
  firstBook.click();

  await expect(userPage.getByText("Client Details")).toBeVisible();

  // Reload the page and check if the modal is still open
  await userPage.reload();
  await expect(userPage).toHaveURL(/client=/i);
  await expect(userPage.getByTestId("copy-link")).toBeVisible();

  // Close the modal and check if the modal is closed
  await userPage.getByTestId("upsert-client-cancel").click();
  await expect(userPage.getByText("Client Details")).not.toBeVisible();
  await expect(userPage).not.toHaveURL(/client=/i);
});

test("Should see error at validate e-mail", async ({ userPage }) => {
  await userPage.goto("/clients");
  await expect(userPage.getByTestId("spinner")).toBeHidden();
  const email = await userPage.getByTestId("client-email").first().innerText();

  userPage.getByTestId("create-client").click();
  await expect(userPage.getByText("Client Details")).toBeVisible();

  // Fill the e-mail and press tab to validate e-mail
  const emailElement = userPage.getByTestId("upsert-client-email");
  await emailElement.fill(email);
  await emailElement.blur();

  await expect(
    userPage.getByText("This e-mail is already in use!"),
  ).toBeVisible();
});

test("Should create a client successfully", async ({ userPage }) => {
  await userPage.goto("/clients");
  await expect(userPage.getByTestId("spinner")).toBeHidden();

  // Open the create client modal
  userPage.getByTestId("create-client").click();
  await expect(userPage.getByText("Client Details")).toBeVisible();
  const now = new Date().getTime().toString().slice(-5);

  await userPage.getByTestId("upsert-client-name").fill(`Client ${now}`);

  // Fill the client information
  await userPage
    .getByTestId("upsert-client-email")
    .fill(`client${now}@email.com`);

  await userPage.getByPlaceholder("Enter the phone").fill("14984484848");
  await userPage.getByTestId("upsert-client-budget").fill("100000");

  // Open the selector of sectors
  await userPage.getByTestId("upsert-client-sector-trigger").click();

  // Get the first sector element
  const firstSelectItemElement = userPage
    .getByRole("listbox")
    .getByRole("option")
    .first();

  // Get the selected sector name
  const firstSelectItemContent =
    (await firstSelectItemElement.textContent()) || "";

  await firstSelectItemElement.click();
  await userPage.waitForTimeout(1000);

  await userPage.getByTestId("upsert-client-save").click();

  // Check if the modal is closed
  await expect(userPage.getByText("Client Details")).not.toBeVisible();

  // Filter the list and check if the client is there
  const filterElement = userPage.getByTestId("list-clients-search");
  await filterElement.fill(now);
  await expect(userPage.getByText(`Client ${now}`)).toBeVisible();

  // Check if the sector is being displayed
  await expect(userPage.getByText(firstSelectItemContent)).toBeVisible();
});

test("Should edit a client successfully", async ({ userPage }) => {
  await userPage.goto("/clients");
  await expect(userPage.getByTestId("spinner")).toBeHidden();

  // Open the edit client modal
  userPage.getByTestId("client-card").first().click();
  await expect(userPage.getByText("Client Details")).toBeVisible();
  await expect(userPage.getByTestId("copy-link")).toBeVisible();

  const now = new Date().getTime().toString().slice(-5);

  // Update the client name
  await userPage.getByTestId("upsert-client-name").fill(`Client ${now}`);

  // Update the client e-mail
  await userPage
    .getByTestId("upsert-client-email")
    .fill(`client${now}@email.com`);

  await userPage.getByTestId("upsert-client-save").click();

  // Check if the modal is closed
  await expect(userPage.getByText("Client Details")).not.toBeVisible();

  // Check the new client name
  await expect(userPage.getByTestId("client-name").first()).toHaveText(
    `Client ${now}`,
  );

  // Check the new client e-mail
  await expect(userPage.getByTestId("client-email").first()).toHaveText(
    `client${now}@email.com`,
  );
});
