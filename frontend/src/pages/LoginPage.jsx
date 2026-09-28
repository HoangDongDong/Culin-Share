import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { loginAccount, setGoogleAuth } from "../store/authSlice";
import { googleLoginApi } from "../services/authApi";

const LoginPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [usernameOrEmail, setUsernameOrEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [message, setMessage] = useState("");

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
        setMessage(res.message || "Đăng nhập bằng Google thất bại.");
      }
    } catch (err) {
      setMessage(err.message || "Đăng nhập bằng Google thất bại.");
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
        document.getElementById("google-login-btn"),
        { 
          theme: "outline", 
          size: "large", 
          width: 384, // matches max-width-md wrapper
          text: "signin_with"
        }
      );
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!usernameOrEmail && !password) {
      setMessage("Vui lòng nhập Tên đăng nhập/Email và Mật khẩu.");
      return;
    }
    if (!usernameOrEmail) {
      setMessage("Vui lòng nhập Tên đăng nhập hoặc Email.");
      return;
    }
    if (!password) {
      setMessage("Vui lòng nhập Mật khẩu.");
      return;
    }
    setLoading(true);
    setMessage("");
    try {
      const resultAction = await dispatch(loginAccount({ username: usernameOrEmail, password }));
      if (loginAccount.fulfilled.match(resultAction)) {
        navigate("/");
      } else {
        setMessage(resultAction.payload || "Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.");
      }
    } catch (err) {
      setMessage(err.message || "Đăng nhập thất bại.");
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
              <h2 className="font-headline-md text-headline-md text-primary mb-xs font-bold">Chào mừng trở lại</h2>
              <p className="font-body-md text-body-md text-on-surface-variant">Đăng nhập để tiếp tục hành trình nấu nướng của bạn.</p>
            </div>
            
            {message && (
              <div className="mb-4 p-3 bg-error-container text-on-error-container rounded-lg font-label-sm">
                {message}
              </div>
            )}
            
            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-md">
              <div className="space-y-xs">
                <label className="font-label-md text-label-md text-on-surface-variant" htmlFor="login-username">Tên đăng nhập hoặc Email</label>
                <input
                  className="w-full px-md py-sm bg-surface-container-lowest border border-outline-variant/30 rounded-lg font-body-md text-body-md focus:ring-1 focus:ring-primary focus:border-primary transition-all outline-none text-on-surface"
                  id="login-username"
                  placeholder="Tên đăng nhập hoặc email..."
                  type="text"
                  value={usernameOrEmail}
                  onChange={(e) => setUsernameOrEmail(e.target.value)}
                />
              </div>
              <div className="space-y-xs">
                <div className="flex justify-between items-center">
                  <label className="font-label-md text-label-md text-on-surface-variant" htmlFor="login-password">Mật khẩu</label>
                  <Link to="/forgot-password" className="font-label-sm text-label-sm text-primary hover:underline font-bold">Quên mật khẩu?</Link>
                </div>
                <input
                  className="w-full px-md py-sm bg-surface-container-lowest border border-outline-variant/30 rounded-lg font-body-md text-body-md focus:ring-1 focus:ring-primary focus:border-primary transition-all outline-none text-on-surface"
                  id="login-password"
                  placeholder="••••••••"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-xs cursor-pointer">
                <input
                  className="w-4 h-4 rounded border-outline-variant text-primary focus:ring-primary"
                  id="remember"
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                />
                <label className="font-label-sm text-label-sm text-on-surface-variant select-none" htmlFor="remember">
                  Ghi nhớ đăng nhập
                </label>
              </div>
              
              <button
                type="submit"
                disabled={loading}
                className="w-full py-md bg-primary text-on-primary font-label-md text-label-md rounded-lg shadow-sm hover:brightness-95 active:scale-95 transition-all font-bold flex items-center justify-center gap-2"
              >
                {loading ? (
                  <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>
                ) : (
                  "Đăng Nhập"
                )}
              </button>
            </form>
            
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
                <div id="google-login-btn" className="w-full flex justify-center"></div>
              )}
            </div>
            
            {/* Toggle */}
            <div className="text-center">
              <p className="font-body-md text-body-md text-on-surface-variant">
                Chưa có tài khoản?{" "}
                <Link to="/register" className="text-primary font-bold hover:underline">
                  Đăng ký ngay
                </Link>
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default LoginPage;
