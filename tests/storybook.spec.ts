// Browser checks of the docs export: every page (and every component doc) reaches WCAG AA in both themes, axe finds
// no serious issue, nothing overflows a phone, the theme / style apply before paint, dialogs and menus are
// keyboard-operable, and the agent files are served.
import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import styleList from "../tokens/styles.json" with { type: "json" };
import tokens from "../tokens/tokens.json" with { type: "json" };
import docs from "../examples/list.generated.json" with { type: "json" };
import { a11yHits, lowContrast } from "./contrast";
import { densityAudit } from "../lint/density.mjs";

const DOC_PAGES = docs.map((d) => `/components/${d.id}/`);
const PAGES = ["/", "/components/", "/foundations/", "/brand/", "/lab/", ...DOC_PAGES];
/** Pages checked in every style: the gallery shows one example of every doc. */
const LOOK_PAGES = ["/", "/components/", "/components/table/", "/components/field/"];
const THEMES = ["dark", "light"] as const;
const STYLES = styleList.styles.map((s) => s.id);
const LOOKS = styleList.styles.map((s) => ({ style: s.id, name: s.id }));
const example = (page: Page, id: string) => page.locator(`[data-example="${id}"]`);

async function open(page: Page, path: string, theme: "dark" | "light" | "system", style?: string) {
  await page.addInitScript(([t, s]) => {
    localStorage.setItem("semi-theme", t);
    if (s) localStorage.setItem("semi-style", s);
    // Theme as soon as <body> exists = what the first paint uses (the inline ThemeScript runs in <head>).
    new MutationObserver((_, obs) => {
      if (document.body) {
        (window as unknown as { __firstPaintTheme?: string }).__firstPaintTheme = document.documentElement?.dataset.theme;
        (window as unknown as { __firstPaintStyle?: string }).__firstPaintStyle = document.documentElement?.dataset.style;
        obs.disconnect();
      }
    }).observe(document, { childList: true, subtree: true });
  }, [theme, style ?? ""] as const);
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

for (const path of LOOK_PAGES) {
  for (const theme of THEMES)
    for (const look of LOOKS)
      test(`a11y audit · ${look.name} · ${theme} · ${path}`, async ({ page }) => {
        await open(page, path, theme, look.style);
        expect(await a11yHits(page)).toEqual([]);
      });
  for (const style of STYLES)
    test(`fits a phone screen · ${style} · ${path}`, async ({ browser }) => {
      const page = await browser.newPage({ viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true });
      await open(page, path, "light", style);
      expect(await phoneOverflow(page)).toEqual([]);
      expect(await page.evaluate(densityAudit, { scope: "main" })).toEqual([]);
      await page.close();
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
    await page.getByRole("radio", { name: "Tối" }).first().click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark", { timeout: 1000 });
  }).toPass();
  expect(await page.evaluate(() => localStorage.getItem("semi-theme"))).toBe("dark");
});

