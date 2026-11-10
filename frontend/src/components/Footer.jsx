import { useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";

const Footer = () => {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [language, setLanguage] = useState("vi");
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      toast.error("Vui lòng nhập địa chỉ email hợp lệ!");
      return;
    }
    setSubscribed(true);
    toast.success("Cảm ơn bạn đã đăng ký nhận bản tin CulinShare!");
    setTimeout(() => {
      setEmail("");
    }, 1500);
  };

  return (
    <footer className="w-full bg-[#fbf9f8] text-stone-800 border-t border-stone-200/80 mt-auto select-none">

      {/* ========================================================================= */}
      {/* SECTION 1: NEWSLETTER BANNER (GỢI Ý NHẬN BẢN TIN) */}
      {/* =============================================      {/* ========================================================================= */}
      {/* SECTION 1: NEWSLETTER BANNER (ĐĂNG KÝ NHẬN BẢN TIN) */}
      {/* ========================================================================= */}
      <div className="relative w-full border-b border-stone-200/80 bg-[#FAF4ED] overflow-hidden">
        {/* Background Culinary Food Elements */}
        <div className="absolute inset-0 z-0">
          <img
            src="/newsletter_banner_bg.jpg"
            alt="Đăng ký nhận bản tin CulinShare"
            className="w-full h-full object-cover object-center"
          />
          {/* Subtle overlay for responsive text readability */}
          <div className="absolute inset-0 bg-[#FAF4ED]/40 md:bg-transparent"></div>
        </div>

        {/* Content Container positioned perfectly in the clear zone between ingredients */}
        <div
          className="relative z-10 max-w-[1540px] mx-auto py-10 sm:py-12 lg:py-14"
          style={{ paddingLeft: "max(1.5rem, min(20vw, 290px))", paddingRight: "max(1.5rem, min(16vw, 230px))" }}
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center">
            
            {/* Left Column: Title & Subtitle */}
            <div className="lg:col-span-7 flex flex-col justify-center">
              <div className="flex items-center gap-2 text-[#ab2e10] font-bold text-xs uppercase tracking-wider mb-2 select-none">
                <svg className="w-4 h-4 text-[#ab2e10]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                </svg>
                <span>ĐĂNG KÝ NHẬN BẢN TIN</span>
              </div>

              <h2 className="font-display text-2xl sm:text-3xl lg:text-[28px] xl:text-[32px] font-bold text-[#ab2e10] leading-snug tracking-tight whitespace-normal lg:whitespace-nowrap">
                Cập nhật công thức mới mỗi tuần
              </h2>

              <p className="text-stone-600 text-xs sm:text-sm mt-2 max-w-lg leading-relaxed">
                Nhận những công thức ngon nhất, mẹo nấu ăn và tin tức từ CulinShare.
              </p>
            </div>

            {/* Right Column: Pill Form and Privacy Note */}
            <div className="lg:col-span-5 flex flex-col justify-center lg:items-end">
              <div className="w-full max-w-xl">
                {subscribed ? (
                  <div className="p-4 bg-white/95 border border-emerald-300 rounded-2xl text-emerald-800 text-xs sm:text-sm font-medium shadow-sm flex items-center gap-2">
                    <span className="text-emerald-600 text-base">✓</span> Cảm ơn bạn đã đăng ký nhận bản tin CulinShare!
                  </div>
                ) : (
                  <form
                    onSubmit={handleSubscribe}
                    className="bg-white border border-stone-200/90 rounded-2xl p-2 sm:p-2.5 shadow-sm hover:border-stone-300 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/10 transition-all flex items-center gap-2"
                  >
                    <div className="pl-3 sm:pl-4 text-stone-400 flex items-center pointer-events-none">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                      </svg>
                    </div>
                    <input
                      type="email"
                      placeholder="Nhập email của bạn..."
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-transparent text-xs sm:text-sm md:text-base text-stone-800 placeholder-stone-400 outline-none"
                      required
                    />
                    <button
                      type="submit"
                      className="bg-[#ab2e10] hover:bg-[#8f240a] text-white px-6 sm:px-8 py-2.5 sm:py-3 rounded-xl font-medium text-xs sm:text-sm active:scale-95 transition-all shadow-xs flex-shrink-0"
                    >
                      Đăng ký
                    </button>
                  </form>
                )}

                <p className="text-[11px] sm:text-xs text-stone-500 mt-2.5 flex items-center gap-1.5 pl-1 select-none">
                  <svg className="w-3.5 h-3.5 text-stone-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                  <span>Chúng tôi không spam. Chỉ gửi những nội dung hữu ích.</span>
                </p>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 2: MAIN FOOTER LINKS (5 CỘT THÔNG TIN) */}
      {/* ========================================================================= */}
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-8">
          
          {/* CỘT 1: THƯƠNG HIỆU & MẠNG XÃ HỘI (4 cols) */}
          <div className="lg:col-span-4 flex flex-col items-start pr-0 lg:pr-6">
            <Link to="/" className="font-display-lg text-display-lg-mobile md:text-display-lg text-primary select-none hover:opacity-90 inline-block">
              CulinShare
            </Link>
            
            <p className="font-semibold text-stone-700 text-sm mt-1">
              Nấu ngon hơn mỗi ngày
            </p>
            
            <p className="text-stone-500 text-xs sm:text-sm leading-relaxed mt-3 max-w-sm">
              Bếp Nhà Mình – CulinShare là cộng đồng khám phá công thức nấu ăn, trao đổi kinh nghiệm và chia sẻ cảm hứng cho bữa cơm gia đình.
            </p>

            <Link to="/about" className="inline-block mt-5 text-primary text-sm font-semibold underline underline-offset-4">Giới thiệu Bếp Nhà Mình →</Link>
          </div>

          {/* CỘT 2: KHÁM PHÁ (2 cols) */}
          <div className="lg:col-span-2">
            <h3 className="font-bold text-[#ab2e10] text-sm sm:text-base mb-3.5 tracking-tight">
              Khám phá
            </h3>
            <ul className="space-y-2.5 text-xs sm:text-sm">
              <li>
                <Link to="/search?sort=newest" className="text-stone-600 hover:text-primary transition-colors block">
                  Công thức mới nhất
                </Link>
              </li>
              <li>
                <Link to="/search?sort=rating" className="text-stone-600 hover:text-primary transition-colors block">
                  Công thức phổ biến
                </Link>
              </li>
              <li>
                <Link to="/search" className="text-stone-600 hover:text-primary transition-colors block">
                  Theo món ăn
                </Link>
              </li>
              <li>
                <Link to="/fridge" className="text-stone-600 hover:text-primary transition-colors block">
                  Theo nguyên liệu
                </Link>
              </li>
              <li>
                <Link to="/search" className="text-stone-600 hover:text-primary transition-colors block">
                  Theo dịp đặc biệt
                </Link>
              </li>
            </ul>
          </div>

          {/* CỘT 3: CỘNG ĐỒNG (2 cols) */}
          <div className="lg:col-span-2">
            <h3 className="font-bold text-stone-900 text-sm sm:text-base mb-3.5 tracking-tight">
              Cộng đồng
            </h3>
            <ul className="space-y-2.5 text-xs sm:text-sm">
              <li>
                <Link to="/community" className="text-stone-600 hover:text-primary transition-colors block">
                  Thảo luận
                </Link>
              </li>
              <li>
                <Link to="/community" className="text-stone-600 hover:text-primary transition-colors block">
                  Hỏi đáp nấu ăn
                </Link>
              </li>
              <li>
                <Link to="/community" className="text-stone-600 hover:text-primary transition-colors block">
                  Chia sẻ mẹo vặt
                </Link>
              </li>
              <li>
                <Link to="/community" className="text-stone-600 hover:text-primary transition-colors block">
                  Thử thách nấu ăn
                </Link>
              </li>
              <li>
                <Link to="/community" className="text-stone-600 hover:text-primary transition-colors block">
                  Sự kiện cộng đồng
                </Link>
              </li>
            </ul>
          </div>

          {/* CỘT 4: HỖ TRỢ (2 cols) */}
          <div className="lg:col-span-2">
            <h3 className="font-bold text-stone-900 text-sm sm:text-base mb-3.5 tracking-tight">
              Hỗ trợ
            </h3>
            <ul className="space-y-2.5 text-xs sm:text-sm">
              <li>
                <Link to="/about" className="text-stone-600 hover:text-primary transition-colors block">
                  Hướng dẫn sử dụng
                </Link>
              </li>
              <li>
                <Link to="/contact#faq" className="text-stone-600 hover:text-primary transition-colors block">
                  Câu hỏi thường gặp
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-stone-600 hover:text-primary transition-colors block">
                  Liên hệ
                </Link>
              </li>
              <li>
                <Link to="/contact?subject=feedback" className="text-stone-600 hover:text-primary transition-colors block">
                  Góp ý
                </Link>
              </li>
              <li>
                <Link to="/contact?subject=report" className="text-stone-600 hover:text-primary transition-colors block">
                  Báo cáo vi phạm
                </Link>
              </li>
            </ul>
          </div>

          {/* CỘT 5: TẢI ỨNG DỤNG (2 cols) */}
          <div className="lg:col-span-2">
            <h3 className="font-bold text-stone-900 text-sm sm:text-base mb-2 tracking-tight">
              Tải ứng dụng
            </h3>
            <p className="text-stone-500 text-xs leading-relaxed mb-3.5">
              Trải nghiệm CulinShare mọi lúc, mọi nơi trên điện thoại của bạn.
            </p>

            <div className="flex flex-col gap-2">
              {/* Apple App Store */}
              <a
                href="#"
                className="bg-black text-white px-3.5 py-2 rounded-xl flex items-center gap-2.5 hover:bg-stone-800 active:scale-95 transition-all shadow-xs w-full max-w-[170px]"
              >
                <svg className="w-5 h-5 fill-white flex-shrink-0" viewBox="0 0 24 24">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.38c.62-.75 1.04-1.8 0.93-2.85-.9.04-1.99.6-2.61 1.34-.55.63-.99 1.68-.86 2.7.99.08 2.02-.44 2.54-1.19z" />
                </svg>
                <div className="flex flex-col text-left">
                  <span className="text-[9px] uppercase tracking-wider text-stone-300 leading-tight">
                    Tải về trên
                  </span>
                  <span className="text-xs sm:text-sm font-semibold text-white leading-tight font-sans">
                    App Store
                  </span>
                </div>
              </a>

              {/* Google Play Store */}
              <a
                href="#"
                className="bg-black text-white px-3.5 py-2 rounded-xl flex items-center gap-2.5 hover:bg-stone-800 active:scale-95 transition-all shadow-xs w-full max-w-[170px]"
              >
                <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M3.6 1.8c-.3.3-.5.8-.5 1.4v17.6c0 .6.2 1.1.5 1.4l.1.1 9.9-9.9v-.2L3.7 1.7l-.1.1z" />
                  <path fill="#FBBC04" d="M16.9 15.6l-3.3-3.3v-.2l3.3-3.3.1.1 3.9 2.2c1.1.6 1.1 1.7 0 2.3l-3.9 2.2-.1-.1z" />
                  <path fill="#EA4335" d="M17 15.5L13.6 12 3.6 22c.4.4 1 .5 1.7.1l11.7-6.6" />
                  <path fill="#34A853" d="M17 8.5L5.3 1.9c-.7-.4-1.3-.3-1.7.1L13.6 12 17 8.5z" />
                </svg>
                <div className="flex flex-col text-left">
                  <span className="text-[9px] uppercase tracking-wider text-stone-300 leading-tight">
                    TẢI NỘI DUNG TRÊN
                  </span>
                  <span className="text-xs sm:text-sm font-semibold text-white leading-tight font-sans">
                    Google Play
                  </span>
                </div>
              </a>
            </div>
          </div>

        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 3: BOTTOM BAR (BẢN QUYỀN & CHÍNH SÁCH) */}
      {/* ========================================================================= */}
      <div className="border-t border-stone-200/80 bg-[#f9f7f5]">
        <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col md:flex-row items-center justify-between gap-4 text-xs sm:text-sm text-stone-500">
          
          {/* Copyright */}
          <div>
            © {new Date().getFullYear()} CulinShare. Tất cả quyền được bảo lưu.
          </div>

          {/* Legal / Policy Links */}
          <div className="flex flex-wrap items-center justify-center gap-3 text-xs sm:text-sm">
            <Link to="/terms" className="hover:text-primary transition-colors">
              Điều khoản sử dụng
            </Link>
            <span className="text-stone-300">|</span>
            <Link to="/privacy" className="hover:text-primary transition-colors">
              Chính sách bảo mật
            </Link>
            <span className="text-stone-300">|</span>
            <Link to="/cookies" className="hover:text-primary transition-colors">
              Chính sách cookie
            </Link>
          </div>

          {/* Language Selector Pill */}
          <div className="relative">
            <button
              onClick={() => setLangDropdownOpen(!langDropdownOpen)}
              className="rounded-full border border-stone-200 bg-white px-3.5 py-1.5 flex items-center gap-2 text-xs sm:text-sm text-stone-700 shadow-2xs hover:bg-stone-50 transition-colors"
            >
              {/* Vietnam Flag SVG */}
              <svg className="w-4 h-4 rounded-full overflow-hidden flex-shrink-0 shadow-2xs" viewBox="0 0 30 20">
                <rect width="30" height="20" fill="#da251d" />
                <polygon points="15,4 16.5,8.8 21.5,8.8 17.5,11.8 19,16.5 15,13.5 11,16.5 12.5,11.8 8.5,8.8 13.5,8.8" fill="#ff0" />
              </svg>
              <span>{language === "vi" ? "Tiếng Việt" : "English"}</span>
              <svg className={`w-3.5 h-3.5 text-stone-400 transition-transform ${langDropdownOpen ? "rotate-180" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            {langDropdownOpen && (
              <div className="absolute right-0 bottom-full mb-2 w-32 bg-white border border-stone-200 rounded-xl shadow-lg py-1.5 z-30">
                <button
                  onClick={() => { setLanguage("vi"); setLangDropdownOpen(false); }}
                  className="w-full text-left px-3 py-1.5 text-xs text-stone-700 hover:bg-stone-50 hover:text-primary flex items-center gap-2"
                >
                  <svg className="w-3.5 h-3.5 rounded-full overflow-hidden" viewBox="0 0 30 20">
                    <rect width="30" height="20" fill="#da251d" />
                    <polygon points="15,4 16.5,8.8 21.5,8.8 17.5,11.8 19,16.5 15,13.5 11,16.5 12.5,11.8 8.5,8.8 13.5,8.8" fill="#ff0" />
                  </svg>
                  Tiếng Việt
                </button>
                <button
                  onClick={() => { setLanguage("en"); setLangDropdownOpen(false); }}
                  className="w-full text-left px-3 py-1.5 text-xs text-stone-700 hover:bg-stone-50 hover:text-primary flex items-center gap-2"
                >
                  <span className="text-sm">🇬🇧</span>
                  English
                </button>
              </div>
            )}
          </div>

        </div>
      </div>

    </footer>
  );
};

export default Footer;
