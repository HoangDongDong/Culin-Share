# SEO cho Bếp Nhà Mình / CulinShare

Domain chuẩn: `https://bepnhaminh.page`. Metadata dùng tên CulinShare và Bếp Nhà Mình; nội dung mô tả công thức nấu ăn, cách nấu ăn ngon, món ngon mỗi ngày và cộng đồng chia sẻ công thức, không nhồi meta keywords.

## Đã triển khai

- Một title, description, canonical theo trang, Open Graph, Twitter Card và tiếng Việt. Trang tài khoản, quản trị, công cụ cá nhân, trang lỗi và biến thể tìm kiếm có query được `noindex`.
- Công thức đã xuất bản cho khách đọc; lưu, theo dõi, bình luận, đánh giá và chỉnh sửa vẫn kiểm tra đăng nhập/quyền tại backend. Công thức nháp không được công khai qua API.
- JSON-LD WebSite ở trang chủ, Recipe ở công thức công khai. Nguyên liệu, bước nấu, ảnh, thời gian và tác giả lấy từ dữ liệu thật; không tạo đánh giá hoặc thông tin dinh dưỡng giả.
- `npm run build` chạy Vite rồi tạo HTML cho các trang công khai và snapshot chi tiết công thức qua API công khai. Cùng HTML được phục vụ cho người dùng và crawler; React tải lên sẽ thay bằng giao diện tương tác hiện tại.
- Sinh `dist/sitemap.xml` và `dist/robots.txt`; chỉ sitemap các trang công khai và công thức lấy được thành công. Snapshot không lấy dữ liệu tài khoản và không dùng JWT.
- `spa.html` dành cho URL chưa có snapshot, tránh canonical trang chủ xuất hiện sai trên mọi đường dẫn. React cập nhật metadata khi chuyển trang.
- Build kiểm tra định dạng `VITE_API_BASE_URL`, từ chối giá trị dính tên biến, khoảng trắng hoặc xuống dòng.

## Cấu hình và cập nhật

Trên Vercel frontend, ô **Key** là `VITE_API_BASE_URL`, ô **Value** chỉ là `https://culin-share-backend.vercel.app`. API phải truy cập được khi build để tạo snapshot công thức. Nếu API lỗi, build vẫn tạo trang cơ bản và ghi cảnh báo; công thức được tải từ API khi người dùng mở trang.

Snapshot và sitemap là dữ liệu tại thời điểm build, không tự cập nhật khi database thay đổi. Redeploy frontend sau khi thêm, sửa, ẩn hoặc xóa công thức để cập nhật/xóa snapshot cũ. Chức năng này phù hợp kho hiện tại; build giới hạn 100 trang API, mỗi trang 50 công thức. Kho lớn hoặc cần thu hồi nội dung ngay nên chuyển sang SSR/ISR và sitemap động.

## Chủ website cần thực hiện sau deploy

1. Xác minh quyền sở hữu domain trong Google Search Console bằng DNS hoặc phương thức Google cung cấp. Không tự tạo mã xác minh.
2. Gửi sitemap `https://bepnhaminh.page/sitemap.xml`.
3. Dùng URL Inspection kiểm tra trang chủ và một công thức, yêu cầu lập chỉ mục.
4. Kiểm tra công thức bằng Google Rich Results Test. Cấu trúc hợp lệ không bảo đảm được hiển thị rich result.
5. Đặt `bepnhaminh.page` làm domain chính trong Vercel. File `frontend/vercel.json` đã cấu hình chuyển hướng vĩnh viễn từ domain frontend `culin-share.vercel.app` sang domain chính, giữ đường dẫn. Giữ URL backend riêng.
6. Theo dõi Page indexing và Performance, bổ sung nội dung công thức nguyên bản, ảnh phù hợp và liên kết tự nhiên giữa bài viết.

Google quyết định thu thập, lập chỉ mục và thứ hạng; không cam kết top hoặc thời gian xuất hiện cho từ khóa cạnh tranh. Metadata phía JavaScript của bài cộng đồng/hồ sơ mới vẫn phụ thuộc crawler render JavaScript; chưa tạo snapshot riêng cho từng bài cộng đồng và tác giả.

Nguồn: [JavaScript SEO](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics), [Recipe structured data](https://developers.google.com/search/docs/appearance/structured-data/recipe), [Gửi sitemap](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap).
