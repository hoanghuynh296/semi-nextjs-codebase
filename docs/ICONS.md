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
| **Ghim mục lên đầu danh sách** | `pin` | `<Icon name="pin" />` | Dùng cho ghim tab/dự án/mục ưu tiên |
| **Gửi lệnh / Gửi tin nhắn** | `send` | `<Icon name="send" />` | Dùng cho chat AI / G-code terminal |
| **Bắt đầu / Khởi chạy tác vụ** | `play` | `<Icon name="play" />` | Nút Bắt đầu in / Chạy script / Video stream |
| **Tạm dừng in / Tác vụ** | `pause` | `<Icon name="pause" />` | Không dùng cho nút dừng hẳn (dùng `stop`) |
| **Dừng hẳn / Huỷ in khẩn cấp** | `stop` | `<Icon name="stop" />` | Nút Huỷ lệnh in khẩn cấp (kết hợp BTN_DANGER) |
| **Xoá lùi từng ký tự** | `backspace` | `<Icon name="backspace" />` | Bàn phím ảo NumPadPopup (không dùng thay `trash`) |

---

### 2.2. Điều hướng & Khung ứng dụng (Navigation & App Shell)

| Ý định / Hành động | Icon chuẩn (`IconName`) | Code mẫu | Không được dùng / Lưu ý |
|---|---|---|---|
| **Trang chủ / Dashboard chính** | `home` | `<Icon name="home" />` | Breadcrumb hoặc link về root (AppHeader không đặt nút Home) |
| **Mũi tên chéo góc / Shortcut** | `arrow` | `<Icon name="arrow" />` | Chỉ hướng nhanh (không dùng cho liên kết ngoài) |
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

### 2.4. Người dùng & Tài khoản (Users & Account)

| Thực thể / Chức năng | Icon chuẩn (`IconName`) | Code mẫu | Không được dùng / Lưu ý |
|---|---|---|---|
| **Hồ sơ cá nhân / Khách hàng** | `user` | `<Icon name="user" />` | Không dùng cho nhóm nhiều người |
| **Đội ngũ / Nhóm / Danh sách khách** | `users` | `<Icon name="users" />` | Quản lý team / quyền nhóm |
| **Chuông thông báo hệ thống** | `bell` | `<Icon name="bell" />` | Chuông trên header / tin tức |
| **Đăng xuất tài khoản** | `logout` | `<Icon name="logout" />` | Menu tài khoản (không dùng cho tắt máy) |

---

### 2.5. Thương mại điện tử, Đơn hàng & Thanh toán (E-Commerce & Retail)

