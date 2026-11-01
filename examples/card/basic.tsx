import { Badge, Card } from "@semi/ui";

export default function CardBasic() {
  return (
    <Card className="p-4 space-y-2 max-w-sm">
      <div className="flex items-center justify-between gap-2">
        <span className="text-ui font-semibold text-contrast">X1 Carbon · Xưởng A</span>
        <Badge tone="emerald" dot>
          Online
        </Badge>
      </div>
      <p className="text-label text-muted">Đang in: vỏ hộp điều khiển · còn 42 phút</p>
    </Card>
  );
}
