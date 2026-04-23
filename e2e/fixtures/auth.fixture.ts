import { test as base, type Page } from "@playwright/test";
import { login } from "../helpers/login.helper";
import { UserTypeEnum } from "@/lib/enums/user-type.enum";

type UserFixtures = {
  userPage: Page;
  adminPage: Page;
  supportPage: Page;
};

export const test = base.extend<UserFixtures>({
  userPage: async ({ page }, Use) => {
    await login(page, UserTypeEnum.USER, "home");
    await Use(page);
  },

  adminPage: async ({ page }, Use) => {
    await login(page, UserTypeEnum.ADMIN, "dashboard");
    await Use(page);
  },

  supportPage: async ({ page }, Use) => {
    await login(page, UserTypeEnum.SUPPORT, "chat");
    await Use(page);
  },
});

export { expect } from "@playwright/test";
