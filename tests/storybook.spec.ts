// Browser checks of the docs export: every page (and every component doc) reaches WCAG AA in both themes, axe finds
// no serious issue, nothing overflows a phone, the theme applies before paint, dialogs and menus are
// keyboard-operable, and the agent files are served.
import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import tokens from "../tokens/tokens.json" with { type: "json" };
import docs from "../examples/list.generated.json" with { type: "json" };
import { a11yHits, lowContrast } from "./contrast";
import { densityAudit } from "../lint/density.mjs";

const DOC_PAGES = docs.map((d) => `/components/${d.id}/`);
const PAGES = ["/", "/components/", "/foundations/", "/brand/", "/lab/", "/demo/app-shell/", ...DOC_PAGES];
/** Pages checked at phone width: the gallery shows one example of every doc. */
const THEMES = ["dark", "light"] as const;
const example = (page: Page, id: string) => page.locator(`[data-example="${id}"]`);

async function open(page: Page, path: string, theme: "dark" | "light" | "system") {
  await page.addInitScript(([t]) => {
    localStorage.setItem("semi-theme", t);
    // Theme as soon as <body> exists = what the first paint uses (the inline ThemeScript runs in <head>).
    new MutationObserver((_, obs) => {
      if (document.body) {
        (window as unknown as { __firstPaintTheme?: string }).__firstPaintTheme = document.documentElement?.dataset.theme;
        obs.disconnect();
      }
    }).observe(document, { childList: true, subtree: true });
  }, [theme] as const);
  await page.goto(path);
  await page.addStyleTag({ content: "*,*::before,*::after{transition:none!important;animation:none!important}" });
}

