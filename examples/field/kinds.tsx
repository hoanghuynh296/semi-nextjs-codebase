import { Field, Input } from "@semi/ui";

export default function FieldKinds() {
  return (
    <div className="grid gap-stack max-w-md">
      <Field label="Email" kind="email" hint="Bàn phím có @ và dấu chấm; trình duyệt gợi ý email đã lưu.">
        <Input placeholder="ten@congty.vn" />
      </Field>
      <Field label="Số điện thoại" kind="tel">
        <Input placeholder="0901 234 567" />
      </Field>
      <Field label="Số lượng" kind="number">
        <Input defaultValue="12" />
      </Field>
      <Field label="Giá bán (₫)" kind="money">
        <Input defaultValue="250000" />
      </Field>
      <Field label="Website" kind="url">
        <Input placeholder="3dnoobs.vn" />
      </Field>
      <Field label="Mật khẩu" kind="password">
        <Input />
      </Field>
      <Field label="Tìm kiếm" kind="search">
        <Input icon="search" placeholder="Tên máy in" />
      </Field>
    </div>
  );
}
