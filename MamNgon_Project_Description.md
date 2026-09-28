# 🍜 MâmNgon — Nền tảng Công thức Nấu ăn & Dinh dưỡng Thông minh

> **"Nấu ngon hơn, sống khỏe hơn, tiết kiệm hơn — mỗi ngày."**

---

## 1. Tổng quan Dự án

**MâmNgon** là một nền tảng web kết hợp **mạng xã hội ẩm thực** và **AI lập thực đơn dinh dưỡng** — cho phép người dùng tìm kiếm công thức, tự đăng công thức, lên thực đơn theo ngân sách, và tra cứu nguyên liệu nhanh qua link redirect Shopee/Tiki.

**Đối tượng mục tiêu:**
- Sinh viên muốn ăn ngon, đủ chất với ngân sách hạn hẹp
- Gia đình trẻ muốn lên thực đơn lành mạnh mà không tốn thời gian
- Người yêu thích nấu ăn muốn chia sẻ và khám phá công thức mới
- Người đang theo dõi chế độ ăn đặc biệt (giảm cân, tăng cơ, ăn chay, v.v.)

---

## 2. Công nghệ Sử dụng

| Layer | Công nghệ |
|---|---|
| **Frontend** | ReactJS (Hooks, Context API, React Router v6) |
| **UI Framework** | Bootstrap 5 CSS + React-Bootstrap |
| **Backend** | NodeJS + ExpressJS (RESTful API) |
| **Database** | MongoDB + Mongoose ODM |
| **Authentication** | JWT (JSON Web Token) + bcrypt |
| **AI Integration** | Anthropic Claude API (thực đơn, chatbot) / OpenAI API |
| **File Upload** | Multer + Cloudinary (ảnh công thức) |
| **Real-time** | Socket.IO (thông báo, bình luận live) |
| **Email** | Nodemailer (xác thực email, thông báo hệ thống) |

---

## 3. Kiến trúc Hệ thống

```
MâmNgon/
├── client/                   # ReactJS Frontend
│   ├── src/
│   │   ├── components/       # UI Components tái sử dụng
│   │   ├── pages/            # Các trang chính
│   │   ├── context/          # Auth, Cart, Theme Context
│   │   ├── hooks/            # Custom React Hooks
│   │   ├── services/         # API call functions
│   │   └── utils/            # Helper functions
│
├── server/                   # ExpressJS Backend
│   ├── controllers/          # Xử lý logic nghiệp vụ
│   ├── models/               # Mongoose Schemas
│   ├── routes/               # API Routes
│   ├── middleware/           # Auth, upload, validation
│   ├── services/             # AI service, email service
│   └── config/               # DB, env config
│
└── admin/                    # Trang quản trị (React)
    ├── Dashboard
    ├── Quản lý người dùng
    └── Quản lý công thức/nguyên liệu
```

---

## 4. Tính năng Chi tiết

### 4.1 Xác thực & Hồ sơ Người dùng

| Tính năng | Mô tả |
|---|---|
| Đăng ký / Đăng nhập | JWT Auth, hỗ trợ đăng nhập Google OAuth |
| Xác thực email | Gửi link xác thực qua Nodemailer |
| Trang Profile | Avatar, bio, số công thức đã đăng, lượt theo dõi |
| Follow người dùng | Theo dõi đầu bếp yêu thích, xem feed cá nhân hóa |
| Huy hiệu thành tích | Đầu bếp mới, Top reviewer, Chef chuyên nghiệp... |
| Dark Mode | Chuyển đổi giao diện sáng/tối |

---

### 4.2 Khám phá & Tìm kiếm Công thức

| Tính năng | Mô tả |
|---|---|
| Tìm kiếm toàn văn | Tìm theo tên món, nguyên liệu, tác giả |
| **Tìm theo nguyên liệu có sẵn** | Nhập nguyên liệu trong tủ lạnh → AI gợi ý món làm được ngay |
| Filter đa chiều | Thời gian nấu, calories, danh mục, độ khó, chế độ ăn |
| Sort | Mới nhất, phổ biến nhất, rating cao nhất |
| Công thức theo mùa | Gợi ý món phù hợp theo thời tiết / mùa hiện tại |
| Trending hashtag | #ănchay, #bữasáng, #chobé, #khônggluten... |

