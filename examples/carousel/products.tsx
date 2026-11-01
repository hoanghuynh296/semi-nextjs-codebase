import { AspectRatio, Card, Carousel } from "@semi/ui";

const ITEMS = ["Giá đỡ điện thoại", "Hộp đựng tai nghe", "Móc khoá logo", "Chậu cây mini", "Kệ sách nhỏ"];

export default function CarouselProducts() {
  return (
    <Carousel label="Sản phẩm nổi bật" perView={3}>
      {ITEMS.map((name, i) => (
        <Card key={name} className="p-3 space-y-2">
          <AspectRatio ratio={4 / 3} className="rounded-control bg-field">
            <div className="flex h-full items-center justify-center text-display font-semibold text-muted">{i + 1}</div>
          </AspectRatio>
          <div className="text-ui font-medium text-contrast">{name}</div>
          <div className="text-label text-muted tabular-nums">{(89 + i * 30).toLocaleString("vi-VN")}k ₫</div>
        </Card>
      ))}
    </Carousel>
  );
}
