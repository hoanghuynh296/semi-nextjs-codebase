"use client";

// Pieces every page of the brand preview shares. Copied into a brand kit's .preview/ by semi-brand.
import { useEffect, useState } from "react";
import { Alert, Button, Icon, KpiCard, Pills } from "@semi/ui";
import { CARD, SECTION_HEAD, SECTION_TITLE } from "@semi/ui/styles";
import styleList from "@semi/ui/styles.json";
import brand from "./brand.json";

export const BASE = process.env.NEXT_PUBLIC_BASE_PATH || "";
export const THEME_NAME = { dark: "Tối", light: "Sáng" };
export const THEMES = ["light", "dark"];
export const first = (x, fallback) => (Array.isArray(x) ? x[0] : x) || fallback;
export const guide = brand.guide;

/**
 * Sample content of the screens, from the brief (brand.json brief.sample) so they show this product, not a generic
 * shop (DESIGN_SYSTEM.md §19). The defaults only stand in until the kit has a sample.
 */
const s = guide?.brief?.sample ?? {};
export const SAMPLE = {
  own: Boolean(guide?.brief?.sample),
  list: s.list ?? "Đơn hàng",
  items: s.items?.length ? s.items : ["Nguyễn An", "Trần Bình", "Lê Chi"],
  metric: s.metric ?? { label: "Doanh thu hôm nay", value: "12,4 tr", sub: "+18% so với hôm qua" },
  proof: s.proof ?? s.metric ?? { label: "Điểm đánh giá trung bình", value: "4,8 / 5" },
};

/** The logo file for a theme (the dark version on dark backgrounds when there is one), or null. */
export function logoSrc(theme, kind = "full") {
  const l = guide?.logo;
  if (!l) return null;
  const dist = kind === "mark" ? l.markDist : theme === "dark" && l.fullDarkDist ? l.fullDarkDist : l.fullDist;
  return dist ? `${BASE}/logo/${dist.split("/").pop()}` : null;
}

/** The logo, or the brand name in the display font when the brand has no logo yet. */
export function Wordmark({ theme, className = "h-6" }) {
  const l = guide?.logo;
  const name = <span className="font-display text-title font-semibold text-contrast">{brand.name}</span>;
  // No version for dark backgrounds: the full logo may not read there, so use the mark (if any) next to the name.
  if (l && theme === "dark" && !l.fullDarkDist)
    return l.markDist ? (
      <span className="inline-flex items-center gap-2">
        <img src={logoSrc(theme, "mark")} alt="" className={`${className} w-auto`} />
        {name}
      </span>
    ) : (
      name
    );
  const src = logoSrc(theme);
  if (src) return <img src={src} alt={brand.name} className={`${className} w-auto`} />;
  return name;
}

/** A titled block: plain (brand book pages) or in a card (UI kit). */
export function Section({ title, icon, lead, card = true, children }) {
  return (
    <section className="space-y-3">
      {card ? (
        <div className={SECTION_HEAD}>
          {icon && <Icon name={icon} className="w-4 h-4 text-accent-fg" />}
          <h2 className={SECTION_TITLE}>{title}</h2>
        </div>
      ) : (
        <h2 className="font-display text-heading-lg font-semibold text-contrast px-1">{title}</h2>
      )}
      {lead && <p className="text-ui text-muted max-w-3xl px-1">{lead}</p>}
      {card ? <div className={`${CARD} p-4 space-y-4`}>{children}</div> : children}
    </section>
  );
}

const styleName = (id) => styleList.styles.find((s) => s.id === id)?.name ?? id;

/** Switch between the styles this brand allows (stored, applied before paint by the layout script). */
export function StyleSwitch() {
  const [style, setStyle] = useState(brand.styles.default);
  useEffect(() => setStyle(document.documentElement.dataset.style || brand.styles.default), []);
  if (brand.styles.allowed.length < 2) return null;
  return (
    <Pills
      value={style}
      onChange={(id) => {
        document.documentElement.dataset.style = id;
        try {
          localStorage.setItem("brand-preview-style", id);
        } catch {}
        setStyle(id);
      }}
      options={brand.styles.allowed.map((id) => ({ key: id, label: styleName(id) }))}
    />
  );
}

/** Two copies of a screen, light and dark: side by side, or stacked for wide screens (dashboard, landing). */
export function BothThemes({ children, wide = false }) {
  return (
    <div className={`grid gap-4 ${wide ? "" : "@2xl:grid-cols-2"}`}>
      {THEMES.map((t) => (
        <figure key={t} className="space-y-1.5 min-w-0">
          <div data-theme={t} className="bg-canvas text-body rounded-card border border-line overflow-hidden">
            {children(t)}
          </div>
          <figcaption className="text-caption text-muted px-1">{THEME_NAME[t]}</figcaption>
        </figure>
      ))}
    </div>
  );
}

/** A small product screen in one theme: the leading figure, a selected row, an error in the brand's voice, the buttons. */
export function MiniScreen({ theme }) {
  const ex = guide?.voice.examples ?? {};
  return (
    <div className="p-3 space-y-3">
      <div className="flex items-center gap-2">
        <Wordmark theme={theme} />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <KpiCard featured label={SAMPLE.metric.label} value={SAMPLE.metric.value} sub={SAMPLE.metric.sub} />
      </div>
      <div className="rounded-card border border-line bg-panel divide-y divide-divider">
        <div className="flex items-center gap-2 px-3 py-2 bg-accent-subtle border-l-2 border-l-accent-fg">
          <span className="text-ui text-contrast font-medium truncate">{SAMPLE.own ? SAMPLE.items[0] : "Mục đang chọn"}</span>
          {brand.secondary && <span className="ml-auto inline-flex items-center px-2 h-5 rounded-chip text-caption font-medium bg-secondary-solid text-on-secondary">Mới</span>}
        </div>
        <div className="flex items-center gap-2 px-3 py-2">
          <span className="text-ui text-body truncate">{SAMPLE.own ? SAMPLE.items[1] : "Mục thường"}</span>
          <a href="#" className="ml-auto text-label text-accent-fg font-medium">Xem</a>
        </div>
      </div>
      <Alert tone="danger">{ex.error ?? "Chưa lưu được. Kiểm tra kết nối rồi thử lại."}</Alert>
      <div className="flex flex-wrap gap-2">
        <Button variant="primary" icon="check">
          {first(ex.button, "Lưu")}
        </Button>
        <Button>Huỷ</Button>
      </div>
    </div>
  );
}
