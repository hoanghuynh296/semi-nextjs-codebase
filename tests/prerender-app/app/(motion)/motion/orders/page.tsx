"use client";

import React, { useState } from "react";
import { Page, PageSection } from "../../../../../../src/Page";
import { PillTabs } from "../../../../../../src/PillTabs";
import { useTabParam } from "../../../../../../src/useTabParam";
import { Button } from "../../../../../../src/Button";
import { Table, THead, TBody, TR, TH, TD } from "../../../../../../src/Table";
import { Skeleton } from "../../../../../../src/Skeleton";
import { Tooltip } from "../../../../../../src/Overlay";
import { Accordion, Collapsible } from "../../../../../../src/Disclosure";

const INITIAL_ROWS = Array.from({ length: 15 }, (_, i) => ({
  id: `SO-${1001 + i}`,
  customer: `Khách hàng ${i + 1}`,
  status: i % 2 === 0 ? "open" : "done",
}));

export default function MotionOrdersPage() {
  const [tab, setTab] = useTabParam("all", { values: ["all", "open"] as const });
  const [onlyEven, setOnlyEven] = useState(false);
  const [rows, setRows] = useState(INITIAL_ROWS);

  const visible = rows.filter((r) => {
    if (tab === "open" && r.status !== "open") return false;
    if (onlyEven && Number(r.id.slice(3)) % 2 !== 0) return false;
    return true;
  });

  return (
    <Page
      layout="work"
      title="Đơn hàng"
      tabs={
        <PillTabs
          label="Orders view"
          value={tab}
          onChange={(k) => setTab(k)}
          items={[
            { key: "all", label: "Tất cả" },
            { key: "open", label: "Đang mở" },
          ]}
        />
      }
      actions={
        <div className="flex items-center gap-2">
          <Tooltip content="Gợi ý thao tác">
            <Button
              size="sm"
              variant="subtle"
              data-testid="motion-tooltip-trigger"
              onClick={() => setOnlyEven((v) => !v)}
            >
              {onlyEven ? "Bỏ lọc chẵn" : "Lọc chẵn"}
            </Button>
          </Tooltip>
          <Button
            size="sm"
            variant="inverse"
            onClick={() =>
              setRows((prev) => [
                ...prev,
                { id: `SO-${2000 + prev.length}`, customer: `Dữ liệu chậm ${prev.length + 1}`, status: "open" },
              ])
            }
          >
            Thêm dòng chậm
          </Button>
        </div>
      }
    >
      <PageSection title="Danh sách">
        <Table>
          <THead>
            <TR>
              <TH>Mã</TH>
              <TH>Khách hàng</TH>
              <TH>Trạng thái</TH>
            </TR>
          </THead>
          <TBody>
            {visible.map((r) => (
              <TR key={r.id} onClick={() => undefined}>
                <TD>{r.id}</TD>
                <TD>{r.customer}</TD>
                <TD>{r.status}</TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </PageSection>

      <PageSection title="Khung tải & Chi tiết">
        <div className="flex flex-col gap-3">
          <div data-testid="motion-skeleton">
            <Skeleton className="h-5 w-64" />
          </div>
          <div data-testid="motion-collapsible">
            <Collapsible title="Chi tiết vận chuyển">
              <p>Giao hàng tiêu chuẩn trong 2 ngày làm việc.</p>
            </Collapsible>
          </div>
          <div data-testid="motion-accordion">
            <Accordion
              items={[
                { key: "a", title: "Chính sách đổi trả", content: "Hỗ trợ đổi trả trong 7 ngày." },
                { key: "b", title: "Hoá đơn VAT", content: "Xuất hoá đơn điện tử tự động." },
              ]}
            />
          </div>
        </div>
      </PageSection>
    </Page>
  );
}
