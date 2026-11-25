// Browser checks of the docs build and the sample brand book (npm run test:ui): contrast in both themes, axe, theme
// behaviour, every doc page, phone widths. Uses the installed Google Chrome (GitHub's ubuntu runners ship it), so no
// browser download is needed; PW_CHROMIUM=<path to a chromium binary> uses that one instead (cloud sandboxes).
import { defineConfig } from "@playwright/test";

// SEMI_UI_PORT (alias SEMI_PW_PORT_BASE) moves the three servers (port, +1, +2), so parallel worktrees can run
// test:ui at once (#143). reuseExistingServer is always false so a local run never attaches to another worktree's build.
const BASE_PORT = Number(process.env.SEMI_UI_PORT || process.env.SEMI_PW_PORT_BASE || 4319);
if (!Number.isInteger(BASE_PORT) || BASE_PORT < 1024 || BASE_PORT > 65533) {
  throw new Error(`SEMI_UI_PORT / SEMI_PW_PORT_BASE must be an integer between 1024 and 65533 (got ${BASE_PORT})`);
}
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
      reuseExistingServer: false,
    },
    {
      // The sample kit's brand book in out-brand/ (npm run build:brand-book first).
      command: `node scripts/serve-static.mjs out-brand ${BOOK_PORT}`,
      url: `http://127.0.0.1:${BOOK_PORT}/`,
      reuseExistingServer: false,
    },
    {
      // The server-rendered regression app (npm run build:prerender-test first): Next's router with Semi's URL helpers.
      command: `npx next start tests/prerender-app -p ${PRERENDER_PORT} -H 127.0.0.1`,
      url: `http://127.0.0.1:${PRERENDER_PORT}/filters/a`,
      reuseExistingServer: false,
    },
  ],
});
