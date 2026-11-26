import { Button, Icon, SectionHeader } from "@semi/ui";

export default function SectionHeaderBasic() {
  return (
    <SectionHeader
      title="Mẫu in nổi bật"
      description="Được cộng đồng tải nhiều nhất tuần này."
      actions={
        <Button variant="ghost">
          Xem tất cả <Icon name="chevron" className="w-3.5 h-3.5" />
        </Button>
      }
    />
  );
}
