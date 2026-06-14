import { expect, test } from "../../../fixtures/auth.fixture";

test("Should show an empty list of clients", async ({ emptyUserPage }) => {
  await emptyUserPage.goto("/clients");
  await expect(emptyUserPage.getByTestId("spinner")).toBeHidden();
  await expect(emptyUserPage.getByText("Clients not found")).toBeVisible();
});

test("Should show a list of clients", async ({ userPage }) => {
  await userPage.goto("/clients");
  await expect(userPage.getByTestId("spinner")).toBeHidden();
  await expect(userPage.getByTestId("client-card").first()).toBeVisible();
});

test("Should change the page", async ({ userPage }) => {
  await userPage.goto("/clients");
  await expect(userPage.getByTestId("spinner")).toBeHidden();
  await expect(userPage.getByTestId("client-card").first()).toBeVisible();

  const thirdPageElement = userPage.getByTestId("pagination-link-3");
  await thirdPageElement.click();
  await expect(thirdPageElement).toHaveAttribute("data-active", "true");
});

test("Should filter the list", async ({ userPage }) => {
  await userPage.goto("/clients");
  await expect(userPage.getByTestId("spinner")).toBeHidden();
  await expect(userPage.getByTestId("client-card").first()).toBeVisible();

  const filterElement = userPage.getByTestId("list-clients-search");
  await filterElement.fill("Client 0");
  await expect(userPage.getByTestId("pagination-link-3")).not.toBeVisible();
});

test("Should show an empty list at filter", async ({ userPage }) => {
  await userPage.goto("/clients");
  await expect(userPage.getByTestId("spinner")).toBeHidden();
  await expect(userPage.getByTestId("client-card").first()).toBeVisible();

  const filterElement = userPage.getByTestId("list-clients-search");
  await filterElement.fill("Client @email.com");
  await expect(userPage.getByText("Clients not found")).toBeVisible();
});

test("Should change to the favorite category", async ({ userPage }) => {
  await userPage.goto("/clients");
  await expect(userPage.getByTestId("spinner")).toBeHidden();
  await expect(userPage.getByTestId("client-card").first()).toBeVisible();

  await userPage.getByTestId("tab-favorite").click();
  await expect(userPage.getByText("Clients not found")).toBeVisible();
});

test("Should favorite and unfavorite a client", async ({ userPage }) => {
  await userPage.goto("/clients");
  await expect(userPage.getByTestId("spinner")).toBeHidden();

  const firstClientElement = userPage.getByTestId("client-card").first();
  await expect(firstClientElement).toBeVisible();
  const firstClientId = await firstClientElement.getAttribute("id");

  const favoriteElement = userPage.getByTestId(
    `favorite-client-${firstClientId}`,
  );

  // Favorite the client
  await favoriteElement.click();
  await expect(favoriteElement).toHaveAttribute("id", "favorited-client");

  await expect(
    userPage.getByText("Client favorited successfully!"),
  ).toBeVisible({
    timeout: 3000,
  });

  // Unfavorite the client
  await favoriteElement.click();
  await expect(favoriteElement).toHaveAttribute("id", "unfavorited-client");

  await expect(
    userPage.getByText("Client unfavorited successfully!"),
  ).toBeVisible({
    timeout: 3000,
  });
});

test("User cancels delete client confirmation", async ({ userPage }) => {
  await userPage.goto("/clients");
  await expect(userPage.getByTestId("spinner")).toBeHidden();
  const firstClientElement = userPage.getByTestId("client-card").first();
  await expect(firstClientElement).toBeVisible();

  const firstClientId = await firstClientElement.getAttribute("id");
  await userPage.getByTestId(`delete-client-${firstClientId}`).click();

  await expect(userPage.getByText("Are you sure?")).toBeVisible();
  await userPage.getByRole("button", { name: "Cancel" }).click();
  await expect(userPage.getByText("Are you sure?")).not.toBeVisible();
});

test("User confirm the client deletion", async ({ userPage }) => {
  await userPage.goto("/clients");
  await expect(userPage.getByTestId("spinner")).toBeHidden();
  const firstClientElement = userPage.getByTestId("client-card").first();
  await expect(firstClientElement).toBeVisible();

  const firstClientId = await firstClientElement.getAttribute("id");
  await userPage.getByTestId(`delete-client-${firstClientId}`).click();

  await expect(userPage.getByText("Are you sure?")).toBeVisible();
  await userPage.getByRole("button", { name: "Confirm" }).click();
  await expect(userPage.getByText("Are you sure?")).not.toBeVisible();

  await expect(
    userPage.getByTestId(`delete-client-${firstClientId}`),
  ).not.toBeVisible();
});

test("Should open the client create modal", async ({ userPage }) => {
  await userPage.goto("/clients");
  await expect(userPage.getByTestId("spinner")).toBeHidden();
  userPage.getByTestId("create-client").click();
  await expect(userPage.getByText("Client Details")).toBeVisible();
  await expect(userPage.getByTestId("copy-link")).not.toBeVisible();
});

test("Should open the client edit modal", async ({ userPage }) => {
  await userPage.goto("/clients");
  await expect(userPage.getByTestId("spinner")).toBeHidden();
  userPage.getByTestId("client-card").first().click();
  await expect(userPage.getByText("Client Details")).toBeVisible();
  await expect(userPage.getByTestId("copy-link")).toBeVisible();
});
