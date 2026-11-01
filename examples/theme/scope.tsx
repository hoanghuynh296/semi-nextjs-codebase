import { Badge, Button, Card } from "@semi/ui";

export default function ThemeScope() {
  return (
    <div className="grid gap-3 @2xl:grid-cols-2">
      {(["light", "dark"] as const).map((t) => (
        <div key={t} data-theme={t} className="rounded-card border border-line bg-canvas p-3">
          <Card className="p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-ui font-semibold text-contrast">data-theme="{t}"</span>
              <Badge tone="emerald" dot>
                Online
              </Badge>
            </div>
            <Button variant="primary" icon="check">
              Lưu
            </Button>
          </Card>
        </div>
      ))}
    </div>
  );
}
