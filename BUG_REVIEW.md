# Kết quả kiểm tra CulinShare — 28/10/2026

Phạm vi: đọc các tuyến API, xác thực/phân quyền, công thức, hồ sơ, bình luận, đánh giá, thông báo, tìm kiếm và tủ lạnh; chạy build, lint, kiểm tra cú pháp backend và kiểm chứng logic bằng giả lập. Chưa kiểm thử toàn bộ giao diện hoặc tích hợp MySQL/Google/Gemini thật. Tại thời điểm kiểm tra không thấy dịch vụ lắng nghe trên các cổng 3000, 5000, 5050, 5173.

## Đã sửa trong lượt này

1. **[P1] Phiên đăng nhập chỉ sống 6 giây.** `backend/.env:13` đặt `JWT_EXPIRES_IN=0.1m`. Đã đổi thành `15m`, kiểm tra token mới có `exp - iat = 900` giây. Cần khởi động lại backend và đăng nhập lại; token cũ không tự kéo dài. File `.env` bị Git bỏ qua nên thay đổi cấu hình này chỉ áp dụng cho máy hiện tại.
2. **[P1] AI chia món luôn lỗi.** `backend/src/services/ai.service.js`, hàm `suggestDishDistribution`, gọi `this.genAI.getGenerativeModel` trong khi `this.genAI` và `this.model` chưa được khởi tạo. Đã tái hiện lỗi trước sửa. Đã dùng HTTP API theo cấu hình Gemini hiện có, thêm timeout và kiểm tra số món trả về. Kiểm thử bằng phản hồi giả lập, chưa gọi Gemini thật. Trước sửa, frontend che lỗi bằng phân bổ dự phòng.
3. **[P2] Xử lý 401 làm lệch trạng thái phiên và chuyển hướng sai.** `frontend/src/services/api.js` trước đây áp dụng logout cho cả đăng nhập sai mật khẩu, không đồng bộ Redux, để lại `fridgeItems`, và hẹn chuyển trang sau 1,5 giây mà không kiểm tra phiên mới. Đã tách request xác thực, chỉ xử lý lỗi của token hiện tại, xóa trạng thái riêng tư, đồng bộ Redux/thông báo/socket và chuyển trang ngay. Có kiểm thử chống 401 trùng và 401 đến muộn từ phiên cũ.

## Phát hiện còn cần xử lý

4. **[P1] Người dùng tự bỏ qua kiểm duyệt công thức.** `backend/src/services/recipe.service.js:106` và `:188` lấy `status` trực tiếp từ body; người dùng thường có thể gửi `published` khi tạo hoặc sửa bài của mình. Đã xác nhận bằng service với repository giả lập. Nên cố định trạng thái do server quyết định cho người dùng thường; thay đổi trạng thái xuất bản qua tuyến admin. Bài đã xuất bản khi sửa cũng cần chính sách duyệt lại rõ ràng.

5. **[P1] API công khai đọc được bài nháp/chờ duyệt.** `backend/src/routes/recipe.routes.js` cho phép GET theo ID/slug không cần đăng nhập; `backend/src/services/recipe.service.js:72` và `:82` không kiểm tra trạng thái. Đã xác nhận service trả bài `pending` bằng giả lập. Nên chỉ trả `published` cho khách; cho tác giả/admin xem bản chưa xuất bản qua xác thực và kiểm tra quyền.

6. **[P1] Hồ sơ công khai lộ dữ liệu riêng tư.** `backend/src/controllers/user.controller.js:47` dùng cùng `getProfileData` như hồ sơ cá nhân. `backend/src/utils/dto.util.js:49` trở đi trả email, điện thoại, địa chỉ, ngân sách, chiều cao/cân nặng. Tuyến `/api/users/:id` không yêu cầu đăng nhập. Nên tạo DTO hồ sơ công khai chỉ chứa các trường được phép công bố.

