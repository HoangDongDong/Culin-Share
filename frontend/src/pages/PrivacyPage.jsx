import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';

const SECTIONS = [
  { id: 'muc-1', title: '1. Dữ liệu chúng tôi thu thập' },
  { id: 'muc-2', title: '2. Mục đích sử dụng dữ liệu' },
  { id: 'muc-3', title: '3. Cam kết không bán dữ liệu & Bên thứ ba' },
  { id: 'muc-4', title: '4. Biện pháp bảo mật & Lưu trữ' },
  { id: 'muc-5', title: '5. Quyền kiểm soát dữ liệu của bạn' },
  { id: 'muc-6', title: '6. Bảo vệ quyền riêng tư trẻ em' },
  { id: 'muc-7', title: '7. Liên hệ phụ trách bảo mật' },
];

export default function PrivacyPage() {
  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="min-h-screen bg-[#fbf9f8] flex flex-col font-sans text-stone-800">
      <Header />

      <main className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 flex-1">
        {/* Breadcrumb */}
        <nav className="text-xs sm:text-sm text-stone-500 mb-6 flex items-center gap-1.5">
          <Link to="/" className="hover:text-primary transition-colors">Trang chủ</Link>
          <span>/</span>
          <span className="text-stone-800 font-medium">Chính sách quyền riêng tư</span>
        </nav>

        {/* Hero Header */}
        <div className="max-w-3xl mb-10">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 mb-3">
            <svg className="w-4 h-4 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Bảo vệ dữ liệu cá nhân
          </span>
          <h1 className="text-2xl sm:text-4xl font-display font-bold text-stone-900 tracking-tight mb-3">
            Chính sách Quyền riêng tư CulinShare
          </h1>
          <p className="text-xs sm:text-sm text-stone-500">
            Cập nhật lần cuối: <span className="font-medium text-stone-700">Tháng 11 năm 2026</span> · Chúng tôi cam kết minh bạch và tôn trọng tuyệt đối quyền riêng tư của mọi người dùng.
          </p>
        </div>

        {/* Highlight Banner */}
        <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 mb-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🛡️</span>
            <div>
              <p className="font-bold text-sm">Cam kết bảo mật 100% dữ liệu ẩm thực</p>
              <p className="text-xs text-emerald-700">CulinShare không bao giờ bán dữ liệu hay danh sách tủ lạnh cá nhân của bạn cho bên thứ ba vì mục đích quảng cáo.</p>
            </div>
          </div>
          <Link
            to="/cookies"
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold whitespace-nowrap transition-colors"
          >
            Quản lý Cookie →
          </Link>
        </div>

        {/* Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Sidebar TOC */}
          <div className="hidden lg:block lg:col-span-4 sticky top-24">
            <div className="bg-white rounded-2xl border border-stone-200/90 p-5 shadow-xs">
              <h3 className="font-bold text-stone-900 text-sm uppercase tracking-wider mb-4 pb-2 border-b border-stone-100 flex items-center gap-2">
                <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Nội dung chính sách
              </h3>
              <ul className="space-y-1.5 text-xs text-stone-600">
                {SECTIONS.map((sec) => (
                  <li key={sec.id}>
                    <button
                      onClick={() => scrollTo(sec.id)}
                      className="text-left w-full py-1.5 px-2.5 rounded-lg hover:bg-stone-50 hover:text-emerald-700 transition-all font-medium"
                    >
                      {sec.title}
                    </button>
                  </li>
                ))}
              </ul>

              <div className="mt-6 pt-4 border-t border-stone-100">
                <p className="text-[11px] text-stone-500 mb-2">Thông tin liên quan:</p>
                <div className="flex flex-col gap-1 text-xs">
                  <Link to="/terms" className="text-primary hover:underline">Điều khoản dịch vụ →</Link>
                  <Link to="/cookies" className="text-primary hover:underline">Chính sách Cookie →</Link>
                  <Link to="/contact" className="text-primary hover:underline">Liên hệ bộ phận dữ liệu →</Link>
                </div>
              </div>
            </div>
          </div>

          {/* Main Legal Content Articles */}
          <div className="lg:col-span-8 bg-white rounded-3xl border border-stone-200/90 p-6 sm:p-10 shadow-xs space-y-10 leading-relaxed text-xs sm:text-sm text-stone-700">
            {/* Mục 1 */}
            <section id="muc-1" className="scroll-mt-24">
              <h2 className="text-lg sm:text-xl font-bold text-stone-900 mb-3 flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 text-xs flex items-center justify-center font-bold">1</span>
                Dữ liệu chúng tôi thu thập
              </h2>
              <p className="mb-3">
                Nhằm cung cấp các tiện ích ẩm thực tối ưu, CulinShare thu thập một số thông tin hạn chế sau:
              </p>
              <div className="space-y-3">
                <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200/70">
                  <p className="font-semibold text-stone-900 text-xs sm:text-sm mb-1">👤 Thông tin tài khoản người dùng:</p>
                  <p className="text-stone-600">Họ tên hiển thị, địa chỉ email, số điện thoại (nếu có), ảnh đại diện (avatar), tiểu sử bản thân và mật khẩu được mã hóa một chiều qua thuật toán bcrypt.</p>
                </div>

                <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200/70">
                  <p className="font-semibold text-stone-900 text-xs sm:text-sm mb-1">🥬 Dữ liệu sở thích ẩm thực & Tủ lạnh thông minh:</p>
                  <p className="text-stone-600">Danh sách nguyên liệu bạn lưu trong Tủ lạnh ảo (thịt bò, cà chua, hành lá...), các bộ sưu tập món đã lưu (Món muốn thử, Bữa tối nhanh, Món đã nấu), và lịch sử tìm kiếm món ăn.</p>
                </div>

                <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200/70">
                  <p className="font-semibold text-stone-900 text-xs sm:text-sm mb-1">📸 Nội dung đóng góp & Ảnh thành phẩm (Cooksnap):</p>
                  <p className="text-stone-600">Công thức do bạn tự viết, các đánh giá, ảnh chụp thành phẩm đĩa ăn thực tế tải lên, và bình luận trao đổi trong cộng đồng CulinShare.</p>
                </div>

                <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200/70">
                  <p className="font-semibold text-stone-900 text-xs sm:text-sm mb-1">🌐 Dữ liệu kỹ thuật ẩn danh:</p>
                  <p className="text-stone-600">Địa chỉ IP, loại trình duyệt, độ phân giải màn hình và thời gian phản hồi trang để cải thiện tốc độ tải và đảm bảo an ninh mạng.</p>
                </div>
              </div>
            </section>

            {/* Mục 2 */}
            <section id="muc-2" className="scroll-mt-24 pt-4 border-t border-stone-100">
              <h2 className="text-lg sm:text-xl font-bold text-stone-900 mb-3 flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 text-xs flex items-center justify-center font-bold">2</span>
                Mục đích sử dụng dữ liệu
              </h2>
              <p className="mb-2">Chúng tôi sử dụng dữ liệu thu thập được cho các mục đích thiết thực sau:</p>
              <ul className="list-disc pl-5 space-y-2 text-stone-600">
                <li><strong>Cá nhân hóa thực đơn AI:</strong> Giúp thuật toán Tủ lạnh thông minh (RAG AI) phân tích nguyên liệu bạn đang có để gợi ý món ăn chuẩn xác nhất.</li>
                <li><strong>Bảo mật & Quản lý phiên đăng nhập:</strong> Xác thực danh tính, gửi mã OTP kích hoạt tài khoản hoặc khôi phục mật khẩu an toàn.</li>
                <li><strong>Thông báo tương tác thời gian thực:</strong> Gửi thông báo khi có người bình luận vào công thức, thả tim bài viết, hoặc khi tác giả phản hồi ảnh Cooksnap của bạn.</li>
                <li><strong>Tối ưu hóa nền tảng:</strong> Đo lường tốc độ phản hồi máy chủ, phát hiện lỗi hệ thống và nâng cấp trải nghiệm người dùng.</li>
              </ul>
            </section>

            {/* Mục 3 */}
            <section id="muc-3" className="scroll-mt-24 pt-4 border-t border-stone-100">
              <h2 className="text-lg sm:text-xl font-bold text-stone-900 mb-3 flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 text-xs flex items-center justify-center font-bold">3</span>
                Cam kết không bán dữ liệu & Bên thứ ba
              </h2>
              <p className="mb-3 font-medium text-stone-800">
                CulinShare tôn trọng quyền riêng tư tuyệt đối: Chúng tôi <span className="text-red-600 font-bold uppercase">không bao giờ</span> bán, cho thuê hoặc chuyển nhượng thông tin cá nhân của bạn cho bất kỳ đơn vị quảng cáo hay bên thứ ba nào.
              </p>
              <p className="mb-2 text-stone-600">
                Dữ liệu chỉ được truyền tải có giới hạn đến các đối tác kỹ thuật hạ tầng đạt tiêu chuẩn bảo mật quốc tế:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-3">
                <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                  <p className="font-bold text-xs text-stone-900">Google Gemini AI</p>
                  <p className="text-[11px] text-stone-500 mt-1">Xử lý ngôn ngữ nguyên liệu; tuyệt đối không gửi thông tin danh tính cá nhân.</p>
                </div>
                <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                  <p className="font-bold text-xs text-stone-900">Cloudinary</p>
                  <p className="text-[11px] text-stone-500 mt-1">Lưu trữ ảnh món ăn và avatar an toàn trên mạng phân phối nội dung (CDN).</p>
                </div>
                <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                  <p className="font-bold text-xs text-stone-900">TiDB Cloud</p>
                  <p className="text-[11px] text-stone-500 mt-1">Cơ sở dữ liệu đám mây bảo mật cao cấp mã hóa TLSv1.3 trên hạ tầng AWS.</p>
                </div>
              </div>
            </section>

            {/* Mục 4 */}
            <section id="muc-4" className="scroll-mt-24 pt-4 border-t border-stone-100">
              <h2 className="text-lg sm:text-xl font-bold text-stone-900 mb-3 flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 text-xs flex items-center justify-center font-bold">4</span>
                Biện pháp bảo mật & Lưu trữ
              </h2>
              <ul className="list-disc pl-5 space-y-2 text-stone-600">
                <li><strong>Mã hóa mật khẩu một chiều:</strong> Mật khẩu của bạn được băm (hash) bằng bcrypt với salt rounds an toàn trước khi lưu vào CSDL; ngay cả nhân viên kỹ thuật CulinShare cũng không thể đọc được mật khẩu gốc.</li>
                <li><strong>Giao thức bảo mật HTTPS/TLS:</strong> Mọi dữ liệu truyền giữa trình duyệt của bạn và máy chủ CulinShare đều được mã hóa bằng chứng chỉ SSL/TLS.</li>
                <li><strong>Phân quyền chặt chẽ (RBAC):</strong> Cơ chế phân quyền nhiều lớp bảo đảm chỉ có tài khoản của bạn mới có thể chỉnh sửa hồ sơ và công thức cá nhân.</li>
              </ul>
            </section>

            {/* Mục 5 */}
            <section id="muc-5" className="scroll-mt-24 pt-4 border-t border-stone-100">
              <h2 className="text-lg sm:text-xl font-bold text-stone-900 mb-3 flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 text-xs flex items-center justify-center font-bold">5</span>
                Quyền kiểm soát dữ liệu của bạn
              </h2>
              <p className="mb-2">Bạn hoàn toàn làm chủ dữ liệu của mình trên CulinShare với các quyền hạn sau:</p>
              <div className="space-y-2 text-stone-600">
                <p>✓ <strong>Quyền xem & chỉnh sửa:</strong> Bạn có thể cập nhật họ tên, ảnh đại diện, số điện thoại, mật khẩu bất kỳ lúc nào tại <Link to="/profile" className="text-primary font-medium hover:underline">Trang hồ sơ cá nhân</Link>.</p>
                <p>✓ <strong>Quyền quản lý nội dung:</strong> Tự do thêm, sửa, đổi bộ sưu tập hoặc xóa các công thức, ảnh Cooksnap do mình đã đăng.</p>
                <p>✓ <strong>Quyền yêu cầu xóa tài khoản:</strong> Bạn có quyền yêu cầu xóa vĩnh viễn tài khoản và toàn bộ dữ liệu kèm theo khỏi hệ thống bằng cách gửi yêu cầu qua form liên hệ.</p>
              </div>
            </section>

            {/* Mục 6 */}
            <section id="muc-6" className="scroll-mt-24 pt-4 border-t border-stone-100">
              <h2 className="text-lg sm:text-xl font-bold text-stone-900 mb-3 flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 text-xs flex items-center justify-center font-bold">6</span>
                Bảo vệ quyền riêng tư trẻ em
              </h2>
              <p className="text-stone-600">
                CulinShare không chủ đích thu thập dữ liệu cá nhân của trẻ em dưới 13 tuổi khi không có sự đồng ý của phụ huynh. Nếu chúng tôi phát hiện thông tin của trẻ em dưới 13 tuổi được gửi mà chưa có sự đồng ý hợp lệ, chúng tôi sẽ ngay lập tức xóa dữ liệu đó khỏi máy chủ.
              </p>
            </section>

            {/* Mục 7 */}
            <section id="muc-7" className="scroll-mt-24 pt-4 border-t border-stone-100">
              <h2 className="text-lg sm:text-xl font-bold text-stone-900 mb-3 flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 text-xs flex items-center justify-center font-bold">7</span>
                Liên hệ phụ trách bảo mật
              </h2>
              <p className="mb-4 text-stone-600">
                Nếu bạn có bất kỳ câu hỏi hoặc khiếu nại nào liên quan đến chính sách quyền riêng tư hay bảo mật thông tin, vui lòng liên hệ Ban Quản Trị CulinShare qua:
              </p>
              <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200/80 text-xs space-y-1.5">
                <p>📧 <strong>Email chuyên trách bảo mật:</strong> <a href="mailto:privacy@culinshare.com" className="text-primary hover:underline">privacy@culinshare.com</a></p>
                <p>📞 <strong>Hotline bảo mật:</strong> 1900 6868</p>
                <p>📝 <strong>Gửi tin nhắn trực tiếp:</strong> <Link to="/contact" className="text-primary font-medium hover:underline">Trang liên hệ CulinShare</Link></p>
              </div>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
