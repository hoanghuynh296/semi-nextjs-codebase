"use client";

// Brand book: who the brand is, its logo, colours, type, voice and imagery, in the order a designer presents them.
// The design system details (scales, contrast, components) are on the UI kit page. Copied into a brand kit's
// .preview/ by semi-brand; do not edit there.
import { Alert, Button, EmptyState, Icon } from "@semi/ui";
import { CARD } from "@semi/ui/styles";
import brand from "../brand.json";
import { BothThemes, first, guide as g, logoSrc, MiniScreen, Section, THEME_NAME, THEMES } from "../parts";

const font = (role) => brand.fonts.find((f) => f.roles.includes(role))?.family;
const style = brand.styles.default;

/** The logo (or the name in the display font) as artwork, so the misuse examples work for a brand without a logo. */
function LogoArt({ theme, height = 40, style: css }) {
  const src = logoSrc(theme);
  if (src) return <img src={src} alt="" style={{ height, width: "auto", ...css }} />;
  return (
    <span className="font-display font-semibold text-contrast whitespace-nowrap" style={{ fontSize: height * 0.7, lineHeight: 1, display: "inline-block", ...css }}>
      {brand.name}
    </span>
  );
}

function Cover() {
  const b = g?.brief ?? {};
  return (
    <section className="rounded-panel bg-accent text-on-accent overflow-hidden">
      <div className="grid @3xl:grid-cols-[1.3fr_1fr] gap-8 p-6 @3xl:p-10 items-center">
        <div className="space-y-5 min-w-0">
          {logoSrc("light") && (
            <div className="inline-flex rounded-card bg-canvas p-3" data-theme="light">
              <LogoArt theme="light" height={32} />
            </div>
          )}
          <h1 className="font-display font-semibold leading-tight break-words" style={{ fontSize: "clamp(36px, 7vw, 64px)" }}>
            {brand.name}
          </h1>
          {b.tagline && <p className="text-title-lg leading-relaxed max-w-xl">{b.tagline}</p>}
          {b.personality?.length > 0 && (
            <ul className="flex flex-wrap gap-2" aria-label="Tính cách">
              {b.personality.map((w) => (
                <li key={w} className="px-3 h-8 inline-flex items-center rounded-chip border border-current text-ui font-medium">
                  {w}
                </li>
              ))}
            </ul>
          )}
        </div>
        <div data-theme="light" className="bg-canvas text-body rounded-card shadow-card overflow-hidden max-w-sm w-full justify-self-center">
          <MiniScreen theme="light" />
        </div>
      </div>
    </section>
  );
}

function Brief() {
  const b = g?.brief;
  if (!b) return <Alert tone="info">Chưa có brief. Thêm bằng: brand.mjs set product="…" audience="…" personality="nhanh, vui vẻ, đáng tin" tagline="…"</Alert>;
  const items = [
    ["Sản phẩm", b.product, "box"],
    ["Người dùng", b.audience, "users"],
  ].filter(([, v]) => v);
  return (
    <Section title="Thương hiệu này là ai" icon="users" card={false}>
      <div className="grid gap-3 @2xl:grid-cols-3">
        {items.map(([k, v, icon]) => (
          <div key={k} className={`${CARD} p-5 space-y-2`}>
            <div className="flex items-center gap-2 text-label font-medium text-muted">
              <Icon name={icon} className="w-4 h-4 text-accent-fg" />
              {k}
            </div>
            <p className="text-ui-lg text-body leading-relaxed">{v}</p>
          </div>
        ))}
        {b.personality?.length > 0 && (
          <div className={`${CARD} p-5 space-y-2`}>
            <div className="flex items-center gap-2 text-label font-medium text-muted">
              <Icon name="sparkles" className="w-4 h-4 text-accent-fg" />
              Tính cách
            </div>
            <p className="font-display text-heading font-semibold text-contrast leading-snug">{b.personality.join(" · ")}</p>
          </div>
        )}
      </div>
    </Section>
  );
}

