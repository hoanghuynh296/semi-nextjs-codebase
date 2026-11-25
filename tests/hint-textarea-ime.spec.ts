// Vietnamese Telex IME composition guard for HintTextarea across Chromium, WebKit and Firefox (#148).
// Verifies that composing text (e.g. Telex "aa" -> "â", "ee" -> "ê") and confirming with Enter
// (isComposing: true or Safari's keyCode: 229) never steals Enter to insert a suggestion prematurely,
// and that a subsequent non-composing Enter inserts the expected suggestion cleanly.
import { expect, firefox, test, webkit, type Browser, type BrowserContext, type Page } from "@playwright/test";

async function runTelexTest(page: Page, context: BrowserContext, useCdp: boolean) {
  await page.goto("/components/hint-textarea/");
  const box = page.locator('[data-example="hint-textarea/basic"]');
  const text = box.getByRole("combobox", { name: "Lời nhắn gửi nhà cung cấp" });
  const list = page.getByRole("listbox");

  // Open trigger popup with "@t"
  await expect(async () => {
    await text.click();
    await text.fill("Báo giá @t");
    await expect(list).toBeVisible({ timeout: 500 });
  }).toPass({ timeout: 10_000 });

  if (useCdp) {
    // Real CDP IME composition for Vietnamese Telex ("aa" -> "â" -> "@tây")
    const cdp = await context.newCDPSession(page);
    await text.evaluate((el: HTMLTextAreaElement) => el.setSelectionRange(el.value.length, el.value.length));
    await cdp.send("Input.imeSetComposition", { text: "â", selectionStart: 1, selectionEnd: 1 });
    // Enter while composing must NOT accept the suggestion
    await text.evaluate((el) =>
      el.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", isComposing: true, bubbles: true, cancelable: true })),
    );
    await expect(list).toBeVisible();
    // Commit the composition ("ây")
    await cdp.send("Input.insertText", { text: "ây" });
    await expect(text).toHaveValue("Báo giá @tây");
  } else {
    // WebKit & Firefox: simulate Vietnamese Telex composition lifecycle + Enter with isComposing / keyCode 229
    await text.evaluate((el: HTMLTextAreaElement) => {
      el.setSelectionRange(el.value.length, el.value.length);
      el.dispatchEvent(new CompositionEvent("compositionstart", { data: "", bubbles: true }));
      el.dispatchEvent(new CompositionEvent("compositionupdate", { data: "â", bubbles: true }));
      el.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", isComposing: true, bubbles: true, cancelable: true }));
      // Safari fires keyCode 229 with isComposing already false right at commit
      el.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", keyCode: 229, bubbles: true, cancelable: true }));
      el.dispatchEvent(new CompositionEvent("compositionend", { data: "ây", bubbles: true }));
    });
    await expect(list).toBeVisible();
    await text.fill("Báo giá @tây");
  }

  // Diacritic-aware match narrows to Gia vị Tây Nguyên
  await expect(list.getByRole("option", { name: /Gia vị Tây Nguyên/ })).toBeVisible();
  await expect(list.getByRole("option")).toHaveCount(1);

  // Now a real non-composing Enter accepts the suggestion
  await page.keyboard.press("Enter");
  await expect(text).toHaveValue("Báo giá @taynguyen ");
  await expect(list).toBeHidden();
}

test("HintTextarea Vietnamese Telex IME composition · chromium", async ({ page, context }) => {
  await runTelexTest(page, context, true);
});

for (const engine of [
  { name: "webkit", launch: () => webkit.launch({ channel: undefined }) },
  { name: "firefox", launch: () => firefox.launch({ channel: undefined }) },
] as const) {
  test(`HintTextarea Vietnamese Telex IME composition · ${engine.name}`, async ({ baseURL }) => {
    test.setTimeout(60_000);
    let browser: Browser | undefined;
    try {
      browser = await engine.launch();
      const context = await browser.newContext({ baseURL });
      const page = await context.newPage();
      await runTelexTest(page, context, false);
    } finally {
      await browser?.close();
    }
  });
}
