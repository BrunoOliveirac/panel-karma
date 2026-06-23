import { expect, test } from "../../../fixtures/auth.fixture";

test("Should show an empty list of projects", async ({ emptyUserPage }) => {
  await emptyUserPage.goto("/projects");
  await expect(emptyUserPage.getByTestId("spinner")).toBeHidden();
  await expect(emptyUserPage.getByText("Projects not found")).toBeVisible();
});

test("Should show a list of projects", async ({ emptyUserPage }) => {
  await emptyUserPage.goto("/projects");
  await expect(emptyUserPage.getByTestId("spinner")).toBeHidden();
  await expect(emptyUserPage.getByText("Projects not found")).toBeVisible();
});

test("Should change the page", async ({ userPage }) => {
  await userPage.goto("/projects");
  await expect(userPage.getByTestId("spinner")).toBeHidden();
  await expect(userPage.getByTestId("project-row").first()).toBeVisible();

  const secondPageElement = userPage.getByTestId("pagination-link-2");
  await secondPageElement.click();
  await expect(secondPageElement).toHaveAttribute("data-active", "true");
});

test("Should filter by project name", async ({ userPage }) => {
  await userPage.goto("/projects");
  await expect(userPage.getByTestId("spinner")).toBeHidden();

  const firstProjectRow = userPage.getByTestId("project-row").first();
  await expect(firstProjectRow).toBeVisible();

  const projectName =
    (await firstProjectRow.locator("td").first().textContent())?.trim() ?? "";

  const suffixTimestamp = projectName.split(" ").at(-1) ?? projectName;

  const secondProjectRow = userPage.getByTestId("project-row").nth(1);
  const hasSecondProject = await secondProjectRow.isVisible();

  const secondProjectName = hasSecondProject
    ? ((await secondProjectRow.locator("td").first().textContent())?.trim() ??
      "")
    : "";

  const filterElement = userPage.getByTestId("list-projects-search");
  await filterElement.fill(suffixTimestamp);

  await expect(userPage.getByText(projectName)).toBeVisible();

  if (hasSecondProject) {
    await expect(userPage.getByText(secondProjectName)).not.toBeVisible();
  }
});

test("Should filter by project client", async ({ userPage }) => {
  await userPage.goto("/projects");
  await expect(userPage.getByTestId("spinner")).toBeHidden();

  const firstProjectRow = userPage.getByTestId("project-row").first();
  await expect(firstProjectRow).toBeVisible();

  const clientName =
    (await firstProjectRow.locator("td").nth(1).textContent())?.trim() ?? "";

  await userPage.getByTestId("list-projects-client-filter").click();

  await userPage
    .getByRole("listbox")
    .getByRole("option", { name: clientName })
    .click();

  const projectRows = userPage.getByTestId("project-row");
  await expect(projectRows.first()).toBeVisible();

  const filteredRowCount = await projectRows.count();

  for (let index = 0; index < filteredRowCount; index++) {
    await expect(projectRows.nth(index).locator("td").nth(1)).toHaveText(
      clientName,
    );
  }
});

test("Should show an empty list at filter", async ({ userPage }) => {
  await userPage.goto("/projects");
  await expect(userPage.getByTestId("spinner")).toBeHidden();
  await expect(userPage.getByTestId("project-row").first()).toBeVisible();

  const filterElement = userPage.getByTestId("list-projects-search");
  await filterElement.fill("filtering project");
  await expect(userPage.getByText("Projects not found")).toBeVisible();
});

test("User cancels delete project confirmation", async ({ userPage }) => {
  await userPage.goto("/projects");
  await expect(userPage.getByTestId("spinner")).toBeHidden();
  const firstProjectElement = userPage.getByTestId("project-row").first();
  await expect(firstProjectElement).toBeVisible();

  const firstProjectId = await firstProjectElement.getAttribute("id");
  await userPage.getByTestId(`delete-project-${firstProjectId}`).click();

  await expect(userPage.getByText("Are you sure?")).toBeVisible();
  await userPage.getByRole("button", { name: "Cancel" }).click();
  await expect(userPage.getByText("Are you sure?")).not.toBeVisible();
});

test("User confirm the project deletion", async ({ userPage }) => {
  await userPage.goto("/projects");
  await expect(userPage.getByTestId("spinner")).toBeHidden();
  const firstProjectElement = userPage.getByTestId("project-row").first();
  await expect(firstProjectElement).toBeVisible();

  const firstProjectId = await firstProjectElement.getAttribute("id");
  await userPage.getByTestId(`delete-project-${firstProjectId}`).click();

  await expect(userPage.getByText("Are you sure?")).toBeVisible();
  await userPage.getByRole("button", { name: "Confirm" }).click();
  await expect(userPage.getByText("Are you sure?")).not.toBeVisible();

  await expect(
    userPage.getByTestId(`delete-project-${firstProjectId}`),
  ).not.toBeVisible();
});

test("Should deactivate project status", async ({ userPage }) => {
  await userPage.goto("/projects");
  await expect(userPage.getByTestId("spinner")).toBeHidden();

  const activeProjectRow = userPage
    .getByTestId("project-row")
    .filter({ has: userPage.getByTestId("active-project-status") })
    .first();

  await expect(activeProjectRow).toBeVisible();

  const projectId = await activeProjectRow.getAttribute("id");
  if (!projectId) throw new Error("Project id not found");

  const projectRow = userPage.locator(
    `[data-slot="project-row"][id="${projectId}"]`,
  );

  await projectRow.getByTestId(`toggle-project-status-${projectId}`).click();
  await expect(projectRow.getByTestId("active-project-status")).toBeVisible();
});

test("Should activate project status", async ({ userPage }) => {
  await userPage.goto("/projects");
  await expect(userPage.getByTestId("spinner")).toBeHidden();

  const inactiveProjectRow = userPage
    .getByTestId("project-row")
    .filter({ has: userPage.getByTestId("inactive-project-status") })
    .first();

  await expect(inactiveProjectRow).toBeVisible();
  const projectId = await inactiveProjectRow.getAttribute("id");

  if (!projectId) throw new Error("Project id not found");

  const projectRow = userPage.locator(
    `[data-slot="project-row"][id="${projectId}"]`,
  );

  await projectRow.getByTestId(`toggle-project-status-${projectId}`).click();
  await expect(projectRow.getByTestId("active-project-status")).toBeVisible();
});

test("Should open the project create modal", async ({ userPage }) => {
  await userPage.goto("/projects");
  await expect(userPage.getByTestId("spinner")).toBeHidden();
  userPage.getByTestId("create-project").click();
  await expect(userPage.getByText("Project Details")).toBeVisible();
});

test("Should open the project edit modal", async ({ userPage }) => {
  await userPage.goto("/projects");
  await expect(userPage.getByTestId("spinner")).toBeHidden();

  const firstProjectElement = userPage.getByTestId("project-row").first();
  await expect(firstProjectElement).toBeVisible();

  const firstProjectId = await firstProjectElement.getAttribute("id");
  await userPage.getByTestId(`edit-project-${firstProjectId}`).click();

  await expect(userPage.getByText("Project Details")).toBeVisible();
});
