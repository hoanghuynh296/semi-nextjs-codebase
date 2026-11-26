# Thương hiệu trên Semi (brand kit)

**Bắt đầu từ đây.** Semi là brand builder: bạn định nghĩa thương hiệu một lần, mọi sản phẩm và mọi agent làm theo.
Mỗi thương hiệu (công ty con, khách hàng) có **một brand kit riêng** sinh ra từ Semi: logo, màu nút chính, font, giọng
văn, kèm một brand book để xem. Mọi sản phẩm của thương hiệu cài brand kit, nên luôn cùng nhận diện, cùng luật.

| Bạn đang ở | Gõ | Để làm gì |
|---|---|---|
| Repo brand | `/semi-brand` | Tạo hoặc sửa thương hiệu, xem brand book, ra bản |
| Thư mục trống | `/semi-new-app` | Tạo sản phẩm mới của thương hiệu |
| App có sẵn | `/semi-check` | Kiểm tra app theo brand và Semi, rồi sửa khi bạn đồng ý |
| App có sẵn | `/semi-sync` | Brand kit hoặc Semi có bản mới: kéo về |

```
Semi core (@semi/ui)              cố định cho mọi thương hiệu
  component, luật, lint, một style chung, mặt nền và chữ xám trung tính, bộ chọn chữ trên nút
        │  /semi-brand
        ▼
Brand kit (vd. @3dnoobs/brand)    lựa chọn của một thương hiệu, repo GitHub riêng
  brand.json (bạn chọn) → dist/brand.css, dist/brand.json, dist/logo/, BRAND.md, AGENTS.brand.md, brand book
        │  /semi-new-app --brand  ·  /semi-sync
        ▼
Sản phẩm (Manager, Store, …)       chỉ dùng: không tự chọn màu / font, không ghi đè token
```

- **Bạn chỉ quyết định vài thứ**, một lần, trong repo brand: brief (sản phẩm, người dùng, tính cách), logo, màu chính,
  màu phụ (tuỳ chọn), font, giọng văn. Chữ trên nút và màu hover do Semi tự chọn. Từ 1.0 màu thương hiệu **chỉ** cho nút
  chính (của trang, hộp thoại, thanh điều hướng), badge đếm cần chú ý, nhãn "Mới" và gạch chân tab lớn đang chọn; mặt
  nền, chữ, đường viền, mục đang chọn và focus là xám trung tính của Semi, giống nhau cho mọi thương hiệu (`docs/TOKENS.md`).
- **Chữ trên nút luôn đạt chuẩn đọc rõ (WCAG AA, 4.5:1):** bộ sinh chọn chữ trắng, gần đen hoặc đen, và báo lỗi nếu chữ
  bạn tự chọn (`"on"`) không đạt.
- **Sản phẩm không thể đi lệch:** `semi-lint` chặn việc ghi đè màu thương hiệu trong sản phẩm (`brand-override`),
  `/semi-check` kiểm tra sản phẩm đang dùng đúng brand kit.
- **Agent viết đúng giọng thương hiệu:** trong sản phẩm, agent hỏi `semi_brand` trước khi viết chữ, đặt màu hay logo.

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
| Màu phụ | (bỏ qua) | Tuỳ chọn: nút chính thứ hai |
| Font | Geist (+ Montserrat Alternates cho hero, tab lớn) | Font giao diện bắt buộc; font hiển thị tuỳ chọn (không có thì dùng font giao diện). Chọn trong danh sách, hoặc tên một Google Font có tiếng Việt |
| Giọng văn | Thân thiện · gọi "bạn" · không emoji | Agent soạn nháp 2 nên / 2 không nên và câu mẫu cho nút, lỗi, trạng thái trống để bạn sửa |

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
- **UI kit** (cho developer): màu nút chính, chữ trên nó và màu hover, cỡ chữ, bảng
  điểm đọc rõ, tải `brand.css`, `brand.json` và logo, cùng **toàn bộ component của Semi** (ví dụ, code, API).

