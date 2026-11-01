import { Icon, IconTile } from "@semi/ui";

export default function IconBasic() {
  return (
    <div className="flex flex-wrap items-center gap-4">
      <Icon name="printer" className="w-5 h-5 text-body" />
      <Icon name="trash" className="w-5 h-5 text-danger-fg" title="Xoá" />
      <Icon name="refresh" className="w-5 h-5 text-accent-fg" />
      <IconTile name="box" tone="green" />
      <IconTile name="camera" tone="sky" size="lg" />
    </div>
  );
}
