import { Page } from "@playwright/test";
import { expect, test } from "../../../fixtures/auth.fixture";

const handleEditProject = async (userPage: Page) => {
  const firstProjectElement = userPage.getByTestId("project-row").first();
  await expect(firstProjectElement).toBeVisible();

  const firstProjectId = await firstProjectElement.getAttribute("id");
  await userPage.getByTestId(`edit-project-${firstProjectId}`).click();

  await expect(userPage.getByText("Project Details")).toBeVisible();
};

const selectFirstClient = async (userPage: Page) => {
  await userPage.getByTestId("upsert-project-client-trigger").click();

  const firstSelectItemElement = userPage
    .getByRole("listbox")
    .getByRole("option")
    .first();

  await firstSelectItemElement.click();
  await userPage.waitForTimeout(1000);
};

test("Should close the project upsert modal", async ({ userPage }) => {
  await userPage.goto("/projects");
  await expect(userPage.getByTestId("spinner")).toBeHidden();

  await userPage.getByTestId("create-project").click();
  await expect(userPage.getByText("Project Details")).toBeVisible();
  await userPage.getByTestId("upsert-project-cancel").click();
  await expect(userPage.getByText("Project Details")).not.toBeVisible();
});

test("Should not submit with an empty name", async ({ userPage }) => {
  await userPage.goto("/projects");
  await expect(userPage.getByTestId("spinner")).toBeHidden();

  await userPage.getByTestId("create-project").click();
  await expect(userPage.getByText("Project Details")).toBeVisible();

  await userPage.getByTestId("upsert-project-save").click();
  await expect(userPage.getByText("This field is required")).toHaveCount(2);
});

test("Should not submit without a client", async ({ userPage }) => {
  await userPage.goto("/projects");
  await expect(userPage.getByTestId("spinner")).toBeHidden();

  await userPage.getByTestId("create-project").click();
  await expect(userPage.getByText("Project Details")).toBeVisible();

  const now = new Date().getTime().toString().slice(-5);
  await userPage.getByTestId("upsert-project-name").fill(`Project ${now}`);
  await userPage.getByTestId("upsert-project-save").click();
  await expect(userPage.getByText("This field is required")).toBeVisible();
});

test("Should create a project successfully", async ({ userPage }) => {
  await userPage.goto("/projects");
  await expect(userPage.getByTestId("spinner")).toBeHidden();

  await userPage.getByTestId("create-project").click();
  await expect(userPage.getByText("Project Details")).toBeVisible();
  const now = new Date().getTime().toString().slice(-5);

  await userPage.getByTestId("upsert-project-name").fill(`Project ${now}`);
  await selectFirstClient(userPage);

  await userPage.getByTestId("upsert-project-save").click();
  await expect(userPage.getByText("Project Details")).not.toBeVisible();

  const filterElement = userPage.getByTestId("list-projects-search");
  await filterElement.fill(now);
  await expect(userPage.getByText(`Project ${now}`)).toBeVisible();
});

test("Should edit a project successfully", async ({ userPage }) => {
  await userPage.goto("/projects");
  await expect(userPage.getByTestId("spinner")).toBeHidden();

  await handleEditProject(userPage);

  const now = new Date().getTime().toString().slice(-5);
  await userPage.getByTestId("upsert-project-name").fill(`Project ${now}`);
  await userPage.getByTestId("upsert-project-save").click();

  await expect(userPage.getByText("Project Details")).not.toBeVisible();

  const filterElement = userPage.getByTestId("list-projects-search");
  await filterElement.fill(now);
  await expect(userPage.getByText(`Project ${now}`)).toBeVisible();
});
