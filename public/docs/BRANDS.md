# Thương hiệu trên Semi (brand kit)

Semi là bộ kit gốc để làm phần mềm cho nhiều thương hiệu (công ty con, khách hàng). Mỗi thương hiệu có **một brand kit
riêng** sinh ra từ Semi; mọi sản phẩm của thương hiệu đó dùng brand kit, nên luôn cùng màu, cùng font, cùng luật.

```
Semi core (@semi/ui)              cố định cho mọi thương hiệu
  component, luật, lint, template style (Flat / Soft / Sharp), bộ sinh màu
        │  /semi-brand
        ▼
Brand kit (vd. @3dnoobs/brand)    lựa chọn của một thương hiệu, repo GitHub riêng
  brand.json (bạn chọn) → dist/brand.css, dist/brand.json, BRAND.md, AGENTS.brand.md
        │  /semi-init --brand  ·  /semi-update
        ▼
Sản phẩm (Manager, Store, …)       chỉ dùng: không tự chọn màu / font, không ghi đè token
```

- **Bạn chỉ quyết định vài thứ**, một lần, trong repo brand: màu chính, màu phụ (tuỳ chọn), màu trung tính, các style
  được dùng, font. Phần còn lại (thang màu, màu cho nền tối / sáng, chữ trên nút, đảm bảo đọc rõ) do Semi tự sinh.
- **Mọi màu đều đạt chuẩn đọc rõ (WCAG AA)** ở cả theme sáng và tối: bộ sinh tự chỉnh, và báo lỗi nếu một màu không
  thể dùng được.
- **Sản phẩm không thể đi lệch:** `semi-lint` chặn việc ghi đè màu thương hiệu trong sản phẩm (`brand-override`),
  `/semi-audit` kiểm tra sản phẩm đang dùng đúng brand kit, đúng style được phép.

---

## Ví dụ từ đầu: thương hiệu 3D Noobs và app Manager

### Phần A — Tạo thương hiệu (làm một lần)

**Bước 1. Tạo repo trống cho brand kit**

```bash
mkdir -p ~/Development/3dnoobs-brand
```

Mở thư mục đó bằng Claude Code (hoặc agent có plugin `semi-design`).
👉 *Bạn làm:* tạo thư mục, mở nó. Không cần cài gì.

**Bước 2. Gõ `/semi-brand` và trả lời vài câu**

| Agent hỏi | Ví dụ trả lời | Ghi chú |
|---|---|---|
| Tên thương hiệu, tên package | 3D Noobs · `@3dnoobs/brand` | Package là tên sản phẩm sẽ cài |
| Màu chính | `#00AE42` | Mã hex, hoặc gửi logo để agent đọc màu |
| Màu phụ | (bỏ qua) | Tuỳ chọn; agent gợi ý theo hoà sắc |
| Màu trung tính | Phủ theo màu chính | Hoặc giữ màu trung tính có sẵn của từng style |
| Style mặc định, style được phép | Flat · Flat + Soft | Mỗi sản phẩm chọn trong danh sách này |
| Font | Geist + Montserrat Alternates | Chọn trong danh sách, hoặc tên một Google Font |

👉 *Bạn làm:* chọn. *Agent làm:* tạo repo kit (`package.json`, `brand.json`, workflow GitHub Pages), cài `@semi/ui`
và Next.js (cho trang preview), sinh `dist/`.

**Bước 3. Xem trước ngay trong repo brand và chỉnh**

Agent chạy trang preview **của chính repo brand** (`npm run preview`) và gửi link local:
**http://localhost:4600**. Trang dựng bằng `@semi/ui` thật cùng `brand.css` của kit: màu, chữ, nút & form, thẻ, bảng,
thông báo… trong màu 3D Noobs, đổi sáng / tối ở chân menu và giữa các style được phép, kèm bảng điểm đọc rõ.

