import { Field, Input } from "@semi/ui";

export default function FieldBasic() {
  return (
    <Field label="Tên máy in" hint="Hiện trên thẻ và trong thông báo.">
      <Input placeholder="VD: X1 Carbon xưởng A" icon="printer" />
    </Field>
  );
}
