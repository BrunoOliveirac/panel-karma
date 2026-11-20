import { UserTypeEnum } from "@/lib/enums/user-type.enum";
import { expect, type Page } from "@playwright/test";
import { login } from "./login.helper";

const accounts = {
  user: {
    type: UserTypeEnum.USER,
    email: "user01@email.com",
    password: "User01@email.com",
  },
  support: {
    type: UserTypeEnum.SUPPORT,
    email: "support01@email.com",
    password: "Support01@email.com",
  },
} as const;

export function ticketStamp() {
  return `${Date.now().toString().slice(-8)}${Math.random().toString(36).slice(2, 6)}`;
}

export function ticketCard(page: Page, title: string) {
  return page.getByTestId("ticket-card").filter({ hasText: title });
}

export async function openStartSupport(page: Page) {
  await page.getByTestId("start-support").click({ force: true });
  await expect(page.getByTestId("start-support-modal")).toBeVisible();
}

export async function createTicket(
  page: Page,
  title: string,
  description: string,
) {
  await openStartSupport(page);
  await page.getByTestId("start-support-title").fill(title);
  await page.getByTestId("start-support-description").fill(description);

  const created = page.waitForResponse(
    (response) =>
      response.url().includes("/tickets/create") &&
      response.request().method() === "POST",
  );
  await page.getByTestId("start-support-save").click();
  expect((await created).ok()).toBeTruthy();

  await expect(
    page.getByText("Support created successfully!").first(),
  ).toBeVisible();
  await expect(page.getByTestId("start-support-modal")).not.toBeVisible();
}

export async function searchTickets(page: Page, query: string) {
  await page.getByTestId("ticket-search").fill(query);
}

/**
 * Log out before logging in again: an authenticated visit to /login
 * is sent back to the current home.
 * The logout control sits under the Next.js dev overlay, so a mouse
 * click never reaches it. Invoke the button directly.
 */
export async function switchAccount(
  page: Page,
  account: keyof typeof accounts,
) {
  const logoutResponse = page.waitForResponse(
    (response) =>
      response.url().includes("/api/logout") &&
      response.request().method() === "POST",
  );

  await page.getByTestId("logout").evaluate((button: HTMLButtonElement) => {
    button.click();
  });
  expect((await logoutResponse).ok()).toBeTruthy();
  await expect(page).toHaveURL(/\/login$/);

  await login({ page, ...accounts[account] });
  await expect(page.getByTestId("spinner")).toBeHidden();
}
