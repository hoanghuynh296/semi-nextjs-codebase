// Motion wiring (#151, T9): verifies PageEnter + stagger once per route, shell stillness, display: contents fixed-height
// chain, Skeleton motion-pulse, Tooltip motion-tooltip, Accordion / Collapsible motion-disclosure, and reduced motion.
import { expect, test } from "@playwright/test";
import { PRERENDER_PORT } from "../playwright.config";

const BASE = `http://127.0.0.1:${PRERENDER_PORT}`;

test("PageEnter & stagger on client navigation: top blocks + at most 10 items animate with token values; filter, ?tab=, and late rows do not; shell stays still (#151)", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`${BASE}/motion/orders`);
  await expect(page.getByRole("heading", { level: 1, name: "Đơn hàng" })).toBeVisible();

  // Wait for initial enter window to close before navigating to /motion/catalog
  await expect(page.locator("[data-motion-enter]")).toHaveAttribute("data-motion-enter", "done", { timeout: 3000 });

  // Client navigation to Catalog (14 cards in PageGrid)
  await page.locator("aside").getByRole("link", { name: "Catalog" }).click();
  await expect(page).toHaveURL(/\/motion\/catalog$/);
  await expect(page.getByRole("heading", { level: 1, name: "Danh mục" })).toBeVisible();

  const shotDir = process.env.SEMI_MOTION_SHOT_DIR;
  if (shotDir) {
    await page.screenshot({ path: `${shotDir}/page-enter-mid.png` });
  }

  const navAnims = await page.evaluate(() => {
    const all = document.getAnimations().filter((a): a is CSSAnimation => "animationName" in a);
    const enterAnims = all.filter((a) => a.animationName === "semi-enter");
    const gridCards = Array.from(document.querySelectorAll("[data-page-grid] > *"));
    const animatedCards = gridCards.filter((el) => el.getAnimations().some((a) => "animationName" in a && (a as CSSAnimation).animationName === "semi-enter"));
    const cardDelays = animatedCards.map((el) => {
      const a = el.getAnimations().find((x) => "animationName" in x && (x as CSSAnimation).animationName === "semi-enter")!;
      return Number(a.effect?.getTiming().delay ?? 0);
    });
    const firstAnim = enterAnims[0];
    const firstTiming = firstAnim?.effect?.getTiming();
    const firstKfEasing = (firstAnim?.effect as KeyframeEffect | undefined)?.getKeyframes()?.[0]?.easing;
    const shell = document.querySelector("aside");
    const shellCard = document.querySelector("[data-shell-card]");
    const shellAnims = [
      ...(shell?.getAnimations() ?? []),
      ...(shellCard?.getAnimations() ?? []),
    ];
    return {
      enterCount: enterAnims.length,
      totalCards: gridCards.length,
      animatedCardCount: animatedCards.length,
      cardDelays,
      duration: firstTiming?.duration,
      easing: firstKfEasing,
      shellAnimCount: shellAnims.length,
      shellMounts: (window as unknown as { __motionShellMounts?: number }).__motionShellMounts,
    };
  });

  if (shotDir) {
    await expect(page.locator("[data-motion-enter]")).toHaveAttribute("data-motion-enter", "done", { timeout: 3000 });
    await page.screenshot({ path: `${shotDir}/page-enter-settled.png` });
  }

  expect(navAnims.enterCount).toBeGreaterThan(0);
  expect(navAnims.totalCards).toBe(14);
  expect(navAnims.animatedCardCount).toBe(10); // capped at first 10 items
  expect(navAnims.duration).toBe(400);
  expect(navAnims.easing).toBe("cubic-bezier(0.25, 0.46, 0.45, 0.94)");
  // 35ms stagger between consecutive cards
  for (let i = 1; i < navAnims.cardDelays.length; i++) {
    expect(navAnims.cardDelays[i] - navAnims.cardDelays[i - 1]).toBeCloseTo(35, 3);
  }
  expect(navAnims.shellAnimCount).toBe(0);
  expect(navAnims.shellMounts).toBe(1);

  // Navigate back to Orders (15 table rows)
  await page.locator("aside").getByRole("link", { name: "Orders" }).click();
  await expect(page).toHaveURL(/\/motion\/orders$/);
  await expect(page.getByRole("heading", { level: 1, name: "Đơn hàng" })).toBeVisible();

  const rowAnims = await page.evaluate(() => {
    const rows = Array.from(document.querySelectorAll("tbody > tr"));
    const animatedRows = rows.filter((el) => el.getAnimations().some((a) => "animationName" in a && (a as CSSAnimation).animationName === "semi-enter"));
    return { total: rows.length, animated: animatedRows.length };
  });
  expect(rowAnims.total).toBe(15);
  expect(rowAnims.animated).toBe(10);

  // Wait for enter window to close, then verify filter, ?tab=, and late-arriving rows run NO enter animation
  await expect(page.locator("[data-motion-enter]")).toHaveAttribute("data-motion-enter", "done", { timeout: 3000 });

  await page.getByRole("tab", { name: "Đang mở" }).click();
  await expect(page).toHaveURL(/\/motion\/orders\?tab=open$/);
  const afterTab = await page.evaluate(() =>
    document.getAnimations().filter((a) => "animationName" in a && (a as CSSAnimation).animationName === "semi-enter").length,
  );
  expect(afterTab).toBe(0);

  await page.getByTestId("motion-tooltip-trigger").click();
  const afterFilter = await page.evaluate(() =>
    document.getAnimations().filter((a) => "animationName" in a && (a as CSSAnimation).animationName === "semi-enter").length,
  );
  expect(afterFilter).toBe(0);

  await page.getByRole("button", { name: "Thêm dòng chậm" }).click();
  const afterLateRow = await page.evaluate(() =>
    document.getAnimations().filter((a) => "animationName" in a && (a as CSSAnimation).animationName === "semi-enter").length,
  );
  expect(afterLateRow).toBe(0);
});

