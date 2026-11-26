# Semi: brand builder cho sản phẩm Next.js

[![Docs deploy](https://github.com/hoanghuynh296/semi-nextjs-codebase/actions/workflows/deploy-storybook.yml/badge.svg?branch=main)](https://github.com/hoanghuynh296/semi-nextjs-codebase/actions/workflows/deploy-storybook.yml)
[![Latest release](https://img.shields.io/github/v/release/hoanghuynh296/semi-nextjs-codebase?label=%40semi%2Fui)](https://github.com/hoanghuynh296/semi-nextjs-codebase/releases)

> **Định nghĩa thương hiệu một lần, mọi sản phẩm và mọi agent làm theo.** Semi dựng brand kit (logo, màu, font, giọng
> văn) kèm brand book, rồi dựng sản phẩm Next.js + Tailwind 4 mang sẵn thương hiệu đó, với design system
> `@semi/ui` làm động cơ bên dưới.
> Docs: [hoanghuynh296.github.io/semi-nextjs-codebase](https://hoanghuynh296.github.io/semi-nextjs-codebase/) · cho
> agent: [`llms.txt`](https://hoanghuynh296.github.io/semi-nextjs-codebase/llms.txt) · **bắt đầu từ
> [docs/BRANDS.md](docs/BRANDS.md)**.
> Trang docs build lại mỗi lần merge vào main (ghi "· main" ở chân menu khi có thay đổi chưa phát hành) và mỗi lần
> release (bỏ nhãn đó, khớp đúng bản app cài theo tag). Badge "Docs deploy" đỏ nghĩa là trang đang đứng ở bản trước.

## 4 lệnh, mỗi lệnh một chỗ

| Bạn đang ở | Gõ | Để làm gì |
|---|---|---|
| Repo brand (thư mục trống hoặc có `brand.json`) | `/semi-brand` | Tạo hoặc sửa thương hiệu: brief, logo, màu, font, giọng văn. Xem brand book (Thương hiệu · Ứng dụng · UI kit), rồi ra bản |
| Thư mục trống | `/semi-new-app` | Tạo sản phẩm mới của một brand (`--brand github:<owner>/<repo>`), sạch ngay, build được |
| App có sẵn | `/semi-check` | Kiểm tra app theo brand và Semi, ghi `semi-check.md`, hỏi rồi sửa từng giai đoạn. Cũng là cách một app cũ chuyển sang Semi |
| App có sẵn | `/semi-sync` | Brand kit hoặc Semi có bản mới: kéo về, chạy migration |

Không cần lệnh để **dựng màn hình**: nhờ agent làm giao diện, skill `semi-ui` tự chạy (tìm component, viết chữ theo
giọng văn của brand, chạy lint).
Tên cũ `/semi-init`, `/semi-audit`, `/semi-fix`, `/semi-update` đã bỏ từ 0.19.0.

Cho người bảo trì Semi: `/semi-propose` (gửi đề xuất từ dự án con lên repo lõi), `/semi-triage` (đánh giá issue,
chỉ dùng trong repo này).

## Repo này có gì

Hai sản phẩm trong cùng một tag phiên bản (semver):
1. **Plugin cho agent (`semi-design`):** các lệnh trên, quy tắc luôn bật (`rules/AGENTS.md`), hook chạy lint khi sửa
   file (`hooks.json`) và MCP server `semi` (`semi_search`, `semi_docs`, `semi_example`, `semi_block`, `semi_brand`).
2. **Package `@semi/ui`:** token (`tokens.css`, `base.css`), class constant (`@semi/ui/styles`), React component và
   page block (danh sách và props: `components.json`), bộ sinh brand kit (`semi-brand`) và công cụ kiểm tra
   `semi-lint`.

---

## 1. Cài đặt Plugin (chỉ làm 1 lần)

### Trên Antigravity
Chạy script cài đặt từ repo (hoặc clone1 lần):
```bash
bash scripts/install-plugin.sh
```
Khởi động lại Antigravity để nạp plugin `semi-design`.

### Trên Claude Code
```text
/plugin marketplace add hoanghuynh296/semi-nextjs-codebase
/plugin install semi-design
```

Plugin được ghim vào **tag phát hành** (`ref` trong `.claude-plugin/marketplace.json`), không lấy từ `main`: app đang dùng bản `@semi/ui` cũ không nhận luật của bản chưa phát hành. Đã cài plugin trước khi ghim (bản lấy từ `main`): gỡ rồi cài lại một lần (`/plugin uninstall semi-design@semi-marketplace`, `/plugin install semi-design`). Thử plugin từ `main` / nhánh: [`docs/PLUGIN.md`](docs/PLUGIN.md).

> **Lưu ý quyền truy cập (Private Repo):**
> Repo `https://github.com/hoanghuynh296/semi-nextjs-codebase` là **private**. Máy phát triển cần đăng nhập GitHub (`gh auth login && gh auth setup-git` hoặc cấu hình SSH key). Nếu thiếu quyền, `/semi-new-app` sẽ báo đúng 1 lệnh cần chạy rồi dừng.

---

## 2. Sử dụng trong dự án bằng Slash Command

Sau khi cài plugin, bạn **không cần chạy tay `npm install` hay sửa file cấu hình**. Chỉ cần mở dự án và gõ:

### Trường hợp 1: Dự án mới hoàn toàn (thư mục trống)
```text
/semi-new-app --brand github:<owner>/<repo>   # hoặc /semi-new-app rồi chọn brand khi được hỏi
```
Agent hỏi thương hiệu trước, rồi tự động:
1. Khởi tạo Next.js 16 + React 19 + Tailwind 4 (`create-next-app`).
2. Cài đặt `@semi/ui` từ tag mới nhất của `github:hoanghuynh296/semi-nextjs-codebase`.
3. Cấu hình `transpilePackages: ["@semi/ui"]`, nối `@semi/ui/tokens.css` + `@semi/ui/base.css` + `@source` vào `app/globals.css`.
4. Dựng sẵn `layout.tsx` (font của brand, hoặc Geist khi chưa có brand; `ThemeProvider`, `ToastHost`, `ConfirmHost`) và một trang mẫu (`AppShell`, `PageTitle`, `SubpageToolbar`, `KpiCard`, `CARD`).
5. Có brand: cài brand kit, nhập `brand.css`, ghi luật của brand vào `AGENTS.md`.
6. Tạo `semi-lint.json`, `AGENTS.md` và kiểm tra `semi-lint` + `tsc` + `npm run build`.

### Trường hợp 2: Dự án có sẵn (đã hay chưa có `@semi/ui`), và kiểm tra định kỳ
```text
/semi-check
```
Trước hết `/semi-check` chỉ kiểm tra, chưa sửa code: in tóm tắt ngắn và ghi mọi vấn đề kèm `file:dòng` vào
`semi-check.md`, chia 4 giai đoạn. Bạn đồng ý thì nó sửa theo thứ tự đó, mỗi giai đoạn xong app vẫn build được:
1. **Nền móng:** cài `@semi/ui` (giữ nguyên phiên bản Next.js / Tailwind), `transpilePackages`, CSS của Semi, provider
   trong layout (theme mặc định giữ đúng sáng / tối như app đang có), `semi-lint.json` + baseline, xoá `data-style` / `"style"` còn từ trước 1.0. Chụp vài trang trước và sau để so.
2. **Token:** codemod đổi class màu / cỡ chữ / bo góc sang token, có thể làm từng module (`--only`).
3. **Sửa tay:** lỗi lint còn lại.
4. **Cấu trúc:** AppShell / AppHeader, bảng, component trùng… theo quyết định của nhóm. Cái nào giữ nguyên thì ghi
   vào `semi-lint.json`: `"keep": { "tables": "lý do" }`, audit sẽ không hỏi lại.

Khi sạch, `semi-check.md` được xoá. Muốn audit tự chạy trong CI của app: `node <plugin>/skills/semi-check/scripts/audit.mjs --ci`.

### Nâng cấp phiên bản mới
```text
/semi-sync
```
Chỉ để lên bản mới: cập nhật brand kit (nếu có) và `@semi/ui` lên tag mới, in CHANGELOG các bản đã bỏ qua, chạy migration của các bản đó, rồi `tsc`. Luật mới (nếu có) sẽ hiện ở lần `/semi-check` kế tiếp.

### Thương hiệu riêng (brand kit)
```text
/semi-brand                                  # trong repo brand (vd. 3dnoobs/brand)
/semi-new-app --brand github:3dnoobs/brand      # mỗi sản phẩm mới của thương hiệu
```
Semi là bộ kit gốc cho nhiều thương hiệu: **Semi core → brand kit (một repo / thương hiệu) → sản phẩm**. Bạn chỉ quyết
vài thứ một lần trong repo brand; sản phẩm chỉ cài kit, không tự chọn màu hay font (`brand-override` chặn).
`/semi-sync` ở sản phẩm cập nhật cả `@semi/ui` lẫn brand kit (đổi màu thương hiệu thấy rõ thì hỏi trước). Xem thử
thương hiệu trước khi tạo kit: trang **Brand preview** của docs; sau khi tạo: brand book của kit (`npm run preview` trong repo brand). **Ví dụ từng bước 3D Noobs → app Manager và bảng "lệnh nào khi
nào": [docs/BRANDS.md](docs/BRANDS.md).**

### Một diện mạo
Từ 1.0 Semi chỉ có một diện mạo cho mọi brand (không còn Flat / Soft / Sharp): bề mặt xám trung tính thuần, giống nhau
ở mọi brand; màu brand chỉ cho nút chính, badge đếm và gạch chân tab lớn đang chọn. Bo góc, bóng và viền thẻ, font và
chiều cao control là nhóm `shape` của `tokens/tokens.json`; tên token và vai trò: [docs/TOKENS.md](docs/TOKENS.md).
Mật độ (`data-density`) và thang chữ (`data-type-scale`) vẫn là lựa chọn của từng sản phẩm.

### Dựng màn hình với agent (CLI `semi`, MCP)
Không cần gõ lệnh: khi bạn nhờ agent làm giao diện trong app có Semi, skill `semi-ui` tự chạy. Agent tìm đúng component hoặc block cho từng nhu cầu (gõ tiếng Việt hay tiếng Anh đều được), đọc trang docs của nó,
bắt đầu từ ví dụ, ghép trang rồi chạy `semi-lint`. Plugin tự chạy MCP server `semi` (công cụ `semi_search`,
`semi_docs`, `semi_example`, `semi_props`, `semi_list`, `semi_block`, và `semi_brand` cho giọng văn, cách dùng màu,
logo của brand kit) đọc từ `@semi/ui` đã cài, nên luôn khớp phiên
bản. Từ terminal cũng dùng được:
```bash
npx semi search "bảng có sắp xếp và chọn dòng"
```
`npx semi docs DataTable`, `npx semi example data-table`, `npx semi add dashboard` (block: dashboard, list-page,
settings-page, agent-run). Chi tiết: `docs/AGENT_TOOLS.md`.

### Đề xuất tính năng mới từ dự án con (Khi gặp thiếu sót hoặc nhu cầu chưa đáp ứng)
```text
/semi-propose
```
Agent sẽ tự động:
1. Quét dự án xem `@semi/ui` đang thiếu component, token, icon nào hoặc có component tự chế nào cần chuẩn hóa.
2. Cấu trúc một bản đề xuất chuẩn (Real-world Problem, Current Workaround, Proposed API, Generalization Potential, Rule Compliance).
3. Đẩy issue trực tiếp lên GitHub repo `hoanghuynh296/semi-nextjs-codebase` qua GitHub API (hoặc sinh file `SEMI_PROPOSAL.md` và link issue tạo sẵn).

### Đánh giá & Thiết kế giải pháp tổng quát cho Issue (Dành cho Maintainer)
```text
/semi-triage
```
Agent tại repo lõi sẽ:
1. Đọc danh sách issue hoặc 1 issue cụ thể trên GitHub.
2. Kiểm tra rule compliance (Flat Bento UI, Semantic Tokens, Typography, Radii, Controls).
3. Ra phán quyết kiến trúc (`ACCEPT`, `GENERALIZE`, `WORKAROUND / EXTENSION`, `REJECT`) và lập kế hoạch triển khai tổng quát không làm phá vỡ nguyên tắc thiết kế chung.
4. Tự động post phản hồi phân tích vào GitHub Issue.

---

## 3. Cấu trúc xuất (Exports) của `@semi/ui`

```tsx
// 1. Components (Layout + Controls + Theming)
import {
  // Primitives
  Button, Spinner, Field, Input, Textarea, Checkbox, Switch, RadioGroup, Tabs, Tooltip, Menu,
  toast, ToastHost, Alert, Progress, Avatar, EmptyState, Table, THead, TBody, TR, TH, TD, Drawer,
  SemiLocaleProvider, useSemiLocale, en, vi,
  ThemeProvider, ThemeScript, useTheme, ThemeToggle, ThemeSwitcher,
  Card, AppShell, MobileTabBar, PageTitle, SubpageToolbar, KpiCard, Modal,
  Icon, IconTile,
  AppHeader, PageActions, SidePanel, RefreshButton,
  Chip, Badge, SegmentedControl, PillTabs, TextTabs,
  CustomSelect, CustomCombobox, NumberInput, NumPadPopup, DatePicker, SearchInput, Pagination,
  Skeleton, SkeletonCard, SkeletonGrid, SkeletonRows, PageSkeleton,
  confirmDialog, ConfirmHost,
  ExternalLink, Markdown,
  AIChat, ChatPanel, ChatView, ChatComposer, ChatIntro, ChatSuggestion, // AI chat (§14b)
} from "@semi/ui";

// 2. Style constants (surfaces, buttons, app chrome)
import {
  SHELL_OUTER, SHELL_SIDEBAR, SHELL_MAIN, SHELL_CONTENT,
  CARD, CARD_HOVER, CARD_ACTIVE, HERO, TILE,
  SECTION_HEAD, SECTION_TITLE, COUNT_PILL, EMPTY,
  FIELD_LABEL, FIELD_INPUT, FIELD_TEXTAREA,
  ICON_BTN, ICON_BTN_DANGER, STATUS_PILL, STATUS_DOT, TONAL_SURFACE, BADGE_BASE, STICKY_TOOLBAR,
  MODAL_BACKDROP, MODAL_PANEL, MODAL_HEAD, MODAL_TITLE, MODAL_FOOT, MODAL_CLOSE,
  BTN_PRIMARY, BTN_SECONDARY, BTN_DANGER, BTN_ICON,
  MODAL_BTN_PRIMARY, MODAL_BTN_SECONDARY, MODAL_BTN_DANGER,
  HEADER_ICON_BASE, HEADER_ICON_IDLE, HEADER_ICON_ACTIVE, headerPrimary, HEADER_PILL,
  VIEWPORT_TOOLBAR, VIEWPORT_PILL,
} from "@semi/ui/styles";
```

Trong `app/globals.css`:
```css
@import "tailwindcss";

/* semi-design-system:start */
@import "@semi/ui/tokens.css";
@import "@semi/ui/base.css";
@source "../node_modules/@semi/ui/src";
@source "../node_modules/@semi/ui/styles";
/* semi-design-system:end */
```

App có sẵn chuyển sang Semi từng phần, còn màn cũ với bản Tailwind riêng: không nhập khối trên vào `globals.css`, mà nạp `@semi/ui/scoped.css` (utilities của Semi trong layer `semi`, thắng bản build của app) chỉ ở các route đã chuyển, xem [`docs/BRANDS.md`](docs/BRANDS.md#chuyển-app-sang-semi-từng-phần-migrating-an-app-in-stages). Tạm thời: chuyển xong màn cuối thì về một `globals.css`.

Không khai báo màu hay `@theme` riêng trong app (`brand-override` chặn): màu của một thương hiệu đến từ brand kit (`/semi-brand`), app chỉ nhập `brand.css` của kit ngay dưới khối trên (luôn sau `@semi/ui/tokens.css`: kit ghi đè biến của Semi ở cùng độ ưu tiên, nhập trước thì kit không có tác dụng, kể cả `primaryStyle: "inverted"`).

Trong `app/layout.tsx` (chống nháy sai theme khi tải trang):
```tsx
import { ConfirmHost, ThemeProvider, ThemeScript, ToastHost } from "@semi/ui";

<html lang="vi" data-theme="dark" className="dark" suppressHydrationWarning>
  <head>
    <ThemeScript defaultTheme="dark" />
  </head>
  <body>
    <ThemeProvider defaultTheme="dark">{children}<ConfirmHost /><ToastHost /></ThemeProvider>
  </body>
</html>
```

---

## 4. Quy trình phát hành phiên bản mới (Maintainers)

1. Sửa token tại `tokens/tokens.json` → chạy `npm run build:tokens` để cập nhật `tokens/tokens.css`. Muốn thử trước
   (cỡ chữ, font, bo góc, density, tham số bộ sinh màu): trang **Design Lab** của docs, rồi `npm run lab:apply` ghi patch
   vào đúng file nguồn ([docs/LAB.md](docs/LAB.md)).
2. Nếu thêm/sửa quy tắc UI: cập nhật đồng thời `docs/DESIGN_SYSTEM.md`, `docs/QUICK_REF.md`, `docs/DECISIONS.md` và `lint/semi-lint.mjs`.
3. Chạy kiểm tra:
   ```bash
   npm run check
   ```
   (`check:tokens` + `check:vendor` + `check:version` + `check:manifest` + `typecheck` + `semi-lint` + `npm test`). Nếu đổi component / token:
   `npm run build:manifest`. Kiểm tra trên trình duyệt (contrast AA cả 2 theme, axe, theme, bàn phím):
   ```bash
   npm run build:storybook && npm run test:ui
   ```
4. Nếu sửa `lint/semi-lint.mjs` hoặc `tokens/tokens.json`: chạy `npm run sync:vendor` để cập nhật bản copy trong plugin (`check` sẽ fail nếu quên).
5. Cập nhật `CHANGELOG.md`, chạy `npm run bump -- X.Y.Z` (cập nhật cả 5 manifest, chuyển `ref` của plugin trong marketplace sang tag mới, + `tokens.css`; minor cho thay đổi token/quy tắc, major khi đổi tên/xoá component), commit và gắn tag `vX.Y.Z` ngay sau khi merge (trước khi có tag, cài plugin sẽ lỗi; [`docs/PLUGIN.md`](docs/PLUGIN.md)).
