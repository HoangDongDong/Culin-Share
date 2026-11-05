# Nhập ViFoodRec — sử dụng và kiểm tra

Nguồn dữ liệu được ghim tại commit `126caa3a8b58708a09b2b2e119ff4923b6f06d82`. Công cụ tải hai file raw bằng HTTPS và kiểm tra SHA-256. CSV, báo cáo chứa dữ liệu gốc, cấu hình local và kết quả kiểm tra ảnh nằm trong `backend/.cache/vifoodrec/`, không commit lên GitHub.

## Quy tắc đã áp dụng

- Bỏ URL ảnh không hợp lệ/thiếu, bỏ tên trùng sau Unicode NFC, chữ thường và gộp khoảng trắng. Ưu tiên nguồn Món Ngon Mỗi Ngày vì có thêm sơ chế/cách dùng. Bỏ món trùng tên với công thức cũ; không sửa công thức cũ.
- Giữ source key, hash dữ liệu, dataset revision, nguồn website, nguyên liệu gốc, ghi chú và dinh dưỡng nguồn trong bảng `recipe_imports`. Tài khoản đăng lại không được trình bày như tác giả gốc.
- Phân bổ trên số món đủ điều kiện bằng quota nguyên gần nhất 42/29/29; xáo trộn xác định theo hash nguồn rồi phân bố rải rác. Chạy lại giữ nguyên kết quả và không ghi đè nội dung cũ.
- Chuẩn bị, độ khó và dinh dưỡng chưa xác minh được lưu NULL; không bịa bước nấu, ảnh, đánh giá hoặc số kcal. Khẩu phần không đọc chắc chắn cũng để NULL. UI hiển thị trạng thái chưa xác minh và nguồn.
- Danh mục món ăn tách khỏi nguồn dữ liệu. Không dùng nhãn `Công thức ViFoodRec` trên thẻ món; nguồn ViFoodRec vẫn nằm trong bảng import và phần ghi nguồn chi tiết. Phân loại thô của dataset không được sao chép trực tiếp vì có đồ uống bị ghi Món mặn.
- Chế độ `verified` chỉ công khai món có ảnh trả HTTP thành công, MIME ảnh và chữ ký JPEG/PNG/WebP/GIF. Món có URL nhưng ảnh chưa xác minh được vẫn được nhập dạng nháp, không đưa vào tìm kiếm công khai, sitemap hay RAG.
- Lưu nguyên liệu dạng tên/định lượng/đơn vị theo parser có kiểm tra, giữ raw để đối chiếu. Các mô tả phức tạp có thể cần rà soát thủ công; không cam kết mọi cách viết định lượng đã được hiểu đầy đủ.

## Các lệnh

Chạy tại `backend`, sau `npm ci`:

```powershell
# Chỉ tải dữ liệu + phân tích file; không kết nối database
npm run db:vifoodrec -- --download --audit

# Kiểm tra ảnh, giới hạn kết nối; host liên tục lỗi được ngừng thử
node database/check-vifoodrec-images.js
```

Ảnh lỗi kết nối không đồng nghĩa đã bị xóa. Kết quả chưa xác minh cần được kiểm tra lại trước khi công khai; công cụ không né xác thực/TLS hoặc lấy ảnh món khác thay thế. Có thể xóa báo cáo ảnh trong cache rồi kiểm tra lại khi nguồn khôi phục; việc này không tự thay đổi trạng thái các món đã nhập.

Ví dụ nhập local (mật khẩu MySQL local dùng biến môi trường `IMPORT_DB_PASSWORD`, không đưa vào Git):

```powershell
npm run db:vifoodrec -- --database culinshare_vifoodrec_test_final --audit
# --audit ở trên chỉ xem file; dry-run database là lệnh dưới:
npm run db:vifoodrec -- --database culinshare_vifoodrec_test_final --status verified --image-report .cache/vifoodrec/image-check.json

npm run db:vifoodrec -- --database culinshare_vifoodrec_test_final --apply --ensure-schema --status verified --image-report .cache/vifoodrec/image-check.json
```

