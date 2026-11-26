// #206: the docs site itself. Full-screen examples (preview: "none") get a live iframe; an example preview never changes
// the docs page's route header; the docs nav stays expanded at 1024px, and its rail (below) shows one icon per group.
import { expect, test, type Page } from "@playwright/test";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const FULL_SCREEN = readdirSync("examples", { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .flatMap((d) => {
    try {
      const meta = JSON.parse(readFileSync(join("examples", d.name, "meta.json"), "utf8")) as { examples?: { file: string; preview?: string }[] };
      return (meta.examples ?? []).filter((e) => e.preview === "none").map((e) => ({ id: d.name, file: e.file }));
    } catch {
      return [];
    }
  });

/** The docs page's own breadcrumb (the route header outside any example). */
async function siteCrumbs(page: Page) {
  return page
    .locator('header[data-semi="RouteHeader"]')
    .first()
    .locator("ol > li")
    .evaluateAll((lis) => lis.map((li) => (li as HTMLElement).innerText.trim()).filter(Boolean));
}

test("every preview: none example has a full-screen route that renders it", async ({ page }) => {
  expect(FULL_SCREEN.length).toBeGreaterThan(10);
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  for (const { id, file } of FULL_SCREEN) {
    await page.goto(`/demo/example/${id}/${file}/`);
    const root = page.locator(`[data-example-full="${id}/${file}"]`);
    await expect(root, `${id}/${file}`).toBeAttached();
    // something of the example is on screen (a shell, a skeleton, a state, or the dialog FeatureIntro opens)
    await expect
      .poll(() => page.evaluate(() => [...document.querySelectorAll("[data-example-full] *, [role=dialog] *")].some((el) => (el as HTMLElement).offsetWidth > 0 && (el as HTMLElement).offsetHeight > 0)), { message: `${id}/${file} shows nothing` })
      .toBe(true);
    // no docs shell around it
    await expect(page.locator("[data-semi-nav-panel]").filter({ hasText: "Tất cả component" })).toHaveCount(0);
  }
  expect(errors).toEqual([]);
});

test("list-reader: the AppShell example is a live, lazy iframe with a full-screen link and a working Preview / Code switch", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/components/list-reader/");
  const block = page.locator('[data-example="list-reader/in-shell"]');
  const frameEl = block.locator("[data-example-frame] iframe");
  await block.scrollIntoViewIfNeeded();
  await expect(frameEl).toBeVisible();
  await expect(frameEl).toHaveAttribute("loading", "lazy");
  await expect(frameEl).toHaveAttribute("title", /In AppShell/);
  const box = await frameEl.boundingBox();
  expect(Math.round(box!.height)).toBe(560);
  // loaded: the example's AppShell and its list are inside the frame
  const frame = page.frameLocator('[data-example="list-reader/in-shell"] iframe');
  await expect(frame.locator('[data-semi="AppShell"]')).toBeVisible();
  await expect(frame.getByRole("heading", { name: "Hộp thư", level: 1 })).toBeVisible();
  await expect(block.getByRole("link", { name: /Mở toàn màn hình/ })).toHaveAttribute("href", /\/demo\/example\/list-reader\/in-shell\/$/);

  // keyboard: Tab reaches the full-screen link, then the switch; the arrow key shows the code, and back
  const link = block.getByRole("link", { name: /Mở toàn màn hình/ });
  await link.focus();
  await expect(link).toBeFocused();
  await page.keyboard.press("Tab");
  const code = block.getByRole("radio", { name: "Code" }).or(block.getByRole("tab", { name: "Code" })).or(block.getByRole("button", { name: "Code" }));
  const preview = block.getByRole("radio", { name: "Xem trước" }).or(block.getByRole("tab", { name: "Xem trước" })).or(block.getByRole("button", { name: "Xem trước" }));
  await expect(preview).toBeFocused();
  await code.click();
  await expect(block.locator("pre")).toBeVisible();
  await expect(block.locator("iframe")).toHaveCount(0);
  await preview.click();
  await expect(block.locator("iframe")).toBeVisible();
});

test("an example never changes the docs page's breadcrumb (list-reader inbox, recordTitle)", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/components/list-reader/");
  const inbox = page.locator('[data-example="list-reader/inbox"] [data-example-preview]');
  await expect(inbox.getByRole("heading", { name: /Báo giá hạt tiêu đen/ })).toBeVisible();
  await expect.poll(() => siteCrumbs(page)).toEqual(["Navigation & layout", "List + reader"]);
  // open another mail in the example: the site header stays the same (retry: the first click may land before hydration)
  await expect(async () => {
    await inbox.getByText("Trao đổi đơn hàng #1042", { exact: false }).first().click();
    await expect(inbox.getByRole("heading", { name: /#1042/ })).toBeVisible({ timeout: 1000 });
  }).toPass();
  await page.waitForTimeout(200);
  expect(await siteCrumbs(page)).toEqual(["Navigation & layout", "List + reader"]);
  await expect(page).toHaveTitle(/List \+ reader/);
});

test("docs nav at 1024px stays expanded; it is never one icon per component", async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 800 });
  await page.goto("/components/list-reader/");
  const panel = page.locator("[data-semi-nav-panel]");
  await expect(panel).toHaveCSS("width", "224px");
  await expect(panel.locator('nav[aria-label="Navigation & layout"]').getByRole("link", { name: "List + reader" })).toBeVisible();
  // the server HTML is already expanded (no script)
  const ssr = await page.context().browser()!.newPage({ javaScriptEnabled: false, viewport: { width: 1024, height: 800 } });
  await ssr.goto(page.url());
  await expect(ssr.locator("[data-semi-nav-panel]")).toHaveCSS("width", "224px");
  await ssr.close();
});

