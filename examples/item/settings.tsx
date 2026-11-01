import { Badge, IconTile, Item, ItemGroup, Switch } from "@semi/ui";

export default function ItemSettings() {
  return (
    <ItemGroup label="Cài đặt máy in" showLabel className="max-w-lg">
      <Item media={<IconTile name="printer" tone="green" size="sm" />} title="X1 Carbon 03" description="Xưởng A · Online" meta={<Badge tone="emerald" dot size="sm">Online</Badge>} href="#printer" />
      <Item icon="bell" title="Thông báo" description="Khi in xong hoặc gặp lỗi" actions={<Switch checked onChange={() => undefined} label={<span className="sr-only">Thông báo</span>} />} />
      <Item icon="fileText" title="Nhật ký in" description="Lưu 30 ngày" meta="2,4 GB" />
    </ItemGroup>
  );
}