👉 *Bạn làm:* mở link, nhìn và nói điều muốn đổi ("màu chính đậm hơn", "dùng màu trung tính có sẵn"). *Agent làm:* sửa
`brand.json`, sinh lại; trang đang mở tự cập nhật.

Repo kit sau bước này:

```
brand.json          lựa chọn của bạn (file duy nhất người sửa)
dist/brand.css      sinh ra: màu, font, màu trung tính cho từng style (đã kiểm tra đọc rõ)
dist/brand.json     sinh ra: toàn bộ giá trị + font để sản phẩm nạp
BRAND.md            sinh ra: guideline thương hiệu, người đọc được
AGENTS.brand.md     sinh ra: luật cho agent ở mọi sản phẩm của thương hiệu
package.json        "@3dnoobs/brand", phụ thuộc "@semi/ui" (+ Next.js cho trang preview)
.github/workflows/brand-pages.yml   build trang preview và đăng lên GitHub Pages mỗi lần push
.preview/           trang preview sinh ra khi chạy (không commit)
```

**Bước 4. Chốt, phát hành và xem online**

👉 *Bạn làm:* nói "ok, publish" và tạo repo GitHub cho kit (vd. `3dnoobs/brand`) nếu chưa có.
*Agent làm:* `npm run check`, commit, push, gắn tag `v1.0.0`, bật GitHub Pages cho repo (`brand.mjs pages`, nguồn:
GitHub Actions). Workflow `brand-pages.yml` build trang preview và đăng lên **https://&lt;owner&gt;.github.io/&lt;repo&gt;/**;
mỗi lần push lên main nó build lại. Từ đây 3D Noobs có bộ nhận diện riêng, ai cũng xem được online.

> Repo private: GitHub Pages cho repo private cần gói GitHub có hỗ trợ (Pro / Team / Enterprise). Không có thì để repo
> brand public (nó chỉ chứa màu, font, guideline), hoặc chỉ xem local.

### Phần B — Tạo app Manager

**Bước 5. Tạo thư mục trống và gõ**

```text
/semi-init --brand github:3dnoobs/brand
```

Agent chỉ hỏi tên app ("3D Noobs Manager") và style (trong danh sách brand cho phép: app quản lý chọn Flat). Không hỏi
màu, font: đã có trong brand.
👉 *Bạn làm:* trả lời 2 câu.

**Bước 6. Agent dựng app**

Next.js + `@semi/ui` + `@3dnoobs/brand`, rồi nối sẵn:

```css
/* app/globals.css */
@import "tailwindcss";
/* semi-design-system:start */
@import "@semi/ui/tokens.css";
@import "@semi/ui/base.css";
@import "@3dnoobs/brand/dist/brand.css";
/* semi-design-system:end */
```

```tsx
// app/layout.tsx: font của brand + style đã chọn
<html data-style="flat" className={`dark ${geist.variable} ${montserratAlternates.variable}`}>
```

Cùng với `semi-lint.json` (`"brand": "@3dnoobs/brand"`, `"style": "flat"`), luật của brand trong `AGENTS.md`, trang mẫu
(AppShell, KpiCard…), rồi kiểm tra `semi-lint` + `tsc` + build.
👉 *Bạn làm:* không gì cả, đợi báo xong.

**Bước 7. Phát triển như bình thường**

Bạn nói "làm trang quản lý đơn hàng"; agent dùng component Semi, màu 3D Noobs tự áp. Nếu ai đó viết `--color-primary-500`
hay `--semi-…` trong CSS của app, `semi-lint` chặn (`brand-override`): màu chỉ đến từ brand.

### Phần C — Về sau