test("PageEnter adds no layout box (display: contents), preserving fixed-height inner scrollers (#151)", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`${BASE}/motion/fixed`);
  await expect(page.getByRole("heading", { level: 1, name: "Cuộn nội bộ" })).toBeVisible();

  const layout = await page.evaluate(() => {
    const wrapper = document.querySelector("[data-motion-enter]")!;
    const scroller = document.querySelector('[data-testid="inner-scroller"]')!;
    return {
      display: getComputedStyle(wrapper).display,
      scrollHeight: scroller.scrollHeight,
      clientHeight: scroller.clientHeight,
    };
  });
  expect(layout.display).toBe("contents");
  expect(layout.scrollHeight).toBeGreaterThan(layout.clientHeight);
});

test("Skeleton pulse, Tooltip entrance, and Accordion / Collapsible disclosure use T1 motion tokens (#151)", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`${BASE}/motion/orders`);
  await expect(page.getByRole("heading", { level: 1, name: "Đơn hàng" })).toBeVisible();

  // Skeleton uses motion-pulse: 2.5s ease-in-out infinite, opacity 1 -> 0.6 -> 1
  const pulse = await page.evaluate(() => {
    const el = document.querySelector('[data-testid="motion-skeleton"] .shimmer')!;
    const anim = el.getAnimations().find((a): a is CSSAnimation => "animationName" in a && (a as CSSAnimation).animationName === "semi-pulse");
    if (!anim) return null;
    const timing = anim.effect!.getTiming();
    const kf = (anim.effect as KeyframeEffect).getKeyframes();
    return { duration: timing.duration, easing: kf[0]?.easing, iterations: timing.iterations, opacities: kf.map((k) => k.opacity) };
  });
  expect(pulse).not.toBeNull();
  expect(pulse!.duration).toBe(2500);
  expect(pulse!.easing).toBe("ease-in-out");
  expect(pulse!.iterations).toBe(Infinity);
  expect(pulse!.opacities).toContain("0.6");

  // Tooltip uses motion-tooltip: 200ms cubic-bezier(0.16, 1, 0.3, 1)
  await page.getByTestId("motion-tooltip-trigger").focus();
  await expect(page.getByRole("tooltip", { name: "Gợi ý thao tác" })).toBeVisible();
  const tooltipAnim = await page.evaluate(() => {
    const tip = document.querySelector('[role="tooltip"]')!;
    const anim = tip.getAnimations().find((a): a is CSSAnimation => "animationName" in a);
    if (!anim) return null;
    const t = anim.effect!.getTiming();
    const kf = (anim.effect as KeyframeEffect).getKeyframes();
    return { name: anim.animationName, duration: t.duration, easing: kf[0]?.easing };
  });
  expect(tooltipAnim).not.toBeNull();
  expect(tooltipAnim!.duration).toBe(200);
  expect(tooltipAnim!.easing).toBe("cubic-bezier(0.16, 1, 0.3, 1)");

  // Accordion & Collapsible use motion-disclosure (300ms ease-out open, 300ms ease-in close)
  const accBtn = page.getByTestId("motion-accordion").getByRole("button", { name: "Chính sách đổi trả" });
  const closedStyle = await page.evaluate(() => {
    const panel = document.querySelector('[data-testid="motion-accordion"] .semi-disclosure')!;
    const cs = getComputedStyle(panel);
    return { duration: cs.transitionDuration, timing: cs.transitionTimingFunction, open: panel.getAttribute("data-open") };
  });
  expect(closedStyle.open).toBe("false");
  expect(closedStyle.duration).toContain("0.3s");
  expect(closedStyle.timing).toContain("ease-in");

  await accBtn.click();
  const openStyle = await page.evaluate(() => {
    const panel = document.querySelector('[data-testid="motion-accordion"] .semi-disclosure')!;
    const cs = getComputedStyle(panel);
    return { duration: cs.transitionDuration, timing: cs.transitionTimingFunction, open: panel.getAttribute("data-open") };
  });
  expect(openStyle.open).toBe("true");
  expect(openStyle.duration).toContain("0.3s");
  expect(openStyle.timing).toContain("ease-out");

  const colBtn = page.getByTestId("motion-collapsible").getByRole("button", { name: "Chi tiết vận chuyển" });
  await colBtn.click();
  await expect(page.getByTestId("motion-collapsible").locator(".semi-disclosure")).toHaveAttribute("data-open", "true");
});

