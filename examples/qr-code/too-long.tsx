import { useState } from "react";
import { QRCode } from "@semi/ui";

export default function QRCodeTooLong() {
  const [error, setError] = useState("");
  return (
    <div className="space-y-2">
      <QRCode value={"A".repeat(4000)} size={140} label="Mã QR" onError={(e) => setError(e.message)} />
      {error && <p className="text-ui text-muted">onError: {error}</p>}
    </div>
  );
}
