"use client";

import Link from "next/link";
import { useState } from "react";
import { Button, Checkbox, Chip, Item, ItemGroup, PRESSABLE, Switch, Toggle } from "@semi/ui";

// Hover and press (#218): every control shares one hover timing (transition-hover, 150ms) and one press: buttons and
// controls shrink to 98% while pressed (PRESS; none under reduced motion); rows, list items, cards and tiles never
// shrink, they keep their hover fill while pressed (PRESSABLE for an app's own tile). Hover shows on any device with a
// pointer that can hover (any-hover), so an iPad with a trackpad gets it too.
export default function ButtonFeedback() {
  const [chip, setChip] = useState(false);
  const [bold, setBold] = useState(false);
  const [check, setCheck] = useState(true);
  const [on, setOn] = useState(false);
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button>Làm mới</Button>
        <Button variant="outline">Chia sẻ</Button>
        <Button variant="ghost">Xem thêm</Button>
        <Button variant="inverse">Thêm</Button>
        <Button variant="ghost" iconOnly icon="more" aria-label="Thao tác khác" title="Thao tác khác" />
        <Chip active={chip} onClick={() => setChip(!chip)}>
          Đang in
        </Chip>
        <Toggle pressed={bold} onPressedChange={setBold} icon="star" aria-label="Đánh dấu" title="Đánh dấu" />
        <Checkbox checked={check} onChange={setCheck} label="Gửi email" />
        <Switch checked={on} onChange={setOn} label="Tự động" />
      </div>
      <ItemGroup label="Máy in" className="max-w-md">
        <Item icon="printer" title="X1 Carbon 03" description="Hàng: hover fill, không co lại" href="#x1" />
        <Item icon="printer" title="P1S 02" description="Nhấn giữ: cùng màu hover" href="#p1s" />
      </ItemGroup>
      <Link href="#tile" className={`${PRESSABLE} block rounded-card bg-card p-card text-ui text-strong max-w-md`}>
        Ô tuỳ chỉnh của ứng dụng (PRESSABLE)
      </Link>
    </div>
  );
}
