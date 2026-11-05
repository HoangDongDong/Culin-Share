# Kế hoạch nhập ViFoodRec vào CulinShare

Trạng thái: đã hoàn thành công cụ và kiểm thử trên MySQL local riêng. Kết quả thực hiện và hướng dẫn vận hành nằm trong [vifoodrec-import.md](./vifoodrec-import.md). Các số liệu bên dưới là khảo sát ban đầu; kết quả lọc cuối cùng trong tài liệu thực hiện được ưu tiên.

## 1. Nguồn và kết quả khảo sát

- Repository: https://github.com/QuocAn55/A-New-Dataset-and-Empirical-Evaluation-for-Vietnamese-Food-Recommendation-System
- Phiên bản khảo sát: `126caa3a8b58708a09b2b2e119ff4923b6f06d82`.
- `Data/Raw Dataset/food_dataset_cookyweb.csv`: **4.296 dòng**.
- `Data/Raw Dataset/food_dataset_mnmnweb.csv`: **1.213 dòng**.
- Tổng raw: **5.509 dòng**, chưa đồng nghĩa 5.509 công thức duy nhất.
- `Data/Clean Dataset/foods.csv`: **4.000 dòng**; không dùng làm nguồn duy nhất nếu mục tiêu là toàn bộ raw.
- Cả hai file raw có tên, giới thiệu, loại món, khẩu phần, thời gian, nguyên liệu, cách làm, tags, các trường dinh dưỡng và cột ảnh `Link Ảnh`. File clean đổi tên cột ảnh thành `image_link`.
- File Món Ngon Mỗi Ngày có thêm Sơ chế, Cách dùng và Mách nhỏ.
- Có **160 nhóm trùng tên**, tương ứng **183 dòng vượt số tên duy nhất**. Không tự xóa chỉ vì tên giống nhau.
- Có **19 dòng** mang giá trị ảnh `Image link not found`; còn **5.490 dòng có URL HTTP/HTTPS**, chưa xác nhận tất cả đều tải được.
- Ảnh: 4.296 URL thuộc `image.cooky.vn`, 1.194 thuộc `monngonmoingay.com`. Lấy mẫu 3 ảnh mỗi nguồn: 3 ảnh Món Ngon Mỗi Ngày trả HTTP 200 và MIME ảnh; 3 ảnh Cooky chưa tải được từ môi trường kiểm tra. Cần audit cả tập trước khi quyết định đăng công khai.
- Khẩu phần có giá trị bất thường: 7 dòng `0 người`, 2 dòng `1 'ngườ`, và các khẩu phần lớn 30–150 người. Không âm thầm coi tất cả là 4 người.
- GitHub API không trả giấy phép cho repository tại thời điểm khảo sát. Cần làm rõ quyền tái sử dụng nội dung/ảnh trước khi công bố lại toàn bộ lên website; công cụ và báo cáo có thể tách riêng khỏi dữ liệu gốc.

Các file CSV đã tải chỉ nằm trong `backend/.cache/vifoodrec/`, được Git bỏ qua. Không chạy mã nguồn của repository ngoài, không nhập ratings thành lượt đánh giá giả trên CulinShare.

## 2. Phân bổ tài khoản

Giữ yêu cầu: `hoanganh` 42%, `chefquang` 29%, `cheflan` 29%. Đã xác nhận cả ba username có trong MySQL local; tra theo username, không hardcode ID khác nhau giữa các máy.

Nếu nhập đủ **5.509 công thức sau kiểm tra**, chia nguyên gần nhất bằng phương pháp phần dư lớn nhất:

| Tài khoản đăng | Số bài | Tỷ lệ xấp xỉ |
| --- | ---: | ---: |
| hoanganh | 2.314 | 42,00% |
| chefquang | 1.598 | 29,01% |
| cheflan | 1.597 | 28,99% |

Không thể đúng tuyệt đối cả ba tỷ lệ khi số bài không chia hết cho 100. Nếu phải loại bản trùng hoàn toàn hoặc cách ly bản ghi không hợp lệ, tính lại quota trên tổng số thực sự nhập; báo cáo cả số raw, số nhập, số gộp và số cách ly.

