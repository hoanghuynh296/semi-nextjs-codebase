# Semi Design System — Icon Registry & Semantic Guide

Tài liệu chuẩn hoá toàn bộ biểu tượng (Icons) trong hệ sinh thái **Semi** (`@semi/ui`).
Mọi dự án web thuộc Semi (bao gồm `3D Noobs Studio`, `auton`, `iot`, `bmcu`) **bắt buộc** phải tuân theo hướng dẫn này để đảm bảo tính đồng bộ thị giác và ngữ nghĩa.

---

## 1. Nguyên tắc cốt lõi (Core Rules)

1. **Một component duy nhất:** Sử dụng `<Icon name="..." />` hoặc `<IconTile name="..." tone="..." />` từ `@semi/ui`.
2. **Không dùng inline SVG:** Không được copy `<svg><path ... /></svg>` vào file giao diện.
3. **Không dùng Unicode Glyphs:** Không dùng `✓`, `✕`, `✗`, `⚠`, `☑`, `☒` — luôn dùng `check`, `close`, `alert`.
4. **Chuẩn đồ hoạ:** ViewBox `0 0 24 24`, nét vẽ `strokeWidth={1.75}`, `stroke="currentColor"`, `fill="none"`.
5. **Dùng đúng ngữ nghĩa (Semantic consistency):** Mỗi icon được chỉ định rõ ràng cho một mục đích cụ thể. Không dùng sai ngữ cảnh (ví dụ: dùng `close` để xoá dữ liệu là vi phạm nghiêm trọng).

---

## 2. Bảng tra cứu Semantic Action Mapping (Dành cho Dev & AI Agent)

Khi cần hiển thị biểu tượng cho một hành động hoặc trạng thái, tra cứu bảng sau để chọn đúng `IconName`:

### 2.1. Thao tác dữ liệu & CRUD (Data Actions)

| Ý định / Hành động | Icon chuẩn (`IconName`) | Code mẫu | Không được dùng / Lưu ý |
|---|---|---|---|
| **Thêm mới / Tạo mới** | `plus` | `<Icon name="plus" />` | Không dùng cho xem thêm |
| **Chỉnh sửa / Đổi tên** | `edit` | `<Icon name="edit" />` | Không dùng cho thêm mới |
| **Sao chép / Nhân bản** | `copy` | `<Icon name="copy" />` | Không dùng cho lưu file |
| **Xoá / Huỷ bỏ vĩnh viễn** | `trash` | `<Icon name="trash" />` | **CẤM** dùng `close` để xoá dữ liệu |
| **Tìm kiếm / Tra cứu** | `search` | `<SearchInput />` | Đã tích hợp sẵn trong SearchInput |
| **Lọc chuyên sâu (bộ lọc)** | `filter` | `<Icon name="filter" />` | Không nhầm với ô tìm kiếm từ khoá |
| **Tải lại / Đồng bộ dữ liệu** | `refresh` | `<RefreshButton />` hoặc `<Icon name="refresh" />` | Không dùng `undo` hay `reset` |
| **Tải file về máy / Xuất file** | `download` | `<Icon name="download" />` | Không dùng cho nút Lưu trên cloud |
| **Tải file lên / Nhập file** | `upload` | `<Icon name="upload" />` | Dùng trong dropzone upload |
| **Hoàn tác bước vừa làm** | `undo` | `<Icon name="undo" />` | Không dùng thay cho nút Back chuyển trang |
| **Khôi phục mặc định ban đầu** | `reset` | `<Icon name="reset" />` | Dùng trong form cấu hình / filter reset |
| **Gửi lệnh / Gửi tin nhắn** | `send` | `<Icon name="send" />` | Dùng cho chat AI / G-code terminal |

---

### 2.2. Điều hướng & Khung ứng dụng (Navigation & App Shell)

