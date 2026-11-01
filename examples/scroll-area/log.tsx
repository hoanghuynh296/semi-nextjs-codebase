import { Card, ScrollArea } from "@semi/ui";

const LINES = Array.from({ length: 24 }, (_, i) => `12:${String(i).padStart(2, "0")}  Lớp ${i + 120}/310 · đầu phun 220°C`);

export default function ScrollAreaLog() {
  return (
    <Card className="p-0 max-w-md">
      <ScrollArea label="Nhật ký in" className="h-48">
        <ul className="p-3 space-y-1 text-label text-body tabular-nums">
          {LINES.map((l) => (
            <li key={l}>{l}</li>
          ))}
        </ul>
      </ScrollArea>
    </Card>
  );
}
