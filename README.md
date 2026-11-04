# CulinShare — Chia sẻ công thức và cộng đồng yêu bếp

CulinShare là ứng dụng web giúp người dùng tìm kiếm, đăng và lưu công thức nấu ăn, chia sẻ bài viết cộng đồng và lên thực đơn từ nguyên liệu sẵn có. Dự án gồm frontend React, backend Express và MySQL. Tủ lạnh AI sử dụng Gemini kết hợp **RAG (Retrieval-Augmented Generation)** để truy xuất công thức trong database trước khi sinh gợi ý.

## Chức năng chính

| Nhóm | Chức năng |
| --- | --- |
| Tài khoản | Đăng ký, xác minh email bằng OTP, đăng nhập, Google Sign-In, khôi phục mật khẩu, quản lý hồ sơ |
| Công thức | Đăng/sửa công thức, ảnh bìa và ảnh từng bước, nguyên liệu, khẩu phần, calo, độ khó, thời gian chuẩn bị và nấu |
| Khám phá | Gợi ý tìm kiếm sau 300 ms, tìm tiếng Việt không dấu, lọc danh mục/độ khó/calo/thời gian, phân trang tại backend |
| Tương tác | Lưu công thức, đánh giá, bình luận/trả lời, theo dõi tác giả, bảng xếp hạng và thông báo thời gian thực |
| Tủ lạnh AI | Nhập nguyên liệu và định lượng, chọn số người/số món/độ khó/thời gian, ưu tiên công thức phù hợp từ database, bổ sung gợi ý AI khi cần |
| Danh sách đi chợ | Tính nguyên liệu còn thiếu cho cả bữa, bỏ qua gia vị cơ bản, xuất PDF tiếng Việt có ô đánh dấu và chia trang |
| Cộng đồng | Đăng bài kèm ảnh/công thức, tìm và lọc bảng tin, thích, lưu, bình luận, báo cáo, tham gia thử thách và đăng ký sự kiện |
| Trang chủ | Đọc danh mục, công thức, tác giả nổi bật, bài cộng đồng và công thức được lưu trong tuần từ database |
| Quản trị | Quản lý người dùng, danh mục, công thức và duyệt bài; tạo thử thách/sự kiện qua API dành cho admin |
| Mobile | Header gọn, menu và thanh điều hướng dưới, bố cục thích ứng cho trang nội dung, biểu mẫu và quản trị |

Các thao tác ghi dữ liệu yêu cầu đăng nhập và được kiểm tra quyền tại backend. Công thức/bài viết chưa công khai được giới hạn theo tác giả và vai trò quản trị.

## Công nghệ

| Thành phần | Công nghệ |
| --- | --- |
| Frontend | React 19, Vite 8, React Router 7, Redux Toolkit, Tailwind CSS 3, Axios |
| Backend | Node.js, Express 4; routes → controllers → services → repositories |
| Database | MySQL 8, mysql2/promise, migration và seed có phiên bản |
| AI và truy xuất | Gemini API, Gemini Embeddings, cosine similarity và đối chiếu nguyên liệu |
| Thông báo | Socket.IO với xác thực JWT |
| Ảnh | Multer và Cloudinary SDK |
| Email và xác thực | Nodemailer/SMTP, JWT, bcryptjs |
| Xuất PDF | jsPDF, font Noto Sans tiếng Việt được đóng kèm frontend |

## Tủ lạnh AI hoạt động như thế nào?

1. Backend lấy các công thức **đã xuất bản** cùng nguyên liệu trong MySQL để tạo tài liệu truy xuất.
2. Gemini Embeddings tạo vector cho công thức và yêu cầu của người dùng. Vector công thức được cache theo nội dung; tài liệu mới/thay đổi được cập nhật khi gợi ý.
3. Backend kết hợp độ tương đồng vector và từ vựng, chọn tối đa **12 công thức** làm ngữ cảnh cho Gemini.
4. Gemini lựa chọn công thức và đối chiếu tên nguyên liệu theo ngữ nghĩa. Backend kiểm tra ID nguồn, lấy thông tin món từ database và ưu tiên món khớp từ **50% loại nguyên liệu** trong tập truy xuất.
5. Nếu thiếu số món yêu cầu, hệ thống có thể bổ sung món được ghi rõ là gợi ý AI. Code tính lại nguyên liệu còn thiếu, trừ tồn kho một lần cho cả bữa và bỏ gia vị cơ bản khỏi danh sách mua.

Model sinh gợi ý nhận tập công thức đã truy xuất, không nhận toàn bộ database trong mỗi prompt. Hiện vector được tìm trong Node.js và lưu cache tại `backend/.cache/fridge-rag-vectors.json`, chưa dùng vector database riêng.