| Thực thể / Thao tác | Icon chuẩn (`IconName`) | Lucide Alias | Code mẫu | Hướng dẫn sử dụng |
|---|---|---|---|---|
| **Túi mua hàng / Checkout** | `bag` | `shopping-bag` | `<Icon name="bag" />` | Giỏ checkout đơn hàng, mua sắm sản phẩm |
| **Giỏ hàng / Store cart** | `cart` | `shopping-cart` | `<Icon name="cart" />` | Giỏ hàng trong shop / store |
| **Thẻ ngân hàng / Cổng thanh toán**| `creditCard` | `credit-card` | `<Icon name="creditCard" />` | Phương thức thanh toán thẻ (Stripe, VNPay, Visa) |
| **Hoá đơn / Biên lai thanh toán** | `receipt` | `receipt` | `<Icon name="receipt" />` | Hoá đơn mua hàng, biên lai VAT |
| **Vận chuyển / Giao hàng** | `truck` | `truck` | `<Icon name="truck" />` | Trạng thái shipping, đơn vị giao vận logistics |
| **Giao hàng thành công / Nhập kho** | `packageCheck` | `package-check` | `<Icon name="packageCheck" />` | Trạng thái Delivered hoặc đã nhập kho |
| **Khuyến mãi / Giảm giá / Voucher**| `percent` | `percent` | `<Icon name="percent" />` | Mã giảm giá, coupon, chiết khấu % |
| **Cửa hàng / Gian hàng đại lý** | `store` | `store` | `<Icon name="store" />` | Trang đối tác, gian hàng, marketplace |
| **Ví tiền / Số dư tài khoản** | `wallet` | `wallet` | `<Icon name="wallet" />` | Số dư tài khoản ví, nạp/rút tiền |
| **Xác minh chính hãng / Shop Mall**| `badgeCheck` | `badge-check` | `<Icon name="badgeCheck" />` | Shop Mall chính hãng, đối tác đã xác minh |
| **Quà tặng kèm / Tri ân** | `gift` | `gift` | `<Icon name="gift" />` | Quà khuyến mãi, gói quà, phần thưởng tri ân |
| **Yêu thích / Wishlist** | `heart` | `heart` | `<Icon name="heart" />` | Nút tim yêu thích, lưu vào danh sách wishlist |
| **Đánh giá sao / Xếp hạng** | `star` | `star` | `<Icon name="star" />` | Đánh giá sản phẩm (Rating/Review 1-5 sao) |
| **Mã vạch sản phẩm / SKU** | `barcode` | `barcode` | `<Icon name="barcode" />` | Tem mã vạch SKU, máy quét mã vạch kho |
| **Mã QR thanh toán / Chuyển khoản**| `qrCode` | `qr-code` | `<Icon name="qrCode" />` | Quét mã VietQR, thanh toán MoMo/ngân hàng |
| **Tiền mặt / Thanh toán COD** | `banknote` | `banknote` | `<Icon name="banknote" />` | Phương thức giao hàng thu tiền mặt (COD) |
| **Ngân hàng / Chuyển khoản trực tiếp**| `landmark` | `landmark` | `<Icon name="landmark" />` | Tài khoản ngân hàng, chuyển khoản ủy nhiệm |
| **Kiện hàng / Bưu kiện / Đơn hàng** | `package` | `package` | `<Icon name="package" />` | Đơn hàng chờ giao, gói bưu kiện vật lý |
| **Mở kiện hàng / Unboxing** | `packageOpen` | `package-open` | `<Icon name="packageOpen" />` | Đóng gói hàng, khui hàng kiểm tra, đổi trả |
| **Huỷ đơn / Giao thất bại** | `packageX` | `package-x` | `<Icon name="packageX" />` | Đơn hàng bị huỷ, từ chối nhận (bom hàng) |
| **Tạo đơn mới / Thêm hàng kho** | `packagePlus` | `package-plus` | `<Icon name="packagePlus" />` | Tạo đơn thủ công, bổ sung hàng vào kho |
| **Danh sách đơn / Bảng kê hàng** | `clipboardList` | `clipboard-list` | `<Icon name="clipboardList" />` | Sổ quản lý đơn hàng, danh mục phiếu xuất |
| **Địa chỉ nhận / Vị trí giao hàng**| `mapPin` | `map-pin` | `<Icon name="mapPin" />` | Địa chỉ ship hàng, toạ độ bưu cục |
| **Deal hot / Giảm giá sốc** | `badgePercent` | `badge-percent` | `<Icon name="badgePercent" />` | Nhãn Flash Sale, siêu ưu đãi chớp nhoáng |
| **Sản phẩm bán chạy / Hot trend** | `flame` | `flame` | `<Icon name="flame" />` | Best seller, sản phẩm đang thịnh hành |
| **Chiến dịch Marketing / Quảng bá**| `megaphone` | `megaphone` | `<Icon name="megaphone" />` | Chiến dịch marketing, thông báo khuyến mãi |
| **Khách hàng thân thiết / Loyalty** | `award` | `award` | `<Icon name="award" />` | Hạng thành viên (Vàng/VIP), huy hiệu vinh danh |
| **Tính tiền tự động / Ước tính giá**| `calculator` | `calculator` | `<Icon name="calculator" />` | Công cụ tính giá in theo gram, tính phí ship |
| **Giá tiền / Chi phí / Doanh thu** | `coin` | `coins` | `<Icon name="coin" />` | Chi phí VND, chi phí in ấn |
| **Thẻ phân loại / Nhãn sản phẩm** | `tag` | `tag` | `<Icon name="tag" />` | Phân loại sản phẩm / thẻ nhựa |
| **Kho hàng / Kiện hàng / Mô hình** | `box` | `box` | `<Icon name="box" />` | Inventory kho, bounding box 3D |

---

### 2.6. Lập trình, Dữ liệu & DevOps (Developer & DevOps)

