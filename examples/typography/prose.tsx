import { Prose } from "@semi/ui";

export default function TypographyProse() {
  return (
    <Prose>
      <h2>Bảo quản vật liệu</h2>
      <p>
        Nhựa PETG và TPU <strong>hút ẩm nhanh</strong>. Giữ cuộn trong hộp kín có gói hút ẩm, hoặc sấy ở <code>65°C</code> trước khi in.
      </p>
      <ul>
        <li>PLA: để nơi khô ráo, tránh nắng</li>
        <li>PETG: sấy 4 giờ nếu mở hơn một tuần</li>
      </ul>
      <blockquote>Bản in bị rỗ bề mặt thường là do nhựa ẩm.</blockquote>
      <p>
        Xem thêm <a href="#guide">hướng dẫn sấy nhựa</a>.
      </p>
    </Prose>
  );
}