---

### 4.3 Đăng & Quản lý Công thức

| Tính năng | Mô tả |
|---|---|
| Upload ảnh / video | Ảnh thumbnail + ảnh từng bước nấu |
| Trình soạn thảo bước nấu | Kéo thả thứ tự các bước, thêm timer cho từng bước |
| Nguyên liệu có đơn vị chuẩn | g, ml, muỗng canh — tự động quy đổi theo khẩu phần |
| Điều chỉnh khẩu phần | Slider tăng/giảm số người → nguyên liệu tự tính lại |
| Bảng dinh dưỡng tự động | AI phân tích calories, protein, carb, fat từ nguyên liệu |
| **Chế độ nấu ăn (Cooking Mode)** | Giao diện full-screen, giọng nói đọc từng bước, timer tích hợp |
| Phiên bản công thức | Tạo biến thể (ít đường, ăn chay, không gluten) |
| Bookmark / Lưu vào bộ sưu tập | Tổ chức công thức theo thư mục tùy chỉnh |

---

### 4.4 Cộng đồng & Tương tác Xã hội

| Tính năng | Mô tả |
|---|---|
| Review & Rating | Đánh giá 5 sao + bình luận ảnh/text |
| **Ảnh "Thành phẩm" của người nấu** | Upload ảnh kết quả khi nấu theo công thức |
| Like & Share | Like công thức, chia sẻ lên mạng xã hội |
| Bình luận lồng nhau | Reply comment, tag người dùng |
| Thông báo real-time | Khi có like, comment, follow mới (Socket.IO) |
| **Cuộc thi nấu ăn online** | Admin mở cuộc thi theo chủ đề, vote bình chọn |
| Bảng xếp hạng Chef | Top chef tuần/tháng theo lượt like + rating |
| Tip & Mẹo nhanh | Bài viết ngắn chia sẻ bí quyết bếp núc |

---

### 4.5 AI Lập Thực đơn Dinh dưỡng ⭐

| Tính năng | Mô tả |
|---|---|
| **Nhập ngân sách + số người** | AI tính toán thực đơn 1–7 ngày trong giới hạn chi phí |
| **Mục tiêu dinh dưỡng** | Giảm cân, tăng cơ, ăn chay, tiểu đường, ăn sạch... |
| **Tránh dị ứng** | Khai báo nguyên liệu dị ứng → AI tự loại khỏi thực đơn |
| Thực đơn tối ưu mùa | Ưu tiên nguyên liệu đang theo mùa (rẻ hơn, tươi hơn) |
| **Xuất PDF thực đơn tuần** | In thực đơn + danh sách mua sắm tổng hợp |
| Tái sử dụng nguyên liệu | AI tối ưu để dùng chung nguyên liệu giữa các bữa, giảm lãng phí |
| Lịch sử thực đơn | Lưu lại các thực đơn đã tạo để tham khảo lại |

---

### 4.6 AI Chatbot Dinh dưỡng 🤖

| Tính năng | Mô tả |
|---|---|
| Hỏi đáp dinh dưỡng | "Cà rốt bao nhiêu calo?", "Ăn gì tốt cho gan?" |
| Gợi ý thay thế nguyên liệu | "Thay bơ bằng gì cho người ăn chay?" |
| Phân tích bữa ăn | Upload ảnh bữa ăn → AI ước tính calo và dinh dưỡng |
| Tư vấn chế độ ăn | Dựa trên chiều cao, cân nặng, mục tiêu sức khỏe |
| Lịch sử trò chuyện | Lưu lại hội thoại để tiếp tục sau |

---

### 4.7 Link Nguyên liệu & Danh sách Mua sắm 🔗

