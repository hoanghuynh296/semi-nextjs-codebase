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
| **Toàn màn hình / Thu nhỏ** | `expand` / `shrink` | `<Icon name="expand" />` | Phóng to toàn màn hình, mở rộng / thu nhỏ khung nhìn |
| **Menu di động phụ** | `menu` | `<Icon name="menu" />` | Dùng khi không có MobileTabBar |

---

### 2.3. Trạng thái & Phản hồi (Status & Feedback)

| Trạng thái | Icon chuẩn (`IconName`) | Code mẫu | Không được dùng / Lưu ý |
|---|---|---|---|
| **Thành công / Hoàn thành / Chọn** | `check` | `<Icon name="check" />` | **CẤM** dùng ký tự `✓` |
| **Lỗi / Cảnh báo / Sự cố nguy hiểm** | `alert` | `<Icon name="alert" />` | **CẤM** dùng ký tự `⚠` |
| **Thông tin giải thích / Tooltip** | `info` | `<Icon name="info" />` | Đặt cạnh nhãn FIELD_LABEL |
| **Khoá / Bảo mật / Mật khẩu** | `lock` | `<Icon name="lock" />` | Kết nối mã hoá, Access code |
| **Mở khoá** | `unlock` | `<Icon name="unlock" />` | Mở quyền truy cập / mở khoá chức năng |
| **Bị cấm / Chặn thao tác** | `block` | `<Icon name="block" />` | Tính năng bị vô hiệu hoá |
| **Hiện nội dung / mật khẩu** | `eye` | `<Icon name="eye" />` | Hiển thị mật khẩu, bật hiển thị layer hoặc thông tin ẩn |
| **Ẩn nội dung / mật khẩu** | `eyeOff` | `<Icon name="eyeOff" />` | Che giấu mật khẩu, ẩn layer hoặc tắt hiển thị |
| **Tính năng AI / Tự động thông minh** | `sparkles` | `<Icon name="sparkles" />` | AI Chat, trợ lý thông minh, gợi ý tự động |

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
| **Tính tiền tự động / Ước tính giá**| `calculator` | `calculator` | `<Icon name="calculator" />` | Công cụ tính toán chi phí, tính tiền, báo giá hoặc phí ship |
| **Giá tiền / Chi phí / Doanh thu** | `coin` | `coins` | `<Icon name="coin" />` | Đơn vị tiền tệ, giá cả, chi phí, xu thưởng hoặc doanh thu |
| **Thẻ phân loại / Nhãn sản phẩm** | `tag` | `tag` | `<Icon name="tag" />` | Phân loại danh mục, thẻ sản phẩm, nhãn dán |
| **Kho hàng / Kiện hàng / Thùng chứa**| `box` | `box` | `<Icon name="box" />` | Quản lý kho, thùng hàng, đóng gói hoặc bounding box |

---

### 2.6. Lập trình, Dữ liệu & DevOps (Developer & DevOps)

