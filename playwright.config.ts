// Browser checks of the docs build and the sample brand book (npm run test:ui): contrast in both themes, axe, theme
// behaviour, every doc page, phone widths. Uses the installed Google Chrome (GitHub's ubuntu runners ship it), so no
// browser download is needed; PW_CHROMIUM=<path to a chromium binary> uses that one instead (cloud sandboxes).
import { defineConfig } from "@playwright/test";

const PORT = 4319;
export const BOOK_PORT = 4320;

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
  ],
});