Tỷ lệ khớp là ước tính theo loại nguyên liệu, không bảo đảm đủ định lượng. Ngưỡng 50% chỉ áp dụng trong tập truy xuất, không bảo đảm tìm hết mọi món phù hợp trên toàn kho. Xem [chi tiết RAG và giới hạn](backend/README-RAG.md).

## Cấu trúc dự án

```text
CulinShare/
├── backend/
│   ├── database/           # Runner, migrations, seeds và kiểm tra database
│   ├── src/
│   │   ├── config/        # MySQL, Cloudinary, Socket.IO
│   │   ├── controllers/   # Xử lý request/response
│   │   ├── middlewares/   # Xác thực, phân quyền, kiểm tra đầu vào, upload
│   │   ├── repositories/  # Truy vấn MySQL
│   │   ├── routes/        # REST API
│   │   └── services/      # Nghiệp vụ, AI và truy xuất
│   ├── .env.example
│   └── server.js
├── frontend/
│   ├── public/fonts/      # Font tiếng Việt cho PDF và giấy phép font
│   ├── src/
│   │   ├── components/    # Thành phần dùng chung và điều hướng mobile
│   │   ├── pages/         # Các trang người dùng và quản trị
│   │   ├── services/      # API, Socket.IO và xuất PDF
│   │   └── store/         # Redux
│   └── vite.config.js
├── tests/                 # Kiểm thử hồi quy bằng Node test runner
└── docs/                  # Tài liệu chức năng và kiểm tra
```

## Cài đặt và chạy trên máy cá nhân

### 1. Chuẩn bị

- **Node.js 22.12 trở lên** và npm, phù hợp với Vite 8.
- **MySQL 8.0.16 trở lên** để thực thi CHECK constraint.
- MySQL đang chạy; tài khoản có quyền tạo/sửa bảng và thêm dữ liệu. Cần quyền tạo database nếu database chưa tồn tại.
- Gemini API key cho Tủ lạnh AI; Cloudinary cho upload ảnh; SMTP cho OTP và khôi phục mật khẩu.

```powershell
git clone https://github.com/HoangDongDong/Culin-Share.git
cd Culin-Share
```

### 2. Cấu hình backend

```powershell
cd backend
npm ci
Copy-Item .env.example .env
```

Sửa `backend/.env` theo cấu hình trên máy. Bổ sung các biến cần thiết nếu file mẫu chưa có:

```dotenv
PORT=3000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=CulinShare

JWT_SECRET=replace_with_a_long_random_secret
JWT_EXPIRES_IN=15m
CORS_ORIGIN=http://localhost:5050

GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-2.5-flash-lite
GEMINI_EMBEDDING_MODEL=gemini-embedding-001

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@example.com
EMAIL_PASSWORD=your_smtp_password_or_app_password
EMAIL_FROM=your_email@example.com
```

Không commit file `.env` hoặc khóa dịch vụ. Các model trên là giá trị mặc định trong mã nguồn; tài khoản Gemini phải có quyền và quota cho cả sinh nội dung lẫn embedding.

Google Sign-In hiện khai báo client ID trực tiếp trong `LoginPage.jsx` và `RegisterPage.jsx`. Khi dùng Google OAuth project riêng, cần thay client ID ở cả hai trang và cấu hình Authorized JavaScript origins tương ứng trong Google Cloud.

### 3. Khởi tạo database và chạy backend

Tiếp tục trong thư mục `backend`:

```powershell
npm run db:update
npm run dev
```

Backend local chạy tại **http://localhost:3000**. Khi khởi động local, backend tự áp dụng migration chưa chạy trước khi nhận request; các thành viên pull mã mới sẽ được cập nhật schema của database trên máy mình.

Khi có biến `VERCEL`, backend xuất Express app, không mở HTTP listener riêng, không khởi tạo Socket.IO và không chạy luồng migration lúc khởi động. Database cloud phải có schema trước khi sử dụng API; phản hồi thành công tại `/` chỉ xác nhận app hoạt động, không xác nhận schema/kết nối database. Thông báo realtime cần dịch vụ riêng khi chạy theo chế độ này.

