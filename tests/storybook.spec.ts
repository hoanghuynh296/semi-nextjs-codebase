// Browser checks of the Storybook export: every text/background pair reaches WCAG AA in both themes, axe finds no
// serious issue, the theme is applied before paint and persists, dialogs and menus are keyboard-operable.
import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const PAGES = ["/foundations.html", "/components.html", "/primitives.html", "/patterns.html", "/chat.html"];
const THEMES = ["dark", "light"] as const;

async function open(page: Page, path: string, theme: "dark" | "light" | "system") {
  await page.addInitScript((t) => {
    localStorage.setItem("semi-theme", t);
    // Theme as soon as <body> exists = what the first paint uses (the inline ThemeScript runs in <head>).
    new MutationObserver((_, obs) => {
      if (document.body) {
        (window as unknown as { __firstPaintTheme?: string }).__firstPaintTheme = document.documentElement?.dataset.theme;
        obs.disconnect();
      }
    }).observe(document, { childList: true, subtree: true });
  }, theme);
  await page.goto(path);
  await page.addStyleTag({ content: "*,*::before,*::after{transition:none!important;animation:none!important}" });
}

/** Text elements whose contrast against their effective background is below 4.5:1 (3:1 for large text). */
function lowContrast(page: Page) {
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
    const bgOf = (el: Element) => {
      const stack: number[][] = [];
      for (let e: Element | null = el; e; e = e.parentElement) {
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
    for (const el of document.querySelectorAll("body *")) {
      if (![...el.childNodes].some((n) => n.nodeType === 3 && n.textContent!.trim())) continue;
      const st = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      if (!r.width || !r.height || st.visibility === "hidden" || el.closest("[disabled],[aria-disabled=true],.sr-only")) continue;
      const bg = bgOf(el);
      const f0 = rgba(st.color);
      const fg = f0[3] < 1 ? blend(f0, bg) : f0;
      const k = ratio(fg, bg);
      const size = parseFloat(st.fontSize);
      const need = size >= 24 || (parseInt(st.fontWeight) >= 700 && size >= 18.66) ? 3 : 4.5;
      if (k < need) fails.push(`${k.toFixed(2)} "${el.textContent!.trim().slice(0, 40)}" .${String((el as HTMLElement).className).slice(0, 80)}`);
    }
    return fails;
  });
}

