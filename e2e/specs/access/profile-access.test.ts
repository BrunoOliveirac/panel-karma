import type { Page } from "@playwright/test";
import { expect, test } from "../../fixtures/auth.fixture";

const openProfileSmoke = async (page: Page) => {
  await page.goto("/profile");

  await expect(page.getByTestId("profile-form")).toBeVisible();
  await expect(page.getByText("Manage profile")).toBeVisible();
  await expect(page.getByTestId("profile-save")).toBeVisible();
  await expect(page.getByTestId("profile-name")).not.toHaveValue("");
  await expect(page.getByTestId("profile-email")).not.toHaveValue("");
};

test("Should open profile as user", async ({ userPage }) => {
  await openProfileSmoke(userPage);
});

test("Should open profile as member", async ({ memberPage }) => {
  await openProfileSmoke(memberPage);
});

test("Should open profile as admin", async ({ adminPage }) => {
  await openProfileSmoke(adminPage);
});

test("Should open profile as support", async ({ supportPage }) => {
  await openProfileSmoke(supportPage);
});
