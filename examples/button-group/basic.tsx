import { Button, ButtonGroup } from "@semi/ui";

export default function ButtonGroupBasic() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <ButtonGroup label="Điều hướng ngày">
        <Button iconOnly icon="back" aria-label="Ngày trước" />
        <Button>Hôm nay</Button>
        <Button iconOnly icon="chevron" aria-label="Ngày sau" />
      </ButtonGroup>
      <ButtonGroup label="Thu phóng">
        <Button iconOnly icon="minus" aria-label="Thu nhỏ" />
        <Button className="tabular-nums">100%</Button>
        <Button iconOnly icon="plus" aria-label="Phóng to" />
      </ButtonGroup>
    </div>
  );
}
