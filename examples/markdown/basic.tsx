import { Markdown } from "@semi/ui";

const TEXT = `## Gợi ý cài đặt
Với **PETG**, giảm quạt xuống 30% và tăng nhiệt độ đầu phun lên 245°C.

- Bật \`Z-hop\` khi di chuyển
- Lớp đầu tiên: 0.24 mm

Xem thêm tại https://example.com/petg-guide`;

export default function MarkdownBasic() {
  return <Markdown text={TEXT} />;
}
