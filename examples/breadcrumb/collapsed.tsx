import { Breadcrumb } from "@semi/ui";

export default function BreadcrumbCollapsed() {
  return (
    <Breadcrumb
      maxItems={3}
      items={[
        { label: "Xưởng", href: "/" },
        { label: "Khu A", href: "/a" },
        { label: "Dãy 2", href: "/a/2" },
        { label: "Máy in", href: "/a/2/printers" },
        { label: "X1 Carbon 03" },
      ]}
    />
  );
}
