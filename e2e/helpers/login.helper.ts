import { UserRouteMap, UserTypeEnum } from "@/lib/enums/user-type.enum";
import type { Page, Response } from "@playwright/test";

interface LoginParams {
  page: Page;
  email: string;
  password: string;
  type: UserTypeEnum;
}

function isProfileResponse(response: Response) {
  return (
    response.url().includes("/api/backend/profile") &&
    response.request().method() === "GET" &&
    response.ok()
  );
}

/**
 * After login/register the app only stores the httpOnly token cookie,
 * then loads `/profile` on the protected layout and redirects by user type.
 * Start listening before the submit click to avoid missing a fast response.
 */
export async function waitForAuthBootstrap(
  page: Page,
  type: UserTypeEnum,
  submit: () => Promise<void>,
) {
  const profileResponse = page.waitForResponse(isProfileResponse);
  await submit();
  await profileResponse;
  await page.waitForURL(UserRouteMap.get(type)!);
}

export async function login({ page, type, email, password }: LoginParams) {
  await page.goto("/login");
  await page.getByTestId("login-email").fill(email);
  await page.getByTestId("login-password").fill(password);

  await waitForAuthBootstrap(page, type, async () => {
    await page.getByTestId("login-submit").click();
  });
}
