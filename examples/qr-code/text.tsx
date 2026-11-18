import { QRCode } from "@semi/ui";

// Any UTF-8 text works (a link with Vietnamese letters). `size` below 120 is clamped to 120 so the code stays scannable.
export default function QRCodeText() {
  return <QRCode value="https://semi.vn/hoa-don/HD0007?khach=Nguyễn Văn Á" size={100} label="Mã QR mở hoá đơn HD0007" caption="Quét để xem hoá đơn" />;
}
