import { UserRouteMap, UserTypeEnum } from "@/lib/enums/user-type.enum";
import type { Page } from "@playwright/test";

interface LoginParams {
  page: Page;
  email: string;
  password: string;
  type: UserTypeEnum;
}

export async function login({ page, type, email, password }: LoginParams) {
  await page.goto("/login");
  await page.getByTestId("login-email").fill(email);
  await page.getByTestId("login-password").fill(password);
  await page.getByTestId("login-submit").click();
  await page.waitForTimeout(1000);

  await page.waitForURL(UserRouteMap.get(type)!);
}
