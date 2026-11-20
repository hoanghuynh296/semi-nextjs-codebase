// Shared browser checks of the docs export and the brand book export, on the audit apps run too (lint/a11y.mjs).
import type { Page } from "@playwright/test";
import { a11yAudit } from "../lint/a11y.mjs";

type Hit = { rule: string; value: string; text: string; cls: string };
const show = (h: Hit) => `${h.rule}: ${h.value} "${h.text}" .${h.cls.slice(0, 80)}`;

/** Text elements whose contrast against their effective background is below 4.5:1 (3:1 for large text). */
export async function lowContrast(page: Page) {
  return ((await page.evaluate(a11yAudit, { scope: "body", only: ["contrast"], limit: 50 })) as Hit[]).map(show);
}

/** Everything `semi a11y` reports on the page (DESIGN_SYSTEM.md §18): contrast, field edges, names, focus rings,
 * target size, image alt, lang, zoom. */
export async function a11yHits(page: Page) {
  return ((await page.evaluate(a11yAudit, { scope: "body", limit: 50 })) as Hit[]).map(show);
}
