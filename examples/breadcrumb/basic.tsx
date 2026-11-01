import { Breadcrumb } from "@semi/ui";

export default function BreadcrumbBasic() {
  return (
    <Breadcrumb
      items={[
        { label: "Kho", href: "/inventory", icon: "box" },
        { label: "Vật liệu", href: "/inventory/materials" },
        { label: "PLA đen 1kg" },
      ]}
    />
  );
}
