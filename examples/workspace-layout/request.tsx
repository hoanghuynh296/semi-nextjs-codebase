import { useState } from "react";
import { Badge, Button, DropZone, HintTextarea, Stepper, ToggleGroup, WorkspaceHeader, WorkspaceLayout, WorkspaceSection } from "@semi/ui";

const LINES = [
  { id: "l1", name: "Tiêu đen 500 g/l", spec: "Độ ẩm ≤ 13%, sạch 99,5%" },
  { id: "l2", name: "Quế chẻ", spec: "Dài 30–40 cm, dầu ≥ 3%" },
];
const QUOTES = [
  { supplier: "Gia vị Tây Nguyên", days: 12, prices: [4120, 2890], best: [false, true] },
  { supplier: "HTX Tiêu Chư Sê", days: 15, prices: [4090, 2950], best: [true, false] },
];
const SUPPLIERS = [
  { value: "@taynguyen", label: "Gia vị Tây Nguyên", hint: "Đắk Lắk" },
  { value: "@chuse", label: "HTX Tiêu Chư Sê", hint: "Gia Lai" },
  { value: "@yenbai", label: "Hương Quế Yên Bái", hint: "Yên Bái" },
];
const TEMPLATES = [{ value: "/fob", label: "Hỏi giá FOB", hint: "Giá FOB Hải Phòng, hạn giao" }];
const usd = (n: number) => `${n.toLocaleString("vi-VN")} USD`;

export default function WorkspaceRequest() {
  const [tab, setTab] = useState<"lines" | "suppliers" | "terms">("lines");
  const [qty, setQty] = useState([12, 4]);
  const [msg, setMsg] = useState("Chào anh chị, bên em cần báo giá FOB Hải Phòng, giao trước 15/12.");
  return (
    <WorkspaceLayout
      header={
        <WorkspaceHeader
          backHref="/components/workspace-layout/"
          backLabel="Về Mua hàng"
          title="YC-014 Tiêu đen cho Seoul Spice"
          description="Cần hàng trước 15/12 · Trần Thu Hà"
          headingLevel={2}
          tabs={
            <ToggleGroup
              label="Phần của yêu cầu"
              value={[tab]}
              onChange={(v) => v[0] && setTab(v[0])}
              options={[
                { key: "lines", label: "Mặt hàng" },
                { key: "suppliers", label: "Nhà cung cấp" },
                { key: "terms", label: "Điều khoản" },
              ]}
              className="w-full [&>button]:flex-1"
            />
          }
        />
      }
      panel={
        <>
          <WorkspaceSection label="Mặt hàng" count={LINES.length} max={8} action={<Button size="sm" variant="ghost" icon="plus">Thêm</Button>}>
            {LINES.map((l, i) => (
              <div key={l.id} className="rounded-card bg-card p-3 flex flex-col gap-2">
                <div className="min-w-0">
                  <div className="text-label font-semibold text-contrast">{l.name}</div>
                  <div className="text-caption text-muted truncate">{l.spec}</div>
                </div>
                <Stepper label={`số tấn ${l.name}`} unit="tấn" min={1} value={qty[i]} onChange={(v) => setQty(qty.map((q, j) => (j === i ? v : q)))} />
              </div>
            ))}
          </WorkspaceSection>
          <WorkspaceSection label="Quy cách đính kèm" count={0} max={5}>
            <DropZone title="Kéo tệp quy cách vào đây" hint="PDF, ảnh mẫu hoặc Excel, tối đa 10 MB" accept={[".pdf", "image/*", ".xlsx"]} maxSize={10_000_000} onAdd={() => undefined} />
          </WorkspaceSection>
          <WorkspaceSection label="Lời nhắn">
            <HintTextarea
              label="Lời nhắn gửi nhà cung cấp"
              rows={3}
              value={msg}
              onChange={setMsg}
              triggers={[
                { char: "@", hint: "để nhắc nhà cung cấp", items: SUPPLIERS.map((s) => ({ ...s, icon: "truck" })) },
                { char: "/", hint: "để chèn mẫu", items: TEMPLATES.map((t) => ({ ...t, icon: "fileText" })) },
              ]}
            />
          </WorkspaceSection>
        </>
      }
      action={
        <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-2">
          <Button>Lưu nháp</Button>
          <Button variant="primary" icon="send" fullWidth>
            Gửi hỏi giá (2)
          </Button>
        </div>
      }
      result={
        <>
          <div className="flex flex-wrap items-center gap-3">
            <h3 className="flex-1 text-title font-title font-semibold text-contrast">So sánh báo giá</h3>
            <span className="text-label text-muted">2/2 nhà cung cấp đã trả lời</span>
          </div>
          <div className="grid md:grid-cols-2 gap-group">
            {QUOTES.map((q) => (
              <article key={q.supplier} className="rounded-card bg-card p-card flex flex-col gap-3">
                <div className="min-w-0">
                  <div className="text-ui font-semibold text-contrast truncate">{q.supplier}</div>
                  <div className="text-caption text-muted">FOB · {q.days} ngày</div>
                </div>
                <div className="flex flex-col divide-y divide-divider">
                  {LINES.map((l, i) => (
                    <div key={l.id} className="flex items-center gap-2 py-2">
                      <span className="flex-1 text-label text-body">{l.name}</span>
                      {q.best[i] && (
                        <Badge tone="emerald" size="sm">
                          Tốt nhất
                        </Badge>
                      )}
                      <span className="text-label tabular-nums text-contrast">{usd(q.prices[i])}</span>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-caption text-muted">Tổng ({qty[0] + qty[1]} tấn)</span>
                  <span className="text-ui-lg font-figure font-semibold text-contrast tabular-nums">{usd(q.prices[0] * qty[0] + q.prices[1] * qty[1])}</span>
                </div>
              </article>
            ))}
          </div>
        </>
      }
    />
  );
}