| Tính năng | Mô tả |
|---|---|
| **Link Shopee/Tiki** | Mỗi nguyên liệu trong công thức có icon redirect tìm kiếm sẵn trên Shopee/Tiki |
| **Danh sách mua sắm in được** | Tổng hợp toàn bộ nguyên liệu của thực đơn tuần thành checklist, xuất PDF để đi chợ |
| Phân loại nguyên liệu | Nhóm theo danh mục: rau củ, thịt cá, gia vị, đồ khô... để đi chợ tiện hơn |
| Điều chỉnh theo khẩu phần | Số lượng nguyên liệu tự động tính lại theo số người → danh sách mua chính xác |

---

### 4.8 Bảng Quản trị Admin

| Tính năng | Mô tả |
|---|---|
| Dashboard tổng quan | Thống kê người dùng, công thức mới, lượt xem theo ngày/tuần/tháng |
| Quản lý người dùng | Xem danh sách, khoá/mở tài khoản, phân quyền |
| Quản lý công thức | Duyệt công thức mới, ẩn vi phạm |
| Quản lý danh mục & nguyên liệu | Thêm/sửa/xóa danh mục, cập nhật giá tham khảo nguyên liệu |
| Quản lý cuộc thi | Tạo/kết thúc cuộc thi nấu ăn, chọn người thắng |
| Báo cáo xuất Excel | Export dữ liệu người dùng, công thức theo khoảng thời gian |

---

## 5. Tính năng Sáng tạo Bổ sung 💡

### 5.1 "Tủ Lạnh Ảo" (Smart Fridge)
Người dùng nhập nguyên liệu hiện có trong tủ lạnh → hệ thống gợi ý công thức làm được ngay, đồng thời hiển thị những nguyên liệu còn thiếu và cho phép bổ sung vào giỏ hàng chỉ với 1 click.

### 5.2 Nhật ký Ăn uống & Biểu đồ Dinh dưỡng
Người dùng log bữa ăn mỗi ngày → hệ thống vẽ biểu đồ calo/dinh dưỡng theo tuần/tháng, cảnh báo khi thiếu chất hoặc vượt mức calo mục tiêu.

### 5.3 Chế độ Nấu ăn Tương tác (Cooking Mode)
Khi vào "Cooking Mode": giao diện full-screen không tắt màn hình, giọng nói đọc từng bước (Text-to-Speech), timer đếm ngược cho từng giai đoạn, vuốt sang bước tiếp theo bằng gesture.

### 5.4 Công thức Theo Ngân sách Siêu thị
Tích hợp bảng giá nguyên liệu tham khảo (cập nhật định kỳ) để AI có thể ước tính chi phí thực tế của mỗi công thức trước khi người dùng nấu.

### 5.5 "Ăn Gì Hôm Nay?" — Spinner Ngẫu nhiên
Không biết nấu gì? Bấm nút → hệ thống spin wheel ngẫu nhiên gợi ý 1 món trong bộ công thức yêu thích hoặc theo tiêu chí lọc (chỉ món dưới 30 phút, dưới 500 calo, v.v.).

### 5.6 So sánh Công thức
Đặt 2–3 công thức cùng tên cạnh nhau để so sánh nguyên liệu, thời gian, calo, chi phí và đánh giá → giúp người dùng chọn công thức phù hợp nhất.

### 5.7 Gợi ý Rượu / Đồ uống Đi kèm
Với các món đặc biệt, AI gợi ý loại đồ uống phù hợp (nước ép, trà thảo mộc, v.v.) và cách pha chế đơn giản.

### 5.8 Thử thách Nấu ăn 7 Ngày
Người dùng đăng ký thử thách "Nấu đủ 7 ngày theo thực đơn AI", mỗi ngày upload ảnh thành phẩm để nhận huy hiệu. Tạo engagement cao và thói quen sử dụng hàng ngày.

### 5.9 Chia sẻ Thực đơn Nhóm
Tạo link invite cho nhóm bạn/gia đình cùng xem và góp ý thực đơn tuần, mỗi người có thể thêm/bớt món và xuất danh sách nguyên liệu tổng hợp để đi chợ chung.

