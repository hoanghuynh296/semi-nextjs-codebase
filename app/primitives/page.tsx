"use client";

import React, { useState } from "react";
import { StorybookShell } from "../StorybookShell";
import { ShowcaseSection, DemoLabel } from "../Showcase";
import { PageTitle } from "../../src/PageTitle";
import { Button, Spinner } from "../../src/Button";
import { Field, Input, Textarea } from "../../src/Field";
import { Checkbox, Switch, RadioGroup } from "../../src/Choice";
import { Tabs } from "../../src/Tabs";
import { Tooltip, Menu } from "../../src/Overlay";
import { toast, ToastHost } from "../../src/Toast";
import { Alert, Avatar, EmptyState, Progress } from "../../src/Feedback";
import { Table, TBody, TD, TH, THead, TR } from "../../src/Table";
import { Drawer } from "../../src/Drawer";
import { CustomSelect } from "../../src/CustomSelect";
import { NumberInput } from "../../src/NumberInput";
import { Badge } from "../../src/Badge";
import { SemiLocaleProvider, en, useSemiLocale } from "../../src/locale";
import { FIELD_INPUT } from "../../styles/surfaces";

const ORDERS = [
  { id: "SO-1042", customer: "Nguyễn An", status: "paid", total: 1_250_000 },
  { id: "SO-1043", customer: "Trần Bình", status: "pending", total: 480_000 },
  { id: "SO-1044", customer: "Lê Chi", status: "refunded", total: 2_100_000 },
] as const;
const STATUS = { paid: ["emerald", "Đã thanh toán"], pending: ["amber", "Chờ xử lý"], refunded: ["rose", "Hoàn tiền"] } as const;

function LocaleProbe() {
  const t = useSemiLocale();
  return (
    <span className="text-label text-muted">
      close = <span className="text-contrast">{t.close}</span> · search = <span className="text-contrast">{t.search}</span>
    </span>
  );
}

