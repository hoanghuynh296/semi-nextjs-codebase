"use client";

// UI kit (for developers): the brand's scales, the button and text shades per theme with their distance from the brand
// colour, the type scale, the contrast report and the files to download. Every component of Semi in these colours is
// one click away (/components/). The brand book pages (/, /apps/) share the same frame. Copied into a brand kit's .preview/ by semi-brand.
import Link from "next/link";
import { Alert, Badge, Button, Icon, PageTitle, Table, TBody, TD, TH, THead, TR } from "@semi/ui";
import { CARD_HOVER } from "@semi/ui/styles";
import list from "@semi/ui/examples/list.json";
import brand from "../../brand.json";
import { BASE, guide, Section } from "../../parts";

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

export default function UiKit() {
  const font = (role) => brand.fonts.find((f) => f.roles.includes(role))?.family;
  const ok = brand.report.filter((r) => r.ok).length;
  const fid = brand.fidelity ?? {};
  return (
    <>
      <div className="space-y-3">
        <PageTitle title="UI kit" />
        <p className="text-ui-lg text-body max-w-3xl leading-relaxed">
          {brand.name} trên Semi Design System, cho developer: thang màu, sắc của nút và chữ ở từng theme, cỡ chữ, bảng tương phản và file để tải.
          Mọi sản phẩm cài <code className="text-accent-fg">{brand.package}</code> dùng đúng những giá trị này. Đổi sáng / tối{brand.styles.allowed.length > 1 ? " và style" : ""} ở chân menu.
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

      <Section title="Thang màu và sắc theo theme" icon="palette">
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

      <Section title="Cỡ chữ" icon="fileText">
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
      <Section title="Tải về và cài đặt" icon="download">
        <p className="text-ui text-body">
          Trong một sản phẩm Next.js: <code className="text-accent-fg">/semi-new-app --brand {brand.package}</code> (hoặc <code className="text-accent-fg">/semi-sync</code> khi
          kit có bản mới). Agent tra luật của thương hiệu bằng <code className="text-accent-fg">npx semi brand</code> hoặc tool <code className="text-accent-fg">semi_brand</code>.
        </p>
        <div className="flex flex-wrap gap-2">
          {[
            ["brand.css", `${BASE}/kit/brand.css`],
            ["brand.json", `${BASE}/kit/brand.json`],
            ...["fullDist", "fullDarkDist", "markDist"].filter((k) => guide?.logo?.[k]).map((k) => [guide.logo[k].split("/").pop(), `${BASE}/logo/${guide.logo[k].split("/").pop()}`]),
          ].map(([label, href]) => (
            <a key={href} href={href} download className={`${CARD_HOVER} px-3 h-9 inline-flex items-center gap-2 text-ui font-medium text-body outline-none focus-visible:ring-2 focus-visible:ring-focus`}>
              <Icon name="download" className="w-4 h-4 text-accent-fg" />
              {label}
            </a>
          ))}
        </div>
      </Section>
    </>
  );
}