Kết nối database tự bật TLS tối thiểu 1.2 và xác minh chứng chỉ khi chạy trên Vercel, host thuộc `tidbcloud.com` hoặc cổng 4000; có thể bật bằng `DB_SSL=true` cho host khác. Pool và kết nối migration dùng chung cấu hình này. Với TiDB Cloud, đặt rõ `DB_HOST`, `DB_PORT=4000`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`. Khả năng tương thích toàn bộ migration MySQL với TiDB cần được kiểm tra trên database đích trước khi áp dụng.

**Không import trực tiếp `backend/database/init.sql` vào database đang dùng** vì file gốc có lệnh reset. Runner migration sử dụng phần khởi tạo an toàn và giữ dữ liệu hiện có. Không sửa migration/seed đã áp dụng; tạo phiên bản mới cho thay đổi tiếp theo.

Trong môi trường phát triển, runner có thể nạp dữ liệu nền và seed cộng đồng. Đặt `COMMUNITY_SEED_DEMO=false` để tắt seed cộng đồng tự động. Các bài `[Bài mẫu]` là dữ liệu seed trong database; tài khoản cộng đồng mẫu không có mật khẩu đăng nhập dùng chung. Xem [hướng dẫn database](backend/database/README.md).

### 4. Chạy frontend

Mở terminal thứ hai tại thư mục gốc dự án:

```powershell
cd frontend
npm ci
npm run dev
```

Truy cập **http://localhost:5050**. Frontend mặc định gọi backend tại `http://localhost:3000`. Nếu đổi địa chỉ API, tạo `frontend/.env.local` rồi khởi động lại Vite:

```dotenv
VITE_API_BASE_URL=http://localhost:3000
```

Biến này là địa chỉ gốc, không thêm `/api`. Khi đổi origin frontend, cập nhật `CORS_ORIGIN` ở backend; có thể khai báo nhiều origin, phân cách bằng dấu phẩy.

## Các lệnh thường dùng

| Thư mục chạy | Lệnh | Mục đích |
| --- | --- | --- |
| `backend` | `npm run dev` | Chạy backend với nodemon, tự cập nhật migration |
| `backend` | `npm start` | Chạy backend bằng Node.js |
| `backend` | `npm run db:migrate` | Chỉ cập nhật schema |
| `backend` | `npm run db:seed` | Cập nhật schema và chạy seed chưa áp dụng |
| `backend` | `npm run db:update` | Cập nhật theo chính sách của môi trường hiện tại |
| `backend` | `npm run db:verify-community` | Kiểm tra bảng, dữ liệu và phiên bản migration |
| `frontend` | `npm run dev` | Chạy Vite tại cổng 5050 |
| `frontend` | `npm run build` | Tạo bản build trong `frontend/dist` |
| `frontend` | `npm run preview` | Xem thử bản build frontend |
| `frontend` | `npm run lint` | Chạy ESLint |
| Gốc dự án | `node --test tests/*.test.cjs` | Chạy bộ kiểm thử hồi quy |

Bộ test Node dùng giả lập dịch vụ ngoài, không gọi AI trả phí hoặc ghi database thật. Các lệnh kiểm tra database/API cộng đồng có hướng dẫn riêng trong tài liệu database. Dự án chưa có bộ E2E toàn hệ thống hoặc quy trình triển khai production hoàn chỉnh.

## Bảo mật và phạm vi hiện tại

- JWT Bearer cho API và xác thực kết nối Socket.IO; kiểm tra quyền sở hữu/vai trò tại backend.
- Truy vấn SQL dùng tham số, kiểm tra bộ lọc và whitelist cách sắp xếp; migration bổ sung index cho các truy vấn phổ biến.
- Nội dung chữ được render bằng React; URL ảnh/liên kết được kiểm tra, upload giới hạn loại và kích thước file.
- API kiểm tra Origin cho yêu cầu ghi từ trình duyệt, giới hạn body, thêm security headers và ẩn lỗi nội bộ trong môi trường production.
- Tìm kiếm substring vẫn có thể quét dữ liệu; index B-tree không giải quyết hoàn toàn `LIKE '%...%'`. Kho công thức lớn cần đánh giá lại giải pháp tìm kiếm và chỉ mục vector.
- Báo cáo cộng đồng đã lưu vào database; giao diện xử lý hàng đợi báo cáo và upload video chưa được xây dựng. Giao diện mobile được kiểm tra bằng viewport trình duyệt, chưa xác nhận trên mọi thiết bị vật lý.

Các cơ chế trên không thay thế việc kiểm thử bảo mật và hiệu năng trước khi vận hành thực tế.

## Tài liệu chi tiết

- [Database, migration, seed và API cộng đồng](backend/database/README.md)
- [Tủ lạnh AI: kiến trúc RAG, cấu hình và giới hạn](backend/README-RAG.md)
- [Tìm kiếm, index MySQL, PDF và các thay đổi bảo mật](docs/search-pdf-security.md)
- [Giao diện mobile và phạm vi kiểm tra](docs/mobile-ui.md)
- [SEO, sitemap, công thức công khai và Google Search Console](docs/seo.md)
