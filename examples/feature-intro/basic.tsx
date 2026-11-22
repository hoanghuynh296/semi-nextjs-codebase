import { useState } from "react";
import { Button, FeatureIntro, IconTile } from "@semi/ui";

export default function FeatureIntroBasic() {
  const [replay, setReplay] = useState(0);
  return (
    <>
      <Button icon="sparkles" onClick={() => setReplay((n) => n + 1)}>
        Xem lại giới thiệu
      </Button>
      {replay > 0 && (
        <FeatureIntro
          key={replay}
          id="purchasing-workspace"
          forceOpen
          slides={[
            { title: "Yêu cầu mua trên một màn hình", body: "Mặt hàng, nhà cung cấp và lời nhắn ở bên trái, báo giá hiện bên phải khi về.", visual: <IconTile name="layers" size="lg" tone="gray" /> },
            { title: "So sánh từng mặt hàng", body: "Giá tốt nhất của mỗi dòng được đánh dấu, tổng tính theo số tấn bạn chọn.", visual: <IconTile name="chart" size="lg" tone="gray" /> },
            { title: "Gõ @ để nhắc nhà cung cấp", body: "Trong lời nhắn, @ gợi ý nhà cung cấp và / chèn mẫu thư có sẵn.", visual: <IconTile name="sparkles" size="lg" tone="gray" /> },
          ]}
        />
      )}
    </>
  );
}