7. **[P1] Đăng nhập Google thiếu kiểm tra ứng dụng nhận token.** `backend/src/services/user.service.js:484` gọi tokeninfo nhưng chỉ kiểm tra có email, không đối chiếu `aud` với Google client ID của dự án và không kiểm tra `email_verified` trước khi tìm/liên kết tài khoản theo email. Giả lập phản hồi tokeninfo có audience khác và email chưa xác minh vẫn được cấp JWT. Cần xác thực đầy đủ các claim liên quan trước khi liên kết tài khoản. Chưa thử với token Google thật.

8. **[P1] Quyền admin cũ vẫn có hiệu lực sau khi hạ quyền.** `backend/src/middlewares/authMiddleware.js` lấy role từ JWT; `roleMiddleware.js` chỉ so sánh role đó. Tuyến cập nhật role chỉ đổi DB. Token admin đã cấp vẫn dùng được cho tới khi hết hạn, hiện là 15 phút. Nên đối chiếu trạng thái/quyền hiện tại hoặc sử dụng phiên có cơ chế thu hồi. Đọc mã xác nhận đường đi; chưa chạy luồng hạ quyền trên DB thật.

9. **[P2] Tìm kiếm bỏ sót công thức khi có trên 50 kết quả.** `frontend/src/pages/SearchPage.jsx:31` yêu cầu `limit:100`, lọc và phân trang ở client; `backend/src/repositories/recipe.repository.js:76` giới hạn 50. `searchRecipesApi` bỏ metadata phân trang. Những bài ngoài 50 bài đầu không xuất hiện, kể cả khi lọc danh mục/độ khó có thể khớp. Nên gửi bộ lọc và trang lên server, giữ metadata; bổ sung hỗ trợ bộ lọc còn thiếu ở backend.

10. **[P2] Lưu công thức không có transaction.** `backend/src/services/recipe.service.js:109` và `:191` ghi bản chính trước rồi lần lượt ghi nguyên liệu, bước, ảnh, danh mục. Repository xóa dữ liệu liên quan cũ trước khi thêm dữ liệu mới. Nếu dữ liệu sai hoặc một truy vấn thất bại, API có thể trả lỗi trong khi DB đã bị cập nhật một phần hoặc mất chi tiết cũ. Cần validate toàn bộ trước khi ghi và transaction dùng chung connection.

11. **[P2] Tuổi/giới tính dùng tính TDEE nhưng không lưu.** `backend/src/services/user.service.js:375` nhận `gender`, `age` và dùng chúng cho kết quả tính, nhưng repository chỉ lưu chiều cao, cân nặng, mức vận động; DTO không trả tuổi/giới tính. `frontend/src/pages/RecipeDetailPage.jsx` tính lại bằng tuổi mặc định 25 và giới tính mặc định male khi thiếu dữ liệu. Kết quả trên trang hồ sơ và chi tiết công thức có thể khác nhau. Cần lưu/trả các đầu vào hoặc dùng kết quả tính thống nhất từ server.

## Kết quả kiểm tra

- `node --test tests/*.test.cjs`: 4/4 test đạt sau sửa, không gọi API bên ngoài hoặc ghi DB.
- `npm run build` trong frontend: đạt; còn cảnh báo bundle JS lớn khoảng 1 MB trước gzip.
- ESLint hai file frontend vừa sửa: đạt.
- Lint toàn frontend trước sửa: 18 lỗi, 3 cảnh báo; phần lớn là biến không dùng và quy tắc React effects/dependencies. Chưa sửa toàn bộ và không coi mỗi cảnh báo lint là một bug chức năng riêng.
- Kiểm tra cú pháp 53 file backend trước sửa: đạt; file AI đã sửa được nạp và thực thi trong test.
- Chưa có kiểm thử tích hợp/UI đầy đủ để kết luận ứng dụng hết bug. Các thay đổi đã có sẵn trong `frontend/package-lock.json` và `frontend/vite.config.js` được giữ nguyên.

Ưu tiên tiếp theo: khởi động lại backend, đăng nhập lại để kiểm tra thao tác tủ lạnh; sau đó xử lý các mục P1 về kiểm duyệt, dữ liệu riêng tư và xác thực.