for (const path of PAGES) {
  for (const theme of THEMES) {
    test(`a11y audit (contrast AA, edges, names, focus, targets) · ${theme} · ${path}`, async ({ page }) => {
      await open(page, path, theme);
      await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
      expect(await a11yHits(page)).toEqual([]);
    });

    test(`axe · ${theme} · ${path}`, async ({ page }) => {
      await open(page, path, theme);
      const { violations } = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
      const serious = violations.filter((v) => v.impact === "serious" || v.impact === "critical");
      expect(serious.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).slice(0, 3).join(" | ")}`)).toEqual([]);
    });
  }

  test(`fits a phone screen · ${path}`, async ({ browser }) => {
    const page = await browser.newPage({ viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true });
    await open(page, path, "light");
    expect(await phoneOverflow(page)).toEqual([]);
    expect(await page.evaluate(densityAudit, { scope: "main" })).toEqual([]);
    expect(await a11yHits(page)).toEqual([]);
    await page.close();
  });

  test(`density budgets (§4c) · ${path}`, async ({ page }) => {
    await open(page, path, "dark");
    expect(await page.evaluate(densityAudit, { scope: "main" })).toEqual([]);
  });

  test(`page never scrolls outside the shell · ${path}`, async ({ page }) => {
    await open(page, path, "dark");
    expect(await page.evaluate(() => (window.scrollTo(0, 500), window.scrollY))).toBe(0);
  });
}

/** Everything stays inside the page column (16px gutters) unless it sits in its own horizontal scroller. */
function phoneOverflow(page: Page) {
  return page.evaluate(() => {
    const col = document.querySelector("main > div")!;
    const cs = getComputedStyle(col);
    const cb = col.getBoundingClientRect();
    const left = cb.left + parseFloat(cs.paddingLeft) - 1;
    const right = cb.right - parseFloat(cs.paddingRight) + 1;
    const out: string[] = [];
    if (Math.round(cb.width) !== document.documentElement.clientWidth) out.push(`column ${Math.round(cb.width)}px`);
    for (const el of col.querySelectorAll<HTMLElement>("*")) {
      if (getComputedStyle(el).position === "fixed") continue;
      const b = el.getBoundingClientRect();
      if (!b.width) continue;
      let s = el.parentElement;
      let clipped = false;
      while (s && s !== col) {
        if (getComputedStyle(s).overflowX !== "visible") clipped = true;
        s = s.parentElement;
      }
      if (!clipped && (b.right > right || b.left < left)) out.push(`${el.tagName.toLowerCase()} "${(el.textContent || "").trim().slice(0, 30)}"`);
    }
    return out.slice(0, 5);
  });
}

/** Pick a theme in the route header's theme menu of the docs site. */
async function pickTheme(page: Page, name: "Sáng" | "Tối" | "Hệ thống") {
  await page.locator("header").getByRole("button", { name: "Giao diện", exact: true }).click();
  await page.getByRole("menu", { name: "Giao diện" }).getByRole("menuitemradio", { name }).click();
}

// ─── Docs site ───────────────────────────────────────────────────────────────────────────────────────────────────

test("the menu marks the page you are on, and follows navigation", async ({ page }) => {
  await open(page, "/components/button/", "dark");
  const nav = page.locator("aside");
  const link = (name: string) => nav.getByRole("link", { name, exact: true });
  await expect(link("Button")).toHaveAttribute("aria-current", "page");
  await link("Modal").click();
  await expect(page).toHaveURL(/\/components\/modal\/$/);
  await expect(link("Modal")).toHaveAttribute("aria-current", "page");
  await expect(link("Button")).not.toHaveAttribute("aria-current", "page");
});

test("an example switches to its exact code and copies the page markdown", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await open(page, "/components/button/", "dark");
  const ex = example(page, "button/variants");
  await ex.getByRole("button", { name: "Code" }).click();
  await expect(ex.locator("pre code")).toContainText('import { Button } from "@semi/ui";');
  await page.getByRole("button", { name: "Copy page" }).click();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toContain("# Button");
});

for (const d of docs) {
  test(`doc page · ${d.id}: title, import, examples and API`, async ({ page, request }) => {
    await open(page, `/components/${d.id}/`, "dark");
    await expect(page).toHaveTitle(`${d.title} — Semi Design System`);
    expect(await page.locator("[data-example]").count()).toBeGreaterThan(0);
    if (d.components.length) {
      await expect(page.locator("article").getByText(/^import \{ \w.*\} from "@semi\/ui";$/)).toBeVisible();
      await expect(page.getByRole("heading", { name: "API" })).toBeVisible();
    } else await expect(page.getByRole("heading", { name: "Import" })).toHaveCount(0); // a pattern page (agent-run)
    expect((await request.get(`/docs/components/${d.id}.md`)).status()).toBe(200);
  });
}

test("stored theme is applied before the first paint and survives reload", async ({ page }) => {
  await open(page, "/components/", "light");
  expect(await page.evaluate(() => (window as unknown as { __firstPaintTheme?: string }).__firstPaintTheme)).toBe("light");
  // the static HTML is clickable before React hydrates (slow on CI with every preview on the page): retry the click
  await expect(async () => {
    await pickTheme(page, "Tối");
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark", { timeout: 1000 });
  }).toPass();
  expect(await page.evaluate(() => localStorage.getItem("semi-theme"))).toBe("dark");
});

test("one look: the docs offer no style switch, and a leftover data-style changes nothing", async ({ page }) => {
  const radius = () => page.evaluate(() => getComputedStyle(document.querySelector(".rounded-card")!).borderTopLeftRadius);
  await open(page, "/components/", "dark");
  expect(await radius()).toBe("12px");
  await expect(page.getByRole("radiogroup", { name: "Style" })).toHaveCount(0);
  await page.evaluate(() => document.documentElement.setAttribute("data-style", "soft"));
  expect(await radius()).toBe("12px");
});

test("brand preview: a #brand= link sets the brand fills on every page, passes contrast in both themes, and turns off", async ({ page }) => {
  const brand = { name: "Blue Co", package: "@blue/brand", primary: "#2563EB", fonts: { sans: "Manrope" } };
  const hash = Buffer.from(JSON.stringify(brand)).toString("base64url");
  const primary = () => page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue("--semi-primary").trim().toLowerCase());
  const canvas = () => page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue("--semi-canvas").trim().toLowerCase());
  await open(page, `/components/#brand=${hash}`, "dark");
  await expect(page.getByText("Blue Co", { exact: true })).toBeVisible();
  for (const theme of THEMES) {
    await pickTheme(page, theme === "dark" ? "Tối" : "Sáng");
    // 1.0: the brand fill is the brand colour as given, the same in both themes; the surfaces stay Semi's neutrals.
    await expect.poll(primary).toBe("#2563eb");
    await expect.poll(canvas).toBe(theme === "dark" ? "#101010" : "#ebebeb");
    expect(await lowContrast(page)).toEqual([]);
  }
  await pickTheme(page, "Tối");
  await page.goto("/components/button/"); // stays on across pages (applied once the page hydrates)
  await expect.poll(primary).toBe("#2563eb");
  await page.getByRole("button", { name: "Tắt xem trước brand" }).click();
  await expect.poll(primary).toBe("#00ae42"); // Semi's own green again
});

// ─── Design Lab (docs/LAB.md) ───────────────────────────────────────────────────────────────────────────────────

/** Computed `prop` of a fresh element with `cls` inside a wrapper with `attrs` (data-density, data-theme …). */
const probe = (page: Page, attrs: Record<string, string>, cls: string, prop: string) =>
  page.evaluate(
    ([a, c, p]) => {
      const w = document.createElement("div");
      for (const [k, v] of Object.entries(a as Record<string, string>)) w.setAttribute(k, v);
      const el = document.createElement("div");
      el.className = c as string;
      w.appendChild(el);
      document.body.appendChild(w);
      const v = getComputedStyle(el).getPropertyValue(p as string);
      w.remove();
      return v;
    },
    [attrs, cls, prop] as const,
  );
const labHash = (d: object) => Buffer.from(JSON.stringify({ $semiLab: 1, type: {}, density: {}, typeScale: {}, shape: {}, params: {}, ...d })).toString("base64url");
const px = (v: string) => `${parseFloat(v) * (v.endsWith("rem") ? 16 : 1)}px`;

test("Design Lab: every value it edits reaches the utility apps use (no value is frozen at build time)", async ({ page }) => {
  // Each type size and each shape token with a utility gets a distinct value; the real utility must follow it.
  const sizes = Object.keys(tokens.type).filter((k) => !k.includes("--") && !(tokens.type as Record<string, { deprecated?: boolean }>)[k]?.deprecated);
  const type = Object.fromEntries(sizes.map((k, i) => [k, `${30 + i}px`]));
  const shape: [string, string, string, string][] = [
    ["radius-chip", "0.5625rem", "rounded-chip", "border-top-left-radius"],
    ["radius-control", "0.6875rem", "rounded-control", "border-top-left-radius"],
    ["radius-card", "1.3125rem", "rounded-card", "border-top-left-radius"],
    ["radius-panel", "1.8125rem", "rounded-panel", "border-top-left-radius"],
    ["spacing-control", "47px", "h-control", "height"],
    ["spacing-field", "53px", "h-field", "height"],
    ["spacing", "0.3125rem", "p-4", "padding-top"],
  ];
  const shapeDraft = { ...Object.fromEntries(shape.map(([k, v]) => [k, v])), "card-border": "3px solid red", "font-weight-title": "800" };
  await open(page, `/components/#lab=${labHash({ type, shape: shapeDraft })}`, "dark");
  await expect(page.getByText("Design Lab", { exact: true })).toBeVisible();
  for (const [k, v] of Object.entries(type)) await expect.poll(() => probe(page, {}, k, "font-size"), { message: k }).toBe(v);
  for (const attrs of [{}, { "data-theme": "light" }]) {
    for (const [k, v, cls, prop] of shape) expect(await probe(page, attrs, cls, prop), k).toBe(k === "spacing" ? px(`${parseFloat(v) * 4}rem`) : px(v));
    expect(await probe(page, attrs, "border-card", "border-top-width"), "card-border").toBe("3px");
    expect(await probe(page, attrs, "font-title", "font-weight"), "font-weight-title").toBe("800");
  }
});

test("Design Lab: a draft follows every page, keeps each density its own values, pauses, and its tabs pass AA", async ({ page }) => {
  const draft = { type: { "text-ui": "17px", "text-chrome": "11px" }, density: { compact: { spacing: "0.3rem" } }, shape: { "radius-card": "1.5rem" } };
  await open(page, `/components/button/#lab=${labHash(draft)}`, "dark");
  await expect.poll(() => probe(page, {}, "text-ui", "font-size")).toBe("17px");
  expect(await probe(page, {}, "rounded-card", "border-top-left-radius")).toBe("24px");
  expect(await probe(page, { "data-theme": "light" }, "rounded-card", "border-top-left-radius")).toBe("24px"); // nested theme scopes too
  expect(await probe(page, { "data-density": "compact" }, "text-ui", "font-size")).toBe("13px"); // compact keeps its own size
  expect(await probe(page, { "data-density": "compact" }, "p-4", "padding-top")).toBe("19.2px");
  await page.goto("/components/"); // stored: stays on across pages
  await expect.poll(() => probe(page, {}, "text-ui", "font-size")).toBe("17px");
  await page.getByRole("button", { name: "Tạm tắt bản nháp Lab (xem bản gốc)" }).click();
  await expect.poll(() => probe(page, {}, "text-ui", "font-size")).toBe("14px");
  await page.getByRole("button", { name: "Bật lại bản nháp Lab" }).click();
  await expect.poll(() => probe(page, {}, "text-ui", "font-size")).toBe("17px");

  // Every tab of the Lab, both themes: the sample brands of the colour tab included.
  await page.goto(`/lab/#lab=${labHash({ ...draft, params: { hoverStep: 0.08 } })}`);
  await page.addStyleTag({ content: "*,*::before,*::after{transition:none!important;animation:none!important}" });
  for (const theme of THEMES) {
    await pickTheme(page, theme === "dark" ? "Tối" : "Sáng");
    for (const tab of ["Chữ", "Hình khối", "Màu", "Thay đổi"]) {
      await page.getByRole("tab", { name: new RegExp(`^${tab}`) }).click();
      expect(await lowContrast(page), `${theme} · ${tab}`).toEqual([]);
      const { violations } = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
      expect(violations.filter((v) => v.impact === "serious" || v.impact === "critical").map((v) => `${tab}: ${v.id}`)).toEqual([]);
    }
  }
  await expect(page.getByRole("cell", { name: "hoverStep" })).toBeVisible();
  await page.getByRole("button", { name: "Bỏ bản nháp" }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Bỏ bản nháp" }).click();
  await expect(page.getByText("Bản nháp đang trống")).toBeVisible();
  expect(await probe(page, {}, "text-ui", "font-size")).toBe("14px");
});

test("system theme follows prefers-color-scheme", async ({ browser }) => {
  for (const scheme of ["light", "dark"] as const) {
    const page = await browser.newPage({ colorScheme: scheme });
    await open(page, "/components/", "system");
    expect(await page.evaluate(() => (window as unknown as { __firstPaintTheme?: string }).__firstPaintTheme)).toBe(scheme);
    await page.close();
  }
});

// ─── Components ──────────────────────────────────────────────────────────────────────────────────────────────────

test("Modal traps focus, closes on Escape and returns focus to the opener", async ({ page }) => {
  await open(page, "/components/modal/", "dark");
  const opener = page.getByRole("button", { name: "Cấu hình in" });
  await opener.click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog).toHaveAttribute("aria-labelledby", /.+/);
  for (let i = 0; i < 12; i++) {
    await page.keyboard.press("Tab");
    expect(await dialog.evaluate((d) => d.contains(document.activeElement))).toBe(true);
  }
  expect(await page.evaluate(() => document.body.style.overflow)).toBe("hidden");
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(opener).toBeFocused();
});

test("Escape closes the layer inside a Modal first; Tab in a portaled Popover does not jump back into the Modal", async ({ page }) => {
  await open(page, "/components/modal/", "dark");
  await example(page, "modal/layers").getByRole("button", { name: "Chọn vật liệu" }).click();
  const dialog = page.getByRole("dialog", { name: "Vật liệu in" });
  await expect(dialog).toBeVisible();
  // the select: Escape closes the list only
  const select = dialog.getByRole("button", { name: "Vật liệu" });
  await select.focus();
  await page.keyboard.press("ArrowDown");
  const list = page.getByRole("listbox");
  await expect(list).toBeVisible();
  await expect(select).toHaveAttribute("aria-activedescendant", /.+/);
  await page.keyboard.press("End");
  await page.keyboard.press("Enter");
  await expect(select).toHaveText(/ABS/);
  await page.keyboard.press("ArrowDown");
  await expect(list).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(list).toBeHidden();
  await expect(dialog).toBeVisible();
  // the popover: Tab moves inside it, Escape closes it and returns to its trigger, the Modal stays
  const trigger = dialog.getByRole("button", { name: "Nhiệt độ gợi ý" });
  await trigger.click();
  const pop = page.getByRole("dialog", { name: "Nhiệt độ gợi ý" });
  await expect(pop).toBeVisible();
  await expect(pop.getByRole("button", { name: "Áp dụng" })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(pop).toBeHidden();
  await expect(trigger).toBeFocused();
  await expect(dialog).toBeVisible();
  // a second Escape closes the Modal
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
});

test("Menu opens from the keyboard and Escape returns focus", async ({ page }) => {
  await open(page, "/components/menu/", "dark");
  const trigger = example(page, "menu/row-actions").getByRole("button", { name: "Thao tác máy in" });
  await trigger.focus();
  await page.keyboard.press("ArrowDown");
  const menu = page.getByRole("menu");
  await expect(menu).toBeVisible();
  await expect(page.getByRole("menuitem", { name: "Đổi tên" })).toBeFocused();
  await page.keyboard.press("ArrowDown");
  await expect(page.getByRole("menuitem", { name: "Nhân bản" })).toBeFocused();
  await page.keyboard.press("ArrowDown"); // skips the disabled item
  await expect(page.getByRole("menuitem", { name: "Xoá" })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(menu).toBeHidden();
  await expect(trigger).toBeFocused();
});

test("Menu: groups, a reason for a disabled item, type-ahead, danger last, hidden items left out (#90)", async ({ page }) => {
  await open(page, "/components/menu/", "dark");
  const trigger = example(page, "menu/grouped").getByRole("button", { name: "Thao tác" });
  await expect(trigger).toHaveAttribute("aria-haspopup", "menu");
  await trigger.click();
  const menu = page.getByRole("menu", { name: "Thao tác với danh sách khách hàng" });
  await expect(menu.getByRole("group", { name: "Xuất" })).toBeVisible();
  await expect(menu.getByRole("group", { name: "Xem" })).toBeVisible();
  // the danger item is first in the code and last on screen; the hidden one is not listed
  const names = await menu.locator("[role^=menuitem]").evaluateAll((els) => els.map((e) => e.querySelector("[data-label]")?.textContent));
  expect(names[names.length - 1]).toBe("Xoá danh sách");
  expect(names).not.toContain("Chỉ quản trị viên");
  // a disabled item with a reason stays reachable and is described by it
  const zalo = menu.getByRole("menuitem", { name: "Gửi qua Zalo" });
  await expect(zalo).toHaveAttribute("aria-disabled", "true");
  await expect(zalo).toHaveAccessibleDescription("Chưa kết nối Zalo OA");
  await expect(menu.getByRole("menuitemcheckbox", { name: "Hiển thị gọn" })).toHaveAttribute("aria-checked", "false");
  // type-ahead: "g" jumps to Gửi qua Zalo
  await page.keyboard.press("g");
  await expect(zalo).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(menu).toBeVisible(); // a disabled item does nothing
  await page.keyboard.press("Escape");
  await expect(trigger).toBeFocused();
  // Space activates a link item (an <a>, which would not by itself)
  await trigger.click();
  await page.keyboard.press("m");
  await expect(menu.getByRole("menuitem", { name: "Mở trang cài đặt" })).toBeFocused();
  await page.keyboard.press(" ");
  await expect(page).toHaveURL(/#settings$/);
  await expect(menu).toBeHidden();
});

test("Menu on a phone opens as a bottom sheet; SplitButton becomes one button with the main action first (#90)", async ({ browser }) => {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await open(page, "/components/menu/", "dark");
  await example(page, "menu/row-actions").getByRole("button", { name: "Thao tác máy in" }).click();
  const menu = page.getByRole("menu");
  const box = (await menu.boundingBox())!;
  expect(box.x).toBe(0);
  expect(box.width).toBe(390);
  expect(Math.round(box.y + box.height)).toBe(844);
  await page.keyboard.press("Escape");
  await open(page, "/components/split-button/", "dark");
  const wide = example(page, "split-button/toolbar").getByRole("group", { name: "Thêm khách hàng" });
  await expect(wide).toBeHidden();
  const one = example(page, "split-button/toolbar").getByRole("button", { name: "Thêm khách hàng" });
  await expect(one).toHaveAttribute("aria-haspopup", "menu");
  await one.click();
  await expect(page.getByRole("menu").getByRole("menuitem").first()).toHaveText(/Thêm khách hàng/);
  await page.close();
});

test("SplitButton: main action, a named menu button with aria-expanded, focus back on Escape (#90)", async ({ page }) => {
  await open(page, "/components/split-button/", "dark");
  const group = example(page, "split-button/toolbar").getByRole("group", { name: "Thêm khách hàng" });
  await group.getByRole("button", { name: "Thêm khách hàng" }).click();
  await expect(page.getByText("Mở biểu mẫu thêm khách hàng")).toBeVisible();
  const more = group.getByRole("button", { name: "Cách thêm khác" });
  await expect(more).toHaveAttribute("aria-expanded", "false");
  await more.focus();
  await page.keyboard.press("Enter");
  await expect(more).toHaveAttribute("aria-expanded", "true");
  await expect(page.getByRole("menuitem", { name: /Nhập từ file/ })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(more).toBeFocused();
});

test("CardActions: hidden until hover or focus, named, and clicks do not open the card (#102)", async ({ page }) => {
  await open(page, "/components/card-actions/", "dark");
  const grid = example(page, "card-actions/grid");
  const actions = grid.getByRole("group", { name: "Thao tác với Gia vị Tây Nguyên" });
  const send = actions.getByRole("button", { name: "Gửi hỏi giá" });
  expect(await send.evaluate((el) => getComputedStyle(el.parentElement!).opacity)).toBe("0");
  await grid.getByRole("button", { name: "Gia vị Tây Nguyên Đắk Lắk" }).focus();
  await page.keyboard.press("Tab");
  await expect(send).toBeFocused();
  await expect.poll(() => send.evaluate((el) => getComputedStyle(el.parentElement!).opacity)).toBe("1");
  await send.click();
  await expect(page.getByText("Gửi hỏi giá Gia vị Tây Nguyên")).toBeVisible();
  await expect(page.getByText("Mở Gia vị Tây Nguyên")).toHaveCount(0);
  await actions.getByRole("button", { name: "Thao tác với Gia vị Tây Nguyên" }).click();
  await expect(page.getByRole("menuitem")).toHaveText([/Sửa/, /Ngừng hợp tác/]);
});

test("CardActions on touch: one always-visible ⋯ with every action (#102)", async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 430, height: 932 }, hasTouch: true, isMobile: true });
  const page = await context.newPage();
  await open(page, "/components/card-actions/", "dark");
  const actions = example(page, "card-actions/grid").getByRole("group", { name: "Thao tác với Gia vị Tây Nguyên" });
  await expect(actions.getByRole("button", { name: "Gửi hỏi giá" })).toBeHidden();
  const more = actions.getByRole("button", { name: "Thao tác với Gia vị Tây Nguyên" });
  await expect(more).toBeVisible();
  await more.click();
  await expect(page.getByRole("menuitem")).toHaveText([/Gửi hỏi giá/, /Ghim/, /Sửa/, /Ngừng hợp tác/]);
  await context.close();
});

test("DetailOverlay: opens by URL, ‹ › and ← → step with n / N, Back closes it, focus returns (#102)", async ({ page }) => {
  await open(page, "/components/detail-overlay/", "dark");
  const list = example(page, "detail-overlay/list");
  const row = list.getByRole("button", { name: /Nhà sách Phú Lợi.*DH-1041/ });
  await row.click();
  await expect(page).toHaveURL(/[?&]item=DH-1041/);
  const dialog = page.getByRole("dialog", { name: "Đơn DH-1041" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText("Mục 2 trên 12")).toHaveCount(1);
  await expect(dialog.getByText("2 / 12")).toHaveAttribute("aria-hidden", "true");
  await dialog.getByRole("button", { name: "Mục sau" }).click();
  await expect(page.getByRole("dialog", { name: "Đơn DH-1042" })).toBeVisible();
  await page.keyboard.press("ArrowLeft");
  await expect(page.getByRole("dialog", { name: "Đơn DH-1041" })).toBeVisible();
  await expect(page).toHaveURL(/[?&]item=DH-1041/);
  // ‹ › replaced the entry: one Back returns to the list
  await page.goBack();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page).not.toHaveURL(/item=/);
  await expect(row).toBeFocused();
  // a deep link opens it; the close button removes the param
  await page.goto(page.url().replace(/#.*$/, "") + "?item=DH-1050");
  await expect(page.getByRole("dialog", { name: "Đơn DH-1050" })).toBeVisible();
  // at the end › turns disabled: focus moves to ‹ instead of dropping to the page
  await page.getByRole("dialog").getByRole("button", { name: "Mục sau" }).click();
  await expect(page.getByRole("dialog", { name: "Đơn DH-1051" })).toBeVisible();
  await expect(page.getByRole("dialog").getByRole("button", { name: "Mục sau" })).toBeDisabled();
  await expect(page.getByRole("dialog").getByRole("button", { name: "Mục trước" })).toBeFocused();
  await page.getByRole("dialog").getByRole("button", { name: "Đóng", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page).not.toHaveURL(/item=/);
});

// The doc pages are audited closed; these are the states an app's `semi a11y` run meets them in (#126): the overlay
// open with its focus trap on the close button, a chip's popover open, the switch reached with Tab.
for (const theme of THEMES)
  for (const width of [1280, 375])
    test(`a11y audit, open states: DetailOverlay, FilterChipRow, ViewSwitch · ${theme} · ${width}px (#126)`, async ({ browser }) => {
      const page = await browser.newPage({ viewport: { width, height: 900 }, isMobile: width < 500, hasTouch: width < 500 });
      await open(page, "/components/detail-overlay/?item=DH-1041", theme);
      const dialog = page.getByRole("dialog", { name: "Đơn DH-1041" });
      await expect(dialog).toBeVisible();
      await expect(dialog.getByRole("button", { name: "Đóng", exact: true })).toBeFocused();
      // ‹ › (the buttons #126 names) are in the audit: shown and enabled on item 2 of 12, with a ring under keyboard focus
      for (const name of ["Mục trước", "Mục sau"]) {
        const nav = dialog.getByRole("button", { name });
        await expect(nav).toBeVisible();
        await expect(nav).toBeEnabled();
      }
      expect(await a11yHits(page)).toEqual([]);
      // reached with Tab, each draws a ring (box-shadow) it does not have unfocused
      for (const name of ["Mục trước", "Mục sau"]) {
        const nav = dialog.getByRole("button", { name });
        const unfocused = await nav.evaluate((el) => getComputedStyle(el).boxShadow);
        for (let i = 0; i < 8 && !(await nav.evaluate((el) => el === document.activeElement)); i++) await page.keyboard.press("Tab");
        await expect(nav).toBeFocused();
        expect(await nav.evaluate((el) => getComputedStyle(el).boxShadow)).not.toBe(unfocused);
      }

      await open(page, "/components/filter-chip-row/?o.status=new", theme);
      const chip = example(page, "filter-chip-row/url-state").getByRole("button", { name: "Trạng thái: Mới" });
      await expect(chip).toBeVisible();
      await chip.focus();
      await page.keyboard.press("Enter");
      await expect(page.getByRole("dialog", { name: "Trạng thái" })).toBeVisible();
      expect(await a11yHits(page)).toEqual([]);
      // still open after the audit focused and blurred each control: its options were the ones checked
      await expect(page.getByRole("dialog", { name: "Trạng thái" })).toBeVisible();

      await open(page, "/components/view-switch/", theme);
      const sw = example(page, "view-switch/default");
      await expect(sw.getByRole("radio").first().or(sw.getByRole("button").first())).toBeVisible();
      await sw.locator("button").first().focus();
      expect(await a11yHits(page)).toEqual([]);
      await page.close();
    });

test("CommandPalette hotkey: the platform's key opens it from a field, not the other modifier or a rich-text editor (#102)", async ({ page }) => {
  await open(page, "/components/command-palette/", "dark");
  const apple = await page.evaluate(() => /Mac|iPhone|iPad/i.test(navigator.platform || navigator.userAgent));
  const dialog = page.getByRole("dialog", { name: "Tìm hoặc tạo" });
  // hydrated first (the shortcut works), so React never re-renders over the probes; they live outside its tree
  await expect(example(page, "command-palette/app").getByRole("button", { name: /Tìm hoặc tạo/ })).toBeVisible();
  await expect(async () => {
    await page.keyboard.press("ControlOrMeta+k");
    await expect(dialog).toBeVisible({ timeout: 500 });
  }).toPass({ timeout: 10_000 });
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await page.evaluate(() => {
    const box = Object.assign(document.createElement("div"), { id: "hk-probes" });
    box.style.cssText = "position:fixed;top:8px;left:8px;z-index:1";
    const field = Object.assign(document.createElement("input"), { id: "hk-input", ariaLabel: "probe" });
    const rich = Object.assign(document.createElement("div"), { id: "hk-rich", contentEditable: "true", textContent: "rich text" });
    box.append(field, rich);
    document.body.append(box);
  });
  await page.locator("#hk-input").focus();
  // Ctrl+K on a Mac is the field's own "delete to end of line"; ⌘K elsewhere is not the app shortcut
  await page.keyboard.press(apple ? "Control+k" : "Meta+k");
  await expect(dialog).toBeHidden();
  await page.keyboard.press("ControlOrMeta+k");
  await expect(dialog).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await page.locator("#hk-rich").focus();
  await page.keyboard.press("ControlOrMeta+k");
  await page.waitForTimeout(200);
  await expect(dialog).toBeHidden();
  // a widget that handles the key itself (preventDefault) keeps it
  await page.evaluate(() => document.querySelector("#hk-input")!.addEventListener("keydown", (e) => e.preventDefault()));
  await page.locator("#hk-input").focus();
  await page.keyboard.press("ControlOrMeta+k");
  await page.waitForTimeout(200);
  await expect(dialog).toBeHidden();
});

test("ContextMenu on touch: a long-press opens a bottom sheet, a tap on the backdrop closes it (#102)", async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 430, height: 932 }, hasTouch: true, isMobile: true });
  const page = await context.newPage();
  await open(page, "/components/context-menu/", "dark");
  const area = page.getByRole("group", { name: "Thao tác tệp" });
  await area.scrollIntoViewIfNeeded();
  const b = (await area.boundingBox())!;
  await area.dispatchEvent("pointerdown", { pointerType: "touch", isPrimary: true, clientX: b.x + 20, clientY: b.y + 20, bubbles: true });
  const menu = page.getByRole("menu", { name: "Thao tác tệp" });
  await expect(menu).toBeVisible();
  await area.dispatchEvent("pointerup", { pointerType: "touch", isPrimary: true, bubbles: true });
  const box = (await menu.boundingBox())!;
  expect(box.x).toBe(0);
  expect(box.width).toBe(430);
  expect(Math.round(box.y + box.height)).toBe(932);
  await page.mouse.click(215, 40);
  await expect(menu).toBeHidden();
  await context.close();
});

