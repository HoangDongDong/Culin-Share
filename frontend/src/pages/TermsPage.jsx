import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';

const SECTIONS = [
  { id: 'dieu-1', title: '1. Giới thiệu & Phạm vi áp dụng' },
  { id: 'dieu-2', title: '2. Tài khoản & Trách nhiệm thành viên' },
  { id: 'dieu-3', title: '3. Quyền sở hữu trí tuệ & Bản quyền công thức' },
  { id: 'dieu-4', title: '4. Tiêu chuẩn cộng đồng & Hành vi nghiêm cấm' },
  { id: 'dieu-5', title: '5. Miễn trừ trách nhiệm về an toàn & dị ứng' },
  { id: 'dieu-6', title: '6. Quyền kiểm duyệt & Chế tài xử lý vi phạm' },
  { id: 'dieu-7', title: '7. Bảo mật & Thay đổi điều khoản' },
  { id: 'dieu-8', title: '8. Kênh liên hệ & Giải quyết khiếu nại' },
];

export default function TermsPage() {
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
          <span className="text-stone-800 font-medium">Điều khoản sử dụng</span>
        </nav>

        {/* Hero Header */}
        <div className="max-w-3xl mb-10">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary mb-3">
            Quy chế hoạt động nền tảng
          </span>
          <h1 className="text-2xl sm:text-4xl font-display font-bold text-stone-900 tracking-tight mb-3">
            Điều khoản Dịch vụ CulinShare
          </h1>
          <p className="text-xs sm:text-sm text-stone-500">
            Cập nhật lần cuối: <span className="font-medium text-stone-700">Tháng 11 năm 2026</span> · Áp dụng cho toàn bộ thành viên và khách truy cập nền tảng Bếp Nhà Mình – CulinShare.
          </p>
        </div>

        {/* Content Layout: Sidebar Table of Contents (4 cols) + Content Body (8 cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Table of contents sticky */}
          <div className="hidden lg:block lg:col-span-4 sticky top-24">
            <div className="bg-white rounded-2xl border border-stone-200/90 p-5 shadow-xs">
              <h3 className="font-bold text-stone-900 text-sm uppercase tracking-wider mb-4 pb-2 border-b border-stone-100 flex items-center gap-2">
                <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
                Mục lục điều khoản
              </h3>
              <ul className="space-y-1.5 text-xs text-stone-600">
                {SECTIONS.map((sec) => (
                  <li key={sec.id}>
                    <button
                      onClick={() => scrollTo(sec.id)}
                      className="text-left w-full py-1.5 px-2.5 rounded-lg hover:bg-stone-50 hover:text-primary transition-all font-medium"
                    >
                      {sec.title}
                    </button>
                  </li>
                ))}
              </ul>

              <div className="mt-6 pt-4 border-t border-stone-100">
                <p className="text-[11px] text-stone-500 mb-2">Xem thêm chính sách liên quan:</p>
                <div className="flex flex-col gap-1 text-xs">
                  <Link to="/privacy" className="text-primary hover:underline">Chính sách bảo mật →</Link>
                  <Link to="/cookies" className="text-primary hover:underline">Chính sách Cookie →</Link>
                  <Link to="/contact" className="text-primary hover:underline">Liên hệ hỗ trợ →</Link>
                </div>
              </div>
            </div>
          </div>

          {/* Main Legal Content Articles */}
          <div className="lg:col-span-8 bg-white rounded-3xl border border-stone-200/90 p-6 sm:p-10 shadow-xs space-y-10 leading-relaxed text-xs sm:text-sm text-stone-700">
            {/* Điều 1 */}
            <section id="dieu-1" className="scroll-mt-24">
              <h2 className="text-lg sm:text-xl font-bold text-stone-900 mb-3 flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-orange-100 text-primary text-xs flex items-center justify-center font-bold">1</span>
                Giới thiệu & Phạm vi áp dụng
              </h2>
              <p className="mb-3">
                Chào mừng bạn đến với <strong>Bếp Nhà Mình – CulinShare</strong> (sau đây gọi tắt là "CulinShare", "chúng tôi" hoặc "nền tảng"). CulinShare là nền tảng mạng xã hội ẩm thực và chia sẻ công thức nấu ăn trực tuyến, kết hợp trợ lý Tủ lạnh ảo AI nhằm hỗ trợ gợi ý món ngon mỗi ngày cho gia đình Việt.
              </p>
              <p>
                Bằng việc truy cập, đăng ký tài khoản hoặc sử dụng bất kỳ dịch vụ nào trên website <strong>bepnhaminh.page</strong>, bạn xác nhận đã đọc, hiểu và đồng ý chịu sự ràng buộc của Điều khoản dịch vụ này cùng với <Link to="/privacy" className="text-primary font-medium hover:underline">Chính sách bảo mật</Link> của chúng tôi. Nếu bạn không đồng ý với bất kỳ phần nào, vui lòng ngừng sử dụng dịch vụ.
              </p>
            </section>

            {/* Điều 2 */}
            <section id="dieu-2" className="scroll-mt-24 pt-4 border-t border-stone-100">
              <h2 className="text-lg sm:text-xl font-bold text-stone-900 mb-3 flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-orange-100 text-primary text-xs flex items-center justify-center font-bold">2</span>
                Tài khoản & Trách nhiệm thành viên
              </h2>
              <ul className="list-disc pl-5 space-y-2 mb-3">
                <li><strong>Độ tuổi sử dụng:</strong> Nền tảng dành cho người dùng từ đủ 13 tuổi trở lên. Trường hợp dưới 13 tuổi cần có sự giám sát của cha mẹ hoặc người giám hộ khi thực hiện các món ăn có sử dụng thiết bị nhà bếp sinh nhiệt hoặc dao kéo sắc nhọn.</li>
                <li><strong>Tính xác thực của thông tin:</strong> Bạn cam kết cung cấp thông tin trung thực, chính xác khi đăng ký tài khoản (tên hiển thị, email xác thực).</li>
                <li><strong>Bảo mật tài khoản:</strong> Bạn có trách nhiệm tự bảo vệ mật khẩu đăng nhập và thông tin xác thực OTP. Mọi hành động phát sinh từ tài khoản của bạn sẽ được xem là do chính bạn thực hiện.</li>
                <li><strong>Nghiêm cấm chia sẻ:</strong> Không mua bán, chuyển nhượng hoặc cho người khác mượn tài khoản với mục đích trục lợi hoặc thực hiện hành vi gian lận.</li>
              </ul>
            </section>

            {/* Điều 3 */}
            <section id="dieu-3" className="scroll-mt-24 pt-4 border-t border-stone-100">
              <h2 className="text-lg sm:text-xl font-bold text-stone-900 mb-3 flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-orange-100 text-primary text-xs flex items-center justify-center font-bold">3</span>
                Quyền sở hữu trí tuệ & Bản quyền công thức
              </h2>
              <p className="mb-3">
                Chúng tôi đặc biệt tôn trọng công sức sáng tạo của các đầu bếp và người yêu bếp:
              </p>
              <ul className="list-disc pl-5 space-y-2 mb-3">
                <li><strong>Bản quyền của tác giả:</strong> Bạn giữ nguyên toàn bộ quyền sở hữu trí tuệ đối với các công thức, hình ảnh thành phẩm (Cooksnap) và bài viết do chính bạn sáng tạo và tải lên CulinShare.</li>
                <li><strong>Giấy phép cấp cho CulinShare:</strong> Khi đăng tải nội dung công khai lên nền tảng, bạn cấp cho CulinShare quyền sử dụng phi độc quyền, miễn phí bản quyền trên phạm vi toàn cầu để lưu trữ, hiển thị, định dạng và giới thiệu công thức đến cộng đồng thành viên.</li>
                <li><strong>Tôn trọng quyền tác giả:</strong> Nghiêm cấm sao chép nguyên văn công thức, ảnh chụp của người khác mà không có sự đồng ý của tác giả hoặc không ghi rõ nguồn gốc xuất xứ.</li>
              </ul>
            </section>

            {/* Điều 4 */}
            <section id="dieu-4" className="scroll-mt-24 pt-4 border-t border-stone-100">
              <h2 className="text-lg sm:text-xl font-bold text-stone-900 mb-3 flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-orange-100 text-primary text-xs flex items-center justify-center font-bold">4</span>
                Tiêu chuẩn cộng đồng & Hành vi nghiêm cấm
              </h2>
              <p className="mb-2">Để xây dựng môi trường văn minh, tích cực, người dùng cam kết <strong>KHÔNG</strong> thực hiện các hành vi sau:</p>
              <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200/80 space-y-2 text-stone-600">
                <p>❌ <strong>Nội dung độc hại:</strong> Đăng tải hướng dẫn chế biến sử dụng nguyên liệu nguy hiểm, hóa chất cấm, động vật hoang dã nguy cấp, hoặc hướng dẫn sơ chế gây ngộ độc.</p>
                <p>❌ <strong>Ngôn từ thù địch:</strong> Sử dụng từ ngữ tục tĩu, xúc phạm danh dự nhân phẩm người khác, phân biệt vùng miền, tôn giáo, giới tính trong phần bình luận hay đánh giá.</p>
                <p>❌ <strong>Spam & Quảng cáo rác:</strong> Đăng nội dung trùng lặp liên tục, chèn link bán hàng lừa đảo, cờ bạc, đa cấp trái phép.</p>
                <p>❌ <strong>Tấn công kỹ thuật:</strong> Sử dụng bot, crawler tự động cào dữ liệu, cố tình khai thác lỗ hổng bảo mật hoặc làm nghẽn máy chủ CulinShare.</p>
              </div>
            </section>

            {/* Điều 5 */}
            <section id="dieu-5" className="scroll-mt-24 pt-4 border-t border-stone-100">
              <h2 className="text-lg sm:text-xl font-bold text-stone-900 mb-3 flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-orange-100 text-primary text-xs flex items-center justify-center font-bold">5</span>
                Miễn trừ trách nhiệm về an toàn & dị ứng
              </h2>
              <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 text-amber-900 space-y-2">
                <p className="font-semibold flex items-center gap-2">
                  <svg className="w-5 h-5 text-amber-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  Lưu ý quan trọng về sức khỏe và dị ứng thực phẩm:
                </p>
                <p className="text-xs sm:text-sm text-amber-800 leading-relaxed">
                  Mọi công thức nấu ăn, thời gian chế biến, định lượng calo và gợi ý từ trợ lý AI Tủ lạnh ảo chỉ mang tính chất tham khảo thực tế. Người dùng có trách nhiệm tự kiểm tra độ tươi sống, vệ sinh an toàn thực phẩm cũng như tiền sử dị ứng nguyên liệu (ví dụ: hải sản, đậu phộng, sữa chua chua...) của bản thân và người ăn trước khi nấu. CulinShare không chịu trách nhiệm pháp lý đối với bất kỳ rủi ro sức khỏe phát sinh do bảo quản nguyên liệu hoặc thực hành chế biến không đúng cách.
                </p>
              </div>
            </section>

            {/* Điều 6 */}
            <section id="dieu-6" className="scroll-mt-24 pt-4 border-t border-stone-100">
              <h2 className="text-lg sm:text-xl font-bold text-stone-900 mb-3 flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-orange-100 text-primary text-xs flex items-center justify-center font-bold">6</span>
                Quyền kiểm duyệt & Chế tài xử lý vi phạm
              </h2>
              <p className="mb-3">
                Ban Quản Trị CulinShare duy trì hệ thống kiểm duyệt cộng đồng và có toàn quyền:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-stone-600">
                <li>Ẩn hoặc gỡ bỏ các công thức, bài viết, bình luận vi phạm bản quyền hoặc tiêu chuẩn cộng đồng mà không cần báo trước.</li>
                <li>Gửi cảnh cáo trong hộp thông báo của người dùng vi phạm.</li>
                <li>Tạm ngừng tính năng đăng bài hoặc khóa tài khoản vĩnh viễn đối với các trường hợp tái phạm nghiêm trọng.</li>
              </ul>
            </section>

            {/* Điều 7 */}
            <section id="dieu-7" className="scroll-mt-24 pt-4 border-t border-stone-100">
              <h2 className="text-lg sm:text-xl font-bold text-stone-900 mb-3 flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-orange-100 text-primary text-xs flex items-center justify-center font-bold">7</span>
                Bảo mật & Thay đổi điều khoản
              </h2>
              <p className="mb-3">
                Chúng tôi có thể cập nhật, bổ sung Điều khoản dịch vụ này tùy theo sự phát triển của các tính năng mới hoặc yêu cầu của pháp luật. Khi có thay đổi quan trọng, CulinShare sẽ thông báo công khai trên website. Việc bạn tiếp tục sử dụng nền tảng sau thời điểm cập nhật đồng nghĩa với việc bạn chấp thuận các điều khoản sửa đổi đó.
              </p>
            </section>

            {/* Điều 8 */}
            <section id="dieu-8" className="scroll-mt-24 pt-4 border-t border-stone-100">
              <h2 className="text-lg sm:text-xl font-bold text-stone-900 mb-3 flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-orange-100 text-primary text-xs flex items-center justify-center font-bold">8</span>
                Kênh liên hệ & Giải quyết khiếu nại
              </h2>
              <p className="mb-4">
                Nếu bạn có bất kỳ câu hỏi nào về Điều khoản dịch vụ hoặc muốn khiếu nại về bản quyền nội dung trên CulinShare, vui lòng liên hệ với chúng tôi qua:
              </p>
              <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200/80 text-xs space-y-1.5">
                <p>📧 <strong>Email hỗ trợ pháp lý:</strong> <a href="mailto:support@culinshare.com" className="text-primary hover:underline">support@culinshare.com</a></p>
                <p>📞 <strong>Hotline:</strong> 1900 6868 (08:00 – 20:00 hàng ngày)</p>
                <p>📝 <strong>Biểu mẫu phản hồi:</strong> <Link to="/contact" className="text-primary font-medium hover:underline">Trang liên hệ CulinShare</Link></p>
              </div>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
