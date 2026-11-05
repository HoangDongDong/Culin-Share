# Tách bước nấu theo công đoạn nguồn

## Phạm vi và quy tắc

Trước đây importer gộp mỗi trường Sơ chế/Cách làm/Cách dùng của ViFoodRec thành một bước. Một bước có thể chứa nhiều công đoạn; nguồn Cooky thường chỉ có một đoạn Chế biến rất dài.

`backend/src/services/recipeStepSplitter.js` tách văn bản nguồn hiện có (đã bỏ thương hiệu) bằng gạch đầu dòng, đoạn, tên công đoạn, câu bắt đầu thao tác hoặc chủ ngữ kèm thao tác. Câu điều kiện, mức lửa, dấu hiệu chín và đoạn chờ/để thấm đi cùng thao tác liên quan. Tránh tạo mảnh quá ngắn như “trộn đều”, “cắt lát” tách khỏi đối tượng. Không chia tại số thập phân, phân số hoặc khoảng thời gian. Không dùng AI viết lại, không bổ sung nguyên liệu hay thời gian, không áp số bước cố định. Chỗ không có ranh giới rõ vẫn giữ chung, nên đây là cách tách có kiểm soát, chưa thay thế biên tập thủ công về ngữ nghĩa.

Mỗi bước có số liên tiếp từ 1 và giữ nhãn Sơ chế/Chế biến/Cách dùng. Chỉ định dạng lại dấu phân cách/đầu dòng ở phần hiển thị; lưu vị trí ký tự của từng đoạn trong bước gốc để tái dựng và kiểm tra nguyên văn. Mỗi phần nguồn vẫn ở đúng thứ tự.

## Dữ liệu đã có và nhập mới

- Chỉ xử lý các bài trong ledger ViFoodRec còn cấu trúc bước nhóm nguồn; 36 món cũ ngoài ledger không bị sửa.
- Bỏ qua cả món nếu có ảnh bước, hẹn giờ hoặc cấu trúc bước đã biên tập khác mẫu nguồn. So khớp lại dữ liệu khi khóa để tránh ghi đè thay đổi đồng thời.
- Bảng `recipe_step_splits` lưu toàn bộ bước cũ (kể cả ID/ảnh/timer), bước mới, vị trí nguồn, phiên bản và batch. Mỗi món chỉ áp dụng một lần; chạy tiếp sau lỗi sẽ bỏ qua các batch đã hoàn thành.
- Mỗi transaction tối đa 50 món: lưu bản gốc trước, thay bước rồi commit. Lỗi rollback batch hiện tại.
- Công cụ nhập mới tách ngay sau khi bỏ thương hiệu; giữ raw source và originalContent trong metadata. Số bước của lần nhập mới không bị giới hạn về 3.
- Không tạo ảnh AI và không tự suy diễn hẹn giờ từ một đoạn có nhiều khoảng thời gian. Ảnh sẽ được thực hiện riêng sau khi duyệt các bước.

## Sử dụng

Từ thư mục backend, mặc định chỉ xem trước:

```powershell
npm run db:split-recipe-steps -- --database YOUR_LOCAL_DATABASE --env-file YOUR_LOCAL_ENV --report .cache/vifoodrec/split-preview.json
# Thêm --apply sau khi kiểm tra preview.
# Database ngoài local cần chỉ rõ --host, --port và --allow-remote.
# Đồng đội có dữ liệu cũ dùng migration bình thường:
npm run db:migrate
```

Migration `202611050004-split-source-recipe-steps` áp dụng cùng cách xử lý cho database của đồng đội. Không tải lại CSV, không reset database.

Khôi phục bằng CLI với đúng database, `--apply --rollback-batch BATCH_ID`. Trước khi khôi phục, công cụ so toàn bộ nội dung, số bước, ảnh và timer hiện tại với bản sau tách. Nếu có sửa nội dung hoặc gắn ảnh mới thì từ chối. Món đã khôi phục giữ dấu trong journal để lần chạy sau không tự tách lại. Bản lưu văn bản thương hiệu có thể tham chiếu các ID bước cũ; cần đối chiếu journal trước khi xử lý lịch sử này.

## Kiểm tra local ngày 05/11/2026

- 5.278 món nhập: 5.261 món cần tách thêm, 17 món ngắn giữ nguyên.
- Các món được thay đổi: từ 7.633 bước nhóm thành 46.081 bước; số bước thay đổi theo nội dung, từ 2 đến 48.
- Đối chiếu từng source span để tái dựng nguyên văn, không mất đoạn và không đảo thứ tự. So chuỗi định lượng/thời gian/kích thước trước–sau trên toàn tập: không sai lệch.
- Thử lỗi insert sau khi xóa trong transaction: rollback trả nguyên bước cũ, không ghi journal thành công.
- Thử gián đoạn sau 50 món: chạy tiếp đủ và chạy lại 0 thay đổi.
- Thử bảo vệ ảnh/timer, từ chối khôi phục bước đã sửa và khôi phục đúng bản gốc trên fixture local.
- Checksum tên món, tác giả, trạng thái, nguyên liệu, danh mục, raw metadata và các bước của món cũ không đổi.
- 68 kiểm thử đạt, 10 kiểm tra API và build frontend/HTML SEO của 1.219 món công khai đạt.

Báo cáo đầy đủ nằm trong cache riêng; không commit dữ liệu gốc hay `.env`.

## TiDB production

Đã áp dụng ngày 05/11/2026, batch `steps-v1-1e72cd31-477e-4611-825a-56549243e024`: 5.261 món được tách, 17 món ngắn giữ nguyên, kết quả 46.081 bước cho các món đã thay đổi. Checksum toàn bộ dữ liệu công thức ngoài bước, nguyên liệu, danh mục, metadata nguồn và 236 bước của 36 món cũ khớp trước–sau. Toàn bộ journal qua kiểm tra tái dựng nguồn, chuỗi định lượng/thời gian và thứ tự; chạy lại không còn món cần tách.

API production đã trả [Bánh canh cua](https://bepnhaminh.page/recipe/35311) 10 bước và [Rau củ kho chay](https://bepnhaminh.page/recipe/31176) 9 bước. Báo cáo riêng: `split-production-before.json`, `split-production-applied.json`, `split-production-verification.json` trong cache.