test("docs nav rail (900px): one icon per group with a tooltip, opening its pages; no cut text; the trail stays", async ({ page }) => {
  await page.setViewportSize({ width: 900, height: 800 });
  await page.goto("/components/list-reader/");
  const panel = page.locator("[data-semi-nav-panel]");
  await expect(panel).toHaveCSS("width", "72px");
  const groups = panel.locator('nav[aria-label="Nhóm component"]');
  await expect(groups).toBeVisible();
  // after hydration: no per-component entry is rendered in the rail at all
  await expect(panel.getByRole("link", { name: "List + reader" })).toHaveCount(0);
  const report = await panel.evaluate((root) =>
    [...root.querySelectorAll<HTMLElement>("nav a, nav button")]
      .filter((el) => el.offsetWidth > 0)
      .map((el) => {
        const icon = el.querySelector<SVGElement>('[data-semi="Icon"]');
        const texts = [...el.querySelectorAll<HTMLElement>("span")].filter((s) => {
          const r = s.getBoundingClientRect();
          return r.width > 2 && r.height > 2 && s.innerText.trim() !== "" && getComputedStyle(s).display !== "none";
        });
        return { label: el.textContent?.trim(), iconShown: Boolean(icon && icon.getBoundingClientRect().width > 0), visibleText: texts.map((x) => x.innerText.trim()) };
      }),
  );
  const groupCount = await groups.locator("button").count();
  expect(groupCount).toBeGreaterThanOrEqual(8);
  expect(groupCount).toBeLessThanOrEqual(10);
  expect(report.filter((r) => !r.iconShown)).toEqual([]);
  expect(report.filter((r) => r.visibleText.length > 0)).toEqual([]);
  // the docs trail is the same as in the expanded nav
  await expect.poll(() => siteCrumbs(page)).toEqual(["Navigation & layout", "List + reader"]);

  // keyboard: the current group is marked; focus shows its tooltip, Enter opens its pages, Enter on one navigates
  const nav = groups.getByRole("button", { name: "Navigation & layout" });
  await expect(nav).toHaveAttribute("class", /bg-item-selected/);
  await expect(async () => {
    await nav.focus();
    await expect(page.getByRole("tooltip").filter({ hasText: "Navigation & layout" })).toBeVisible({ timeout: 1000 });
  }).toPass();
  await page.keyboard.press("Enter");
  const menu = page.getByRole("menu");
  await expect(menu).toBeVisible();
  await expect(menu.getByRole("menuitemcheckbox", { name: "List + reader" }).or(menu.getByRole("menuitem", { name: "List + reader" }))).toBeVisible();
  await page.keyboard.press("Home");
  await page.keyboard.press("ArrowDown"); // App header, then App shell
  await expect(page.locator(":focus")).toHaveText(/App shell/);
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/components\/app-shell\/$/);
  await expect.poll(() => siteCrumbs(page)).toEqual(["Navigation & layout", "App shell"]);
});

test("docs nav expanded at 1440px: component items keep no icon (the group heading has it)", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/components/list-reader/");
  const group = page.locator('[data-semi-nav-panel] nav[aria-label="Navigation & layout"]');
  await expect(group.getByRole("link", { name: "List + reader" })).toBeVisible();
  const shown = await group.evaluate((nav) => [...nav.querySelectorAll('[data-semi="Icon"]')].filter((i) => i.getBoundingClientRect().width > 0).length);
  expect(shown).toBe(0);
  await expect(page.locator('nav[aria-label="Nhóm component"]')).toHaveCount(0);
});
