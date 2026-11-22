import { ErrorState } from "@semi/ui";

export default function StatesError() {
  return <ErrorState onRetry={() => {}} message="Không tải được danh sách đơn hàng. Kiểm tra kết nối rồi thử lại." detail="Mã lỗi 3871042" />;
}
