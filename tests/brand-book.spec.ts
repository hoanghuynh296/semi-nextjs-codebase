// Browser checks of the brand book a kit shows (/semi-brand preview, its GitHub Pages site), built from the sample kit
// tests/fixtures/brand.json by npm run build:brand-book: every page reaches AA in both themes and every allowed
// style, axe finds no serious issue, and nothing spills out of its frame from a 320px phone to a desktop.
import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import kit from "./fixtures/brand.json" with { type: "json" };
import { lowContrast } from "./contrast";

const BOOK = "http://127.0.0.1:4320";
const PAGES = ["/", "/apps/", "/kit/", "/components/"];
const THEMES = ["dark", "light"] as const;
const WIDTHS = [320, 375, 768, 1280];

async function open(page: Page, path: string, theme: "dark" | "light", style = kit.styles.default) {
  await page.addInitScript(([t, s]) => {
    localStorage.setItem("semi-theme", t);
    localStorage.setItem("brand-preview-style", s);
  }, [theme, style] as const);
  await page.goto(BOOK + path);
  await page.addStyleTag({ content: "*,*::before,*::after{transition:none!important;animation:none!important}" });
}

/**
 * Elements that stick out of the screen, or whose content an overflow-hidden frame cuts (a sample screen's row),
 * except inside their own horizontal scroller (tables, code) and the collapsed sidebar.
 */
function spills(page: Page) {
  return page.evaluate(() => {
    const vw = document.documentElement.clientWidth;
    const out: string[] = [];
    const name = (el: Element) => `${el.tagName.toLowerCase()} "${(el.textContent || "").trim().replace(/\s+/g, " ").slice(0, 30)}"`;
    if (document.documentElement.scrollWidth > vw) out.push(`page ${document.documentElement.scrollWidth}px`);
    for (const el of document.querySelectorAll<HTMLElement>("main *")) {
      const cs = getComputedStyle(el);
      if (cs.position === "fixed" || el.closest("aside, .sr-only, [inert]")) continue;
      const b = el.getBoundingClientRect();
      if (!b.width || !b.height) continue;
      let scroller = false;
      for (let p = el.parentElement; p; p = p.parentElement) if (getComputedStyle(p).overflowX !== "visible") scroller = true;
      if (!scroller && (b.right > vw + 1 || b.left < -1)) out.push(name(el));
      const hidden = cs.overflowX === "hidden" || cs.overflowX === "clip";
      if (hidden && cs.textOverflow !== "ellipsis" && el.clientWidth > 0 && el.scrollWidth > el.clientWidth + 2) out.push(`cut: ${name(el)} ${el.scrollWidth}>${el.clientWidth}`);
    }
    return [...new Set(out)].slice(0, 5);
  });
}

for (const path of PAGES) {
  for (const theme of THEMES) {
    for (const style of kit.styles.allowed)
      test(`brand book · contrast AA · ${style} · ${theme} · ${path}`, async ({ page }) => {
        await open(page, path, theme, style);
        expect(await lowContrast(page)).toEqual([]);
      });
    test(`brand book · axe · ${theme} · ${path}`, async ({ page }) => {
      await open(page, path, theme);
      const { violations } = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
      const serious = violations.filter((v) => v.impact === "serious" || v.impact === "critical");
      expect(serious.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).slice(0, 3).join(" | ")}`)).toEqual([]);
    });
  }
  for (const width of WIDTHS)
    test(`brand book · nothing spills at ${width}px · ${path}`, async ({ browser }) => {
      const page = await browser.newPage({ viewport: { width, height: 900 }, isMobile: width < 500, hasTouch: width < 500 });
      await open(page, path, "light");
      expect(await spills(page)).toEqual([]);
      await page.close();
    });
}

test("brand book · sample screens use the brief's sample, not generic shop data", async ({ page }) => {
  await open(page, "/apps/", "light");
  await expect(page.getByText(kit.brief.sample.items[0]).first()).toBeVisible();
  await expect(page.getByText(kit.brief.sample.proof.value).first()).toBeVisible();
  await expect(page.getByText("Ví dụ: một con số thật")).toHaveCount(0);
});

test("brand book · one dashboard: Thương hiệu, Ứng dụng and UI kit share the menu", async ({ page }) => {
  await open(page, "/", "light");
  const menu = page.locator("aside");
  for (const label of ["Thương hiệu", "Ứng dụng", "UI kit"]) await expect(menu.getByRole("link", { name: label, exact: true })).toBeVisible();
  await menu.getByRole("link", { name: "Ứng dụng", exact: true }).click();
  await expect(page).toHaveURL(/\/apps\/$/);
});
