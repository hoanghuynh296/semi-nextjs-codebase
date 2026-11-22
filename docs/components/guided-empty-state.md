# Guided empty state

The EmptyState variant “guided” (L13): the first use of a page that needs a few steps before it is useful. A step carousel (“Bước 1 / 4”, a visual, ‹ ›) or numbered steps, the one primary action, a link to the full guide, and rows of ready starting points by category, each with “Xem tất cả”.

## When to use

- First use of a page whose value needs setup in a few steps (suppliers before quotes, a catalogue before orders).
- A first use with ready starting points (import from Excel, find in DataHub, templates by category).

## Use something else when

| Need | Use |
|---|---|
| First use that one action fills | EmptyState variant="first-use" |
| A search or filter matched nothing | EmptyState variant="no-results" |
| Introduce a new feature to people who already use the page | FeatureIntro |

## Import

```tsx
import { GuidedEmptyState, type GuideStep, type GuideTemplate, type GuideTemplateGroup } from "@semi/ui";
```

## Examples

### Carousel and starting points

```tsx
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
```

### Numbered steps

layout="steps": every step at once, for two to four short steps.

```tsx
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
```

## API

### GuidedEmptyState

| Prop | Type | Default | Description |
|---|---|---|---|
| `title` * | `React.ReactNode` |  | The one sentence: what is missing and what to do ("Chưa có nhà cung cấp nào. Thêm nhà cung cấp đầu tiên để hỏi giá."). |
| `steps` * | `GuideStep[]` |  | Two to five steps. |
| `layout` | `'carousel' \| 'steps'` | `"carousel"` | `carousel` (default): one step at a time with a visual, ‹ › and "Bước n / N". `steps`: every step as a numbered list. |
| `action` | `React.ReactNode` |  | The one primary action that fills the page (a filled Button). Hide the page's own primary while this shows. |
| `tutorial` | `{ label: string; href: string; }` |  | Link to the full guide, top right from `sm`. |
| `templates` | `GuideTemplateGroup[]` |  | Rows of ready starting points under the guide. |
| `headingLevel` | `2 \| 1 \| 3` | `2` | Level of the title (2 inside a page, default); category headings are one below. |
| `className` | `string` |  |  |

## Accessibility

- The guide is a region named by the title (an h2, headingLevel to change); a step change is read from a polite live region. At an end the pressed arrow turns disabled and focus moves to the other one.
- Starting points are links (href) or buttons in a list under an h3 per category; “Xem tất cả” is a link or a button.

## Notes

- One filled button on the screen: hide the page's own primary while the guided state shows (§13).
- Below sm the guide card follows the phone cap (at most 40% of the screen, the visual hidden, scrolls inside); the starting points become one row that scrolls sideways.

<!-- GENERATED by scripts/build-docs.mjs from examples/guided-empty-state/ and the types in src/ -->
