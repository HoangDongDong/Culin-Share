import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { Link, useLocation, useNavigate } from "react-router-dom";

const AuthPromptContext = createContext(null);

export function useRequireLogin() {
  return useContext(AuthPromptContext);
}

export function AuthPromptProvider({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState(null);
  const dialog = useRef(null);
  const requireLogin = useCallback(({ from, message, fridgeDraft, onDismiss } = {}) => {
    const token = localStorage.getItem("token");
    if (token && token !== "null" && token !== "undefined") return true;
    setPrompt({
      key: location.key,
      state: { from: from ?? location.pathname + location.search + location.hash, message, fridgeDraft },
      onDismiss,
    });
    return false;
  }, [location.key, location.pathname, location.search, location.hash]);
  const current = prompt?.key === location.key ? prompt : null;

  useEffect(() => {
    if (!current) return;
    const element = dialog.current;
    element.showModal();
    return () => element.close();
  }, [current]);

  const dismiss = () => {
    setPrompt(null);
    current.onDismiss?.();
  };
  const choose = path => {
    setPrompt(null);
    navigate(path, { state: current.state });
  };

  return (
    <AuthPromptContext.Provider value={requireLogin}>
      {children}
      {current && (
        <dialog ref={dialog} aria-labelledby="auth-prompt-title" aria-describedby="auth-prompt-message"
          onCancel={event => { event.preventDefault(); dismiss(); }}
          className="m-auto w-[90vw] max-w-md rounded-2xl bg-white p-6 text-stone-900 shadow-xl backdrop:bg-black/50">
          <h2 id="auth-prompt-title" className="text-xl font-bold">Đăng nhập để tiếp tục?</h2>
          <p id="auth-prompt-message" className="mt-2 text-sm text-stone-600">
            {current.state.message || "Đăng nhập hoặc đăng ký tài khoản để sử dụng chức năng này."}
          </p>
          <div className="mt-6 flex flex-wrap justify-end gap-2">
            <button type="button" onClick={dismiss} className="rounded-lg px-3 py-2 hover:bg-stone-100">Để sau</button>
            <button type="button" onClick={() => choose("/register")} className="rounded-lg border border-primary px-3 py-2 text-primary">Đăng ký</button>
            <button type="button" onClick={() => choose("/login")} className="rounded-lg bg-primary px-3 py-2 font-semibold text-white">Đăng nhập</button>
          </div>
        </dialog>
      )}
    </AuthPromptContext.Provider>
  );
}

export function AuthLink({ to, onClick, ...props }) {
  const requireLogin = useRequireLogin();
  return <Link {...props} to={to} onClick={event => {
    if (!event.defaultPrevented && !requireLogin({ from: to })) event.preventDefault();
    if (!event.defaultPrevented) onClick?.(event);
  }} />;
}

export function ProtectedPage({ children }) {
  const token = useSelector(state => state.auth.token);
  const requireLogin = useRequireLogin();
  const navigate = useNavigate();
  useEffect(() => {
    if (!token || token === "null" || token === "undefined") {
      requireLogin({ onDismiss: () => navigate("/", { replace: true }) });
    }
  }, [token, requireLogin, navigate]);
  return token && token !== "null" && token !== "undefined" ? children : null;
}