const MISUSE = [
  ["Kéo méo", { transform: "scaleX(1.45)" }],
  ["Đổi màu", { filter: "hue-rotate(150deg) saturate(1.6)" }],
  ["Xoay nghiêng", { transform: "rotate(-14deg)" }],
  ["Thêm bóng, hiệu ứng", { filter: "drop-shadow(3px 4px 0 rgba(0,0,0,.45))" }],
];

function Logo() {
  const l = g?.logo;
  const busy = `repeating-linear-gradient(135deg, ${brand.primary[300]} 0 10px, ${(brand.secondary ?? brand.primary)[700]} 10px 20px)`;
  return (
    <Section title="Logo" icon="image" card={false} lead={l ? `Khoảng trống quanh logo tối thiểu ${l.clearspace} × chiều cao logo; bản đầy đủ rộng ít nhất ${l.minWidth}px.` : undefined}>
      {!l && <Alert tone="info">Thương hiệu chưa có logo: các ví dụ dưới đây dùng tên thương hiệu. Thêm logo bằng: brand.mjs set logo=assets/logo.svg logoDark=… mark=…</Alert>}
      <div className="grid gap-3 @2xl:grid-cols-3">
        {THEMES.map((t) => (
          <figure key={t} className="space-y-1.5">
            <div data-theme={t} className="bg-canvas rounded-card border border-line h-44 flex items-center justify-center">
              <div className="border border-dashed border-line-hover" style={{ padding: `${(l?.clearspace ?? 0.5) * 40}px` }}>
                <LogoArt theme={t} />
              </div>
            </div>
            <figcaption className="text-caption text-muted px-1">
              Nền {THEME_NAME[t].toLowerCase()}
              {t === "dark" && l && !l.fullDarkDist ? " (chưa có bản cho nền tối: dùng bản thường)" : ""} · nét đứt = khoảng trống
            </figcaption>
          </figure>
        ))}
        <figure className="space-y-1.5">
          <div className="bg-panel rounded-card border border-line h-44 flex items-center justify-center gap-4">
            {l?.markDist ? (
              [16, 24, 32, 48].map((px) => <img key={px} src={logoSrc("light", "mark")} alt="" style={{ width: px, height: px }} />)
            ) : (
              <span className="text-label text-muted px-4 text-center">Chưa có biểu tượng vuông (mark) cho favicon và icon app</span>
            )}
          </div>
          <figcaption className="text-caption text-muted px-1">Biểu tượng: favicon, icon app, sidebar thu gọn</figcaption>
        </figure>
      </div>
      <div className="space-y-2">
        <h3 className="text-title font-semibold text-contrast px-1">Không được làm</h3>
        <div className="grid gap-3 grid-cols-2 @3xl:grid-cols-5">
          {MISUSE.map(([label, css]) => (
            <figure key={label} className="space-y-1.5">
              <div data-theme="light" className="bg-canvas rounded-card border border-line h-28 flex items-center justify-center overflow-hidden">
                <LogoArt theme="light" height={28} style={css} />
              </div>
              <figcaption className="flex items-center gap-1.5 text-label text-body px-1">
                <Icon name="close" className="w-4 h-4 text-danger-fg shrink-0" />
                {label}
              </figcaption>
            </figure>
          ))}
          <figure className="space-y-1.5">
            <div className="rounded-card border border-line h-28 flex items-center justify-center overflow-hidden" style={{ background: busy }}>
              <LogoArt theme="light" height={28} />
            </div>
            <figcaption className="flex items-center gap-1.5 text-label text-body px-1">
              <Icon name="close" className="w-4 h-4 text-danger-fg shrink-0" />
              Trên nền rối
            </figcaption>
          </figure>
        </div>
      </div>
    </Section>
  );
}

const MIX_LABEL = { neutral: "Trung tính (nền, chữ)", surface: "Bề mặt (thẻ, ô nhập)", accent: "Màu chính", secondary: "Màu phụ" };
const MIX_CLASS = { neutral: "bg-canvas", surface: "bg-raised", accent: "bg-accent", secondary: "bg-secondary-solid" };

