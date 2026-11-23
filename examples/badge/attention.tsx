import { Button, CountBadge, NewTag } from "@semi/ui";

export default function BadgeAttention() {
  return (
    <div className="flex flex-wrap items-center gap-4">
      <Button variant="ghost" iconOnly icon="bell" aria-label="Thông báo, 3 chưa đọc" badge={3} />
      <Button variant="ghost" iconOnly icon="mail" aria-label="Hộp thư, hơn 99 chưa đọc" badge={240} />
      <span className="inline-flex items-center gap-2 text-ui text-body">
        Chờ duyệt <CountBadge count={5} />
      </span>
      <span className="inline-flex items-center gap-2 text-ui text-body">
        Tất cả <CountBadge count={128} tone="neutral" max={999} />
      </span>
      <span className="inline-flex items-center gap-2 text-ui text-strong">
        Báo cáo tồn kho <NewTag />
      </span>
    </div>
  );
}
