import { Collapsible, Field, Input } from "@semi/ui";

export default function CollapsibleBasic() {
  return (
    <Collapsible title="Tuỳ chọn khác" className="max-w-md">
      <div className="space-y-3">
        <Field label="Nhiệt độ bàn">
          <Input defaultValue="60 °C" />
        </Field>
        <Field label="Tốc độ quạt">
          <Input defaultValue="40%" />
        </Field>
      </div>
    </Collapsible>
  );
}
