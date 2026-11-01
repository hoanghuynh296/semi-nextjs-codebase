"use client";

// Applications: the brand on the screens a product actually ships (dashboard, phone app, landing page, email),
// light and dark, with texts from the brand's voice. Copied into a brand kit's .preview/ by semi-brand.
import { Badge, Button, Icon, KpiCard } from "@semi/ui";
import { CARD } from "@semi/ui/styles";
import brand from "../../brand.json";
import { BothThemes, first, guide as g, Section, Wordmark } from "../../parts";

const ex = g?.voice.examples ?? {};
const you = g?.voice.address ?? "bạn";
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const expressive = g?.color.accent === "expressive";
const New = () =>
  brand.secondary ? <span className="inline-flex items-center px-2 h-5 rounded-chip text-caption font-medium bg-secondary-solid text-on-secondary">Mới</span> : <Badge tone="green">Mới</Badge>;

function Dashboard({ theme }) {
  const nav = [
    ["home", "Tổng quan"],
    ["receipt", "Đơn hàng"],
    ["users", "Khách hàng"],
    ["chart", "Báo cáo"],
    ["settings", "Cài đặt"],
  ];
  const rows = [
    ["#1042", "Nguyễn An", "1.250.000 ₫", "Đã giao", "green"],
    ["#1041", "Trần Bình", "480.000 ₫", "Đang giao", "amber"],
    ["#1040", "Lê Chi", "2.100.000 ₫", "Đã giao", "green"],
  ];
  return (
    <div className="flex min-h-[340px]">
      <aside className="hidden @lg:flex w-44 shrink-0 flex-col gap-1 border-r border-line bg-app p-3">
        <div className="px-2 pb-3">
          <Wordmark theme={theme} className="h-5" />
        </div>
        {nav.map(([icon, label], i) => (
          <div key={label} className={`flex items-center gap-2 h-8 px-2 rounded-control text-ui ${i === 1 ? "bg-accent-subtle text-accent-fg font-medium" : "text-body"}`}>
            <Icon name={icon} className="w-4 h-4" />
            {label}
          </div>
        ))}
      </aside>
      <div className="flex-1 min-w-0 p-4 space-y-4">
        <div className="flex items-center gap-3">
          <h3 className="font-display text-heading-sm font-semibold text-contrast">Đơn hàng</h3>
          <div className="ml-auto">
            <Button variant="primary" icon="plus">
              Tạo đơn
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-2 @lg:grid-cols-3 gap-2">
          <KpiCard label="Hôm nay" value="128" icon="receipt" iconTone="green" />
          <KpiCard label="Doanh thu" value="12,4 tr" icon="wallet" iconTone="green" />
          <div className="hidden @lg:block">
            <KpiCard label="Khách mới" value="36" icon="users" iconTone="green" />
          </div>
        </div>
        <div className="rounded-card border border-line bg-panel divide-y divide-divider text-ui">
          {rows.map(([id, name, sum, status, tone], i) => (
            <div key={id} className={`flex items-center gap-3 px-3 py-2 ${i === 0 ? "bg-accent-subtle border-l-2 border-l-accent-fg" : ""}`}>
              <span className="tabular-nums text-muted w-12">{id}</span>
              <span className="text-contrast font-medium truncate">{name}</span>
              {i === 0 && <New />}
              <span className="ml-auto tabular-nums text-body">{sum}</span>
              <Badge tone={tone} dot>
                {status}
              </Badge>
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
        <div className="flex items-center justify-between px-4 pt-2 text-caption text-muted tabular-nums">
          <span>9:41</span>
          <Icon name="battery" className="w-4 h-4" />
        </div>
        <div className="flex items-center gap-2 px-4 py-3">
          <Wordmark theme={theme} className="h-5" />
          <Icon name="bell" className="w-5 h-5 text-muted ml-auto" />
        </div>
        <div className="px-4 space-y-3 flex-1">
          <div className="text-title-lg font-display font-semibold text-contrast">Chào {you}!</div>
          <div className={`rounded-card p-4 space-y-2 ${expressive ? "bg-accent text-on-accent" : "bg-accent-subtle"}`}>
            <div className={`text-ui font-semibold ${expressive ? "" : "text-contrast"}`}>{g?.brief?.tagline ?? `Ưu đãi tuần này từ ${brand.name}`}</div>
            <div className={`text-label ${expressive ? "" : "text-body"}`}>Giảm 20% cho đơn đầu tiên.</div>
          </div>
          {[
            ["package", "Đơn #1042", "Đang giao"],
            ["gift", "Quà tặng", "Còn 2 ngày"],
          ].map(([icon, t, s]) => (
            <div key={t} className="flex items-center gap-3 rounded-card border border-line bg-panel p-3">
              <Icon name={icon} className="w-5 h-5 text-accent-fg" />
              <div className="min-w-0">
                <div className="text-ui font-medium text-contrast">{t}</div>
                <div className="text-label text-muted">{s}</div>
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
            <div key={label} className={`flex flex-col items-center gap-0.5 py-2 text-caption ${i === 0 ? "text-accent-fg font-medium" : "text-muted"}`}>
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
  const features = [
    ["zap", "Nhanh", "Xong việc trong vài chạm, không cần hướng dẫn."],
    ["shield", "An toàn", "Dữ liệu được bảo vệ và sao lưu mỗi ngày."],
    ["heart", "Tận tâm", `Đội ngũ ${brand.name} luôn sẵn sàng hỗ trợ ${you}.`],
  ];
  return (
    <div>
      <div className="flex items-center gap-4 px-5 py-3 border-b border-line">
        <Wordmark theme={theme} className="h-5" />
        <span className="hidden @lg:inline text-ui text-body ml-auto">Tính năng</span>
        <span className="hidden @lg:inline text-ui text-body">Bảng giá</span>
        <span className="ml-auto @lg:ml-0">
          <Button variant="primary">Dùng thử</Button>
        </span>
      </div>
      <div className={`px-5 py-10 space-y-4 ${expressive ? "bg-accent text-on-accent" : ""}`}>
        <h3 className={`font-display font-semibold leading-tight max-w-lg ${expressive ? "" : "text-contrast"}`} style={{ fontSize: "clamp(26px, 4vw, 38px)" }}>
          {b.tagline ?? `${brand.name} giúp ${you} làm nhiều hơn với ít công sức hơn`}
        </h3>
        <p className={`text-ui-lg leading-relaxed max-w-md ${expressive ? "" : "text-body"}`}>{b.product ?? "Một sản phẩm gọn gàng, dễ dùng cho mọi người."}</p>
        <div className="flex flex-wrap gap-2">
          {expressive ? (
            <Button>{first(ex.button, "Bắt đầu miễn phí")}</Button>
          ) : (
            <>
              <Button variant="primary">{first(ex.button, "Bắt đầu miễn phí")}</Button>
              <Button>Xem demo</Button>
            </>
          )}
        </div>
      </div>
      <div className="grid gap-3 @lg:grid-cols-3 px-5 pb-6 pt-2">
        {features.map(([icon, t, d]) => (
          <div key={t} className={`${CARD} p-4 space-y-1.5`}>
            <Icon name={icon} className="w-5 h-5 text-accent-fg" />
            <div className="text-title font-semibold text-contrast">{t}</div>
            <div className="text-label text-body leading-relaxed">{d}</div>
          </div>
        ))}
      </div>
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
          <h3 className="font-display text-heading-sm font-semibold text-contrast">Đơn hàng đã được xác nhận</h3>
          <p className="text-ui text-body leading-relaxed">
            {cap(you)} ơi, {g?.voice.we ?? brand.name} đã nhận đơn #1042 và sẽ giao trong 2 ngày. Theo dõi đơn bất cứ lúc nào trong ứng dụng.
          </p>
          <Button variant="primary">Xem đơn hàng</Button>
        </div>
        <div className="px-6 py-4 border-t border-divider text-caption text-muted leading-relaxed">
          {brand.name} · Email này gửi tới {you} vì {you} đã đặt hàng. Không muốn nhận nữa? <span className="text-accent-fg underline">Huỷ đăng ký</span>
        </div>
      </div>
    </div>
  );
}

const SCREENS = [
  ["Dashboard", "chart", "Công cụ làm việc cả ngày trên máy tính: màu chính chỉ ở nút chính, mục đang chọn và link.", Dashboard, true],
  ["Ứng dụng điện thoại", "smartphone", "Màn hình nhỏ, dùng nhanh: một nút chính, thanh tab dưới.", Phone, false],
  ["Trang giới thiệu", "megaphone", expressive ? "Mức dùng màu phóng khoáng: hero nền màu chính." : "Tiêu đề bằng font hiển thị, một lời kêu gọi chính.", Landing, true],
  ["Email", "send", "Email giao dịch: logo, một nút, chân trang nhỏ.", Email, false],
];

export default function Applications() {
  return (
    <>
      <div className="space-y-2">
        <h1 className="font-display text-display font-semibold text-contrast">Ứng dụng</h1>
        <p className="text-ui-lg text-body max-w-3xl leading-relaxed">
          {brand.name} trên những màn hình một sản phẩm thật sẽ có, sáng và tối cạnh nhau. Chữ mẫu theo giọng văn của thương hiệu
          {brand.styles.allowed.length > 1 ? "; đổi style ở thanh trên để so sánh" : ""}.
        </p>
      </div>
      {SCREENS.map(([title, icon, lead, Screen, wide]) => (
        <Section key={title} title={title} icon={icon} lead={lead} card={false}>
          <BothThemes wide={wide}>{(t) => <div className="@container"><Screen theme={t} /></div>}</BothThemes>
        </Section>
      ))}
    </>
  );
}
