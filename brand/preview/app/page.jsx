"use client";

// Brand overview: the brand's colours, type and contrast report, rendered with @semi/ui itself. Every component of
// Semi in these colours is one click away (/components/). Copied into a brand kit's .preview/ by semi-brand.
import Link from "next/link";
import { Alert, Badge, Button, EmptyState, Icon, KpiCard, PageTitle, Table, TBody, TD, TH, THead, TR } from "@semi/ui";
import { CARD, CARD_HOVER, SECTION_HEAD, SECTION_TITLE } from "@semi/ui/styles";
import list from "@semi/ui/examples/list.json";
import brand from "./brand.json";

function Section({ title, icon, children }) {
  return (
    <section className="space-y-3">
      <div className={SECTION_HEAD}>
        <Icon name={icon} className="w-4 h-4 text-accent-fg" />
        <h2 className={SECTION_TITLE}>{title}</h2>
      </div>
      <div className={`${CARD} p-4 space-y-4`}>{children}</div>
    </section>
  );
}

function Swatches({ label, scale }) {
  return (
    <div className="space-y-1.5">
      <div className="text-label font-medium text-muted">{label}</div>
      <div className="grid grid-cols-5 @2xl:grid-cols-10 gap-1.5">
        {Object.entries(scale).map(([shade, hex]) => (
          <div key={shade} className="space-y-1 min-w-0">
            <div className="h-10 rounded-control border border-line" style={{ background: hex }} />
            <div className="text-caption text-muted tabular-nums truncate">
              {shade} · {hex}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const BASE = process.env.NEXT_PUBLIC_BASE_PATH || "";
const THEME_NAME = { dark: "Tối", light: "Sáng" };
const first = (x, fallback) => (Array.isArray(x) ? x[0] : x) || fallback;

/** A small product screen in one style and theme: what a designer looks at to judge a brand, side by side. */
function SampleScreen({ theme }) {
  const g = brand.guide;
  const ex = g.voice.examples;
  const logo = g.logo && (theme === "dark" && g.logo.fullDarkDist ? g.logo.fullDarkDist : g.logo.fullDist);
  return (
    <div>
      <div data-theme={theme} className="bg-canvas text-body rounded-card border border-line p-3 space-y-3">
        <div className="flex items-center gap-2">
          {logo ? <img src={`${BASE}/logo/${logo.split("/").pop()}`} alt={brand.name} className="h-6 w-auto" /> : <span className="font-display text-title font-semibold text-contrast">{brand.name}</span>}
          <span className="ml-auto text-caption text-muted">{THEME_NAME[theme]}</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <KpiCard label="Đơn hôm nay" value="128" icon="receipt" iconTone="green" />
          <KpiCard label="Doanh thu" value="12,4 tr" icon="wallet" iconTone="green" />
        </div>
        <div className="rounded-card border border-line bg-panel divide-y divide-divider">
          <div className="flex items-center gap-2 px-3 py-2 bg-accent-subtle border-l-2 border-l-accent-fg">
            <span className="text-ui text-contrast font-medium">Mục đang chọn</span>
            {brand.secondary && <span className="ml-auto inline-flex items-center px-2 h-5 rounded-chip text-caption font-medium bg-secondary-solid text-on-secondary">Mới</span>}
          </div>
          <div className="flex items-center gap-2 px-3 py-2">
            <span className="text-ui text-body">Mục thường</span>
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
    </div>
  );
}

export default function BrandOverview() {
  const font = (role) => brand.fonts.find((f) => f.roles.includes(role))?.family;
  const ok = brand.report.filter((r) => r.ok).length;
  const fid = brand.fidelity ?? {};
  const g = brand.guide ?? null;
  return (
    <>
      <div className="space-y-3">
        <PageTitle title={brand.name} />
        <p className="text-ui-lg text-body max-w-3xl leading-relaxed">
          Bộ nhận diện của {brand.name} trên Semi Design System. Mọi sản phẩm cài <code className="text-accent-fg">{brand.package}</code> và trông như trang này.
          Đổi sáng / tối{brand.styles.allowed.length > 1 ? " và style" : ""} ở chân menu.
        </p>
      </div>

      <Link href="/components/" className={`${CARD_HOVER} p-4 flex items-center gap-3 outline-none focus-visible:ring-2 focus-visible:ring-focus`}>
        <Icon name="grid" className="w-5 h-5 text-accent-fg" />
        <div className="min-w-0">
          <div className="text-title font-semibold text-contrast">Tất cả component</div>
          <div className="text-label text-muted">
            {list.length} trang: mọi component của Semi trong màu {brand.name}, có ví dụ và API.
          </div>
        </div>
        <Icon name="chevron" className="w-4 h-4 text-muted ml-auto" />
      </Link>

      <Section title="Màu" icon="palette">
        <Swatches label="Màu chính (primary-*)" scale={brand.primary} />
        {brand.secondary && <Swatches label="Màu phụ (secondary-*)" scale={brand.secondary} />}
        <div className="grid gap-3 @xl:grid-cols-2">
          {["dark", "light"].map((t) => (
            <div key={t} data-theme={t} className="rounded-card border border-line bg-panel p-4 space-y-3">
              <div className="text-label font-medium text-muted">{t === "dark" ? "Nền tối" : "Nền sáng"}</div>
              <div className="flex flex-wrap items-center gap-2">
                <Button variant="primary" icon="check">
                  Lưu
                </Button>
                <Button>Huỷ</Button>
                <span className="text-ui text-accent-fg font-medium">Chữ màu chính</span>
              </div>
              <div className="text-caption text-muted tabular-nums">
                nút {brand.themes[t]["color-accent"]}
                {fid[t] ? (fid[t].deltaE === 0 ? " (đúng màu thương hiệu)" : ` (primary-${fid[t].fill}, lệch ΔE ${fid[t].deltaE.toFixed(2)})`) : ""} · chữ trên nút{" "}
                {brand.themes[t]["color-on-accent"]} · chữ màu {brand.themes[t]["color-accent-fg"]}
              </div>
            </div>
          ))}
        </div>
      </Section>

      {g && (
        <Section title="Màn hình mẫu" icon="smartphone">
          <p className="text-label text-muted">
            Một màn hình sản phẩm, sáng và tối cạnh nhau; chữ mẫu lấy từ giọng văn của thương hiệu.
            {brand.styles.allowed.length > 1 ? " Đổi style ở chân menu để so sánh." : ""}
          </p>
          <div className="grid gap-3 @2xl:grid-cols-2">
            <SampleScreen theme="light" />
            <SampleScreen theme="dark" />
          </div>
        </Section>
      )}

      {g?.brief && (
        <Section title="Thương hiệu này cho ai" icon="users">
          <dl className="grid gap-3 @xl:grid-cols-3 text-ui">
            {[["Sản phẩm", g.brief.product], ["Người dùng", g.brief.audience], ["Tính cách", g.brief.personality?.join(", ")]].filter(([, v]) => v).map(([k, v]) => (
              <div key={k} className="space-y-1">
                <dt className="text-label text-muted">{k}</dt>
                <dd className="text-body">{v}</dd>
              </div>
            ))}
          </dl>
        </Section>
      )}

      {g?.logo && (
        <Section title="Logo" icon="image">
          <div className="grid gap-3 @xl:grid-cols-2">
            {["light", "dark"].map((t) => {
              const file = (t === "dark" && g.logo.fullDarkDist ? g.logo.fullDarkDist : g.logo.fullDist).split("/").pop();
              return (
                <div key={t} data-theme={t} className="rounded-card border border-line bg-panel p-6 flex flex-col items-center gap-3">
                  <div className="border border-dashed border-line-hover" style={{ padding: `${g.logo.clearspace * 2.5}rem` }}>
                    <img src={`${BASE}/logo/${file}`} alt={`Logo ${brand.name}`} className="h-10 w-auto" />
                  </div>
                  <div className="text-caption text-muted">Nền {THEME_NAME[t].toLowerCase()} · khung nét đứt = khoảng trống tối thiểu</div>
                </div>
              );
            })}
          </div>
          {g.logo.markDist && (
            <div className="flex items-center gap-4">
              {[16, 24, 32, 48].map((px) => (
                <img key={px} src={`${BASE}/logo/${g.logo.markDist.split("/").pop()}`} alt="" style={{ width: px, height: px }} />
              ))}
              <span className="text-label text-muted">Biểu tượng: favicon, icon app, sidebar thu gọn</span>
            </div>
          )}
          <ul className="list-disc pl-5 text-ui text-body space-y-1">
            <li>Rộng tối thiểu {g.logo.minWidth}px cho bản đầy đủ</li>
            <li>Không kéo méo, xoay, đổi màu, thêm bóng hay viền</li>
          </ul>
        </Section>
      )}

      {g && (
        <Section title="Giọng văn" icon="megaphone">
          <p className="text-ui text-body">
            <strong className="text-contrast font-semibold">{g.voice.toneLabel}.</strong> Gọi người dùng là “{g.voice.address}”, thương hiệu tự xưng “{g.voice.we}”.
            Emoji: {g.voice.emoji ? "có, tiết chế" : "không"}.{g.voice.custom ? "" : " Đây là giọng mặc định: thương hiệu chưa chọn giọng văn."}
          </p>
          <ul className="list-disc pl-5 text-ui text-body space-y-1">
            {g.voice.rules.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
          {(g.voice.do.length > 0 || g.voice.dont.length > 0) && (
            <div className="grid gap-3 @xl:grid-cols-2">
              {[["Nên", g.voice.do, "check", "text-success-fg"], ["Không nên", g.voice.dont, "close", "text-danger-fg"]].map(([label, list, icon, cls]) =>
                list.length ? (
                  <div key={label} className="space-y-1.5">
                    <div className="text-label font-medium text-muted">{label}</div>
                    {list.map((x) => (
                      <div key={x} className="flex gap-2 text-ui text-body">
                        <Icon name={icon} className={`w-4 h-4 mt-0.5 shrink-0 ${cls}`} />
                        {x}
                      </div>
                    ))}
                  </div>
                ) : null,
              )}
            </div>
          )}
          {g.voice.examples.empty && <EmptyState icon="box" title={g.voice.examples.empty} action={<Button variant="primary">{first(g.voice.examples.button, "Bắt đầu")}</Button>} />}
        </Section>
      )}

      {g && (
        <Section title="Cách dùng màu" icon="palette">
          <p className="text-ui text-body">
            <strong className="text-contrast font-semibold">Mức dùng màu chính: {g.color.accentLabel}.</strong> {g.color.accentRule}
          </p>
          {g.color.secondaryRule && <p className="text-ui text-body">Màu phụ chỉ cho {g.color.secondaryRule}.</p>}
          {g.imagery && (
            <p className="text-ui text-body">
              <strong className="text-contrast font-semibold">Hình ảnh:</strong> {g.imagery}
            </p>
          )}
        </Section>
      )}

      <Section title="Chữ" icon="fileText">
        <div className="space-y-1">
          <div className="font-display text-display text-contrast">{brand.name}</div>
          <div className="text-caption text-muted">
            Tiêu đề, số KPI: {font("display")} · Giao diện, nội dung: {font("sans")}
          </div>
        </div>
        <div className="space-y-1.5">
          {[
            ["text-heading", "Tiêu đề trang 22"],
            ["text-title", "Tiêu đề thẻ 15"],
            ["text-ui", "Nội dung giao diện 13: thông tin rõ ràng, ngắn gọn"],
            ["text-label", "Nhãn 12"],
            ["text-caption", "Chú thích 11"],
          ].map(([cls, text]) => (
            <div key={cls} className="flex items-baseline gap-3">
              <code className="w-28 shrink-0 text-caption text-muted">{cls}</code>
              <span className={`${cls} text-body`}>{text}</span>
            </div>
          ))}
        </div>
      </Section>

      <Section title={`Đọc rõ (WCAG AA): ${ok}/${brand.report.length} đạt`} icon="check">
        {brand.warnings.map((w) => (
          <Alert key={w} tone="warning">
            {w}
          </Alert>
        ))}
        <Table>
          <THead>
            <TR>
              <TH>Kiểm tra</TH>
              <TH>Cặp</TH>
              <TH align="right">Tỉ lệ</TH>
              <TH align="right">Cần</TH>
              <TH>Kết quả</TH>
            </TR>
          </THead>
          <TBody>
            {brand.report.map((r) => (
              <TR key={r.check}>
                <TD>{r.check}</TD>
                <TD className="text-muted">{r.pair}</TD>
                <TD align="right" numeric>
                  {r.ratio.toFixed(2)}
                </TD>
                <TD align="right" numeric>
                  {r.min ?? 4.5}
                </TD>
                <TD>
                  <Badge tone={r.ok ? "green" : r.soft ? "amber" : "rose"} dot>
                    {r.ok ? "Đạt" : r.soft ? "Lưu ý" : "Chưa đạt"}
                  </Badge>
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </Section>
    </>
  );
}