test("CommandPalette: ⌘K, a combobox over a grouped listbox, page items first, Escape closes (#102)", async ({ page }) => {
  await open(page, "/components/command-palette/", "dark");
  await page.keyboard.press("ControlOrMeta+k");
  const dialog = page.getByRole("dialog", { name: "Tìm hoặc tạo" });
  await expect(dialog).toBeVisible();
  const input = dialog.getByRole("combobox");
  await expect(input).toBeFocused();
  await expect(dialog.getByRole("group", { name: "Tạo nhanh" })).toBeVisible();
  await expect(dialog.getByRole("option").first()).toHaveText(/Thêm nhà cung cấp/);
  await input.fill("tieu");
  await expect(dialog.getByRole("option")).toHaveText([/Gia vị Tây Nguyên.*Đắk Lắk/]);
  await input.press("Enter");
  await expect(dialog).toBeHidden();
  await expect(page.getByText("Mở Gia vị Tây Nguyên")).toBeVisible();
  await example(page, "command-palette/app").getByRole("button", { name: /Tìm hoặc tạo/ }).click();
  await expect(dialog).toBeVisible();
  await input.fill("khong co");
  await expect(dialog.getByText("Không có kết quả cho “khong co”. Thử từ khác.")).toBeVisible();
  await page.keyboard.press("Escape");
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
});

test("Field wires label, hint and error to the input", async ({ page }) => {
  await open(page, "/components/field/", "light");
  await expect(page.getByLabel("Tên máy in")).toHaveAttribute("aria-describedby", /hint/);
  const input = page.getByLabel("Tên dự án");
  await input.fill("ab");
  await expect(input).toHaveAttribute("aria-invalid", "true");
  await expect(page.getByRole("alert").filter({ hasText: "ít nhất 3 ký tự" })).toBeVisible();
});

test("type sizes (#155): content is text-ui 14px, shell chrome is text-chrome 12px", async ({ page }) => {
  const size = (l: import("@playwright/test").Locator) => l.evaluate((el) => getComputedStyle(el).fontSize);
  await page.setViewportSize({ width: 1440, height: 900 });
  // content: folded DataTable values (row content) and a field's help text
  await open(page, "/components/data-table/", "dark");
  const dt = example(page, "data-table/columns");
  await dt.getByRole("radio", { name: "Máy tính bảng" }).click();
  await expect(dt.locator("[data-folded]").first()).toBeVisible();
  expect(await size(dt.locator("[data-folded]").first())).toBe("14px");
  await open(page, "/components/field/", "dark");
  const hint = example(page, "field/basic").getByText("Hiện trên thẻ và trong thông báo.");
  expect(await size(hint)).toBe("14px");
  // shell chrome: a sidebar nav item and the breadcrumb
  await open(page, "/demo/app-shell/", "dark");
  expect(await size(page.locator("aside").getByText("Khách hàng", { exact: true }).first())).toBe("12px");
  expect(await size(page.getByRole("navigation", { name: "Đường dẫn" }).locator("ol").first())).toBe("12px");
});

test("phones get the drawer: focus moves in, stays in, drills down and returns to the menu button", async ({ browser }) => {
  const page = await browser.newPage({ viewport: { width: 430, height: 932 }, isMobile: true, hasTouch: true });
  await open(page, "/demo/app-shell/", "dark");
  // the menu button sits at the start of the route header
  const menuButton = page.locator("header").getByRole("button", { name: "Mở menu" });
  await menuButton.click();
  const drawer = page.getByRole("dialog", { name: "Sales Hub" });
  await expect(drawer).toBeVisible();
  await expect(drawer.getByRole("button", { name: "Đóng menu" })).toBeFocused();
  // Tab stays inside
  for (let i = 0; i < 30; i++) await page.keyboard.press("Tab");
  expect(await drawer.evaluate((el) => el.contains(document.activeElement))).toBe(true);
  // a mega item drills down to its links, with a back row; Escape goes back a level, then closes
  const nav = drawer.getByRole("navigation", { name: "Menu chính" });
  const navRow = nav.getByRole("button", { name: "Sản phẩm" });
  await navRow.click();
  await expect(page.getByRole("dialog", { name: "Sản phẩm" }).getByRole("link", { name: "Nhựa in" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(navRow).toBeFocused();
  // a parent with its own page keeps it as the first row of its level; the back row returns focus to the parent row
  const orders = nav.getByRole("button", { name: "Đơn hàng" });
  await orders.click();
  const level = page.getByRole("dialog", { name: "Đơn hàng" });
  await expect(level.getByRole("link").first()).toHaveText("Tất cả đơn hàng");
  await expect(level.getByRole("link").first()).toBeFocused();
  await expect(level.getByRole("button", { name: "Đang xử lý" })).toBeVisible();
  await level.getByRole("button", { name: /Quay lại/ }).click();
  await expect(orders).toBeFocused();
  // the main action is one row that opens its choices (no tiles repeating the nav's names)
  await drawer.getByRole("button", { name: "Tạo mới" }).click();
  const createLevel = page.getByRole("dialog", { name: "Tạo mới" });
  await expect(createLevel.getByRole("button", { name: "Phiếu nhập" })).toBeVisible();
  // its first row is disabled: focus goes to the first enabled row, never to the body (#98)
  await expect(createLevel.getByRole("button", { name: "Báo giá" })).toBeDisabled();
  await expect(createLevel.getByRole("button", { name: "Đơn hàng" })).toBeFocused();
  await page.keyboard.press("Escape");
  // the bottom row's tools: named with their count; the ••• menu opens its items as a level
  await expect(drawer.getByRole("button", { name: "Thông báo 12" })).toBeVisible();
  const more = drawer.getByRole("button", { name: "Thêm" });
  await more.click();
  await expect(page.getByRole("dialog", { name: "Thêm" }).getByRole("button", { name: "Cài đặt" })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(more).toBeFocused();
  expect(await lowContrast(page)).toEqual([]);
  await page.keyboard.press("Escape");
  await expect(drawer).toBeHidden();
  await expect(menuButton).toBeFocused();
  await page.close();
});

/** The frame as measured: nav, header, card, column and the page width. */
function frame(page: Page) {
  return page.evaluate(() => {
    const box = (el: Element | null) => {
      const b = el!.getBoundingClientRect();
      return { x: Math.round(b.x), y: Math.round(b.y), w: Math.round(b.width), h: Math.round(b.height), r: getComputedStyle(el!).borderTopLeftRadius };
    };
    const main = document.querySelector("main#main")!;
    const aside = document.querySelector("aside");
    return {
      nav: aside && getComputedStyle(aside).display !== "none" ? box(aside) : null,
      header: box(document.querySelector("header")),
      card: box(main),
      column: box(main.parentElement),
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    };
  });
}

test("AppShell frame (#144): padding, gap, radius, nav 224 / 72, header 60, card 4px above the bottom, no side scroll at 1440 / 1100 / 834 / 430", async ({ browser }) => {
  for (const [width, nav] of [[1440, 224], [1100, 72], [834, 72], [430, null]] as const) {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    await open(page, "/demo/app-shell/", "dark");
    const f = await frame(page);
    expect(f.overflow, `${width}: no horizontal scroll`).toBe(0);
    if (nav) {
      expect(f.nav).toMatchObject({ x: 8, y: 8, w: nav, r: "16px" });
      expect(f.column.x, `${width}: 8px gap`).toBe(8 + nav + 8);
      expect(f.column).toMatchObject({ y: 8, r: "16px" });
      expect(f.column.x + f.column.w).toBe(width - 8);
      // the card: flush with the column, 4px above its bottom, radius 16
      expect(f.card).toMatchObject({ x: f.column.x, w: f.column.w, r: "16px" });
      expect(f.column.y + f.column.h - (f.card.y + f.card.h)).toBe(4);
    } else {
      // phones: no frame padding, the drawer instead of the nav
      expect(f.nav).toBeNull();
      expect(f.column).toMatchObject({ x: 0, y: 0, w: width });
    }
    if (width >= 1024) expect(f.header.h).toBe(60);
    expect(f.header.w).toBe(f.column.w);
    await page.close();
  }
});

test("AppShell server HTML (#144): the nav width is exact before any script runs, and the stored choice applies before paint", async ({ browser }) => {
  const ssr = await browser.newPage({ viewport: { width: 1440, height: 900 }, javaScriptEnabled: false });
  await ssr.goto("/demo/app-shell/");
  const aside = ssr.locator("aside");
  await expect(aside).toHaveCSS("width", "224px");
  // the rail hides the labels with a container query: still named for assistive tech
  await ssr.setViewportSize({ width: 1100, height: 900 });
  await expect(aside).toHaveCSS("width", "72px");
  await expect(aside.getByRole("link", { name: "Đơn hàng" })).toBeVisible();
  await expect(aside.getByText("Đã ghim")).toBeHidden();
  await ssr.setViewportSize({ width: 834, height: 900 });
  await expect(aside).toHaveCSS("width", "72px");
  await ssr.close();
  // a stored choice: the inline script sets it on <html> before the first paint
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.addInitScript(() => {
    localStorage.setItem("semi-nav", "rail");
    new MutationObserver((_, obs) => {
      const el = document.querySelector("aside");
      if (el) {
        (window as unknown as { __firstNavWidth?: number }).__firstNavWidth = el.getBoundingClientRect().width;
        obs.disconnect();
      }
    }).observe(document, { childList: true, subtree: true });
  });
  await page.goto("/demo/app-shell/");
  expect(await page.evaluate(() => (window as unknown as { __firstNavWidth?: number }).__firstNavWidth)).toBe(72);
  await expect(page.locator("aside")).toHaveCSS("width", "72px");
  await page.close();
});

test("AppShell rail (1100 and iPad): every item is named, shows a tooltip on the right with its shortcut; tools stack; mega menu and TextTabs by keyboard", async ({ browser }) => {
  const page = await browser.newPage({ viewport: { width: 834, height: 1194 } });
  await open(page, "/demo/app-shell/", "light");
  const aside = page.locator("aside");
  await expect(aside).toHaveCSS("width", "72px");
  // an item with `right` (a count) and the main action get the rail tooltip too
  const inbox = aside.getByRole("button", { name: "Hộp thư" });
  await inbox.focus();
  const tip = page.getByRole("tooltip");
  await expect(tip).toHaveText(/^Hộp thư(Alt\+1|⌥1)$/);
  const [t, b] = [await tip.boundingBox(), await inbox.boundingBox()];
  expect(t!.x).toBeGreaterThan(b!.x + b!.width);
  expect((await aside.getByRole("link", { name: "Đơn hàng" }).boundingBox())!.width).toBe(32);
  const create = aside.getByRole("button", { name: "Tạo mới" });
  await create.focus();
  await expect(tip).toHaveText("Tạo mới");
  await page.keyboard.press("Enter");
  await expect(page.getByRole("menu")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(create).toBeFocused();
  // the bottom row stacks: 32×32 tools one above the other, a count badge, the ••• menu by keyboard
  const bell = aside.getByRole("button", { name: "Thông báo 12" });
  const help = aside.getByRole("button", { name: "Trợ giúp" });
  const [bb, hb] = [await bell.boundingBox(), await help.boundingBox()];
  expect(bb).toMatchObject({ width: 32, height: 32 });
  expect(hb!.y).toBe(bb!.y + 32 + 4);
  await expect(bell.getByText("12")).toBeVisible();
  await help.focus();
  await expect(tip).toHaveText("Trợ giúp");
  const more = aside.getByRole("button", { name: "Thêm" });
  await more.focus();
  await page.keyboard.press("Enter");
  const moreMenu = page.getByRole("menu", { name: "Thêm" });
  await expect(moreMenu.getByRole("menuitem", { name: "Cài đặt" })).toBeFocused();
  // opened from the bottom row, the Menu stays on screen
  const mb = await moreMenu.boundingBox();
  expect(mb!.y + mb!.height).toBeLessThanOrEqual(1194);
  await page.keyboard.press("Escape");
  await expect(more).toBeFocused();
  // mega menu: opens beside the nav, focus on the first link, ↓ moves, Escape returns focus
  const catalog = aside.getByRole("button", { name: "Sản phẩm" });
  await catalog.click();
  const mega = page.getByRole("dialog", { name: "Sản phẩm" });
  await expect(mega.getByRole("link", { name: /Máy in/ })).toBeFocused();
  await page.keyboard.press("ArrowDown");
  await expect(mega.getByRole("link", { name: /Nhựa in/ })).toBeFocused();
  expect(await lowContrast(page)).toEqual([]);
  await page.keyboard.press("Escape");
  await expect(mega).toBeHidden();
  await expect(catalog).toBeFocused();
  // TextTabs: one tab stop, arrows move and select
  const tabs = page.getByRole("tablist", { name: "Đơn hàng" });
  await tabs.getByRole("tab", { name: "Đang xử lý" }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(tabs.getByRole("tab", { name: "Đã giao" })).toBeFocused();
  await expect(tabs.getByRole("tab", { name: "Đã giao" })).toHaveAttribute("aria-selected", "true");
  await expect(tabs.getByRole("tab", { name: "Đang xử lý" })).toHaveAttribute("tabindex", "-1");
  await expect(page.getByRole("tabpanel")).toBeVisible();
  // 1100: the default rail between 1024 and 1279, with the expand button on the logo
  await page.setViewportSize({ width: 1100, height: 900 });
  await expect(aside).toHaveCSS("width", "72px");
  await expect(aside.getByRole("button", { name: "Mở rộng menu" })).toHaveAttribute("aria-expanded", "false");
  await page.close();
});

for (const theme of THEMES) {
  test(`ThemeSwitcher variant="menu": one named button, its Menu picks a mode by keyboard and returns focus · ${theme}`, async ({ page }) => {
    await open(page, "/components/theme/", theme);
    const button = page.locator("main").getByRole("button", { name: "Giao diện", exact: true }).first();
    await expect(button).toHaveAttribute("aria-haspopup", "menu");
    const menu = page.getByRole("menu", { name: "Giao diện" });
    // a key pressed before hydration does nothing: retry until the Menu opens
    await expect(async () => {
      await button.focus();
      await page.keyboard.press("ArrowDown");
      await expect(menu).toBeVisible({ timeout: 1000 });
    }).toPass({ timeout: 15_000 });
    // a set of choices opens on the current one
    const current = menu.getByRole("menuitemradio", { name: theme === "dark" ? "Tối" : "Sáng" });
    await expect(current).toBeFocused();
    await expect(current).toHaveAttribute("aria-checked", "true");
    expect(await lowContrast(page)).toEqual([]);
    const other = theme === "dark" ? "Sáng" : "Tối";
    await menu.getByRole("menuitemradio", { name: other }).focus();
    await page.keyboard.press(" ");
    await expect(menu).toBeHidden();
    await expect(button).toBeFocused();
    await expect(page.locator("html")).toHaveAttribute("data-theme", theme === "dark" ? "light" : "dark");
    // Escape closes without a change
    await page.keyboard.press("Enter");
    await expect(menu).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(menu).toBeHidden();
    await expect(button).toBeFocused();
  });
}

test("AppShell desktop: main action menu, collapse to the rail and back from the logo; the choice survives a reload and wins at 1100", async ({ browser }) => {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await open(page, "/demo/app-shell/", "dark");
  const aside = page.locator("aside");
  await expect(aside).toHaveCSS("width", "224px");
  await aside.getByRole("button", { name: "Tạo mới" }).click();
  await expect(page.getByRole("menu")).toBeVisible();
  await page.keyboard.press("Escape");
  // nav items: h32, 12px, the active one on item-selected; groups 24px apart with a line
  const active = aside.getByRole("link", { name: "Đơn hàng" });
  expect((await active.boundingBox())!.height).toBe(32);
  await expect(active).toHaveCSS("font-size", "12px");
  // the expanded nav names the shortcut in the title
  await expect(aside.getByRole("button", { name: "Hộp thư" })).toHaveAttribute("title", /^Hộp thư \((Alt\+1|⌥1)\)$/);
  const collapse = aside.getByRole("button", { name: "Thu gọn menu" });
  await expect(collapse).toHaveAttribute("aria-expanded", "true");
  await expect(collapse).toHaveAttribute("aria-controls", (await aside.getAttribute("id"))!);
  await collapse.click();
  await expect(aside).toHaveCSS("width", "72px");
  await expect(aside.getByRole("button", { name: "Mở rộng menu" })).toHaveAttribute("aria-expanded", "false");
  // remembered: one stored value, applied after a reload and at another width
  expect(await page.evaluate(() => localStorage.getItem("semi-nav"))).toBe("rail");
  await page.reload();
  await expect(aside).toHaveCSS("width", "72px");
  await aside.getByRole("button", { name: "Mở rộng menu" }).click();
  await expect(aside).toHaveCSS("width", "224px");
  await page.setViewportSize({ width: 1100, height: 900 });
  // the person chose expanded: 1100 (the default rail range) stays expanded
  await expect(aside).toHaveCSS("width", "224px");
  await page.setViewportSize({ width: 900, height: 900 });
  // below lg the rail is forced
  await expect(aside).toHaveCSS("width", "72px");
  await page.close();
});

for (const theme of THEMES) {
  test(`AppShell account avatar menu: a proper menu by keyboard, header, theme Light / Dark / System, account, sign-out · ${theme}`, async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await open(page, "/demo/app-shell/", theme);
    const avatar = page.locator("header").getByRole("button", { name: "Tài khoản: Lan Phạm" });
    await expect(avatar).toHaveAttribute("aria-haspopup", "menu");
    const menu = page.getByRole("menu", { name: "Tài khoản: Lan Phạm" });
    await expect(async () => {
      await avatar.focus();
      await page.keyboard.press("ArrowDown");
      await expect(menu).toBeVisible({ timeout: 1000 });
    }).toPass({ timeout: 15_000 });
    // the header (name, detail) is not an item; a set of choices opens on the current one
    await expect(page.getByText("Cửa hàng Quận 1")).toBeVisible();
    await expect(menu.getByRole("menuitemradio")).toHaveText(["Sáng", "Tối", "Hệ thống"]);
    const current = menu.getByRole("menuitemradio", { name: theme === "dark" ? "Tối" : "Sáng" });
    await expect(current).toBeFocused();
    await expect(current).toHaveAttribute("aria-checked", "true");
    await page.keyboard.press("End");
    await expect(menu.getByRole("menuitem", { name: "Đăng xuất" })).toBeFocused();
    await page.keyboard.press("ArrowUp");
    await expect(menu.getByRole("menuitem", { name: "Tài khoản" })).toBeFocused();
    expect(await lowContrast(page)).toEqual([]);
    // pick the other theme, then System
    const other = theme === "dark" ? "Sáng" : "Tối";
    await menu.getByRole("menuitemradio", { name: other }).focus();
    await page.keyboard.press("Enter");
    await expect(menu).toBeHidden();
    await expect(avatar).toBeFocused();
    await expect(page.locator("html")).toHaveAttribute("data-theme", theme === "dark" ? "light" : "dark");
    await page.keyboard.press("Enter");
    await menu.getByRole("menuitemradio", { name: "Hệ thống" }).focus();
    await page.keyboard.press(" ");
    expect(await page.evaluate(() => localStorage.getItem("semi-theme"))).toBe("system");
    await expect(avatar).toBeFocused();
    // the header action holds its own state (a slot is a component)
    const star = page.locator("header").getByRole("button", { name: "Ghim trang" });
    await star.click();
    await expect(star).toHaveAttribute("aria-pressed", "true");
  });
}

test("AppShell nav shortcuts (#144): holding Alt shows the numbers, Alt + digit opens the item, fields and IME keep the key", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await open(page, "/components/button/", "dark");
  const aside = page.locator("aside[data-semi-nav-panel]");
  // wait for hydration: the shortcut shows in the expanded nav's title
  await expect(aside.getByRole("link", { name: "Giới thiệu" })).toHaveAttribute("title", /\((Alt\+1|⌥1)\)$/);
  await page.keyboard.down("Alt");
  await expect(aside.locator("[data-nav-num]")).toHaveCount(9);
  await expect(aside.locator("[data-nav-num]").first()).toHaveText("1");
  await page.keyboard.up("Alt");
  await expect(aside.locator("[data-nav-num]")).toHaveCount(0);
  // Alt + 2: the second item (Tất cả component), through its link
  await page.keyboard.press("Alt+Digit2");
  await expect(page).toHaveURL(/\/components\/$/);
  await expect(aside.getByRole("link", { name: "Tất cả component" })).toHaveAttribute("aria-current", "page");
  // IME composition and editable targets keep the key
  await page.evaluate(() => window.dispatchEvent(new KeyboardEvent("keydown", { key: "Process", code: "Digit1", altKey: true, keyCode: 229, isComposing: true, bubbles: true, cancelable: true })));
  await page.waitForTimeout(300);
  await expect(page).toHaveURL(/\/components\/$/);
  const prevented = await page.evaluate(() => {
    const input = document.createElement("input");
    document.querySelector("main")!.prepend(input);
    input.focus();
    const e = new KeyboardEvent("keydown", { key: "1", code: "Digit1", altKey: true, bubbles: true, cancelable: true });
    input.dispatchEvent(e);
    input.remove();
    return e.defaultPrevented;
  });
  expect(prevented).toBe(false);
  await page.waitForTimeout(300);
  await expect(page).toHaveURL(/\/components\/$/);
  // a rail with corner badges
  await page.setViewportSize({ width: 1100, height: 900 });
  await expect(aside).toHaveCSS("width", "72px");
  await page.keyboard.down("Alt");
  const badge = aside.locator("[data-nav-num]").first();
  const [bb, ab] = [await badge.boundingBox(), await aside.getByRole("link", { name: "Giới thiệu" }).boundingBox()];
  expect(bb!.x + bb!.width).toBeGreaterThan(ab!.x + ab!.width);
  await page.keyboard.up("Alt");
});

test("AppShell nav shortcuts (#144, review): an app handler that took the key wins, a real contenteditable keeps it, ⌘ / Ctrl + digit only in an installed app", async ({ browser }) => {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await open(page, "/components/button/", "dark");
  const aside = page.locator("aside[data-semi-nav-panel]");
  await expect(aside.getByRole("link", { name: "Giới thiệu" })).toHaveAttribute("title", /\((Alt\+1|⌥1)\)$/);
  // defaultPrevented: an app's own handler (document, before the shell's window listener) took Alt + 2
  await page.evaluate(() => {
    (window as unknown as { __take?: (e: KeyboardEvent) => void }).__take = (e: KeyboardEvent) => e.code === "Digit2" && e.altKey && e.preventDefault();
    document.addEventListener("keydown", (window as unknown as { __take: (e: KeyboardEvent) => void }).__take);
  });
  await page.keyboard.down("Alt");
  await page.keyboard.press("Digit2");
  await page.keyboard.up("Alt");
  await page.waitForTimeout(300);
  await expect(page).toHaveURL(/\/components\/button\/$/);
  await page.evaluate(() => document.removeEventListener("keydown", (window as unknown as { __take: (e: KeyboardEvent) => void }).__take));
  // a real contenteditable (an editor) keeps Alt + digit, typed by the keyboard
  await page.evaluate(() => {
    const ed = document.createElement("div");
    ed.contentEditable = "true";
    ed.id = "ed";
    ed.textContent = "x";
    document.querySelector("main")!.prepend(ed);
  });
  await page.locator("#ed").focus();
  await page.keyboard.press("Alt+Digit2");
  await page.waitForTimeout(300);
  await expect(page).toHaveURL(/\/components\/button\/$/);
  await page.evaluate(() => document.getElementById("ed")!.remove());
  await page.locator("main h1").first().click();
  // in a browser tab ⌘ / Ctrl + digit belongs to the browser: no numbers, no navigation
  const apple = await page.evaluate(() => /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent));
  const tabMod = apple ? "Meta" : "Control";
  await page.keyboard.down(tabMod);
  await expect(aside.locator("[data-nav-num]")).toHaveCount(0);
  await page.keyboard.up(tabMod);
  await page.evaluate(() => window.dispatchEvent(new KeyboardEvent("keydown", { key: "2", code: "Digit2", metaKey: /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent), ctrlKey: !/Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent), bubbles: true, cancelable: true })));
  await page.waitForTimeout(300);
  await expect(page).toHaveURL(/\/components\/button\/$/);
  await page.close();
  // installed (display-mode: standalone): ⌘ / Ctrl + digit opens the item and the titles name it
  const app = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await app.addInitScript(() => {
    const mm = window.matchMedia.bind(window);
    window.matchMedia = (q: string) => (q.includes("display-mode: standalone") ? ({ ...mm(q), matches: true, media: q } as MediaQueryList) : mm(q));
  });
  await open(app, "/components/button/", "dark");
  const appAside = app.locator("aside[data-semi-nav-panel]");
  await expect(appAside.getByRole("link", { name: "Giới thiệu" })).toHaveAttribute("title", /\((Ctrl\+1|⌘1)\)$/);
  await app.keyboard.down(tabMod);
  await expect(appAside.locator("[data-nav-num]")).toHaveCount(9);
  await app.keyboard.up(tabMod);
  await app.evaluate(() => window.dispatchEvent(new KeyboardEvent("keydown", { key: "2", code: "Digit2", metaKey: /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent), ctrlKey: !/Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent), bubbles: true, cancelable: true })));
  await expect(app).toHaveURL(/\/components\/$/);
  await app.close();
});

