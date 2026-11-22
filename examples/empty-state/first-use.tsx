import { Button, EmptyState } from "@semi/ui";

export default function EmptyStateFirstUse() {
  return (
    <EmptyState
      variant="first-use"
      icon="printer"
      title="Chưa có máy in nào"
      action={
        <Button variant="primary" icon="plus">
          Thêm máy in
        </Button>
      }
    />
  );
}