test("Under prefers-reduced-motion: reduce, no transform is animated and skeleton pulse stops (#151)", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`${BASE}/motion/orders`);
  await expect(page.getByRole("heading", { level: 1, name: "Đơn hàng" })).toBeVisible();

  // Skeleton pulse stops
  const skeletonAnims = await page.evaluate(() => {
    const el = document.querySelector('[data-testid="motion-skeleton"] .shimmer')!;
    return el.getAnimations().length;
  });
  expect(skeletonAnims).toBe(0);

  // Client navigation under reduced motion: opacity only, zero transform in keyframes
  await page.locator("aside").getByRole("link", { name: "Catalog" }).click();
  await expect(page).toHaveURL(/\/motion\/catalog$/);
  await expect(page.getByRole("heading", { level: 1, name: "Danh mục" })).toBeVisible();

  const reducedNav = await page.evaluate(() => {
    const anims = document.getAnimations().filter((a): a is CSSAnimation => "animationName" in a);
    const hasTransform = anims.some((a) =>
      ((a.effect as KeyframeEffect)?.getKeyframes() ?? []).some((kf) => "transform" in kf && kf.transform !== undefined),
    );
    const names = [...new Set(anims.map((a) => a.animationName))];
    return { count: anims.length, hasTransform, names };
  });
  expect(reducedNav.count).toBeGreaterThan(0);
  expect(reducedNav.hasTransform).toBe(false);
  expect(reducedNav.names.every((n) => n === "semi-fade-in" || n === "semi-crumb-out")).toBe(true);

  // Tooltip under reduced motion: opacity only, no scale / transform
  await page.locator("aside").getByRole("link", { name: "Orders" }).click();
  await expect(page).toHaveURL(/\/motion\/orders$/);
  await page.getByTestId("motion-tooltip-trigger").focus();
  await expect(page.getByRole("tooltip", { name: "Gợi ý thao tác" })).toBeVisible();

  const reducedTooltip = await page.evaluate(() => {
    const tip = document.querySelector('[role="tooltip"]')!;
    const anims = tip.getAnimations();
    const hasTransform = anims.some((a) =>
      ((a.effect as KeyframeEffect)?.getKeyframes() ?? []).some((kf) => "transform" in kf && kf.transform !== undefined),
    );
    return { count: anims.length, hasTransform };
  });
  expect(reducedTooltip.count).toBeGreaterThan(0);
  expect(reducedTooltip.hasTransform).toBe(false);
});
