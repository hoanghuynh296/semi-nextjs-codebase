// Browser checks of the docs build (npm run test:ui): contrast in both themes, axe, theme behaviour, every doc page.
// Uses the installed Google Chrome (GitHub's ubuntu runners ship it), so no browser download is needed.
import { defineConfig } from "@playwright/test";

const PORT = 4319;

export default defineConfig({
  testDir: "tests",
  fullyParallel: true,
  reporter: process.env.CI ? [["github"], ["list"]] : "list",
  use: { baseURL: `http://127.0.0.1:${PORT}`, channel: "chrome", colorScheme: "dark" },
  webServer: {
    // Serves the static export in out/ (npm run build:storybook first).
    command: `node scripts/serve-static.mjs out ${PORT}`,
    url: `http://127.0.0.1:${PORT}/components/`,
    reuseExistingServer: !process.env.CI,
  },
});
