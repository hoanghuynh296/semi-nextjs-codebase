"use client";

import { useRef, useState } from "react";
import { Button, MegaMenu } from "@semi/ui";

export default function MegaMenuFlyout() {
  const [open, setOpen] = useState(false);
  const anchor = useRef<HTMLDivElement>(null);
  return (
    <div ref={anchor} className="inline-flex">
      <Button icon="box" aria-haspopup="dialog" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
        Sản phẩm
      </Button>
      <MegaMenu
        open={open}
        onClose={() => setOpen(false)}
        anchorRef={anchor}
        placement="bottom"
        label="Sản phẩm"
        columns={[
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
        ]}
        seeAll={{ href: "#" }}
      />
    </div>
  );
}