| Ý định / Hành động | Icon chuẩn (`IconName`) | Code mẫu | Không được dùng / Lưu ý |
|---|---|---|---|
| **Đóng modal / sidepanel / toast** | `close` | `<Icon name="close" />` | **CẤM** dùng `trash` để đóng cửa sổ |
| **Quay lại trang trước (Back)** | `back` | `<Icon name="back" />` | Nút back góc trái SubpageToolbar |
| **Tiếp tục / Bước tiếp theo** | `arrowRight` | `<Icon name="arrowRight" />` | Nút wizard / chuyển bước |
| **Mở rộng / Thu gọn dropdown** | `chevronDown` / `chevronUp` | `<Icon name="chevronDown" />` | Tích hợp sẵn trong CustomSelect |
| **Xem chi tiết hàng (danh sách)** | `chevron` | `<Icon name="chevron" />` | Mũi tên trỏ sang phải ở cuối row |
| **Mở sang tab mới / web ngoài** | `external` | `<ExternalLink href="..." />` | Không dùng cho link nội bộ app |
| **Thu gọn / Mở rộng sidebar** | `sidebar` | `<Icon name="sidebar" />` | Chân sidebar AppShell (w-52 / w-14) |
| **Toàn màn hình / Thu nhỏ** | `expand` / `shrink` | `<Icon name="expand" />` | Xem camera / 3D viewport |
| **Menu di động phụ** | `menu` | `<Icon name="menu" />` | Dùng khi không có MobileTabBar |

---

### 2.3. Trạng thái & Phản hồi (Status & Feedback)

| Trạng thái | Icon chuẩn (`IconName`) | Code mẫu | Không được dùng / Lưu ý |
|---|---|---|---|
| **Thành công / Hoàn thành / Chọn** | `check` | `<Icon name="check" />` | **CẤM** dùng ký tự `✓` |
| **Lỗi / Cảnh báo / Sự cố nguy hiểm** | `alert` | `<Icon name="alert" />` | **CẤM** dùng ký tự `⚠` |
| **Thông tin giải thích / Tooltip** | `info` | `<Icon name="info" />` | Đặt cạnh nhãn FIELD_LABEL |
| **Khoá / Bảo mật / Mật khẩu** | `lock` | `<Icon name="lock" />` | Kết nối mã hoá, Access code |
| **Mở khoá** | `unlock` | `<Icon name="unlock" />` | Mở khoá trục máy / tính năng |
| **Bị cấm / Chặn thao tác** | `block` | `<Icon name="block" />` | Tính năng bị vô hiệu hoá |
| **Hiện mật khẩu / Xem layer** | `eye` | `<Icon name="eye" />` | Không dùng cho camera |
| **Ẩn mật khẩu / Ẩn layer** | `eyeOff` | `<Icon name="eyeOff" />` | |
| **Tính năng AI / Tự động thông minh** | `sparkles` | `<Icon name="sparkles" />` | AI Chat, Auto Palette |

---

### 2.4. Người dùng, Thương mại & Thực thể (Users, Commerce & Entities)

| Thực thể / Chức năng | Icon chuẩn (`IconName`) | Code mẫu | Không được dùng / Lưu ý |
|---|---|---|---|
| **Hồ sơ cá nhân / Khách hàng** | `user` | `<Icon name="user" />` | Không dùng cho nhóm nhiều người |
| **Đội ngũ / Nhóm / Danh sách khách** | `users` | `<Icon name="users" />` | Quản lý team / quyền nhóm |
| **Chuông thông báo hệ thống** | `bell` | `<Icon name="bell" />` | Chuông trên header / tin tức |
| **Thẻ phân loại / Nhãn / Danh mục** | `tag` | `<Icon name="tag" />` | Phân loại sản phẩm / thẻ nhựa |
| **Giỏ hàng / Mua sắm** | `cart` | `<Icon name="cart" />` | Không dùng cho kho lưu trữ nhựa |
| **Giá tiền / Chi phí / Doanh thu** | `coin` | `<Icon name="coin" />` | Chi phí VND, chi phí in ấn |
| **Kho hàng / Kiện hàng / Mô hình** | `box` | `<Icon name="box" />` | Inventory, kiện hàng vận chuyển |
| **Đăng xuất tài khoản** | `logout` | `<Icon name="logout" />` | Menu tài khoản (không dùng cho tắt máy) |

---

### 2.5. Thiết bị, Phần cứng & IoT (Devices & Hardware)

