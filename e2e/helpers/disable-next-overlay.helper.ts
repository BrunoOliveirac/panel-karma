import type { Page } from "@playwright/test";

/**
 * The Next.js dev overlay sits in the bottom corner and intercepts
 * clicks on sidebar actions such as logout.
 */
export async function disableNextOverlay(page: Page) {
  await page.addInitScript(() => {
    const style = document.createElement("style");
    style.textContent =
      "nextjs-portal { display: none !important; pointer-events: none !important; }";
    document.documentElement.appendChild(style);
  });
}
