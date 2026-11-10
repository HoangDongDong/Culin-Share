import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import Header from '../components/Header';
import Footer from '../components/Footer';

const COOKIE_LIST = [
  {
    name: 'token',
    type: 'Thiết yếu',
    badgeColor: 'bg-red-50 text-red-700 border-red-200',
    duration: '7 ngày',
    purpose: 'Lưu trữ mã JWT xác thực phiên đăng nhập an toàn của người dùng.'
  },
  {
    name: 'user',
    type: 'Thiết yếu',
    badgeColor: 'bg-red-50 text-red-700 border-red-200',
    duration: '7 ngày',
    purpose: 'Ghi nhớ thông tin hồ sơ cơ bản (tên, avatar, vai trò) để hiển thị nhanh trên giao diện.'
  },
  {
    name: 'fridgeItems',
    type: 'Chức năng',
    badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
    duration: '30 ngày',
    purpose: 'Ghi nhớ danh sách nguyên liệu trong Tủ lạnh ảo để bạn không phải nhập lại mỗi khi mở web.'
  },
  {
    name: 'culinshare_cookie_consent',
    type: 'Chức năng',
    badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
    duration: '1 năm',
    purpose: 'Lưu lại tùy chọn cài đặt cookie mà bạn đã thiết lập trên trang này.'
  },
  {
    name: '_culinshare_analytics',
    type: 'Phân tích',
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    duration: 'Phiên truy cập',
    purpose: 'Đo lường ẩn danh số lượt xem công thức và hiệu năng tải trang để cải thiện trải nghiệm.'
  }
];

