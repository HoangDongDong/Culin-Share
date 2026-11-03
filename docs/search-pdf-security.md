# Tìm kiếm, PDF và bảo mật — 03/11/2026

## Cập nhật và sử dụng

Sau khi pull code, chạy `npm install` trong `backend` và `frontend`, rồi khởi động backend/frontend như bình thường. Backend tự áp dụng migration `202611030001-search-indexes`; không reset dữ liệu. Font Noto Sans và giấy phép OFL được đóng kèm frontend, PDF không gọi dịch vụ ngoài.

Trang tìm kiếm, ô tìm kiếm trang chủ và Header có gợi ý sau 300 ms, từ 2 ký tự, hỗ trợ ↑ ↓ Enter Esc và hủy request cũ. Chọn gợi ý hoặc nhấn tìm kiếm để xem kết quả. Danh sách kết quả được lọc/phân trang tại backend, không còn lọc trên 50 món tải về.

`GET /api/recipes` nhận `q`, `category` (nhiều tên/slug phân cách bằng dấu phẩy, khớp một trong các danh mục), `difficulty`, `sort=newest|rating`, `page`, `limit`, `author_id`, `minCalories`, `maxCalories`, `minTime`, `maxTime`. Thời gian tính cả chuẩn bị và nấu; giới hạn hai đầu bao gồm giá trị bằng. Calo dùng trường `recipes.calories` hiện có, không tự ước tính lại dữ liệu dinh dưỡng. `GET /api/recipes/suggestions?q=...` trả tối đa 8 tên món/nguyên liệu công khai. Tất cả điều kiện lọc lưu trong URL.

Tủ lạnh AI có nút **Tải danh sách đi chợ PDF** sau khi nhận kết quả. PDF dùng đúng danh sách thiếu đang hiển thị, giữ mục cần kiểm tra định lượng, không gọi lại AI, không đưa gia vị cơ bản trở lại danh sách. Có font tiếng Việt, ô đánh dấu, xuống dòng và chia trang A4. Nút bị khóa khi không thiếu nguyên liệu.

## MySQL

Migration thêm cột generated `recipes.total_time_minutes`, index `(status,created_at,id)`, `(author_id,status,created_at)`, `(status,calories)`, `(status,total_time_minutes)`, `reviews(recipe_id,rating)` và `saved_recipes(recipe_id,created_at)`. Index `author_id`, `category_id` hiện có được giữ lại, không thêm bản sao đơn cột.

Kiểm tra tại database phát triển: tìm có dấu/không dấu cho `đậu hũ`, `phở gà`, `bún bò` cho cùng ID; phân trang không trùng; calo/thời gian đúng điều kiện. EXPLAIN truy vấn lọc thời gian dùng `idx_recipe_status_time`, kiểu `range`, ước tính 5 hàng trên dữ liệu hiện có. Đây không phải benchmark tải lớn. Tìm substring có chuẩn hóa vẫn có thể quét dữ liệu; index B-tree không giải quyết `LIKE '%...%'`. Điểm đánh giá trung bình vẫn là phép tổng hợp, không cam kết được tăng tốc chỉ bằng index rating.

## Các lỗi đã vá

- Query tìm kiếm được kiểm tra kiểu, độ dài, giới hạn số, khoảng min/max và whitelist sort; giá trị SQL dùng placeholder; ký tự wildcard được escape.
- Công thức chưa xuất bản chỉ tác giả/admin được đọc; lưu, bình luận, đánh giá yêu cầu công thức công khai; trả lời phải cùng công thức.
- `/api/me/saved-recipes` chỉ trả dữ liệu tài khoản trong JWT, bỏ qua query `userId`; tab lưu trên hồ sơ chỉ xuất hiện với chủ tài khoản.
- API hồ sơ công khai dùng DTO riêng, không trả email, điện thoại, địa chỉ, sức khỏe, ngân sách hay thông tin xác thực.
- URL dữ liệu mới chỉ nhận HTTP/HTTPS, kiểm tra cả steps/images JSON; helper ảnh chặn URL thực thi và SVG data URL. Nội dung chữ tiếp tục render bằng React, không dùng HTML thô.
- Yêu cầu ghi từ browser bị kiểm tra Origin; origin lạ/null bị chặn. API vẫn chỉ dùng Authorization Bearer, không xác thực bằng cookie. Nếu chuyển sang auth cookie phải thiết kế CSRF token và thuộc tính cookie tương ứng.
- Thêm security headers, giới hạn body, lỗi production không lộ lỗi nội bộ; bỏ fallback in/trả OTP khi SMTP thất bại (trả 503).
- Cập nhật thư viện runtime, thay adapter upload cũ bằng adapter Multer cho Cloudinary SDK mới; không đổi Cloudinary credentials. `.env.example` dùng placeholder cho secret; khóa từng bị chia sẻ/commit cần được chủ tài khoản thay tại nhà cung cấp.

## Kiểm tra

- `node --test tests/*.test.cjs`: 47 tests đạt, gồm regression query/phân quyền/Origin/URL/OTP, PDF và adapter upload/email.
- 25 đối chiếu tìm kiếm MySQL và 8 kiểm tra HTTP thực tế đạt; không sửa dữ liệu hay gửi thông báo.
- Build frontend và lint các module tìm kiếm/PDF/Header/Home/API đạt. Kiểm tra viewport tìm kiếm 360/390/768 px; tủ lạnh/cộng đồng/trang chủ 390 px không tràn ngang. Chưa kiểm tra trên thiết bị iOS/Android vật lý.
- PDF dài 5 trang được render và trích xuất kiểm tra đủ tiếng Việt/mục cuối. Một file PDF tải thành công từ trình duyệt tại viewport mobile bằng module export thật và dữ liệu kiểm thử; chưa chạy lại AI chỉ để kiểm tra tải file.
- `npm audit --omit=dev` ở backend và frontend: không có cảnh báo runtime sau cập nhật. Tool phát triển ESLint/nodemon còn cảnh báo moderate về minimatch; không áp dụng downgrade cưỡng bức của audit.
- Cloudinary adapter và email đã kiểm tra contract/bộ tạo thư; không gửi email thật hoặc upload ảnh người dùng trong lần kiểm tra này.

Không bổ sung Docker, CI/CD, E2E toàn hệ thống hoặc triển khai production trong đợt này.