test("AppShell rail range (#144, review): exactly 1279px is the default rail, 1280px is expanded", async ({ browser }) => {
  for (const [width, nav] of [[1279, 72], [1280, 224]] as const) {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    await open(page, "/demo/app-shell/", "dark");
    const aside = page.locator("aside");
    await expect(aside).toHaveCSS("width", `${nav}px`);
    // after mount the toggle agrees with the CSS
    await expect(aside.getByRole("button", { name: nav === 72 ? "Mở rộng menu" : "Thu gọn menu" })).toBeVisible();
    await page.close();
  }
});

test("AppShell storage (#144, review): a 0.x semi_sidebar_collapsed choice moves to semi-nav once, before paint", async ({ browser }) => {
  for (const [old, want, width] of [["1", "rail", 1440], ["0", "full", 1100]] as const) {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    await page.addInitScript((v) => {
      if (!sessionStorage.getItem("seeded")) {
        sessionStorage.setItem("seeded", "1");
        localStorage.removeItem("semi-nav");
        localStorage.setItem("semi_sidebar_collapsed", v);
      }
      new MutationObserver((_, obs) => {
        const el = document.querySelector("aside");
        if (el) {
          (window as unknown as { __firstNavWidth?: number }).__firstNavWidth = el.getBoundingClientRect().width;
          obs.disconnect();
        }
      }).observe(document, { childList: true, subtree: true });
    }, old);
    await open(page, "/demo/app-shell/", "dark");
    expect(await page.evaluate(() => (window as unknown as { __firstNavWidth?: number }).__firstNavWidth)).toBe(want === "rail" ? 72 : 224);
    await expect(page.locator("aside")).toHaveCSS("width", want === "rail" ? "72px" : "224px");
    expect(await page.evaluate(() => [localStorage.getItem("semi-nav"), localStorage.getItem("semi_sidebar_collapsed")])).toEqual([want, null]);
    await page.close();
  }
  // the new key wins over a stale old one, which is left alone
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.addInitScript(() => {
    localStorage.setItem("semi-nav", "full");
    localStorage.setItem("semi_sidebar_collapsed", "1");
  });
  await open(page, "/demo/app-shell/", "dark");
  await expect(page.locator("aside")).toHaveCSS("width", "224px");
  expect(await page.evaluate(() => localStorage.getItem("semi-nav"))).toBe("full");
  await page.close();
});

test("AppShell phone touch targets (#144, review): menu button, account avatar and every drawer row are 44px at 430", async ({ browser }) => {
  const page = await browser.newPage({ viewport: { width: 430, height: 900 }, hasTouch: true });
  await open(page, "/demo/app-shell/", "light");
  const header = page.locator("header").first();
  const menu = header.getByRole("button", { name: "Mở menu" });
  const avatar = header.getByRole("button", { name: "Tài khoản: Lan Phạm" });
  for (const target of [menu, avatar]) {
    const b = (await target.boundingBox())!;
    expect(b.width).toBeGreaterThanOrEqual(44);
    expect(b.height).toBeGreaterThanOrEqual(44);
  }
  await expect(async () => {
    await menu.click();
    await expect(page.getByRole("dialog")).toBeVisible({ timeout: 1000 });
  }).toPass({ timeout: 15_000 });
  const rows = await page.getByRole("dialog").evaluate((d) =>
    [...d.querySelectorAll("a, button")]
      .filter((el) => (el as HTMLElement).offsetParent !== null)
      .map((el) => ({ name: (el.getAttribute("aria-label") || el.textContent || "").trim(), h: Math.round(el.getBoundingClientRect().height) }))
      .filter((r) => r.h < 44),
  );
  expect(rows).toEqual([]);
  await page.close();
});

test("AppShell group label (#144, review): 10px / 500, uppercase, normal tracking, faint", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await open(page, "/demo/app-shell/", "dark");
  const label = page.locator("aside").getByText("Đã ghim", { exact: true });
  await expect(label).toBeVisible();
  const style = await label.evaluate((el) => {
    const c = getComputedStyle(el.parentElement!);
    return { size: c.fontSize, weight: c.fontWeight, transform: c.textTransform, tracking: c.letterSpacing };
  });
  expect({ ...style, tracking: style.tracking === "0px" ? "normal" : style.tracking }).toEqual({ size: "10px", weight: "500", transform: "uppercase", tracking: "normal" });
});

for (const theme of THEMES) {
  test(`sticky strips on bg-app: the card's colour inside the AppShell content card, the page's outside (#144, review) · ${theme}`, async ({ page }) => {
    const bg = (sel: string) => page.locator(sel).first().evaluate((el) => getComputedStyle(el).backgroundColor);
    await open(page, "/components/form-actions/", theme);
    const card = await bg("main");
    const app = await page.evaluate(() => {
      const probe = document.createElement("div");
      probe.className = "bg-app";
      document.body.append(probe);
      const v = getComputedStyle(probe).backgroundColor;
      probe.remove();
      return v;
    });
    expect(card).not.toBe(app);
    // FormActions on a page (FORM_ACTIONS_STICKY) inside the card: the panel colour
    const strip = page.locator("main .sticky.bottom-0").first();
    await expect(strip).toBeAttached();
    expect(await bg("main .sticky.bottom-0")).toBe(card);
    // the same strip on a page without AppShell (outside the card): the app colour, no white bar
    expect(
      await strip.evaluate((el) => {
        const copy = el.cloneNode(true) as HTMLElement;
        document.body.append(copy);
        const v = getComputedStyle(copy).backgroundColor;
        copy.remove();
        return v;
      }),
    ).toBe(app);
    // StickyContextBar (STICKY_TOOLBAR) inside the card: the panel colour
    await open(page, "/components/sticky-context-bar/", theme);
    expect(await bg("main [role=search].sticky")).toBe(await bg("main"));
  });
}

for (const theme of THEMES) {
  test(`floating layers (toast, tooltip, menu, drawer) pass contrast · ${theme}`, async ({ page }) => {
    await open(page, "/components/toast/", theme);
    await page.getByRole("button", { name: "Cảnh báo" }).click();
    await expect(page.getByText("Mất kết nối máy in")).toBeVisible();
    expect(await lowContrast(page)).toEqual([]);
    await open(page, "/components/tooltip/", theme);
    await page.getByRole("button", { name: "Làm mới" }).focus();
    await expect(page.getByRole("tooltip")).toBeVisible();
    expect(await lowContrast(page)).toEqual([]);
    await open(page, "/components/menu/", theme);
    await page.getByRole("button", { name: "Thao tác máy in" }).click();
    await expect(page.getByRole("menu")).toBeVisible();
    expect(await lowContrast(page)).toEqual([]);
    await open(page, "/components/drawer/", theme);
    await page.getByRole("button", { name: "Bộ lọc" }).click();
    await expect(page.getByRole("dialog", { name: "Bộ lọc" })).toBeVisible();
    expect(await lowContrast(page)).toEqual([]);
  });
}

