# Cập nhật database cho thành viên dự án

Sau khi pull mã mới, cấu hình `backend/.env` cho MySQL trên máy mình rồi chạy:

```powershell
cd backend
npm install
npm run dev
```

Backend tự kiểm tra migration **trước khi mở cổng HTTP**. Database đang có được cập nhật tại chỗ; database chưa tồn tại được tạo nếu tài khoản MySQL có quyền. Với database trống, runner lấy schema/dữ liệu nền từ `init.sql` nhưng loại bỏ toàn bộ `DROP DATABASE`, `DROP TABLE`, `CREATE DATABASE` cứng và `USE` cứng. Luôn sử dụng database trong `DB_NAME`.

Không import trực tiếp `init.sql` lên database đang dùng vì file gốc chứa lệnh reset. `node database/migrate.js` hiện là lệnh cập nhật an toàn, không còn reset database.

## Các lệnh

```powershell
npm run db:migrate           # Chỉ cập nhật schema
npm run db:seed              # Cập nhật schema + thêm các seed chưa chạy
npm run db:update            # Giống cơ chế tự cập nhật lúc khởi động
npm run db:verify-community  # Kiểm tra bảng, dữ liệu và phiên bản đã áp dụng
npm run db:verify-community-api # Kiểm tra chức năng/phân quyền bằng dữ liệu demo, rollback sau kiểm tra
node database/verify-community.js --check-constraints
```

Lệnh kiểm tra ràng buộc chèn dữ liệu thử trong transaction rồi rollback. Cần seed demo trước khi chạy.

## Schema Cộng đồng

| Bảng | Khóa ngoại |
|---|---|
| `community_posts` | `author_id → users.id` |
| `community_post_media` | `post_id → community_posts.id` |
| `community_post_recipes` | `post_id → community_posts.id`, `recipe_id → recipes.id` |
| `community_post_likes` | `post_id → community_posts.id`, `user_id → users.id` |
| `community_comments` | `post_id → community_posts.id`, `user_id → users.id`, `(post_id,parent_id) → community_comments(post_id,id)` |
| `community_reports` | `reporter_id/reviewed_by → users.id`, `post_id → community_posts.id`, `comment_id → community_comments.id` |
| `community_topics` | Danh mục nhóm cộng đồng; `community_posts.topic_slug` tham chiếu `slug` |
| `community_saved_posts` | `post_id → community_posts.id`, `user_id → users.id`; khóa ghép chống lưu trùng |
| `community_challenges` | `created_by → users.id`; `community_posts.challenge_id` tham chiếu thử thách |
| `community_challenge_participants` | `challenge_id → community_challenges.id`, `user_id → users.id` |
| `community_events` | `created_by → users.id` |
| `community_event_registrations` | `event_id → community_events.id`, `user_id → users.id` |

`notifications` thêm `post_id`, `community_comment_id` và các loại thông báo cộng đồng, giữ lại loại thông báo hiện có. Khóa ngoại của thông báo dùng `SET NULL` khi đối tượng bị xóa thật. Bình luận trả lời phải cùng bài; like/công thức gắn vào bài có khóa ghép chống trùng; báo cáo bắt buộc có đúng một đối tượng. Bài/bình luận có `deleted_at` phục vụ xóa mềm. Các FK `CASCADE` chỉ hoạt động khi xóa thật.

## Dữ liệu mẫu

Seed `202610280001-community-demo` tạo một lần:

- 3 tài khoản demo, email `community.*@example.invalid` theo các địa chỉ trong seed, tên hiển thị ghi rõ tài khoản mẫu. Mật khẩu ngẫu nhiên được hash; không có mật khẩu dùng chung hoặc email gửi ra ngoài.
- 4 bài (3 công khai, 1 ẩn), 5 lượt thích, 3 bình luận gồm một trả lời và một bình luận ẩn, 2 báo cáo, 2 thông báo chỉ gửi cho tài khoản demo.
- Tối đa 2 mapping công thức và 2 ảnh, lấy từ công thức đã xuất bản có sẵn. Nếu kho công thức chưa có bài hoặc ảnh thì bỏ các liên kết/ảnh tương ứng.

Không gán bài demo hay gửi thông báo mẫu cho người dùng thật. Ảnh mẫu dùng URL ảnh công thức có sẵn, `public_id = NULL`; khi xóa bài mẫu không được xóa tài nguyên Cloudinary dùng chung.

