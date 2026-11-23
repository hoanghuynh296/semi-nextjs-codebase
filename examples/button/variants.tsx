import { Button } from "@semi/ui";

const VARIANTS = ["subtle", "surface", "inverse", "outline", "ghost", "primary", "secondary", "danger"] as const;
const LABEL = { subtle: "Làm mới", surface: "Mời", inverse: "Thêm", outline: "Chia sẻ", ghost: "Xem thêm", primary: "Lưu", secondary: "Gửi", danger: "Xoá" };

export default function ButtonVariants() {
  return (
    // A specimen shows both brand fills on purpose: data-density-skip keeps it out of the one-brand-button budget.
    <div data-density-skip className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        {VARIANTS.map((v) => (
          <Button key={v} variant={v}>
            {LABEL[v]}
          </Button>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {VARIANTS.map((v) => (
          <Button key={v} variant={v} disabled>
            {LABEL[v]}
          </Button>
        ))}
      </div>
    </div>
  );
}
