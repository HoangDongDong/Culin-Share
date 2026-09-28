# 🍳 CulinShare - Premium Recipe Sharing & Community Platform

<div align="center">
  <img src="https://res.cloudinary.com/dofssbkbd/image/upload/v1782819020/mamngon/assets/ruqetfu0x7b3gtjemwjx.jpg" alt="CulinShare Banner" width="100%" max-height="300px" style="border-radius: 16px; object-fit: cover;" />
  
  <p align="center">
    <strong>CulinShare</strong> là một nền tảng mạng xã hội chia sẻ công thức nấu ăn cao cấp, kết nối những người yêu bếp, tôn vinh các đầu bếp tài năng và truyền cảm hứng nấu nướng mỗi ngày thông qua các công nghệ hiện đại.
  </p>

  [![Vite](https://img.shields.io/badge/Vite-8.x-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
  [![React](https://img.shields.io/badge/React-18.x-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org/)
  [![Node.js](https://img.shields.io/badge/Node.js-18.x-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
  [![Express](https://img.shields.io/badge/Express-4.x-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
  [![MySQL](https://img.shields.io/badge/MySQL-8.x-4479A1?style=for-the-badge&logo=mysql&logoColor=white)](https://www.mysql.com/)
  [![Socket.io](https://img.shields.io/badge/Socket.io-4.x-010101?style=for-the-badge&logo=socketdotio&logoColor=white)](https://socket.io/)
</div>

---

## 🌟 Tính Năng Nổi Bật (Key Features)

### 🔐 1. Xác thực & Bảo mật Toàn diện
*   **Đăng nhập bằng Google thật (Google OAuth2):** Tích hợp chính thức bằng **Google Identity Services SDK**. Tự động tạo tài khoản, đồng bộ Avatar và kích hoạt tức thì.
*   **Xác minh Email (OTP):** Đăng ký tài khoản mới đi kèm mã xác thực gửi trực tiếp qua email để kích hoạt.
*   **Khôi phục mật khẩu (Forgot Password):** Luồng khôi phục hợp nhất 2 bước (Gửi OTP qua email -> Nhập mã OTP xác thực & Đặt mật khẩu mới) mã hóa mật khẩu bảo mật cao bằng `bcrypt`.

### 🍲 2. Quản lý & Chia sẻ Công thức Nấu ăn
*   **Đăng công thức trực quan:** Thiết lập nguyên liệu, danh mục, thời gian chuẩn bị, thời gian nấu, lượng calories và độ khó.
*   **Các bước thực hiện sinh động:** Upload ảnh riêng cho từng bước nấu ăn.
*   **Quản lý ảnh bằng Cloudinary:** Lưu trữ đám mây. Đã được khắc phục hoàn toàn lỗi xung đột ghi đè đồng thời (race condition) bằng cơ chế định danh độc bản ngẫu nhiên.

### ❄️ 3. Tủ Lạnh Ảo (Smart Fridge AI)
*   Nhập danh sách nguyên liệu bạn đang có sẵn trong nhà.
*   Hệ thống sẽ gửi yêu cầu tới **Trí tuệ nhân tạo (AI)** để gợi ý những công thức nấu ăn ngon nhất có thể chế biến được ngay lập tức.
*   *Tính năng tối ưu:* Tự động dọn dẹp tủ lạnh ảo khi đăng xuất hoặc chuyển phiên đăng nhập mới để đảm bảo tính riêng tư cho từng tài khoản.

### 🏆 4. Bảng Xếp Hạng Kép (Leaderboard)
*   **Công thức yêu thích nhất:** Xếp hạng các món ăn được cộng đồng lưu nhiều nhất. Vinh danh Top 3 trên bục Podium sang trọng với các chỉ số đánh giá trung bình.
*   **Đầu bếp nổi bật nhất:** Xếp hạng các tác giả có lượt theo dõi (`followers_count`) cao nhất để tôn vinh sự đóng góp tích cực cho cộng đồng.

### 🔔 5. Thông báo Thời gian thực (Real-time Notifications)
*   Tích hợp giao thức **Socket.io** giúp đẩy thông báo tức thì (nhận xét công thức, đánh giá sao, có người theo dõi mới).
*   Thanh thông báo tự cập nhật số lượng tin nhắn chưa đọc.
*   **Điều hướng thông minh:** Click vào thông báo sẽ tự động dẫn tới công thức nấu ăn hoặc hồ sơ người theo dõi tương ứng.

### 👑 6. Trang Quản trị (Admin Dashboard)
*   Xem báo cáo và kiểm duyệt nhanh các công thức nấu ăn mới đăng.
*   Quản lý danh sách người dùng (hiển thị rõ trạng thái xác thực Đang hoạt động / Chưa kích hoạt).
*   Quản lý các danh mục ẩm thực.

---

## 🛠️ Công Nghệ Sử Dụng (Tech Stack)

| Thành phần | Công nghệ |
| :--- | :--- |
| **Frontend** | React (Vite), Redux Toolkit, Redux-Saga, Tailwind CSS, Vanilla CSS, Socket.io-client |
| **Backend** | Node.js, Express.js, Socket.io, JSON Web Token (JWT) |
| **Database** | MySQL, Connection Pool (`mysql2/promise`) |
| **File Storage** | Cloudinary API, Multer Storage Cloudinary |
| **Email Service** | SMTP (Nodemailer) gửi thư tự động |

---

## 📁 Cấu Trúc Thư Mục (Directory Structure)

```text
CulinShare/
├── backend/
│   ├── database/         # Các file migration và dữ liệu SQL mẫu
│   ├── src/
│   │   ├── config/       # Cấu hình Database, Cloudinary
│   │   ├── controllers/  # Bộ điều khiển Request / Response
│   │   ├── middlewares/  # Xác thực token, upload file, validate input
│   │   ├── models/       # Định nghĩa lược đồ thực thể
│   │   ├── repositories/ # Tầng tương tác trực tiếp MySQL (SQL queries)
│   │   ├── routes/       # Khai báo các API Endpoints
│   │   └── services/     # Tầng xử lý nghiệp vụ (Business logic)
│   └── server.js         # Entrypoint của Backend
└── frontend/
    ├── src/
    │   ├── components/   # Các component dùng chung (Header, Bell, Cards...)
    │   ├── pages/        # Các trang giao diện chính
    │   ├── services/     # Gọi REST API (Axios)
    │   └── store/        # Quản lý trạng thái Redux Toolkit
    └── vite.config.js    # Cấu hình Vite bundler
```

---

## 🚀 Hướng Dẫn Cài Đặt (Installation & Setup)

### Yêu cầu hệ thống
*   Node.js phiên bản `>= 18.0.0`
*   MySQL Server phiên bản `>= 8.0`

### 1. Tải dependencies

**Cài đặt cho Backend:**
```bash
cd backend
npm install
```

**Cài đặt cho Frontend:**
```bash
cd frontend
npm install
```

### 2. Cài đặt Cơ sở dữ liệu (MySQL)
1.  Mở công cụ quản trị MySQL (như phpMyAdmin, DBeaver, MySQL Workbench, hoặc CLI).
2.  Tạo một database mới tên là `mamngon` (hoặc tên tùy chọn).
3.  Nhập file SQL khởi tạo dữ liệu tại: [init.sql](file:///d:/code/CNPMM/MamNgon/backend/database/init.sql).

### 3. Cấu hình biến môi trường
Tạo file `.env` trong thư mục `backend/` dựa trên file `.env.example` và điền đầy đủ các thông tin:

```env
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=mamngon

JWT_SECRET=your_jwt_secret_key

CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
EMAIL_FROM=your_email@gmail.com
```

---

## 🏃 Chạy Dự Án (Running Locally)

### Bước 1: Khởi động Backend (cổng mặc định `5000`)
```bash
cd backend
npm run dev
```

### Bước 2: Khởi động Frontend (cổng mặc định `5173`)
```bash
cd frontend
npm run dev
```

Truy cập địa chỉ `http://localhost:5173` trên trình duyệt để sử dụng ứng dụng!

---

## 🧪 Kiểm thử & Đóng gói (Build & Production)

Để tạo bản phân phối tối ưu hóa cho môi trường Production:

```bash
cd frontend
npm run build
```

Các file tĩnh sau khi đóng gói sẽ nằm trong thư mục `frontend/dist`.

---

## 🛡️ Bản Quyền (License)

Dự án này được phát hành dưới bản quyền **MIT License**. Bạn được tự do học tập, phát triển và sử dụng phi thương mại.
