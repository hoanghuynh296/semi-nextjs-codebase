import { Button, Separator } from "@semi/ui";

export default function SeparatorBasic() {
  return (
    <div className="space-y-4 max-w-sm">
      <p className="text-ui text-body">Thông tin máy in</p>
      <Separator />
      <Button variant="primary" fullWidth>
        Đăng nhập bằng email
      </Button>
      <Separator label="hoặc" />
      <Button fullWidth>Đăng nhập bằng Google</Button>
      <div className="flex h-6 items-center gap-3 text-label text-muted">
        <span>Máy in</span>
        <Separator orientation="vertical" />
        <span>Vật liệu</span>
      </div>
    </div>
  );
}