Seed tự chạy trên môi trường phát triển. `NODE_ENV=production` mặc định không seed demo, và database mới chỉ khởi tạo schema nền, không nạp dữ liệu mẫu trong `init.sql`. Đặt `COMMUNITY_SEED_DEMO=false` để tắt seed cộng đồng tự động trên máy cá nhân; `npm run db:seed` là yêu cầu seed cộng đồng tường minh, vẫn chạy được. Schema luôn tự cập nhật.

## Quy tắc cho thành viên đóng góp

1. Tạo file `database/migrations/YYYYMMDDNNNN-ten-thay-doi.js`, export `async up(connection)`.
2. Nếu cần dữ liệu mới, tạo seed có phiên bản mới trong `database/seeds/`.
3. Commit/push các file migration, seed, runner và thay đổi khởi động. Các thành viên pull về rồi chạy backend để cập nhật database riêng của họ.
4. **Không sửa file migration/seed đã chạy.** Checksum phát hiện thay đổi và yêu cầu tạo phiên bản mới. Hash chuẩn hóa CRLF/LF để Windows và Linux dùng chung được.

`schema_migrations` và `schema_seeds` ghi nhận phiên bản. Named lock MySQL ngăn nhiều tiến trình cập nhật cùng lúc. Seed chạy trong transaction. DDL MySQL không rollback như DML, nên migration kiểm tra từng cột/FK trước khi thêm để chạy tiếp được sau lỗi giữa chừng. Nếu migration lỗi, backend dừng trước khi nhận request.

Yêu cầu MySQL 8.0.16 trở lên để CHECK constraint được thực thi; tài khoản DB cần quyền tạo/sửa bảng và thêm dữ liệu, đồng thời cần quyền tạo database nếu muốn khởi tạo database mới.

## Giao diện và API Cộng đồng

Trang `/community` và `/community/posts/:id` đã kết nối database. Khách có thể xem bảng tin, tìm bài và đọc bình luận; đăng bài, thích, trả lời và báo cáo yêu cầu đăng nhập. Đăng nhập từ Cộng đồng xong sẽ quay lại bảng tin.

- `GET /api/community/posts`: `tab=latest|popular|following|mine|saved`, `q`, `page`, `limit`, `topic`, `kind`, `challengeId`.
- `POST /api/community/posts`: multipart `content`, `title`, `topic`, `kind`, `challengeId`, `recipeIds` (JSON), `images` (tối đa 4 ảnh, 5 MB mỗi ảnh), tối đa 3 công thức đã xuất bản. Ảnh tải lên Cloudinary theo cấu hình hiện có; giao diện hiển thị tiến độ truyền file.
- `GET /api/community/metadata`: nhóm và số bài thực tế, thành viên, quan hệ theo dõi, thử thách đang mở và sự kiện sắp tới.
- `PUT/DELETE /api/community/posts/:id/save`: lưu/bỏ lưu bài theo tài khoản.
- `POST /api/community/challenges` và `/api/community/events`: admin công bố hoạt động thật với thời gian bắt đầu/kết thúc.
- `PUT/DELETE /api/community/challenges/:id/join` và `/api/community/events/:id/register`: tham gia/hủy tham gia, chống trùng theo tài khoản.
- `GET/PATCH/DELETE /api/community/posts/:id`: xem, sửa nội dung, xóa mềm. Chỉ tác giả sửa; tác giả hoặc admin xóa.
- `PUT/DELETE /api/community/posts/:id/like`: thích/bỏ thích, idempotent.
- `GET/POST /api/community/posts/:id/comments`: đọc phân trang theo `after`, bình luận/trả lời bằng `parentId`.
- `DELETE /api/community/comments/:id`: tác giả bình luận hoặc admin xóa mềm.
- `POST /api/community/posts/:id/report` và `/api/community/comments/:id/report`: báo cáo, chống trùng theo người/đối tượng.
- `GET /api/community/stats`: số bài công khai, số người chia sẻ và tác giả tích cực; không trả email, điện thoại hay hồ sơ riêng tư.

Thông báo thích/bình luận/trả lời được nối với hệ thống notification/socket hiện tại; click thông báo mở bài cộng đồng. Bộ kiểm tra API/service không gửi thông báo và rollback tất cả bản ghi thử. Chức năng báo cáo ghi vào hàng đợi trong database; giao diện quản trị hàng đợi báo cáo và upload video chưa thuộc trang này.

Giao diện không chèn bài viết, số thành viên hoặc sự kiện giả khi API trống/lỗi. Các bài ghi `[Bài mẫu]` là dữ liệu seed có thật trong database, không phải fallback trong frontend. Migration `202610280002-community-features` bổ sung tính năng; seed `202610280002-community-topics` chỉ thêm danh mục, không tự tạo hoạt động hoặc lượt tương tác.
