/* eslint-disable @typescript-eslint/no-explicit-any */
import { Page, Route } from "@playwright/test";

type Mock = {
  url: string | RegExp;
  method?: string;
  status?: number;
  response: any;
};

export async function mockApi(page: Page, mocks: Mock[]) {
  await page.route("**/*", async (route: Route) => {
    const request = route.request();
    const url = request.url();
    const method = request.method();

    const mock = mocks.find((m) => {
      const urlMatch =
        typeof m.url === "string" ? url.includes(m.url) : m.url.test(url);

      const methodMatch = m.method ? m.method === method : true;
      return urlMatch && methodMatch;
    });

    if (mock) {
      return route.fulfill({
        status: mock.status || 200,
        contentType: "application/json",
        body: JSON.stringify(mock.response),
      });
    }

    // fallback: deixa a requisição real acontecer
    return route.continue();
  });
}
