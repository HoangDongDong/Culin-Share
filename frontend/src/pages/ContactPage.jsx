import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { submitContactMessageApi } from '../services/contactApi';

const SUBJECT_OPTIONS = [
  { value: 'Góp ý cải tiến tính năng', label: '💡 Góp ý cải tiến tính năng' },
  { value: 'Hỏi đáp về công thức nấu ăn', label: '🍳 Hỏi đáp về công thức nấu ăn' },
  { value: 'Hợp tác đầu bếp / Truyền thông', label: '🤝 Hợp tác đầu bếp / Truyền thông' },
  { value: 'Báo cáo vi phạm / Lỗi kỹ thuật', label: '🛡️ Báo cáo vi phạm / Lỗi kỹ thuật' },
  { value: 'Hỗ trợ tài khoản & bảo mật', label: '🔑 Hỗ trợ tài khoản & bảo mật' },
  { value: 'Khác', label: '📝 Nội dung khác' },
];

const FAQS = [
  {
    q: 'Làm thế nào để tôi có thể chia sẻ công thức nấu ăn lên CulinShare?',
    a: 'Bạn chỉ cần đăng nhập tài khoản CulinShare, bấm vào nút "Đăng công thức" ở góc trên cùng bên phải. Điền tiêu đề, nguyên liệu kèm định lượng, các bước nấu và đính kèm hình ảnh món ăn thành phẩm. Sau khi lưu, công thức sẽ hiển thị ngay trong kho công thức và trang cá nhân của bạn.'
  },
  {
    q: 'Tính năng Tủ lạnh thông minh (Smart Fridge AI) gợi ý món ăn như thế nào?',
    a: 'Bạn chỉ cần chọn các nguyên liệu đang có sẵn trong gian bếp hoặc tủ lạnh nhà bạn. Hệ thống AI kết hợp công nghệ tìm kiếm ngữ nghĩa (RAG) sẽ quét hơn 1.000 công thức để đề xuất món ngon phù hợp nhất, giúp bạn tiết kiệm chi phí và tránh lãng phí thực phẩm.'
  },
  {
    q: 'Tôi có thể tải công thức hoặc danh sách nguyên liệu dạng PDF không?',
    a: 'Hoàn toàn được! Ở trang chi tiết mỗi công thức nấu ăn, CulinShare cung cấp tính năng "Tải công thức" và "Tạo danh sách mua sắm PDF" hoàn toàn miễn phí, định dạng font tiếng Việt chuẩn để bạn dễ dàng mang theo khi đi chợ hoặc siêu thị.'
  },
  {
    q: 'Tôi muốn hợp tác đầu bếp hoặc chia sẻ bài viết cộng đồng thì liên hệ thế nào?',
    a: 'Bạn có thể chọn chủ đề "Hợp tác đầu bếp / Truyền thông" trong form liên hệ bên dưới, hoặc gửi email trực tiếp tới chef@culinshare.com. Ban biên tập của CulinShare sẽ phản hồi bạn trong vòng 24 giờ làm việc.'
  },
  {
    q: 'Làm sao để báo cáo bài viết hoặc công thức có nội dung không phù hợp?',
    a: 'Bạn có thể nhấn vào nút "Báo cáo" ngay tại bài viết cộng đồng hoặc gửi phản hồi qua form liên hệ này với chủ đề "Báo cáo vi phạm / Lỗi kỹ thuật". Đội ngũ kiểm duyệt sẽ xử lý trong vòng 2-4 giờ.'
  }
];