export default function PrimitivesPage() {
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [note, setNote] = useState("");
  const [qty, setQty] = useState("2");
  const [material, setMaterial] = useState("pla");
  const [agree, setAgree] = useState(true);
  const [some, setSome] = useState(false);
  const [notify, setNotify] = useState(true);
  const [plan, setPlan] = useState<"free" | "pro" | "team">("pro");
  const [tab, setTab] = useState<"overview" | "activity" | "settings">("overview");
  const [seg, setSeg] = useState<"day" | "week" | "month">("week");
  const [drawer, setDrawer] = useState(false);
  const [alertOpen, setAlertOpen] = useState(true);
  const nameError = name.length > 0 && name.length < 3 ? "Tên cần ít nhất 3 ký tự." : undefined;

  const save = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast({ title: "Đã lưu thay đổi", tone: "success", action: { label: "Hoàn tác", onClick: () => toast({ title: "Đã hoàn tác" }) } });
    }, 900);
  };

  return (
    <StorybookShell>
      <ToastHost />
      <div className="space-y-3 pb-2 border-b border-line/60">
        <PageTitle title="Primitives & Forms" />
        <p className="text-ui text-muted max-w-3xl leading-relaxed">
          Các primitive dùng chung của <code className="text-accent-fg">@semi/ui</code>: đạt AA ở cả hai theme, có focus ring khi dùng bàn phím,
          ARIA đầy đủ và chuỗi giao diện lấy từ <code className="text-accent-fg">SemiLocaleProvider</code>.
        </p>
      </div>

      <ShowcaseSection id="button" title="Button & Spinner" icon="zap" meta="variant · size · icon · loading">
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="primary" icon="check" loading={loading} onClick={save}>
            Lưu
          </Button>
          <Button icon="refresh">Làm mới</Button>
          <Button variant="danger" icon="trash">
            Xoá
          </Button>
          <Button variant="ghost">Xem thêm</Button>
          <Button variant="primary" iconOnly icon="plus" aria-label="Thêm mới" />
          <Button size="sm" icon="edit">
            Sửa
          </Button>
          <Button disabled>Không khả dụng</Button>
          <Spinner label="Đang đồng bộ" />
        </div>
        <div className="flex flex-wrap gap-2 max-w-md">
          <Button size="modal" className="flex-1">
            Huỷ
          </Button>
          <Button size="modal" variant="primary" className="flex-1">
            Xác nhận (modal size)
          </Button>
        </div>
      </ShowcaseSection>

      <ShowcaseSection id="field" title="Field · Input · Textarea" icon="edit" meta="label · hint · error · required">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Tên máy in" hint="Hiện trên thẻ và trong thông báo." error={nameError} required>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="VD: X1 Carbon xưởng A" icon="printer" />
          </Field>
          <Field label="Vật liệu">
            <CustomSelect
              variant="field"
              value={material}
              onChange={setMaterial}
              options={[
                { value: "pla", label: "PLA" },
                { value: "petg", label: "PETG" },
                { value: "abs", label: "ABS" },
              ]}
            />
          </Field>
          <Field label="Số lượng" hint="Bàn phím số trên màn hình cảm ứng.">
            <NumberInput className={FIELD_INPUT} value={qty} onChange={(e) => setQty(e.target.value)} integer />
          </Field>
          <Field label="Ghi chú">
            <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ghi chú cho đơn in…" />
          </Field>
        </div>
      </ShowcaseSection>

      <ShowcaseSection id="choice" title="Checkbox · Switch · RadioGroup" icon="check" meta="native semantics · focus ring">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex flex-col gap-3">
            <Checkbox checked={agree} onChange={setAgree} label="Tự động in khi rảnh" description="Máy nhận job tiếp theo trong hàng đợi." />
            <Checkbox checked={false} indeterminate={!some} onChange={setSome} label="Chọn tất cả (indeterminate)" />
            <Checkbox checked={false} onChange={() => undefined} label="Không khả dụng" disabled />
          </div>
          <div className="flex flex-col gap-3">
            <Switch checked={notify} onChange={setNotify} label="Thông báo khi in xong" description="Gửi qua ứng dụng và email." />
            <Switch checked={!notify} onChange={(v) => setNotify(!v)} size="sm" label="Chế độ im lặng (sm)" />
          </div>
          <RadioGroup
            label="Gói dịch vụ"
            value={plan}
            onChange={setPlan}
            options={[
              { value: "free", label: "Free", description: "1 máy in" },
              { value: "pro", label: "Pro", description: "Tối đa 10 máy" },
              { value: "team", label: "Team", description: "Không giới hạn", disabled: true },
            ]}
          />
        </div>
      </ShowcaseSection>

      <ShowcaseSection id="tabs" title="Tabs" icon="layers" meta="←/→ Home End · underline · segmented">
        <Tabs
          label="Chi tiết máy in"
          value={tab}
          onChange={setTab}
          items={[
            { key: "overview", label: "Tổng quan", icon: "gauge", content: <p className="text-ui text-body">Nhiệt độ, tiến độ và camera.</p> },
            { key: "activity", label: "Hoạt động", count: 12, content: <p className="text-ui text-body">12 sự kiện trong 24 giờ qua.</p> },
            { key: "settings", label: "Cài đặt", icon: "settings", content: <p className="text-ui text-body">Tên, nhóm và quyền truy cập.</p> },
          ]}
        />
        <Tabs
          variant="segmented"
          label="Khoảng thời gian"
          value={seg}
          onChange={setSeg}
          items={[
            { key: "day", label: "Ngày" },
            { key: "week", label: "Tuần" },
            { key: "month", label: "Tháng" },
          ]}
        />
      </ShowcaseSection>

      <ShowcaseSection id="overlay" title="Tooltip · Menu · Drawer · Toast" icon="sliders" meta="portal · focus trap · Escape">
        <div className="flex flex-wrap items-center gap-3">
          <Tooltip content="Đồng bộ lại dữ liệu">
            <Button iconOnly icon="refresh" aria-label="Làm mới" />
          </Tooltip>
          <Menu
            items={[
              { label: "Đổi tên", icon: "edit", onSelect: () => toast({ title: "Đổi tên" }) },
              { label: "Nhân bản", icon: "copy", onSelect: () => toast({ title: "Đã nhân bản", tone: "success" }) },
              { label: "Tạm dừng", icon: "pause", onSelect: () => undefined, disabled: true },
              { label: "Xoá", icon: "trash", danger: true, separator: true, onSelect: () => toast({ title: "Không xoá được", description: "Máy đang in.", tone: "danger" }) },
            ]}
          />
          <Button onClick={() => setDrawer(true)} icon="sidebar">
            Mở drawer
          </Button>
          <Button onClick={() => toast({ title: "Mất kết nối máy in", description: "Thử lại sau vài giây.", tone: "warning" })}>Toast cảnh báo</Button>
          <Button onClick={() => toast({ title: "Tệp sẽ được gửi khi máy rảnh", tone: "info", duration: 0 })}>Toast không tự tắt</Button>
        </div>
        <Drawer
          open={drawer}
          onClose={() => setDrawer(false)}
          title="Bộ lọc"
          footer={
            <>
              <Button size="modal" onClick={() => setDrawer(false)}>
                Huỷ
              </Button>
              <Button size="modal" variant="primary" onClick={() => setDrawer(false)}>
                Áp dụng
              </Button>
            </>
          }
        >
          <Field label="Từ khoá">
            <Input placeholder="Tên, mã đơn…" icon="search" />
          </Field>
          <Checkbox checked={agree} onChange={setAgree} label="Chỉ máy đang online" />
        </Drawer>
      </ShowcaseSection>

      <ShowcaseSection id="alert" title="Alert · Progress" icon="info" meta="status tokens: *-bg · *-border · *-fg · *-solid">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Alert tone="info" title="Bản cập nhật mới">
            Firmware 1.08 đã sẵn sàng cho 3 máy.
          </Alert>
          <Alert tone="success" title="Đã kết nối">
            Máy X1 Carbon đang online.
          </Alert>
          <Alert tone="warning" title="Sắp hết nhựa" action={<Button size="sm">Đặt thêm</Button>}>
            Cuộn PLA đen còn khoảng 80 g.
          </Alert>
          {alertOpen && (
            <Alert tone="danger" title="In thất bại" onDismiss={() => setAlertOpen(false)}>
              Đầu phun bị tắc ở lớp 132.
            </Alert>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Progress label="Tiến độ in" value={64} showValue />
          <Progress label="Dung lượng" value={92} tone="danger" showValue />
          <Progress label="Đang xử lý (indeterminate)" />
          <Progress value={30} tone="success" size="sm" label="Đã tải" />
        </div>
      </ShowcaseSection>

      <ShowcaseSection id="table" title="Table · Avatar · Badge" icon="grid" meta="dense rows · tabular-nums">
        <div className="rounded-xl border border-line overflow-hidden">
          <Table>
            <THead>
              <TR>
                <TH>Mã đơn</TH>
                <TH>Khách hàng</TH>
                <TH>Trạng thái</TH>
                <TH align="right">Tổng</TH>
              </TR>
            </THead>
            <TBody>
              {ORDERS.map((o) => (
                <TR key={o.id} onClick={() => toast({ title: o.id })}>
                  <TD className="font-medium text-contrast">{o.id}</TD>
                  <TD>
                    <span className="inline-flex items-center gap-2">
                      <Avatar name={o.customer} size="sm" />
                      {o.customer}
                    </span>
                  </TD>
                  <TD>
                    <Badge tone={STATUS[o.status][0]} dot>
                      {STATUS[o.status][1]}
                    </Badge>
                  </TD>
                  <TD numeric>{o.total.toLocaleString("vi-VN")} ₫</TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </div>
        <div className="flex items-center gap-2">
          <Avatar name="Hoàng Huỳnh" size="lg" />
          <Avatar name="Semi Team" />
          <Avatar name="Lan" size="sm" />
        </div>
      </ShowcaseSection>

      <ShowcaseSection id="empty" title="EmptyState" icon="box">
        <EmptyState
          icon="printer"
          title="Chưa có máy in nào"
          description="Thêm máy in đầu tiên để bắt đầu theo dõi tiến độ và nhiệt độ."
          action={
            <Button variant="primary" icon="plus">
              Thêm máy in
            </Button>
          }
        />
      </ShowcaseSection>

      <ShowcaseSection id="locale" title="Locale (SemiLocaleProvider)" icon="sliders" meta="vi mặc định · en · ghi đè từng chuỗi">
        <div className="space-y-2">
          <DemoLabel>Mặc định (vi)</DemoLabel>
          <LocaleProbe />
          <DemoLabel>{"<SemiLocaleProvider locale={en}>"}</DemoLabel>
          <SemiLocaleProvider locale={en}>
            <div className="flex flex-wrap items-center gap-3">
              <LocaleProbe />
              <Menu items={[{ label: "Rename", icon: "edit", onSelect: () => undefined }]} />
            </div>
          </SemiLocaleProvider>
        </div>
      </ShowcaseSection>
    </StorybookShell>
  );
}
