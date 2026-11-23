// Browser checks of the docs build and the sample brand book (npm run test:ui): contrast in both themes, axe, theme
// behaviour, every doc page, phone widths. Uses the installed Google Chrome (GitHub's ubuntu runners ship it), so no
// browser download is needed; PW_CHROMIUM=<path to a chromium binary> uses that one instead (cloud sandboxes).
import { defineConfig } from "@playwright/test";

// SEMI_UI_PORT moves the three servers (port, +1, +2), so two worktrees can run test:ui at once (ds#111).
const BASE_PORT = Number(process.env.SEMI_UI_PORT ?? 4319);
const PORT = BASE_PORT;
export const BOOK_PORT = BASE_PORT + 1;
export const PRERENDER_PORT = BASE_PORT + 2;

export default defineConfig({
  testDir: "tests",
  fullyParallel: true,
  reporter: process.env.CI ? [["github"], ["list"]] : "list",
  use: { baseURL: `http://127.0.0.1:${PORT}`, ...(process.env.PW_CHROMIUM ? { launchOptions: { executablePath: process.env.PW_CHROMIUM } } : { channel: "chrome" }), colorScheme: "dark" },
  webServer: [
    {
      // Serves the static export in out/ (npm run build:storybook first).
      command: `node scripts/serve-static.mjs out ${PORT}`,
      url: `http://127.0.0.1:${PORT}/components/`,
      reuseExistingServer: !process.env.CI,
    },
    {
      // The sample kit's brand book in out-brand/ (npm run build:brand-book first).
      command: `node scripts/serve-static.mjs out-brand ${BOOK_PORT}`,
      url: `http://127.0.0.1:${BOOK_PORT}/`,
      reuseExistingServer: !process.env.CI,
    },
    {
      // The server-rendered regression app (npm run build:prerender-test first): Next's router with Semi's URL helpers.
      command: `npx next start tests/prerender-app -p ${PRERENDER_PORT} -H 127.0.0.1`,
      url: `http://127.0.0.1:${PRERENDER_PORT}/filters/a`,
      reuseExistingServer: !process.env.CI,
    },
  ],
});