| Công cụ / Đối tượng | Icon chuẩn (`IconName`) | Lucide Alias | Code mẫu | Hướng dẫn sử dụng |
|---|---|---|---|---|
| **Cơ sở dữ liệu / SQL Storage** | `database` | `database` | `<Icon name="database" />` | Quản lý CSDL (PostgreSQL, SQLite, Redis), bảng dữ liệu |
| **Máy chủ / Host / Hạ tầng mạng** | `server` | `server` | `<Icon name="server" />` | Trạng thái máy chủ, dịch vụ backend, node hạ tầng |
| **Vi xử lý / Chip bán dẫn / Tải CPU**| `cpu` | `cpu` | `<Icon name="cpu" />` | Bo mạch vi xử lý, mức tải CPU, năng lực tính toán |
| **Báo lỗi code / Debug sự cố** | `bug` | `bug` | `<Icon name="bug" />` | Báo cáo lỗi phần mềm, chế độ gỡ lỗi (debug), issue tracker |
| **Lưu commit / Phiên bản code** | `gitCommit` | `git-commit-horizontal` | `<Icon name="gitCommit" />` | Lịch sử commit Git, mốc phiên bản mã nguồn |
| **Yêu cầu hợp nhất / Đóng góp** | `gitPullRequest` | `git-pull-request` | `<Icon name="gitPullRequest" />` | Pull request, merge request, xem xét và đóng góp thay đổi |
| **Bảo mật / Chứng chỉ SSL / An toàn**| `shield` | `shield` | `<Icon name="shield" />` | Tường lửa, kết nối an toàn SSL, chứng thực bảo mật |
| **API Key / Token / Mật mã bí mật**| `key` | `key-round` | `<Icon name="key" />` | Trường nhập API Key, Access Token, mật mã xác thực |
| **Tích hợp Webhook / Bot trigger** | `webhook` | `webhook` | `<Icon name="webhook" />` | Tích hợp webhook, bot thông báo (Slack/Discord/Telegram) |
| **Mã lập trình / Script tự động** | `code` | `code` | `<Icon name="code" />` | Khối mã lập trình, script tự động hoá, macro |
| **Cửa sổ lệnh console / Terminal** | `terminal` | `terminal` | `<Icon name="terminal" />` | Log thời gian thực, CLI, terminal thao tác lệnh |
| **Nhánh phiên bản / Rẽ nhánh luồng**| `branch` | `git-branch` | `<Icon name="branch" />` | Nhánh Git (branch), rẽ nhánh điều kiện logic |

---

### 2.7. Báo cáo, Chỉ số & Đo lường (Analytics & Metrics)

| Chỉ số / Đo lường | Icon chuẩn (`IconName`) | Lucide Alias | Code mẫu | Hướng dẫn sử dụng |
|---|---|---|---|---|
| **Hoạt động / Telemetry / Nhịp tim**| `activity` | `activity` | `<Icon name="activity" />` | Trạng thái hoạt động live, heartbeat kết nối, nhịp độ hệ thống |
| **Xu hướng tăng / Tăng trưởng** | `trendingUp` | `trending-up` | `<Icon name="trendingUp" />` | Chỉ số tăng trưởng dương (+%) trên KpiCard |
| **Xu hướng giảm / Sụt giảm chi phí** | `trendingDown` | `trending-down` | `<Icon name="trendingDown" />` | Chỉ số giảm (-%) trên KpiCard, giảm chi phí/sự cố |
| **Biểu đồ tròn / Cơ cấu tỉ lệ %** | `pieChart` | `chart-pie` | `<Icon name="pieChart" />` | Cơ cấu tỉ lệ %, phân bổ danh mục hoặc thị phần |
| **Đồng hồ đo tốc độ / Áp suất / Tải**| `gauge` | `gauge` | `<Icon name="gauge" />` | Tốc độ xử lý, hiệu năng, áp suất hoặc mức tải hệ thống |
| **Biểu đồ thống kê số liệu** | `chart` | `bar-chart` | `<Icon name="chart" />` | Biểu đồ cột sản lượng, doanh thu, phân tích chu kỳ |
| **Lịch ngày tháng / Hẹn giờ** | `calendar` | `calendar` | `<DatePicker />` | Lên lịch hẹn, ngày giao dịch, chọn mốc thời gian |
| **Đồng hồ / Thời gian thực hiện** | `clock` | `clock` | `<Icon name="clock" />` | Đếm ngược thời gian, thời lượng xử lý, lịch sử giờ |
| **Bố cục dạng lưới / Toạ độ (Grid)**| `grid` | `grid` | `<Icon name="grid" />` | Bố cục hiển thị dạng lưới (grid view), lưới toạ độ không gian |

---

### 2.8. Thiết bị, Phần cứng & IoT (Devices & Hardware)

