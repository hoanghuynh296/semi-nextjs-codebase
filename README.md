# Semi Design System (`@semi/ui` + `semi-design` plugin)

> 🌟 **Live Storybook & Icon Catalogue:** [https://hoanghuynh296.github.io/semi-nextjs-codebase/](https://hoanghuynh296.github.io/semi-nextjs-codebase/)
> Xem trực tiếp trên web toàn bộ **170 icons** (search real-time, click copy JSX), Two-Tier Semantic Tokens, Dual-Theme (Dark + Light mode) và Showcase các components chuẩn Bento AppShell.

Hệ thống Design System dùng chung cho toàn bộ dự án web thuộc hệ sinh thái **Semi** (bao gồm **3D Noobs Studio**, `iot`, `bmcu` và các ứng dụng web mới).
Xây dựng cho **Next.js 16 + React 19 + Tailwind CSS 4**, hỗ trợ chuyển đổi giao diện Dark/Light mượt mà không cần `dark:bg-...` thủ công nhờ kiến trúc Semantic Tokens.

Repository này đóng gói **2 sản phẩm trong cùng 1 tag phiên bản (semver)**:
1. **Plugin cho AI Agent (`semi-design`):** chứa bộ quy tắc luôn bật (`rules/AGENTS.md` — tự động hướng dẫn agent mỗi khi viết hoặc sửa giao diện), hook tự chạy lint khi sửa file (`hooks.json`), và **5 slash commands chuyên biệt**:
   - `/semi-init` — **Cài đặt lần đầu** cho một dự án (tự động khởi tạo dự án mới Next.js + Tailwind + `@semi/ui` HOẶC quét, hỏi trắc nghiệm và refactor 4 giai đoạn cho dự án có sẵn / monorepo).
   - `/semi-update` — **Nâng cấp phiên bản** cho dự án đã dùng `@semi/ui` (nâng lên tag mới nhất, đối chiếu `CHANGELOG.md` + kiểm tra cấu trúc và refactor các điểm lệch mới).
   - `/semi-audit` — **Kiểm tra sức khỏe (Read-only)** (chỉ quét và in báo cáo độ đồng nhất token + cấu trúc layout, không cài đặt hay sửa bất kỳ file nào).
   - `/semi-propose` — **Đề xuất tính năng từ dự án con** (quét nhu cầu chưa được `@semi/ui` đáp ứng tại dự án thực tế, cấu trúc issue chuẩn và tạo issue trực tiếp trên GitHub repo lõi).
   - `/semi-triage` — **Đánh giá & Tổng quát hóa Issue (Dành cho Core)** (đọc issue trên GitHub, phân tích tính đúng đắn, đối chiếu rulebook, và thiết kế giải pháp tổng quát cho toàn hệ sinh thái mà không break rule).
2. **NPM Package (`@semi/ui`):** chứa Design Tokens (`tokens.css`, `base.css`), style constants (`@semi/ui/styles`), ~45 React components (danh sách đầy đủ + props: `components.json`) bao gồm cả khung bố cục trang (`AppShell`, `MobileTabBar`, `PageTitle`, `PageTabsTitle`, `SubpageToolbar`, `KpiCard`, `Modal`, …), và công cụ kiểm tra `semi-lint`.

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

> **Lưu ý quyền truy cập (Private Repo):**
> Repo `https://github.com/hoanghuynh296/semi-nextjs-codebase` là **private**. Máy phát triển cần đăng nhập GitHub (`gh auth login && gh auth setup-git` hoặc cấu hình SSH key). Nếu thiếu quyền, `/semi-init` sẽ báo đúng 1 lệnh cần chạy rồi dừng.

---

## 2. Sử dụng trong dự án bằng Slash Command

Sau khi cài plugin, bạn **không cần chạy tay `npm install` hay sửa file cấu hình**. Chỉ cần mở dự án và gõ:

### Trường hợp 1: Dự án mới hoàn toàn (thư mục trống)
```text
/semi-init
```
Agent sẽ tự động:
1. Khởi tạo Next.js 16 + React 19 + Tailwind 4 (`create-next-app`).
2. Cài đặt `@semi/ui` từ tag mới nhất của `github:hoanghuynh296/semi-nextjs-codebase`.
3. Cấu hình `transpilePackages: ["@semi/ui"]`, nối `@semi/ui/tokens.css` + `@semi/ui/base.css` + `@source` vào `app/globals.css`.
4. Dựng sẵn `layout.tsx` (font Geist + Montserrat Alternates, `<ConfirmHost />`) và trang mẫu chuẩn Semi (`AppHeader`, `HERO`, `STICKY_TOOLBAR`, `CARD`, `Pills`, `Chip`, `CustomSelect`, `SearchInput`).
5. Tạo `semi-lint.json`, `AGENTS.md` và kiểm tra `semi-lint` + `tsc` + `npm run build`.

### Trường hợp 2: Dự án có sẵn
```text
/semi-init
```
(hoặc chạy riêng `/semi-audit` nếu chỉ muốn xem báo cáo trước)

Agent sẽ tự động:
1. Chạy `audit.mjs` quét toàn bộ source code (framework, Tailwind v3/v4, thư viện UI đang dùng, bảng màu `#hex` so với token gần nhất, các component tự viết trùng với `@semi/ui`, số lỗi `semi-lint` theo thư mục).
2. Đặt các **câu hỏi trắc nghiệm** cho những quyết định không thể tự suy diễn (ví dụ: xử lý component trùng lặp, màu thương hiệu riêng, lộ trình gỡ thư viện UI cũ, phạm vi refactor).
3. Lập **kế hoạch refactor 4 giai đoạn** (Phase 1: Cài `@semi/ui` + tokens không đổi giao diện → Phase 2: Thay màu/typography/radius bằng token → Phase 3: Thay từng nhóm component → Phase 4: Khóa `semi-lint` + baseline).
4. Sau khi bạn bấm duyệt, agent thực thi từng giai đoạn và đảm bảo `semi-lint` + `tsc` + `build` xanh ở mỗi bước.

### Nâng cấp phiên bản mới
```text
/semi-update
```

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
  Card, AppShell, MobileTabBar, PageTitle, PageTabsTitle, SubpageToolbar, KpiCard, Modal,
  Icon, IconTile,
  AppHeader, PageActions, SidePanel, RefreshButton,
  Chip, Badge, Pills,
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

Nếu một thương hiệu con cần đổi màu nhấn chính (`primary-*`), khai báo `@theme` ngay dưới khối import trên trong `globals.css`.

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

1. Sửa token tại `tokens/tokens.json` → chạy `npm run build:tokens` để cập nhật `tokens/tokens.css`.
2. Nếu thêm/sửa quy tắc UI: cập nhật đồng thời `docs/DESIGN_SYSTEM.md`, `docs/QUICK_REF.md`, `docs/DECISIONS.md` và `lint/semi-lint.mjs`.
3. Chạy kiểm tra:
   ```bash
   npm run check
   ```
   (`check:tokens` + `check:vendor` + `check:version` + `check:manifest` + `typecheck` + `semi-lint` + `npm test`). Nếu đổi component / style:
   `npm run build:manifest`. Kiểm tra trên trình duyệt (contrast AA cả 2 theme, axe, theme, bàn phím):
   ```bash
   npm run build:storybook && npm run test:ui
   ```
4. Nếu sửa `lint/semi-lint.mjs` hoặc `tokens/tokens.json`: chạy `npm run sync:vendor` để cập nhật bản copy trong plugin (`check` sẽ fail nếu quên).
5. Cập nhật `CHANGELOG.md`, chạy `npm run bump -- X.Y.Z` (cập nhật cả 5 manifest + `tokens.css`; minor cho thay đổi token/quy tắc, major khi đổi tên/xoá component), commit và gắn tag `vX.Y.Z`.
