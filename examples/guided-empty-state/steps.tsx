import { Button, GuidedEmptyState } from "@semi/ui";

export default function GuidedSteps() {
  return (
    <GuidedEmptyState
      layout="steps"
      title="Chưa có mặt hàng nào. Thêm mặt hàng để nhận đơn."
      action={
        <Button variant="primary" icon="plus">
          Thêm mặt hàng
        </Button>
      }
      steps={[
        { icon: "box", title: "Thêm mặt hàng", body: "Tên, quy cách và đơn vị bán." },
        { icon: "tag", title: "Đặt giá", body: "Giá theo số lượng, theo khách." },
        { icon: "send", title: "Gửi bảng giá", body: "Khách nhận một liên kết để đặt." },
      ]}
    />
  );
}
