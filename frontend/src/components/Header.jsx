import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { logoutAccount } from "../store/authSlice";
import { getImageUrl } from "../services/api";
import NotificationBell from "./NotificationBell";

const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleLogout = () => {
    dispatch(logoutAccount());
    setDropdownOpen(false);
    navigate("/login");
  };

  const isActive = (path) => {
    if (path === "/" && location.pathname === "/") return true;
    if (path !== "/" && location.pathname.startsWith(path)) return true;
    return false;
  };

  const linkClass = (path) => {
    return isActive(path)
      ? "font-label-md text-label-md text-primary font-bold relative after:content-[''] after:absolute after:-bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1 after:h-1 after:bg-primary after:rounded-full whitespace-nowrap"
      : "font-label-md text-label-md text-secondary hover:text-primary transition-colors whitespace-nowrap";
  };

  // Mock Chef profile URL
  const chefProfileUrl = user ? `/chef/${user.id}` : "/chef/2";

  return (
    <nav className="sticky top-0 z-50 bg-surface/95 backdrop-blur-md border-b border-outline-variant/10 shadow-sm transition-all duration-200">
      <div className="flex items-center justify-between px-margin-mobile md:px-margin-desktop py-4 max-w-max-width mx-auto w-full">
        {/* Brand Logo */}
        <Link to="/" className="font-display-lg text-display-lg-mobile md:text-display-lg text-primary select-none hover:opacity-90 flex-shrink-0">
          CulinShare
        </Link>
        
        {/* Desktop Navigation Links (Centered and spaced out nicely) */}
        <div className="hidden md:flex gap-4 lg:gap-6 items-center mx-4 flex-grow justify-center">
          <Link to="/" className={linkClass("/")}>Trang chủ</Link>
          <Link to="/search" className={linkClass("/search")}>Khám phá</Link>
          <Link to="/fridge" className={linkClass("/fridge")}>Tủ lạnh ảo</Link>
          <Link to="/chefs" className={linkClass("/chefs")}>Bảng xếp hạng</Link>
          <Link to="/submit-recipe" className={linkClass("/submit-recipe")}>Đăng công thức</Link>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-4">
          {/* Search Bar (Desktop only) */}
          <form onSubmit={handleSearchSubmit} className="hidden lg:flex items-center bg-surface-container rounded-full px-4 py-2 border border-outline-variant/20 focus-within:border-primary/50 transition-all">
            <span className="material-symbols-outlined text-on-surface-variant text-sm mr-2 select-none">search</span>
            <input
              type="text"
              placeholder="Tìm kiếm..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none focus:outline-none focus:ring-0 text-label-md w-48 text-on-surface placeholder:text-on-surface-variant/40"
            />
          </form>

          {/* Notifications */}
          <NotificationBell />

          {/* User Profile Menu */}
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center justify-center focus:outline-none active:scale-95 transition-all select-none"
            >
              {user ? (
                <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-primary">
                  <img
                    alt={user.fullName || user.full_name || user.name || "User Profile"}
                    src={getImageUrl(user.avatarUrl || user.avatar_url || user.avatar) || "https://lh3.googleusercontent.com/aida-public/AB6AXuAAymTPLe8qeQ-OwEcpSDE2G4mib3-hcox7DaSoGwyPmr6vm8PzxcEahKcnmjjPCCWrJOsoQ1wXIegv1SSOUMcLzNmrhC9hWfc6TSCqd9aIjv5stvXiaXnweDE1vYrDp4Vhp8OWl5mbf5KR3as40QB4_NeI8-viIMbo46DVesmWlGsmlxmtCAxgAUUFUBMoGgLQN-eVBMKpmCG7WD8qP6rNmq9QXpOFwV9rFSuJr9yHqhp3gejFSKzYAzP2CswbyY3Hh2iyQbE8fw"}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <span className="material-symbols-outlined text-secondary hover:text-primary text-3xl">
                  account_circle
                </span>
              )}
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-3 w-56 bg-surface-container-lowest border border-outline-variant/20 rounded-xl shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-3 duration-200">
                {user ? (
                  <>
                    <div className="px-4 py-2 border-b border-outline-variant/10 mb-1">
                      <p className="font-label-md text-on-surface font-bold truncate">{user.fullName || user.full_name || user.name || "Người dùng"}</p>
                      <p className="text-xs text-on-surface-variant truncate">{user.email}</p>
                    </div>
                    <Link
                      to="/profile"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-label-md text-secondary hover:text-primary hover:bg-surface-container-low transition-colors"
                    >
                      <span className="material-symbols-outlined text-sm">settings</span>
                      Cài đặt hồ sơ
                    </Link>
                    <Link
                      to="/saved-recipes"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-label-md text-secondary hover:text-primary hover:bg-surface-container-low transition-colors"
                    >
                      <span className="material-symbols-outlined text-sm">favorite</span>
                      Công thức yêu thích
                    </Link>
                    <Link
                      to={chefProfileUrl}
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-label-md text-secondary hover:text-primary hover:bg-surface-container-low transition-colors"
                    >
                      <span className="material-symbols-outlined text-sm">person</span>
                      Trang cá nhân đầu bếp
                    </Link>
                    {user?.role === "admin" && (
                    <Link
                      to="/admin"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-label-md text-secondary hover:text-primary hover:bg-surface-container-low transition-colors"
                    >
                      <span className="material-symbols-outlined text-sm">dashboard</span>
                      Quản trị hệ thống
                    </Link>
                    )}
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-4 py-2 text-label-md text-error hover:bg-error-container/10 transition-colors text-left"
                    >
                      <span className="material-symbols-outlined text-sm">logout</span>
                      Đăng xuất
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      to="/login"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-label-md text-secondary hover:text-primary hover:bg-surface-container-low transition-colors"
                    >
                      <span className="material-symbols-outlined text-sm">login</span>
                      Đăng nhập
                    </Link>
                    <Link
                      to="/register"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-label-md text-secondary hover:text-primary hover:bg-surface-container-low transition-colors"
                    >
                      <span className="material-symbols-outlined text-sm">person_add</span>
                      Đăng ký tài khoản
                    </Link>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden material-symbols-outlined text-secondary hover:text-primary transition-all active:scale-95 p-2 rounded-full hover:bg-surface-container-low select-none"
          >
            {mobileMenuOpen ? "close" : "menu"}
          </button>
        </div>
      </div>

      {/* Mobile Menu Panel */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-outline-variant/10 bg-surface-container-lowest px-margin-mobile py-4 flex flex-col gap-4 shadow-inner animate-in fade-in slide-in-from-top-2 duration-200">
          <Link
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            className={`py-2 border-b border-outline-variant/5 text-label-md ${isActive("/") ? "text-primary font-bold" : "text-secondary"}`}
          >
            Trang chủ
          </Link>
          <Link
            to="/search"
            onClick={() => setMobileMenuOpen(false)}
            className={`py-2 border-b border-outline-variant/5 text-label-md ${isActive("/search") ? "text-primary font-bold" : "text-secondary"}`}
          >
            Khám phá
          </Link>
          <Link
            to="/fridge"
            onClick={() => setMobileMenuOpen(false)}
            className={`py-2 border-b border-outline-variant/5 text-label-md ${isActive("/fridge") ? "text-primary font-bold" : "text-secondary"}`}
          >
            Tủ lạnh ảo
          </Link>
          <Link
            to="/chefs"
            onClick={() => setMobileMenuOpen(false)}
            className={`py-2 border-b border-outline-variant/5 text-label-md ${isActive("/chefs") ? "text-primary font-bold" : "text-secondary"}`}
          >
            Bảng xếp hạng
          </Link>
          <Link
            to="/submit-recipe"
            onClick={() => setMobileMenuOpen(false)}
            className={`py-2 border-b border-outline-variant/5 text-label-md ${isActive("/submit-recipe") ? "text-primary font-bold" : "text-secondary"}`}
          >
            Đăng công thức
          </Link>

          {/* Mobile search bar */}
          <form onSubmit={handleSearchSubmit} className="flex items-center bg-surface-container rounded-full px-4 py-2 border border-outline-variant/20">
            <span className="material-symbols-outlined text-on-surface-variant text-sm mr-2 select-none">search</span>
            <input
              type="text"
              placeholder="Tìm kiếm..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none focus:outline-none focus:ring-0 text-label-md w-full text-on-surface placeholder:text-on-surface-variant/40"
            />
          </form>
        </div>
      )}
    </nav>
  );
};

export default Header;