Cả ba phần nằm chung một dashboard (menu bên trái, thanh tab dưới trên điện thoại), như trang component. Đổi sáng / tối
ở chân menu.

👉 *Bạn làm:* mở link, nhìn và nói điều muốn đổi ("màu chính đậm hơn", "bỏ font hiển thị"). *Agent làm:* sửa
`brand.json`, sinh lại; trang đang mở tự cập nhật.

Repo kit sau bước này:

```
brand.json          lựa chọn của bạn (file duy nhất người sửa)
dist/brand.css      sinh ra: màu nút chính / phụ, chữ trên nút, hover, font (đã kiểm tra đọc rõ)
dist/brand.json     sinh ra: toàn bộ giá trị + font để sản phẩm nạp
assets/             logo (bạn đưa vào)
dist/logo/          sinh ra: logo để sản phẩm import (@3dnoobs/brand/dist/logo/full.svg)
BRAND.md            sinh ra: guideline thương hiệu (brief, logo, cách dùng màu, giọng văn, hình ảnh, màu, đọc rõ)
AGENTS.brand.md     sinh ra: luật cho agent ở mọi sản phẩm (màu, font, logo, giọng văn, câu mẫu)
package.json        "@3dnoobs/brand", phụ thuộc "@semi/ui" (+ Next.js cho trang preview)
.github/workflows/brand-pages.yml   kiểm tra mỗi pull request; build trang preview và đăng lên GitHub Pages mỗi lần push lên main
.github/workflows/semi-update.yml   mỗi thứ Hai build lại kit với @semi/ui mới nhất; mở pull request khi màu, guideline hay luật đổi
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
/semi-new-app --brand github:3dnoobs/brand
```

Agent hỏi tên app ("3D Noobs Manager"), loại sản phẩm
(công cụ dùng cả ngày · ứng dụng thường · web bán hàng · trang giới thiệu: quyết định màn đầu, mật độ, cỡ chữ và theme
mặc định), cùng phiên bản Next.js và kiểu export (thường để mặc định). Không hỏi màu, font: đã có trong brand.
👉 *Bạn làm:* trả lời vài câu.

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

Thứ tự import là bắt buộc: `brand.css` **sau** `@semi/ui/tokens.css`. Kit ghi đè biến của Semi ở cùng độ ưu tiên
(specificity), nên file nhập sau mới thắng; nhập ngược thì màu nút chính và font của brand không có tác dụng.

```tsx
// app/layout.tsx: font của brand, mật độ đã chọn, theme mặc định theo loại sản phẩm
<html data-density="compact" className={`dark ${beVietnamPro.variable} ${montserratAlternates.variable}`}>
  <ThemeScript defaultTheme="system" />
```

Cùng với `semi-lint.json` (`"brand": "@3dnoobs/brand"`), luật Semi và luật của brand trong
`AGENTS.md`, `CLAUDE.md` trỏ tới nó (`@AGENTS.md`, để Claude Code đọc), màn đầu theo loại sản phẩm (app quản lý:
AppShell có logo của brand, con số chính và các mục mẫu từ `brief.sample`; web bán hàng: thanh trên, hero, bằng chứng),
rồi kiểm tra `semi-lint` + `tsc` + build.
👉 *Bạn làm:* không gì cả, đợi báo xong.

**Bước 7. Phát triển như bình thường**

Bạn nói "làm trang quản lý đơn hàng"; agent dùng component Semi, màu 3D Noobs tự áp. Nếu ai đó viết `--semi-primary`
hay `--semi-…` trong CSS của app, `semi-lint` chặn (`brand-override`): màu chỉ đến từ brand.

### Phần C — Về sau

