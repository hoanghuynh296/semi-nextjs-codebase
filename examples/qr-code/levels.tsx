import { QRCode, type QRCodeErrorCorrection } from "@semi/ui";

const VIETQR = "00020101021238540010A00000072701240006970422011001234567890208QRIBFTTA530370454061850005802VN62100806DH1042630444F9";
const LEVELS: QRCodeErrorCorrection[] = ["L", "M", "Q", "H"];

export default function QRCodeLevels() {
  return (
    <div className="flex flex-wrap gap-4">
      {LEVELS.map((level) => (
        <QRCode key={level} value={VIETQR} errorCorrection={level} size={140} label={`Mã VietQR, mức sửa lỗi ${level}`} caption={`Mức ${level}`} />
      ))}
    </div>
  );
}