### 5.10 Nhắc nhở Nấu ăn (Push Notification)
Đặt lịch nhắc: "7:00 sáng thứ 2 nhắc mua nguyên liệu theo thực đơn tuần" hoặc "6:30 chiều nhắc bắt đầu nấu bữa tối" — tích hợp PWA để nhận thông báo ngay cả khi không mở trình duyệt.

---

## 6. Mongoose Schemas Chính

### User Schema
```javascript
{
  name, email, passwordHash,
  avatar, bio,
  role: ['user', 'admin'],
  following: [userId],
  followers: [userId],
  badges: [{ name, awardedAt }],
  fridgeItems: [{ name, quantity, unit, expiryDate }],
  foodLog: [{ date, meals: [{ recipeId, servings, calories }] }],
  preferences: { diet, allergies, calorieGoal },
  notifications: { email, push },
  isVerified, isActive, createdAt
}
```

### Recipe Schema
```javascript
{
  title, slug, description, author: userId,
  images: [url], videoUrl,
  category, tags, difficulty,
  prepTime, cookTime,
  servings, caloriesPerServing,
  nutrition: { protein, carbs, fat, fiber },
  ingredients: [{ name, amount, unit, linkedProductUrl }],
  steps: [{ order, instruction, image, timerSeconds }],
  variants: [{ name, changes }],
  stats: { views, saves, avgRating, reviewCount },
  status: ['draft', 'published', 'hidden'],
  season: ['spring','summer','autumn','winter','all'],
  createdAt, updatedAt
}
```

### Review Schema
```javascript
{
  recipe: recipeId,
  author: userId,
  rating: Number (1-5),
  comment: String,
  resultImage: url,
  helpful: [userId],
  createdAt
}
```

### MealPlan Schema
```javascript
{
  user: userId,
  title, budget, people,
  goal: ['weightLoss','muscleGain','vegetarian','balanced'],
  allergies: [String],
  days: [{
    date,
    meals: {
      breakfast: recipeId,
      lunch: recipeId,
      dinner: recipeId,
      snack: recipeId
    },
    totalCalories, totalCost
  }],
  shoppingList: [{ ingredient, totalAmount, unit, estimatedCost }],
  aiGenerated: Boolean,
  createdAt
}
```

---

## 7. API Endpoints Chính

### Auth
```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/logout
GET    /api/auth/verify-email/:token
POST   /api/auth/forgot-password
POST   /api/auth/reset-password
GET    /api/auth/google              # OAuth
```

### Recipes
```
GET    /api/recipes                  # List + filter + search
GET    /api/recipes/:slug            # Chi tiết
POST   /api/recipes                  # Đăng công thức (auth)
PUT    /api/recipes/:id              # Sửa (auth + owner)
DELETE /api/recipes/:id              # Xoá
GET    /api/recipes/suggest/fridge   # Gợi ý từ tủ lạnh
GET    /api/recipes/random           # Spinner ngẫu nhiên
POST   /api/recipes/:id/bookmark     # Lưu yêu thích
```

### Reviews
```
GET    /api/recipes/:id/reviews
POST   /api/recipes/:id/reviews      # Đánh giá (auth)
DELETE /api/reviews/:id
POST   /api/reviews/:id/helpful      # Vote hữu ích
```

### AI Services
```
POST   /api/ai/meal-plan             # Lập thực đơn AI
POST   /api/ai/chat                  # Chatbot dinh dưỡng
POST   /api/ai/analyze-nutrition     # Phân tích calo từ ảnh
GET    /api/ai/suggest-drink/:recipeId  # Gợi ý đồ uống
```

### Users & Social
```
GET    /api/users/:id                # Profile
PUT    /api/users/me                 # Cập nhật profile
POST   /api/users/:id/follow         # Follow/unfollow
GET    /api/users/me/feed            # Feed cá nhân hóa
POST   /api/users/me/fridge          # Cập nhật tủ lạnh ảo
POST   /api/users/me/food-log        # Ghi nhật ký ăn uống
GET    /api/users/me/food-log/stats  # Thống kê dinh dưỡng
```

### Competitions
```
GET    /api/competitions             # Danh sách cuộc thi
POST   /api/competitions/:id/submit  # Nộp bài thi
POST   /api/competitions/:id/vote    # Bình chọn
```

