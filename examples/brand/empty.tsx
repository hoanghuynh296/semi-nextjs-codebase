import { BrandPattern, Button } from "@semi/ui";

export default function BrandEmpty() {
  return (
    <div className="relative overflow-hidden rounded-card border-card bg-panel px-6 py-12">
      <BrandPattern tone="muted" className="hidden @xl:block" />
      <div className="relative max-w-sm space-y-3">
        <h3 className="font-display font-title text-heading-sm text-contrast">Chưa có đơn nào hôm nay</h3>
        <p className="text-ui text-body">Đơn mới hiện ở đây ngay khi khách đặt. Chia sẻ thực đơn để có đơn đầu tiên.</p>
        <Button variant="primary">Chia sẻ thực đơn</Button>
      </div>
    </div>
  );
}
