"use client";

import { CardActions, IconTile, Item, toast } from "@semi/ui";

const SUPPLIERS = [
  { id: "s1", name: "Gia vị Tây Nguyên", region: "Đắk Lắk" },
  { id: "s2", name: "Hồ tiêu Chư Sê", region: "Gia Lai" },
  { id: "s3", name: "Quế Trà My", region: "Quảng Nam" },
];

// Hover (or Tab into) a card: Gửi hỏi giá, Ghim and ⋯. On a touch screen only the ⋯ shows, with every action.
export default function CardActionsGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {SUPPLIERS.map((s) => (
        <div key={s.id} className="group relative rounded-card bg-card">
          <Item media={<IconTile name="store" tone="gray" size="md" />} title={s.name} description={s.region} onClick={() => toast({ title: `Mở ${s.name}` })} className="pr-24 rounded-card" />
          <CardActions
            label={`Thao tác với ${s.name}`}
            actions={[
              { icon: "send", label: "Gửi hỏi giá", onClick: () => toast({ title: `Gửi hỏi giá ${s.name}` }) },
              { icon: "pin", label: "Ghim", onClick: () => toast({ title: "Đã ghim" }) },
            ]}
            menu={[
              { label: "Sửa", icon: "edit", onSelect: () => toast({ title: "Sửa" }) },
              { label: "Ngừng hợp tác", icon: "block", danger: true, onSelect: () => toast({ title: "Đã ngừng", tone: "danger" }) },
            ]}
          />
        </div>
      ))}
    </div>
  );
}
