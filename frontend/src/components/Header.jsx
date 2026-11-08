import { AuthLink } from "./AuthPrompt";
import SearchSuggestions from './SearchSuggestions';
import { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { logoutAccount } from "../store/authSlice";
import { getImageUrl } from "../services/api";
import NotificationBell from "./NotificationBell";

// Modern SVG Icons matching the design
const HomeIcon = ({ className = "w-4 h-4 xl:w-[18px] xl:h-[18px]" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);

const ChefHatIcon = ({ className = "w-4 h-4 xl:w-[18px] xl:h-[18px]" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21a1 1 0 0 0 1-1v-5.35c0-.457.316-.844.727-1.041a4 4 0 0 0-2.134-7.589 5 5 0 0 0-9.186 0 4 4 0 0 0-2.134 7.588c.411.198.727.585.727 1.041V20a1 1 0 0 0 1 1Z" />
    <path d="M6 17h12" />
  </svg>
);

const BookOpenIcon = ({ className = "w-4 h-4 xl:w-[18px] xl:h-[18px]" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
  </svg>
);

const CartIcon = ({ className = "w-4 h-4 xl:w-[18px] xl:h-[18px]" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="8" cy="21" r="1" />
    <circle cx="19" cy="21" r="1" />
    <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
  </svg>
);

const UsersIcon = ({ className = "w-4 h-4 xl:w-[18px] xl:h-[18px]" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const SearchIcon = ({ className = "w-4 h-4 text-stone-400" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const PlusIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const ChevronDownIcon = ({ className = "w-3.5 h-3.5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const prevScrollPos = useRef(0);
  const userMenuRef = useRef(null);

  // Auto-hide on scroll down, reveal on scroll up
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollPos = window.scrollY;

      // Luôn hiện khi ở gần đầu trang
      if (currentScrollPos <= 40) {
        setIsVisible(true);
      } else if (currentScrollPos > prevScrollPos.current && currentScrollPos > 80) {
        // Cuộn xuống -> ẩn menu
        setIsVisible(false);
        setDropdownOpen(false);
      } else if (currentScrollPos < prevScrollPos.current) {
        // Cuộn lên -> hiện menu
        setIsVisible(true);
      }

      prevScrollPos.current = currentScrollPos;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Click outside to close user dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };

    if (dropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownOpen]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setMobileMenuOpen(false);
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

  // Fluid responsive pill styling for active vs inactive nav items
  const linkClass = (path) => {
    const active = isActive(path);
    return active
      ? "bg-[#FDF2ED] text-[#9E381E] font-semibold rounded-2xl px-2.5 xl:px-3.5 py-1.5 xl:py-2 flex items-center gap-1.5 xl:gap-2 text-xs xl:text-sm transition-all whitespace-nowrap shadow-xs flex-shrink-0"
      : "text-stone-700 hover:text-[#9E381E] hover:bg-stone-50 rounded-2xl px-2 xl:px-3 py-1.5 xl:py-2 flex items-center gap-1.5 xl:gap-2 text-xs xl:text-sm font-medium transition-all whitespace-nowrap flex-shrink-0";
  };

  // Mock Chef profile URL
  const chefProfileUrl = user ? `/chef/${user.id}` : "/chef/2";

  return (
    <header
      data-mobile-header="true"
      className={`sticky top-0 z-50 w-full bg-white/95 backdrop-blur-md border-b border-stone-200/70 shadow-xs transition-transform duration-300 ease-in-out ${
        isVisible ? "translate-y-0" : "-translate-y-full"
      }`}
    >
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-3.5 min-h-[68px] sm:min-h-[72px] flex items-center justify-between gap-2 sm:gap-3 lg:gap-4">
        
        {/* Brand Logo */}
        <Link
          to="/"
          aria-label="Bếp Nhà Mình – CulinShare, trang chủ"
          className="font-display-lg text-[32px] sm:text-[38px] xl:text-[44px] text-primary select-none hover:opacity-90 flex-shrink-0"
        >
          CulinShare
        </Link>

        {/* Center Nav Items */}
        <nav className="hidden 2xl:flex items-center gap-0.5 xl:gap-1.5 flex-shrink-0">
          <Link to="/" className={linkClass("/")}>
            <HomeIcon />
            <span>Trang chủ</span>
          </Link>

          <Link to="/search" className={linkClass("/search")}>
            <ChefHatIcon />
            <span>Khám phá</span>
          </Link>

          <Link to="/fridge" className={linkClass("/fridge")}>
            <BookOpenIcon />
            <span>Tủ lạnh ảo</span>
          </Link>

          <Link to="/chefs" className={linkClass("/chefs")}>
            <CartIcon />
            <span>Bảng xếp hạng</span>
          </Link>

          <Link to="/community" className={linkClass("/community")}>
            <UsersIcon />
            <span>Cộng đồng</span>
          </Link>
        </nav>

        {/* Fluid Auto-size Search Bar */}
        <form
          onSubmit={handleSearchSubmit}
          className="hidden 2xl:flex items-center bg-[#f3f4f6] hover:bg-[#eceef0] focus-within:bg-white focus-within:border-stone-300 focus-within:ring-2 focus-within:ring-[#9E381E]/20 border border-transparent rounded-full px-3 py-1.5 transition-all flex-1 min-w-[100px] max-w-[180px] xl:max-w-[220px] h-9 mx-1"
        >
          <SearchIcon className="w-4 h-4 text-stone-400 mr-2 flex-shrink-0" />
          <SearchSuggestions value={searchQuery} onChange={setSearchQuery} onSelect={value=>{setSearchQuery(value);navigate('/search?q='+encodeURIComponent(value));setMobileMenuOpen(false);}} inputClassName="bg-transparent border-none focus:outline-none text-xs xl:text-sm text-stone-800 placeholder:text-stone-400 w-full min-w-0"/>
        </form>

        {/* Right Section Actions */}
        <div className="flex items-center gap-2 xl:gap-3 flex-shrink-0">
          <button type="button" className="mobile-search-trigger" aria-label="Mở tìm kiếm" onClick={()=>{setMobileMenuOpen(true);setTimeout(()=>document.querySelector('#mobile-site-menu input')?.focus(),0);}}><SearchIcon className="w-5 h-5"/></button>
          {/* Notifications */}
          <NotificationBell />

          {/* User Profile Menu */}
          <div className="relative" data-mobile-account="true" ref={userMenuRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-1 focus:outline-none active:scale-95 transition-all select-none p-0.5 rounded-full hover:bg-stone-100"
              title={user ? (user.fullName || user.name) : "Tài khoản"}
            >
              {user ? (
                <div className="w-8 h-8 sm:w-9 sm:h-9 xl:w-10 xl:h-10 rounded-full overflow-hidden border border-stone-200">
                  <img
                    alt={user.fullName || user.full_name || user.name || "User Profile"}
                    src={
                      getImageUrl(user.avatarUrl || user.avatar_url || user.avatar) ||
                      "https://lh3.googleusercontent.com/aida-public/AB6AXuAAymTPLe8qeQ-OwEcpSDE2G4mib3-hcox7DaSoGwyPmr6vm8PzxcEahKcnmjjPCCWrJOsoQ1wXIegv1SSOUMcLzNmrhC9hWfc6TSCqd9aIjv5stvXiaXnweDE1vYrDp4Vhp8OWl5mbf5KR3as40QB4_NeI8-viIMbo46DVesmWlGsmlxmtCAxgAUUFUBMoGgLQN-eVBMKpmCG7WD8qP6rNmq9QXpOFwV9rFSuJr9yHqhp3gejFSKzYAzP2CswbyY3Hh2iyQbE8fw"
                    }
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-8 h-8 sm:w-9 sm:h-9 xl:w-10 xl:h-10 rounded-full bg-stone-100 flex items-center justify-center text-stone-600">
                  <span className="material-symbols-outlined text-2xl">account_circle</span>
                </div>
              )}
              <ChevronDownIcon
                className={`w-3.5 h-3.5 text-stone-500 transition-transform duration-200 ${
                  dropdownOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {/* Dropdown Menu */}
            {dropdownOpen && (
              <div className="absolute right-0 mt-3 w-56 bg-white border border-stone-200 rounded-xl shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                {user ? (
                  <>
                    <div className="px-4 py-2 border-b border-stone-100 mb-1">
                      <p className="font-semibold text-stone-900 text-sm truncate">
                        {user.fullName || user.full_name || user.name || "Người dùng"}
                      </p>
                      <p className="text-xs text-stone-500 truncate">{user.email}</p>
                    </div>
                    <Link
                      to="/profile"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-stone-700 hover:text-[#9E381E] hover:bg-stone-50 transition-colors"
                    >
                      <span className="material-symbols-outlined text-base">settings</span>
                      Cài đặt hồ sơ
                    </Link>
                    <Link
                      to="/saved-recipes"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-stone-700 hover:text-[#9E381E] hover:bg-stone-50 transition-colors"
                    >
                      <span className="material-symbols-outlined text-base">favorite</span>
                      Công thức yêu thích
                    </Link>
                    <Link
                      to={chefProfileUrl}
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-stone-700 hover:text-[#9E381E] hover:bg-stone-50 transition-colors"
                    >
                      <span className="material-symbols-outlined text-base">person</span>
                      Trang cá nhân đầu bếp
                    </Link>
                    {user?.role === "admin" && (
                      <Link
                        to="/admin"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-stone-700 hover:text-[#9E381E] hover:bg-stone-50 transition-colors"
                      >
                        <span className="material-symbols-outlined text-base">dashboard</span>
                        Quản trị hệ thống
                      </Link>
                    )}
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors text-left"
                    >
                      <span className="material-symbols-outlined text-base">logout</span>
                      Đăng xuất
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      to="/login"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-stone-700 hover:text-[#9E381E] hover:bg-stone-50 transition-colors"
                    >
                      <span className="material-symbols-outlined text-base">login</span>
                      Đăng nhập
                    </Link>
                    <Link
                      to="/register"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-stone-700 hover:text-[#9E381E] hover:bg-stone-50 transition-colors"
                    >
                      <span className="material-symbols-outlined text-base">person_add</span>
                      Đăng ký tài khoản
                    </Link>
                  </>
                )}
              </div>
            )}
          </div>

          {/* CTA Button: "+ Đăng bài viết" on Community page or "+ Đăng công thức" on others */}
          {location.pathname.startsWith("/community") ? (
            <button
              onClick={() => {
                window.dispatchEvent(new CustomEvent("open-community-composer"));
              }}
              className="hidden sm:inline-flex items-center gap-1.5 bg-[#9E381E] hover:bg-[#852c16] active:scale-[0.98] text-white text-xs xl:text-sm font-medium px-3.5 xl:px-4.5 py-2 h-9 xl:h-10 rounded-xl shadow-xs hover:shadow transition-all whitespace-nowrap flex-shrink-0"
            >
              <PlusIcon className="w-3.5 h-3.5 xl:w-4 xl:h-4" />
              <span>Đăng bài viết</span>
            </button>
          ) : (
            <AuthLink
              to="/submit-recipe"
              className="hidden sm:inline-flex items-center gap-1.5 bg-[#9E381E] hover:bg-[#852c16] active:scale-[0.98] text-white text-xs xl:text-sm font-medium px-3.5 xl:px-4.5 py-2 h-9 xl:h-10 rounded-xl shadow-xs hover:shadow transition-all whitespace-nowrap flex-shrink-0"
            >
              <PlusIcon className="w-3.5 h-3.5 xl:w-4 xl:h-4" />
              <span>Đăng công thức</span>
            </AuthLink>
          )}

          {/* Mobile Menu Toggle Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="2xl:hidden p-2 rounded-xl text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition-colors focus:outline-none select-none flex-shrink-0"
            aria-label={mobileMenuOpen?"Đóng menu":"Mở menu"} aria-expanded={mobileMenuOpen} aria-controls="mobile-site-menu"
          >
            <span className="material-symbols-outlined text-2xl">
              {mobileMenuOpen ? "close" : "menu"}
            </span>
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div id="mobile-site-menu" className="2xl:hidden bg-white border-t border-stone-100 px-4 sm:px-6 py-4 shadow-lg animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="max-w-[1360px] mx-auto">
            {/* Mobile Search */}
            <form
              onSubmit={handleSearchSubmit}
              className="flex items-center bg-[#f3f4f6] rounded-full px-4 py-2.5 border border-transparent focus-within:border-stone-300 focus-within:bg-white mb-3"
            >
              <SearchIcon className="w-4 h-4 text-stone-400 mr-2 flex-shrink-0" />
              <SearchSuggestions value={searchQuery} onChange={setSearchQuery} onSelect={value=>{setSearchQuery(value);navigate('/search?q='+encodeURIComponent(value));setMobileMenuOpen(false);}} inputClassName="bg-transparent border-none focus:outline-none text-sm text-stone-800 placeholder:text-stone-400 w-full"/>
            </form>

            {/* Mobile Navigation Links */}
            <nav className="flex flex-col gap-1.5">
              <Link
                to="/"
                onClick={() => setMobileMenuOpen(false)}
                className={linkClass("/")}
              >
                <HomeIcon />
                <span>Trang chủ</span>
              </Link>

              <Link
                to="/search"
                onClick={() => setMobileMenuOpen(false)}
                className={linkClass("/search")}
              >
                <ChefHatIcon />
                <span>Khám phá</span>
              </Link>

              <Link
                to="/fridge"
                onClick={() => setMobileMenuOpen(false)}
                className={linkClass("/fridge")}
              >
                <BookOpenIcon />
                <span>Tủ lạnh ảo</span>
              </Link>

              <Link
                to="/chefs"
                onClick={() => setMobileMenuOpen(false)}
                className={linkClass("/chefs")}
              >
                <CartIcon />
                <span>Bảng xếp hạng</span>
              </Link>

              <Link
                to="/community"
                onClick={() => setMobileMenuOpen(false)}
                className={linkClass("/community")}
              >
                <UsersIcon />
                <span>Cộng đồng</span>
              </Link>

              {user&&<Link to="/saved-recipes" onClick={()=>setMobileMenuOpen(false)} className={linkClass('/saved-recipes')}><span className="material-symbols-outlined text-lg">bookmark</span><span>Món đã lưu</span></Link>}
              {user?.role==='admin'&&<Link to="/admin" onClick={()=>setMobileMenuOpen(false)} className={linkClass('/admin')}><span className="material-symbols-outlined text-lg">dashboard</span><span>Quản trị</span></Link>}
              <div className="pt-2 mt-2 border-t border-stone-100 sm:hidden">
                <AuthLink
                  to="/submit-recipe"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full flex items-center justify-center gap-1.5 bg-[#9E381E] hover:bg-[#852c16] text-white text-sm font-medium px-4 py-2.5 rounded-xl shadow-xs"
                >
                  <PlusIcon className="w-4 h-4" />
                  <span>Đăng công thức</span>
                </AuthLink>
              </div>
            </nav>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
