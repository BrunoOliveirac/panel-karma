import { expect, test } from "../../fixtures/auth.fixture";
import {
  createTicket,
  searchTickets,
  switchAccount,
  ticketCard,
  ticketStamp,
} from "../../helpers/ticket.helper";

test("User cancels the ticket confirmation", async ({ userPage }) => {
  await userPage.goto("/home");
  await expect(userPage.getByTestId("spinner")).toBeHidden();

  const title = `Printer ${ticketStamp()}`;
  await createTicket(userPage, title, "Paper jam");
  await searchTickets(userPage, title);

  const card = ticketCard(userPage, title);
  await expect(card).toBeVisible();
  await card.getByTestId("ticket-actions").click();
  await expect(userPage.getByTestId("ticket-action-accept")).toHaveCount(0);
  await expect(userPage.getByTestId("ticket-action-open-chat")).toHaveCount(0);
  await userPage.getByTestId("ticket-action-cancel").click();

  await expect(userPage.getByText("Cancel this request?")).toBeVisible();
  await userPage.getByRole("button", { name: "Cancel" }).click();
  await expect(userPage.getByText("Cancel this request?")).not.toBeVisible();
  await expect(card.getByText("Open", { exact: true })).toBeVisible();
});

test("User confirms the ticket cancellation", async ({ userPage }) => {
  await userPage.goto("/home");
  await expect(userPage.getByTestId("spinner")).toBeHidden();

  const title = `Printer ${ticketStamp()}`;
  await createTicket(userPage, title, "Paper jam");
  await searchTickets(userPage, title);

  const card = ticketCard(userPage, title);
  await card.getByTestId("ticket-actions").click();
  await userPage.getByTestId("ticket-action-cancel").click();
  await expect(userPage.getByText("Cancel this request?")).toBeVisible();
  await userPage.getByRole("button", { name: "Confirm" }).click();

  await expect(userPage.getByText("Request cancelled.").first()).toBeVisible();
  await userPage.reload();
  await expect(userPage.getByTestId("spinner")).toBeHidden();
  await searchTickets(userPage, title);

  const cancelled = ticketCard(userPage, title);
  await expect(cancelled.getByText("Cancelled", { exact: true })).toBeVisible();
  await expect(cancelled.getByTestId("ticket-actions")).toHaveCount(0);
});

test("Support accepts a ticket and opens the chat", async ({
  userPage,
}) => {
  await userPage.goto("/home");
  await expect(userPage.getByTestId("spinner")).toBeHidden();

  const title = `Printer ${ticketStamp()}`;
  await createTicket(userPage, title, "Paper jam");

  await switchAccount(userPage, "support");
  await searchTickets(userPage, title);

  const openCard = ticketCard(userPage, title);
  await expect(openCard).toBeVisible();
  await expect(openCard.getByText("Assignee:", { exact: true })).toHaveCount(0);
  await openCard.getByTestId("ticket-actions").click();
  await expect(userPage.getByTestId("ticket-action-accept")).toBeVisible();
  await expect(userPage.getByTestId("ticket-action-open-chat")).toHaveCount(0);
  await userPage.getByTestId("ticket-action-accept").click();
  await expect(userPage.getByText("Request accepted.").first()).toBeVisible();

  await switchAccount(userPage, "user");
  await searchTickets(userPage, title);

  const accepted = ticketCard(userPage, title);
  await expect(accepted.getByText("Pending", { exact: true })).toBeVisible();
  await accepted.getByTestId("ticket-actions").click();
  await expect(userPage.getByTestId("ticket-action-resolve")).toHaveCount(0);
  await expect(userPage.getByTestId("ticket-action-cancel")).toBeVisible();
  await expect(userPage.getByTestId("ticket-action-open-chat")).toBeVisible();
  await userPage.keyboard.press("Escape");

  await switchAccount(userPage, "support");
  await userPage.getByTestId("ticket-count-in_progress").click();
  await searchTickets(userPage, title);
  await ticketCard(userPage, title).getByTestId("ticket-actions").click();
  await userPage.getByTestId("ticket-action-open-chat").click();

  await expect(userPage).toHaveURL(/\/chat\?ticketId=/);
  await expect(userPage.getByText("Chat", { exact: true })).toBeVisible();
});

test("Support resolves an accepted ticket", async ({ userPage }) => {
  await userPage.goto("/home");
  await expect(userPage.getByTestId("spinner")).toBeHidden();

  const title = `Printer ${ticketStamp()}`;
  await createTicket(userPage, title, "Paper jam");

  await switchAccount(userPage, "support");
  await searchTickets(userPage, title);
  await ticketCard(userPage, title).getByTestId("ticket-actions").click();
  await userPage.getByTestId("ticket-action-accept").click();
  await expect(userPage.getByText("Request accepted.").first()).toBeVisible();

  await userPage.reload();
  await expect(userPage.getByTestId("spinner")).toBeHidden();
  await userPage.getByTestId("ticket-count-in_progress").click();
  await searchTickets(userPage, title);

  const card = ticketCard(userPage, title);
  await expect(card.getByText("Pending", { exact: true })).toBeVisible();
  await card.getByTestId("ticket-actions").click();
  await expect(userPage.getByTestId("ticket-action-open-chat")).toBeVisible();
  await expect(userPage.getByTestId("ticket-action-cancel")).toBeVisible();
  await userPage.getByTestId("ticket-action-resolve").click();

  await expect(userPage.getByText("Resolve this request?")).toBeVisible();
  await userPage.getByRole("button", { name: "Confirm" }).click();
  await expect(userPage.getByText("Request resolved.").first()).toBeVisible();

  await userPage.reload();
  await expect(userPage.getByTestId("spinner")).toBeHidden();
  await userPage.getByTestId("ticket-count-resolved").click();
  await searchTickets(userPage, title);
  await expect(
    ticketCard(userPage, title).getByText("Resolved", { exact: true }),
  ).toBeVisible();
});
