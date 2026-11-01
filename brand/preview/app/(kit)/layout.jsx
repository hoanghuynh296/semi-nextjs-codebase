"use client";

// UI kit frame: the Semi docs shell (@semi/ui/site) with every component of Semi in this brand, for developers.
// The brand book pages ((brand)/) have their own top bar.
import { ThemeSwitcher, ThemeToggle } from "@semi/ui";
import { DocsShell } from "@semi/ui/site";
import brand from "../brand.json";
import { StyleSwitch } from "../parts";

export default function KitLayout({ children }) {
  return (
    <DocsShell
      productName={brand.name}
      logoIcon="palette"
      mobileTabIds={["home", "kit", "components"]}
      sections={[
        {
          label: "Brand book",
          items: [
            { id: "home", label: "Thương hiệu", shortLabel: "Brand", icon: "palette", href: "/" },
            { id: "apps", label: "Ứng dụng", shortLabel: "Ứng dụng", icon: "smartphone", href: "/apps/" },
          ],
        },
        {
          label: "Cho developer",
          items: [
            { id: "kit", label: "UI kit", shortLabel: "Kit", icon: "sliders", href: "/kit/" },
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
