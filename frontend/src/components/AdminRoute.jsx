import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";

/**
 * AdminRoute - Component bảo vệ route chỉ dành cho admin.
 * Nếu chưa đăng nhập -> chuyển về /login
 * Nếu đã đăng nhập nhưng không phải admin -> chuyển về /
 * Nếu là admin -> hiển thị nội dung bên trong
 */
const AdminRoute = ({ children }) => {
  const { user, token } = useSelector((state) => state.auth);

  // Chưa đăng nhập
  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  // Không phải admin
  if (user.role !== "admin") {
    return <Navigate to="/" replace />;
  }

  // Là admin -> render children
  return children;
};

export default AdminRoute;
