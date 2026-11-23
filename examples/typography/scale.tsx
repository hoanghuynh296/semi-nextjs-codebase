export default function TypographyScale() {
  // A type specimen shows every size on purpose: data-density-skip keeps it out of the type-mix budget.
  return (
    <div data-density-skip className="space-y-1.5">
      <div className="font-display text-tab-xl text-strong">Tab lớn 28</div>
      <div className="text-section text-strong">Tiêu đề mục 20</div>
      <div className="text-figure text-strong">Tiêu đề trang trong thẻ 18</div>
      <div className="text-lead text-strong font-medium">Tiêu đề thẻ 15</div>
      <div className="text-copy text-body">Nội dung dài 14</div>
      <div className="text-ui text-body">Giao diện 12</div>
      <div className="text-ui text-faint">Nhãn nhóm 12</div>
      <div className="text-tag text-muted">Thẻ 10</div>
    </div>
  );
}