test("styles: Soft is applied before paint, Soft and Sharp change the shape tokens and pass contrast in both themes", async ({ page }) => {
  const radius = () => page.evaluate(() => getComputedStyle(document.querySelector(".rounded-card")!).borderTopLeftRadius);
  await open(page, "/components/", "dark");
  expect(await radius()).toBe("12px"); // Flat, the default
  await page.getByRole("radiogroup", { name: "Style" }).getByRole("radio", { name: "Soft" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-style", "soft");
  expect(await radius()).toBe("20px");
  await page.reload();
  expect(await page.evaluate(() => (window as unknown as { __firstPaintStyle?: string }).__firstPaintStyle)).toBe("soft");
  await page.getByRole("radiogroup", { name: "Style" }).getByRole("radio", { name: "Sharp" }).click();
  expect(await radius()).toBe("0px");
});

test("styles: the docs offer the three styles only, and the chosen one applies before paint", async ({ page }) => {
  await open(page, "/components/", "light", "sharp");
  expect(await page.evaluate(() => (window as unknown as { __firstPaintStyle?: string }).__firstPaintStyle)).toBe("sharp");
  await expect(page.getByRole("radiogroup", { name: "Style" }).getByRole("radio")).toHaveCount(3);
  await expect(page.getByRole("radiogroup", { name: "Palette" })).toHaveCount(0);
  await page.getByRole("radiogroup", { name: "Style" }).getByRole("radio", { name: "Soft" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-style", "soft");
});

test("brand preview: a #brand= link recolours every page, passes contrast in both themes, and turns off", async ({ page }) => {
  const brand = { name: "Blue Co", package: "@blue/brand", primary: "#2563EB", neutral: "tinted", styles: { default: "soft", allowed: ["flat", "soft"] }, fonts: { sans: "Manrope", display: "Manrope" } };
  const hash = Buffer.from(JSON.stringify(brand)).toString("base64url");
  const accent = () => page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue("--semi-accent").trim());
  await open(page, `/components/#brand=${hash}`, "dark", "soft");
  await expect(page.getByText("Blue Co", { exact: true })).toBeVisible();
  for (const theme of THEMES) {
    await page.getByRole("radio", { name: theme === "dark" ? "Tối" : "Sáng" }).first().click();
    // The exact brand blue in both themes: white text reads on it and it stands out from the dark page (≥ 3:1).
    await expect.poll(accent).toBe("#2563eb");
    expect(await lowContrast(page)).toEqual([]);
  }
  await page.getByRole("radio", { name: "Tối" }).first().click();
  await page.goto("/components/button/"); // stays on across pages (applied once the page hydrates)
  await expect.poll(accent).toBe("#2563eb");
  await page.getByRole("button", { name: "Tắt xem trước brand" }).click();
  await expect.poll(accent).toBe("#00ae42"); // Semi's own green again (dark theme)
});

// ─── Design Lab (docs/LAB.md) ───────────────────────────────────────────────────────────────────────────────────

/** Computed `prop` of a fresh element with `cls` inside a wrapper with `attrs` (data-style, data-density …). */
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
const labHash = (d: object) => Buffer.from(JSON.stringify({ $semiLab: 1, type: {}, density: {}, typeScale: {}, styles: {}, params: {}, ...d })).toString("base64url");
const px = (v: string) => `${parseFloat(v) * (v.endsWith("rem") ? 16 : 1)}px`;

test("Design Lab: every value it edits reaches the utility apps use (no value is frozen at build time)", async ({ page }) => {
  // Each type size and each style token with a utility gets a distinct value; the real utility must follow it.
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
  const styles = Object.fromEntries(STYLES.map((id) => [id, { ...Object.fromEntries(shape.map(([k, v]) => [k, v])), "card-border": "3px solid red", "font-weight-title": "800" }]));
  await open(page, `/components/#lab=${labHash({ type, styles })}`, "dark", "soft");
  await expect(page.getByText("Design Lab", { exact: true })).toBeVisible();
  for (const [k, v] of Object.entries(type)) await expect.poll(() => probe(page, {}, k, "font-size"), { message: k }).toBe(v);
  for (const style of STYLES) {
    for (const [k, v, cls, prop] of shape) expect(await probe(page, { "data-style": style }, cls, prop), `${style} ${k}`).toBe(k === "spacing" ? px(`${parseFloat(v) * 4}rem`) : px(v));
    expect(await probe(page, { "data-style": style }, "border-card", "border-top-width"), `${style} card-border`).toBe("3px");
    expect(await probe(page, { "data-style": style }, "font-title", "font-weight"), `${style} font-weight-title`).toBe("800");
  }
});

test("Design Lab: a draft follows every page, keeps each style and density its own values, pauses, and its tabs pass AA", async ({ page }) => {
  const soft = styleList.styles.find((s) => s.id === "soft")!.tokens["radius-card"];
  const draft = { type: { "text-ui": "17px" }, density: { compact: { spacing: "0.3rem" } }, styles: { flat: { "radius-card": "1.5rem" } } };
  await open(page, `/components/button/#lab=${labHash(draft)}`, "dark", "flat");
  await expect.poll(() => probe(page, {}, "text-ui", "font-size")).toBe("17px");
  expect(await probe(page, {}, "rounded-card", "border-top-left-radius")).toBe("24px");
  expect(await probe(page, { "data-style": "soft" }, "rounded-card", "border-top-left-radius")).toBe(px(soft)); // a flat change stays in flat
  expect(await probe(page, { "data-density": "compact" }, "text-ui", "font-size")).toBe("13px"); // compact keeps its own size
  expect(await probe(page, { "data-density": "compact" }, "p-4", "padding-top")).toBe("19.2px");
  await page.goto("/components/"); // stored: stays on across pages
  await expect.poll(() => probe(page, {}, "text-ui", "font-size")).toBe("17px");
  await page.getByRole("button", { name: "Tạm tắt bản nháp Lab (xem bản gốc)" }).click();
  await expect.poll(() => probe(page, {}, "text-ui", "font-size")).toBe("14px");
  await page.getByRole("button", { name: "Bật lại bản nháp Lab" }).click();
  await expect.poll(() => probe(page, {}, "text-ui", "font-size")).toBe("17px");

  // Every tab of the Lab, both themes: the sample specimens of the compare tab included.
  await page.goto(`/lab/#lab=${labHash({ ...draft, params: { ladder: { 500: 0.6 } } })}`);
  await page.addStyleTag({ content: "*,*::before,*::after{transition:none!important;animation:none!important}" });
  for (const theme of THEMES) {
    await page.getByRole("radio", { name: theme === "dark" ? "Tối" : "Sáng" }).first().click();
    for (const tab of ["Chữ", "Hình khối", "Màu", "So sánh brand", "Thay đổi"]) {
      await page.getByRole("tab", { name: new RegExp(`^${tab}`) }).click();
      expect(await lowContrast(page), `${theme} · ${tab}`).toEqual([]);
      const { violations } = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
      expect(violations.filter((v) => v.impact === "serious" || v.impact === "critical").map((v) => `${tab}: ${v.id}`)).toEqual([]);
    }
  }
  await expect(page.getByRole("cell", { name: "ladder.500" })).toBeVisible();
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

test("Field wires label, hint and error to the input", async ({ page }) => {
  await open(page, "/components/field/", "light");
  await expect(page.getByLabel("Tên máy in")).toHaveAttribute("aria-describedby", /hint/);
  const input = page.getByLabel("Tên dự án");
  await input.fill("ab");
  await expect(input).toHaveAttribute("aria-invalid", "true");
  await expect(page.getByRole("alert").filter({ hasText: "ít nhất 3 ký tự" })).toBeVisible();
});

test("phones get the bottom tab bar", async ({ browser }) => {
  const page = await browser.newPage({ viewport: { width: 375, height: 812 } });
  await open(page, "/components/", "dark");
  await expect(page.getByRole("navigation", { name: "Điều hướng", exact: true })).toBeVisible();
  await page.close();
});

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
  test(`checked controls use the accent fill · ${theme}`, async ({ page }) => {
    const accent = () =>
      page.evaluate(() => {
        const probe = document.createElement("div");
        probe.className = "bg-accent";
        document.body.append(probe);
        const c = getComputedStyle(probe).backgroundColor;
        probe.remove();
        return c;
      });
    await open(page, "/components/checkbox/", theme);
    const checkbox = page.getByRole("checkbox", { name: "Tự động in khi rảnh" });
    await expect(checkbox).toBeChecked();
    expect(await checkbox.evaluate((el) => getComputedStyle(el).backgroundColor)).toBe(await accent());
    await open(page, "/components/radio-group/", theme);
    expect(await page.getByRole("radio", { name: /Pro/ }).evaluate((el) => getComputedStyle(el).borderTopColor)).toBe(await accent());
    await open(page, "/components/switch/", theme);
    expect(await page.getByRole("switch", { name: "Thông báo khi in xong" }).evaluate((el) => getComputedStyle(el).backgroundColor)).toBe(await accent());
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
  await menu.evaluate((el) => (el.scrollTop = el.scrollHeight));
  await link.scrollIntoViewIfNeeded(); // a real person clicks what is already in view: Playwright would scroll it itself
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

for (const style of STYLES)
  for (const theme of THEMES)
    test(`input edges ≥ 3:1 · ${style} · ${theme}`, async ({ page }) => {
      await open(page, "/components/", theme, style);
      expect(await weakEdges(page)).toEqual([]);
      await open(page, "/components/field/", theme, style); // includes an invalid input
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
