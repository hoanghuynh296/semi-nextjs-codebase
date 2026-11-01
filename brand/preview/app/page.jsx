"use client";

// Brand overview: the brand's colours, type and contrast report, rendered with @semi/ui itself. Every component of
// Semi in these colours is one click away (/components/). Copied into a brand kit's .preview/ by semi-brand.
import Link from "next/link";
import { Alert, Badge, Button, Icon, PageTitle, Table, TBody, TD, TH, THead, TR } from "@semi/ui";
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

export default function BrandOverview() {
  const font = (role) => brand.fonts.find((f) => f.roles.includes(role))?.family;
  const ok = brand.report.filter((r) => r.ok).length;
  const fid = brand.fidelity ?? {};
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