`--ensure-schema` tạo hai bảng import qua migration idempotent; không reset database. Backend local khởi động cũng áp dụng migration mới theo runner hiện có. Dry-run database cần schema đã có sẵn. Mỗi lô ghi theo transaction và truy vấn tham số; bulk insert tra ID theo slug thay vì giả định AUTO_INCREMENT liên tiếp, phù hợp cả TiDB.

Database ngoài local yêu cầu đồng thời `--host`, `--port`, `--database` và `--allow-remote`. Đọc các khóa kết nối từ `.env` chỉ khi có `--env-file .env` rõ ràng:

```powershell
npm run db:vifoodrec -- --host YOUR_DB_HOST --port 4000 --database YOUR_DB_NAME --env-file .env --allow-remote --apply --ensure-schema --status verified --image-report .cache/vifoodrec/image-check.json --report .cache/vifoodrec/production-report.json
```

Mặc định trạng thái là `draft`. `--status published` dành cho thử nghiệm/quản trị tường minh, bỏ qua gate ảnh; không dùng để công khai hàng loạt link ảnh đang lỗi. Không chạy importer trong request Vercel hoặc tự seed hàng nghìn bài mỗi lần khởi động.

## Kiểm thử local

```powershell
# Cần IMPORT_DB_PASSWORD; script cố định host 127.0.0.1, database thử riêng
npm run db:verify-vifoodrec-local

# Backend thử cổng 3002 phải chạy với .cache/vifoodrec/local-test.env
node database/verify-vifoodrec-api.js
```

Script local tạo `culinshare_vifoodrec_test_final`, sao chép 36 công thức nền từ MySQL local và tạo tài khoản fixture với mật khẩu ngẫu nhiên, không copy mật khẩu người dùng thật. Không đọc cấu hình TiDB từ `.env` cho bước này. Không reset database local gốc.

Kết quả ngày 05/11/2026:

| Hạng mục | Kết quả |
| --- | ---: |
| Dòng raw | 5.509 |
| Bỏ do thiếu URL ảnh | 19 |
| Bỏ do trùng tên trong dataset sau chuẩn hóa | 208 |
| Bỏ do trùng tên với công thức nền | 4 |
| Nhập mới | 5.278 |
| hoanganh / chefquang / cheflan | 2.217 / 1.531 / 1.530 |
| Công khai theo gate ảnh | 1.183 |
| Bản nháp chờ ảnh | 4.095 |

Đã kiểm tra nhập toàn tập, quota, giữ 36 món cũ, rollback lỗi transaction, tiếp tục sau checkpoint, chạy lại không nhân đôi, rollback batch fixture và từ chối xóa fixture đã sửa. API kiểm tra tìm có dấu/không dấu, phân trang không trùng, danh mục, chi tiết/nguồn, NULL dinh dưỡng và sitemap chỉ gồm bài công khai. Giao diện local mở được ảnh món Bánh canh cua, nguyên liệu `1,5 lít`, các phần sơ chế/chế biến/cách dùng và cảnh báo dữ liệu chưa xác minh.

## Rollback có kiểm tra

### Kết quả TiDB production ngày 05/11/2026

Đã áp dụng cùng dữ liệu và chính sách ảnh đã kiểm thử local lên database `culinshare`. Batch: `vfr-126caa3a8b58-0fed2069-e99e-45df-bb9e-e7da6613b6b7`.

