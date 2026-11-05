# Bỏ thương hiệu khỏi nội dung công thức

Ngày 05/11/2026, quy tắc v1 trong `backend/src/services/foodText.js` được áp dụng cho tên món, mô tả, tên nguyên liệu và hướng dẫn nấu. Phạm vi là nội dung công thức, không thay tên tài khoản, URL ảnh, định lượng, danh mục, đánh giá hoặc trạng thái xuất bản.

Ví dụ: Hạt nêm Aji-ngon® Heo/Nấm/Gà → hạt nêm; Bột ngọt AJI-NO-MOTO® → bột ngọt; Nước tương Phú Sĩ → nước tương; Mayonnaise Aji-mayo → xốt mayonnaise. Các thương hiệu được khảo sát còn có Aji-Quick, Ajinomoto, Knorr, Maggi, Blendy, LISA, Chin-Su, Nam Ngư, Heinz, Kewpie, Vinamilk, Meizan, Simply, NESTEA và Oreo. Với loại sản phẩm đặc trưng, giữ tên thực phẩm phù hợp như bánh quy cacao kẹp kem; không xóa mất nguyên liệu. Đây là bộ quy tắc dựa trên dữ liệu đã khảo sát, không phải hệ thống tự nhận diện mọi thương hiệu mới.

Giữ loại chế biến/đặc tính có ý nghĩa: bột tẩm khô chiên giòn, gia vị lẩu Thái, trà matcha gạo rang, nước mắm, dầu mè, muối tôm, tiêu xanh. Chỉ bỏ biến thể quảng cáo đã nhận diện khi gắn với thương hiệu; không xóa từ Heo/Nấm/Gà trên nguyên liệu độc lập.

## Điểm áp dụng

- Migration `202611050003-unbrand-recipe-text` xử lý dữ liệu đã có.
- CLI `db:unbrand-recipes` mặc định chỉ xem trước; cần `--apply` để ghi. Database phải được chỉ rõ; database ngoài local yêu cầu `--allow-remote`.
- Import ViFoodRec mới làm sạch trước khi lưu; giữ nguồn, rawIngredients và originalContent trong metadata.
- Khi tạo/sửa công thức qua API, làm sạch tên/mô tả/nguyên liệu/bước nấu.
- RAG làm sạch ngữ cảnh, đầu vào nguyên liệu và món AI trước khi đối chiếu và tính thiếu. Danh sách đi chợ UI và PDF dùng cùng kết quả backend; không tạo một bộ quy tắc riêng cho PDF.
- Mách nhỏ từ nguồn được làm sạch khi trả API; metadata gốc trong database vẫn giữ để đối chiếu. Không chỉnh raw metadata nguồn.

## Chạy

Từ thư mục backend:

```powershell
# Xem trước trên database thử riêng
npm run db:unbrand-recipes -- --database YOUR_LOCAL_DATABASE --env-file YOUR_LOCAL_ENV --report .cache/vifoodrec/unbrand-preview.json
# Chỉ thêm --apply sau khi kiểm tra báo cáo
# Đồng đội dùng quy trình migration bình thường:
npm run db:migrate
```

Mỗi trường được sửa có bản lưu `original_text` và `cleaned_text`, table/record/field, recipe_id, version và batch_id trong `recipe_text_backups`. Trước khi ghi, transaction khóa và kiểm tra giá trị hiện tại; nếu nội dung vừa được sửa thì dừng, không ghi đè. Lỗi giữa chừng rollback toàn bộ cập nhật và các bản lưu của batch. Không tự khôi phục đè lên chỉnh sửa mới; muốn khôi phục phải so current với cleaned_text của đúng batch trước.

## Kiểm tra và kết quả

Local kiểm tra rollback lỗi thật trên MySQL, backup đủ số trường thay đổi, không đổi định lượng/tác giả/trạng thái/ảnh/danh mục/raw metadata, chạy lại 0 thay đổi và không còn thương hiệu thuộc bộ nhận diện trong các trường văn bản. 64 kiểm thử đạt; 10 kiểm tra API và build HTML SEO của 1.219 công thức đạt. Test danh sách đi chợ xác nhận hạt nêm đã chuẩn hóa được coi là gia vị có sẵn, xốt mayonnaise trừ lượng đúng và dầu mè vẫn là nguyên liệu cần tính thiếu.

TiDB áp dụng batch `unbrand-v1-a5ae15f2-9b65-43c9-a353-2306e90134e6`: **4.683 trường trên 1.424 công thức**, gồm **2.592 tên nguyên liệu**, **1.959 bước nấu**, **118 mô tả**, **14 tên món**. Giữ nguyên ID/slug/nguồn để liên kết cũ tiếp tục hoạt động. Báo cáo chi tiết trong cache riêng, không commit nội dung dữ liệu gốc hoặc `.env`.
