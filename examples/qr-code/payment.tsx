import { QRCode } from "@semi/ui";

// A VietQR (EMVCo) payload from the payment provider: transfer 185.000 ₫ to account 0123456789, note DH1042.
const VIETQR = "00020101021238540010A00000072701240006970422011001234567890208QRIBFTTA530370454061850005802VN62100806DH1042630444F9";

export default function QRCodePayment() {
  return (
    <QRCode
      value={VIETQR}
      label="Mã VietQR thanh toán đơn DH1042"
      caption="185.000 ₫ · DH1042"
      copyValue="0123456789"
      onError={(e) => console.error(e)}
    />
  );
}