| Chuyện | Bạn làm | Ở đâu |
|---|---|---|
| Làm thêm app **Store** | `/semi-init --brand github:3dnoobs/brand`, chọn Soft | Thư mục mới |
| 3D Noobs **đổi màu chính** | `/semi-brand` → "đổi primary sang `#00C853`" → xem trước → tag mới | Repo brand |
| … rồi đưa vào các app | `/semi-update` (đổi màu thấy rõ: agent hỏi trước) | Từng app |
| **Semi** ra bản mới | `/semi-brand update` (sinh lại kit) | Repo brand |
| … rồi đưa vào các app | `/semi-update` | Từng app |
| App đổi sang style khác **đã được cho phép** | `/semi-style` | Repo app |
| Style **chưa được cho phép** | `/semi-brand` (thêm vào danh sách) → `/semi-update` → `/semi-style` | Repo brand → app |
| Kiểm tra định kỳ | `/semi-audit` → `/semi-fix` | Từng app |

---

## Khi nào dùng lệnh nào

| | `/semi-brand` · `/semi-brand update` | `/semi-update` |
|---|---|---|
| Chạy ở | Repo **brand kit** | Repo **sản phẩm** |
| Làm gì | Tạo / sửa lựa chọn thương hiệu (`/semi-brand`); sinh lại kit cho bản Semi mới, không đổi lựa chọn (`/semi-brand update`) | Đưa sản phẩm lên `@semi/ui` và brand kit mới nhất tương thích, chạy migration, `tsc` |
| Đổi lựa chọn thương hiệu | `/semi-brand`: có · `update`: không | Không bao giờ |
| Sửa code sản phẩm | Không | Có (migration) |
| Kết quả | Kit có tag mới | Sản phẩm dùng bản mới |

Luôn đi **từ trên xuống**: Semi → brand kit → sản phẩm.

**Phiên bản brand kit:**

| Mức | Khi nào | `/semi-update` ở sản phẩm |
|---|---|---|
| patch | Sinh lại, giao diện không đổi | Tự cập nhật |
| minor | Thêm lựa chọn (style được phép, màu phụ, token mới) | Tự cập nhật |
| major | Màu / font thương hiệu đổi, thấy rõ | Hỏi trước (`--accept-major`) |

Brand kit ghi nó chạy với `@semi/ui` nào (`"semi": "^0.6"` trong `brand.json`). Nếu Semi mới nhất nằm ngoài dải đó,
`/semi-update` giữ Semi ở bản tương thích mới nhất và nhắc chạy `/semi-brand update` trong repo brand.

---

## `brand.json`

```json
{
  "name": "3D Noobs",
  "package": "@3dnoobs/brand",
  "primary": "#00AE42",
  "secondary": null,
  "neutral": "tinted",
  "styles": { "default": "flat", "allowed": ["flat", "soft"] },
  "fonts": { "sans": "Geist", "display": "Montserrat Alternates" },
  "semi": "^0.6"
}
```

| Khoá | Giá trị | Quy chuẩn |
|---|---|---|
| `name`, `package` | Tên hiển thị, tên npm (`@scope/brand`) | Bắt buộc |
| `primary` | Hex | Bắt buộc. Không quá xám (độ đậm tối thiểu), bộ sinh tự chọn sắc độ đọc rõ |
| `secondary` | Hex hoặc `null` | Tuỳ chọn; sinh `secondary-50 … 900` (`bg-secondary-500`, `text-secondary-fg`) |
| `neutral` | `"tinted"` / `"preset"` | `tinted`: màu trung tính của mỗi style phủ nhẹ tông màu chính. `preset`: giữ màu trung tính có sẵn của style; chọn palette từng style bằng `"palettes": { "soft": "sage" }` |
| `styles.default`, `styles.allowed` | `flat` · `soft` · `sharp` | Ít nhất một; `default` phải nằm trong `allowed` |
| `fonts.sans`, `fonts.display` | Tên Google Font | `next/font/google` phải có font đó |
| `semi` | Dải phiên bản `@semi/ui` | `/semi-brand update` cập nhật |

Chi tiết kỹ thuật: bộ sinh màu nằm ở `@semi/ui/brand` (`generateBrand`), lệnh trong kit là `semi-brand build | check`
(bin của `@semi/ui`). Style và palette có sẵn: [STYLES.md](STYLES.md).
