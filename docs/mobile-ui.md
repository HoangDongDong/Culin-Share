# Giao diện điện thoại — 04/11/2026

Thiết kế mobile lấy bố cục từ ảnh tham khảo: header gọn, thẻ nội dung, thanh điều hướng nổi năm mục và nút của trang đang chọn nhô lên. Khi chuyển trang hoặc quay lại bằng trình duyệt, trạng thái nổi cập nhật theo URL. Giữ bảng màu ấm của CulinShare. Các thay đổi mobile chính áp dụng dưới 768px; bản desktop dùng bố cục cũ.

## Phạm vi

- Khung chung trong `App`, `MobileNavigation` và `mobile.css`: safe area, khoảng trống cuối trang, chữ nhập liệu 16px, thanh dưới tự ẩn khi nhập, cuộn lên đầu khi chuyển trang.
- Header: tìm kiếm nhanh, chuông thông báo, menu hai cột, đường dẫn món đã lưu/quản trị theo quyền. Các nút vẫn dùng chức năng hiện có.
- Trang chủ: hero có lớp phủ, công thức nổi bật lên trước danh mục trên mobile, thẻ hai cột, danh mục trượt ngang.
- Tìm kiếm, món đã lưu và hồ sơ đầu bếp: thẻ hai cột; bộ lọc mở/đóng; danh sách không tràn ngang.
- Chi tiết công thức/sản phẩm: một cột; banner đủ cao để không cắt tiêu đề/nút; nội dung đọc được trên màn nhỏ.
- Tủ lạnh AI: form thêm nguyên liệu chia hàng, tùy chọn bữa ăn một cột, kết quả vừa khung.
- Cộng đồng và chi tiết bài: ưu tiên bảng tin trước sidebar, tab trượt ngang, modal vừa viewport.
- Hồ sơ: tab thông tin/sức khỏe/mật khẩu trượt ngang; form một cột, popup thông báo vừa màn hình.
- Đăng/sửa công thức: nhóm nguyên liệu co giãn, trường nhập và nút không bị cắt.
- Đăng nhập, đăng ký/OTP, quên/đặt lại mật khẩu và trang lỗi: cùng khung mobile; nút Google lấy chiều rộng container.
- Quản trị: sidebar đổi thành thanh mục trượt ngang trên điện thoại; bảng cuộn trong khung riêng. Tablet 768–1023px dùng sidebar hẹp hơn.

## Kiểm tra

- Trang công khai/xác thực đã kiểm tra bằng trình duyệt với dữ liệu ứng dụng thật ở viewport khoảng 393px; các hàng xếp hạng gây tràn đã được sửa.
- Form và trang cần đăng nhập được kiểm tra ở 360px bằng fixture tách riêng tại origin/cổng thử nghiệm, API chỉ trả dữ liệu mẫu và chặn mọi thao tác ghi. Các màn gồm hồ sơ (cả sức khỏe/mật khẩu), đăng/sửa công thức, chi tiết món, tủ lạnh, món đã lưu và quản trị.
- Kiểm tra thêm bốn tab quản trị: thành viên, công thức, duyệt bài, danh mục; bảng không làm rộng toàn trang.
- Xác nhận thanh dưới đổi mục đang chọn, mở menu/tìm kiếm và ẩn khi nhập liệu; popup thông báo nằm trong viewport.
- Xác nhận desktop 1280px: thanh mobile ẩn, không có khoảng đệm dưới thừa, sidebar quản trị vẫn cố định rộng 256px.
- Build frontend và lint các component khung mobile đã đạt. Fixture/server thử nghiệm đã được dọn; không thêm dữ liệu test vào database.

Kiểm tra bằng viewport trình duyệt, chưa kiểm tra trên thiết bị iOS/Android vật lý. Không thay API, schema hay quyền truy cập trong lần chỉnh giao diện này.
