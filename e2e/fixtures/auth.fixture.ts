import { test as base, type Page } from "@playwright/test";
import { login } from "../helpers/login.helper";
import { UserTypeEnum } from "@/lib/enums/user-type.enum";

type UserFixtures = {
  userPage: Page;
  adminPage: Page;
  supportPage: Page;
  emptyUserPage: Page;
};

export const test = base.extend<UserFixtures>({
  userPage: async ({ page }, Use) => {
    await login({
      page,
      type: UserTypeEnum.USER,
      email: "user01@email.com",
      password: "User01@email.com",
    });

    await Use(page);
  },

  emptyUserPage: async ({ page }, Use) => {
    await login({
      page,
      type: UserTypeEnum.USER,
      email: "emptyuser01@email.com",
      password: "Emptyuser01@email.com",
    });

    await Use(page);
  },

  adminPage: async ({ page }, Use) => {
    await login({
      page,
      type: UserTypeEnum.ADMIN,
      email: "admin01@email.com",
      password: "Admin01@email.com",
    });

    await Use(page);
  },

  supportPage: async ({ page }, Use) => {
    await login({
      page,
      type: UserTypeEnum.SUPPORT,
      email: "support01@email.com",
      password: "Support01@email.com",
    });

    await Use(page);
  },
});

export { expect } from "@playwright/test";
