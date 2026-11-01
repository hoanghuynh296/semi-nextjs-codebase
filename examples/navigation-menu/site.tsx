import { NavigationMenu } from "@semi/ui";

export default function NavigationMenuSite() {
  return (
    <div className="flex items-center justify-between rounded-card border border-line bg-panel px-3 py-2">
      <span className="text-ui font-semibold text-contrast">3D Noobs</span>
      <NavigationMenu
        label="Điều hướng chính"
        current="/pricing"
        items={[
          {
            label: "Sản phẩm",
            links: [
              { label: "In theo yêu cầu", href: "/print", description: "Gửi file, nhận bản in trong 48 giờ", icon: "printer" },
              { label: "Vật liệu", href: "/materials", description: "PLA, PETG, TPU và nhựa kỹ thuật", icon: "box" },
              { label: "Studio", href: "/studio", description: "Thiết kế và lát cắt ngay trên web", icon: "sparkles" },
            ],
          },
          { label: "Bảng giá", href: "/pricing" },
          { label: "Liên hệ", href: "/contact" },
        ]}
      />
    </div>
  );
}
