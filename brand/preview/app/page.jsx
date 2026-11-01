"use client";

// Brand preview: the brand's colours, type, components and contrast report, rendered with @semi/ui itself.
// Copied into a brand kit's .preview/ by semi-brand; brand.json / brand.css / fonts.js are generated next to it.
import { useEffect, useState } from "react";
import {
  Alert,
  AppShell,
  Avatar,
  Badge,
  Button,
  Card,
  Checkbox,
  Chip,
  CustomSelect,
  EmptyState,
  Field,
  Icon,
  Input,
  KpiCard,
  PageTitle,
  Pills,
  Progress,
  RadioGroup,
  SubpageToolbar,
  Switch,
  Table,
  TBody,
  TD,
  TH,
  THead,
  ThemeSwitcher,
  TR,
  Tabs,
  Textarea,
  toast,
} from "@semi/ui";
import { CARD, SECTION_HEAD, SECTION_TITLE } from "@semi/ui/styles";
import styleList from "@semi/ui/styles.json";
import brand from "./brand.json";

const SECTIONS = [
  { id: "colours", label: "Màu", icon: "palette" },
  { id: "type", label: "Chữ", icon: "fileText" },
  { id: "controls", label: "Nút & form", icon: "sliders" },
  { id: "components", label: "Thành phần", icon: "grid" },
  { id: "contrast", label: "Đọc rõ", icon: "check" },
];
const styleName = (id) => styleList.styles.find((s) => s.id === id)?.name ?? id;

