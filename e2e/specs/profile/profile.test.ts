import path from "path";
import { Page } from "@playwright/test";
import { expect, test } from "../../fixtures/auth.fixture";

const avatarFixture = path.join(
  process.cwd(),
  "e2e/fixtures/assets/avatar.png",
);

/**
 * Profile mutations hit the shared backend user — keep this file serial to
 * avoid racing PUT /profile across Chromium/Firefox/WebKit workers.
 */
test.describe.configure({ mode: "serial" });

const openProfile = async (page: Page) => {
  await page.goto("/profile");
  await expect(page.getByTestId("profile-form")).toBeVisible();
  await expect(page.getByTestId("profile-name")).not.toHaveValue("");
  await expect(page.getByTestId("profile-email")).not.toHaveValue("");
};

const removeAvatarIfPresent = async (page: Page) => {
  const removeButton = page.getByTestId("profile-avatar-remove");

  if (await removeButton.isVisible()) {
    await removeButton.click();
    await expect(page.getByText("Avatar removed successfully!")).toBeVisible();
    await expect(removeButton).toBeHidden();
  }
};

const openCropDialog = async (page: Page) => {
  await page.getByTestId("profile-avatar-input").setInputFiles(avatarFixture);
  await expect(page.getByTestId("profile-crop-dialog")).toBeVisible();
  await expect(page.getByText("Adjust photo")).toBeVisible();
  await expect(page.getByTestId("profile-crop-save")).toBeEnabled({
    timeout: 15_000,
  });
};

test("Should load the profile form with the logged user", async ({
  emptyUserPage,
}) => {
  await openProfile(emptyUserPage);

  await expect(emptyUserPage.getByText("Manage profile")).toBeVisible();
  await expect(emptyUserPage.getByTestId("profile-save")).toBeVisible();
  await expect(emptyUserPage.getByTestId("profile-password")).toBeVisible();

  await expect(
    emptyUserPage.getByTestId("profile-confirm-password"),
  ).toBeVisible();
});

test("Should not submit with an empty name", async ({ emptyUserPage }) => {
  await openProfile(emptyUserPage);

  await emptyUserPage.getByTestId("profile-name").fill("");
  await emptyUserPage.getByTestId("profile-save").click();

  await expect(emptyUserPage.getByText("This field is required")).toBeVisible();
});

test("Should not submit when passwords do not match", async ({
  emptyUserPage,
}) => {
  await openProfile(emptyUserPage);

  await emptyUserPage.getByTestId("profile-password").fill("Password1!");

  await emptyUserPage
    .getByTestId("profile-confirm-password")
    .fill("Password2!");

  await emptyUserPage.getByTestId("profile-save").click();
  await expect(emptyUserPage.getByText("Passwords do not match")).toBeVisible();
});

test("Should update the profile name successfully", async ({
  emptyUserPage,
}) => {
  await openProfile(emptyUserPage);

  const nameInput = emptyUserPage.getByTestId("profile-name");
  const originalName = await nameInput.inputValue();
  const now = Date.now().toString().slice(-5);
  const updatedName = `Empty User ${now}`;

  await nameInput.fill(updatedName);
  await emptyUserPage.getByTestId("profile-save").click();

  await expect(
    emptyUserPage.getByText("Profile updated successfully!"),
  ).toBeVisible();

  await expect(nameInput).toHaveValue(updatedName);

  // Restore the original name so the shared empty user stays stable.
  await nameInput.fill(originalName);
  await emptyUserPage.getByTestId("profile-save").click();

  await expect(
    emptyUserPage.getByText("Profile updated successfully!"),
  ).toBeVisible();

  await expect(nameInput).toHaveValue(originalName);
});

test("Should cancel the avatar crop dialog", async ({ emptyUserPage }) => {
  await openProfile(emptyUserPage);
  await removeAvatarIfPresent(emptyUserPage);
  await openCropDialog(emptyUserPage);

  await emptyUserPage.getByTestId("profile-crop-cancel").click();

  await expect(emptyUserPage.getByTestId("profile-crop-dialog")).toBeHidden();
  await expect(emptyUserPage.getByTestId("profile-avatar-remove")).toBeHidden();
});

test("Should update zoom inside the crop dialog", async ({ emptyUserPage }) => {
  await openProfile(emptyUserPage);
  await removeAvatarIfPresent(emptyUserPage);
  await openCropDialog(emptyUserPage);

  const zoom = emptyUserPage.getByTestId("profile-avatar-zoom");

  await zoom.evaluate((element) => {
    const input = element as HTMLInputElement;
    input.value = "2";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });

  await expect(zoom).toHaveValue("2");
  await emptyUserPage.getByTestId("profile-crop-cancel").click();
  await expect(emptyUserPage.getByTestId("profile-crop-dialog")).toBeHidden();
});

test("Should update and remove the avatar successfully", async ({
  emptyUserPage,
}) => {
  await openProfile(emptyUserPage);
  await removeAvatarIfPresent(emptyUserPage);
  await openCropDialog(emptyUserPage);

  await emptyUserPage.getByTestId("profile-crop-save").click();

  await expect(
    emptyUserPage.getByText("Avatar updated successfully!"),
  ).toBeVisible();
  await expect(emptyUserPage.getByTestId("profile-crop-dialog")).toBeHidden();
  await expect(
    emptyUserPage.getByTestId("profile-avatar-remove"),
  ).toBeVisible();

  await emptyUserPage.getByTestId("profile-avatar-remove").click();

  await expect(
    emptyUserPage.getByText("Avatar removed successfully!"),
  ).toBeVisible();
  await expect(emptyUserPage.getByTestId("profile-avatar-remove")).toBeHidden();
});
