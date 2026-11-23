"use client";

// UI kit (for developers): the brand fills (main buttons) with the text on them and their hover, the type scale, the contrast report and the files to download. Every component of Semi in these colours is
// one click away (/components/). The brand book pages (/, /apps/) share the same frame. Copied into a brand kit's .preview/ by semi-brand.
import Link from "next/link";
import { Alert, Badge, Button, Icon, PageTitle, Table, TBody, TD, TH, THead, TR } from "@semi/ui";
import { CARD_HOVER } from "@semi/ui/styles";
import list from "@semi/ui/examples/list.json";
import brand from "../../brand.json";
import { BASE, guide, Section } from "../../parts";

/** One brand fill: the colour, its hover and the text on it, with the contrast of each pair. */
function Fill({ label, name, f }) {
  const ratio = (check) => brand.report.find((x) => x.check === check)?.ratio.toFixed(2);
  return (
    <div className="space-y-1.5 text-ui text-muted tabular-nums">
      <div className="font-medium">{label}</div>
      {[
        ["Nền", f.fill, `chữ trên nút ${name}`],
        ["Hover", f.hover, `chữ trên nút ${name} khi hover`],
      ].map(([k, hex, check]) => (
        <div key={k} className="flex items-center gap-2">
          <span className="h-3.5 w-3.5 rounded-control border border-line shrink-0" style={{ background: hex }} />
          <span>
            {k} {hex} · chữ {f.on}
            {ratio(check) ? ` · ${ratio(check)}:1` : ""}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function UiKit() {
  const font = (role) => (brand.fonts.find((f) => f.roles.includes(role)) ?? brand.fonts.find((f) => f.roles.includes("sans")))?.family;
  const ok = brand.report.filter((r) => r.ok).length;
  return (
    <>
      <div className="space-y-3">
        <PageTitle title="UI kit" />
        <p className="text-lead text-body max-w-3xl leading-relaxed">
          {brand.name} trên Semi Design System, cho developer: màu của nút chính, chữ trên nó, cỡ chữ, bảng tương phản và file để tải.
          Mọi sản phẩm cài <code className="text-strong">{brand.package}</code> dùng đúng những giá trị này. Đổi sáng / tối ở chân menu.
        </p>
      </div>

      <Link href="/components/" className={`${CARD_HOVER} p-4 flex items-center gap-3 outline-none focus-visible:ring-2 focus-visible:ring-focus`}>
        <Icon name="grid" className="w-5 h-5 text-strong" />
        <div className="min-w-0">
          <div className="text-lead font-semibold text-strong">Tất cả component</div>
          <div className="text-ui text-muted">
            {list.length} trang: mọi component của Semi trong màu {brand.name}, có ví dụ và API.
          </div>
        </div>
        <Icon name="chevron" className="w-4 h-4 text-muted ml-auto" />
      </Link>

      <Section title="Màu của nút chính" icon="palette">
        <div className="grid gap-3 @xl:grid-cols-2">
          <Fill label="Màu chính (bg-primary + text-on-primary)" name="màu chính" f={brand.primary} />
          {brand.secondary && <Fill label="Màu phụ (bg-secondary + text-on-secondary)" name="màu phụ" f={brand.secondary} />}
        </div>
        <div className="grid gap-3 @xl:grid-cols-2">
          {["dark", "light"].map((t) => (
            <div key={t} data-theme={t} className="rounded-card border border-line bg-panel p-4 space-y-3">
              <div className="text-ui font-medium text-muted">{t === "dark" ? "Nền tối" : "Nền sáng"}</div>
              <div className="flex flex-wrap items-center gap-2">
                <Button variant="primary" icon="check">
                  Lưu
                </Button>
                <Button>Huỷ</Button>
              </div>
            </div>
          ))}
        </div>
        <p className="text-ui text-muted">
          Cùng một màu ở cả hai theme. Màu thương hiệu chỉ cho nút chính, badge cần chú ý, nhãn “Mới” và gạch chân tab lớn; mặt nền, chữ, mục đang chọn và focus là màu trung tính của Semi.
        </p>
      </Section>

      <Section title="Cỡ chữ" icon="fileText">
        <div className="space-y-1" data-density-skip="type scale specimen">
          <div className="font-display text-tab-xl text-strong">{brand.name}</div>
          <div className="text-ui text-muted">
            Hero, tiêu đề trang đọc, tab lớn: {font("display")} · Giao diện, nội dung: {font("sans")}
          </div>
        </div>
        <div className="space-y-1.5" data-density-skip="type scale specimen">
          {[
            ["text-section", "Tiêu đề mục 20"],
            ["text-lead", "Tiêu đề thẻ 15"],
            ["text-copy", "Nội dung đọc 14: thông tin rõ ràng, ngắn gọn"],
            ["text-ui", "Giao diện 12: nhãn, nút, dòng danh sách"],
            ["text-tag", "Nhãn nhỏ 10"],
          ].map(([cls, text]) => (
            <div key={cls} className="flex items-baseline gap-3">
              <code className="w-28 shrink-0 text-ui text-muted">{cls}</code>
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
          Trong một sản phẩm Next.js: <code className="text-strong">/semi-new-app --brand {brand.package}</code> (hoặc <code className="text-strong">/semi-sync</code> khi
          kit có bản mới). Agent tra luật của thương hiệu bằng <code className="text-strong">npx semi brand</code> hoặc tool <code className="text-strong">semi_brand</code>.
        </p>
        <div className="flex flex-wrap gap-2">
          {[
            ["brand.css", `${BASE}/kit/brand.css`],
            ["brand.json", `${BASE}/kit/brand.json`],
            ...["fullDist", "fullDarkDist", "markDist"].filter((k) => guide?.logo?.[k]).map((k) => [guide.logo[k].split("/").pop(), `${BASE}/logo/${guide.logo[k].split("/").pop()}`]),
          ].map(([label, href]) => (
            <a key={href} href={href} download className={`${CARD_HOVER} px-3 h-9 inline-flex items-center gap-2 text-ui font-medium text-body outline-none focus-visible:ring-2 focus-visible:ring-focus`}>
              <Icon name="download" className="w-4 h-4 text-strong" />
              {label}
            </a>
          ))}
        </div>
      </Section>
    </>
  );
}
