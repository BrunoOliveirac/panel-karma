import { UserTypeEnum } from "@/lib/enums/user-type.enum";
import type { Page } from "@playwright/test";

export async function login(
  page: Page,
  type: UserTypeEnum,
  redirectUrl: string,
) {
  await page.addInitScript(
    async ({ type }) => {
      document.cookie = "token=fake-token-123; path=/";

      document.cookie =
        "user=" +
        encodeURIComponent(
          JSON.stringify({
            type,
            id: "1",
            active: true,
            name: "Usuário Mock",
            email: "mock@email.com",
          }),
        ) +
        "; path=/";
    },
    { type },
  );

  await page.goto(`/${redirectUrl}`);
}