export default function CookiePolicyPage() {
  const [preferences, setPreferences] = useState({
    essential: true, // Always true
    functional: true,
    analytics: true
  });

  useEffect(() => {
    try {
      const saved = localStorage.getItem('culinshare_cookie_consent');
      if (saved) {
        const parsed = JSON.parse(saved);
        setPreferences(prev => ({ ...prev, ...parsed, essential: true }));
      }
    } catch {
      // ignore
    }
  }, []);

  const handleToggle = (key) => {
    if (key === 'essential') return; // Cannot toggle essential
    setPreferences(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const savePreferences = (customPrefs) => {
    const toSave = customPrefs || preferences;
    try {
      localStorage.setItem('culinshare_cookie_consent', JSON.stringify({
        functional: toSave.functional,
        analytics: toSave.analytics,
        timestamp: new Date().toISOString()
      }));
      toast.success('Đã lưu tùy chọn Cookie của bạn thành công!');
    } catch {
      toast.error('Không thể lưu cài đặt, vui lòng thử lại.');
    }
  };

  const acceptAll = () => {
    const all = { essential: true, functional: true, analytics: true };
    setPreferences(all);
    savePreferences(all);
  };

  const acceptOnlyEssential = () => {
    const onlyEssential = { essential: true, functional: false, analytics: false };
    setPreferences(onlyEssential);
    savePreferences(onlyEssential);
  };

  return (
    <div className="min-h-screen bg-[#fbf9f8] flex flex-col font-sans text-stone-800">
      <Header />

      <main className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 flex-1">
        {/* Breadcrumb */}
        <nav className="text-xs sm:text-sm text-stone-500 mb-6 flex items-center gap-1.5">
          <Link to="/" className="hover:text-primary transition-colors">Trang chủ</Link>
          <span>/</span>
          <span className="text-stone-800 font-medium">Chính sách Cookie</span>
        </nav>

        {/* Hero Header */}
        <div className="max-w-3xl mb-10">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 mb-3">
            🍪 Minh bạch dữ liệu trình duyệt
          </span>
          <h1 className="text-2xl sm:text-4xl font-display font-bold text-stone-900 tracking-tight mb-3">
            Chính sách Cookie CulinShare
          </h1>
          <p className="text-xs sm:text-sm text-stone-500">
            Cập nhật lần cuối: <span className="font-medium text-stone-700">Tháng 11 năm 2026</span> · Tìm hiểu cách chúng tôi sử dụng cookie để mang lại trải nghiệm nấu nướng mượt mà và cá nhân hóa nhất.
          </p>
        </div>

        {/* ========================================================================= */}
        {/* INTERACTIVE COOKIE MANAGER CARD */}
        {/* ========================================================================= */}
        <div className="bg-white rounded-3xl border border-stone-200/90 p-6 sm:p-8 shadow-xs mb-12">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-stone-100">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-stone-900 flex items-center gap-2">
                <span>⚙️</span> Trung tâm Quản lý Tùy chọn Cookie
              </h2>
              <p className="text-xs sm:text-sm text-stone-500 mt-1">
                Bạn có toàn quyền lựa chọn loại cookie được phép hoạt động trên trình duyệt của mình.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={acceptAll}
                className="px-4 py-2 bg-primary hover:bg-[#8f240a] text-white rounded-xl text-xs font-semibold active:scale-95 transition-all shadow-2xs"
              >
                Chấp nhận tất cả
              </button>
              <button
                onClick={acceptOnlyEssential}
                className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-semibold active:scale-95 transition-all"
              >
                Chỉ thiết yếu
              </button>
            </div>
          </div>

          <div className="space-y-5 pt-6">
            {/* Toggle 1: Thiết yếu */}
            <div className="flex items-start justify-between gap-4 p-4 rounded-2xl bg-stone-50/70 border border-stone-200/60">
              <div className="max-w-xl">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-xs sm:text-sm text-stone-900">1. Cookie thiết yếu (Bắt buộc)</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-100 text-red-800">Luôn bật</span>
                </div>
                <p className="text-xs text-stone-600 leading-relaxed">
                  Cần thiết để website vận hành ổn định: bảo mật tài khoản, duy trì đăng nhập (JWT), xác thực quyền quản trị và các giao dịch cơ bản. Không thể tắt nhóm cookie này.
                </p>
              </div>
              <input
                type="checkbox"
                checked={true}
                disabled={true}
                className="w-5 h-5 accent-primary cursor-not-allowed opacity-60 mt-1"
              />
            </div>

            {/* Toggle 2: Chức năng */}
            <div className="flex items-start justify-between gap-4 p-4 rounded-2xl bg-stone-50/70 border border-stone-200/60 hover:bg-stone-50 transition-colors">
              <div className="max-w-xl">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-xs sm:text-sm text-stone-900">2. Cookie chức năng & Tùy chọn</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-100 text-blue-800">Cá nhân hóa</span>
                </div>
                <p className="text-xs text-stone-600 leading-relaxed">
                  Cho phép hệ thống ghi nhớ các nguyên liệu bạn chọn trong Tủ lạnh ảo, ngôn ngữ ưa thích và bộ sưu tập món yêu thích để bạn không phải cấu hình lại mỗi lần vào web.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer mt-1">
                <input
                  type="checkbox"
                  checked={preferences.functional}
                  onChange={() => handleToggle('functional')}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-stone-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>

            {/* Toggle 3: Phân tích */}
            <div className="flex items-start justify-between gap-4 p-4 rounded-2xl bg-stone-50/70 border border-stone-200/60 hover:bg-stone-50 transition-colors">
              <div className="max-w-xl">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-xs sm:text-sm text-stone-900">3. Cookie phân tích & Hiệu năng</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800">Ẩn danh</span>
                </div>
                <p className="text-xs text-stone-600 leading-relaxed">
                  Thu thập dữ liệu thống kê ẩn danh về món ăn được xem nhiều nhất, thời gian tải trang để đội ngũ kỹ sư cải thiện tốc độ và gợi ý công thức phù hợp hơn.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer mt-1">
                <input
                  type="checkbox"
                  checked={preferences.analytics}
                  onChange={() => handleToggle('analytics')}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-stone-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>
          </div>

          <div className="mt-6 pt-5 border-t border-stone-100 flex items-center justify-end">
            <button
              onClick={() => savePreferences()}
              className="px-6 py-2.5 rounded-xl bg-primary hover:bg-[#8f240a] text-white text-xs sm:text-sm font-semibold active:scale-95 transition-all shadow-sm"
            >
              Lưu cài đặt của tôi
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* DETAILED CONTENT SECTIONS */}
        {/* ========================================================================= */}
        <div className="bg-white rounded-3xl border border-stone-200/90 p-6 sm:p-10 shadow-xs space-y-8 leading-relaxed text-xs sm:text-sm text-stone-700 mb-12">
          {/* Mục 1 */}
          <section>
            <h2 className="text-base sm:text-lg font-bold text-stone-900 mb-2">
              1. Cookie là gì và tại sao CulinShare sử dụng Cookie?
            </h2>
            <p className="mb-2">
              Cookie là các tệp văn bản nhỏ được lưu trữ trên thiết bị của bạn (máy tính, điện thoại, máy tính bảng) khi bạn truy cập một trang web. Cùng với LocalStorage, chúng giúp website ghi nhớ thông tin về chuyến thăm của bạn, chẳng hạn như trạng thái đăng nhập, món ăn đã lưu, và cài đặt hiển thị.
            </p>
            <p>
              Tại CulinShare, cookie được áp dụng với mục đích chính là mang lại sự tiện nghi và nhanh chóng nhất cho bạn khi vào bếp, giúp bạn không cần phải đăng nhập hay nhập lại từng loại củ, quả trong tủ lạnh mỗi ngày.
            </p>
          </section>

          {/* Mục 2: Bảng chi tiết Cookie */}
          <section className="pt-4 border-t border-stone-100">
            <h2 className="text-base sm:text-lg font-bold text-stone-900 mb-3">
              2. Danh sách các Cookie & Dữ liệu lưu trữ chính
            </h2>
            <div className="overflow-x-auto rounded-2xl border border-stone-200">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-stone-50 border-b border-stone-200 text-stone-900 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Tên Cookie / Khóa</th>
                    <th className="py-3 px-4">Loại</th>
                    <th className="py-3 px-4">Thời hạn</th>
                    <th className="py-3 px-4">Mục đích sử dụng</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {COOKIE_LIST.map((c, i) => (
                    <tr key={i} className="hover:bg-stone-50/50 transition-colors">
                      <td className="py-3 px-4 font-mono font-semibold text-stone-900">
                        {c.name}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${c.badgeColor}`}>
                          {c.type}
                        </span>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap text-stone-500">
                        {c.duration}
                      </td>
                      <td className="py-3 px-4 text-stone-600">
                        {c.purpose}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Mục 3 */}
          <section className="pt-4 border-t border-stone-100">
            <h2 className="text-base sm:text-lg font-bold text-stone-900 mb-2">
              3. Cách tắt hoặc xóa Cookie trên trình duyệt của bạn
            </h2>
            <p className="mb-3">
              Ngoài việc dùng bảng điều khiển tùy chọn ở trên, bạn cũng có thể tự xóa hoặc chặn cookie bất kỳ lúc nào thông qua phần cài đặt của trình duyệt:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-stone-600">
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200/80">
                <p className="font-bold text-stone-900 text-xs mb-1">Google Chrome</p>
                <p className="text-[11px]">Vào Cài đặt &gt; Quyền riêng tư và bảo mật &gt; Xóa dữ liệu duyệt web hoặc Cookie của bên thứ ba.</p>
              </div>
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200/80">
                <p className="font-bold text-stone-900 text-xs mb-1">Apple Safari (iOS / macOS)</p>
                <p className="text-[11px]">Vào Cài đặt &gt; Safari &gt; bật "Chặn tất cả cookie" hoặc xóa dữ liệu trang web.</p>
              </div>
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200/80">
                <p className="font-bold text-stone-900 text-xs mb-1">Mozilla Firefox</p>
                <p className="text-[11px]">Vào Tùy chọn &gt; Riêng tư & Bảo mật &gt; Xóa Cookie và Dữ liệu trang web.</p>
              </div>
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200/80">
                <p className="font-bold text-stone-900 text-xs mb-1">Microsoft Edge</p>
                <p className="text-[11px]">Vào Cài đặt &gt; Quyền riêng tư, tìm kiếm và dịch vụ &gt; Xóa dữ liệu duyệt web.</p>
              </div>
            </div>
            <p className="text-[11px] text-amber-700 mt-3 italic">
              * Lưu ý: Nếu bạn chọn tắt toàn bộ cookie thiết yếu trên trình duyệt, bạn sẽ không thể duy trì phiên đăng nhập và một số tính năng như Tủ lạnh AI hay Đăng công thức sẽ không hoạt động bình thường.
            </p>
          </section>

          {/* Mục 4 */}
          <section className="pt-4 border-t border-stone-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <p className="font-bold text-stone-900 text-sm">Bạn cần thêm thông tin?</p>
              <p className="text-xs text-stone-500">Đọc thêm Chính sách bảo mật hoặc gửi câu hỏi cho bộ phận kỹ thuật.</p>
            </div>
            <div className="flex items-center gap-3">
              <Link to="/privacy" className="text-xs font-semibold text-primary hover:underline">
                Chính sách bảo mật →
              </Link>
              <Link to="/contact" className="text-xs font-semibold text-primary hover:underline">
                Liên hệ hỗ trợ →
              </Link>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
