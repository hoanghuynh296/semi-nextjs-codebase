import { BrandFigure, BrandPattern, Button } from "@semi/ui";

export default function BrandHero() {
  return (
    <section className="rounded-panel border-card bg-panel">
      <div className="grid gap-8 p-6 @2xl:grid-cols-[3fr_2fr] @2xl:items-center @2xl:p-10">
        <div className="space-y-4">
          <h2 className="font-display font-title text-heading-lg @2xl:text-display leading-tight text-contrast">Bữa trưa văn phòng, đặt trong 30 giây</h2>
          <p className="text-ui-lg text-body max-w-md">Chọn món từ 40 bếp quanh toà nhà, giao đúng giờ nghỉ trưa.</p>
          <Button variant="primary">Đặt món</Button>
        </div>
        <div className="relative overflow-hidden rounded-card bg-accent-subtle min-h-48 flex items-end p-4">
          <BrandPattern area="full" />
          <div className="relative rounded-card bg-panel border-card p-4">
            <BrandFigure size="xl" value="12 phút" label="Thời gian giao trung bình" sub="Tháng 10, 3.200 đơn" />
          </div>
        </div>
      </div>
    </section>
  );
}
