import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import RecipeCard from "../components/RecipeCard";
import { getSavedRecipesApi, updateSavedCollectionApi, unsaveRecipeApi } from "../services/recipeApi";

const COLLECTIONS = [
  {
    key: "all",
    label: "Tất cả món",
    icon: "grid_view",
    desc: "Toàn bộ công thức bạn đã lưu",
    color: "primary"
  },
  {
    key: "want_to_try",
    label: "Món muốn thử",
    icon: "bookmark",
    desc: "Những công thức bạn dự định sẽ nấu khi có thời gian",
    badgeColor: "bg-amber-100 text-amber-800 border-amber-200"
  },
  {
    key: "quick_dinner",
    label: "Bữa tối nhanh",
    icon: "bolt",
    desc: "Món ngon nấu nhanh, tiện lợi cho ngày bận rộn",
    badgeColor: "bg-sky-100 text-sky-800 border-sky-200"
  },
  {
    key: "cooked",
    label: "Món đã nấu",
    icon: "check_circle",
    desc: "Những món ăn bạn đã hoàn thành và trổ tài thành công",
    badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-200"
  }
];

const SavedRecipesPage = () => {
  const navigate = useNavigate();
  const [activeCollection, setActiveCollection] = useState("all");
  const [savedRecipes, setSavedRecipes] = useState([]);
  const [counts, setCounts] = useState({ total: 0, want_to_try: 0, quick_dinner: 0, cooked: 0 });
  const [loading, setLoading] = useState(true);
  const [movingRecipeId, setMovingRecipeId] = useState(null);
  const token = localStorage.getItem("accessToken") || localStorage.getItem("token") || localStorage.getItem("authToken");

  const loadSavedRecipes = async (colKey = activeCollection) => {
    try {
      setLoading(true);
      const res = await getSavedRecipesApi(colKey);
      setSavedRecipes(res || []);
      if (res.counts) {
        setCounts(res.counts);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    loadSavedRecipes(activeCollection);
  }, [navigate, token, activeCollection]);

  const handleSavedChange = (isSaved, recipe) => {
    if (!isSaved) {
      setSavedRecipes((current) => current.filter((item) => item.id !== recipe.id));
      loadSavedRecipes(activeCollection);
    }
  };

  const handleMoveCollection = async (recipeId, targetCol) => {
    try {
      setMovingRecipeId(recipeId);
      await updateSavedCollectionApi(recipeId, targetCol);
      // Reload current tab
      await loadSavedRecipes(activeCollection);
    } catch (err) {
      alert(err.message || "Không thể chuyển bộ sưu tập");
    } finally {
      setMovingRecipeId(null);
    }
  };

  const handleRemoveRecipe = async (recipeId) => {
    if (!window.confirm("Bỏ lưu công thức này khỏi bộ sưu tập?")) return;
    try {
      await unsaveRecipeApi(recipeId);
      setSavedRecipes((current) => current.filter((item) => item.id !== recipeId));
      loadSavedRecipes(activeCollection);
    } catch (err) {
      alert(err.message || "Không thể hủy lưu");
    }
  };

  const currentTabInfo = COLLECTIONS.find((c) => c.key === activeCollection) || COLLECTIONS[0];

  return (
    <div className="bg-surface text-on-surface font-body-md min-h-screen flex flex-col">
      <Header />
      <main className="w-full px-6 sm:px-10 md:px-14 lg:px-20 xl:px-24 py-xl flex-grow">
        {/* Masthead */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-md mb-lg">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider mb-2">
              <span className="material-symbols-outlined text-[15px]">folder_special</span>
              Bộ sưu tập món ăn
            </div>
            <h1 className="font-display-lg text-display-lg-mobile md:text-display-lg font-bold">
              Công thức đã lưu
            </h1>
            <p className="font-body-md text-on-surface-variant mt-sm max-w-2xl leading-relaxed">
              Tổ chức các món ăn bạn quan tâm theo mục tiêu: chuẩn bị cho bữa tối, lên danh sách muốn thử nấu, hoặc lưu lại những món đã nấu thành công.
            </p>
          </div>
          <Link
            to="/search"
            className="px-md py-sm rounded-lg border border-primary text-primary font-label-md font-bold hover:bg-primary/5 transition-colors w-fit flex items-center gap-1.5 shadow-xs"
          >
            <span className="material-symbols-outlined text-[18px]">search</span>
            Khám phá thêm công thức
          </Link>
        </div>

        {/* Collection Filter Tabs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-md mb-xl">
          {COLLECTIONS.map((col) => {
            const isActive = activeCollection === col.key;
            const count = col.key === "all" ? counts.total : (counts[col.key] || 0);

            return (
              <button
                key={col.key}
                type="button"
                onClick={() => setActiveCollection(col.key)}
                className={`p-4 rounded-2xl border text-left transition-all relative overflow-hidden group ${
                  isActive
                    ? "bg-surface-container-lowest border-primary shadow-soft ring-2 ring-primary/20"
                    : "bg-surface-container-lowest border-outline-variant/15 hover:border-outline-variant/40 hover:bg-surface-bright"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    isActive ? "bg-primary text-on-primary shadow-xs" : "bg-surface-container text-on-surface-variant group-hover:bg-primary/10 group-hover:text-primary transition-colors"
                  }`}>
                    <span className="material-symbols-outlined text-[22px]">{col.icon}</span>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                    isActive ? "bg-primary text-on-primary" : "bg-surface-container text-on-surface-variant"
                  }`}>
                    {count}
                  </span>
                </div>
                <h3 className={`font-headline-sm text-base font-bold ${isActive ? "text-primary" : "text-on-surface"}`}>
                  {col.label}
                </h3>
                <p className="text-xs text-on-surface-variant mt-1 line-clamp-1">
                  {col.desc}
                </p>
              </button>
            );
          })}
        </div>

        {/* Section title & count */}
        <div className="flex items-center justify-between pb-sm mb-md border-b border-outline-variant/15">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[20px]">{currentTabInfo.icon}</span>
            <span className="font-bold text-base text-on-surface">
              {currentTabInfo.label} ({savedRecipes.length})
            </span>
          </div>
          <span className="text-xs text-on-surface-variant">
            {currentTabInfo.desc}
          </span>
        </div>

        {/* Recipe Grid or Empty State */}
        {loading ? (
          <div className="py-xl flex flex-col items-center text-on-surface-variant gap-sm">
            <span className="material-symbols-outlined text-4xl text-primary animate-spin">
              progress_activity
            </span>
            <span>Đang tải danh sách món ăn...</span>
          </div>
        ) : savedRecipes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter">
            {savedRecipes.map((recipe) => {
              const currentCol = recipe.collection_name || "want_to_try";
              const colConfig = COLLECTIONS.find((c) => c.key === currentCol) || COLLECTIONS[1];

              return (
                <div key={recipe.id} className="flex flex-col bg-surface-container-lowest rounded-2xl overflow-hidden border border-outline-variant/15 recipe-card-shadow transition-all group">
                  {/* Top Recipe Card */}
                  <div className="flex-grow">
                    <RecipeCard
                      recipe={recipe}
                      initiallySaved
                      onSavedChange={handleSavedChange}
                    />
                  </div>

                  {/* Collection Management Bar */}
                  <div className="px-4 py-3 bg-surface-container/30 border-t border-outline-variant/10 flex flex-col gap-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-on-surface-variant font-medium flex items-center gap-1">
                        <span className="material-symbols-outlined text-[15px]">{colConfig.icon}</span>
                        Thuộc:
                      </span>
                      <span className={`px-2 py-0.5 rounded-md border font-bold ${colConfig.badgeColor}`}>
                        {colConfig.label}
                      </span>
                    </div>

                    {/* Quick Move Collection Actions */}
                    <div className="flex items-center justify-between gap-1 pt-1 border-t border-outline-variant/10">
                      <div className="flex items-center gap-1 flex-wrap">
                        <span className="text-[11px] text-on-surface-variant/70">Chuyển sang:</span>
                        {currentCol !== "want_to_try" && (
                          <button
                            type="button"
                            disabled={movingRecipeId === recipe.id}
                            onClick={() => handleMoveCollection(recipe.id, "want_to_try")}
                            className="px-2 py-1 rounded bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-[11px] font-bold transition-all disabled:opacity-50"
                            title="Lưu vào Món muốn thử"
                          >
                            Muốn thử
                          </button>
                        )}
                        {currentCol !== "quick_dinner" && (
                          <button
                            type="button"
                            disabled={movingRecipeId === recipe.id}
                            onClick={() => handleMoveCollection(recipe.id, "quick_dinner")}
                            className="px-2 py-1 rounded bg-sky-50 hover:bg-sky-100 text-sky-900 border border-sky-200 text-[11px] font-bold transition-all disabled:opacity-50"
                            title="Lưu vào Bữa tối nhanh"
                          >
                            Tối nhanh
                          </button>
                        )}
                        {currentCol !== "cooked" && (
                          <button
                            type="button"
                            disabled={movingRecipeId === recipe.id}
                            onClick={() => handleMoveCollection(recipe.id, "cooked")}
                            className="px-2 py-1 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 text-[11px] font-bold transition-all disabled:opacity-50"
                            title="Đánh dấu là Đã nấu"
                          >
                            Đã nấu
                          </button>
                        )}
                      </div>

                      {/* Cooksnap action if in 'cooked' collection */}
                      {currentCol === "cooked" && (
                        <Link
                          to={`/recipe/${recipe.id}#cooksnaps`}
                          className="px-2.5 py-1 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] flex items-center gap-1 transition-all shadow-xs"
                          title="Đăng ảnh thành phẩm cho món này"
                        >
                          <span className="material-symbols-outlined text-[13px]">add_a_photo</span>
                          Đăng ảnh
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/15 text-center py-xl px-md shadow-sm max-w-lg mx-auto">
            <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-3">
              <span className="material-symbols-outlined text-3xl">
                {currentTabInfo.icon}
              </span>
            </div>
            <h2 className="font-headline-sm text-lg font-bold mb-1">
              Chưa có món nào trong &quot;{currentTabInfo.label}&quot;
            </h2>
            <p className="text-sm text-on-surface-variant mb-md max-w-sm mx-auto">
              {activeCollection === "cooked"
                ? "Bạn đã nấu thử món nào chưa? Hãy đánh dấu món đã nấu hoặc tải lên ảnh thành phẩm để lưu giữ kỷ niệm nấu nướng."
                : activeCollection === "quick_dinner"
                ? "Lưu các món có thời gian nấu dưới 30 phút vào đây để chuẩn bị bữa tối thật nhanh và tiện lợi."
                : "Bấm biểu tượng lưu trên bất kỳ công thức nào để gom món vào bộ sưu tập này."}
            </p>
            <Link
              to="/search"
              className="inline-flex bg-primary text-white rounded-full px-lg py-2.5 font-label-md font-bold text-sm shadow-sm hover:bg-primary/95 transition-all"
            >
              Tìm món ngon ngay
            </Link>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default SavedRecipesPage;
