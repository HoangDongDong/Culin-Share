import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { forgotPasswordApi, resetPasswordApi } from "../services/authApi";

const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: Nhập email, 2: Nhập OTP và mật khẩu mới
  const [message, setMessage] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setMessage("");
    setErrorMsg("");
    try {
      const res = await forgotPasswordApi(email);
      if (res.success || res.message) {
        setMessage(res.message || "Mã OTP đã được gửi đến email của bạn.");
        setStep(2);
      }
    } catch (err) {
      setErrorMsg(err.message || "Gửi yêu cầu thất bại. Vui lòng kiểm tra lại email.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!otp || !password || !confirmPassword) {
      setErrorMsg("Vui lòng điền đầy đủ các trường thông tin.");
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg("Mật khẩu xác nhận không trùng khớp.");
      return;
    }

    setLoading(true);
    setMessage("");
    setErrorMsg("");
    try {
      const res = await resetPasswordApi(email, otp, password, confirmPassword);
      if (res.success || res.message) {
        setMessage(res.message || "Đặt lại mật khẩu thành công!");
        setStep(3); // Bước 3: Đã hoàn tất thành công
      }
    } catch (err) {
      setErrorMsg(err.message || "Đặt lại mật khẩu thất bại. Vui lòng kiểm tra lại mã OTP.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-background text-on-background min-h-screen flex items-center justify-center p-margin-mobile md:p-margin-desktop font-body-md select-none">
      <main className="w-full max-w-max-width bg-surface-container-lowest rounded-xl overflow-hidden shadow-soft flex flex-col md:flex-row min-h-[700px] border border-outline-variant/10">
        {/* Left Side: Image Content */}
        <section
          className="hidden md:flex md:w-1/2 relative overflow-hidden items-stretch p-lg bg-cover bg-center"
          style={{
            backgroundImage: "url('https://res.cloudinary.com/dofssbkbd/image/upload/v1782819020/mamngon/assets/ruqetfu0x7b3gtjemwjx.jpg')",
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/70"></div>
          <div className="relative z-10 text-white select-none w-full flex flex-col justify-between">
            <Link to="/" className="hover:opacity-90 transition-opacity inline-block self-start">
              <h1 className="font-display-lg text-display-lg font-bold">CulinShare</h1>
            </Link>
            <p className="font-body-lg text-body-lg opacity-90 max-w-md leading-relaxed">
              Tham gia cộng đồng những người yêu ẩm thực, chia sẻ công thức nấu ăn tinh tế và tìm thấy nguồn cảm hứng mỗi ngày trong căn bếp của bạn.
            </p>
          </div>
        </section>
        
        {/* Right Side: Auth Form */}
        <section className="w-full md:w-1/2 flex flex-col justify-center px-md py-lg md:px-xl bg-surface-container-lowest">
          <div className="max-w-md mx-auto w-full">
            {/* Header */}
            <div className="mb-lg">
              <div className="mb-4 block md:hidden">
                <Link to="/" className="inline-block hover:opacity-85 transition-opacity">
                  <span className="font-display-md text-primary font-bold text-3xl tracking-tight">CulinShare</span>
                </Link>
              </div>
              <h2 className="font-headline-md text-headline-md text-primary mb-xs font-bold">Quên mật khẩu?</h2>
              <p className="font-body-md text-body-md text-on-surface-variant">
                {step === 1 && "Nhập email đăng ký của bạn để nhận mã xác thực OTP."}
                {step === 2 && `Đặt lại mật khẩu mới cho tài khoản: ${email}`}
                {step === 3 && "Mật khẩu của bạn đã được cập nhật thành công!"}
              </p>
            </div>
            
            {message && (
              <div className="mb-4 p-4 bg-tertiary/10 text-tertiary rounded-lg font-body-md border border-tertiary/20">
                {message}
              </div>
            )}

            {errorMsg && (
              <div className="mb-4 p-4 bg-error-container text-on-error-container rounded-lg font-body-md border border-error/20">
                {errorMsg}
              </div>
            )}
            
            {step === 1 && (
              <form onSubmit={handleSendOtp} className="space-y-md">
                <div className="space-y-xs">
                  <label className="font-label-md text-label-md text-on-surface-variant" htmlFor="reset-email">Email của bạn</label>
                  <input
                    className="w-full px-md py-sm bg-surface-container-lowest border border-outline-variant/30 rounded-lg font-body-md text-body-md focus:ring-1 focus:ring-primary focus:border-primary transition-all outline-none text-on-surface"
                    id="reset-email"
                    placeholder="chef@culinshare.vn"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-md bg-primary text-on-primary font-label-md text-label-md rounded-lg shadow-sm hover:brightness-95 active:scale-95 transition-all font-bold flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>
                  ) : (
                    "Gửi yêu cầu khôi phục"
                  )}
                </button>
                
                <div className="text-center pt-xs">
                  <Link to="/login" className="text-primary font-bold hover:underline font-label-sm">
                    Quay lại đăng nhập
                  </Link>
                </div>
              </form>
            )}

            {step === 2 && (
              <form onSubmit={handleResetPassword} className="space-y-md">
                <div className="space-y-xs">
                  <label className="font-label-md text-label-md text-on-surface-variant" htmlFor="otp-code">Mã OTP xác nhận (6 chữ số)</label>
                  <input
                    className="w-full px-md py-sm bg-surface-container-lowest border border-outline-variant/30 rounded-lg font-body-md text-body-md focus:ring-1 focus:ring-primary focus:border-primary transition-all outline-none text-on-surface text-center tracking-widest font-bold"
                    id="otp-code"
                    placeholder="••••••"
                    maxLength={6}
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.trim())}
                    required
                  />
                </div>

                <div className="space-y-xs">
                  <label className="font-label-md text-label-md text-on-surface-variant" htmlFor="new-password">Mật khẩu mới</label>
                  <input
                    className="w-full px-md py-sm bg-surface-container-lowest border border-outline-variant/30 rounded-lg font-body-md text-body-md focus:ring-1 focus:ring-primary focus:border-primary transition-all outline-none text-on-surface"
                    id="new-password"
                    placeholder="••••••••"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-xs">
                  <label className="font-label-md text-label-md text-on-surface-variant" htmlFor="confirm-password">Xác nhận mật khẩu mới</label>
                  <input
                    className="w-full px-md py-sm bg-surface-container-lowest border border-outline-variant/30 rounded-lg font-body-md text-body-md focus:ring-1 focus:ring-primary focus:border-primary transition-all outline-none text-on-surface"
                    id="confirm-password"
                    placeholder="••••••••"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
                
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-md bg-primary text-on-primary font-label-md text-label-md rounded-lg shadow-sm hover:brightness-95 active:scale-95 transition-all font-bold flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>
                  ) : (
                    "Xác nhận đặt lại mật khẩu"
                  )}
                </button>
                
                <div className="text-center pt-xs">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="text-primary font-bold hover:underline font-label-sm bg-none border-none outline-none cursor-pointer"
                  >
                    Quay lại bước trước
                  </button>
                </div>
              </form>
            )}

            {step === 3 && (
              <div className="space-y-md">
                <Link
                  to="/login"
                  className="w-full py-md bg-primary text-on-primary font-label-md text-label-md rounded-lg shadow-sm hover:brightness-95 active:scale-95 transition-all font-bold text-center block"
                >
                  Đăng nhập ngay
                </Link>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
};

export default ForgotPasswordPage;