| Thiết bị / Chức năng | Icon chuẩn (`IconName`) | Code mẫu | Ghi chú |
|---|---|---|---|
| **Bật / Tắt nguồn thiết bị** | `power` | `<Icon name="power" />` | Công tắc nguồn thiết bị, bật/tắt nguồn điện |
| **Nhiệt độ (°C / °F)** | `thermometer` | `<Icon name="thermometer" />` | Nhiệt độ môi trường, bộ gia nhiệt hoặc linh kiện |
| **Bảo trì kỹ thuật / Cờ lê siết ốc**| `wrench` | `<Icon name="wrench" />` | Bảo dưỡng kỹ thuật, cấu hình tham số, sửa chữa |
| **Công cụ cơ khí / Xưởng DIY** | `hammer` | `<Icon name="hammer" />` | Chế tác phần cứng, gia công, thi công, lắp ráp |
| **Bo mạch điện tử / Mạch điều khiển**| `circuitBoard`| `<Icon name="circuitBoard" />` | Mạch vi điều khiển, PCB, phần cứng nhúng |
| **Cổng USB / Thiết bị flash cắm ngoài**| `usb` | `<Icon name="usb" />` | Kết nối cổng USB, nạp firmware, thiết bị lưu trữ USB |
| **Kết nối Bluetooth không dây** | `bluetooth` | `<Icon name="bluetooth" />` | Ghép đôi thiết bị không dây Bluetooth / BLE |
| **Ổ cứng / Bộ nhớ trong / Thẻ nhớ**| `hardDrive` | `<Icon name="hardDrive" />` | Bộ nhớ lưu trữ, thẻ nhớ SD, phân vùng ổ đĩa |
| **Cáp kết nối / Dây truyền tín hiệu**| `cable` | `<Icon name="cable" />` | Cáp mạng, dây dẫn tín hiệu, kết nối vật lý |
| **Pin / Nguồn lưu điện (UPS)** | `battery` | `<Icon name="battery" />` | Mức dung lượng pin, sạc dự phòng, nguồn điện phụ |
| **Quét mã / Quét laser / Scan** | `scanLine` | `<Icon name="scanLine" />` | Quét mã vạch/QR, quét tài liệu, cảm biến quét LiDAR |
| **Cảnh báo an toàn / Nguy hiểm** | `shieldAlert` | `<Icon name="shieldAlert" />` | Cảnh báo vi phạm bảo mật, quá nhiệt, sự cố thiết bị |
| **Đèn chiếu sáng / Đèn hiển thị**| `light` | `<Icon name="light" />` | Bật/tắt đèn chiếu sáng, trạng thái đèn tín hiệu |
| **Cảm biến môi trường / Sensor**| `sensor` | `<Icon name="sensor" />` | Cảm biến chuyển động, đo đạc môi trường IoT |
| **Chất lỏng / Độ ẩm (Humidity)** | `drop` | `<Icon name="drop" />` | Mức chất lỏng, độ ẩm không khí hoặc dung dịch |
| **Đầu phun / Vòi xịt (Nozzle)** | `nozzle` | `<Icon name="nozzle" />` | Đầu phun in 3D, vòi phun chất lỏng, điều tiết dòng chảy |
| **Bàn nhiệt / Mặt phẳng làm việc**| `bed` | `<Icon name="bed" />` | Bàn in nhiệt 3D, mặt phẳng gia công vật liệu |
| **Quạt gió / Tản nhiệt làm mát**| `fan` | `<Icon name="fan" />` | Quạt gió tản nhiệt, hệ thống làm mát, thông gió |
| **Tín hiệu Wi-Fi / Mạng không dây**| `wifi` | `<Icon name="wifi" />` | Cường độ sóng Wi-Fi, kết nối mạng không dây |
| **Phích cắm / Thiết bị ngoại vi** | `plug` | `<Icon name="plug" />` | Ổ cắm điện, kết nối cắm phụ trợ hoặc plugin |
| **Năng lượng điện / Kích hoạt nhanh**| `zap` | `<Icon name="zap" />` | Kích hoạt tức thì, điện năng, tác vụ tự động hoá |
| **Máy ảnh / Camera giám sát** | `camera` | `<Icon name="camera" />` | Camera ghi hình, webcam giám sát hoặc chụp ảnh |
| **Máy in / Lệnh xuất in** | `printer` | `<Icon name="printer" />` | Máy in 3D, máy in văn phòng, thao tác xuất in |
| **Thiết bị di động (Mobile App)**| `smartphone` | `<Icon name="smartphone" />` | Ứng dụng điện thoại di động, thiết bị smartphone |

