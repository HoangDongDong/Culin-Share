# Gợi ý món bằng RAG

Luồng `/api/ai/fridge-suggest` hiện truy xuất trước, sinh gợi ý sau. Không sử dụng danh sách tên nguyên liệu tương đương viết sẵn.

1. Đọc công thức **đã xuất bản** và nguyên liệu hiện tại từ MySQL. Mỗi công thức là một tài liệu gồm tên, mô tả, nguyên liệu, khẩu phần, độ khó và thời gian.
2. Tạo vector Gemini với task `RETRIEVAL_DOCUMENT`. Khóa cache gồm model, số chiều, task và hash nội dung; sửa nội dung sẽ tạo vector mới. Công thức bị xóa/chuyển trạng thái không còn nằm trong tập truy xuất dù vector cũ còn trong cache.
3. Tạo vector cho nguyên liệu/tùy chọn người dùng với task `RETRIEVAL_QUERY`. Chấm cosine kết hợp độ giao từ vựng và chọn tối đa 12 công thức. Truy vấn tủ lạnh không lưu trong cache trên đĩa.
4. Đưa 12 công thức cùng các chỉ số nguyên liệu vào prompt Gemini. Model chọn `sourceRecipeId` và đối chiếu tên nguyên liệu theo ngữ nghĩa, gồm tên địa phương/tên nhập tự do. Mỗi đối chiếu phải có ID, chỉ số hợp lệ và confidence tối thiểu 0.9. Đối chiếu mâu thuẫn bị bỏ qua; confidence là tự đánh giá của model, không phải xác suất đã hiệu chuẩn.
5. Backend chỉ chấp nhận ID trong ngữ cảnh truy xuất, lấy dữ liệu món thật từ database, quy đổi khẩu phần, đưa món khớp từ 50% loại nguyên liệu lên trước. Khi chưa đủ món có thể bổ sung món mới được ghi rõ là AI. Tổng kết quả không vượt số món yêu cầu. Danh sách mua thêm được tính lại bằng code sau khi trừ tồn kho một lần cho cả bữa.

## Cấu hình

- Dùng `GEMINI_API_KEY` và `GEMINI_MODEL` hiện có trong `backend/.env`.
- `GEMINI_EMBEDDING_MODEL=gemini-embedding-001` là mặc định; có thể đổi qua môi trường nếu cần.
- Vector 768 chiều lưu tại `backend/.cache/fridge-rag-vectors.json`, được Git bỏ qua. Lần gợi ý đầu tiên tạo chỉ mục nên chậm hơn; các lần sau chỉ gọi embedding cho tài liệu mới/thay đổi và truy vấn người dùng.
- Không cần database vector hoặc migration mới. Tìm vector hiện chạy trong Node trên tập công thức đã xuất bản; cần chuyển sang chỉ mục vector chuyên dụng khi kho lớn.
- Nếu Embeddings API không được cấp quyền/quota hoặc mất kết nối, API trả lỗi rõ ràng; không âm thầm quay về aliases rồi gọi đó là RAG.

## Giới hạn

RAG thu hẹp ngữ cảnh, không bảo đảm model luôn hiểu đúng tên thực phẩm. Tỷ lệ hiển thị là ước tính loại nguyên liệu tương đương; không đồng nghĩa đã đủ khối lượng. Chỉ tính 50% trên các công thức nằm trong top 12 truy xuất, không bảo đảm tìm đủ mọi món có thể khớp trên toàn kho. Đơn vị không quy đổi được hoặc dữ liệu thiếu được ghi rõ để người dùng kiểm tra. Model có thể đề xuất phân bổ độ khó/thời gian chưa hoàn toàn đúng; cần kiểm tra thông tin thực tế của bài viết.

Đối chiếu API chính thức: [Gemini Embeddings](https://ai.google.dev/api/embeddings).

Kiểm thử: chạy `node --test tests/*.test.cjs` tại thư mục gốc. Bộ test giả lập API, không gọi dịch vụ trả phí hoặc ghi database.