| Thiết bị / Chức năng | Icon chuẩn (`IconName`) | Code mẫu | Ghi chú |
|---|---|---|---|
| **Bật / Tắt nguồn thiết bị** | `power` | `<Icon name="power" />` | Công tắc nguồn máy in / ổ cắm |
| **Đèn chiếu sáng buồng in / bàn** | `light` | `<Icon name="light" />` | Công tắc đèn chiếu |
| **Cảm biến nhiệt độ & độ ẩm** | `sensor` | `<Icon name="sensor" />` | Chỉ số môi trường |
| **Độ ẩm (Humidity)** | `drop` | `<Icon name="drop" />` | Phần trăm độ ẩm hộp sấy nhựa |
| **Đầu phun nhựa (Hotend / Nozzle)**| `nozzle` | `<Icon name="nozzle" />` | Nhiệt độ đầu phun, cỡ lỗ phun |
| **Bàn nhiệt (Heatbed / Plate)** | `bed` | `<Icon name="bed" />` | Nhiệt độ bàn in, trạng thái bàn |
| **Quạt làm mát (Fan)** | `fan` | `<Icon name="fan" />` | Tốc độ quạt Part/Aux fan |
| **Tín hiệu Wi-Fi / Mạng không dây**| `wifi` | `<Icon name="wifi" />` | Cường độ sóng Wi-Fi |
| **Thiết bị ngoại vi (Peripherals)** | `plug` | `<Icon name="plug" />` | Ổ cắm phụ trợ Tuya/Sonoff |
| **Kích hoạt tự động / Điện năng** | `zap` | `<Icon name="zap" />` | Tab Tự động hoá (Automation) |
| **Camera buồng in / RTSP** | `camera` | `<Icon name="camera" />` | Video luồng trực tiếp |
| **Máy in 3D (3D Printer)** | `printer` | `<Icon name="printer" />` | Thiết bị máy in chính |
| **Ứng dụng di động (Mobile App)** | `smartphone` | `<Icon name="smartphone" />` | Tải app điện thoại |

---

### 2.6. Slicing 3D & Sáng tạo (3D Slicing & Creative)

| Công cụ | Icon chuẩn (`IconName`) | Code mẫu | Ghi chú |
|---|---|---|---|
| **Cắt lớp mô hình (Slicer)** | `slicer` | `<Icon name="slicer" />` | Tab Slicer chính |
| **Bảng màu / Color Studio** | `palette` | `<Icon name="palette" />` | Công cụ phối màu đa sắc |
| **Cọ quét màu (Paint Brush)** | `brush` | `<Icon name="brush" />` | Tô màu mesh thủ công |
| **Cắt phân chia part (Part Split)** | `scissors` | `<Icon name="scissors" />` | Cắt rời mô hình 3D |
| **Cuộn nhựa (Filament Spool)** | `spool` | `<Icon name="spool" />` | Kho nhựa, cuộn AMS |
| **Lớp in / Đĩa in (Layers / Plates)**| `layers` | `<Icon name="layers" />` | Xem lát cắt layer G-code |
| **Hợp nhất chi tiết (Merge)** | `merge` | `<Icon name="merge" />` | Gộp mesh trong 3D |
| **Gán màu ngẫu nhiên (Shuffle)** | `shuffle` | `<Icon name="shuffle" />` | Xáo trộn màu ngẫu nhiên |

---

### 2.7. Tệp tin, Mã nguồn & Hệ thống (Files, Code & System)