---

### 2.9. Công cụ Sáng tạo & Biên tập (Creative & Editing Tools)

| Công cụ | Icon chuẩn (`IconName`) | Code mẫu | Ghi chú |
|---|---|---|---|
| **Cắt lớp mô hình 3D (Slicer)** | `slicer` | `<Icon name="slicer" />` | Công cụ cắt lớp mô hình 3D (Slicer), xem phân lớp |
| **Điều hướng toạ độ / Di chuyển**| `move` | `<Icon name="move" />` | Di chuyển vị trí đối tượng, tịnh tiến toạ độ (Translate) |
| **Xoay theo chiều kim đồng hồ** | `rotateCw` | `<Icon name="rotateCw" />` | Xoay 90° CW, xoay đối tượng hoặc hình ảnh thuận chiều |
| **Xoay ngược chiều kim đồng hồ** | `rotateCcw` | `<Icon name="rotateCcw" />` | Xoay 90° CCW, xoay đối tượng ngược chiều kim đồng hồ |
| **Tâm ngắm / Toạ độ gốc (Origin)**| `crosshair` | `<Icon name="crosshair" />` | Định vị tâm, hiệu chuẩn gốc toạ độ, điểm ngắm |
| **Thước đo khoảng cách (Measure)**| `ruler` | `<Icon name="ruler" />` | Đo đạc khoảng cách, kích thước vật thể hoặc căn lề |
| **Hít dính / Snap mặt phẳng** | `magnet` | `<Icon name="magnet" />` | Snap hút vào lưới toạ độ, áp sát bề mặt làm việc |
| **Hút màu (Color Picker)** | `pipette` | `<Icon name="pipette" />` | Lấy mẫu màu sắc từ hình ảnh hoặc đối tượng giao diện |
| **Hình khối cơ bản (Shapes)** | `shapes` | `<Icon name="shapes" />` | Khối hình học đồ hoạ (vuông, tròn, khối 3D modifier) |
| **Căn giữa tiêu điểm (Focus)** | `focus` | `<Icon name="focus" />` | Căn giữa vùng nhìn, zoom vừa khung hình (Zoom to fit) |
| **Xoay quỹ đạo góc nhìn (Orbit)** | `orbit` | `<Icon name="orbit" />` | Xoay camera không gian 3D, quan sát đa chiều |
| **Bảng màu / Phối màu (Palette)** | `palette` | `<Icon name="palette" />` | Bảng màu thiết kế, công cụ phối màu đa sắc |
| **Cọ quét màu / Nét vẽ (Brush)** | `brush` | `<Icon name="brush" />` | Cọ vẽ tự do, tô màu bề mặt, chỉnh sửa đồ hoạ |
| **Cắt rời / Chia tách (Scissors)** | `scissors` | `<Icon name="scissors" />` | Thao tác cắt rời, phân chia khối, kéo cắt tài liệu |
| **Cuộn vật liệu / Ống dây (Spool)**| `spool` | `<Icon name="spool" />` | Cuộn dây cáp, cuộn sợi vật liệu in ấn filament |
| **Lớp hiển thị / Xếp lớp (Layers)**| `layers` | `<Icon name="layers" />` | Quản lý các lớp đồ hoạ (layers), lát cắt chiều sâu |
| **Hợp nhất đối tượng (Merge)** | `merge` | `<Icon name="merge" />` | Hợp nhất các khối, gộp nhánh code hoặc liên kết dữ liệu |
| **Xáo trộn ngẫu nhiên (Shuffle)** | `shuffle` | `<Icon name="shuffle" />` | Đổi thứ tự ngẫu nhiên, xáo trộn danh sách |
| **Co giãn / Đổi kích thước (Scale)**| `resize` | `<Icon name="resize" />` | Co giãn kích thước đối tượng, điều chỉnh tỉ lệ khung |

