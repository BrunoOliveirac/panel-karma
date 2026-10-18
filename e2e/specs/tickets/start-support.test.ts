import { expect, test } from "../../fixtures/auth.fixture";
import {
  createTicket,
  openStartSupport,
  searchTickets,
  ticketCard,
  ticketStamp,
} from "../../helpers/ticket.helper";

test("Should close the start support modal", async ({ userPage }) => {
  await userPage.goto("/home");
  await expect(userPage.getByTestId("spinner")).toBeHidden();

  await openStartSupport(userPage);
  await expect(userPage.getByText("Start support")).toBeVisible();
  await userPage.getByTestId("start-support-cancel").click();
  await expect(userPage.getByTestId("start-support-modal")).not.toBeVisible();
});

test("Should not submit with an empty title and description", async ({
  userPage,
}) => {
  await userPage.goto("/home");
  await expect(userPage.getByTestId("spinner")).toBeHidden();

  await openStartSupport(userPage);
  await userPage.getByTestId("start-support-save").click();
  await expect(userPage.getByText("This field is required")).toHaveCount(2);
  await expect(userPage.getByTestId("start-support-modal")).toBeVisible();
});

test("Should create a support successfully", async ({ userPage }) => {
  await userPage.goto("/home");
  await expect(userPage.getByTestId("spinner")).toBeHidden();

  const title = `Printer ${ticketStamp()}`;
  await createTicket(userPage, title, "Paper jam");

  await searchTickets(userPage, title);
  await expect(ticketCard(userPage, title)).toBeVisible();
  await expect(userPage.getByText("Paper jam")).toBeVisible();
});

test("Should hide start support from support users", async ({
  supportPage,
}) => {
  await supportPage.goto("/home");
  await expect(supportPage.getByTestId("spinner")).toBeHidden();
  await expect(supportPage.getByTestId("start-support")).toHaveCount(0);
});
