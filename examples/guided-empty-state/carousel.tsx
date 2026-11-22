import { Button, GuidedEmptyState } from "@semi/ui";

export default function GuidedCarousel() {
  return (
    <GuidedEmptyState
      title="Chưa có nhà cung cấp nào. Thêm nhà cung cấp đầu tiên để hỏi giá."
      tutorial={{ label: "Xem hướng dẫn đầy đủ", href: "/components/guided-empty-state/" }}
      action={
        <Button variant="primary" icon="plus">
          Thêm nhà cung cấp
        </Button>
      }
      steps={[
        { icon: "upload", title: "Nhập danh sách bạn đang có", body: "Kéo tệp Excel hoặc CSV vào đây. Sales Hub nhận cột tên, vùng, mặt hàng và email." },
        { icon: "search", title: "Tìm thêm trong DataHub", body: "Lọc theo mặt hàng và vùng trồng, chọn nhà cung cấp rồi thêm vào danh sách một lần." },
        { icon: "send", title: "Gửi hỏi giá", body: "Chọn nhiều nhà cung cấp, gửi một yêu cầu báo giá. Thư trả lời tự về đúng hồ sơ." },
        { icon: "layers", title: "So sánh và chốt", body: "Giá từng mặt hàng đặt cạnh nhau, giá tốt nhất được đánh dấu. Chọn một báo giá để lập đơn." },
      ]}
      templates={[
        {
          category: "Bắt đầu nhanh",
          onSeeAll: () => undefined,
          items: [
            { icon: "fileSpreadsheet", tone: "emerald", title: "Nhập từ Excel", hint: "Mẫu cột có sẵn, 2 phút" },
            { icon: "database", tone: "sky", title: "Tìm trong DataHub", hint: "1.240 nhà cung cấp gia vị" },
            { icon: "mail", tone: "amber", title: "Lấy từ hộp thư", hint: "Người đã gửi báo giá cho bạn" },
          ],
        },
        {
          category: "Theo mặt hàng",
          seeAllLabel: "Tất cả mặt hàng",
          seeAllHref: "/components/guided-empty-state/",
          items: [
            { icon: "package", title: "Tiêu đen, tiêu trắng", hint: "Gia Lai, Đắk Lắk, Bình Phước" },
            { icon: "package", title: "Quế, hồi", hint: "Yên Bái, Lạng Sơn, Quảng Ngãi" },
            { icon: "package", title: "Thảo quả, gừng sấy", hint: "Lào Cai, Đắk Nông" },
          ],
        },
      ]}
    />
  );
}
