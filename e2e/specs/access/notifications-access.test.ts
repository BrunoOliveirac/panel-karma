import type { Page } from "@playwright/test";
import { expect, test } from "../../fixtures/auth.fixture";

const openNotificationsSmoke = async (page: Page) => {
  await page.goto("/notifications");
  await expect(page.getByTestId("spinner")).toBeHidden();
  await expect(page.getByTestId("notification-filters")).toBeVisible();

  const timeline = page.getByTestId("notification-timeline");
  const emptyState = page.getByText("Notifications not found");

  await expect(timeline.or(emptyState)).toBeVisible();
};

test("Should open notifications as user", async ({ userPage }) => {
  await openNotificationsSmoke(userPage);
});

test("Should open notifications as member", async ({ memberPage }) => {
  await openNotificationsSmoke(memberPage);
});

test("Should open notifications as admin", async ({ adminPage }) => {
  await openNotificationsSmoke(adminPage);
});

test("Should open notifications as support", async ({ supportPage }) => {
  await openNotificationsSmoke(supportPage);
});
