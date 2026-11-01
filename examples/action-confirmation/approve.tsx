"use client";

import { useState } from "react";
import { ActionConfirmation } from "@semi/ui";

export default function ActionConfirmationApprove() {
  const [mail, setMail] = useState<"pending" | "approved" | "rejected">("pending");
  const [wipe, setWipe] = useState<"pending" | "approved" | "rejected">("pending");
  return (
    <div className="flex flex-col gap-3 max-w-xl">
      <ActionConfirmation title="Gửi email báo giá cho 3 khách hàng?" icon="send" approveLabel="Gửi 3 email" state={mail} onApprove={() => setMail("approved")} onReject={() => setMail("rejected")}>
        an@example.com, binh@example.com, chi@example.com
      </ActionConfirmation>
      <ActionConfirmation title="Xoá 128 tệp G-code cũ hơn 90 ngày?" icon="trash" danger approveLabel="Xoá 128 tệp" state={wipe} onApprove={() => setWipe("approved")} onReject={() => setWipe("rejected")}>
        Không thể khôi phục sau khi xoá.
      </ActionConfirmation>
    </div>
  );
}
