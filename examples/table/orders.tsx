import { Avatar, Badge, Table, TBody, TD, TH, THead, TR } from "@semi/ui";

const ORDERS = [
  { id: "SO-1042", customer: "Nguyễn An", status: ["emerald", "Đã thanh toán"], total: 1_250_000 },
  { id: "SO-1043", customer: "Trần Bình", status: ["amber", "Chờ xử lý"], total: 480_000 },
  { id: "SO-1044", customer: "Lê Chi", status: ["rose", "Hoàn tiền"], total: 2_100_000 },
] as const;

export default function TableOrders() {
  return (
    <div className="rounded-card border border-line overflow-hidden">
      <Table>
        <THead>
          <TR>
            <TH>Mã đơn</TH>
            <TH>Khách hàng</TH>
            <TH>Trạng thái</TH>
            <TH align="right">Tổng</TH>
          </TR>
        </THead>
        <TBody>
          {ORDERS.map((o) => (
            <TR key={o.id}>
              <TD className="font-medium text-contrast">{o.id}</TD>
              <TD>
                <span className="inline-flex items-center gap-2">
                  <Avatar name={o.customer} size="sm" />
                  {o.customer}
                </span>
              </TD>
              <TD>
                <Badge tone={o.status[0]} dot>
                  {o.status[1]}
                </Badge>
              </TD>
              <TD numeric>{o.total.toLocaleString("vi-VN")} ₫</TD>
            </TR>
          ))}
        </TBody>
      </Table>
    </div>
  );
}
