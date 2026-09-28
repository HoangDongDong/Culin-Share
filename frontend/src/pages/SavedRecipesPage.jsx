import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import RecipeCard from "../components/RecipeCard";
import { getSavedRecipesApi } from "../services/recipeApi";

const SavedRecipesPage = () => {
  const navigate = useNavigate();
  const [savedRecipes, setSavedRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem("accessToken") || localStorage.getItem("token") || localStorage.getItem("authToken");

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    const loadSavedRecipes = async () => {
      try {
        setLoading(true);
        const recipes = await getSavedRecipesApi();
        setSavedRecipes(recipes || []);
      } catch (error) {
        alert(error.message || "Không thể tải danh sách công thức đã lưu");
      } finally {
        setLoading(false);
      }
    };

    loadSavedRecipes();
  }, [navigate, token]);

  const handleSavedChange = (isSaved, recipe) => {
    if (!isSaved) {
      setSavedRecipes((current) => current.filter((item) => item.id !== recipe.id));
    }
  };

  return (
    <div className="bg-surface text-on-surface font-body-md min-h-screen flex flex-col">
      <Header />
      <main className="max-w-max-width mx-auto px-margin-mobile md:px-margin-desktop py-xl flex-grow w-full">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-md mb-lg">
          <div>
            <p className="font-label-md text-primary uppercase tracking-wider font-bold mb-xs">
              Bộ sưu tập của bạn
            </p>
            <h1 className="font-display-lg text-display-lg-mobile md:text-display-lg font-bold">
              Công thức yêu thích
            </h1>
            <p className="font-body-md text-on-surface-variant mt-sm">
              Các bài viết bạn đã lưu để nấu lại khi cần.
            </p>
          </div>
          <Link
            to="/search"
            className="px-md py-sm rounded-lg border border-primary text-primary font-label-md font-bold hover:bg-primary/5 transition-colors w-fit"
          >
            Khám phá thêm công thức
          </Link>
        </div>

        {loading ? (
          <div className="py-xl flex flex-col items-center text-on-surface-variant gap-sm">
            <span className="material-symbols-outlined text-4xl text-primary animate-spin">
              progress_activity
            </span>
            <span>Đang tải công thức đã lưu...</span>
          </div>
        ) : savedRecipes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter">
            {savedRecipes.map((recipe) => (
              <RecipeCard
                key={recipe.id}
                recipe={recipe}
                initiallySaved
                onSavedChange={handleSavedChange}
              />
            ))}
          </div>
        ) : (
          <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/10 text-center py-xl px-md shadow-sm">
            <span className="material-symbols-outlined text-5xl text-secondary mb-sm">
              favorite_border
            </span>
            <h2 className="font-headline-sm text-headline-sm font-bold mb-xs">
              Chưa có công thức yêu thích
            </h2>
            <p className="text-on-surface-variant mb-md">
              Nhấn biểu tượng trái tim trên công thức để lưu bài viết tại đây.
            </p>
            <Link
              to="/search"
              className="inline-flex bg-primary text-white rounded-full px-lg py-sm font-label-md font-bold"
            >
              Tìm công thức
            </Link>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default SavedRecipesPage;
