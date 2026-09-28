import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import RecipeCard from "../components/RecipeCard";
import { getImageUrl } from "../services/api";
import { getCategoriesApi } from "../services/categoryApi";
import { searchRecipesApi } from "../services/recipeApi";

const HomePage = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const sliderRef = useRef(null);

  const [categories, setCategories] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [cats, recs] = await Promise.all([
          getCategoriesApi(),
          searchRecipesApi({ sort: "rating" })
        ]);
        setCategories(cats);
        setRecipes(recs);
      } catch (err) {
        console.error("Lỗi khi tải dữ liệu trang chủ:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleScroll = (direction) => {
    const container = sliderRef.current;
    if (container) {
      const scrollAmount = 400;
      if (direction === "left") {
        container.scrollBy({ left: -scrollAmount, behavior: "smooth" });
      } else {
        container.scrollBy({ left: scrollAmount, behavior: "smooth" });
      }
    }
  };

  return (
    <div className="bg-surface text-on-surface font-body-md min-h-screen flex flex-col">
      <Header />
      
      {/* Hero Section */}
      <header className="relative w-full py-xl px-margin-mobile md:px-margin-desktop bg-surface-container-low overflow-hidden select-none">
        <div className="max-w-max-width mx-auto grid md:grid-cols-2 gap-lg items-center relative z-10">
          <div className="space-y-md">
            <span className="inline-block px-4 py-1 bg-tertiary-container/10 text-tertiary rounded-full font-label-md text-label-md">
              Gợi ý hôm nay
            </span>
            <h1 className="font-display-lg text-display-lg-mobile md:text-display-lg text-on-surface leading-tight">
              Khơi nguồn cảm hứng <br /> <span className="text-primary">gian bếp Việt</span>
            </h1>
            <p className="font-body-lg text-body-lg text-on-surface-variant max-w-md">
              Khám phá hàng ngàn công thức nấu ăn từ cộng đồng đầu bếp gia đình. Đơn giản, tinh tế và đầy yêu thương.
            </p>
            <form onSubmit={handleSearchSubmit} className="relative max-w-lg mt-base">
              <input
                className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-xl px-6 py-4 pr-16 shadow-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-body-md text-on-surface"
                placeholder="Tìm công thức cho bữa tối nay..."
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button
                type="submit"
                className="absolute right-3 top-1/2 -translate-y-1/2 bg-primary text-on-primary p-2.5 rounded-lg active:scale-95 transition-transform flex items-center justify-center"
              >
                <span className="material-symbols-outlined">search</span>
              </button>
            </form>
          </div>
          
          <div className="hidden md:block relative">
            <div className="aspect-[4/5] rounded-[40px] overflow-hidden shadow-xl transform rotate-2">
              <img
                alt="Cooking background"
                className="w-full h-full object-cover"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBzgLK1u_h2O7Iv_iSgGUjfYi_7ApJNQuIiXSydTQU4UYoFRdJwTvsKfrfOZV5QeKoT48_gma1fy3mNV2P0Bu6aCGLulFuri4Ceok0Ip-zMRN7PB-5o8YmVyk5VOo6F2OWxZTP3rrQr5NLXaTcHMmM5h7s5fYZcFtgoOY4tiY0aC-7BqY2-iwWROdeanSpF3bwmvWdo3X28lmLSNxdiEmiYZb6tgMB8XXgNUzvb9K9-CyL1hUZ4zAfM2R0MtiR_LDqh6mLU_dT6rQ"
              />
            </div>
            
            <div className="absolute -bottom-6 -left-6 bg-surface-container-lowest p-6 rounded-2xl shadow-lg border border-outline-variant/10 flex items-center gap-4 animate-bounce-slow">
              <div className="w-12 h-12 rounded-full bg-primary-fixed flex items-center justify-center shadow-sm">
                <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
              </div>
              <div>
                <p className="font-label-md text-label-md text-on-surface font-bold">Công thức số 1</p>
                <p className="font-label-sm text-label-sm text-on-surface-variant">Phở bò truyền thống</p>
              </div>
            </div>
          </div>
        </div>
        {/* Decorative blob */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary-fixed/30 rounded-full blur-3xl -z-0"></div>
      </header>

      {/* Category Grid (Bento Style) */}
      <section className="py-xl px-margin-mobile md:px-margin-desktop max-w-max-width mx-auto w-full">
        <div className="flex justify-between items-end mb-lg">
          <div>
            <h2 className="font-headline-md text-headline-md text-on-surface mb-2 font-bold">Khám phá theo danh mục</h2>
            <p className="font-body-md text-body-md text-on-surface-variant">Tìm kiếm cảm hứng theo từng bữa ăn trong ngày</p>
          </div>
          <Link
            to="/search"
            className="hidden md:flex items-center text-primary font-label-md hover:underline decoration-primary underline-offset-4 font-bold"
          >
            Xem tất cả <span className="material-symbols-outlined ml-1 text-sm">arrow_forward</span>
          </Link>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {loading ? (
            <div className="col-span-full text-center py-8 text-on-surface-variant font-bold">Đang tải danh mục...</div>
          ) : categories.length > 0 ? (
            categories.map((cat) => {
              return (
                <Link
                  key={cat.id}
                  to={`/search?category=${encodeURIComponent(cat.name)}`}
                  className="group relative h-40 overflow-hidden rounded-2xl block bg-surface-container shadow-sm border border-outline-variant/10 hover:shadow-md transition-all duration-300"
                >
                  <img
                    alt={cat.name}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    src={getImageUrl(cat.image_url) || "https://images.unsplash.com/photo-1596797038530-2c107229654b"}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
                  <div className="absolute bottom-4 left-4 text-white">
                    <p className="font-headline-sm text-headline-sm font-bold leading-tight">{cat.name}</p>
                    <p className="text-white/70 text-xs font-label-sm mt-0.5 line-clamp-1 pr-4">{cat.description}</p>
                  </div>
                </Link>
              );
            })
          ) : (
            <div className="col-span-full text-center py-8 text-on-surface-variant font-bold">Không có danh mục nào.</div>
          )}
        </div>
      </section>

      {/* Featured Recipes Slider */}
      <section className="py-xl bg-surface-container-low overflow-hidden w-full select-none">
        <div className="max-w-max-width mx-auto px-margin-mobile md:px-margin-desktop">
          <div className="flex items-center justify-between mb-lg">
            <h2 className="font-headline-md text-headline-md text-on-surface font-bold">Công thức nổi bật</h2>
            <div className="flex gap-2">
              <button
                onClick={() => handleScroll("left")}
                className="w-10 h-10 rounded-full border border-outline-variant flex items-center justify-center bg-surface hover:bg-primary hover:text-white transition-all shadow-sm"
              >
                <span className="material-symbols-outlined">chevron_left</span>
              </button>
              <button
                onClick={() => handleScroll("right")}
                className="w-10 h-10 rounded-full border border-outline-variant flex items-center justify-center bg-surface hover:bg-primary hover:text-white transition-all shadow-sm"
              >
                <span className="material-symbols-outlined">chevron_right</span>
              </button>
            </div>
          </div>
          
          <div
            ref={sliderRef}
            className="flex gap-gutter overflow-x-auto hide-scrollbar pb-8 scroll-smooth"
          >
            {loading ? (
              <div className="w-full text-center py-8 text-on-surface-variant">Đang tải công thức...</div>
            ) : recipes.length > 0 ? (
              recipes.map((recipe) => (
                <div key={recipe.id} className="min-w-[300px] md:min-w-[380px] flex-shrink-0">
                  <RecipeCard recipe={recipe} />
                </div>
              ))
            ) : (
              <div className="w-full text-center py-8 text-on-surface-variant">Chưa có công thức nào.</div>
            )}
          </div>
        </div>
      </section>

      {/* Top Chef of the Month */}
      <section className="py-xl px-margin-mobile md:px-margin-desktop max-w-max-width mx-auto w-full select-none">
        <div className="bg-surface-container rounded-[40px] p-8 md:p-16 flex flex-col md:flex-row items-center gap-lg border border-outline-variant/10 shadow-sm">
          <div className="relative w-full md:w-1/2 flex justify-center">
            <div className="w-64 h-64 sm:w-80 sm:h-80 rounded-full overflow-hidden border-8 border-surface-container-lowest shadow-2xl relative z-10">
              <img
                alt="Top Chef"
                className="w-full h-full object-cover"
                src="https://images.unsplash.com/photo-1577219491135-ce391730fb2c"
              />
            </div>
            <div className="absolute -top-10 -left-10 w-40 h-40 bg-primary-fixed rounded-full -z-0 opacity-50 blur-2xl"></div>
            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-secondary-fixed rounded-full -z-0 opacity-50 blur-2xl"></div>
          </div>
          
          <div className="w-full md:w-1/2 space-y-md">
            <div className="flex items-center gap-3">
              <span className="w-12 h-px bg-primary"></span>
              <span className="font-label-md text-label-md text-primary tracking-widest uppercase font-bold">
                Đầu bếp nổi bật
              </span>
            </div>
            <h2 className="font-display-lg text-display-lg-mobile md:text-display-lg text-on-surface font-bold">
              Chef Hoàng Anh
            </h2>
            <p className="font-body-lg text-body-lg text-on-surface-variant italic leading-relaxed">
              "Với tôi, nấu ăn không chỉ là sự kết hợp của các nguyên liệu, mà là nghệ thuật truyền tải tình cảm vào từng món ăn."
            </p>
            <div className="grid grid-cols-2 gap-gutter py-2 border-y border-outline-variant/10">
              <div>
                <p className="text-display-lg-mobile font-display-lg text-primary font-bold">10+</p>
                <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Năm kinh nghiệm</p>
              </div>
              <div>
                <p className="text-display-lg-mobile font-display-lg text-primary font-bold">4.9</p>
                <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Xếp hạng trung bình</p>
              </div>
            </div>
            <button
              onClick={() => navigate("/chef/2")}
              className="px-8 py-4 bg-primary text-on-primary rounded-xl font-label-md font-bold hover:bg-primary/90 transition-all active:scale-95 shadow-md flex items-center justify-center gap-2"
            >
              Xem các công thức của Hoàng Anh
            </button>
          </div>
        </div>
      </section>

      <Footer />

      {/* Floating Action Button (FAB) for adding recipe */}
      <Link
        to="/submit-recipe"
        className="fixed bottom-8 right-8 w-14 h-14 bg-primary-container text-on-primary-container rounded-full shadow-2xl flex items-center justify-center active:scale-95 transition-all duration-300 ease-in-out group overflow-hidden border border-outline-variant/20 hover:w-44 select-none z-40"
      >
        <div className="flex items-center justify-start w-full px-4 gap-2 whitespace-nowrap">
          <span className="material-symbols-outlined text-2xl font-bold">add</span>
          <span className="max-w-0 opacity-0 group-hover:max-w-xs group-hover:opacity-100 transition-all duration-300 ease-in-out font-label-md font-bold">
            Đăng công thức
          </span>
        </div>
      </Link>
    </div>
  );
};

export default HomePage;