export default function ContactPage() {
  const [searchParams] = useSearchParams();
  const initialSubject = searchParams.get('subject') || 'Góp ý cải tiến tính năng';

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: initialSubject,
    message: ''
  });

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);

  useEffect(() => {
    const paramSub = searchParams.get('subject');
    if (paramSub) {
      if (paramSub === 'feedback') setFormData(prev => ({ ...prev, subject: 'Góp ý cải tiến tính năng' }));
      else if (paramSub === 'report') setFormData(prev => ({ ...prev, subject: 'Báo cáo vi phạm / Lỗi kỹ thuật' }));
      else setFormData(prev => ({ ...prev, subject: paramSub }));
    }
  }, [searchParams]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim() || formData.name.trim().length < 2) {
      toast.error('Vui lòng nhập họ và tên hợp lệ (tối thiểu 2 ký tự)');
      return;
    }

    if (!formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      toast.error('Vui lòng nhập địa chỉ email hợp lệ');
      return;
    }

    if (!formData.message.trim() || formData.message.trim().length < 10) {
      toast.error('Vui lòng nhập nội dung tin nhắn tối thiểu 10 ký tự');
      return;
    }

    try {
      setLoading(true);
      await submitContactMessageApi(formData);
      setSubmitted(true);
      toast.success('Gửi tin nhắn liên hệ thành công! CulinShare sẽ sớm phản hồi.');
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Chưa gửi được tin nhắn, vui lòng thử lại sau.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      subject: 'Góp ý cải tiến tính năng',
      message: ''
    });
    setSubmitted(false);
  };

  return (
    <div className="min-h-screen bg-[#fbf9f8] flex flex-col font-sans text-stone-800">
      <Header />

      <main className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 flex-1">
        {/* Breadcrumb */}
        <nav className="text-xs sm:text-sm text-stone-500 mb-6 flex items-center gap-1.5">
          <Link to="/" className="hover:text-primary transition-colors">Trang chủ</Link>
          <span>/</span>
          <span className="text-stone-800 font-medium">Liên hệ & Hỗ trợ</span>
        </nav>

        {/* Hero Section */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary mb-3">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            Cộng đồng CulinShare
          </span>
          <h1 className="text-2xl sm:text-4xl font-display font-bold text-stone-900 tracking-tight mb-4">
            Liên hệ với chúng tôi
          </h1>
          <p className="text-stone-600 text-sm sm:text-base leading-relaxed">
            Bạn có thắc mắc về công thức, góp ý cải tiến tính năng, hoặc muốn hợp tác cùng Bếp Nhà Mình? Đội ngũ CulinShare luôn lắng nghe và sẵn sàng hỗ trợ bạn.
          </p>
        </div>

        {/* Contact Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-12">
          {/* Card 1: Địa chỉ */}
          <div className="bg-white rounded-2xl border border-stone-200/80 p-6 shadow-xs flex flex-col items-center text-center hover:shadow-md transition-all">
            <div className="w-12 h-12 rounded-xl bg-orange-50 text-primary flex items-center justify-center mb-4">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h3 className="font-bold text-stone-900 text-base mb-1">Địa chỉ dự án</h3>
            <p className="text-xs text-stone-500 mb-2">Khu Đô Thị ĐHQG-HCM</p>
            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
              Phường Đông Hòa, TP. Dĩ An, Bình Dương & TP. Thủ Đức, TP. Hồ Chí Minh
            </p>
          </div>

          {/* Card 2: Hotline */}
          <div className="bg-white rounded-2xl border border-stone-200/80 p-6 shadow-xs flex flex-col items-center text-center hover:shadow-md transition-all">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </div>
            <h3 className="font-bold text-stone-900 text-base mb-1">Hotline hỗ trợ</h3>
            <p className="text-xs text-stone-500 mb-2">08:00 – 20:00 (Hàng ngày)</p>
            <a href="tel:19006868" className="text-sm font-semibold text-primary hover:underline">
              1900 6868 (Miễn cước)
            </a>
            <p className="text-xs text-stone-500 mt-1">Hỗ trợ kỹ thuật & đóng góp ý kiến</p>
          </div>

          {/* Card 3: Email */}
          <div className="bg-white rounded-2xl border border-stone-200/80 p-6 shadow-xs flex flex-col items-center text-center hover:shadow-md transition-all">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="font-bold text-stone-900 text-base mb-1">Email liên hệ</h3>
            <p className="text-xs text-stone-500 mb-2">Phản hồi trong 24 giờ</p>
            <a href="mailto:support@culinshare.com" className="text-sm font-semibold text-primary hover:underline">
              support@culinshare.com
            </a>
            <p className="text-xs text-stone-500 mt-1">Hợp tác: chef@culinshare.com</p>
          </div>
        </div>

        {/* Main Content Grid: Form (left) + FAQ (right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mb-16">
          {/* Contact Form Container (7 cols) */}
          <div className="lg:col-span-7 bg-white rounded-3xl border border-stone-200/90 p-6 sm:p-8 shadow-xs">
            <h2 className="text-xl sm:text-2xl font-bold text-stone-900 mb-2">
              Gửi tin nhắn cho chúng tôi
            </h2>
            <p className="text-xs sm:text-sm text-stone-600 mb-6">
              Điền thông tin và phản hồi của bạn vào biểu mẫu bên dưới. Chúng tôi sẽ tiếp nhận và gửi thư phản hồi qua email.
            </p>

            {submitted ? (
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center">
                <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-emerald-900 mb-1">
                  Đã gửi tin nhắn thành công!
                </h3>
                <p className="text-xs sm:text-sm text-emerald-700 max-w-md mx-auto mb-5 leading-relaxed">
                  Cảm ơn bạn đã liên hệ với CulinShare. Đội ngũ quản trị viên đã tiếp nhận thông tin và sẽ phản hồi sớm nhất tới địa chỉ <span className="font-semibold">{formData.email}</span>.
                </p>
                <button
                  onClick={handleReset}
                  className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-xs sm:text-sm font-medium hover:bg-emerald-700 transition-colors"
                >
                  Gửi tin nhắn khác
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Họ và tên */}
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
                      Họ và tên <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Ví dụ: Nguyễn Thị Mai"
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs sm:text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                    />
                  </div>

                  {/* Địa chỉ Email */}
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
                      Email của bạn <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="email@example.com"
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs sm:text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Số điện thoại */}
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
                      Số điện thoại <span className="text-stone-400 font-normal">(Tùy chọn)</span>
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="Ví dụ: 0912 345 678"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs sm:text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                    />
                  </div>

                  {/* Chủ đề */}
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
                      Chủ đề liên hệ <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs sm:text-sm bg-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                    >
                      {SUBJECT_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Nội dung */}
                <div>
                  <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
                    Nội dung tin nhắn <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="message"
                    rows="5"
                    value={formData.message}
                    onChange={handleChange}
                    placeholder="Mô tả chi tiết câu hỏi, ý kiến đóng góp hoặc vấn đề bạn gặp phải..."
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs sm:text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all resize-y"
                  ></textarea>
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <p className="text-[11px] text-stone-500">
                    Bằng việc gửi biểu mẫu, bạn đồng ý với <Link to="/privacy" className="text-primary hover:underline">Chính sách bảo mật</Link> của CulinShare.
                  </p>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-3 rounded-xl bg-primary hover:bg-[#8f240a] text-white text-xs sm:text-sm font-semibold active:scale-95 transition-all shadow-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-1 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                        </svg>
                        Đang gửi...
                      </>
                    ) : (
                      <>
                        <span>Gửi tin nhắn</span>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Quick FAQ Container (5 cols) */}
          <div id="faq" className="lg:col-span-5 bg-white rounded-3xl border border-stone-200/90 p-6 sm:p-8 shadow-xs">
            <div className="flex items-center gap-2 text-primary font-semibold text-xs uppercase tracking-wider mb-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Hỏi đáp nhanh</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-stone-900 mb-4">
              Câu hỏi thường gặp
            </h2>
            <p className="text-xs sm:text-sm text-stone-600 mb-5">
              Những thắc mắc phổ biến nhất của các thành viên khi bắt đầu trải nghiệm CulinShare.
            </p>

            <div className="space-y-3">
              {FAQS.map((faq, idx) => {
                const isOpen = openFaq === idx;
                return (
                  <div
                    key={idx}
                    className="border border-stone-200/80 rounded-2xl overflow-hidden transition-colors"
                  >
                    <button
                      onClick={() => setOpenFaq(isOpen ? null : idx)}
                      className="w-full p-3.5 text-left flex items-center justify-between gap-3 bg-stone-50/50 hover:bg-stone-50 transition-colors"
                    >
                      <span className="text-xs sm:text-sm font-semibold text-stone-800">
                        {faq.q}
                      </span>
                      <svg
                        className={`w-4 h-4 text-stone-400 flex-shrink-0 transition-transform ${isOpen ? 'rotate-180 text-primary' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {isOpen && (
                      <div className="p-3.5 pt-2 text-xs sm:text-sm text-stone-600 bg-white border-t border-stone-100 leading-relaxed">
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="mt-6 p-4 rounded-2xl bg-orange-50/80 border border-orange-100 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold text-stone-900">Tham gia trao đổi cộng đồng</p>
                <p className="text-[11px] text-stone-600">Thảo luận cùng hàng ngàn người yêu bếp</p>
              </div>
              <Link
                to="/community"
                className="px-3.5 py-1.5 rounded-xl bg-primary text-white text-xs font-medium hover:bg-[#8f240a] transition-all flex-shrink-0"
              >
                Vào cộng đồng →
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
