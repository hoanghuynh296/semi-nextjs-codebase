import { Field, Textarea } from "@semi/ui";

export default function FieldTextarea() {
  return (
    <Field label="Ghi chú">
      <Textarea rows={3} placeholder="Ghi chú cho đơn in…" />
    </Field>
  );
}
