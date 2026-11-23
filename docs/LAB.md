# Design Lab: thử giá trị core trước khi đổi design system

Dành cho người bảo trì Semi. Muốn đổi một giá trị **dùng chung cho mọi brand và mọi app** (cỡ chữ, font mặc định, bo góc,
chiều cao control, khoảng cách của density, màu hover sinh cho nút brand) thì thử trên trang **Design Lab** của docs
(`/lab/`) trước, ưng ý rồi mới giao cho agent. Lựa chọn của **một** thương hiệu (màu, font, giọng văn) không làm ở đây mà
ở trang Brand preview và `/semi-brand` ([BRANDS.md](BRANDS.md)).

## Cách dùng

1. Mở **Design Lab** trên docs (menu "Bắt đầu"), hoặc `npm run dev` rồi vào `http://localhost:3000/lab/`.
2. Đổi giá trị ở các tab:
   - **Chữ:** cỡ chữ (px) và line height của từng `text-*`; cỡ chữ riêng của density `compact` / `airy` và của type scale
     `contrast`; font giao diện / tiêu đề, độ đậm tiêu đề (`font-weight-title`) và font của số lớn.
     Khung xem trước đặt được density và type scale bất kỳ.
   - **Hình khối:** bo góc (`radius-chip | control | card | panel`), chiều cao `h-control` / `h-field`, bóng và viền card,
     và mọi token khác của nhóm `shape` trong `tokens.json` (giá trị CSS thô). Từ 1.0 Semi chỉ có một diện mạo, không còn style.
   - **Màu:** tham số của bộ sinh màu brand (`brand/params.mjs`). Từ 1.0 bộ sinh chỉ chọn chữ trên màu brand và màu hover
     của nó (`hoverStep`); bề mặt, chữ và đường kẻ là màu trung tính chung, không sinh từ brand. Bảng các brand mẫu
     (`brand/samples.mjs`) cho biết số cặp màu chưa đạt AA trước / sau bản nháp.
   - **Thay đổi:** bảng từng giá trị đổi theo file nguồn, lỗi (nếu có), và các nút copy.
3. Mỗi thay đổi **áp dụng ngay trên mọi trang của docs** (lưu trong trình duyệt). Huy hiệu "Design Lab · N thay đổi" ở
   góc dưới có nút tạm tắt để so với bản gốc. Brand đang xem trước (Brand preview) cũng dùng tham số màu của bản nháp.
4. Ở tab **Thay đổi**, bấm **Copy lệnh cho agent** và dán vào agent trong repo này. Lệnh gồm patch JSON và các bước:
   `npm run lab:apply -- lab-patch.json`, cập nhật docs / CHANGELOG / DECISIONS, rồi `npm run check` và các kiểm tra
   trình duyệt. **Copy link chia sẻ** cho người khác mở đúng bản nháp (`#lab=…`, đọc được ở mọi trang).

## Patch và `lab:apply`

Bản nháp chỉ chứa giá trị khác file nguồn, và chính nó là patch:

```json
{
  "$semiLab": 1,
  "type": { "text-ui": "13px" },
  "density": { "compact": { "spacing": "0.225rem", "sizes": { "text-copy": "13px" } } },
  "typeScale": { "contrast": { "sizes": { "text-section": "26px" } } },
  "shape": { "radius-card": "1rem" },
  "params": { "hoverStep": 0.08 }
}
```

| Nhóm | Ghi vào |
|---|---|
| `type` | `tokens/tokens.json` → `type` (giữ `note`) |
| `density`, `typeScale` | `tokens/tokens.json` → `product.density`, `product.typeScale` |
| `shape` | `tokens/tokens.json` → `shape` (đổi font thì `$fonts` đổi theo) |
| `params` | `brand/params.mjs` → `PARAMS` (chỉ phần giữa `// <params>` và `// </params>`) |

```bash
npm run lab:apply -- lab-patch.json --dry
```

`lab:apply` kiểm tra patch (khoá không có, sai đơn vị, sai kiểu thì từ chối), in từng thay đổi, rồi ghi
file nguồn, chạy `build:tokens` và `sync:vendor`. Khi `params` đổi, nó so các brand mẫu trước / sau và **dừng, không ghi
gì** nếu một brand mẫu mất cặp màu đạt AA. Cuối cùng nó in các việc còn lại theo
[AGENTS.md › Change checklist](../AGENTS.md) (TOKENS.md, thang chữ trong DESIGN_SYSTEM.md / QUICK_REF.md, CHANGELOG,
DECISIONS).

Kiểm tra riêng các brand mẫu, ở bất kỳ đâu có `@semi/ui`:

```bash
npx semi-brand compare --params lab-patch.json
```

## Vì sao làm thế này

- **Lab chạy đúng code thật:** cùng `tokens.json`, bộ sinh màu `brand/generate.mjs` và các component
  thật. CSS xem trước (`scripts/lab.mjs` → `labCss`) đặt cùng biến và cùng selector như `tokens.css`, theo cùng thứ tự,
  nên density vẫn giữ giá trị riêng như sau khi build. `test:ui` kiểm tra mọi giá trị Lab sửa được đều tới được
  utility mà app dùng (không giá trị nào bị Tailwind "đóng băng" lúc build).
- **Ghi bằng script, không bằng tay:** agent không tự chép giá trị vào JSON, nên patch đã thử là patch được ghi.
- **Thay đổi core phải ổn với mọi brand:** tham số bộ sinh màu đổi màu của mọi brand kit khi build lại, nên brand mẫu là
  điều kiện chặn, không chỉ để xem.

## Không làm trong Lab

- **Cấu trúc và hành vi component:** đó là code và luật, sửa trong `src/` như thường lệ.
- **Độ đậm của chữ thường** (`font-medium` / `font-semibold` trong component): là luật (semi-lint chặn bold), chưa phải
  token. Muốn đổi thì phải thành token trước, là một quyết định riêng.
- **Font chưa được docs tải:** Lab chỉ cho chọn font trong `$fonts` của `tokens.json` → `shape`. Font mới cần thêm vào đó và
  `app/layout.tsx`.
- **Màu trung tính và màu trạng thái của Semi** (`tokens.json` → `semantic`, `palette`): chưa có trong Lab; sửa JSON
  rồi xem bằng Storybook ở cả hai theme như trước.
