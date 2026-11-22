import { Button } from "@semi/ui";

// Round icon buttons: over media, in an overlay header, beside a carousel. shape="round" keeps the variant's fill,
// the focus ring, the title and the size; only the corner changes.
export default function ButtonRound() {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button iconOnly shape="round" icon="close" aria-label="Đóng" />
      <Button iconOnly shape="round" icon="copy" aria-label="Sao chép liên kết" />
      <Button iconOnly shape="round" variant="ghost" icon="more" aria-label="Thao tác khác" />
      <Button iconOnly shape="round" variant="primary" icon="plus" aria-label="Tạo mới" />
    </div>
  );
}
