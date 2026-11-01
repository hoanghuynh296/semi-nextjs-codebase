import { Button, ButtonGroup, Menu } from "@semi/ui";

export default function ButtonGroupBasic() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <ButtonGroup label="Điều hướng ngày">
        <Button iconOnly icon="back" aria-label="Ngày trước" />
        <Button>Hôm nay</Button>
        <Button iconOnly icon="chevron" aria-label="Ngày sau" />
      </ButtonGroup>
      <ButtonGroup label="Lưu">
        <Button variant="primary" icon="check">
          Lưu
        </Button>
        <Menu
          label="Tuỳ chọn lưu"
          items={[
            { label: "Lưu bản nháp", icon: "fileText", onSelect: () => undefined },
            { label: "Lưu và in", icon: "printer", onSelect: () => undefined },
          ]}
        />
      </ButtonGroup>
    </div>
  );
}