- Nhập 5.278 món: 1.183 published, 4.095 draft. Phân bổ hoanganh 2.217, chefquang 1.531, cheflan 1.530. Giữ 36 món cũ.
- API production có tổng 1.219 món công khai, danh mục ViFoodRec có 1.183 món; phân trang không trùng và CORS đúng domain frontend.
- Món mẫu [Bánh canh cua](https://bepnhaminh.page/recipe/35311) trả đủ nguyên liệu, bước nấu, nguồn ViFoodRec, ảnh tải được và không bịa calories. Khách gọi API một bản nháp trả 404; nháp không có trong catalog/sitemap.
- Sitemap backend có 1.233 URL công khai. Chạy lại dry-run thấy `alreadyImported=5278`, `toInsert=0`.
- Báo cáo riêng trong cache: `production-report.json`, `production-verification.json`, `production-repeat-dry-run.json`. Không đưa dữ liệu gốc hoặc cấu hình kết nối vào Git.

Chỉ dùng batch ID từ báo cáo nhập, với `--apply --rollback-batch BATCH_ID` và đúng database/host. Công cụ khóa bản ghi, so snapshot nội dung lúc nhập, kiểm tra cập nhật/bình luận/đánh giá/lượt lưu/liên kết cộng đồng; nếu có thay đổi thì từ chối xóa. Không có snapshot an toàn cũng từ chối. Rollback giữ log batch, không xóa công thức ngoài batch.

## RAG và SEO sau nhập

### Phân loại lại ngày 05/11/2026

`recipe-categories-v1.js` phân nhóm theo tên món, kiểm tra nguyên liệu khi dùng nhãn chay nguồn: Món nước, Hải sản, Món chay, Món ăn sáng, Món tráng miệng, Đồ uống, Các loại bánh, Gỏi & Salad, Gia vị & Nước sốt và Món mặn. Không suy diễn nhãn lành mạnh khi chưa xác minh dinh dưỡng. Các bánh chưa rõ ngọt/mặn nằm trong Các loại bánh; món còn lại dùng nhóm Món mặn rộng, cần biên tập tiếp nếu muốn phân nhóm chi tiết hơn.

Migration `202611050002-recipe-food-categories` chuyển các bài còn nhãn placeholder và xóa danh mục ViFoodRec khi không còn liên kết. Chỉ thao tác bài thuộc ledger nhập; không xóa danh mục người biên tập đã chọn. Công cụ nhập mới cũng phân loại ngay bằng cùng quy tắc. Chạy lại không ghi đè bài đã được phân loại. Link danh mục cũ chuyển hướng về trang khám phá.

```powershell
# Xem trước bằng cấu hình local cụ thể; thêm --apply để ghi.
npm run db:classify-vifoodrec -- --database YOUR_LOCAL_DATABASE --env-file YOUR_LOCAL_ENV
# Đồng đội đã có dữ liệu chạy migration bình thường:
npm run db:migrate
```

Đã kiểm tra local 5.278 món không thiếu danh mục, chạy lại 0 thay đổi, API và build frontend đạt; 61 kiểm thử đạt. Bánh canh cua/Bún ốc thuộc Món nước, Vịt nấu thơm thuộc Món mặn. Báo cáo dry-run và áp dụng nằm trong cache riêng, không commit dữ liệu gốc.

RAG hiện có thêm bước chọn tối đa 128 ứng viên bằng giao từ vựng nguyên liệu trước embedding và xếp hạng ngữ nghĩa, cuối cùng tối đa 12 món vào prompt. Việc này giới hạn chi phí embedding sau bulk import, nhưng có thể bỏ sót tên nguyên liệu đồng nghĩa không giao từ vựng ở bước chọn thô. Không có bảng alias viết tay; bộ test dùng API giả lập, không chạy tạo hàng nghìn vector trả phí.

Sitemap động tự nhận bài published. HTML SEO được build lại từ API; `SEO_API_BASE_URL` cho phép build kiểm thử từ API local mà JavaScript vẫn dùng URL production. Công thức import có ghi nguồn trong giao diện/JSON-LD, không gán tác giả gốc cho tài khoản đăng lại.

Repository nguồn không công bố LICENSE tại thời điểm khảo sát. Việc nhập không biến nội dung/ảnh thành tài sản của các tài khoản CulinShare; cần giữ nguồn và chỉ sử dụng theo quyền được cấp bởi chủ nội dung. Không nhập ratings của dataset thành đánh giá cộng đồng thật.
