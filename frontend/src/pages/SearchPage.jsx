import { useEffect, useMemo, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import RecipeCard from "../components/RecipeCard";
import { getCategoriesApi } from "../services/categoryApi";
import { searchRecipesApi } from "../services/recipeApi";

const SearchPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const q = searchParams.get("q") || "";
  const cat = searchParams.get("category") || "";

  const [searchQuery, setSearchQuery] = useState(q);
  const [selectedCategories, setSelectedCategories] = useState(cat ? [cat] : []);
  const [selectedTimeRange, setSelectedTimeRange] = useState("all");
  const [selectedDifficulty, setSelectedDifficulty] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [currentPage, setCurrentPage] = useState(1);

  const [dbRecipes, setDbRecipes] = useState([]);
  const [dbCategories, setDbCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [cats, recs] = await Promise.all([
          getCategoriesApi(),
          searchRecipesApi({ q, limit: 100 })
        ]);
        setDbCategories(cats);
        setDbRecipes(recs);
      } catch (err) {
        console.error("Lỗi khi tìm kiếm công thức:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [q]);

  useEffect(() => {
    setSearchQuery(q);
  }, [q]);

  useEffect(() => {
    if (cat) {
      setSelectedCategories([cat]);
    } else {
      setSelectedCategories([]);
    }
  }, [cat]);

  const handleCategoryChange = (category) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
    setCurrentPage(1);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setSearchParams({ q: searchQuery, ...(cat ? { category: cat } : {}) });
    setCurrentPage(1);
  };

  const handleChipClick = (term) => {
    setSearchQuery(term);
    setSearchParams({ q: term });
    setCurrentPage(1);
  };

  // Filter recipes logic
  const filteredRecipes = useMemo(() => {
    return dbRecipes.filter((recipe) => {
      // 1. Text Search (already partially filtered by backend, but we can do extra matching in case of client sync)
      if (q.trim()) {
        const queryLower = q.toLowerCase();
        const titleVal = (recipe.title || "").toLowerCase();
        const descVal = (recipe.description || "").toLowerCase();
        const authorVal = (recipe.author_name || "").toLowerCase();
        const matchesName = titleVal.includes(queryLower);
        const matchesDesc = descVal.includes(queryLower);
        const matchesAuthor = authorVal.includes(queryLower);
        if (!matchesName && !matchesDesc && !matchesAuthor) return false;
      }

      // 2. Categories
      if (selectedCategories.length > 0) {
        const matchesCategory = selectedCategories.some(catName => 
          recipe.categories && recipe.categories.some(rcat => 
            (typeof rcat === 'string' ? rcat : rcat.name).toLowerCase() === catName.toLowerCase()
          )
        );
        if (!matchesCategory) return false;
      }

      // 3. Prep Time
      if (selectedTimeRange !== "all") {
        const time = (recipe.prep_time_minutes || recipe.prepTimeMinutes || 0) + (recipe.cook_time_minutes || recipe.cookTimeMinutes || 0);
        if (selectedTimeRange === "under15" && time >= 15) return false;
        if (selectedTimeRange === "15to30" && (time < 15 || time > 30)) return false;
        if (selectedTimeRange === "over30" && time <= 30) return false;
      }

      // 4. Difficulty
      if (selectedDifficulty !== "all") {
        const diffMap = {
          "Dễ": "dễ",
          "Vừa": "trung bình",
          "Trung bình": "trung bình",
          "Khó": "khó"
        };
        const mappedDiff = diffMap[selectedDifficulty];
        if ((recipe.difficulty || "").toLowerCase() !== mappedDiff) return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === "rating") {
        const ratingA = parseFloat(a.rating || a.average_rating || a.averageRating || 0);
        const ratingB = parseFloat(b.rating || b.average_rating || b.averageRating || 0);
        return ratingB - ratingA;
      }
      if (sortBy === "newest") {
        const dateA = new Date(a.created_at || a.createdTime || 0);
        const dateB = new Date(b.created_at || b.createdTime || 0);
        return dateB - dateA;
      }
      return b.id - a.id;
    });
  }, [dbRecipes, q, selectedCategories, selectedTimeRange, selectedDifficulty, sortBy]);

  const totalPages = Math.ceil(filteredRecipes.length / 6);
  const displayedRecipes = filteredRecipes.slice((currentPage - 1) * 6, currentPage * 6);

  const resetFilters = () => {
    setSearchQuery("");
    setSelectedCategories([]);
    setSelectedTimeRange("all");
    setSelectedDifficulty("all");
    setSortBy("newest");
    setSearchParams({});
    setCurrentPage(1);
  };

  return (
    <div className="bg-surface text-on-surface font-body-md min-h-screen flex flex-col">
      <Header />
      
      {/* Hero Section */}
      <section className="bg-surface-container-low py-lg select-none">
        <div className="max-w-max-width mx-auto px-margin-mobile md:px-margin-desktop">
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-xs mb-md text-label-sm font-label-sm text-on-surface-variant">
            <Link to="/" className="hover:text-primary">Trang chủ</Link>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span className="text-primary font-bold">Khám phá công thức</span>
            </nav>
          
          <div className="grid md:grid-cols-2 gap-lg items-center">
            <div>
              <h1 className="font-display-lg text-display-lg text-on-surface mb-md font-bold">
                Tìm cảm hứng cho bữa tối tiếp theo
              </h1>
              <form onSubmit={handleSearchSubmit} className="relative max-w-lg">
                <input
                  className="w-full h-14 pl-12 pr-32 bg-surface-container-lowest border border-outline-variant focus:border-primary focus:ring-0 rounded-xl font-body-md text-on-surface outline-none"
                  placeholder="Tìm tên món, nguyên liệu, đầu bếp..."
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant">
                  search
                </span>
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-primary text-on-primary px-md py-2.5 rounded-lg font-label-md hover:opacity-90 transition-all font-bold"
                >
                  Tìm kiếm
                </button>
              </form>
            </div>
            
            <div className="hidden md:block relative h-[300px] rounded-xl overflow-hidden shadow-md">
              <img
                className="w-full h-full object-cover"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAffFMQq_0Q67H-vnKJ0E5blK0Rqt6ar7t--bR-Ud9VgGfdCpVu-cORUjZCUVcji-5dNi9kcUiivQoTCM-uqvdSgVeb1TF7keQcy-jcClgSSwQ82LZTWkZjk3YA3PKPSwFmXMgUof_7_3CYQhEFsr0abNyY-SF9hFW81PLwqjViY3pM6mB87X3hMu0rWPGZo_RtG2jrttzdJQe1xou7iTueHBMPjrRSgiaUIABNqq0qqaMUl_8v5X9oidqbHjf_6y4oj-1im_JrvA"
                alt="Table setup"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="max-w-max-width mx-auto px-margin-mobile md:px-margin-desktop py-xl flex-grow flex flex-col md:flex-row gap-lg w-full">
        {/* Filter Sidebar */}
        <aside className="w-full md:w-64 flex-shrink-0 select-none">
          <div className="sticky top-24 space-y-lg bg-surface-container-lowest p-md rounded-xl border border-outline-variant/15 shadow-sm">
            
            {/* Categories */}
            <div>
              <h3 className="font-headline-sm text-headline-sm text-on-surface mb-md font-bold flex items-center gap-xs">
                <span className="material-symbols-outlined text-[20px] text-primary">category</span>
                Danh mục
              </h3>
              <div className="space-y-sm max-h-48 overflow-y-auto pr-xs">
                {loading ? (
                  <p className="text-xs text-on-surface-variant font-bold">Đang tải...</p>
                ) : (
                  dbCategories.map((cat) => (
                    <label key={cat.id} className="flex items-center gap-sm cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={selectedCategories.includes(cat.name)}
                        onChange={() => handleCategoryChange(cat.name)}
                        className="w-5 h-5 border-outline-variant text-primary rounded focus:ring-primary focus:outline-none"
                      />
                      <span className="font-body-md text-on-surface-variant group-hover:text-primary transition-colors">
                        {cat.name}
                      </span>
                    </label>
                  ))
                )}
              </div>
            </div>
            
            {/* Prep Time */}
            <div className="border-t border-outline-variant/15 pt-md">
              <h3 className="font-headline-sm text-headline-sm text-on-surface mb-md font-bold flex items-center gap-xs">
                <span className="material-symbols-outlined text-[20px] text-primary">schedule</span>
                Thời gian nấu
              </h3>
              <div className="space-y-sm">
                {[
                  { label: "Tất cả", value: "all" },
                  { label: "Dưới 15 phút", value: "under15" },
                  { label: "15 - 30 phút", value: "15to30" },
                  { label: "Trên 30 phút", value: "over30" }
                ].map((option) => (
                  <label key={option.value} className="flex items-center gap-sm cursor-pointer group">
                    <input
                      type="radio"
                      name="time"
                      checked={selectedTimeRange === option.value}
                      onChange={() => { setSelectedTimeRange(option.value); setCurrentPage(1); }}
                      className="w-5 h-5 border-outline-variant text-primary focus:ring-primary focus:outline-none"
                    />
                    <span className="font-body-md text-on-surface-variant group-hover:text-primary transition-colors">
                      {option.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>
            
            {/* Difficulty */}
            <div className="border-t border-outline-variant/15 pt-md">
              <h3 className="font-headline-sm text-headline-sm text-on-surface mb-md font-bold flex items-center gap-xs">
                <span className="material-symbols-outlined text-[20px] text-primary">fitness_center</span>
                Độ khó
              </h3>
              <div className="flex flex-wrap gap-xs">
                {["all", "Dễ", "Vừa", "Khó"].map((diff) => (
                  <button
                    key={diff}
                    onClick={() => { setSelectedDifficulty(diff); setCurrentPage(1); }}
                    className={`px-3 py-1.5 rounded-full border text-label-md font-label-md transition-all font-bold ${
                      selectedDifficulty === diff
                        ? "border-primary bg-primary-container/10 text-primary"
                        : "border-outline-variant text-secondary hover:bg-secondary-container hover:text-on-secondary-container"
                    }`}
                  >
                    {diff === "all" ? "Tất cả" : diff}
                  </button>
                ))}
              </div>
            </div>

            {/* Reset Filter Button */}
            <button
              onClick={resetFilters}
              className="w-full mt-md py-2.5 bg-outline-variant/10 text-secondary hover:bg-primary/5 hover:text-primary font-label-md font-bold rounded-xl transition-all border border-transparent hover:border-primary/25"
            >
              Xoá bộ lọc
            </button>
          </div>
        </aside>

        {/* Results Grid Area */}
        <section className="flex-grow">
          {/* Header & Sort */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-sm mb-lg pb-md border-b border-outline-variant/10 select-none">
            <p className="text-on-surface-variant font-label-md text-label-md font-bold">
              Tìm thấy <span className="text-primary">{filteredRecipes.length}</span> công thức nấu ăn
            </p>
            <div className="flex items-center gap-sm">
              <span className="text-label-md font-label-md text-secondary font-bold whitespace-nowrap">Sắp xếp:</span>
              <select
                value={sortBy}
                onChange={(e) => { setSortBy(e.target.value); setCurrentPage(1); }}
                className="bg-surface-container-lowest border border-outline-variant text-on-surface text-label-md rounded-lg p-2 outline-none focus:border-primary font-bold shadow-sm"
              >
                <option value="newest">Mới nhất</option>
                <option value="rating">Đánh giá cao</option>
              </select>
            </div>
          </div>

          {/* Recipe List */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter">
              {Array.from({ length: 6 }).map((_, idx) => (
                <div key={idx} className="bg-surface-container-lowest rounded-2xl h-96 animate-pulse border border-outline-variant/10 shadow-sm flex flex-col p-4">
                  <div className="bg-surface-variant w-full h-48 rounded-xl mb-4"></div>
                  <div className="bg-surface-variant w-1/3 h-4 rounded mb-2"></div>
                  <div className="bg-surface-variant w-3/4 h-6 rounded mb-2"></div>
                  <div className="bg-surface-variant w-full h-12 rounded mt-auto"></div>
                </div>
              ))}
            </div>
          ) : displayedRecipes.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter">
              {displayedRecipes.map((recipe) => (
                <RecipeCard key={recipe.id} recipe={recipe} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-surface-container-lowest rounded-2xl border border-dashed border-outline-variant/30 select-none">
              <span className="material-symbols-outlined text-[48px] text-outline-variant animate-bounce mb-md">sentiment_dissatisfied</span>
              <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold mb-xs">Không tìm thấy công thức</h3>
              <p className="text-on-surface-variant text-body-md max-w-sm mx-auto">
                Thử tìm kiếm với từ khoá khác hoặc xoá bớt các bộ lọc để có thêm kết quả gợi ý.
              </p>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-xs mt-xl select-none">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => prev - 1)}
                className="p-2 hover:bg-surface-variant rounded-full text-on-surface-variant disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
              >
                <span className="material-symbols-outlined">chevron_left</span>
              </button>
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`w-9 h-9 flex items-center justify-center rounded-full text-label-md font-bold transition-all ${
                    currentPage === i + 1
                      ? "bg-primary text-on-primary shadow-md"
                      : "hover:bg-surface-variant text-on-surface-variant"
                  }`}
                >
                  {i + 1}
                </button>
              ))}
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => prev + 1)}
                className="p-2 hover:bg-surface-variant rounded-full text-on-surface-variant disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
              >
                <span className="material-symbols-outlined">chevron_right</span>
              </button>
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default SearchPage;