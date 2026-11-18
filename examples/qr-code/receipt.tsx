import { QRCode } from "@semi/ui";

// On a receipt: no frame, no button, pure black on white in either theme (the printer decides, not the theme).
const VIETQR = "00020101021238540010A00000072701240006970422011001234567890208QRIBFTTA53037045407125000005802VN62200816HD0007 Cafe Semi6304DEE9";

export default function QRCodeReceipt() {
  return (
    <QRCode print value={VIETQR} size={160} errorCorrection="Q" label="Mã VietQR thanh toán hoá đơn HD0007" caption="HD0007 · 1.250.000 ₫" />
  );
}
