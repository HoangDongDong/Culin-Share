import { Navigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";

export default function RequireAuth({ children }) {
  const { user, token } = useSelector(state => state.auth);
  const location = useLocation();
  const storedToken = localStorage.getItem("token");
  if (!user || !token || token === "null" || token === "undefined" || storedToken !== token) {
    return <Navigate to="/login" replace state={{
      from: location.pathname + location.search,
      message: "Vui lòng đăng nhập để sử dụng tủ lạnh ảo và nhận gợi ý món ăn.",
    }} />;
  }
  return children;
}
