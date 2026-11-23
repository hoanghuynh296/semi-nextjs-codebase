import { Card, TILE } from "@semi/ui";

export default function CardStates() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 max-w-xl">
      <Card interactive className="space-y-2">
        <div className="text-ui font-semibold text-strong">P1S · Xưởng B</div>
        <div className={`${TILE} p-2 text-ui text-body tabular-nums`}>Đầu phun 220°C · Bàn 60°C</div>
      </Card>
      <Card interactive active className="space-y-2">
        <div className="text-ui font-semibold text-strong">A1 Mini · đang in</div>
        <div className={`${TILE} p-2 text-ui text-body tabular-nums`}>Tiến độ 64%</div>
      </Card>
    </div>
  );
}
