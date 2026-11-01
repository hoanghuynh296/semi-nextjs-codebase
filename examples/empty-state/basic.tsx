import { Button, EmptyState } from "@semi/ui";

export default function EmptyStateBasic() {
  return (
    <EmptyState
      icon="printer"
      title="Chưa có máy in nào"
      description="Thêm máy in đầu tiên để theo dõi tiến độ và nhiệt độ."
      action={
        <Button variant="primary" icon="plus">
          Thêm máy in
        </Button>
      }
    />
  );
}
