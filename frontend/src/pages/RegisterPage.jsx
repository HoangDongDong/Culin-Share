import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { registerAccount, setGoogleAuth } from "../store/authSlice";
import { verifyOtpApi, googleLoginApi } from "../services/authApi";

const RegisterPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [showOtpScreen, setShowOtpScreen] = useState(false);
  const [otpCode, setOtpCode] = useState("");

  const handleGoogleLoginSuccess = async (response) => {
    const idToken = response.credential;
    setGoogleLoading(true);
    setMessage("");
    try {
      const res = await googleLoginApi(idToken);
      if (res.success) {
        dispatch(setGoogleAuth(res.data));
        navigate("/");
      } else {
        setMessage(res.message || "Đăng ký bằng Google thất bại.");
      }
    } catch (err) {
      setMessage(err.message || "Đăng ký bằng Google thất bại.");
    } finally {
      setGoogleLoading(false);
    }
  };

  useEffect(() => {
    /* global google */
    if (window.google) {
      window.google.accounts.id.initialize({
        client_id: "960329031361-pbovelgc2lpreue75l8gf89q4ebhku6b.apps.googleusercontent.com",
        callback: handleGoogleLoginSuccess,
      });
      window.google.accounts.id.renderButton(
        document.getElementById("google-register-btn"),
        { 
          theme: "outline", 
          size: "large", 
          width: 384, // matches max-width-md wrapper
          text: "signup_with"
        }
      );
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!firstName || !lastName || !email || !password) {
      setMessage("Vui lòng điền đầy đủ các thông tin.");
      return;
    }
    setLoading(true);
    setMessage("");
    try {
      const username = email.split("@")[0];
      const fullName = `${lastName} ${firstName}`;

      const resultAction = await dispatch(
        registerAccount({
          username,
          email,
          password,
          full_name: fullName
        })
      );

      if (registerAccount.fulfilled.match(resultAction)) {
        setMessage("Đăng ký thành công! Một mã OTP xác thực đã được gửi đến email của bạn.");
        setShowOtpScreen(true);
      } else {
        setMessage(resultAction.payload || "Đăng ký thất bại. Vui lòng thử lại.");
      }
    } catch (err) {
      setMessage(err.message || "Đăng ký thất bại.");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    if (!otpCode || otpCode.length !== 6) {
      setMessage("Vui lòng nhập đầy đủ mã OTP 6 chữ số.");
      return;
    }
    setLoading(true);
    setMessage("");
    try {
      await verifyOtpApi(email, otpCode);
      setMessage("Xác thực thành công! Đang chuyển hướng sang trang đăng nhập...");
      setTimeout(() => {
        navigate("/login");
      }, 1500);
    } catch (err) {
      setMessage(err.message || "Mã OTP không chính xác hoặc đã hết hạn.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-background text-on-background min-h-screen flex items-center justify-center p-margin-mobile md:p-margin-desktop font-body-md select-none">
      <main className="w-full max-w-max-width bg-surface-container-lowest rounded-xl overflow-hidden shadow-soft flex flex-col md:flex-row min-h-[700px] border border-outline-variant/10">
        {/* Left Side: Image Content */}
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
              <h2 className="font-headline-md text-headline-md text-primary mb-xs font-bold">
                {showOtpScreen ? "Kích hoạt tài khoản" : "Tạo tài khoản mới"}
              </h2>
              <p className="font-body-md text-body-md text-on-surface-variant">
                {showOtpScreen ? "Nhập mã xác thực để kích hoạt tài khoản của bạn." : "Bắt đầu chia sẻ những công thức bí mật của bạn."}
              </p>
            </div>
            
            {message && (
              <div className={`mb-4 p-3 rounded-lg font-label-sm whitespace-pre-line ${message.includes("thành công") ? "bg-tertiary-container text-on-tertiary-container" : "bg-error-container text-on-error-container"}`}>
                {message}
              </div>
            )}
            
            {showOtpScreen ? (
              /* OTP verification Form */
              <form onSubmit={handleOtpSubmit} className="space-y-md">
                <div className="space-y-xs">
                  <label className="font-label-md text-label-md text-on-surface-variant" htmlFor="otp-code">Mã OTP (6 chữ số)</label>
                  <input
                    className="w-full px-md py-sm bg-surface-container-lowest border border-outline-variant/30 rounded-lg font-body-md text-body-md focus:ring-1 focus:ring-primary focus:border-primary transition-all outline-none text-on-surface"
                    id="otp-code"
                    placeholder="123456"
                    type="text"
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                  />
                  <p className="text-xs text-on-surface-variant mt-1">Chúng tôi đã gửi một mã OTP gồm 6 chữ số vào email của bạn. Vui lòng kiểm tra hộp thư.</p>
                </div>
                
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-md bg-primary text-on-primary font-label-md text-label-md rounded-lg shadow-sm hover:brightness-95 active:scale-95 transition-all font-bold flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>
                  ) : (
                    "Xác Nhận Kích Hoạt"
                  )}
                </button>
              </form>
            ) : (
              /* Sign Up Form */
              <form onSubmit={handleSubmit} className="space-y-md">
                <div className="grid grid-cols-2 gap-sm">
                  <div className="space-y-xs">
                    <label className="font-label-md text-label-md text-on-surface-variant" htmlFor="first-name">Họ</label>
                    <input
                      className="w-full px-md py-sm bg-surface-container-lowest border border-outline-variant/30 rounded-lg font-body-md text-body-md focus:ring-1 focus:ring-primary focus:border-primary transition-all outline-none text-on-surface"
                      id="first-name"
                      placeholder="Nguyễn"
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-xs">
                    <label className="font-label-md text-label-md text-on-surface-variant" htmlFor="last-name">Tên</label>
                    <input
                      className="w-full px-md py-sm bg-surface-container-lowest border border-outline-variant/30 rounded-lg font-body-md text-body-md focus:ring-1 focus:ring-primary focus:border-primary transition-all outline-none text-on-surface"
                      id="last-name"
                      placeholder="An"
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="space-y-xs">
                  <label className="font-label-md text-label-md text-on-surface-variant" htmlFor="signup-email">Email</label>
                  <input
                    className="w-full px-md py-sm bg-surface-container-lowest border border-outline-variant/30 rounded-lg font-body-md text-body-md focus:ring-1 focus:ring-primary focus:border-primary transition-all outline-none text-on-surface"
                    id="signup-email"
                    placeholder="example@gmail.com"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                
                <div className="space-y-xs">
                  <label className="font-label-md text-label-md text-on-surface-variant" htmlFor="signup-password">Mật khẩu</label>
                  <input
                    className="w-full px-md py-sm bg-surface-container-lowest border border-outline-variant/30 rounded-lg font-body-md text-body-md focus:ring-1 focus:ring-primary focus:border-primary transition-all outline-none text-on-surface"
                    id="signup-password"
                    placeholder="Tối thiểu 8 ký tự"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
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
                    "Tạo Tài Khoản"
                  )}
                </button>
              </form>
            )}
            
            {/* Divider */}
            <div className="relative my-lg">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-outline-variant/20"></div>
              </div>
              <div className="relative flex justify-center text-label-sm text-label-sm">
                <span className="px-sm bg-surface-container-lowest text-on-surface-variant">Hoặc tiếp tục với</span>
              </div>
            </div>
            
            {/* Social Logins */}
            <div className="flex flex-col mb-lg w-full items-center justify-center select-none">
              {googleLoading ? (
                <div className="flex items-center justify-center gap-xs py-sm border border-outline-variant/30 rounded-lg w-full font-label-md text-label-md text-secondary font-bold">
                  <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>
                  Đang xác thực...
                </div>
              ) : (
                <div id="google-register-btn" className="w-full flex justify-center"></div>
              )}
            </div>
            
            {/* Toggle */}
            <div className="text-center">
              <p className="font-body-md text-body-md text-on-surface-variant">
                Đã có tài khoản?{" "}
                <Link to="/login" className="text-primary font-bold hover:underline">
                  Đăng nhập
                </Link>
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default RegisterPage;
