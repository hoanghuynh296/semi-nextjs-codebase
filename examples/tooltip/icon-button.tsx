import { Button, Tooltip } from "@semi/ui";

export default function TooltipIconButton() {
  return (
    <div className="flex gap-2">
      <Tooltip content="Đồng bộ lại dữ liệu">
        <Button iconOnly icon="refresh" aria-label="Làm mới" />
      </Tooltip>
      <Tooltip content="Tải báo cáo" side="bottom">
        <Button iconOnly icon="download" aria-label="Tải báo cáo" />
      </Tooltip>
    </div>
  );
}
