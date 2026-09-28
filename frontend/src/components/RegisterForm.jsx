import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  clearAuthError,
  registerAccount,
  resetAuthState,
} from "../store/authSlice";
import FormMessage from "./FormMessage";
import InputField from "./InputField";
import PrimaryButton from "./PrimaryButton";

const RegisterForm = () => {
  const dispatch = useDispatch();
  const { status, error, result } = useSelector((state) => state.auth);
  const [clientError, setClientError] = useState("");
  const [form, setForm] = useState({
    fullName: "",
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    agree: false,
  });

  const isLoading = status === "loading";
  const isSuccess = status === "succeeded";

  const passwordMismatch = useMemo(() => {
    return form.confirmPassword && form.password !== form.confirmPassword;
  }, [form.confirmPassword, form.password]);

  useEffect(() => {
    if (error) {
      setClientError("");
    }
  }, [error]);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    if (clientError) {
      setClientError("");
    }
    if (error) {
      dispatch(clearAuthError());
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (passwordMismatch) {
      setClientError("Mật khẩu xác nhận chưa khớp.");
      return;
    }

    if (!form.agree) {
      setClientError("Bạn cần đồng ý với điều khoản để tiếp tục.");
      return;
    }

    dispatch(resetAuthState());
    dispatch(
      registerAccount({
        username: form.username,
        full_name: form.fullName, // Ánh xạ fullName thành full_name để khớp API Backend
        email: form.email,
        password: form.password,
      }),
    );
  };

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <div className="space-y-1">
        <p className="text-xs uppercase tracking-[0.35em] text-[#f59e0b]">
          Tạo tài khoản
        </p>
        <h1 className="font-display text-3xl font-semibold text-white">
          Chào mừng đến với MâmNgon
        </h1>
        <p className="text-sm text-[#cbd5e1]/70">
          Đăng ký để lưu công thức và chia sẻ món ăn yêu thích.
        </p>
      </div>

      {clientError ? (
        <FormMessage tone="error" title={clientError} />
      ) : error ? (
        <FormMessage
          tone="error"
          title="Đăng ký thất bại"
          description={error}
        />
      ) : null}

      {isSuccess ? (
        <FormMessage
          tone="success"
          title={result?.message || "Đăng ký thành công"}
          description="Hãy kiểm tra email để kích hoạt tài khoản bằng OTP."
        />
      ) : null}

      <InputField
        label="Họ và tên"
        name="fullName"
        value={form.fullName}
        onChange={handleChange}
        placeholder="Nguyen Van A"
        autoComplete="name"
        required
      />

      <InputField
        label="Tên đăng nhập"
        name="username"
        value={form.username}
        onChange={handleChange}
        placeholder="username123"
        autoComplete="username"
        helperText="Chỉ chứa chữ cái, số và dấu gạch dưới (từ 3 ký tự)."
        required
      />

      <InputField
        label="Email"
        name="email"
        type="email"
        value={form.email}
        onChange={handleChange}
        placeholder="ban@mamngon.vn"
        autoComplete="email"
        required
      />

      <InputField
        label="Mật khẩu"
        name="password"
        type="password"
        value={form.password}
        onChange={handleChange}
        placeholder="••••••••"
        autoComplete="new-password"
        helperText="Tối thiểu 8 ký tự, gồm chữ cái và số."
        required
      />

      <InputField
        label="Xác nhận mật khẩu"
        name="confirmPassword"
        type="password"
        value={form.confirmPassword}
        onChange={handleChange}
        placeholder="••••••••"
        autoComplete="new-password"
        error={passwordMismatch ? "Mật khẩu chưa trùng khớp." : ""}
        required
      />

      <label className="flex items-start gap-3 rounded-2xl border border-dashed border-[#3a2e32] bg-[#141217]/50 p-4 text-xs text-[#cbd5e1]/80 cursor-pointer">
        <input
          type="checkbox"
          name="agree"
          checked={form.agree}
          onChange={handleChange}
          className="mt-0.5 h-4 w-4 accent-[#f59e0b]"
        />
        <span>
          Tôi đồng ý với chính sách quyền riêng tư và điều khoản sử dụng của MâmNgon.
        </span>
      </label>

      <PrimaryButton type="submit" disabled={isLoading}>
        {isLoading ? "Đang tạo tài khoản..." : "Đăng ký ngay"}
      </PrimaryButton>

      <p className="text-center text-xs text-[#cbd5e1]/70 mt-4">
        Đã có tài khoản?{" "}
        <Link to="/login" className="font-semibold text-[#f59e0b] hover:underline">
          Đăng nhập
        </Link>
      </p>
      <p className="text-center text-xs text-[#cbd5e1]/60">
        Quên mật khẩu?{" "}
        <Link to="/forgot-password" className="font-semibold text-[#f59e0b] hover:underline">
          Lấy lại ngay
        </Link>
      </p>
    </form>
  );
};

export default RegisterForm;