Phân bổ xác định được khi chạy lại: xáo trộn theo hash mã nguồn, dùng quota chính xác và luân phiên theo độ thiếu quota. Các tác giả xuất hiện rải rác, không chia thành ba khối bài liên tiếp. Đây là tài khoản quản lý/đăng lại dữ liệu nhập; nguồn nội dung gốc phải được ghi riêng và hiển thị rõ.

## 3. Mapping vào format hiện có

| ViFoodRec | CulinShare | Quy tắc |
| --- | --- | --- |
| Nguồn file + STT | Khóa dữ liệu nhập | Khóa ghép để STT của hai nguồn không đụng nhau |
| Tên món | `recipes.title` | Unicode NFC, giữ tên tiếng Việt; tạo slug ổn định có mã nguồn |
| Giới thiệu | `recipes.description` | Nội dung gốc dạng text; không chèn HTML thực thi |
| Link Ảnh | `recipes.cover_image_url` | Chỉ URL HTTP/HTTPS được kiểm tra; không dùng ảnh món khác thay thế |
| Khẩu phần | `recipes.servings` | Parse số người, giữ nguyên giá trị gốc trong provenance; giá trị bất thường đưa vào báo cáo |
| Time Cooking | `recipes.cook_time_minutes` | Không tự cộng/trừ thời gian chuẩn bị chưa được cung cấp |
| Nguyên liệu | `recipe_ingredients` | Tách tên/định lượng/đơn vị bằng parser có kiểm tra; giữ raw để đối chiếu |
| Cách làm | `recipe_steps` | Giữ trình tự nguồn; chỉ tách khi có ranh giới bước rõ ràng |
| Sơ chế | Bước sơ chế | Chỉ tạo khi nguồn thật có phần này |
| Cách dùng, Mách nhỏ | Ghi chú từ nguồn | Không bịa nội dung hoặc biến lời khuyên thành bước nấu không có trong nguồn |
| Loại món, Tags | `categories`, `recipe_categories` | Mapping có kiểm tra; không mặc định tất cả là Món Việt hay tin nhãn Món mặn cho mọi bản ghi |
| Calories và dinh dưỡng | Metadata dinh dưỡng nguồn | Xác minh đơn vị/cơ sở theo khẩu phần hoặc cả món trước khi dùng cho bộ lọc/hiển thị dinh dưỡng |
| Không có độ khó | Trạng thái thiếu metadata | Không gán nhãn do AI tự đoán rồi trình bày như dữ liệu nguồn |

Giao diện giữ format công thức hiện có: ảnh bìa, tên/mô tả, tác giả đăng, nguyên liệu, bước thực hiện, thống kê và danh mục. Thêm dòng nguồn và trạng thái metadata còn thiếu. Bài thiếu ảnh dùng placeholder trung tính, không lấy ảnh mặc định của một món khác.

## 4. Metadata phục vụ nhập an toàn

Tạo migration mới, không chỉnh migration đã chạy:

- Bảng `recipe_imports`: `dataset`, `dataset_revision`, `source_file`, `source_record_id`, `source_hash`, `recipe_id`, `batch_id`, `original_image_url`, `upstream_site`, `upstream_recipe_url` nếu thật sự có, `raw_metadata` JSON, trạng thái kiểm tra và timestamps.
- Unique `(dataset, source_file, source_record_id)` chống nhập lặp; FK `recipe_id → recipes.id`.
- Bảng/báo cáo batch ghi số lượng, quota, số bỏ qua, lỗi ảnh, trường thiếu và trạng thái hoàn thành. Không lưu mật khẩu hay API key trong báo cáo.
- Lưu thông tin dinh dưỡng, độ khó/thời gian chưa xác minh trong raw metadata thay vì tự chế số liệu. Chỉ mở rộng cột schema khi quy tắc dữ liệu đã thống nhất.

## 5. Công cụ nhập dự kiến