for (const path of PAGES) {
  for (const theme of THEMES) {
    test(`contrast AA · ${theme} · ${path}`, async ({ page }) => {
      await open(page, path, theme);
      await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
      expect(await lowContrast(page)).toEqual([]);
    });

    test(`axe · ${theme} · ${path}`, async ({ page }) => {
      await open(page, path, theme);
      const { violations } = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
      const serious = violations.filter((v) => v.impact === "serious" || v.impact === "critical");
      expect(serious.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).slice(0, 3).join(" | ")}`)).toEqual([]);
    });
  }

  test(`fits a phone screen · ${path}`, async ({ browser }) => {
    const page = await browser.newPage({ viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true });
    await open(page, path, "light");
    // Everything stays inside the page column (16px gutters) unless it sits in its own horizontal scroller
    const overflow = await page.evaluate(() => {
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
    expect(overflow).toEqual([]);
    await page.close();
  });

  test(`page never scrolls outside the shell · ${path}`, async ({ page }) => {
    await open(page, path, "dark");
    expect(await page.evaluate(() => (window.scrollTo(0, 500), window.scrollY))).toBe(0);
  });
}

test("stored theme is applied before the first paint and survives reload", async ({ page }) => {
  await open(page, "/components.html", "light");
  expect(await page.evaluate(() => (window as unknown as { __firstPaintTheme?: string }).__firstPaintTheme)).toBe("light");
  await page.getByRole("radio", { name: "Tối" }).first().click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  expect(await page.evaluate(() => localStorage.getItem("semi-theme"))).toBe("dark");
});

test("system theme follows prefers-color-scheme", async ({ browser }) => {
  for (const scheme of ["light", "dark"] as const) {
    const page = await browser.newPage({ colorScheme: scheme });
    await open(page, "/components.html", "system");
    expect(await page.evaluate(() => (window as unknown as { __firstPaintTheme?: string }).__firstPaintTheme)).toBe(scheme);
    await page.close();
  }
});

test("Modal traps focus, closes on Escape and returns focus to the opener", async ({ page }) => {
  await open(page, "/components.html", "dark");
  const opener = page.getByRole("button", { name: "Mở Modal Bento mẫu" });
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

test("Menu opens from the keyboard and Escape returns focus", async ({ page }) => {
  await open(page, "/primitives.html", "dark");
  const trigger = page.getByRole("button", { name: "Thao tác" }).first();
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
  await open(page, "/primitives.html", "light");
  const input = page.getByLabel("Tên máy in");
  await expect(input).toHaveAttribute("aria-describedby", /hint/);
  await input.fill("ab");
  await expect(input).toHaveAttribute("aria-invalid", "true");
  await expect(page.getByRole("alert").filter({ hasText: "ít nhất 3 ký tự" })).toBeVisible();
});

test("phones get the bottom tab bar", async ({ browser }) => {
  const page = await browser.newPage({ viewport: { width: 375, height: 812 } });
  await open(page, "/components.html", "dark");
  await expect(page.getByRole("navigation", { name: "Điều hướng" })).toBeVisible();
  await page.close();
});

for (const theme of THEMES) {
  test(`floating layers (drawer, menu, toast, tooltip) pass contrast · ${theme}`, async ({ page }) => {
    await open(page, "/primitives.html", theme);
    await page.getByRole("button", { name: "Toast cảnh báo" }).click();
    await page.locator('button[title="Làm mới"]').first().focus();
    await expect(page.getByRole("tooltip")).toBeVisible();
    expect(await lowContrast(page)).toEqual([]);
    await page.getByRole("button", { name: "Thao tác" }).first().click();
    await expect(page.getByRole("menu")).toBeVisible();
    expect(await lowContrast(page)).toEqual([]);
    await page.keyboard.press("Escape");
    await page.getByRole("button", { name: "Mở drawer" }).click();
    await expect(page.getByRole("dialog", { name: "Bộ lọc" })).toBeVisible();
    expect(await lowContrast(page)).toEqual([]);
  });
}

for (const theme of THEMES) {
  test(`checked controls use the accent fill · ${theme}`, async ({ page }) => {
    await open(page, "/primitives.html", theme);
    const accent = await page.evaluate(() => {
      const probe = document.createElement("div");
      probe.className = "bg-accent";
      document.body.append(probe);
      const c = getComputedStyle(probe).backgroundColor;
      probe.remove();
      return c;
    });
    const checkbox = page.getByRole("checkbox", { name: "Tự động in khi rảnh" });
    await expect(checkbox).toBeChecked();
    expect(await checkbox.evaluate((el) => getComputedStyle(el).backgroundColor)).toBe(accent);
    const radio = page.getByRole("radio", { name: /Pro/ });
    expect(await radio.evaluate((el) => getComputedStyle(el).borderTopColor)).toBe(accent);
    expect(await page.getByRole("switch", { name: "Thông báo khi in xong" }).evaluate((el) => getComputedStyle(el).backgroundColor)).toBe(accent);
  });
}

// ─── AI chat ─────────────────────────────────────────────────────────────────────────────────────────────────────

const chatPanel = (page: Page) => page.getByTestId("chat-workspace").getByRole("complementary", { name: "Trợ lý AI" });

for (const theme of THEMES) {
  test(`AI chat: send, stream, stop / retry and contrast · ${theme}`, async ({ page }) => {
    await open(page, "/chat.html", theme);
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
    // second question fails in the demo: error with retry
    await field.fill("Câu thứ hai");
    await field.press("Enter");
    await expect(panel.getByRole("alert")).toContainText("Không kết nối được");
    await expect(panel.getByRole("button", { name: "Thử lại" })).toBeVisible();
    expect(await lowContrast(page)).toEqual([]);
    const { violations } = await new AxeBuilder({ page }).include('[data-testid="chat-workspace"]').withTags(["wcag2a", "wcag2aa"]).analyze();
    expect(violations.filter((v) => v.impact === "serious" || v.impact === "critical").map((v) => v.id)).toEqual([]);
  });
}

test("AI chat: Enter while an input method composes does not send; Shift+Enter breaks the line", async ({ page }) => {
  await open(page, "/chat.html", "dark");
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
  await open(page, "/chat.html", "dark");
  const panel = chatPanel(page);
  const field = panel.getByRole("textbox", { name: "Hỏi về cài đặt in…" });
  const log = panel.getByRole("log");
  const ask = async (q: string) => {
    await field.fill(q);
    await field.press("Enter");
    await expect(panel.getByRole("button", { name: "Gửi" })).toBeVisible({ timeout: 10_000 });
  };
  for (const q of ["Một", "Hai", "Ba", "Bốn"]) await ask(q); // the second one fails in the demo
  expect(await log.evaluate((el) => el.scrollHeight > el.clientHeight + 200)).toBe(true);
  await field.fill("Năm");
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
  await open(page, "/chat.html", "light");
  await page.getByRole("button", { name: "Mở trên Modal" }).click();
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

test("AI chat fills the screen on phones", async ({ browser }) => {
  const page = await browser.newPage({ viewport: { width: 375, height: 812 } });
  await open(page, "/chat.html", "dark");
  const panel = chatPanel(page);
  const box = await panel.boundingBox();
  const host = await page.getByTestId("chat-workspace").boundingBox();
  expect(Math.round(box!.width)).toBe(Math.round(host!.width) - 2); // inside the 1px borders
  await expect(panel.getByRole("separator")).toBeHidden();
  await page.close();
});

test("AI chat: an empty conversation starts at the top (intro first)", async ({ browser }) => {
  const page = await browser.newPage({ viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true });
  await open(page, "/chat.html", "dark");
  const log = chatPanel(page).getByRole("log");
  await expect(log.getByText("Hỏi gì về bản in?")).toBeVisible();
  expect(await log.evaluate((el) => el.scrollTop)).toBe(0);
  await page.close();
});
