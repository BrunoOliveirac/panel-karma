import { expect, test } from "../../fixtures/auth.fixture";
import {
  createTicket,
  searchTickets,
  ticketCard,
  ticketStamp,
} from "../../helpers/ticket.helper";

function isoDaysAgo(days: number) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

test("Should show an empty list of tickets", async ({ emptyUserPage }) => {
  await emptyUserPage.goto("/home");
  await expect(emptyUserPage.getByTestId("spinner")).toBeHidden();
  await expect(emptyUserPage.getByText("Supports not found")).toBeVisible();
  await expect(emptyUserPage.getByTestId("ticket-count-all")).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(emptyUserPage.getByTestId("ticket-count-value-all")).toHaveText(
    "0",
  );
});

test("Should show a list of tickets", async ({ userPage }) => {
  await userPage.goto("/home");
  await expect(userPage.getByTestId("spinner")).toBeHidden();

  const title = `Printer ${ticketStamp()}`;
  await createTicket(userPage, title, "Paper jam");
  await searchTickets(userPage, title);

  const card = ticketCard(userPage, title);
  await expect(card).toBeVisible();
  await expect(card.getByTestId("ticket-user")).toBeVisible();
  await expect(card.getByText("Paper jam")).toBeVisible();
  await expect(card.getByText("Open", { exact: true })).toBeVisible();
  await expect(card.getByText("Assignee:", { exact: true })).toBeVisible();
});

test("Should change the page", async ({ userPage }) => {
  await userPage.goto("/home");
  await expect(userPage.getByTestId("spinner")).toBeHidden();

  for (let index = 0; index < 6; index++) {
    if (await userPage.getByTestId("pagination-link-2").isVisible()) break;

    await createTicket(
      userPage,
      `Pager ${ticketStamp()}`,
      "Extra support for the next page",
    );
  }

  const secondPage = userPage.getByTestId("pagination-link-2");
  await expect(secondPage).toBeVisible();
  await secondPage.click();
  await expect(secondPage).toHaveAttribute("data-active", "true");
});

test("Should filter the list", async ({ userPage }) => {
  await userPage.goto("/home");
  await expect(userPage.getByTestId("spinner")).toBeHidden();

  const stamp = ticketStamp();
  const title = `Printer ${stamp}`;
  await createTicket(userPage, title, "Paper jam");
  await createTicket(userPage, `Network ${stamp}`, "Loose cable");

  await searchTickets(userPage, title);
  await expect(ticketCard(userPage, title)).toBeVisible();
  await expect(userPage.getByText(`Network ${stamp}`)).not.toBeVisible();
});

test("Should show an empty list at filter", async ({ userPage }) => {
  await userPage.goto("/home");
  await expect(userPage.getByTestId("spinner")).toBeHidden();

  const title = `Printer ${ticketStamp()}`;
  await createTicket(userPage, title, "Paper jam");
  await searchTickets(userPage, title);
  await expect(ticketCard(userPage, title)).toBeVisible();

  await searchTickets(userPage, "ticket that does not exist");
  await expect(userPage.getByText("Supports not found")).toBeVisible();
});

test("Should filter tickets by status", async ({ userPage }) => {
  await userPage.goto("/home");
  await expect(userPage.getByTestId("spinner")).toBeHidden();

  const title = `Printer ${ticketStamp()}`;
  await createTicket(userPage, title, "Paper jam");
  await searchTickets(userPage, title);

  const card = ticketCard(userPage, title);
  await expect(card.getByText("Open", { exact: true })).toBeVisible();

  await userPage.getByTestId("ticket-count-open").click();
  await expect(userPage.getByTestId("ticket-count-open")).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(card.getByText("Open", { exact: true })).toBeVisible();

  await userPage.getByTestId("ticket-count-resolved").click();
  await expect(userPage.getByTestId("ticket-count-resolved")).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(userPage.getByText("Supports not found")).toBeVisible();
});

test("Should filter tickets by period", async ({ userPage }) => {
  await userPage.goto("/home");
  await expect(userPage.getByTestId("spinner")).toBeHidden();

  const title = `Printer ${ticketStamp()}`;
  await createTicket(userPage, title, "Paper jam");
  await searchTickets(userPage, title);
  await expect(ticketCard(userPage, title)).toBeVisible();

  const pastDay = isoDaysAgo(40);
  await userPage.getByTestId("period-picker-trigger").click();

  const pastDayButton = userPage.getByTestId(`period-day-left-${pastDay}`);
  for (let step = 0; step < 6 && !(await pastDayButton.isVisible()); step++) {
    await userPage.getByTestId("period-prev-left").click();
  }

  await pastDayButton.click();
  await userPage.getByTestId("period-apply").click();
  await expect(userPage.getByText("Supports not found")).toBeVisible();

  await userPage.getByTestId("period-picker-trigger").click();
  await userPage.getByTestId("period-preset-last_7_days").click();
  await userPage.getByTestId("period-apply").click();
  await expect(ticketCard(userPage, title)).toBeVisible();
});

test("Should open the support home on the open queue", async ({
  supportPage,
}) => {
  await supportPage.goto("/home");
  await expect(supportPage.getByTestId("spinner")).toBeHidden();

  await expect(supportPage.getByTestId("ticket-count-all")).toHaveCount(0);
  await expect(supportPage.getByTestId("ticket-count-open")).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(supportPage.getByTestId("ticket-search")).toBeVisible();
});
