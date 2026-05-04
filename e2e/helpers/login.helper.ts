import { UserTypeEnum } from "@/lib/enums/user-type.enum";
import type { Page } from "@playwright/test";

interface LoginParams {
  page: Page;
  email: string;
  password: string;
  type: UserTypeEnum;
}

const initialPageMap = new Map<UserTypeEnum, string>([
  [UserTypeEnum.USER, "/home"],
  [UserTypeEnum.ADMIN, "/dashboard"],
  [UserTypeEnum.SUPPORT, "/chat"],
]);

export async function login({ page, type, email, password }: LoginParams) {
  await page.goto("/login");
  await page.getByTestId("login-email").fill(email);
  await page.getByTestId("login-password").fill(password);
  await page.getByTestId("login-submit").click();
  await page.waitForTimeout(1000);

  await page.waitForURL(initialPageMap.get(type)!);
}