---

### 2.10. Tệp tin, Tài liệu & Đa phương tiện (Files & Media)

| Đối tượng | Icon chuẩn (`IconName`) | Code mẫu | Ghi chú |
|---|---|---|---|
| **Tệp tin dữ liệu** | `file` | `<Icon name="file" />` | Tệp tin chung trong hệ thống, dữ liệu đính kèm |
| **Tài liệu văn bản / PDF** | `fileText` | `<Icon name="fileText" />` | Văn bản ghi chú, tài liệu hướng dẫn, file TXT/PDF |
| **Tệp mã nguồn / Script** | `fileCode` | `<Icon name="fileCode" />` | File mã nguồn lập trình, kịch bản lệnh, macro, G-code |
| **Tệp nén lưu trữ / ZIP** | `fileArchive` | `<Icon name="fileArchive" />` | Tệp nén ZIP, TAR, 7Z, gói backup dữ liệu |
| **Tệp đã kiểm tra / Xác thực**| `fileCheck` | `<Icon name="fileCheck" />` | Tệp đã kiểm tra tính toàn vẹn (checksum), file hợp lệ |
| **Tạo tệp mới** | `filePlus` | `<Icon name="filePlus" />` | Thêm tài liệu mới, tạo tệp tin rỗng |
| **Bảng tính Excel / CSV** | `fileSpreadsheet`| `<Icon name="fileSpreadsheet" />`| Bảng tính biểu mẫu, dữ liệu CSV/Excel, sổ thu chi |
| **Thư mục lưu trữ** | `folder` | `<Icon name="folder" />` | Thư mục phân loại, cây thư mục tệp tin |
| **Tạo thư mục mới** | `folderPlus` | `<Icon name="folderPlus" />` | Tạo thư mục mới, tạo nhóm dự án |
| **Mở thư mục duyệt file** | `folderOpen` | `<Icon name="folderOpen" />` | Mở thư mục đang làm việc, duyệt tệp tin |
| **Đính kèm tệp / File kẹp** | `paperclip` | `<Icon name="paperclip" />` | Đính kèm tệp tin vào bình luận, yêu cầu, phiếu việc |
| **Âm lượng loa / Phát âm thanh** | `volume2` | `<Icon name="volume2" />` | Âm lượng hệ thống, còi thông báo, phát âm thanh |
| **Tắt tiếng / Im lặng (Mute)**| `volumeX` | `<Icon name="volumeX" />` | Tắt âm thanh, chế độ im lặng, ngắt tiếng |
| **Tai nghe (Headphones)** | `headphones` | `<Icon name="headphones" />` | Thiết bị tai nghe, đầu ra âm thanh cá nhân |
| **Micro / Thu âm giọng nói** | `mic` | `<Icon name="mic" />` | Thu âm giọng nói, nhập lệnh thoại AI, micro hội thoại |
| **Video trực tiếp / Xem camera** | `video` | `<Icon name="video" />` | Phát video clip, luồng camera giám sát, video call |
| **Tắt video / Riêng tư** | `videoOff` | `<Icon name="videoOff" />` | Ngắt luồng video, bảo mật camera, tắt hình ảnh |
| **Thước phim / Video clip** | `film` | `<Icon name="film" />` | Bộ sưu tập video, phim hoạt cảnh, timelapse |
| **Lùi bài / Khung hình trước** | `skipBack` | `<Icon name="skipBack" />` | Chuyển về bài trước, lùi khung hình video hoặc lớp cắt |
| **Tới bài / Khung hình tiếp** | `skipForward` | `<Icon name="skipForward" />` | Chuyển bài kế tiếp, tiến khung hình video hoặc lớp sau |
| **Lặp lại (Repeat / Loop)** | `repeat` | `<Icon name="repeat" />` | Phát lặp lại danh sách, vòng lặp tác vụ tự động |
| **Tua nhanh tốc độ (2x/4x)** | `fastForward` | `<Icon name="fastForward" />` | Tua nhanh phát video/audio, tăng tốc mô phỏng |
| **Tua lùi (Rewind)** | `rewind` | `<Icon name="rewind" />` | Tua lùi phát media, quay lại đoạn trước |
| **Cắt cúp ảnh (Crop)** | `crop` | `<Icon name="crop" />` | Cắt xén hình ảnh, căn chỉnh khung hình thumbnail |
| **Hình ảnh xem trước (Thumbnail)** | `image` | `<Icon name="image" />` | Ảnh chụp minh hoạ, thumbnail sản phẩm, hình render |
| **Dấu trừ / Giảm số lượng** | `minus` | `<Icon name="minus" />` | Nút trừ giá trị, thu gọn hoặc giảm số lượng |

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
| `scale` | `resize` | Thu phóng, đổi kích thước đối tượng dùng `resize` |
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
| `calc`, `calculate`, `estimate` | `calculator` | Tính toán chi phí / giá trị dùng `calculator` |
| `verified`, `official`, `mall` | `badgeCheck` | Shop chính hãng / xác minh dùng `badgeCheck` |
| `temp`, `temperature`, `heat` | `thermometer` | Nhiệt độ môi trường / thiết bị dùng `thermometer` |
| `spanner`, `maintenance`, `tools`| `wrench` | Bảo trì kỹ thuật / công cụ dùng `wrench` |
| `jog`, `jogging`, `translate` | `move` | Di chuyển vị trí / toạ độ dùng `move` |
| `rotate`, `rotate_cw`, `rotate_right`| `rotateCw` | Xoay thuận chiều kim đồng hồ dùng `rotateCw` |
| `rotate_ccw`, `rotate_left` | `rotateCcw` | Xoay ngược chiều kim đồng hồ dùng `rotateCcw` |
| `homing`, `origin`, `abl` | `crosshair` | Gốc toạ độ / tâm ngắm / chuẩn vị dùng `crosshair` |
| `measure`, `measurement`, `dimension`| `ruler` | Thước đo khoảng cách / kích thước dùng `ruler` |
| `snap`, `lay_on_face` | `magnet` | Hút dính / snap bề mặt dùng `magnet` |
| `eyedropper`, `color_picker` | `pipette` | Hút mẫu màu (picker) dùng `pipette` |
| `primitives`, `modifier`, `geometry`| `shapes` | Hình khối cơ bản đồ hoạ dùng `shapes` |
| `zoom_to_fit`, `center_view` | `focus` | Căn giữa tiêu điểm / khung nhìn dùng `focus` |
| `view_orbit`, `orbit_camera` | `orbit` | Xoay camera 3D / quỹ đạo dùng `orbit` |
| `usb_drive`, `flash_drive` | `usb` | Ổ cắm USB flash dùng `usb` |
| `ble` | `bluetooth` | Kết nối Bluetooth không dây dùng `bluetooth` |
| `sd_card`, `microsd`, `emmc` | `hardDrive` | Thẻ nhớ / ổ đĩa lưu trữ dùng `hardDrive` |
| `mainboard`, `motherboard`, `pcb`| `circuitBoard` | Bo mạch phần cứng / MCU dùng `circuitBoard` |
| `wire`, `wiring` | `cable` | Dây nối tín hiệu / cáp dùng `cable` |
| `power_backup` | `battery` | Pin / nguồn dự phòng dùng `battery` |
| `lidar`, `lidar_scan` | `scanLine` | Quét mã / quét cảm biến dùng `scanLine` |
| `safety_alert`, `door_open` | `shieldAlert` | Cảnh báo an toàn / sự cố dùng `shieldAlert` |
| `document`, `doc`, `pdf`, `txt` | `fileText` | Tài liệu văn bản / PDF dùng `fileText` |
| `gcode`, `gcode_file`, `source_code` | `fileCode` | Tệp mã nguồn / script lập trình dùng `fileCode` |
| `zip`, `archive`, `tar` | `fileArchive` | Tệp nén / gói lưu trữ dùng `fileArchive` |
| `verified_file` | `fileCheck` | Tệp đã kiểm tra / checksum OK dùng `fileCheck` |
| `new_file`, `add_file` | `filePlus` | Tạo tệp mới dùng `filePlus` |
| `excel`, `csv`, `spreadsheet` | `fileSpreadsheet`| Bảng tính Excel / CSV dùng `fileSpreadsheet` |
| `new_folder`, `add_folder` | `folderPlus` | Tạo thư mục mới dùng `folderPlus` |
| `open_folder` | `folderOpen` | Mở / duyệt thư mục dùng `folderOpen` |
| `attach`, `attachment`, `clip` | `paperclip` | Đính kèm tệp tin dùng `paperclip` |
| `sound`, `speaker`, `volume` | `volume2` | Âm lượng / phát âm thanh dùng `volume2` |
| `mute`, `silent` | `volumeX` | Tắt tiếng / im lặng dùng `volumeX` |
| `headset`, `earphones` | `headphones` | Tai nghe dùng `headphones` |
| `microphone`, `voice` | `mic` | Micro / lệnh giọng nói dùng `mic` |
| `cam`, `webcam`, `timelapse`, `stream` | `video` | Video trực tiếp / ghi hình dùng `video` |
| `cam_off`, `webcam_off` | `videoOff` | Tắt video camera dùng `videoOff` |
| `movie`, `reel` | `film` | Thước phim hoạt cảnh dùng `film` |
| `prev_track`, `prev_layer` | `skipBack` | Về bài trước / lùi khung hình dùng `skipBack` |
| `next_track`, `next_layer` | `skipForward` | Tới bài tiếp / tiến khung hình dùng `skipForward` |
| `loop` | `repeat` | Lặp lại phát video dùng `repeat` |
| `fast_forward`, `speed_up` | `fastForward` | Tua nhanh tốc độ dùng `fastForward` |
| `crop_image` | `crop` | Cắt xén hình ảnh dùng `crop` |

---

## 4. Bổ sung Icon mới vào Design System (Dành cho Maintainer)

Nếu một dự án mới thực sự cần một icon mới chưa có trong danh mục:
1. **Không tạo icon cục bộ trong project con.**
2. Mở repo `@semi/ui` (`semi-nextjs-codebase`).
3. Lấy path SVG chuẩn Lucide (kích thước viewBox `0 0 24 24`).
4. Thêm key vào `ICONS` trong [`src/Icon.tsx`](file:///Users/claw/Development/semi/core/nextjs-codebase/src/Icon.tsx).
5. Đăng ký metadata vào `ICON_CATALOG` trong [`src/iconCatalog.ts`](file:///Users/claw/Development/semi/core/nextjs-codebase/src/iconCatalog.ts) và cập nhật file [`docs/ICONS.md`](file:///Users/claw/Development/semi/core/nextjs-codebase/docs/ICONS.md) này.
6. Chạy `npm run check`, nâng version và tạo tag release mới. Mọi app khác chỉ cần chạy `/semi-update` là nhận được icon mới.