| Công cụ / Đối tượng | Icon chuẩn (`IconName`) | Lucide Alias | Code mẫu | Hướng dẫn sử dụng |
|---|---|---|---|---|
| **Cơ sở dữ liệu / SQL Storage** | `database` | `database` | `<Icon name="database" />` | Quản lý CSDL SQLite/PostgreSQL, bảng dữ liệu backend |
| **Máy chủ / Host / Node điều khiển**| `server` | `server` | `<Icon name="server" />` | Trạng thái máy chủ, backend OctoPrint/Klipper |
| **Vi xử lý / Chip MCU / Bo mạch** | `cpu` | `cpu` | `<Icon name="cpu" />` | Mainboard máy in, chip STM32/ESP32, tải CPU |
| **Báo lỗi code / Debug sự cố** | `bug` | `bug` | `<Icon name="bug" />` | Báo cáo lỗi phần mềm, chế độ gỡ lỗi (debug) |
| **Lưu commit / Phiên bản code** | `gitCommit` | `git-commit-horizontal` | `<Icon name="gitCommit" />` | Lịch sử commit Git, phiên bản firmware |
| **Yêu cầu hợp nhất / Đóng góp** | `gitPullRequest` | `git-pull-request` | `<Icon name="gitPullRequest" />` | Đóng góp preset in, review chia sẻ profile |
| **Bảo mật / Chứng chỉ SSL / An toàn**| `shield` | `shield` | `<Icon name="shield" />` | Tường lửa, kết nối an toàn SSL, chứng thực |
| **API Key / Token / Mật mã bí mật**| `key` | `key-round` | `<Icon name="key" />` | Trường nhập API Key, MQTT Token, Access Code |
| **Tích hợp Webhook / Bot trigger** | `webhook` | `webhook` | `<Icon name="webhook" />` | Tích hợp bot thông báo Telegram/Discord/Slack |
| **Mã lập trình / G-code script** | `code` | `code` | `<Icon name="code" />` | Khối code G-code, script tự động hoá |
| **Cửa sổ lệnh console / Terminal** | `terminal` | `terminal` | `<Icon name="terminal" />` | Log thời gian thực, CLI, terminal |
| **Nhánh phiên bản / Rẽ nhánh luồng**| `branch` | `git-branch` | `<Icon name="branch" />` | Điều kiện if/else automation, git branch |

---

### 2.7. Báo cáo, Chỉ số & Đo lường (Analytics & Metrics)

| Chỉ số / Đo lường | Icon chuẩn (`IconName`) | Lucide Alias | Code mẫu | Hướng dẫn sử dụng |
|---|---|---|---|---|
| **Nhịp tim thiết bị / Telemetry live**| `activity` | `activity` | `<Icon name="activity" />` | Heartbeat máy in online, truyền nhận telemetry MQTT |
| **Xu hướng tăng / Tăng trưởng** | `trendingUp` | `trending-up` | `<Icon name="trendingUp" />` | Chỉ số tăng trưởng dương (+%) trên KpiCard |
| **Xu hướng giảm / Sụt giảm chi phí** | `trendingDown` | `trending-down` | `<Icon name="trendingDown" />` | Chỉ số giảm (-%) trên KpiCard, giảm sự cố |
| **Biểu đồ tròn / Cơ cấu tỉ lệ %** | `pieChart` | `chart-pie` | `<Icon name="pieChart" />` | Cơ cấu tiêu thụ nhựa (PLA/PETG), phân bổ đơn hàng |
| **Đồng hồ đo tốc độ / Áp suất / Tải**| `gauge` | `gauge` | `<Icon name="gauge" />` | Tốc độ in thực tế (mm/s), gia tốc, công suất |
| **Biểu đồ thống kê số liệu** | `chart` | `bar-chart` | `<Icon name="chart" />` | Biểu đồ sản lượng, giờ in theo tuần/tháng |
| **Lịch ngày tháng / Hẹn giờ** | `calendar` | `calendar` | `<DatePicker />` | Lên lịch hẹn giờ in ấn tự động |
| **Đồng hồ / Thời gian còn lại** | `clock` | `clock` | `<Icon name="clock" />` | Đếm ngược thời gian in (Remaining time) |
| **Lưới toạ độ bàn in (Grid)** | `grid` | `grid` | `<Icon name="grid" />` | Bật/tắt lưới bàn in 3D viewport |

---

### 2.8. Thiết bị, Phần cứng & IoT (Devices & Hardware)

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

### 2.9. Slicing 3D & Sáng tạo (3D Slicing & Creative)

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
| **Co giãn / Đổi kích thước (Scale)** | `resize` | `<Icon name="resize" />` | Thay đổi tỉ lệ mô hình 3D (không dùng cho fullscreen) |

---

