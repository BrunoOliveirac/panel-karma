import type { Page } from "@playwright/test";
import { expect, test } from "../../fixtures/auth.fixture";

const sharedScreens = [
  {
    path: "/clients",
    itemTestId: "client-card",
    emptyText: "Clients not found",
  },
  {
    path: "/projects",
    itemTestId: "project-row",
    emptyText: "Projects not found",
  },
  {
    path: "/sectors",
    itemTestId: "sector-row",
    emptyText: "Sectors not found",
  },
] as const;

const openSharedScreenSmoke = async (
  page: Page,
  screen: (typeof sharedScreens)[number],
) => {
  await page.goto(screen.path);
  await expect(page.getByTestId("spinner")).toBeHidden();

  const firstItem = page.getByTestId(screen.itemTestId).first();
  const emptyState = page.getByText(screen.emptyText);

  await expect(firstItem.or(emptyState)).toBeVisible();
};

for (const screen of sharedScreens) {
  test(`Should open ${screen.path} as user`, async ({ userPage }) => {
    await openSharedScreenSmoke(userPage, screen);
  });

  test(`Should open ${screen.path} as member`, async ({ memberPage }) => {
    await openSharedScreenSmoke(memberPage, screen);
  });
}