| Đối tượng | Icon chuẩn (`IconName`) | Code mẫu | Ghi chú |
|---|---|---|---|
| **Tệp tin đơn lẻ** | `file` | `<Icon name="file" />` | File G-code, 3MF, STL |
| **Thư mục chứa file** | `folder` | `<Icon name="folder" />` | Nhóm preset, thư mục |
| **Mã lập trình / G-code script** | `code` | `<Icon name="code" />` | Khối code G-code |
| **Bảng điều khiển lệnh (Console/CLI)**| `terminal`| `<Icon name="terminal" />` | Log máy in, terminal |
| **Nhánh phiên bản / Rẽ nhánh** | `branch` | `<Icon name="branch" />` | Nhánh rẽ if/else trong automation |
| **Biểu đồ thống kê số liệu** | `chart` | `<Icon name="chart" />` | Giờ in, báo cáo |
| **Lịch ngày tháng** | `calendar` | `<DatePicker />` | Lên lịch hẹn giờ in |
| **Đồng hồ / Thời gian còn lại** | `clock` | `<Icon name="clock" />` | Đếm ngược thời gian in |
| **Lưới toạ độ bàn in (Grid)** | `grid` | `<Icon name="grid" />` | Lưới 3D viewport |
| **Hình ảnh xem trước (Thumbnail)** | `image` | `<Icon name="image" />` | Ảnh chụp mô hình |
| **Dấu trừ / Giảm số lượng** | `minus` | `<Icon name="minus" />` | Nút trừ trong NumberInput |

---

## 3. Quy tắc tránh nhầm lẫn từ khoá (Aliases & Anti-patterns)

Khi lập trình, nếu viết các từ khoá sau thì `semi-lint` hoặc `tsc` sẽ báo lỗi:

| Từ khoá sai phổ biến | Icon chuẩn bắt buộc dùng | Giải thích |
|---|---|---|
| `delete`, `remove`, `bin` | `trash` | Xoá dữ liệu dùng thùng rác `trash` |
| `cancel`, `exit`, `x`, `cross` | `close` | Huỷ bỏ / đóng cửa sổ dùng `close` |
| `sync`, `reload` | `refresh` | Làm mới dữ liệu dùng `refresh` |
| `add`, `new`, `create` | `plus` | Thêm mới dùng `plus` |
| `pencil`, `modify`, `rename` | `edit` | Chỉnh sửa dùng `edit` |
| `duplicate`, `clone` | `copy` | Nhân bản dùng `copy` |
| `warning`, `error`, `danger` | `alert` | Cảnh báo / lỗi dùng `alert` |
| `tick`, `done`, `success` | `check` | Hoàn thành dùng `check` |
| `gear`, `cog`, `config` | `settings` | Cài đặt dùng `settings` |
| `parameters`, `tune`, `adjust` | `sliders` | Tuỳ chỉnh thông số kỹ thuật dùng `sliders` |
| `funnel` | `filter` | Lọc danh sách dùng `filter` |
| `profile`, `account` | `user` | Tài khoản cá nhân dùng `user` |
| `team`, `members`, `group` | `users` | Nhóm người dùng dùng `users` |
| `notification`, `notifications`| `bell` | Chuông thông báo dùng `bell` |
| `category`, `label`, `badge` | `tag` | Thẻ phân loại dùng `tag` |
| `price`, `money`, `cost` | `coin` | Giá cả / tiền tệ dùng `coin` |
| `fullscreen`, `maximize` | `expand` | Mở rộng dùng `expand` |
| `minimize`, `exit_fullscreen` | `shrink` | Thu nhỏ dùng `shrink` |
| `ai`, `magic`, `smart` | `sparkles` | Tính năng AI dùng `sparkles` |
| `tooltip`, `help` | `info` | Giải thích dùng `info` |

---

## 4. Bổ sung Icon mới vào Design System (Dành cho Maintainer)

Nếu một dự án mới thực sự cần một icon mới chưa có trong danh mục:
1. **Không tạo icon cục bộ trong project con.**
2. Mở repo `@semi/ui` (`semi-nextjs-codebase`).
3. Lấy path SVG chuẩn Lucide (kích thước viewBox `0 0 24 24`).
4. Thêm key vào `ICONS` trong [`src/Icon.tsx`](file:///Users/claw/Development/bambu-ecosys/semi-nextjs-codebase/src/Icon.tsx).
5. Đăng ký metadata vào `ICON_CATALOG` trong [`src/iconCatalog.ts`](file:///Users/claw/Development/bambu-ecosys/semi-nextjs-codebase/src/iconCatalog.ts) và cập nhật file [`docs/ICONS.md`](file:///Users/claw/Development/bambu-ecosys/semi-nextjs-codebase/docs/ICONS.md) này.
6. Chạy `npm run check`, nâng version và tạo tag release mới. Mọi app khác chỉ cần chạy `/semi-update` là nhận được icon mới.