for (const theme of THEMES) {
  // 1.0: checked is a state, not an action, so it is the neutral inverted fill (never the brand primary).
  test(`checked controls use the inverted fill · ${theme}`, async ({ page }) => {
    const fill = (cls: string) =>
      page.evaluate((c) => {
        const probe = document.createElement("div");
        probe.className = c;
        document.body.append(probe);
        const v = getComputedStyle(probe).backgroundColor;
        probe.remove();
        return v;
      }, cls);
    await open(page, "/components/checkbox/", theme);
    const inverted = await fill("bg-inverted");
    expect(inverted).not.toBe(await fill("bg-primary"));
    const checkbox = page.getByRole("checkbox", { name: "Tự động in khi rảnh" });
    await expect(checkbox).toBeChecked();
    expect(await checkbox.evaluate((el) => getComputedStyle(el).backgroundColor)).toBe(inverted);
    await open(page, "/components/radio-group/", theme);
    expect(await page.getByRole("radio", { name: /Pro/ }).evaluate((el) => getComputedStyle(el).borderTopColor)).toBe(inverted);
    await open(page, "/components/switch/", theme);
    expect(await page.getByRole("switch", { name: "Thông báo khi in xong" }).evaluate((el) => getComputedStyle(el).backgroundColor)).toBe(inverted);
  });
}

// ─── AI chat ─────────────────────────────────────────────────────────────────────────────────────────────────────

const chatPanel = (page: Page) => example(page, "ai-chat/workspace").getByRole("complementary", { name: "Trợ lý AI" });

for (const theme of THEMES) {
  test(`AI chat: send, stream, stop and contrast · ${theme}`, async ({ page }) => {
    await open(page, "/components/ai-chat/", theme);
    const panel = chatPanel(page);
    const field = panel.getByRole("textbox", { name: "Hỏi về cài đặt in…" });
    await field.fill("PETG bị kéo sợi");
    await field.press("Enter");
    await expect(panel.getByRole("button", { name: "Dừng" })).toBeVisible();
    await expect(field).toHaveValue("");
    await expect(panel.getByRole("button", { name: "Sao chép" })).toBeVisible({ timeout: 10_000 });
    await expect(panel.getByRole("button", { name: "Gửi" })).toBeVisible();
    await expect(field).toBeFocused(); // back to the field after a typed question
    await expect(panel.getByRole("status").filter({ hasText: "PETG" })).toHaveCount(1); // the finished answer is announced once
    expect(await lowContrast(page)).toEqual([]);
    const { violations } = await new AxeBuilder({ page }).include('[data-example="ai-chat/workspace"]').withTags(["wcag2a", "wcag2aa"]).analyze();
    expect(violations.filter((v) => v.impact === "serious" || v.impact === "critical").map((v) => v.id)).toEqual([]);
  });
}

test("AI chat: Enter while an input method composes does not send; Shift+Enter breaks the line", async ({ page }) => {
  await open(page, "/components/ai-chat/", "dark");
  const panel = chatPanel(page);
  const field = panel.getByRole("textbox", { name: "Hỏi về cài đặt in…" });
  await field.fill("Tiếng Việt");
  await field.dispatchEvent("keydown", { key: "Enter", isComposing: true, bubbles: true });
  await field.press("Shift+Enter");
  await expect(panel.getByRole("button", { name: "Dừng" })).toHaveCount(0);
  await expect(field).toHaveValue("Tiếng Việt\n");
  expect(await panel.getByRole("log").evaluate((el) => el.textContent?.includes("Tiếng Việt"))).toBe(false);
});

test("AI chat: scrolled up while streaming, the list stays put", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await open(page, "/components/ai-chat/", "dark");
  const panel = chatPanel(page);
  const field = panel.getByRole("textbox", { name: "Hỏi về cài đặt in…" });
  const log = panel.getByRole("log");
  const ask = async (q: string) => {
    await field.fill(q);
    await field.press("Enter");
    await expect(panel.getByRole("button", { name: "Gửi" })).toBeVisible({ timeout: 10_000 });
  };
  for (const q of ["Một", "Hai", "Ba", "Bốn", "Năm"]) await ask(q);
  expect(await log.evaluate((el) => el.scrollHeight > el.clientHeight + 100)).toBe(true);
  await field.fill("Sáu");
  await field.press("Enter");
  await expect(panel.getByRole("button", { name: "Dừng" })).toBeVisible();
  await log.evaluate((el) => el.scrollTo({ top: 0 }));
  await log.dispatchEvent("scroll");
  await expect(panel.getByRole("button", { name: "Xuống tin nhắn mới nhất" })).toBeVisible();
  await expect(panel.getByRole("button", { name: "Gửi" })).toBeVisible({ timeout: 10_000 });
  expect(await log.evaluate((el) => el.scrollTop)).toBe(0);
  await panel.getByRole("button", { name: "Xuống tin nhắn mới nhất" }).click();
  await expect.poll(() => log.evaluate((el) => el.scrollHeight - el.scrollTop - el.clientHeight)).toBeLessThan(32);
});

test("AI chat over a Modal: focus goes to the field, Escape closes only the chat", async ({ page }) => {
  await open(page, "/components/ai-chat/", "light");
  await page.getByRole("button", { name: "Mở lỗi máy in" }).click();
  const opener = page.getByRole("button", { name: "Hỏi AI về lỗi này" });
  await opener.click();
  const chat = page.getByRole("dialog", { name: "Trợ lý AI" });
  await expect(chat).toBeVisible();
  await expect(chat.getByRole("textbox")).toBeFocused();
  for (let i = 0; i < 8; i++) {
    await page.keyboard.press("Tab");
    expect(await chat.evaluate((d) => d.contains(document.activeElement))).toBe(true);
  }
  await page.keyboard.press("Escape");
  await expect(chat).toBeHidden();
  await expect(page.getByRole("dialog", { name: /HMS 0300-0100/ })).toBeVisible();
  await expect(opener).toBeFocused();
});

test("AI chat: an empty conversation starts at the top (intro first)", async ({ browser }) => {
  const page = await browser.newPage({ viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true });
  await open(page, "/components/ai-chat/", "dark");
  const log = chatPanel(page).getByRole("log");
  await expect(log.getByText("Hỏi gì về bản in?")).toBeVisible();
  expect(await log.evaluate((el) => el.scrollTop)).toBe(0);
  await page.close();
});

test("Chat model picker: provider sits left of the model and switches its models", async ({ page }) => {
  await open(page, "/components/chat-model-picker/", "dark");
  const ex = example(page, "chat-model-picker/basic");
  const provider = ex.getByRole("button", { name: "Nhà cung cấp AI" });
  const model = ex.getByRole("button", { name: "Model AI" });
  const effort = ex.getByRole("button", { name: "Mức suy nghĩ" });
  expect((await provider.boundingBox())!.x).toBeLessThan((await model.boundingBox())!.x);
  await expect(model).toHaveText("Opus 5.5");
  await expect(effort).toBeVisible();
  await provider.click();
  await page.getByRole("option", { name: /Ollama/ }).click();
  await expect(provider).toHaveAttribute("title", "Ollama (máy này)");
  await expect(model).toHaveText("llama-local");
  await expect(effort).toHaveCount(0); // that model takes no thinking effort
});

// ─── Agent-readable ──────────────────────────────────────────────────────────────────────────────────────────────

