"use client";

// The brand book frame: the Semi docs shell (@semi/ui/site) around every page: Thương hiệu, Ứng dụng, the UI kit and
// every component of Semi in this brand. The theme switch is at the foot of the menu.
import { ThemeSwitcher, ThemeToggle } from "@semi/ui";
import { DocsShell } from "@semi/ui/site";
import brand from "../brand.json";

export default function KitLayout({ children }) {
  return (
    <DocsShell
      productName={brand.name}
      logoIcon="palette"
      mobileTabIds={["home", "apps", "kit", "components"]}
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
            <div className="text-ui text-muted px-1 tabular-nums">
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
