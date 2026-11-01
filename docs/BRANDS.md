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
| Sản phẩm gì, cho ai, 3 từ tính cách | Phần mềm quản lý máy in 3D · maker 18–35 tuổi, dùng cả ngày trên máy tính · chính xác, thân thiện, kỹ thuật | Brief: agent dựa vào đây để gợi ý style, font, giọng văn (kèm lý do) |
| Tên thương hiệu, tên package | 3D Noobs · `@3dnoobs/brand` | Package là tên sản phẩm sẽ cài |
| Logo | `assets/logo.svg` (+ bản nền tối, biểu tượng vuông nếu có) | SVG: agent đọc màu từ file (`brand.mjs colors`); kit copy logo vào `dist/logo/` |
| Màu chính | `#00AE42` | Mã hex, hoặc lấy từ logo |
| Màu phụ, vai trò | (bỏ qua) | Tuỳ chọn; vai trò: điểm nhấn, badge hoặc minh hoạ |
| Màu trung tính | Phủ theo màu chính | Hoặc giữ màu trung tính có sẵn của từng style |
| Style mặc định, style được phép | Flat · Flat + Soft | Chưa chắc: cho phép cả ba để so trong preview, rồi thu lại |
| Font | Geist + Montserrat Alternates | Chọn trong danh sách, hoặc tên một Google Font có tiếng Việt |
| Giọng văn | Thân thiện · gọi "bạn" · không emoji | Agent soạn nháp 2 nên / 2 không nên và câu mẫu cho nút, lỗi, trạng thái trống để bạn sửa |
| Mức dùng màu chính | Tiết chế | Tiết chế (công cụ) · cân bằng · phóng khoáng (tiêu dùng, marketing) |

Đã có `brand.json` (vd. copy từ trang Brand preview của docs bằng "Copy lệnh cho agent")? Dán vào `/semi-brand`: agent
lấy mọi lựa chọn trong đó và chỉ hỏi phần còn thiếu.

👉 *Bạn làm:* chọn. *Agent làm:* tạo repo kit (`package.json`, `brand.json`, workflow GitHub Pages), cài `@semi/ui`
và Next.js (cho trang preview), sinh `dist/`.

**Bước 3. Xem trước ngay trong repo brand và chỉnh**

Agent chạy trang preview **của chính repo brand** (`npm run preview`) và gửi link local:
**http://localhost:4600**. Trang dựng bằng `@semi/ui` thật cùng `brand.css` của kit và là một **brand book** có 3 tab:

- **Thương hiệu:** bìa (logo, tên, câu tagline, 3 từ tính cách trên nền màu chính), thương hiệu này là ai, logo (hai
  nền, khoảng trống, biểu tượng ở 16–48px, và những cách **không được làm**: kéo méo, đổi màu, xoay, thêm bóng, đặt trên
  nền rối), màu theo vai trò kèm **tỉ lệ màu trên một màn hình**, chữ (mẫu font có dấu tiếng Việt, câu tagline), giọng
  văn (nên / không nên, nút, lỗi, trạng thái trống ở sáng và tối), hình ảnh.
- **Ứng dụng:** dashboard, ứng dụng điện thoại, trang giới thiệu, email, mỗi màn ở sáng và tối, chữ theo giọng văn.
- **UI kit** (cho developer): thang màu, sắc của nút và chữ ở từng theme và độ lệch với màu thương hiệu, cỡ chữ, bảng
  điểm đọc rõ, tải `brand.css`, `brand.json` và logo, cùng **toàn bộ component của Semi** (ví dụ, code, API).

Đổi sáng / tối và giữa các style được phép ở thanh trên.

👉 *Bạn làm:* mở link, nhìn và nói điều muốn đổi ("màu chính đậm hơn", "dùng màu trung tính có sẵn"). *Agent làm:* sửa
`brand.json`, sinh lại; trang đang mở tự cập nhật.

Repo kit sau bước này:

```
brand.json          lựa chọn của bạn (file duy nhất người sửa)
dist/brand.css      sinh ra: màu, font, màu trung tính cho từng style (đã kiểm tra đọc rõ)
dist/brand.json     sinh ra: toàn bộ giá trị + font để sản phẩm nạp
assets/             logo (bạn đưa vào)
dist/logo/          sinh ra: logo để sản phẩm import (@3dnoobs/brand/dist/logo/full.svg)
BRAND.md            sinh ra: guideline thương hiệu (brief, logo, cách dùng màu, giọng văn, hình ảnh, màu, đọc rõ)
AGENTS.brand.md     sinh ra: luật cho agent ở mọi sản phẩm (màu, style, logo, giọng văn, câu mẫu)
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
  "brief": { "product": "Phần mềm quản lý máy in 3D", "audience": "Maker 18–35 tuổi, dùng cả ngày trên máy tính", "personality": ["chính xác", "thân thiện", "kỹ thuật"], "tagline": "In 3D chính xác ngay lần đầu" },
  "logo": { "full": "assets/logo.svg", "fullDark": "assets/logo-dark.svg", "mark": "assets/mark.svg" },
  "voice": {
    "tone": "friendly", "address": "bạn", "we": "3D Noobs", "emoji": false,
    "do": ["Gọi đúng tên máy in và vật liệu"], "dont": ["Dùng thuật ngữ G-code trong thông báo cho người mới"],
    "examples": { "button": ["In ngay", "Thêm máy in"], "error": "Máy in mất kết nối. Kiểm tra Wi‑Fi rồi thử lại.", "empty": "Chưa có máy in nào. Thêm máy in đầu tiên để bắt đầu." }
  },
  "color": { "accent": "restrained" },
  "imagery": "Ảnh bản in thật trên nền tối, chụp gần; không ảnh stock.",
  "semi": "^0.6"
}
```

