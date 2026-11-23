"use client";

// Applications: the brand on the screens a product actually ships (dashboard, phone app, landing page, email),
// light and dark, with texts from the brand's voice. Copied into a brand kit's .preview/ by semi-brand.
import { Badge, Button, Icon, KpiCard } from "@semi/ui";
import brand from "../../brand.json";
import { BothThemes, first, guide as g, SAMPLE, Section, Wordmark } from "../../parts";

const ex = g?.voice.examples ?? {};
const you = g?.voice.address ?? "bạn";
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const New = () =>
  brand.secondary ? <span className="inline-flex items-center px-2 h-5 rounded-chip text-ui font-medium bg-secondary text-on-secondary">Mới</span> : <Badge tone="green">Mới</Badge>;

function Dashboard({ theme }) {
  const nav = [
    ["home", "Tổng quan"],
    ["receipt", SAMPLE.list],
    ["users", "Khách hàng"],
    ["chart", "Báo cáo"],
    ["settings", "Cài đặt"],
  ];
  const rows = [
    ["#1042", SAMPLE.items[0], "1.250.000 ₫", "Đã giao", "green"],
    ["#1041", SAMPLE.items[1], "480.000 ₫", "Đang giao", "amber"],
    ["#1040", SAMPLE.items[2] ?? SAMPLE.items[0], "2.100.000 ₫", "Đã giao", "green"],
  ];
  return (
    <div className="flex min-h-[340px]">
      <aside className="hidden @lg:flex w-44 shrink-0 flex-col gap-1 border-r border-line bg-app p-3">
        <div className="px-2 pb-3">
          <Wordmark theme={theme} className="h-5" />
        </div>
        {nav.map(([icon, label], i) => (
          <div key={label} className={`flex items-center gap-2 h-8 px-2 rounded-control text-ui ${i === 1 ? "bg-item-selected text-strong font-medium" : "text-body"}`}>
            <Icon name={icon} className="w-4 h-4" />
            {label}
          </div>
        ))}
      </aside>
      <div className="flex-1 min-w-0 p-4 space-y-4">
        <div className="flex items-center gap-3">
          <h3 className="font-display text-section font-semibold text-strong">{SAMPLE.list}</h3>
          <div className="ml-auto">
            <Button variant="primary" icon="plus">
              Tạo đơn
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-2 @lg:grid-cols-4 gap-stack items-start">
          <KpiCard featured label={SAMPLE.metric.label} value={SAMPLE.metric.value} sub={SAMPLE.metric.sub} />
          <KpiCard label="Đơn" value="128" />
          <div className="hidden @lg:block">
            <KpiCard label="Khách mới" value="36" />
          </div>
        </div>
        <div className="rounded-card border border-line bg-panel divide-y divide-divider text-ui">
          {rows.map(([id, name, sum, status, tone], i) => (
            <div key={id} className={`flex items-center gap-2 @md:gap-3 px-4 py-2.5 ${i === 0 ? "bg-item-selected border-l-2 border-l-strong" : ""}`}>
              <span className="hidden @md:inline tabular-nums text-muted w-12 shrink-0">{id}</span>
              <span className="min-w-0 flex-1 text-strong font-medium truncate">{name}</span>
              {i === 0 && (
                <span className="hidden @md:inline-flex shrink-0">
                  <New />
                </span>
              )}
              <span className="shrink-0 tabular-nums text-body whitespace-nowrap">{sum}</span>
              <span className="shrink-0">
                <Badge tone={tone} dot>
                  {status}
                </Badge>
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Phone({ theme }) {
  const tabs = [
    ["home", "Trang chủ"],
    ["search", "Tìm"],
    ["cart", "Giỏ"],
    ["user", "Tôi"],
  ];
  return (
    <div className="p-4 flex justify-center">
      <div className="w-[300px] max-w-full rounded-panel border border-line-hover bg-app overflow-hidden flex flex-col shadow-card">
        <div className="flex items-center justify-between px-4 pt-2 text-ui text-muted tabular-nums">
          <span>9:41</span>
          <Icon name="battery" className="w-4 h-4" />
        </div>
        <div className="flex items-center gap-2 px-4 py-3">
          <Wordmark theme={theme} className="h-5" />
          <Icon name="bell" className="w-5 h-5 text-muted ml-auto" />
        </div>
        <div className="px-4 space-y-3 flex-1">
          <div className="text-lead font-display font-semibold text-strong">Chào {you}!</div>
          <div className="rounded-card p-4 space-y-2 bg-item-selected">
            <div className="text-ui font-semibold text-strong">{g?.brief?.tagline ?? `Ưu đãi tuần này từ ${brand.name}`}</div>
            <div className="text-ui text-body">Giảm 20% cho đơn đầu tiên.</div>
          </div>
          {[
            ["package", SAMPLE.own ? SAMPLE.items[0] : "Đơn #1042", "Đang giao"],
            ["gift", "Quà tặng", "Còn 2 ngày"],
          ].map(([icon, t, s]) => (
            <div key={t} className="flex items-center gap-3 rounded-card border border-line bg-panel p-3">
              <Icon name={icon} className="w-5 h-5 text-strong" />
              <div className="min-w-0">
                <div className="text-ui font-medium text-strong">{t}</div>
                <div className="text-ui text-muted">{s}</div>
              </div>
              <Icon name="chevron" className="w-4 h-4 text-muted ml-auto" />
            </div>
          ))}
          <Button variant="primary" className="w-full justify-center">
            {first(ex.button, "Tiếp tục")}
          </Button>
        </div>
        <nav className="mt-4 grid grid-cols-4 border-t border-line bg-panel">
          {tabs.map(([icon, label], i) => (
            <div key={label} className={`flex flex-col items-center gap-0.5 py-2 text-ui ${i === 0 ? "text-strong font-medium" : "text-muted"}`}>
              <Icon name={icon} className="w-5 h-5" />
              {label}
            </div>
          ))}
        </nav>
      </div>
    </div>
  );
}

function Landing({ theme }) {
  const b = g?.brief ?? {};
  return (
    <div>
      <div className="flex items-center gap-4 px-5 py-3 border-b border-line">
        <Wordmark theme={theme} className="h-5" />
        <span className="hidden @lg:inline text-ui text-body ml-auto">Sản phẩm</span>
        <span className="hidden @lg:inline text-ui text-body">Bảng giá</span>
        <span className="ml-auto @lg:ml-0">
          <Button>{first(ex.button, "Dùng thử")}</Button>
        </span>
      </div>
      <div className="px-5 py-10 grid gap-8 @2xl:grid-cols-2 @2xl:items-center">
        <div className="space-y-4">
          <h3 className="font-display font-title leading-tight max-w-lg text-strong" style={{ fontSize: "clamp(28px, 4.5vw, 44px)" }}>
            {b.tagline ?? `${brand.name} giúp ${you} làm nhiều hơn với ít công sức hơn`}
          </h3>
          <p className="text-lead leading-relaxed max-w-md text-body">{b.product ?? "Một sản phẩm gọn gàng, dễ dùng cho mọi người."}</p>
          <Button variant="primary">{first(ex.button, "Bắt đầu")}</Button>
        </div>
        {/* Proof, not three feature cards: one real figure, large, on the brand tint. */}
        <div className="rounded-panel min-h-56 flex flex-col justify-center gap-2 p-6 bg-item-selected">
          <div className="font-figure font-title tabular-nums leading-none text-strong" style={{ fontSize: "clamp(40px, 7vw, 72px)" }}>
            {SAMPLE.proof.value}
          </div>
          <div className="text-lead text-body">{SAMPLE.proof.label}</div>
        </div>
      </div>
      <figure className="px-5 py-8 border-t border-line grid gap-2 @2xl:grid-cols-[1fr_3fr] @2xl:items-baseline">
        <figcaption className="text-ui text-muted">{b.audience ?? "Khách hàng"}</figcaption>
        <blockquote className="font-display font-title text-section text-strong leading-snug">
          “Lần đầu dùng mà không phải hỏi ai. {cap(you)} thử là biết.”
        </blockquote>
      </figure>
    </div>
  );
}

function Email({ theme }) {
  return (
    <div className="p-4 bg-app">
      <div className="max-w-md mx-auto rounded-card border border-line bg-panel overflow-hidden">
        <div className="px-6 pt-6">
          <Wordmark theme={theme} className="h-6" />
        </div>
        <div className="px-6 py-5 space-y-3">
          <h3 className="font-display text-section font-semibold text-strong">Đơn hàng đã được xác nhận</h3>
          <p className="text-ui text-body leading-relaxed">
            {cap(you)} ơi, {g?.voice.we ?? brand.name} đã nhận đơn #1042 và sẽ giao trong 2 ngày. Theo dõi đơn bất cứ lúc nào trong ứng dụng.
          </p>
          <Button variant="primary">Xem đơn hàng</Button>
        </div>
        <div className="px-6 py-4 border-t border-divider text-ui text-muted leading-relaxed">
          {brand.name} · Email này gửi tới {you} vì {you} đã đặt hàng. Không muốn nhận nữa? <span className="text-strong underline">Huỷ đăng ký</span>
        </div>
      </div>
    </div>
  );
}

// Each product of a brand picks its own density and type scale (the brand does not): the sample screens show the
// usual pick for their kind of product, so one brand reads the same in a dense tool and a roomy landing page.
const LOOK_LABEL = { compact: "mật độ gọn", regular: "mật độ vừa", airy: "mật độ thoáng", even: "cỡ chữ đều", contrast: "cỡ chữ tương phản" };
const SCREENS = [
  ["Dashboard", "chart", "Công cụ làm việc cả ngày trên máy tính: một con số dẫn đầu, màu chính chỉ ở nút chính, mục đang chọn và link.", Dashboard, true, ["compact", "even"]],
  ["Ứng dụng điện thoại", "smartphone", "Màn hình nhỏ, dùng nhanh: một nút chính, thanh tab dưới.", Phone, false, ["regular", "even"]],
  ["Trang giới thiệu", "megaphone", `Tiêu đề bằng font hiển thị, một lời kêu gọi chính, bằng chứng thật (con số, lời khách hàng) thay cho ba thẻ tính năng.`, Landing, true, ["airy", "contrast"]],
  ["Email", "send", "Email giao dịch: logo, một nút, chân trang nhỏ.", Email, false, ["regular", "even"]],
];

export default function Applications() {
  return (
    <>
      <div className="space-y-2">
        <h1 className="font-display text-tab-xl font-title text-strong">Ứng dụng</h1>
        <p className="text-lead text-body max-w-3xl leading-relaxed">
          {brand.name} trên những màn hình một sản phẩm thật sẽ có, sáng và tối cạnh nhau. Chữ mẫu theo giọng văn của thương hiệu. Mật độ và cỡ chữ là lựa chọn của từng sản phẩm, không phải
          của thương hiệu: mỗi màn dưới đây dùng lựa chọn thường gặp cho loại sản phẩm đó (chọn khi tạo app bằng /semi-new-app).
        </p>
      </div>
      {SCREENS.map(([title, icon, lead, Screen, wide, [density, scale]]) => (
        <Section key={title} title={title} icon={icon} lead={`${lead} Sản phẩm này: ${LOOK_LABEL[density]}, ${LOOK_LABEL[scale]}.`} card={false}>
          <BothThemes wide={wide}>
            {(t) => (
              <div className="@container" data-density={density === "regular" ? undefined : density} data-type-scale={scale === "even" ? undefined : scale}>
                <Screen theme={t} />
              </div>
            )}
          </BothThemes>
        </Section>
      ))}
    </>
  );
}