1. Downloader ghim commit, kiểm tra SHA-256 và chỉ tải CSV dữ liệu. Không đưa CSV hoặc toàn bộ ảnh nguồn vào GitHub.
2. Lệnh `--audit`: kiểm tra CSV, schema, khóa nguồn, trùng lặp, định lượng, URL và độ dài theo cột SQL; xuất JSON/CSV báo cáo.
3. Lệnh `--dry-run`: chuyển đổi, tính quota tác giả, thống kê số dòng sẽ tạo; không ghi database.
4. Lệnh kiểm tra ảnh: concurrency thấp, timeout/retry có giới hạn, kiểm tra HTTP và MIME ảnh, hỗ trợ tiếp tục lần sau. Không gọi AI hoặc upload Cloudinary hàng loạt trong bước audit.
5. Lệnh `--apply`: yêu cầu chỉ rõ database và batch; transaction theo lô, khóa chống chạy đồng thời, parameterized SQL và checkpoint. Chạy lại không nhân đôi bài hoặc ghi đè công thức cũ của người dùng.
6. Bản thiếu thông tin bắt buộc hoặc chưa xử lý nguồn/ảnh được giữ `draft` để rà soát; chỉ `published` sau khi đạt quy tắc công khai đã thống nhất.
7. Rollback theo batch chỉ xóa dữ liệu thực sự tạo bởi batch đó; không đụng 36 công thức hiện có hoặc nội dung người dùng chỉnh sau nhập.

Không chạy nhập hàng nghìn món trong request Vercel hoặc tự seed mỗi lần backend khởi động.

## 6. Thứ tự triển khai và kiểm thử local

1. Tạo database `culinshare_vifoodrec_test` trên MySQL **127.0.0.1**, khởi tạo schema hiện hành bằng runner an toàn. Backend `.env` hiện trỏ TiDB nên không dùng trực tiếp cho lần thử này.
2. Chuẩn bị tài khoản local và danh mục; kiểm tra username, không tạo tài khoản mới trên TiDB ngoài ý muốn.
3. Unit test parser CSV có dấu phẩy/xuống dòng/ngoặc kép; phân số và đơn vị; URL độc hại; trường thiếu; slug; quota và tính xác định khi chạy lại.
4. Nhập mẫu từ cả hai nguồn. Kiểm tra bằng API và UI local: ảnh, tiếng Việt, khẩu phần, bước nấu, mapping danh mục, nguồn và quyền chỉnh sửa.
5. Audit ảnh toàn tập, phân loại các bản cùng tên và các trường dữ liệu chưa xác minh; chốt báo cáo số cuối cùng.
6. Nhập toàn tập vào database thử. Kiểm tra số recipes/ingredients/steps/mapping, FK, quota, idempotency khi chạy lần hai và tiếp tục sau lỗi giữa chừng.
7. Kiểm tra trang chủ, phân trang/tìm kiếm, chi tiết, bộ lọc, hồ sơ tác giả, sitemap và HTML SEO. Không để các món nháp/thiếu ảnh xuất hiện như bài hoàn chỉnh.
8. Kiểm tra hiệu năng RAG trước khi công khai hàng nghìn món: hiện code đọc và embedding toàn bộ công thức đã xuất bản trong Node, cache vector tối đa 10.000 mục. Không gọi Gemini trả phí để embed hàng nghìn món chỉ nhằm chạy test; dùng mock trước và lập chiến lược chỉ mục riêng.
9. Chạy bộ regression, lint phần thay đổi và build frontend. Lưu báo cáo, lỗi còn lại và ảnh chụp UI local.
10. Chỉ khi các kiểm tra cần thiết đạt mới commit/push công cụ nhập, migration, kiểm thử và tài liệu. Việc push code không tự đưa dữ liệu cache trên máy lên TiDB.
11. Sau khi chốt quyền sử dụng và các trường thiếu, mới áp dụng batch đã kiểm tra lên database đích. Có báo cáo đối chiếu, phương án phục hồi, kiểm tra production và cập nhật HTML SEO sau nhập.

## 7. Điều kiện nghiệm thu

- Có báo cáo giải thích toàn bộ 5.509 dòng raw, không bỏ qua âm thầm.
- Các món nhập đúng định dạng UI hiện hành, có nguồn; không bịa ảnh, bước nấu, dinh dưỡng, đánh giá hoặc tác giả gốc.
- Tỷ lệ đăng bài đạt quota nguyên gần nhất trên số bài nhập thực tế; bài được phân bổ rải rác và tái lập được.
- Chạy lại không nhân đôi; lỗi lô không để lại liên kết dở dang; công thức cũ còn nguyên.
- Ảnh lỗi/metadata thiếu có trạng thái rõ ràng, không được báo cáo là đã hoàn thiện.
- Test local đạt trước khi push. Không thực hiện thao tác ghi lên TiDB trong giai đoạn khảo sát hiện tại.