| Khoá | Giá trị | Quy chuẩn |
|---|---|---|
| `name`, `package` | Tên hiển thị, tên npm (`@scope/brand`) | Bắt buộc |
| `primary` | Hex | Bắt buộc. Không quá xám (độ đậm tối thiểu), bộ sinh tự chọn sắc độ đọc rõ (xem dưới) |
| `secondary` | Hex hoặc `null` | Tuỳ chọn; sinh `secondary-50 … 900` (`bg-secondary-500`, `text-secondary-fg`) |
| `neutral` | `"tinted"` / `"preset"` | `tinted`: màu trung tính của mỗi style phủ nhẹ tông màu chính (bề mặt gần như trung tính, chữ và viền có tông rõ hơn). `preset`: giữ màu trung tính có sẵn của style |
| `styles.default`, `styles.allowed` | `flat` · `soft` · `sharp` | Ít nhất một; `default` phải nằm trong `allowed` |
| `fonts.sans`, `fonts.display` | Tên Google Font | `next/font/google` phải có font đó |
| `semi` | Dải phiên bản `@semi/ui` | `/semi-brand update` cập nhật |
| `brief` | `product`, `audience`, `personality` (1–5 tính từ), `tagline` (một câu, ≤ 90 ký tự) | Tuỳ chọn; vào BRAND.md và luật cho agent ("chọn chữ, mật độ, hình ảnh cho họ") |
| `logo` | `full` (bắt buộc khi có logo), `fullDark`, `mark`: đường dẫn trong repo kit (.svg nên dùng, .png, .webp); `clearspace` (× chiều cao, mặc định 0.5), `minWidth` (px, mặc định 80) | Build copy vào `dist/logo/full.svg` … để sản phẩm import; thiếu file là lỗi |
| `voice` | `tone`: `friendly` · `neutral` · `formal`; `address` (gọi người dùng), `we` (tự xưng), `emoji`, `do`, `dont`, `examples` (`button`, `success`, `error`, `empty`, `confirm`) | Tuỳ chọn, mặc định trung tính, gọi "bạn". Luật viết chung của Semi (nút, lỗi, trạng thái trống) luôn kèm theo |
| `color` | `accent`: `restrained` · `balanced` · `expressive`; `secondaryRole`: `highlight` · `badge` · `illustration` | Mặc định tiết chế, màu phụ là điểm nhấn. Mức dùng màu quyết định tỉ lệ màu trên một màn hình (tiết chế 80 / 15 / 5 %, cân bằng 70 / 20 / 10, phóng khoáng 55 / 25 / 20: trung tính / bề mặt / màu chính; màu phụ lấy khoảng 30 % phần màu chính) |
| `imagery` | Một đoạn mô tả ảnh / minh hoạ | Tuỳ chọn |

### Semi sinh màu thế nào

- **Thang `primary-50 … 900`:** mỗi sắc độ có độ sáng cố định (OKLCH, giống nhau cho mọi thương hiệu), cùng tông với màu
  chính. Màu chính nằm nguyên vẹn ở sắc độ gần nó nhất (`brandStep`: navy đậm ở `900`, vàng ở `200`, xanh lá Semi ở `500`);
  `--color-primary` luôn là đúng mã đó. Vì vậy màu rất đậm hay rất nhạt không còn làm nửa thang trùng nhau.
- **Nút chính (`bg-accent` + `text-on-accent`), mỗi theme:** trong mọi cặp sắc độ × chữ (trắng hoặc tối) đạt 4.5:1, chọn
  sắc độ **gần màu thương hiệu nhất**. Nếu sắc độ đó gần như trùng với nền trang (< 3:1, vd. navy trên nền tối), lấy sắc
  độ gần nhất có tách khỏi nền, miễn là không lệch quá xa; không có thì giữ màu thương hiệu và báo "lưu ý".
- **Chữ màu chính (`text-accent-fg`):** sắc độ gần màu thương hiệu nhất đọc được 4.5:1 trên mọi nền và trên nền chọn
  (`bg-accent-subtle`). Viền focus (`ring-focus`) và viền mục chọn (`border-accent-line`) đi theo nó.
- **Màu phụ:** `secondary-*`, chữ `text-secondary-fg`, và nền đặc `bg-secondary-solid` + `text-on-secondary` (badge, điểm
  nhấn), chọn theo cùng cách.
- **Báo cáo** (`dist/brand.json` → `report`, BRAND.md, trang preview): chữ ≥ 4.5:1, viền focus ≥ 3:1, hover vẫn đọc được;
  "nút tách khỏi nền" ≥ 3:1 là mục *lưu ý* (không chặn build). `fidelity` cho biết nút mỗi theme ở sắc độ nào và lệch màu
  thương hiệu bao nhiêu (ΔE OKLab, 0 = đúng màu); lệch trên 0.08 có cảnh báo kèm lý do.

Chi tiết kỹ thuật: bộ sinh màu nằm ở `@semi/ui/brand` (`generateBrand`), lệnh trong kit là `semi-brand build | check`
(bin của `@semi/ui`). Style có sẵn: [STYLES.md](STYLES.md).
