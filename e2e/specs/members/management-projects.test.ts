import { Page } from "@playwright/test";
import { expect, test } from "../../fixtures/auth.fixture";

const openManageProjectsModal = async (userPage: Page) => {
  const firstMemberElement = userPage.getByTestId("member-row").first();
  await expect(firstMemberElement).toBeVisible();

  const firstMemberId = await firstMemberElement.getAttribute("id");
  await userPage.getByTestId(`manage-projects-member-${firstMemberId}`).click();

  await expect(userPage.getByTestId("management-projects-modal")).toBeVisible();
  await expect(userPage.getByTestId("spinner")).toBeHidden();

  return firstMemberId;
};

test("Should close the manage projects modal", async ({ userPage }) => {
  await userPage.goto("/members");
  await expect(userPage.getByTestId("spinner")).toBeHidden();

  await openManageProjectsModal(userPage);
  await userPage.getByTestId("management-projects-cancel").click();
  await expect(
    userPage.getByTestId("management-projects-modal"),
  ).not.toBeVisible();
});

test("Should filter the project list", async ({ userPage }) => {
  await userPage.goto("/members");
  await expect(userPage.getByTestId("spinner")).toBeHidden();

  await openManageProjectsModal(userPage);

  const projectCards = userPage.locator(
    '[data-slot^="management-projects-card-"]',
  );
  const firstProjectCard = projectCards.first();
  await expect(firstProjectCard).toBeVisible();

  const projectName =
    (await firstProjectCard.locator("p").first().textContent())?.trim() ?? "";

  await userPage.getByTestId("management-projects-filter").fill(projectName);
  await expect(projectCards).toHaveCount(1);
  await expect(userPage.getByText(projectName)).toBeVisible();
});

test("Should show an empty list at filter", async ({ userPage }) => {
  await userPage.goto("/members");
  await expect(userPage.getByTestId("spinner")).toBeHidden();

  await openManageProjectsModal(userPage);

  await userPage
    .getByTestId("management-projects-filter")
    .fill("filtering project");
  await expect(userPage.getByText("No projects found")).toBeVisible();
});

test("Should toggle a project selection", async ({ userPage }) => {
  await userPage.goto("/members");
  await expect(userPage.getByTestId("spinner")).toBeHidden();

  await openManageProjectsModal(userPage);

  const firstProjectCard = userPage
    .locator('[data-slot^="management-projects-card-"]')
    .first();
  await expect(firstProjectCard).toBeVisible();

  const initiallySelected =
    (await firstProjectCard.getAttribute("data-selected")) === "true";

  await firstProjectCard.click();
  await expect(firstProjectCard).toHaveAttribute(
    "data-selected",
    initiallySelected ? "false" : "true",
  );

  await firstProjectCard.click();
  await expect(firstProjectCard).toHaveAttribute(
    "data-selected",
    initiallySelected ? "true" : "false",
  );
});

test("Should update member projects successfully", async ({ userPage }) => {
  await userPage.goto("/members");
  await expect(userPage.getByTestId("spinner")).toBeHidden();

  await openManageProjectsModal(userPage);

  const projectCards = userPage.locator(
    '[data-slot^="management-projects-card-"]',
  );
  await expect(projectCards.first()).toBeVisible();

  const cardCount = await projectCards.count();
  let toggledCard = projectCards.first();
  let toggled = false;

  for (let index = 0; index < cardCount; index++) {
    const card = projectCards.nth(index);
    const isSelected = (await card.getAttribute("data-selected")) === "true";

    if (!isSelected) {
      toggledCard = card;
      await card.click();
      await expect(card).toHaveAttribute("data-selected", "true");
      toggled = true;
      break;
    }
  }

  if (!toggled) {
    await toggledCard.click();
    await expect(toggledCard).toHaveAttribute("data-selected", "false");
  }

  await userPage.getByTestId("management-projects-save").click();
  await expect(
    userPage.getByTestId("management-projects-modal"),
  ).not.toBeVisible();
  await expect(
    userPage.getByText("Projects updated successfully!"),
  ).toBeVisible();
});