function Colors() {
  const c = g?.color;
  const n = (k) => THEMES.map((t) => brand.neutrals[style]?.[t]?.[k]).filter(Boolean);
  const swatches = [
    { name: "Màu chính", hex: brand.primary[brand.brandStep], role: "Nút chính, link, mục đang chọn, focus", cls: "bg-primary" },
    ...(brand.secondary ? [{ name: "Màu phụ", hex: brand.secondary[brand.secondaryStep], role: c?.secondaryRule ? `Chỉ cho ${c.secondaryRule.split(" (")[0]}` : "Điểm nhấn", cls: "bg-secondary" }] : []),
    { name: "Nền", hex: n("color-canvas").join(" / "), role: "Nền trang (sáng / tối)", cls: "bg-canvas" },
    { name: "Bề mặt", hex: n("color-panel").join(" / "), role: "Thẻ, bảng, khung", cls: "bg-panel" },
    { name: "Chữ", hex: n("color-text-contrast").join(" / "), role: "Tiêu đề, chữ chính", cls: "bg-contrast" },
  ];
  const off = THEMES.filter((t) => (brand.fidelity?.[t]?.deltaE ?? 0) > 0.08);
  return (
    <Section title="Màu" icon="palette" card={false} lead={c ? `Mức dùng màu chính: ${c.accentLabel}. ${c.accentRule}` : undefined}>
      <div className="grid gap-3 grid-cols-2 @3xl:grid-cols-5">
        {swatches.map((s, i) => (
          <div key={s.name} className={`${CARD} overflow-hidden ${i === 0 ? "col-span-2 @3xl:col-span-1" : ""}`}>
            <div className={`h-24 ${s.cls} border-b border-line`} />
            <div className="p-3 space-y-1">
              <div className="text-title font-semibold text-contrast">{s.name}</div>
              <div className="text-caption text-muted tabular-nums break-all">{s.hex}</div>
              <div className="text-label text-body">{s.role}</div>
            </div>
          </div>
        ))}
      </div>
      {c?.mix && (
        <div className={`${CARD} p-4 space-y-3`}>
          <div className="text-title font-semibold text-contrast">Tỉ lệ màu trên một màn hình</div>
          <div className="flex h-10 rounded-control overflow-hidden border border-line divide-x divide-line-hover" role="img" aria-label={Object.entries(c.mix).map(([k, v]) => `${MIX_LABEL[k]} ${v}%`).join(", ")}>
            {Object.entries(c.mix).map(([k, v]) => (
              <div key={k} className={MIX_CLASS[k]} style={{ width: `${v}%` }} />
            ))}
          </div>
          <ul className="flex flex-wrap gap-x-5 gap-y-1.5 text-label text-body">
            {Object.entries(c.mix).map(([k, v]) => (
              <li key={k} className="flex items-center gap-1.5">
                <span className={`w-3 h-3 rounded-chip border border-line ${MIX_CLASS[k]}`} />
                {MIX_LABEL[k]} <span className="tabular-nums text-muted">{v}%</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {off.length > 0 && (
        <Alert tone="info">
          Ở nền {off.map((t) => THEME_NAME[t].toLowerCase()).join(" và ")}, nút chính dùng sắc gần nhất với màu thương hiệu mà vẫn đọc rõ (xem UI kit).
        </Alert>
      )}
    </Section>
  );
}

function Type() {
  const b = g?.brief ?? {};
  const pair = [
    ["Tiêu đề, số liệu", font("display"), "font-display"],
    ["Giao diện, nội dung", font("sans"), "font-sans"],
  ];
  return (
    <Section title="Chữ" icon="fileText" card={false}>
      <div className="grid gap-3 @2xl:grid-cols-2">
        {pair.map(([role, family, cls]) => (
          <div key={role} className={`${CARD} p-5 space-y-3`}>
            <div className={`${cls} text-contrast leading-none`} style={{ fontSize: 72 }}>
              Aa
            </div>
            <div>
              <div className="text-title font-semibold text-contrast">{family}</div>
              <div className="text-label text-muted">{role}</div>
            </div>
            <div className={`${cls} text-ui-lg text-body break-words`}>AĂÂBCDĐEÊGHIKLMNOÔƠPQRSTUƯVXY · 0123456789 · ạ ả ã ề ộ ữ</div>
          </div>
        ))}
      </div>
      <div className={`${CARD} p-6 space-y-3`}>
        <div className="font-display font-semibold text-contrast leading-tight" style={{ fontSize: "clamp(26px, 4vw, 40px)" }}>
          {b.tagline || `${brand.name}: rõ ràng, nhanh, đáng tin.`}
        </div>
        <p className="text-ui-lg text-body leading-relaxed max-w-2xl">
          {b.product ? `${b.product}. ` : ""}Đoạn văn dùng font giao diện: dễ đọc ở cỡ nhỏ, đủ dấu tiếng Việt, số liệu thẳng hàng trong bảng.
        </p>
      </div>
    </Section>
  );
}

function Voice() {
  if (!g) return null;
  const v = g.voice;
  const ex = v.examples;
  return (
    <Section
      title="Giọng văn"
      icon="megaphone"
      card={false}
      lead={`${v.toneLabel}. Gọi người dùng là “${v.address}”, thương hiệu tự xưng “${v.we}”. Emoji: ${v.emoji ? "có, tiết chế, không dùng trong lỗi" : "không"}.${v.custom ? "" : " Đây là giọng mặc định: thương hiệu chưa chọn giọng văn."}`}
    >
      {(v.do.length > 0 || v.dont.length > 0) && (
        <div className="grid gap-3 @2xl:grid-cols-2">
          {[
            ["Nên", v.do, "check", "text-success-fg"],
            ["Không nên", v.dont, "close", "text-danger-fg"],
          ].map(([label, items, icon, cls]) => (
            <div key={label} className={`${CARD} p-5 space-y-2`}>
              <div className="text-title font-semibold text-contrast">{label}</div>
              {items.length ? (
                items.map((x) => (
                  <div key={x} className="flex gap-2 text-ui text-body">
                    <Icon name={icon} className={`w-4 h-4 mt-0.5 shrink-0 ${cls}`} />
                    {x}
                  </div>
                ))
              ) : (
                <div className="text-label text-muted">Chưa có</div>
              )}
            </div>
          ))}
        </div>
      )}
      <BothThemes>
        {() => (
          <div className="p-4 space-y-3">
            <div className="flex flex-wrap gap-2">
              <Button variant="primary">{first(ex.button, "Lưu")}</Button>
              {Array.isArray(ex.button) && ex.button.slice(1, 3).map((b) => <Button key={b}>{b}</Button>)}
            </div>
            <Alert tone="danger">{ex.error ?? "Chưa lưu được. Kiểm tra kết nối rồi thử lại."}</Alert>
            <EmptyState icon="box" title={ex.empty ?? "Chưa có gì ở đây"} action={<Button variant="primary">{first(ex.button, "Bắt đầu")}</Button>} />
          </div>
        )}
      </BothThemes>
      <details className={`${CARD} p-4 group`}>
        <summary className="cursor-pointer text-title font-semibold text-contrast">Quy tắc viết chữ trên giao diện ({v.rules.length})</summary>
        <ul className="list-disc pl-5 pt-3 text-ui text-body space-y-1">
          {v.rules.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
      </details>
    </Section>
  );
}

export default function BrandBook() {
  return (
    <>
      <Cover />
      <Brief />
      <Logo />
      <Colors />
      <Type />
      <Voice />
      {g?.imagery && (
        <Section title="Hình ảnh" icon="camera">
          <p className="text-ui-lg text-body leading-relaxed max-w-3xl">{g.imagery}</p>
        </Section>
      )}
    </>
  );
}
