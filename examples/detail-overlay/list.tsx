"use client";

import { Badge, Button, DetailOverlay, Item, ItemGroup, Menu, SplitButton, toast, useDetailParam } from "@semi/ui";

const ORDERS = Array.from({ length: 12 }, (_, i) => ({
  id: `DH-${1040 + i}`,
  customer: ["Cửa hàng Minh An", "Nhà sách Phú Lợi", "Quán Bếp Nhà"][i % 3],
  total: (i + 3) * 185000,
  paid: i % 4 !== 0,
  // a long title: cut to one line (3 in a narrow dialog), the chevron beside it shows it in full
  note:
    i === 6
      ? "giao gấp trước Tết cho chuỗi 12 cửa hàng tại Thủ Đức và Bình Thạnh, kèm hoá đơn VAT, biên bản bàn giao từng điểm và ảnh chụp kiện hàng khi nhận"
      : null,
}));
const vnd = (n: number) => `${n.toLocaleString("vi-VN")} ₫`;

// Click a row: the order opens over the list with ?item= in the URL. ‹ › (or ← →) go through the list, Back or Esc
// closes it and the list is where it was. Reload with ?item=DH-1045 to open it from a link.
export default function DetailOverlayList() {
  const { openId, open, show, close } = useDetailParam("item");
  const index = ORDERS.findIndex((o) => o.id === openId);
  const order = index >= 0 ? ORDERS[index] : null;
  return (
    <>
      <ItemGroup label="Đơn hàng">
        {ORDERS.map((o) => (
          <Item key={o.id} title={o.customer} description={o.id} meta={vnd(o.total)} onClick={() => open(o.id)} />
        ))}
      </ItemGroup>
      <DetailOverlay
        open={order !== null}
        onClose={close}
        title={order ? `Đơn ${order.id}${order.note ? ` — ${order.note}` : ""}` : ""}
        subtitle={order?.customer}
        index={index}
        total={ORDERS.length}
        onPrev={index > 0 ? () => show(ORDERS[index - 1].id) : undefined}
        onNext={index >= 0 && index < ORDERS.length - 1 ? () => show(ORDERS[index + 1].id) : undefined}
        onCopyLink={() => (navigator.clipboard?.writeText(window.location.href), toast({ title: "Đã sao chép liên kết" }))}
        side={
          order && (
            <>
              <SplitButton
                label="Giao hàng"
                icon="truck"
                onClick={() => toast({ title: `Giao ${order.id}` })}
                menuLabel="Cách giao khác"
                collapseOnPhone={false}
                items={[
                  { label: "Hẹn ngày giao", icon: "calendar", onSelect: () => toast({ title: "Hẹn ngày" }) },
                  { label: "Khách tự lấy", icon: "store", onSelect: () => toast({ title: "Khách tự lấy" }) },
                ]}
              />
              <div className="flex items-center gap-2">
                <Button iconOnly icon="printer" aria-label="In đơn" />
                <Button iconOnly icon="copy" aria-label="Nhân bản" />
                <Menu
                  label={`Thao tác khác với ${order.id}`}
                  items={[
                    { label: "Sửa đơn", icon: "edit", onSelect: () => undefined },
                    { label: "Huỷ đơn", icon: "close", danger: true, onSelect: () => toast({ title: "Đã huỷ", tone: "danger" }) },
                  ]}
                />
              </div>
              <dl className="grid grid-cols-2 gap-3">
                <div>
                  <dt className="text-ui text-muted">Tổng tiền</dt>
                  <dd className="text-ui text-strong tabular-nums">{vnd(order.total)}</dd>
                </div>
                <div>
                  <dt className="text-ui text-muted">Thanh toán</dt>
                  <dd>
                    <Badge tone={order.paid ? "emerald" : "amber"} dot size="sm">
                      {order.paid ? "Đã trả" : "Chưa trả"}
                    </Badge>
                  </dd>
                </div>
              </dl>
            </>
          )
        }
      >
        {order && (
          <section className="flex flex-col gap-2">
            <h3 className="text-ui font-medium text-strong">Sản phẩm</h3>
            <p className="text-ui text-body">3 mặt hàng · giao trong 2 ngày.</p>
          </section>
        )}
      </DetailOverlay>
    </>
  );
}
