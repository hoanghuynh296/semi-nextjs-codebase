import { Avatar, Badge, HoverCard } from "@semi/ui";

export default function HoverCardUser() {
  return (
    <p className="text-ui text-body">
      Đơn được duyệt bởi{" "}
      <HoverCard
        trigger={
          <a href="#minh-anh" className="font-medium text-accent-fg underline-offset-2 hover:underline">
            Minh Anh
          </a>
        }
      >
        <div className="flex items-start gap-3">
          <Avatar name="Minh Anh" />
          <div className="space-y-1">
            <div className="text-ui font-semibold text-contrast">Minh Anh</div>
            <div className="text-label text-muted">Quản lý xưởng · Khu A</div>
            <Badge tone="emerald" dot size="sm">
              Đang trực
            </Badge>
          </div>
        </div>
      </HoverCard>
      .
    </p>
  );
}
