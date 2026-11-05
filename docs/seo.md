# SEO cho Bếp Nhà Mình / CulinShare

Domain chuẩn: `https://bepnhaminh.page`. Metadata dùng tên CulinShare và Bếp Nhà Mình; nội dung mô tả công thức nấu ăn, cách nấu ăn ngon, món ngon mỗi ngày và cộng đồng chia sẻ công thức, không nhồi meta keywords.

## Nhận diện thương hiệu — ngày 05/11/2026

- Thống nhất tên chính **Bếp Nhà Mình – CulinShare** trong title trang chủ, description, Open Graph, Twitter Card, nội dung giới thiệu trên trang chủ/footer và schema WebSite/Organization. Giữ hai tên gọi thay thế Bếp Nhà Mình, CulinShare và favicon do chủ website cung cấp.
- Thêm `/about` với nội dung giới thiệu các chức năng thật, liên kết đến công thức, cộng đồng, Tủ lạnh AI và đăng bài; không đặt thông tin liên hệ, thành tích hoặc kênh mạng xã hội giả. Trang có HTML SEO và nằm trong sitemap tự động.
- Đã kiểm tra Search Console: trang chủ được lập chỉ mục, báo cáo Hiệu suất vẫn đang xử lý và chưa có dữ liệu để đánh giá từ khóa/thứ hạng. Không có cài đặt từ khóa để yêu cầu Google xếp hạng.
- Chủ website xác nhận chưa có Facebook/YouTube/TikTok chính thức. Đã bỏ các liên kết mạng xã hội mặc định ở footer; không thêm `sameAs`, tạo tài khoản hoặc đăng bài quảng bá lên dịch vụ bên ngoài.

## Đã triển khai

- Một title, description, canonical theo trang, Open Graph, Twitter Card và tiếng Việt. Trang tài khoản, quản trị, công cụ cá nhân, trang lỗi và biến thể tìm kiếm có query được `noindex`.
- Công thức đã xuất bản cho khách đọc; lưu, theo dõi, bình luận, đánh giá và chỉnh sửa vẫn kiểm tra đăng nhập/quyền tại backend. Công thức nháp không được công khai qua API.
- JSON-LD WebSite ở trang chủ, Recipe ở công thức công khai và DiscussionForumPosting ở bài cộng đồng công khai. Nguyên liệu, bước nấu, ảnh, thời gian và tác giả lấy từ dữ liệu thật; không tạo đánh giá hoặc thông tin dinh dưỡng giả.
- `npm run build` chạy Vite rồi tạo HTML cho các trang công khai và snapshot chi tiết công thức qua API công khai. Cùng HTML được phục vụ cho người dùng và crawler; React tải lên sẽ thay bằng giao diện tương tác hiện tại.
- `/sitemap.xml` được Vercel chuyển tiếp đến `/api/seo/sitemap.xml`: đọc trực tiếp database, gồm công thức đã xuất bản, danh mục và bài cộng đồng công khai chưa xóa. Bỏ qua bài mẫu của tài khoản seed. Cache tối đa 5 phút, có `lastmod` từ dữ liệu thật. Không cần build lại để thêm/bỏ URL trong sitemap.
- `frontend/public/robots.txt` khai báo sitemap chính. Build giữ `dist/sitemap-build.xml` để đối chiếu các snapshot đã tạo; đây không phải sitemap gửi Google.
- URL riêng `/category/:slug` hiển thị danh mục và phân trang công thức. `/community/posts/:id` có title, mô tả, canonical và nội dung bài thật; build tạo HTML ban đầu cho danh mục và bài viết qua API công khai.
- `spa.html` dành cho URL chưa có snapshot, tránh canonical trang chủ xuất hiện sai trên mọi đường dẫn. React cập nhật metadata khi chuyển trang.
- Build kiểm tra định dạng `VITE_API_BASE_URL`, từ chối giá trị dính tên biến, khoảng trắng hoặc xuống dòng.

## Cấu hình và cập nhật

Trên Vercel frontend, ô **Key** là `VITE_API_BASE_URL`, ô **Value** chỉ là `https://culin-share-backend.vercel.app`. API phải truy cập được khi build để tạo snapshot công thức. Nếu API lỗi, build vẫn tạo trang cơ bản và ghi cảnh báo; công thức được tải từ API khi người dùng mở trang.

Sitemap tự cập nhật qua database; HTML snapshot vẫn là dữ liệu tại thời điểm build. Redeploy frontend sau khi thêm, sửa, ẩn hoặc xóa công thức/bài viết để cập nhật/xóa snapshot cũ. React tải nội dung mới từ API khi mở trang. Build công thức giới hạn 100 trang API, mỗi trang 50 công thức. Kho lớn hoặc cần thu hồi HTML công khai ngay nên chuyển sang SSR/ISR. Sitemap có chặn vượt giới hạn 50.000 URL và sẽ cần tách sitemap index khi kho đạt quy mô đó.

## Search Console — ngày 04/11/2026

- Đã gửi `https://bepnhaminh.page/sitemap.xml` bằng tài khoản chủ website. Google xác nhận xử lý thành công và khám phá 40 URL của phiên bản sitemap ban đầu.
- Đã kiểm tra `https://bepnhaminh.page/` và gửi yêu cầu lập chỉ mục; giao diện xác nhận **Đã yêu cầu lập chỉ mục**. Tại thời điểm gửi, trang chủ chưa có trên Google. Yêu cầu không đồng nghĩa đã được lập chỉ mục hoặc được xếp hạng.
- Sitemap giữ nguyên URL sau khi mở rộng sang danh mục/bài viết; Google có thể đọc các thay đổi trong các lần tìm nạp tiếp theo.

## Chủ website cần thực hiện sau deploy

1. Xác minh quyền sở hữu domain trong Google Search Console bằng DNS hoặc phương thức Google cung cấp. Không tự tạo mã xác minh.
2. Gửi sitemap `https://bepnhaminh.page/sitemap.xml`.
3. Dùng URL Inspection kiểm tra trang chủ và một công thức, yêu cầu lập chỉ mục.
4. Kiểm tra công thức bằng Google Rich Results Test. Cấu trúc hợp lệ không bảo đảm được hiển thị rich result.
5. Đặt `bepnhaminh.page` làm domain chính trong Vercel. File `frontend/vercel.json` đã cấu hình chuyển hướng vĩnh viễn từ domain frontend `culin-share.vercel.app` sang domain chính, giữ đường dẫn. Giữ URL backend riêng.
6. Theo dõi Page indexing và Performance, bổ sung nội dung công thức nguyên bản, ảnh phù hợp và liên kết tự nhiên giữa bài viết.

Google quyết định thu thập, lập chỉ mục và thứ hạng; không cam kết top hoặc thời gian xuất hiện cho từ khóa cạnh tranh. Hồ sơ tác giả chưa có snapshot riêng; URL nội dung mới chưa build vẫn phụ thuộc crawler render JavaScript.

Nguồn: [JavaScript SEO](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics), [Recipe structured data](https://developers.google.com/search/docs/appearance/structured-data/recipe), [Gửi sitemap](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap).