---

## 8. Màn hình / Trang Giao diện

| Trang | Mô tả |
|---|---|
| `/` | Trang chủ: Hero banner, công thức nổi bật, trending |
| `/recipes` | Danh sách công thức + filter sidebar |
| `/recipes/:slug` | Chi tiết công thức + Cooking Mode |
| `/recipes/create` | Form đăng công thức |
| `/meal-planner` | AI lập thực đơn |
| `/chatbot` | AI chatbot dinh dưỡng |
| `/cart` | Giỏ hàng nguyên liệu |
| `/checkout` | Thông tin giao hàng COD |
| `/orders` | Lịch sử đơn hàng |
| `/profile/:id` | Trang hồ sơ người dùng |
| `/profile/me/fridge` | Quản lý tủ lạnh ảo |
| `/profile/me/food-log` | Nhật ký dinh dưỡng + biểu đồ |
| `/leaderboard` | Bảng xếp hạng chef |
| `/competitions` | Cuộc thi nấu ăn |
| `/admin/*` | Bảng quản trị |

---

## 9. Lộ trình Phát triển (Roadmap)

### Giai đoạn 1 — MVP (4–6 tuần)
- Đăng ký/đăng nhập JWT
- CRUD công thức (đăng, xem, sửa, xoá)
- Tìm kiếm & filter cơ bản
- Review & rating
- Bookmark
- Giỏ hàng + đặt hàng COD cơ bản
- Admin quản lý đơn hàng

### Giai đoạn 2 — AI & Social (4–6 tuần)
- AI lập thực đơn theo ngân sách
- AI chatbot dinh dưỡng
- Follow người dùng & feed cá nhân hóa
- Cooking Mode
- Điều chỉnh khẩu phần tự động
- Tủ lạnh ảo + gợi ý từ nguyên liệu có sẵn

### Giai đoạn 3 — Engagement & Polish (3–4 tuần)
- Nhật ký ăn uống + biểu đồ dinh dưỡng
- Cuộc thi nấu ăn
- Bảng xếp hạng chef
- Thử thách 7 ngày
- Nhắc nhở (PWA notification)
- So sánh công thức
- Chia sẻ giỏ hàng nhóm
- Export PDF thực đơn + danh sách mua sắm

---

## 10. Cấu trúc Thư mục Chi tiết

```
mamngon/
├── client/
│   ├── public/
│   └── src/
│       ├── assets/           # Ảnh, icon tĩnh
│       ├── components/
│       │   ├── common/       # Button, Modal, Spinner, Toast
│       │   ├── recipe/       # RecipeCard, RecipeForm, CookingMode
│       │   ├── cart/         # CartItem, CartSummary
│       │   ├── ai/           # ChatBot, MealPlanForm
│       │   └── layout/       # Navbar, Footer, Sidebar
│       ├── context/
│       │   ├── AuthContext.jsx
│       │   ├── CartContext.jsx
│       │   └── ThemeContext.jsx
│       ├── hooks/
│       │   ├── useRecipes.js
│       │   ├── useDebounce.js
│       │   └── useLocalStorage.js
│       ├── pages/            # Các trang chính
│       ├── services/         # axios API calls
│       ├── utils/            # format, validate, nutrition calc
│       └── App.jsx
│
├── server/
│   ├── config/
│   │   ├── db.js             # Mongoose connect
│   │   └── cloudinary.js
│   ├── controllers/
│   ├── middleware/
│   │   ├── auth.js           # JWT verify
│   │   ├── upload.js         # Multer
│   │   └── validate.js       # Joi/express-validator
│   ├── models/
│   ├── routes/
│   ├── services/
│   │   ├── aiService.js      # Claude/OpenAI API calls
│   │   └── emailService.js   # Nodemailer
│   ├── utils/
│   └── app.js
│
├── .env.example
├── package.json
└── README.md
```

---

*Tài liệu này mô tả toàn bộ dự án MâmNgon — phiên bản 1.0. Được soạn thảo với mục đích làm tài liệu tham chiếu cho nhóm phát triển.*