function Section({ id, title, icon, children }) {
  return (
    <section id={id} className="space-y-3 scroll-mt-6">
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

function StyleSwitch() {
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

export default function BrandPreview() {
  const [filter, setFilter] = useState("all");
  const [q, setQ] = useState("");
  const [plan, setPlan] = useState("pro");
  const [notify, setNotify] = useState(true);
  const [agree, setAgree] = useState(false);
  const [region, setRegion] = useState("vn");
  const [tab, setTab] = useState("overview");
  const font = (role) => brand.fonts.find((f) => f.roles.includes(role))?.family;
  const ok = brand.report.filter((r) => r.ok).length;

  return (
    <AppShell
      productName={brand.name}
      logoIcon="palette"
      sections={[{ label: "Brand preview", items: SECTIONS.map((s) => ({ ...s, href: `#${s.id}` })) }]}
      activeId="colours"
      footer={({ collapsed }) =>
        collapsed ? null : (
          <div className="flex flex-col gap-2">
            <ThemeSwitcher fullWidth />
            <div className="text-caption text-muted px-1 tabular-nums">
              {brand.package} · @semi/ui {brand.semiVersion}
            </div>
          </div>
        )
      }
    >
      <div className="w-full min-w-0 space-y-8">
        <div className="space-y-3">
          <PageTitle title={brand.name} />
          <p className="text-ui text-muted max-w-3xl leading-relaxed">
            Bộ nhận diện của {brand.name} trên Semi Design System. Mọi sản phẩm cài <code className="text-accent-fg">{brand.package}</code> và trông như
            trang này. Đổi sáng / tối ở chân menu{brand.styles.allowed.length > 1 ? ", đổi style ở dưới" : ""}.
          </p>
          <StyleSwitch />
        </div>

        <Section id="colours" title="Màu" icon="palette">
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
                  <Button variant="secondary">Huỷ</Button>
                  <span className="text-ui text-accent-fg font-medium">Chữ màu chính</span>
                </div>
                <div className="text-caption text-muted tabular-nums">
                  nút {brand.themes[t]["color-accent"]} · chữ trên nút {brand.themes[t]["color-on-accent"]} · chữ màu {brand.themes[t]["color-accent-fg"]}
                </div>
              </div>
            ))}
          </div>
        </Section>

        <Section id="type" title="Chữ" icon="fileText">
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

        <Section id="controls" title="Nút & form" icon="sliders">
          <SubpageToolbar
            left={
              <Pills
                value={filter}
                onChange={setFilter}
                options={[
                  { key: "all", label: "Tất cả" },
                  { key: "active", label: "Đang chạy" },
                  { key: "done", label: "Xong" },
                ]}
              />
            }
            onPrimaryAction={() => toast({ title: "Đã thêm", tone: "success" })}
            primaryActionLabel="Thêm"
            searchValue={q}
            onSearchChange={setQ}
            onRefresh={() => toast({ title: "Đã làm mới", tone: "info" })}
          />
          <div className="flex flex-wrap gap-2">
            <Button variant="primary" icon="plus">
              Tạo mới
            </Button>
            <Button variant="secondary" icon="edit">
              Sửa
            </Button>
            <Button variant="ghost">Xem thêm</Button>
            <Button variant="danger" icon="trash">
              Xoá
            </Button>
            <Button variant="primary" loading>
              Đang lưu
            </Button>
          </div>
          <div className="grid gap-4 @xl:grid-cols-2">
            <Field label="Tên dự án" hint="Hiển thị trên trang chủ">
              <Input placeholder="vd. Xưởng in Quận 7" />
            </Field>
            <Field label="Khu vực">
              <CustomSelect
                variant="field"
                value={region}
                onChange={setRegion}
                options={[
                  { value: "vn", label: "Việt Nam" },
                  { value: "sg", label: "Singapore" },
                ]}
              />
            </Field>
            <Field label="Ghi chú">
              <Textarea rows={3} placeholder="Mô tả ngắn" />
            </Field>
            <div className="space-y-3">
              <RadioGroup
                label="Gói"
                value={plan}
                onChange={setPlan}
                options={[
                  { value: "free", label: "Miễn phí" },
                  { value: "pro", label: "Pro", description: "Không giới hạn dự án" },
                ]}
              />
              <Switch checked={notify} onChange={setNotify} label="Nhận thông báo" />
              <Checkbox checked={agree} onChange={setAgree} label="Đồng ý điều khoản" />
            </div>
          </div>
        </Section>

        <Section id="components" title="Thành phần" icon="grid">
          <div className="grid gap-3 grid-cols-2 @3xl:grid-cols-4">
            <KpiCard label="Đơn hôm nay" value="148" sub="+12% so với hôm qua" icon="bag" iconTone="green" />
            <KpiCard label="Máy đang chạy" value="12/14" icon="activity" iconTone="sky" />
            <KpiCard label="Tồn kho" value="86" icon="package" iconTone="amber" />
            <KpiCard label="Lỗi" value="2" tone="danger" icon="alert" iconTone="rose" />
          </div>
          <div className="grid gap-3 @xl:grid-cols-2">
            <Card interactive className="p-4 space-y-2">
              <div className="flex items-center gap-2">
                <Avatar name="Minh Anh" />
                <div className="min-w-0">
                  <div className="text-ui font-semibold text-contrast">Minh Anh</div>
                  <div className="text-caption text-muted">Quản lý xưởng</div>
                </div>
                <Badge tone="green" dot className="ml-auto">
                  Online
                </Badge>
              </div>
              <Progress value={68} label="Tiến độ in" showValue />
            </Card>
            <Card className="p-4">
              <Tabs
                value={tab}
                onChange={setTab}
                items={[
                  { key: "overview", label: "Tổng quan", content: <p className="text-ui text-body">Mọi thứ đang chạy bình thường.</p> },
                  { key: "history", label: "Lịch sử", count: 3, content: <p className="text-ui text-body">3 thay đổi gần đây.</p> },
                ]}
              />
            </Card>
          </div>
          <div className="flex flex-wrap gap-2">
            <Chip active>Tất cả</Chip>
            <Chip>PLA</Chip>
            <Chip tone="sky">PETG</Chip>
            <Badge tone="amber">Chờ duyệt</Badge>
            <Badge tone="rose">Lỗi</Badge>
            <Badge tone="sky">Mới</Badge>
          </div>
          <div className="space-y-2">
            <Alert tone="success" title="Đã lưu">
              Thay đổi đã được áp dụng cho mọi máy.
            </Alert>
            <Alert tone="warning" title="Sắp hết vật tư">
              Còn 2 cuộn PLA trắng.
            </Alert>
          </div>
          <Table>
            <THead>
              <TR>
                <TH>Đơn</TH>
                <TH>Khách</TH>
                <TH align="right">Giá trị</TH>
                <TH>Trạng thái</TH>
              </TR>
            </THead>
            <TBody>
              {[
                ["#1024", "Lan Phạm", "1.250.000", "green", "Đã giao"],
                ["#1025", "Quốc Bảo", "820.000", "amber", "Đang in"],
                ["#1026", "Thu Hà", "2.400.000", "sky", "Mới"],
              ].map(([id, name, total, tone, status]) => (
                <TR key={id}>
                  <TD>{id}</TD>
                  <TD>{name}</TD>
                  <TD align="right" numeric>
                    {total}
                  </TD>
                  <TD>
                    <Badge tone={tone} dot>
                      {status}
                    </Badge>
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
          <EmptyState icon="box" title="Chưa có đơn nào" description="Đơn mới sẽ hiện ở đây." />
        </Section>

        <Section id="contrast" title={`Đọc rõ (WCAG AA): ${ok}/${brand.report.length} đạt`} icon="check">
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
                  <TD>
                    <Badge tone={r.ok ? "green" : "rose"} dot>
                      {r.ok ? "Đạt" : "Chưa đạt"}
                    </Badge>
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </Section>
      </div>
    </AppShell>
  );
}
