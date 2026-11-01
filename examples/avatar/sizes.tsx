import { Avatar } from "@semi/ui";

export default function AvatarSizes() {
  return (
    <div className="flex items-center gap-3">
      <Avatar name="Hoàng Huỳnh" size="lg" />
      <Avatar name="Semi Team" />
      <Avatar name="Lan" size="sm" />
    </div>
  );
}
