import { Card } from "@semi/ui";

export default function CardBordered() {
  return (
    <Card bordered padding="none" className="max-w-xl overflow-hidden">
      <div className="px-card py-2.5 border-b border-divider text-ui font-medium text-strong">Đơn mua gần đây</div>
      {["PO-1042 · Nhựa PLA 1kg", "PO-1041 · Đầu phun 0.4", "PO-1040 · Bàn in PEI"].map((row) => (
        <div key={row} className="px-card py-2.5 border-b border-divider last:border-0 text-ui text-body">
          {row}
        </div>
      ))}
    </Card>
  );
}
