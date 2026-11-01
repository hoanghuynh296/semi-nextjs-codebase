import { ContextMeter } from "@semi/ui";

export default function ContextMeterLevels() {
  return (
    <div className="flex flex-wrap items-center gap-4">
      <ContextMeter used={12_400} total={200_000} />
      <ContextMeter used={168_000} total={200_000} />
      <ContextMeter used={196_500} total={200_000} />
    </div>
  );
}
