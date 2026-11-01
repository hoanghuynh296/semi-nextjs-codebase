import { Badge } from "@semi/ui";

export default function BadgeTones() {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Badge tone="emerald" dot>
        Hoàn thành
      </Badge>
      <Badge tone="amber" dot>
        Đang xử lý
      </Badge>
      <Badge tone="rose" dot>
        Thất bại
      </Badge>
      <Badge tone="sky" icon="server">
        Đồng bộ
      </Badge>
      <Badge tone="purple" icon="sparkles">
        Pro
      </Badge>
      <Badge tone="gray" size="sm">
        Nháp
      </Badge>
    </div>
  );
}