test("agents: llms.txt links every component page and its markdown, and everything it links is served", async ({ page, request }) => {
  const llms = await (await request.get("/llms.txt")).text();
  for (const d of docs) {
    expect(llms).toContain(`(./components/${d.id}/)`);
    expect(llms).toContain(`(./docs/components/${d.id}.md)`);
  }
  for (const link of [...llms.matchAll(/\]\(\.\/([^)#]*)\)/g)].map((m) => m[1])) {
    expect((await request.get(`/${link}`)).status(), link).toBe(200);
  }
  const manifest = await (await request.get("/components.json")).json();
  const chat = manifest.components.find((c: { name: string }) => c.name === "AIChat");
  expect(chat.doc).toBe("docs/components/ai-chat.md");
  await page.goto("/components/");
  await expect(page.locator('link[rel="alternate"][href$="llms.txt"]')).toHaveCount(1);
});

// ─── Components added in 0.10 ────────────────────────────────────────────────────────────────────────────────────

test("Command: ⌘K opens it, matching ignores Vietnamese marks, Enter runs, Escape closes", async ({ page }) => {
  await open(page, "/components/command/", "dark");
  await page.keyboard.press("ControlOrMeta+k");
  const dialog = page.getByRole("dialog", { name: "Bảng lệnh" });
  await expect(dialog).toBeVisible();
  const input = dialog.getByRole("combobox");
  await expect(input).toBeFocused();
  await input.fill("don hang");
  await expect(dialog.getByRole("option").first()).toHaveText(/Đơn hàng/);
  await expect(input).toHaveAttribute("aria-activedescendant", /.+/);
  await input.press("Enter");
  await expect(dialog).toBeHidden();
  await expect(page.getByText("Mở Đơn hàng")).toBeVisible();
  await page.keyboard.press("ControlOrMeta+k");
  await expect(dialog).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
});

test("DataTable: sorts with aria-sort, searches without marks, selects a page and pages", async ({ page }) => {
  await open(page, "/components/data-table/", "dark");
  const ex = example(page, "data-table/orders");
  const table = ex.getByRole("table", { name: "Đơn hàng" });
  const header = table.getByRole("columnheader", { name: /Mã đơn/ });
  await expect(header).toHaveAttribute("aria-sort", "none");
  await header.getByRole("button").click();
  await expect(header).toHaveAttribute("aria-sort", "ascending");
  await expect(table.getByRole("row").nth(1)).toContainText("SO-1040");
  await header.getByRole("button").click();
  await expect(header).toHaveAttribute("aria-sort", "descending");
  await expect(table.getByRole("row").nth(1)).toContainText("SO-1062");
  await ex.getByRole("button", { name: "Tìm mã đơn, khách hàng…" }).click(); // SearchInput opens from its icon button
  const search = ex.getByPlaceholder("Tìm mã đơn, khách hàng…");
  await search.fill("hoang ha");
  await expect(table.getByRole("row")).toHaveCount(1 + 4); // header + the 4 orders of Hoàng Hà
  await search.fill("");
  await table.getByRole("checkbox", { name: "Chọn tất cả" }).check();
  await expect(ex.getByText("Đã chọn 8")).toBeVisible();
  await expect(ex.getByRole("button", { name: "Huỷ đơn" })).toBeVisible();
  await ex.getByRole("navigation", { name: "Phân trang" }).getByRole("button", { name: "Trang sau" }).click();
  await expect(table.getByRole("checkbox", { name: "Chọn tất cả" })).not.toBeChecked();
});

test("DataTable: priority columns fold by the table's own width, the rest scrolls with a sticky first column and edge lines (#130)", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await open(page, "/components/data-table/", "dark");
  const ex = example(page, "data-table/columns");
  const table = ex.getByRole("table", { name: "Khách hàng" });
  const headers = table.locator("thead th");
  const width = (name: string) => ex.getByRole("radio", { name }).click();
  await width("Đầy đủ");
  await expect(headers).toHaveText([/Khách hàng/, "Điện thoại", /Tỉnh/, "Nguồn", "Người phụ trách", /Liên lạc/, /Đơn/, /Doanh số/]);
  await expect(table.locator("[data-folded]")).toHaveCount(0);
  // the same viewport, a narrower box: priority 3 folds first (into the first cell, header read to screen readers)
  await width("Máy tính bảng");
  await expect(headers).toHaveText([/Khách hàng/, "Điện thoại", /Tỉnh/, /Liên lạc/, /Đơn/, /Doanh số/]);
  const firstRow = table.getByRole("row").nth(1);
  await expect(firstRow.getByRole("cell").first()).toContainText("Siêu thị mini Thảo Điền");
  await expect(firstRow.locator("[data-folded]")).toHaveText(/Nguồn: Hội chợ.*Người phụ trách: Tú/);
  const box = table.locator("xpath=..");
  await expect(box).not.toHaveAttribute("tabindex"); // fits: not a scroll region
  // narrower still: priority 2 folds too; the columns without a priority scroll sideways
  await width("Hẹp");
  await expect(headers).toHaveText([/Khách hàng/, /Tỉnh/, /Đơn/, /Doanh số/]);
  await expect(firstRow.locator("[data-folded]")).toHaveText(/Điện thoại: 090.*Nguồn: Hội chợ.*Liên lạc: 2026-11-05/);
  await expect(box).toHaveAttribute("role", "region");
  await expect(box).toHaveAttribute("aria-label", "Khách hàng");
  // the cue: a solid outline-line (the strong neutral line, 1.0) on the edge with columns past it (no lint skip, no gradient)
  await expect(box).toHaveAttribute("data-edges", "right");
  const line = await box.evaluate((el) => {
    const probe = document.createElement("div");
    probe.className = "border border-outline-line";
    el.append(probe);
    const c = getComputedStyle(probe).borderTopColor;
    probe.remove();
    return c;
  });
  await expect(box).toHaveCSS("border-right-width", "2px");
  await expect(box).toHaveCSS("border-right-color", line);
  // axe on the overflowing region (scrollable-region-focusable, names, contrast of the folded line)
  const { violations } = await new AxeBuilder({ page }).include('[data-example="data-table/columns"]').withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
  expect(violations.filter((v) => v.impact === "serious" || v.impact === "critical").map((v) => v.id)).toEqual([]);
  // keyboard: the scroll box is a tab stop and the arrow keys scroll it; the first column stays in place
  const name = headers.first();
  const x0 = (await name.boundingBox())!.x;
  await box.focus();
  await expect(box).toBeFocused();
  await page.keyboard.press("ArrowRight");
  await expect.poll(() => box.evaluate((el) => el.scrollLeft)).toBeGreaterThan(0);
  expect((await name.boundingBox())!.x).toBeCloseTo(x0, 0);
  await expect(name).toHaveCSS("position", "sticky");
  await expect(box).toHaveAttribute("data-edges", "left right"); // columns past both edges now
  await box.evaluate((el) => (el.scrollLeft = el.scrollWidth));
  await expect(box).toHaveAttribute("data-edges", "left"); // scrolled to the end: the line moves to the sticky column's edge
  expect(await name.evaluate((el) => getComputedStyle(el, "::before").width)).toBe("2px");
  await box.focus();
  const ring = await box.evaluate((el) => getComputedStyle(el).boxShadow);
  expect(ring).toContain("inset"); // the focus ring is inside the box, whole, next to the edge lines
  // wide again: everything unfolds
  await width("Đầy đủ");
  await expect(headers).toHaveCount(8);
  await expect(box).not.toHaveAttribute("tabindex");
  // the sorted column never folds: sort by Liên lạc (priority 2), then narrow: its header (and the sort control) stays
  await headers.filter({ hasText: "Liên lạc" }).getByRole("button").click();
  await width("Hẹp");
  const contact = headers.filter({ hasText: "Liên lạc" });
  await expect(contact).toHaveAttribute("aria-sort", "ascending");
  await expect(headers).toHaveText([/Khách hàng/, /Tỉnh/, /Liên lạc/, /Đơn/, /Doanh số/]);
  await expect(firstRow.locator("[data-folded]")).not.toContainText("Liên lạc");
  await contact.getByRole("button").click();
  await expect(contact).toHaveAttribute("aria-sort", "descending");
});

test("DetailOverlay over a sorted, paged DataTable: ‹ › follow the table's order (sortRows / searchRows, #124)", async ({ page }) => {
  await open(page, "/components/detail-overlay/", "dark");
  const ex = example(page, "detail-overlay/table");
  const table = ex.getByRole("table", { name: "Đơn hàng" });
  await expect(table.getByRole("row").nth(1)).toContainText("DH-1051"); // Tổng, highest first
  const opener = table.getByRole("button", { name: "DH-1051" });
  await opener.focus();
  await page.keyboard.press("Enter");
  const dialog = page.getByRole("dialog", { name: "Đơn DH-1051" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText("1 / 12")).toBeVisible();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("dialog", { name: "Đơn DH-1045" })).toBeVisible(); // 2nd by Tổng, not DH-1052
  await expect(page.getByText("2 / 12")).toBeVisible();
  for (let i = 0; i < 4; i++) await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("dialog", { name: "Đơn DH-1043" })).toBeVisible();
  await expect(page.getByText("6 / 12")).toBeVisible();
  // past the table's first page (6 rows): the 7th row of the sorted results
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("dialog", { name: "Đơn DH-1048" })).toBeVisible();
  await expect(page.getByText("7 / 12")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(opener).toBeFocused();
});

test("Accordion and ToggleGroup move with the arrow keys", async ({ page }) => {
  await open(page, "/components/accordion/", "dark");
  const faq = example(page, "accordion/faq");
  const first = faq.getByRole("button", { name: "Vì sao PETG bị kéo sợi?" });
  await expect(first).toHaveAttribute("aria-expanded", "true");
  await first.focus();
  await page.keyboard.press("ArrowDown");
  await expect(faq.getByRole("button", { name: "Bản in bị cong góc?" })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(faq.getByRole("button", { name: "Bản in bị cong góc?" })).toHaveAttribute("aria-expanded", "true");
  await expect(first).toHaveAttribute("aria-expanded", "false"); // single: one open at a time
  await open(page, "/components/toggle/", "dark");
  const view = page.getByRole("radiogroup", { name: "Chế độ xem" });
  await view.getByRole("radio", { name: "Lưới" }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(view.getByRole("radio", { name: "Danh sách" })).toBeFocused();
  await expect(view.getByRole("radio", { name: "Danh sách" })).toHaveAttribute("aria-checked", "true");
});

test("Slider and Calendar work from the keyboard; DatePicker returns focus", async ({ page }) => {
  await open(page, "/components/slider/", "dark");
  const thumb = example(page, "slider/single").getByRole("slider");
  await thumb.focus();
  await page.keyboard.press("ArrowRight");
  await expect(thumb).toHaveAttribute("aria-valuenow", "25");
  await page.keyboard.press("End");
  await expect(thumb).toHaveAttribute("aria-valuetext", "100%");
  await open(page, "/components/calendar/", "dark");
  const cal = example(page, "calendar/single");
  await cal.getByRole("button", { name: "12/11/2026" }).click();
  await page.keyboard.press("ArrowRight");
  await expect(cal.getByRole("button", { name: "13/11/2026" })).toBeFocused();
  await page.keyboard.press("PageDown");
  await expect(cal.getByRole("button", { name: "13/12/2026" })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(cal.getByRole("gridcell", { selected: true })).toContainText("13");
  // keys never land on a day before min (2026-11-01): focus stays on an enabled day, the previous month is off
  await page.keyboard.press("PageUp");
  await page.keyboard.press("PageUp");
  await expect(cal.getByRole("button", { name: "1/11/2026", exact: true })).toBeFocused();
  await expect(cal.getByRole("button", { name: "Tháng trước" })).toBeDisabled();
  await open(page, "/components/date-picker/", "dark");
  const trigger = page.getByRole("button", { name: /^Ngày in:/ });
  await trigger.click();
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("Enter");
  await expect(trigger).toHaveAccessibleName("Ngày in: 02/11/2026");
  await expect(trigger).toBeFocused();
});

test("Popover moves focus in and returns it; ContextMenu opens with Shift+F10", async ({ page }) => {
  await open(page, "/components/popover/", "dark");
  const opener = page.getByRole("button", { name: "Đổi tên" });
  await opener.click();
  const pop = page.getByRole("dialog", { name: "Đổi tên máy in" });
  await expect(pop).toBeVisible();
  await expect(pop.getByRole("textbox")).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(pop).toBeHidden();
  await expect(opener).toBeFocused();
  await open(page, "/components/context-menu/", "dark");
  const area = example(page, "context-menu/file").locator("[tabindex='0']").first();
  await area.focus();
  await page.keyboard.press("Shift+F10");
  await expect(page.getByRole("menu", { name: "Thao tác tệp" })).toBeVisible();
  await expect(page.getByRole("menuitem", { name: "Mở" })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("menu")).toBeHidden();
  await expect(area).toBeFocused();
});

test("FilterChipRow: a chip's popover by keyboard, state in the URL, Back / Forward restore it (#99)", async ({ page }) => {
  await open(page, "/components/filter-chip-row/", "dark");
  const ex = example(page, "filter-chip-row/url-state");
  const chip = ex.getByRole("button", { name: "Trạng thái" });
  await expect(chip).toHaveAttribute("aria-expanded", "false");
  await chip.focus();
  await page.keyboard.press("Enter");
  const pop = page.getByRole("dialog", { name: "Trạng thái" });
  await expect(pop).toBeVisible();
  await expect(chip).toHaveAttribute("aria-expanded", "true");
  await expect(pop.getByRole("checkbox", { name: "Mới" })).toBeFocused();
  await page.keyboard.press("Space");
  await expect(page).toHaveURL(/[?&]o\.status=new(&|$)/);
  await page.keyboard.press("Escape");
  await expect(pop).toBeHidden();
  const on = ex.getByRole("button", { name: "Trạng thái: Mới" });
  await expect(on).toBeFocused();
  await expect(ex.getByText("#1024 · #1026")).toBeVisible();
  // a switch chip is a toggle button
  const paid = ex.getByRole("button", { name: "Đã thanh toán" });
  await paid.click();
  await expect(paid).toHaveAttribute("aria-pressed", "true");
  await expect(ex.getByText("#1024", { exact: true })).toBeVisible();
  // Back undoes the last filter, then the first; Forward brings them back
  await page.goBack();
  await expect(paid).toHaveAttribute("aria-pressed", "false");
  await expect(on).toBeVisible();
  await page.goBack();
  await expect(ex.getByRole("button", { name: "Trạng thái" })).toBeVisible();
  await expect(ex.getByRole("button", { name: "Xoá lọc" })).toHaveCount(0);
  await page.goForward();
  await expect(on).toBeVisible();
  // a link with the state opens filtered (an unknown value from an old link is dropped)
  await page.goto("/components/filter-chip-row/?o.status=shipped&o.status=lost&o.paid=1");
  await expect(ex.getByRole("button", { name: "Trạng thái: Đã giao" })).toBeVisible();
  await expect(ex.getByRole("button", { name: "Đã thanh toán" })).toHaveAttribute("aria-pressed", "true");
  await ex.getByRole("button", { name: "Xoá lọc" }).click();
  await expect(page).not.toHaveURL(/o\./);
});

test("FilterChipRow: ‹ › scroll a row that overflows and stay out of the tab order and the accessibility tree", async ({ page }) => {
  await page.setViewportSize({ width: 900, height: 800 });
  await open(page, "/components/filter-chip-row/", "light");
  const ex = example(page, "filter-chip-row/many");
  const right = ex.locator('button[title="Cuộn phải"]');
  await expect(right).toBeVisible();
  await expect(right).toHaveAttribute("aria-hidden", "true");
  await expect(right).toHaveAttribute("tabindex", "-1");
  await expect(ex.getByRole("button", { name: "Cuộn phải" })).toHaveCount(0);
  await right.click();
  await expect(ex.locator('button[title="Cuộn trái"]')).toBeVisible();
  // the last chip is reachable by Tab (it scrolls into view)
  await ex.getByRole("button", { name: "Từ 100 tấn/năm" }).focus();
  await expect(ex.getByRole("button", { name: "Từ 100 tấn/năm" })).toBeInViewport();
});

test("FilterChipRow: leading views and a single chip by keyboard: radio menu, clearValue, Xoá lọc keeps the view (#115, #119)", async ({ page }) => {
  await open(page, "/components/filter-chip-row/", "dark");
  const ex = example(page, "filter-chip-row/views");
  // the default view is not "all"
  const open1 = ex.getByRole("button", { name: "Chưa xử lý" });
  await expect(open1).toHaveAttribute("aria-pressed", "true");
  await expect(ex.getByText("2 thư")).toBeVisible();
  await open1.focus();
  await page.keyboard.press("Tab");
  await expect(ex.getByRole("button", { name: "Tất cả", exact: true })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(ex.getByRole("button", { name: "Tất cả", exact: true })).toHaveAttribute("aria-pressed", "true");
  await expect(ex.getByText("4 thư")).toBeVisible();
  // the next Tab stop is the single chip, named for the filter and its default value
  await page.keyboard.press("Tab");
  const chip = ex.getByRole("button", { name: "Hộp thư: Tất cả" });
  await expect(chip).toBeFocused();
  await expect(chip).toHaveAttribute("aria-haspopup", "menu");
  await page.keyboard.press("Enter");
  const menu = page.getByRole("menu", { name: "Hộp thư" });
  await expect(menu).toBeVisible();
  const all = menu.getByRole("menuitemradio", { name: "Tất cả" });
  await expect(all).toBeFocused();
  await expect(all).toHaveAttribute("aria-checked", "true");
  await page.keyboard.press("ArrowDown");
  await expect(menu.getByRole("menuitemradio", { name: /^Bán hàng/ })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(menu).toBeHidden();
  const on = ex.getByRole("button", { name: "Hộp thư: Bán hàng" });
  await expect(on).toBeFocused();
  await expect(ex.getByText("2 thư")).toBeVisible();
  // it opens on the checked item; Escape returns to the chip
  await page.keyboard.press("Enter");
  await expect(menu.getByRole("menuitemradio", { name: /^Bán hàng/ })).toBeFocused();
  await expect(menu.getByRole("menuitemradio", { name: /^Bán hàng/ })).toHaveAttribute("aria-checked", "true");
  await page.keyboard.press("Escape");
  await expect(on).toBeFocused();
  // picking the default clears the filter
  await page.keyboard.press("Enter");
  await expect(menu.getByRole("menuitemradio", { name: /^Bán hàng/ })).toBeFocused();
  await page.keyboard.press("Home");
  await expect(all).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(ex.getByRole("button", { name: "Hộp thư: Tất cả" })).toBeFocused();
  await expect(ex.getByRole("button", { name: "Xoá lọc" })).toHaveCount(0);
  // a single filter without clearValue: nothing checked until a value is picked; Xoá lọc leaves the view
  await ex.getByRole("button", { name: "Thư mục" }).click();
  await page.getByRole("menu", { name: "Thư mục" }).getByRole("menuitemradio", { name: "Lưu trữ" }).click();
  await expect(ex.getByRole("button", { name: "Thư mục: Lưu trữ" })).toBeVisible();
  await ex.getByRole("button", { name: "Xoá lọc" }).click();
  await expect(ex.getByRole("button", { name: "Thư mục" })).toBeVisible();
  await expect(ex.getByRole("button", { name: "Tất cả", exact: true })).toHaveAttribute("aria-pressed", "true");
});

test("List page block: title row with its action, views and filters in the URL; phone: actions under the title, radio views, radio group in the panel (#115, #119, #120)", async ({ browser }) => {
  for (const [width, phone] of [[1440, false], [430, true]] as const) {
    const page = await browser.newPage({ viewport: { width, height: 932 }, ...(phone ? { isMobile: true, hasTouch: true } : {}) });
    await open(page, "/components/list-page/", phone ? "light" : "dark");
    const ex = example(page, "list-page/page");
    const title = ex.getByRole("heading", { level: 1, name: "Đơn hàng" });
    const create = ex.getByRole("button", { name: "Tạo đơn" });
    await expect(create).toBeVisible();
    const [t, c] = [await title.boundingBox(), await create.boundingBox()];
    if (phone) expect(c!.y).toBeGreaterThanOrEqual(t!.y + t!.height - 1);
    else expect(Math.abs(c!.y + c!.height / 2 - (t!.y + t!.height / 2))).toBeLessThan(t!.height / 2);
    await expect(ex.getByRole("search", { name: "Tìm và lọc đơn hàng" })).toBeVisible();
    if (!phone) {
      await expect(ex.getByRole("button", { name: "Đang xử lý" })).toHaveAttribute("aria-pressed", "true");
      await ex.getByRole("button", { name: "Đã xong" }).click();
      await expect(page).toHaveURL(/[?&]view=done(&|$)/);
      await ex.getByRole("button", { name: "Chi nhánh: Tất cả" }).click();
      await page.getByRole("menu", { name: "Chi nhánh" }).getByRole("menuitemradio", { name: "Hà Nội" }).click();
      await expect(page).toHaveURL(/[?&]f\.branch=hn(&|$)/);
      // Xoá lọc clears the filters, not the view
      await ex.getByRole("button", { name: "Xoá lọc" }).click();
      await expect(page).not.toHaveURL(/f\.branch/);
      await expect(page).toHaveURL(/[?&]view=done(&|$)/);
    } else {
      // from the keyboard (a mouse click would leave the pointer over the bottom sheet that opens under it)
      const type = ex.getByRole("button", { name: "Đang xử lý" });
      await type.focus();
      await page.keyboard.press("Enter");
      const views = page.getByRole("menu", { name: "Đang xử lý" });
      await expect(views.getByRole("menuitemradio", { name: "Đang xử lý" })).toBeFocused();
      await expect(views.getByRole("menuitemradio", { name: "Đang xử lý" })).toHaveAttribute("aria-checked", "true");
      await page.keyboard.press("ArrowDown");
      await expect(views.getByRole("menuitemradio", { name: "Đã xong" })).toBeFocused();
      await page.keyboard.press("Enter");
      await expect(page).toHaveURL(/[?&]view=done(&|$)/);
      await ex.getByRole("button", { name: /^Bộ lọc/ }).click();
      const panel = page.getByRole("dialog", { name: "Bộ lọc" });
      await panel.getByRole("button", { name: /^Chi nhánh/ }).click();
      const radio = panel.getByRole("radio", { name: "Hồ Chí Minh" });
      await radio.focus();
      await page.keyboard.press("Space");
      await expect(page).toHaveURL(/[?&]f\.branch=hcm(&|$)/);
      await expect(panel.getByRole("button", { name: /^Chi nhánh\s*Hồ Chí Minh/ })).toBeVisible();
      await page.keyboard.press("ArrowDown");
      await expect(panel.getByRole("radio", { name: "Hà Nội" })).toBeChecked();
      await expect(page).toHaveURL(/[?&]f\.branch=hn(&|$)/);
      await page.keyboard.press("ArrowUp");
      await expect(panel.getByRole("radio", { name: "Hồ Chí Minh" })).toBeChecked();
      await page.keyboard.press("ArrowUp");
      await expect(panel.getByRole("radio", { name: "Tất cả" })).toBeChecked();
      await expect(page).not.toHaveURL(/f\.branch/);
      expect(await lowContrast(page)).toEqual([]);
      await page.keyboard.press("Escape");
      await expect(panel).toBeHidden();
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await page.close();
  }
});

test("SearchPill: debounced, Escape clears, / focuses it from the page", async ({ page }) => {
  await open(page, "/components/search-pill/", "dark");
  const ex = example(page, "search-pill/default");
  const field = ex.getByRole("searchbox", { name: "Tìm khách hàng" });
  await page.locator("body").click({ position: { x: 1, y: 1 } });
  await page.keyboard.press("/");
  await expect(field).toBeFocused();
  await expect(field).toHaveValue("");
  await page.keyboard.type("quế");
  await expect(ex.getByText("Đang tìm: quế")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(field).toHaveValue("");
  await expect(field).toBeFocused();
  await expect(ex.getByText("Đang tìm: —")).toBeVisible();
});

test("FilterPanel on a phone: the bar says the count, the panel traps focus, Escape returns to the button (#57)", async ({ browser }) => {
  const page = await browser.newPage({ viewport: { width: 430, height: 932 }, isMobile: true, hasTouch: true });
  await open(page, "/components/filter-panel/", "dark");
  const ex = example(page, "filter-panel/phone");
  // the name is its visible text: "Bộ lọc" and the count
  const button = ex.getByRole("button", { name: /^Bộ lọc\s*1$/ });
  await button.click();
  const panel = page.getByRole("dialog", { name: "Bộ lọc" });
  await expect(panel).toBeVisible();
  const box = await panel.boundingBox();
  expect(box && Math.round(box.width)).toBe(430);
  await expect(panel.getByRole("button", { name: "Trạng thái" })).toHaveAttribute("aria-expanded", "true");
  await panel.getByRole("button", { name: "Quốc gia" }).click();
  await panel.getByText("Đức").click();
  await panel.getByRole("switch", { name: "Từ 100 tấn/năm" }).click();
  await expect(panel.getByRole("button", { name: "Sản lượng năm" })).toHaveAttribute("aria-pressed", "false");
  for (let i = 0; i < 25; i++) await page.keyboard.press("Tab");
  expect(await panel.evaluate((el) => el.contains(document.activeElement))).toBe(true);
  expect(await lowContrast(page)).toEqual([]);
  await page.keyboard.press("Escape");
  await expect(panel).toBeHidden();
  await expect(ex.getByRole("button", { name: /^Bộ lọc\s*3$/ })).toBeFocused();
  await page.close();
});

test("SubpageToolbar phone layout: two rows, filters behind Bộ lọc, secondary actions in ⋯ (#57)", async ({ browser }) => {
  const page = await browser.newPage({ viewport: { width: 430, height: 932 }, isMobile: true, hasTouch: true });
  await open(page, "/components/subpage-toolbar/", "light");
  const ex = example(page, "subpage-toolbar/phone");
  // a toolbar without the phone props still wraps as before (#100 review)
  await expect(example(page, "subpage-toolbar/list-page").locator(".ml-auto").first()).not.toHaveClass(/flex-nowrap/);
  await expect(ex.getByRole("button", { name: "Khu vực: Hà Nội" })).toBeHidden();
  await expect(ex.getByRole("button", { name: "Xuất Excel" })).toBeHidden();
  const bar = ex.locator(".sticky").first();
  const height = (await bar.boundingBox())!.height;
  // title row + one row of controls (≥ 36px each), never three
  expect(height).toBeLessThan(130);
  await ex.getByRole("button", { name: "Thao tác khác" }).click();
  await expect(page.getByRole("menuitem", { name: "Xuất Excel" })).toBeVisible();
  await page.keyboard.press("Escape");
  const filters = ex.getByRole("button", { name: "Bộ lọc · 1" });
  await filters.click();
  await expect(page.getByRole("dialog", { name: "Bộ lọc" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(filters).toBeFocused();
  await page.close();
  // desktop: more than two typed filters collapse into Bộ lọc, the active one stays as a chip beside it
  const wide = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await open(wide, "/components/subpage-toolbar/", "light");
  const exw = example(wide, "subpage-toolbar/phone");
  await expect(exw.getByRole("button", { name: "Bộ lọc · 1" })).toBeVisible();
  await expect(exw.getByRole("button", { name: "Khu vực: Hà Nội" })).toBeVisible();
  await expect(exw.getByRole("button", { name: "Nhóm" })).toHaveCount(0);
  await expect(exw.getByRole("button", { name: "Xuất Excel" })).toBeVisible();
  await wide.close();
});

test("Charts: the keyboard reads every point, and the table view shows the values", async ({ page }) => {
  await open(page, "/components/chart/", "dark");
  const bar = example(page, "chart/bar");
  const svg = bar.getByRole("img", { name: "Bản in theo vật liệu, 5 tháng" });
  await svg.focus();
  await expect(bar.getByRole("status")).toContainText("196 bản"); // focus starts at the latest point
  await page.keyboard.press("Home");
  await expect(bar.getByRole("status")).toContainText("T6");
  await expect(bar.getByRole("status")).toContainText("120 bản");
  await page.keyboard.press("ArrowRight");
  await expect(bar.getByRole("status")).toContainText("150 bản");
  await bar.getByRole("button", { name: "Xem bảng" }).click();
  const table = bar.getByRole("table", { name: "Bản in theo vật liệu, 5 tháng" });
  await expect(table).toContainText("178 bản");
  await bar.getByRole("button", { name: "Xem biểu đồ" }).click();
  await expect(svg).toBeVisible();
});

test("InputOTP takes a pasted code; Carousel, Resizable and Menubar move from the keyboard", async ({ page }) => {
  await open(page, "/components/input-otp/", "dark");
  await page.getByRole("textbox", { name: "Mã xác thực" }).fill("123456");
  await expect(page.getByText("Đã xác thực")).toBeVisible();
  await page.getByRole("textbox", { name: "Mã xác thực" }).fill("111111");
  await expect(page.getByText("Mã không đúng, thử lại.")).toBeVisible();

  await open(page, "/components/carousel/", "dark");
  const carousel = page.getByRole("region", { name: "Sản phẩm nổi bật" });
  await carousel.getByRole("button", { name: "Ảnh sau" }).click();
  await expect(carousel.getByRole("button", { name: "Đến ảnh 2" })).toHaveAttribute("aria-current", "true");

  await open(page, "/components/resizable/", "dark");
  const handle = example(page, "resizable/editor").getByRole("separator");
  await handle.focus();
  await page.keyboard.press("ArrowRight");
  await expect(handle).toHaveAttribute("aria-valuenow", "37");
  await page.keyboard.press("Shift+ArrowLeft");
  await expect(handle).toHaveAttribute("aria-valuenow", "27");

  await open(page, "/components/menubar/", "dark");
  const bar = page.getByRole("menubar", { name: "Lệnh của trình chỉnh sửa" });
  await bar.getByRole("menuitem", { name: "Tệp" }).focus();
  await page.keyboard.press("ArrowDown");
  await expect(page.getByRole("menuitem", { name: /^Mở…/ })).toBeFocused();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("menuitem", { name: /^Hoàn tác/ })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(bar.getByRole("menuitem", { name: "Sửa" })).toBeFocused();
});

test("NavigationMenu opens a panel of links and Escape returns focus", async ({ page }) => {
  await open(page, "/components/navigation-menu/", "dark");
  const nav = page.getByRole("navigation", { name: "Điều hướng chính" });
  const trigger = nav.getByRole("button", { name: "Sản phẩm" });
  await trigger.click();
  await expect(trigger).toHaveAttribute("aria-expanded", "true");
  await expect(nav.getByRole("link", { name: /Vật liệu/ })).toBeVisible();
  await expect(nav.getByRole("link", { name: "Bảng giá" })).toHaveAttribute("aria-current", "page");
  await nav.getByRole("link", { name: /Vật liệu/ }).focus();
  await page.keyboard.press("Escape");
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
  await expect(trigger).toBeFocused();
});

test("Agent parts: tool call opens, approval replaces its buttons, file tree moves from the keyboard", async ({ page }) => {
  await open(page, "/components/tool-call/", "dark");
  const slice = page.getByRole("button", { name: /Cắt lớp mô hình/ });
  await expect(slice).toHaveAttribute("aria-expanded", "false");
  await slice.click();
  await expect(slice).toHaveAttribute("aria-expanded", "true");
  await expect(page.getByText('"layer": 0.2')).toBeVisible();

  await open(page, "/components/action-confirmation/", "dark");
  const mail = page.getByRole("group", { name: "Gửi email báo giá cho 3 khách hàng?" });
  await mail.getByRole("button", { name: "Gửi 3 email" }).click();
  await expect(mail.getByText("Đã cho phép")).toBeVisible();
  await expect(mail.getByRole("button")).toHaveCount(0);

  await open(page, "/components/file-tree/", "dark");
  const tree = page.getByRole("tree", { name: "Tệp đã thay đổi" });
  await tree.getByRole("treeitem", { name: /^src/ }).first().focus();
  await page.keyboard.press("ArrowLeft");
  await expect(tree.getByRole("treeitem", { name: /^src/ }).first()).toHaveAttribute("aria-expanded", "false");
  await page.keyboard.press("ArrowDown");
  await expect(tree.getByRole("treeitem", { name: /^package\.json/ })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(tree.getByRole("treeitem", { name: /^package\.json/ })).toHaveAttribute("aria-selected", "true");
  await expect(example(page, "file-tree/changes").getByText("package.json", { exact: true }).last()).toBeVisible();

  await open(page, "/components/context-meter/", "dark");
  await expect(page.getByRole("meter").first()).toHaveAttribute("aria-valuetext", /12\.4K \/ 200K token \(6%\)/);
});

test("side menu: items have icon in desktop mode, and keeps its scroll position when a page is opened", async ({ page }) => {
  await open(page, "/components/", "dark");
  const menu = page.locator("aside .overflow-y-auto").first();
  await expect(page.locator("aside nav svg").first()).toBeVisible();
  const link = page.locator("aside").getByRole("link", { name: "Menubar" });
  // the menu can re-render once after load (#101: "Element is not attached to the DOM"): retry the pair together, so
  // the item is looked up again on the settled menu. A real person clicks what is already in view; Playwright would
  // scroll it itself.
  await expect(async () => {
    await menu.evaluate((el) => (el.scrollTop = el.scrollHeight));
    await link.scrollIntoViewIfNeeded({ timeout: 1000 });
  }).toPass({ timeout: 10_000 });
  const before = await menu.evaluate((el) => el.scrollTop);
  expect(before).toBeGreaterThan(0);
  await link.click();
  await expect(page).toHaveURL(/\/components\/menubar\/$/);
  await expect(page.locator("aside").getByRole("link", { name: "Menubar" })).toHaveAttribute("aria-current", "page");
  expect(await page.locator("aside .overflow-y-auto").first().evaluate((el) => el.scrollTop)).toBe(before);
});

test("Medium a11y: modal drag-out, hoverable tooltip, toast announcer, inert slides, equal slider thumbs", async ({ page }) => {
  // a press that starts in the panel and ends on the backdrop does not close the Modal; a real backdrop click does
  await open(page, "/components/modal/", "dark");
  await example(page, "modal/basic").getByRole("button", { name: "Cấu hình in" }).click();
  const dialog = page.getByRole("dialog");
  const box = (await dialog.getByRole("textbox").first().boundingBox())!;
  await page.mouse.move(box.x + 10, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(4, 4, { steps: 5 });
  await page.mouse.up();
  await expect(dialog).toBeVisible();
  await page.mouse.click(4, 4);
  await expect(dialog).toBeHidden();

  // the pointer can move from the trigger onto the tooltip without it closing (WCAG 1.4.13)
  await open(page, "/components/tooltip/", "dark");
  await example(page, "tooltip/icon-button").getByRole("button", { name: "Làm mới" }).hover();
  const tip = page.getByRole("tooltip");
  await expect(tip).toBeVisible();
  const tb = (await tip.boundingBox())!;
  await page.mouse.move(tb.x + tb.width / 2, tb.y + tb.height / 2, { steps: 3 });
  await page.waitForTimeout(400);
  await expect(tip).toBeVisible();

  // a toast sits in a polite live region of the labelled stack; no live region is nested in another
  await open(page, "/components/toast/", "dark");
  await page.getByRole("button", { name: "Cảnh báo" }).click();
  const stack = page.getByRole("region", { name: "Thông báo nổi" }); // the docs layout names it (ToastHost label)
  await expect(stack.locator('[aria-live="polite"]')).toContainText("Mất kết nối máy in");
  expect(await stack.locator("[aria-live] [aria-live], [aria-live] [role=alert], [aria-live] [role=status]").count()).toBe(0);

  // slides off screen are inert (3 per view at desktop width: the 4th and 5th)
  await open(page, "/components/carousel/", "dark");
  const slides = example(page, "carousel/products").locator('[aria-roledescription="slide"]');
  await expect(slides.nth(0)).not.toHaveAttribute("inert", /.*/);
  await expect(slides.nth(3)).toHaveAttribute("inert", "");

  // two range thumbs on one value can be pulled apart to the right
  await open(page, "/components/slider/", "dark");
  const thumbs = example(page, "slider/range").getByRole("slider");
  await thumbs.nth(0).focus();
  await page.keyboard.press("End"); // the low thumb stops at the high one: both 600
  await expect(thumbs.nth(0)).toHaveAttribute("aria-valuenow", "600");
  const th = (await thumbs.nth(1).boundingBox())!;
  await page.mouse.move(th.x + th.width / 2, th.y + th.height / 2);
  await page.mouse.down();
  await page.mouse.move(th.x + th.width / 2 + 80, th.y + th.height / 2, { steps: 6 });
  await page.mouse.up();
  await expect(thumbs.nth(0)).toHaveAttribute("aria-valuenow", "600");
  expect(Number(await thumbs.nth(1).getAttribute("aria-valuenow"))).toBeGreaterThan(600);
});

// WCAG 2.2 AA audit (0.28.2): control edges, chosen segments, focus in forced colours, label in name.
/** Inputs whose edge (border or fill) is below 3:1 against what is around them (WCAG 1.4.11). */
function weakEdges(page: Page) {
  return page.evaluate(() => {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 1;
    const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
    const rgba = (c: string) => {
      ctx.clearRect(0, 0, 1, 1);
      ctx.fillStyle = c;
      ctx.fillRect(0, 0, 1, 1);
      const d = ctx.getImageData(0, 0, 1, 1).data;
      return [d[0], d[1], d[2], d[3] / 255];
    };
    const blend = (t: number[], b: number[]) => [0, 1, 2].map((i) => t[i] * t[3] + b[i] * (1 - t[3])).concat(1);
    const lum = (c: number[]) => {
      const a = c.slice(0, 3).map((v) => ((v /= 255) <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
      return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
    };
    const ratio = (a: number[], b: number[]) => {
      const [x, y] = [lum(a), lum(b)].sort((p, q) => p - q);
      return (y + 0.05) / (x + 0.05);
    };
    const bgOf = (el: Element | null) => {
      const stack: number[][] = [];
      for (let e = el; e; e = e.parentElement) {
        const c = rgba(getComputedStyle(e).backgroundColor);
        if (c[3] > 0) {
          stack.push(c);
          if (c[3] >= 1) break;
        }
      }
      let base = rgba(getComputedStyle(document.documentElement).backgroundColor);
      if (base[3] < 1) base = [255, 255, 255, 1];
      for (let i = stack.length - 1; i >= 0; i--) base = blend(stack[i], base);
      return base;
    };
    const fails: string[] = [];
    const sel = 'main input[type=text]:not([data-bare]),main input[type=email],main input[type=password],main input[type=number],main textarea,main input[type=checkbox],main input[type=radio]';
    for (const el of document.querySelectorAll<HTMLInputElement>(sel)) {
      const r = el.getBoundingClientRect();
      if (!r.width || el.disabled || el.closest("[aria-disabled=true]") || el.checked) continue;
      // a borderless input inside a framed group (InputGroup, composer, OTP) is edged by the frame
      let box: Element = el;
      for (let e: Element | null = el; e && e !== document.body; e = e.parentElement)
        if (parseFloat(getComputedStyle(e).borderTopWidth) > 0) {
          box = e;
          break;
        }
      const st = getComputedStyle(box);
      const outer = bgOf(box.parentElement);
      const own = rgba(st.backgroundColor);
      const fill = own[3] > 0 ? blend(own, outer) : outer;
      const bc = rgba(st.borderTopColor);
      const k = Math.max(ratio(fill, outer), parseFloat(st.borderTopWidth) > 0 && bc[3] > 0 ? ratio(blend(bc, outer), outer) : 0);
      if (k < 3) fails.push(`${k.toFixed(2)} ${el.type} ${el.closest("[data-example]")?.getAttribute("data-example") ?? ""}`);
    }
    return fails;
  });
}

for (const theme of THEMES)
  test(`input edges ≥ 3:1 · ${theme}`, async ({ page }) => {
    await open(page, "/components/", theme);
    expect(await weakEdges(page)).toEqual([]);
    await open(page, "/components/field/", theme); // includes an invalid input
    expect(await weakEdges(page)).toEqual([]);
  });

test("the chosen segment has a ring, not only a faint fill", async ({ page }) => {
  await open(page, "/components/tabs/", "light");
  const on = page.getByRole("tab", { name: "Tuần" });
  expect(await on.evaluate((e) => getComputedStyle(e).boxShadow)).toMatch(/inset/);
});

test("DatePicker, toolbar select and tab panel show keyboard focus", async ({ page }) => {
  const ring = async (loc: ReturnType<Page["locator"]>) => {
    await loc.focus();
    await page.keyboard.press("Shift+Tab");
    await page.keyboard.press("Tab");
    await expect(loc).toBeFocused();
    return loc.evaluate((e) => getComputedStyle(e).boxShadow.split(/,(?![^(]*\))/).some((s) => !/rgba\(0, 0, 0, 0\)|^none$/.test(s.trim())));
  };
  await open(page, "/components/date-picker/", "light");
  expect(await ring(example(page, "date-picker/basic").getByRole("button", { name: /Ngày in/ }))).toBe(true);
  await open(page, "/components/select/", "light");
  expect(await ring(example(page, "select/toolbar").getByRole("button", { name: /^Sắp xếp/ }))).toBe(true);
  await open(page, "/components/tabs/", "light");
  expect(await ring(example(page, "tabs/underline").getByRole("tabpanel"))).toBe(true);
});

test("focus stays visible in forced colours (Windows high contrast)", async ({ browser }) => {
  const ctx = await browser.newContext({ forcedColors: "active" });
  const page = await ctx.newPage();
  await page.goto("/components/button/");
  const btn = page.locator("main [data-example] button").first();
  await btn.focus();
  await page.keyboard.press("Shift+Tab");
  await page.keyboard.press("Tab");
  expect(await page.evaluate(() => getComputedStyle(document.activeElement!).outlineStyle)).not.toBe("none");
  await ctx.close();
});

test("a select named by aria-label is announced with the value it shows", async ({ page }) => {
  await open(page, "/components/select/", "light");
  await expect(example(page, "select/toolbar").getByRole("button", { name: "Sắp xếp: Mới nhất", exact: true })).toBeVisible();
});

test("text follows the browser's default font size (sizes in rem)", async ({ page }) => {
  await open(page, "/components/field/", "light");
  const size = () => page.locator("main input").first().evaluate((e) => parseFloat(getComputedStyle(e).fontSize));
  const base = await size();
  await page.addStyleTag({ content: "html{font-size:32px!important}" });
  expect(await size()).toBeCloseTo(base * 2, 0);
});

test("focused input shows a 2px indicator; Terminal output is a named region", async ({ page }) => {
  await open(page, "/components/field/", "light");
  const input = example(page, "field/basic").locator("input").first();
  await input.focus();
  expect(await input.evaluate((e) => getComputedStyle(e).boxShadow)).toMatch(/0px 0px 0px 1px/);
  await open(page, "/components/terminal/", "light");
  await expect(page.getByRole("region", { name: "npm run build" })).toBeVisible();
});

test("a clickable Card is a keyboard button: Tab reaches it, Enter picks it, aria-pressed follows", async ({ page }) => {
  await open(page, "/foundations/", "light");
  const tile = page.getByRole("button", { name: /^trash\b/ }).first();
  await tile.focus();
  await expect(tile).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(tile).toHaveAttribute("aria-pressed", "true");
  expect(await tile.evaluate((e) => getComputedStyle(e).boxShadow)).not.toBe("none");
});

// #106 page types and states: every new control's keyboard path. Each first step retries until React has hydrated.
test("WorkspaceLayout on a phone: the panel stacks on top and its main action stays at the bottom of the screen (#106)", async ({ page }) => {
  await page.setViewportSize({ width: 430, height: 932 });
  await open(page, "/components/workspace-layout/", "dark");
  const box = example(page, "workspace-layout/request");
  // the docs frame scrolls sideways (overflow-x-auto), which would be the sticky container: take it out, as in an app
  await box.locator("[data-density-view]").evaluate((el) => el.classList.remove("overflow-x-auto"));
  await box.getByRole("group", { name: "Mặt hàng" }).scrollIntoViewIfNeeded();
  const panel = await box.getByRole("region", { name: "Bảng điều khiển" }).boundingBox();
  const result = await box.getByRole("region", { name: "Kết quả" }).boundingBox();
  expect(result!.y).toBeGreaterThan(panel!.y + panel!.height - 1);
  expect(panel!.y + panel!.height).toBeGreaterThan(932);
  await expect(async () => {
    const send = await box.getByRole("button", { name: /Gửi hỏi giá/ }).boundingBox();
    expect(send!.y + send!.height).toBeLessThanOrEqual(932);
  }).toPass({ timeout: 5_000 });
});

test("WorkspaceLayout in AppShell with the phone tab bar: the main action sticks above the tab bar, not under it (#106)", async ({ page }) => {
  await page.setViewportSize({ width: 430, height: 700 });
  await open(page, "/demo/workspace/", "dark");
  const send = page.getByRole("button", { name: "Gửi hỏi giá" });
  const bar = page.getByRole("navigation").filter({ has: page.getByRole("link", { name: "Hộp thư" }) }).filter({ visible: true }).last();
  await expect(bar).toBeVisible();
  const panel = await page.getByRole("region", { name: "Bảng điều khiển" }).boundingBox();
  const tabs = (await bar.boundingBox())!;
  expect(panel!.y + panel!.height).toBeGreaterThan(tabs.y); // the panel runs under the tab bar: the action must stick
  await expect(async () => {
    const b = (await send.boundingBox())!;
    expect(b.y + b.height).toBeLessThanOrEqual(tabs.y + 1);
    expect(b.y).toBeGreaterThan(tabs.y - 120);
  }).toPass({ timeout: 5_000 });
  // and the button is really on top (not covered by the tab bar)
  const b = (await send.boundingBox())!;
  expect(await page.evaluate(([x, y]) => document.elementFromPoint(x, y)?.closest("button")?.textContent ?? "", [b.x + b.width / 2, b.y + b.height / 2])).toContain("Gửi hỏi giá");
});

test("GuidedEmptyState on a phone: the starting points are one row that scrolls sideways (#106)", async ({ page }) => {
  await page.setViewportSize({ width: 430, height: 932 });
  await open(page, "/components/guided-empty-state/", "dark");
  const tiles = example(page, "guided-empty-state/carousel").getByRole("list").first().getByRole("listitem");
  await expect(tiles).toHaveCount(3);
  const ys = await tiles.evaluateAll((els) => els.map((e) => Math.round(e.getBoundingClientRect().top)));
  expect(new Set(ys).size).toBe(1);
});

test("Stepper: a spinbutton; arrows, Page Up / Down, Home / End; the − + buttons are out of the Tab order (#106)", async ({ page }) => {
  await open(page, "/components/stepper/", "dark");
  const box = example(page, "stepper/basic");
  const spin = box.getByRole("spinbutton", { name: "số tấn tiêu đen" });
  await expect(async () => {
    await spin.focus();
    await page.keyboard.press("Home");
    await expect(spin).toHaveAttribute("aria-valuenow", "1", { timeout: 500 });
  }).toPass({ timeout: 10_000 });
  await expect(spin).toHaveAttribute("aria-valuetext", "1 tấn");
  await expect(box.getByRole("button", { name: "Giảm số tấn tiêu đen" })).toBeDisabled();
  await page.keyboard.press("ArrowUp");
  await page.keyboard.press("ArrowRight");
  await expect(spin).toHaveAttribute("aria-valuenow", "3");
  await page.keyboard.press("PageUp");
  await expect(spin).toHaveAttribute("aria-valuenow", "13");
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("ArrowLeft");
  await expect(spin).toHaveAttribute("aria-valuenow", "11");
  await page.keyboard.press("End");
  await expect(spin).toHaveAttribute("aria-valuenow", "99");
  await page.keyboard.press("ArrowUp");
  await expect(spin).toHaveAttribute("aria-valuenow", "99");
  await box.getByRole("button", { name: "Giảm số tấn tiêu đen" }).click();
  await expect(spin).toHaveAttribute("aria-valuenow", "98");
  // one Tab stop per stepper: from the first stepper's value straight to the second one's
  const limits = example(page, "stepper/limits");
  await limits.getByRole("spinbutton", { name: "số thùng" }).focus();
  await page.keyboard.press("ArrowUp");
  await expect(limits.getByRole("spinbutton", { name: "số thùng" })).toHaveAttribute("aria-valuenow", "60");
  await page.keyboard.press("Tab");
  await expect(limits.getByRole("spinbutton", { name: "số thùng" })).not.toBeFocused();
  await expect(limits.getByRole("button", { name: /số thùng/ }).first()).not.toBeFocused();
});

test("DropZone: Enter on the tile opens the file picker; the file shows and the section counter follows (#106)", async ({ page }) => {
  await open(page, "/components/drop-zone/", "dark");
  const box = example(page, "drop-zone/basic");
  const zone = box.getByRole("button", { name: /Kéo tệp quy cách vào đây/ });
  await zone.focus();
  let chooser!: import("@playwright/test").FileChooser;
  await expect(async () => {
    const wait = page.waitForEvent("filechooser", { timeout: 1000 });
    await zone.focus();
    await page.keyboard.press("Enter");
    chooser = await wait;
  }).toPass({ timeout: 10_000 });
  await chooser.setFiles({ name: "quy-cach.pdf", mimeType: "application/pdf", buffer: Buffer.from("%PDF-1.4") });
  await expect(box.getByText("quy-cach.pdf")).toBeVisible();
  await expect(box.getByRole("group", { name: "Quy cách đính kèm" })).toContainText("1/5");
});

test("GuidedEmptyState: the carousel steps with the keyboard, focus moves to the other arrow at an end (#106)", async ({ page }) => {
  await open(page, "/components/guided-empty-state/", "dark");
  const box = example(page, "guided-empty-state/carousel");
  const next = box.getByRole("button", { name: "Bước sau" });
  await expect(async () => {
    await next.focus();
    await page.keyboard.press("Enter");
    await expect(box.getByText("Bước 2 / 4")).toBeVisible({ timeout: 500 });
  }).toPass({ timeout: 10_000 });
  await page.keyboard.press("Enter");
  await page.keyboard.press("Enter");
  await expect(box.getByText("Bước 4 / 4")).toBeVisible();
  await expect(box.getByRole("heading", { name: "So sánh và chốt" })).toBeVisible();
  await expect(next).toBeDisabled();
  await expect(box.getByRole("button", { name: "Bước trước" })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(box.getByText("Bước 3 / 4")).toBeVisible();
  // the starting points are a list of buttons / links under a heading per category
  await expect(box.getByRole("heading", { name: "Theo mặt hàng" })).toBeVisible();
  await expect(box.getByRole("link", { name: /Tất cả mặt hàng/ })).toBeVisible();
});

test("FeatureIntro: a dialog with focus trap and restore, Escape skips, and it waits while another dialog is open (#106)", async ({ page }) => {
  await open(page, "/components/feature-intro/", "dark");
  const trigger = example(page, "feature-intro/basic").getByRole("button", { name: "Xem lại giới thiệu" });
  const dialog = page.getByRole("dialog", { name: "Yêu cầu mua trên một màn hình" });
  await expect(async () => {
    await trigger.click();
    await expect(page.getByRole("dialog")).toBeVisible({ timeout: 500 });
  }).toPass({ timeout: 10_000 });
  await expect(dialog.getByRole("button", { name: "Tiếp" })).toBeFocused();
  await expect(dialog).toContainText("Bước 1 / 3");
  // Tab stays inside: Bỏ qua ↔ Tiếp
  await page.keyboard.press("Tab");
  await expect(dialog.getByRole("button", { name: "Bỏ qua" })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(dialog.getByRole("button", { name: "Tiếp" })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("dialog", { name: "So sánh từng mặt hàng" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(trigger).toBeFocused();
  // another modal dialog is up: the intro waits until it is gone
  await page.evaluate(() => {
    const d = Object.assign(document.createElement("div"), { id: "other-dialog", textContent: "Other" });
    d.setAttribute("role", "dialog");
    d.setAttribute("aria-modal", "true");
    d.setAttribute("aria-label", "Other");
    document.body.append(d);
  });
  await trigger.click();
  await page.waitForTimeout(300);
  await expect(page.getByRole("dialog", { name: "Yêu cầu mua trên một màn hình" })).toHaveCount(0);
  await page.evaluate(() => document.getElementById("other-dialog")?.remove());
  await expect(page.getByRole("dialog", { name: "Yêu cầu mua trên một màn hình" })).toBeVisible();
  await page.getByRole("button", { name: "Bỏ qua" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

test("HintTextarea: @ and / open a listbox; arrows, Enter inserts at the caret, Escape closes only the list (#106)", async ({ page }) => {
  await open(page, "/components/hint-textarea/", "dark");
  const box = example(page, "hint-textarea/basic");
  const text = box.getByRole("combobox", { name: "Lời nhắn gửi nhà cung cấp" });
  const list = box.getByRole("listbox");
  await expect(async () => {
    await text.fill("Chào anh chị, bên em cần báo giá cho @tay");
    await expect(list).toBeVisible({ timeout: 500 });
  }).toPass({ timeout: 10_000 });
  // matching ignores Vietnamese marks: "tay" finds "Tây Nguyên"
  await expect(list.getByRole("option")).toHaveCount(1);
  await expect(list.getByRole("option", { name: /Gia vị Tây Nguyên/ })).toHaveAttribute("aria-selected", "true");
  const active = await text.getAttribute("aria-activedescendant");
  expect(active).toBeTruthy();
  await expect(text).toHaveAttribute("aria-controls", (await list.getAttribute("id"))!);
  await expect(text).toHaveAttribute("aria-expanded", "true");
  await expect(text).toHaveAttribute("aria-haspopup", "listbox");
  // an input method confirming a composition (Safari: Enter with keyCode 229, isComposing already false) inserts nothing
  await text.evaluate((el) => el.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", keyCode: 229, bubbles: true, cancelable: true })));
  await expect(text).toHaveValue("Chào anh chị, bên em cần báo giá cho @tay");
  await expect(list).toBeVisible();
  await page.keyboard.press("Enter");
  await expect(text).toHaveValue("Chào anh chị, bên em cần báo giá cho @taynguyen ");
  await expect(list).toBeHidden();
  await expect(text).toHaveAttribute("aria-expanded", "false");
  await expect(text).toBeFocused();
  // a trigger in the middle of the text: the word at the caret is replaced, the rest kept
  await text.fill("Gửi @ hôm nay");
  await text.evaluate((el: HTMLTextAreaElement) => el.setSelectionRange(5, 5));
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("ArrowLeft");
  await expect(list.getByRole("option")).toHaveCount(3);
  await page.keyboard.press("ArrowDown");
  await expect(list.getByRole("option", { name: /HTX Tiêu Chư Sê/ })).toHaveAttribute("aria-selected", "true");
  await page.keyboard.press("ArrowUp");
  await page.keyboard.press("ArrowUp");
  await expect(list.getByRole("option", { name: /Hương Quế Yên Bái/ })).toHaveAttribute("aria-selected", "true");
  await page.keyboard.press("Tab");
  await expect(text).toHaveValue("Gửi @yenbai hôm nay");
  // the / templates; Escape closes the list and leaves the text and focus alone
  // to the end (End does not move the caret in a macOS text field)
  await text.evaluate((el: HTMLTextAreaElement) => el.setSelectionRange(el.value.length, el.value.length));
  await page.keyboard.type(" /");
  await expect(list.getByRole("option")).toHaveCount(2);
  await page.keyboard.press("Escape");
  await expect(list).toBeHidden();
  await expect(text).toBeFocused();
  await expect(text).toHaveValue("Gửi @yenbai hôm nay /");
});
