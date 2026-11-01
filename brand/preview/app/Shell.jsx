"use client";

// The brand preview frame: the Semi docs shell (@semi/ui/site) with this brand's own pages first.
import { useEffect, useState } from "react";
import { Pills, ThemeSwitcher, ThemeToggle } from "@semi/ui";
import { DocsShell } from "@semi/ui/site";
import styleList from "@semi/ui/styles.json";
import brand from "./brand.json";

const styleName = (id) => styleList.styles.find((s) => s.id === id)?.name ?? id;

/** Switch between the styles this brand allows (stored, applied before paint by the layout script). */
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

export function Shell({ children }) {
  return (
    <DocsShell
      productName={brand.name}
      logoIcon="palette"
      mobileTabIds={["home", "components"]}
      sections={[
        {
          label: "Thương hiệu",
          items: [
            { id: "home", label: "Tổng quan", shortLabel: "Brand", icon: "palette", href: "/" },
            { id: "components", label: "Tất cả component", shortLabel: "UI", icon: "grid", href: "/components/" },
          ],
        },
      ]}
      footer={({ collapsed }) =>
        collapsed ? (
          <div className="flex justify-center">
            <ThemeToggle />
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <ThemeSwitcher fullWidth />
            <StyleSwitch />
            <div className="text-caption text-muted px-1 tabular-nums">
              {brand.package} · @semi/ui {brand.semiVersion}
            </div>
          </div>
        )
      }
    >
      {children}
    </DocsShell>
  );
}