| Chuyện | Bạn làm | Ở đâu |
|---|---|---|
| Làm thêm app **Store** | `/semi-new-app --brand github:3dnoobs/brand` | Thư mục mới |
| 3D Noobs **đổi màu chính** | `/semi-brand` → "đổi primary sang `#00C853`" → xem trước → tag mới | Repo brand |
| … rồi đưa vào các app | `/semi-sync` (đổi màu thấy rõ: agent hỏi trước) | Từng app |
| **Semi** ra bản mới | Workflow `semi-update.yml` mở pull request nếu kit đổi (chỉ đổi số phiên bản thì không); duyệt rồi `/semi-brand update` để phát hành. Không có PR nghĩa là kit vẫn đúng, không cần phát hành | Repo brand |
| … rồi đưa vào các app | `/semi-sync` | Từng app |
| Kiểm tra định kỳ | `/semi-check` | Từng app |

---

## Chuyển app sang Semi từng phần (Migrating an app in stages)

Cách tạm thời (transitional), chỉ dùng khi một app có sẵn chuyển sang Semi từng khu vực một (#184). App mới, hay app
chuyển xong một lần, dùng một `globals.css` như trên.

**Vì sao không nhập Semi vào stylesheet chung khi còn màn cũ.** `tokens.css` định nghĩa lại biến theme của Tailwind
(`--color-primary`, `--spacing`, cỡ chữ, bảng màu) và `base.css` ẩn thanh cuộn trên mọi phần tử: nhập vào
`globals.css` là đổi giao diện mọi màn chưa chuyển. Nên CSS của Semi chỉ được nạp ở các route đã chuyển, cạnh bản build
Tailwind riêng của app. Nhưng hai bản build cùng ghi vào `@layer utilities`, và trong một layer, sheet nạp sau thắng:
`.flex` của app đè `.md:hidden` của Semi, `AppShell` vỡ (thanh trên của điện thoại hiện ở mọi bề rộng, khung thành
cột trên desktop), và thứ tự nạp ở dev khác production.

**Entry `@semi/ui/scoped.css`.** Theme và utilities của Semi nằm trong layer riêng `semi`, khai báo sau `utilities`
(`@layer theme, base, components, utilities, semi;`), nên Semi thắng dù sheet nào nạp trước. Token, bo góc, cỡ chữ,
`data-theme` sáng / tối giống hệt `tokens.css` + `base.css`; không có class hay token mới.

App viết một file nhỏ cho các route đã chuyển (`@source` trong file của package không trỏ được vào app):

```css
/* app/(semi)/semi.css: chỉ các route đã chuyển nạp file này */
@import "@semi/ui/scoped.css";
@import "@3dnoobs/brand/dist/brand.css"; /* có brand kit: ngay sau scoped.css */
@source "./";                     /* nhóm route đã chuyển */
@source "../../components/semi";  /* component dùng chung đã chuyển */
```

- **Next.js:** `import "./semi.css";` trong `app/(semi)/layout.tsx`. `app/globals.css` (nạp ở layout gốc) giữ nguyên
  bản build cũ của app.
- **Vite / React Router:** nạp file như một link của route layout đã chuyển:
  ```tsx
  import semiCss from "./semi.css?url";
  export const links = () => [{ rel: "stylesheet", href: semiCss }];
  ```

Không bao giờ để `@import "tailwindcss"` và `scoped.css` trong cùng một file. `/semi-check` báo mục nền móng
`second-build` khi CSS của Semi nằm trong file thứ hai không dùng `scoped.css`.

**Giới hạn.** Layer `semi` thắng cả utilities của app. Trên một route đã chuyển, component cũ mà class của nó không
được `@source` vào sheet của Semi có thể mất biến thể responsive (ví dụ header cũ `flex md:hidden`: `.flex` của
Semi thắng `md:hidden` của app). Luật: mọi file được render trên route đã chuyển phải được `@source` trong sheet
Semi của route đó; component cũ nào không `@source` được thì chuyển nó trước.

**Bước thoát.** Khi màn cũ cuối cùng đã chuyển: xoá `semi.css` và chỗ nạp nó, bỏ theme cũ của app khỏi `globals.css`,
rồi chạy `/semi-check` (foundation nối khối `semi-design-system` vào `globals.css`): về đúng một stylesheet như mọi
app Semi.

---

## Khi nào dùng lệnh nào

| | `/semi-brand` · `/semi-brand update` | `/semi-sync` |
|---|---|---|
| Chạy ở | Repo **brand kit** | Repo **sản phẩm** |
| Làm gì | Tạo / sửa lựa chọn thương hiệu (`/semi-brand`); sinh lại kit cho bản Semi mới, không đổi lựa chọn (`/semi-brand update`) | Đưa sản phẩm lên `@semi/ui` và brand kit mới nhất tương thích, chạy migration, `tsc` |
| Đổi lựa chọn thương hiệu | `/semi-brand`: có · `update`: không | Không bao giờ |
| Sửa code sản phẩm | Không | Có (migration) |
| Kết quả | Kit có tag mới | Sản phẩm dùng bản mới |

Luôn đi **từ trên xuống**: Semi → brand kit → sản phẩm.

**Phiên bản brand kit:**

| Mức | Khi nào | `/semi-sync` ở sản phẩm |
|---|---|---|
| patch | Sinh lại, giao diện không đổi | Tự cập nhật |
| minor | Thêm lựa chọn (màu phụ, font hiển thị, token mới) | Tự cập nhật |
| major | Màu / font thương hiệu đổi, thấy rõ | Hỏi trước (`--accept-major`) |

Brand kit ghi nó chạy với `@semi/ui` nào (`"semi"` trong `brand.json`). `semi-brand` (create / update) ghi dải
`">=X.Y.0 <1.0.0"` (ví dụ `">=0.26.0 <1.0.0"`): "từ minor này trở lên, trước major kế tiếp". Semi chỉ đổi API ở bản
major, nên minor mới của 0.x an toàn cho brand và brand không cần phát hành lại cho mỗi minor. Dải chấp nhận:
`>=X.Y[.Z] <A.B[.C]` (cách nhau bởi dấu cách), `^X.Y.Z`, `~X.Y.Z`, `X.Y.Z`. Lưu ý `^0.24.0` (kiểu cũ) ghim đúng minor 0.24.

`/semi-sync` giữ Semi trong dải của brand (bản major mới vẫn bị chặn đến khi brand cập nhật dải) và **không bao giờ hạ cấp**:
nếu dải của brand thấp hơn bản `@semi/ui` đang cài (brand cũ ghi `^0.24.0`, app đã ở 0.26.0), nó giữ bản đang cài và cảnh báo
dải của brand cùng cách sửa: chạy `/semi-brand update` trong repo brand, phát hành, rồi `/semi-sync` lại.

---

## `brand.json`

```json
{
  "name": "3D Noobs",
  "package": "@3dnoobs/brand",
  "primary": "#00AE42",
  "secondary": null,
  "fonts": { "sans": "Geist", "display": "Montserrat Alternates" },
  "brief": {
    "product": "Phần mềm quản lý máy in 3D", "audience": "Maker 18–35 tuổi, dùng cả ngày trên máy tính",
    "personality": ["chính xác", "thân thiện", "kỹ thuật"], "tagline": "In 3D chính xác ngay lần đầu",
    "sample": {
      "list": "Bản in", "items": ["Móc khoá logo PLA đen", "Giá đỡ điện thoại gập được", "Chậu cây mini xoắn ốc"],
      "metric": { "label": "Bản in đang chạy", "value": "12", "sub": "3 máy rảnh" },
      "proof": { "label": "bản in đã giao cho người mới", "value": "12.000+" }
    }
  },
  "logo": { "full": "assets/logo.svg", "fullDark": "assets/logo-dark.svg", "mark": "assets/mark.svg" },
  "voice": {
    "tone": "friendly", "address": "bạn", "we": "3D Noobs", "emoji": false,
    "do": ["Gọi đúng tên máy in và vật liệu"], "dont": ["Dùng thuật ngữ G-code trong thông báo cho người mới"],
    "examples": { "button": ["In ngay", "Thêm máy in"], "error": "Máy in mất kết nối. Kiểm tra Wi‑Fi rồi thử lại.", "empty": "Chưa có máy in nào. Thêm máy in đầu tiên để bắt đầu." }
  },
  "imagery": "Ảnh bản in thật trên nền tối, chụp gần; không ảnh stock.",
  "semi": ">=1.0.0 <2.0.0"
}
```

| Khoá | Giá trị | Quy chuẩn |
|---|---|---|
| `name`, `package` | Tên hiển thị, tên npm (`@scope/brand`) | Bắt buộc |
| `primary` | Hex, hoặc `{ "color": "#hex", "on": "#hex" }` | Bắt buộc. Màu của nút chính, badge đếm cần chú ý, nhãn "Mới", gạch chân tab lớn đang chọn. Cùng một màu ở cả hai theme. `on` (tuỳ chọn) là chữ trên nút, phải đạt 4.5:1; bỏ qua thì bộ sinh chọn |
| `secondary` | Như `primary`, hoặc `null` | Tuỳ chọn: chỉ cho nút chính thứ hai (`bg-secondary` + `text-on-secondary`). Không có thì các token `secondary` lấy giá trị của `primary` |
| `fonts.sans` | Tên Google Font | Bắt buộc: font giao diện (`font-sans`) |
| `fonts.display` | Tên Google Font | Tuỳ chọn: font hiển thị (`font-display`) cho hero, tiêu đề trang đọc, tab lớn, tiêu đề mục kiểu tạp chí. Không có thì dùng font giao diện. Tiêu đề không đậm (400 / 500): font không có bản variable cần `"weight": ["400", "500"]` |
| `semi` | Dải phiên bản `@semi/ui` | `/semi-brand update` cập nhật |
| `brief` | `product`, `audience`, `personality` (1–5 tính từ), `tagline` (một câu, ≤ 90 ký tự); `sample`: `list` (tên danh sách chính), `items` (2–5 mục thật), `metric` (`{ label, value, sub? }`, con số người dùng mở app để xem), `proof` (`{ label, value }`, bằng chứng cho trang giới thiệu) | Tuỳ chọn; vào BRAND.md và luật cho agent ("chọn chữ, hình ảnh cho họ"). Thiếu `sample` thì build nhắc: màn mẫu của brand book và trang đầu của app mới dùng chữ của sản phẩm thay cho dữ liệu cửa hàng chung chung |
| `logo` | `full` (bắt buộc khi có logo), `fullDark`, `mark`: đường dẫn trong repo kit (.svg nên dùng, .png, .webp); `clearspace` (× chiều cao, mặc định 0.5), `minWidth` (px, mặc định 80) | Build copy vào `dist/logo/full.svg` … để sản phẩm import; thiếu file là lỗi |
| `voice` | `tone`: `friendly` · `neutral` · `formal`; `address` (gọi người dùng), `we` (tự xưng), `emoji`, `do`, `dont`, `examples` (`button`, `success`, `error`, `empty`, `confirm`) | Tuỳ chọn, mặc định trung tính, gọi "bạn". Luật viết chung của Semi (nút, lỗi, trạng thái trống) luôn kèm theo |
| `imagery` | Một đoạn mô tả ảnh / minh hoạ | Tuỳ chọn |

### Mật độ và cỡ chữ

**Mật độ và cỡ chữ không thuộc thương hiệu.** Một thương hiệu có nhiều sản phẩm: 3D Noobs có dashboard quản lý (cần
gọn) và web bán hàng (cần thoáng, chữ tiêu đề lớn). Mỗi sản phẩm tự chọn khi tạo bằng `/semi-new-app` (theo loại sản
phẩm), lưu ở `semi-lint.json` (`"density"`, `"typeScale"`) và `<html data-density data-type-scale>`; đổi sau bằng lời
("gọn hơn", "chữ tiêu đề to hơn"). Tab Ứng dụng của brand book cho thấy mỗi màn với lựa chọn thường gặp của nó. Quy
tắc bố cục đi kèm (tránh giao diện "AI" chung chung): `DESIGN_SYSTEM.md` §19.

### Semi sinh gì (1.0)

Từ 1.0 bộ sinh **chỉ** làm hai việc cho mỗi màu (`primary`, `secondary`), cùng một giá trị cho theme sáng và tối:

- **Chữ trên nút** (`on-primary`, `on-secondary`): `on` của `brand.json` nếu có (phải đạt 4.5:1, không thì báo lỗi), nếu
  không thì chữ trắng, rồi gần đen `#0c0d0e`, rồi đen: cái đầu tiên đạt 4.5:1 (luôn có một cái đạt).
- **Hover** (`primary-hover`, `secondary-hover`): cùng sắc, độ sáng OKLCH lệch `hoverStep` (0.06, `brand/params.mjs`)
  ra xa chữ trên nút (tối hơn dưới chữ trắng, sáng hơn dưới chữ tối), nên chữ vẫn đạt 4.5:1.
- **Chữ của nhãn “Mới”** (`new-tag-text-dark`, `new-tag-text-light`, 1.0 #146): nhãn là màu chính 18%; chữ là màu chính nếu
  đạt 4.5:1 trên nền đó (trên canvas, app, panel và card của theme), không thì màu chữ đậm của theme.

`dist/brand.css` chỉ đặt `--semi-primary`, `--semi-primary-hover`, `--semi-on-primary`, `--semi-secondary`,
`--semi-secondary-hover`, `--semi-on-secondary`, `--semi-new-tag-text-dark`, `--semi-new-tag-text-light` (trên `:root`, `[data-theme]`, `.dark`, `.light`) và
`--font-sans-family`, `--font-display-family` (chỉ khi có `fonts.display`). Không sinh thang màu, màu trung tính, chữ màu
chính, nền chọn, focus hay màu trạng thái: đó là của Semi, giống nhau cho mọi thương hiệu (`docs/TOKENS.md`).

**Báo cáo** (`dist/brand.json` → `report`, BRAND.md, trang preview): chữ trên nút và khi hover ≥ 4.5:1 (chặn build nếu
không đạt); "nút tách khỏi nền" (canvas, app, panel của cả hai theme) ≥ 3:1 là mục *lưu ý*, không chặn build. Kit chưa
có logo có cảnh báo.

**Khoá cũ trước 1.0** (`neutral`, `primaryStyle`, `styles`, `accent`, `palettes`, `color.accent`, `color.buttonText`,
`color.secondaryRole`, `fonts.figure`) không còn tác dụng: build vẫn chạy, mỗi khoá có một cảnh báo nói nó từng làm gì;
xoá chúng khỏi `brand.json`. **Mọi brand kit phải build lại và phát hành lại cho Semi 1.0** (`/semi-brand update`, rồi
tag mới): `brand.css` cũ đặt các biến mà 1.0 không còn đọc (`--semi-accent`, thang `--color-primary-*`, màu trung tính
theo style).

Con số duy nhất của cách sinh (`hoverStep`) nằm ở `brand/params.mjs`, giống nhau cho mọi thương hiệu. Người bảo trì Semi
thử nó trên trang **Design Lab** của docs, kèm so sánh trên các brand mẫu, trước khi đổi ([LAB.md](LAB.md)); đổi nó là
thay đổi core: mọi kit đổi màu hover khi build lại.

Chi tiết kỹ thuật: bộ sinh màu nằm ở `@semi/ui/brand` (`generateBrand`), lệnh trong kit là `semi-brand build | check`
(bin của `@semi/ui`). `check` bỏ qua dòng ghi phiên bản `@semi/ui` trong file sinh ra: bản Semi mới sinh cùng màu thì
kit không cần build lại hay phát hành.