### 2.10. Tệp tin, Tài liệu & Đa phương tiện (Files & Media)

| Đối tượng | Icon chuẩn (`IconName`) | Code mẫu | Ghi chú |
|---|---|---|---|
| **Tệp tin đơn lẻ** | `file` | `<Icon name="file" />` | File G-code, 3MF, STL, cấu hình |
| **Thư mục chứa file** | `folder` | `<Icon name="folder" />` | Nhóm preset, cây thư mục lưu trữ |
| **Hình ảnh xem trước (Thumbnail)** | `image` | `<Icon name="image" />` | Ảnh chụp mô hình, render 3D |
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
| `confirm`, `accept`, `ok` | `check` | Xác nhận hoàn tất dùng `check` |
| `mail`, `email`, `message` | `send` | Gửi tin nhắn / thư từ dùng `send` |
| `link`, `open_link` | `external` | Liên kết ngoài dùng `external` |
| `shutdown`, `turn_off`, `power_off` | `power` | Nguồn thiết bị dùng `power` |
| `scale` | `resize` | Thu phóng mô hình dùng `resize` |
| `decrease` | `minus` | Nút trừ / giảm dùng `minus` |
| `increase` | `plus` | Nút cộng / tăng dùng `plus` |
| `wishlist`, `like`, `favorite` | `heart` | Thích / lưu sản phẩm dùng `heart` |
| `rating`, `review`, `rate` | `star` | Đánh giá xếp hạng sao dùng `star` |
| `present`, `bonus`, `reward` | `gift` | Quà tặng / phần thưởng dùng `gift` |
| `sku`, `scan` | `barcode` | Mã vạch kho SKU dùng `barcode` |
| `qr`, `qr_code`, `vietqr` | `qrCode` | Quét mã QR thanh toán dùng `qrCode` |
| `cash`, `cod`, `money_bill` | `banknote` | Tiền mặt COD dùng `banknote` |
| `bank`, `bank_transfer` | `landmark` | Ngân hàng / chuyển khoản dùng `landmark` |
| `parcel` | `package` | Bưu kiện / kiện hàng dùng `package` |
| `unboxing` | `packageOpen` | Khui hộp / mở kiện hàng dùng `packageOpen` |
| `cancel_order` | `packageX` | Huỷ đơn hàng dùng `packageX` |
| `add_stock`, `new_order` | `packagePlus` | Nhập kho / tạo đơn mới dùng `packagePlus` |
| `order_list`, `orders` | `clipboardList` | Danh sách đơn hàng / bảng kê dùng `clipboardList` |
| `address`, `location` | `mapPin` | Địa chỉ nhận hàng / vị trí dùng `mapPin` |
| `deal`, `flash_sale` | `badgePercent` | Deal hot / siêu giảm giá dùng `badgePercent` |
| `hot`, `trending`, `best_seller`| `flame` | Hàng bán chạy / xu hướng dùng `flame` |
| `marketing`, `promotion` | `megaphone` | Chiến dịch marketing / thông báo dùng `megaphone` |
| `loyalty`, `vip` | `award` | Thành viên thân thiết / huy hiệu dùng `award` |
| `calc`, `calculate`, `estimate` | `calculator` | Tính toán chi phí / giá in dùng `calculator` |
| `verified`, `official`, `mall` | `badgeCheck` | Shop chính hãng / xác minh dùng `badgeCheck` |

---

## 4. Bổ sung Icon mới vào Design System (Dành cho Maintainer)

Nếu một dự án mới thực sự cần một icon mới chưa có trong danh mục:
1. **Không tạo icon cục bộ trong project con.**
2. Mở repo `@semi/ui` (`semi-nextjs-codebase`).
3. Lấy path SVG chuẩn Lucide (kích thước viewBox `0 0 24 24`).
4. Thêm key vào `ICONS` trong [`src/Icon.tsx`](file:///Users/claw/Development/semi/core/nextjs-codebase/src/Icon.tsx).
5. Đăng ký metadata vào `ICON_CATALOG` trong [`src/iconCatalog.ts`](file:///Users/claw/Development/semi/core/nextjs-codebase/src/iconCatalog.ts) và cập nhật file [`docs/ICONS.md`](file:///Users/claw/Development/semi/core/nextjs-codebase/docs/ICONS.md) này.
6. Chạy `npm run check`, nâng version và tạo tag release mới. Mọi app khác chỉ cần chạy `/semi-update` là nhận được icon mới.
