"use client";

import { useState } from "react";
import {
  AppShell,
  Button,
  Card,
  PageTitle,
  TextTabs,
  Tooltip,
  type ShellNavItem,
  type ShellNavSection,
} from "@semi/ui";

// The whole 1.0 shell in one screen: main action, groups, sub-items, a mega menu, a pinned group, the bottom row of
// tools, and the route header with an action and the account avatar menu (theme, account, sign-out). A real app renders AppShell in layout.tsx and gives page items an
// `href` (shell-nav-href); this demo keeps everything on one page with onSelect so it can run anywhere.
const SECTIONS: ShellNavSection[] = [
  {
    items: [
      { id: "inbox", label: "Hộp thư", icon: "inbox", right: <span className="px-1 text-chrome text-muted tabular-nums">3</span> },
      {
        id: "orders",
        label: "Đơn hàng",
        icon: "bag",
        href: "#orders",
        children: [
          { id: "orders-open", label: "Đang xử lý" },
          { id: "orders-done", label: "Đã giao" },
        ],
      },
      {
        id: "catalog",
        label: "Sản phẩm",
        icon: "box",
        mega: {
          columns: [
            {
              title: "Danh mục",
              items: [
                { id: "printers", label: "Máy in", icon: "printer", href: "#", hint: "Máy in 3D và phụ kiện" },
                { id: "filament", label: "Nhựa in", icon: "layers", href: "#", hint: "PLA, PETG, TPU" },
              ],
            },
            {
              title: "Bán hàng",
              items: [
                { id: "prices", label: "Bảng giá", icon: "tag", href: "#" },
                { id: "bundles", label: "Combo", icon: "package", href: "#", isNew: true },
              ],
            },
          ],
          seeAll: { href: "#" },
        },
      },
      { id: "suppliers", label: "Nhà cung cấp", icon: "truck" },
      { id: "customers", label: "Khách hàng", icon: "users" },
    ],
  },
];

const PINNED = {
  label: "Đã ghim",
  items: [
    { id: "pin-late", label: "Đơn trễ hạn", icon: "clock" },
    { id: "pin-vip", label: "Khách VIP", icon: "star" },
  ] satisfies ShellNavItem[],
};

const PRICE = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" });

const TABS = [
  { key: "open", label: "Đang xử lý" },
  { key: "done", label: "Đã giao" },
  { key: "all", label: "Tất cả" },
] as const;

/** A header action with its own state: a slot is rendered as a component, so it may hold state and call hooks. */
function StarAction() {
  const [on, setOn] = useState(false);
  return (
    <Tooltip content={on ? "Bỏ ghim trang" : "Ghim trang"}>
      <Button variant="ghost" iconOnly icon="star" aria-label="Ghim trang" aria-pressed={on} onClick={() => setOn(!on)} className="!w-8 !h-8" />
    </Tooltip>
  );
}

export default function FullShell() {
  const [active, setActive] = useState("orders-open");
  const [tab, setTab] = useState<(typeof TABS)[number]["key"]>("open");

  return (
    <AppShell
      productName="Sales Hub"
      logoIcon="bag"
      sections={SECTIONS}
      activeId={active}
      onSelect={setActive}
      mainAction={{
        label: "Tạo mới",
        items: [
          // not available on this plan: shown, but disabled (the phone drawer focuses the first enabled row)
          { label: "Báo giá", icon: "fileText", disabled: true, onSelect: () => {} },
          { label: "Đơn hàng", icon: "bag", onSelect: () => setActive("orders-open") },
          { label: "Khách hàng", icon: "users", onSelect: () => setActive("customers") },
          { label: "Sản phẩm", icon: "box", onSelect: () => {} },
          { label: "Phiếu nhập", icon: "receipt", onSelect: () => {} },
        ],
      }}
      pinned={PINNED}
      tools={[
        { id: "notifications", label: "Thông báo", icon: "bell", count: 12, onClick: () => {} },
        { id: "help", label: "Trợ giúp", icon: "info", onClick: () => {} },
      ]}
      toolsMenu={[
        { label: "Cài đặt", icon: "settings", onSelect: () => {} },
        { label: "Phím tắt", icon: "layers", onSelect: () => {} },
      ]}
      header={{
        actions: <StarAction />,
        account: {
          name: "Lan Phạm",
          detail: "Cửa hàng Quận 1",
          items: [{ label: "Tài khoản", icon: "user", onSelect: () => {} }],
          onSignOut: () => {},
        },
      }}
    >
      <PageTitle
        title="Đơn hàng"
        actions={
          <Button variant="primary" icon="plus">
            Tạo đơn
          </Button>
        }
      />
      <TextTabs label="Đơn hàng" items={[...TABS]} value={tab} onChange={setTab}>
        <div className="@container">
        <div className="grid gap-group @2xl:grid-cols-2 @5xl:grid-cols-3">
          {["DH-1042", "DH-1041", "DH-1039", "DH-1037", "DH-1036", "DH-1033"].map((id, i) => (
            <Card key={id} className="flex flex-col gap-stack">
              <div className="flex items-center justify-between gap-3 min-w-0">
                <span className="text-ui font-semibold text-strong truncate">{id}</span>
                <span className="text-ui text-muted tabular-nums shrink-0">{PRICE.format((i + 2) * 450_000)}</span>
              </div>
              <p className="text-ui text-body truncate">{["Bambu Lab A1 mini", "PLA Basic 1kg × 4", "Combo AMS Lite", "PETG HF 1kg × 2", "Bàn in PEI", "TPU 95A 1kg"][i]}</p>
            </Card>
          ))}
        </div>
        </div>
      </TextTabs>
    </AppShell>
  );
}
