# Semi Design System (`@semi/ui` + `semi-design` plugin)

Hệ thống Design System dùng chung cho toàn bộ dự án web thuộc hệ sinh thái **Semi** (bao gồm **3D Noobs Studio**, `iot`, `bmcu` và các ứng dụng web mới).
Xây dựng cho **Next.js 16 + React 19 + Tailwind CSS 4**.

Repository này đóng gói **2 sản phẩm trong cùng 1 tag phiên bản (semver)**:
1. **Plugin cho AI Agent (`semi-design`):** chứa bộ quy tắc (`rules/AGENTS.md`), hook tự chạy lint khi sửa file (`hooks.json`), và 4 skills:
   - `semi-ui` — tự động kích hoạt khi agent viết hoặc sửa giao diện.
   - `/semi-init` — tự động khởi tạo dự án mới hoặc phân tích + refactor dự án có sẵn sang Semi Design System (user không cần gõ tay `npm install`).
   - `/semi-audit` — quét dự án có sẵn, liệt kê màu/component trùng lặp, đặt câu hỏi trắc nghiệm cho user và lập kế hoạch refactor 4 giai đoạn.
   - `/semi-update` — nâng cấp `@semi/ui` lên tag mới nhất, kiểm tra `CHANGELOG.md` và chạy `semi-lint` + `tsc`.
2. **NPM Package (`@semi/ui`):** chứa Design Tokens (`tokens.css`, `base.css`), style constants (`@semi/ui/styles`), 17 React components (`@semi/ui`), và công cụ kiểm tra `semi-lint`.

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

---

## 3. Cấu trúc xuất (Exports) của `@semi/ui`

```tsx
// 1. Components
import {
  Icon, IconTile,
  AppHeader, PageActions, SidePanel, RefreshButton,
  Chip, Pills,
  CustomSelect, CustomCombobox, NumberInput, NumPadPopup, DatePicker, SearchInput, Pagination,
  Skeleton, SkeletonCard, SkeletonGrid, SkeletonRows, PageSkeleton,
  confirmDialog, ConfirmHost,
  ExternalLink, Markdown,
} from "@semi/ui";

// 2. Style constants (surfaces, buttons, app chrome)
import {
  CARD, CARD_HOVER, CARD_ACTIVE, HERO, TILE,
  SECTION_HEAD, SECTION_TITLE, COUNT_PILL, EMPTY,
  ICON_BTN, ICON_BTN_DANGER, STATUS_PILL, STATUS_DOT, STICKY_TOOLBAR,
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

---

## 4. Quy trình phát hành phiên bản mới (Maintainers)

1. Sửa token tại `tokens/tokens.json` → chạy `npm run build:tokens` để cập nhật `tokens/tokens.css`.
2. Nếu thêm/sửa quy tắc UI: cập nhật đồng thời `docs/DESIGN_SYSTEM.md`, `docs/QUICK_REF.md`, `docs/DECISIONS.md` và `lint/semi-lint.mjs`.
3. Chạy kiểm tra:
   ```bash
   npm run check
   ```
4. Cập nhật `CHANGELOG.md`, nâng `version` trong `package.json` và `plugin/plugin.json` (minor cho thay đổi token/quy tắc, major khi đổi tên/xoá component), commit và gắn tag `vX.Y.Z`.
