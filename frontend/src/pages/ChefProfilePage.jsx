import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import Header from "../components/Header";
import Footer from "../components/Footer";
import RecipeCard from "../components/RecipeCard";
import { getImageUrl } from "../services/api";
import {
  getChefProfileApi,
  searchRecipesApi,
  getFollowersApi,
  getFollowingApi,
  checkFollowStatusApi,
  followUserApi,
  unfollowUserApi,
  getSavedRecipesApi
} from "../services/recipeApi";

const ChefProfilePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  const [activeTab, setActiveTab] = useState("my-recipes");
  const [chef, setChef] = useState(null);
  const [recipes, setRecipes] = useState([]);
  const [savedRecipes, setSavedRecipes] = useState([]);
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [isFollowed, setIsFollowed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadChefData = async () => {
      try {
        setIsLoading(true);
        // Load chef profile
        const chefData = await getChefProfileApi(id);
        setChef(chefData);

        // Load chef's recipes
        const chefRecipes = await searchRecipesApi({ author_id: id });
        setRecipes(chefRecipes);

        // Load followers and following lists
        const [followersData, followingData] = await Promise.all([
          getFollowersApi(id).catch(() => []),
          getFollowingApi(id).catch(() => [])
        ]);
        setFollowers(followersData || []);
        setFollowing(followingData || []);

        // Load follow status and saved recipes if user is logged in
        if (user) {
          checkFollowStatusApi(id)
            .then((status) => setIsFollowed(status.followed))
            .catch((err) => console.error("Error checking follow status:", err));

          getSavedRecipesApi(id)
            .then((saved) => setSavedRecipes(saved || []))
            .catch((err) => console.error("Error getting saved recipes:", err));
        }
      } catch (err) {
        console.error("Lỗi khi tải thông tin đầu bếp:", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadChefData();
  }, [id, user]);

  const handleFollowToggle = async () => {
    if (!user) {
      navigate("/login");
      return;
    }
    try {
      if (isFollowed) {
        await unfollowUserApi(id);
        setIsFollowed(false);
        setFollowers((prev) => prev.filter((f) => f.id !== user.id));
      } else {
        await followUserApi(id);
        setIsFollowed(true);
        const currentUserData = {
          id: user.id,
          username: user.username,
          full_name: user.fullName || user.full_name || user.username,
          avatar_url: user.avatarUrl || user.avatar_url
        };
        setFollowers((prev) => [...prev, currentUserData]);
      }
    } catch (err) {
      console.error("Lỗi khi thay đổi trạng thái theo dõi:", err);
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    alert("Đã sao chép liên kết trang cá nhân!");
  };

  const handleSavedRecipeChange = (isSaved, recipe) => {
    if (!isSaved) {
      setSavedRecipes((current) => current.filter((item) => item.id !== recipe.id));
    }
  };

  const featuredRecipe = recipes.length > 0 ? recipes[0] : null;
  const otherRecipes = recipes.length > 1 ? recipes.slice(1) : [];

  if (isLoading) {
    return (
      <div className="bg-surface text-on-surface font-body-md min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow flex items-center justify-center">
          <div className="text-center space-y-md">
            <span className="material-symbols-outlined text-4xl animate-spin text-primary">progress_activity</span>
            <p className="text-on-surface-variant">Đang tải thông tin đầu bếp...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!chef) {
    return (
      <div className="bg-surface text-on-surface font-body-md min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow flex items-center justify-center">
          <div className="text-center space-y-md">
            <span className="material-symbols-outlined text-4xl text-error">error</span>
            <p className="text-on-surface-variant">Không tìm thấy thông tin đầu bếp này.</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="bg-surface text-on-surface font-body-md min-h-screen flex flex-col">
      <Header />
      
      <main className="max-w-max-width mx-auto px-margin-mobile md:px-margin-desktop py-xl flex-grow w-full">
        {/* Profile Header Section */}
        <section className="flex flex-col md:flex-row gap-xl items-start md:items-center mb-xl">
          <div className="relative group select-none">
            <div className="w-32 h-32 md:w-48 md:h-48 rounded-full overflow-hidden bg-surface-container-high recipe-card-shadow border-4 border-surface-container-lowest">
              <img
                alt={chef.full_name || chef.fullName || chef.username}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                src={getImageUrl(chef.avatar_url || chef.avatarUrl) || "https://lh3.googleusercontent.com/aida-public/AB6AXuD-9Hwe5qem3ZS-yLRB1GD6mVl4fSuJOZdCBUiVv8-40gxVQdijcr6uO6RJ0xWyZ8GTmqaz4PaWprFCj5h9hv0mYEkHSxMu7jo6PC1VUJ1zJkXTyVwnh_qyYuJS3Sfq0BwwSc9dgpAHtorNNq9-fnmGMc3GQxafSBKQjgFbbUKl9V3CGidqEAqzbDCKqLOeTi3SqQ2ZvYzcbe1kFwhsZlum-JHI35jWQMlDYpMHU3Ak9_sVQyECCsT7HUfXhm0Lv6_pSAF3Vc7wmA"}
              />
            </div>
            {(chef.role === "admin" || chef.is_verified) && (
              <div className="absolute bottom-2 right-2 bg-primary text-on-primary w-8 h-8 rounded-full flex items-center justify-center border-2 border-surface shadow-sm">
                <span className="material-symbols-outlined text-[18px] font-bold">verified</span>
              </div>
            )}
          </div>
          
          <div className="flex-1 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 select-none">
              <div>
                <h2 className="font-display-lg text-display-lg-mobile md:text-display-lg text-on-background font-bold">
                  {chef.full_name || chef.fullName || chef.username}
                </h2>
                <p className="font-label-md text-label-md text-primary mt-1 font-bold">
                  {chef.role === "admin" ? "Quản trị viên & Chuyên gia ẩm thực" : "Thành viên cộng đồng"}
                </p>
              </div>
              <div className="flex gap-3">
                {(!user || parseInt(user.id) !== parseInt(chef.id)) && (
                  <button
                    onClick={handleFollowToggle}
                    className={`px-6 py-2 rounded-lg font-label-md font-bold transition-all active:scale-95 flex items-center gap-2 shadow-sm ${
                      isFollowed
                        ? "bg-primary-container/10 border border-primary text-primary"
                        : "bg-primary text-on-primary hover:bg-primary/90"
                    }`}
                  >
                    <span className="material-symbols-outlined text-sm font-bold">
                      {isFollowed ? "check" : "person_add"}
                    </span>
                    {isFollowed ? "Đang theo dõi" : "Theo dõi"}
                  </button>
                )}
                <button
                  onClick={handleShare}
                  className="border border-outline text-on-surface px-4 py-2 rounded-lg font-label-md hover:bg-surface-variant transition-all active:scale-95 shadow-sm"
                >
                  <span className="material-symbols-outlined text-sm">share</span>
                </button>
              </div>
            </div>
            
            <div className="flex gap-6 py-2 border-y border-outline-variant/20 select-none">
              <div className="text-center md:text-left">
                <span className="block font-bold text-headline-sm text-on-background">{recipes.length}</span>
                <span className="font-label-sm text-on-surface-variant uppercase tracking-wider">Công thức</span>
              </div>
              <div className="text-center md:text-left">
                <span className="block font-bold text-headline-sm text-on-background">{followers.length}</span>
                <span className="font-label-sm text-on-surface-variant uppercase tracking-wider">Người theo dõi</span>
              </div>
              <div className="text-center md:text-left">
                <span className="block font-bold text-headline-sm text-on-background">{following.length}</span>
                <span className="font-label-sm text-on-surface-variant uppercase tracking-wider">Đang theo dõi</span>
              </div>
            </div>
            
            <p className="font-body-md text-on-surface-variant max-w-2xl leading-relaxed">
              {chef.bio || "Thành viên đam mê ẩm thực của CulinShare. Đang trên hành trình chia sẻ và học hỏi những hương vị tuyệt vời."}
            </p>
          </div>
        </section>

        {/* Tabs Navigation */}
        <div className="border-b border-outline-variant/30 mb-8 sticky top-[80px] bg-surface z-30 flex overflow-x-auto scrollbar-hide select-none">
          <button
            onClick={() => setActiveTab("my-recipes")}
            className={`px-6 py-4 font-label-md font-bold whitespace-nowrap relative ${
              activeTab === "my-recipes" ? "text-primary active-tab-indicator active-dot" : "text-on-surface-variant hover:text-primary transition-colors"
            }`}
          >
            Công thức của tôi
          </button>
          <button
            onClick={() => setActiveTab("saved")}
            className={`px-6 py-4 font-label-md font-bold whitespace-nowrap relative ${
              activeTab === "saved" ? "text-primary active-tab-indicator active-dot" : "text-on-surface-variant hover:text-primary transition-colors"
            }`}
          >
            Đã lưu
          </button>
          <button
            onClick={() => setActiveTab("activity")}
            className={`px-6 py-4 font-label-md font-bold whitespace-nowrap relative ${
              activeTab === "activity" ? "text-primary active-tab-indicator active-dot" : "text-on-surface-variant hover:text-primary transition-colors"
            }`}
          >
            Hoạt động
          </button>
        </div>

        {/* Recipe / Content Panels */}
        {activeTab === "my-recipes" && (
          <div className="space-y-md animate-in fade-in duration-300">
            {featuredRecipe ? (
              <>
                {/* Bento Asymmetric Item / Featured Post */}
                <article
                  onClick={() => navigate(`/recipe/${featuredRecipe.id}`)}
                  className="bg-surface-container-lowest rounded-xl overflow-hidden recipe-card-shadow group cursor-pointer transition-all border border-outline-variant/10 shadow-sm md:col-span-2"
                >
                  <div className="flex flex-col md:flex-row h-full">
                    <div className="md:w-1/2 aspect-[4/3] md:aspect-auto overflow-hidden relative">
                      <img
                        alt={featuredRecipe.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        src={getImageUrl(featuredRecipe.cover_image_url || featuredRecipe.coverImageUrl) || "https://images.unsplash.com/photo-1596797038530-2c107229654b"}
                      />
                      {featuredRecipe.categories && featuredRecipe.categories.length > 0 && (
                        <div className="absolute top-4 left-4 bg-tertiary-fixed/90 backdrop-blur-sm text-on-tertiary-fixed-variant px-3 py-1 rounded-full font-label-sm shadow-sm select-none font-bold">
                          {featuredRecipe.categories[0]}
                        </div>
                      )}
                    </div>
                    <div className="p-md md:w-1/2 flex flex-col justify-center space-y-4">
                      <div className="space-y-2 select-none">
                        <span className="font-label-sm text-primary uppercase tracking-widest font-bold">Món mới cập nhật</span>
                        <h3 className="font-display-lg text-display-lg-mobile text-on-background group-hover:text-primary transition-colors font-bold">
                          {featuredRecipe.title}
                        </h3>
                      </div>
                      <p className="font-body-md text-on-surface-variant line-clamp-3 leading-relaxed">
                        {featuredRecipe.description || "Bấm để xem công thức chi tiết và hướng dẫn các bước thực hiện món ngon này."}
                      </p>
                      <div className="flex items-center gap-4 text-secondary text-sm font-label-sm select-none font-bold">
                        <div className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-[18px]">schedule</span>
                          {`${(featuredRecipe.prep_time_minutes || 0) + (featuredRecipe.cook_time_minutes || 0)} phút`}
                        </div>
                        {featuredRecipe.difficulty && (
                          <div className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-[18px]">signal_cellular_alt</span>
                            {featuredRecipe.difficulty}
                          </div>
                        )}
                      </div>
                      <button className="text-primary font-label-md font-bold flex items-center gap-1 group-hover:gap-2 transition-all">
                        Xem công thức chi tiết
                        <span className="material-symbols-outlined text-sm font-bold">arrow_forward</span>
                      </button>
                    </div>
                  </div>
                </article>

                {/* Standard Grid items */}
                {otherRecipes.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter pt-6">
                    {otherRecipes.map((recipe) => (
                      <RecipeCard key={recipe.id} recipe={recipe} />
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12 text-on-surface-variant">Đầu bếp chưa chia sẻ công thức nào.</div>
            )}
          </div>
        )}

        {activeTab === "saved" && (
          <div className="animate-in fade-in duration-300">
            {savedRecipes.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter">
                {savedRecipes.map((recipe) => (
                  <RecipeCard
                    key={recipe.id}
                    recipe={recipe}
                    initiallySaved
                    onSavedChange={handleSavedRecipeChange}
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-4 p-md bg-surface-container-lowest border border-outline-variant/10 rounded-xl shadow-sm text-center py-10 text-on-surface-variant select-none">
                <span className="material-symbols-outlined text-4xl mb-2 text-secondary">bookmark_border</span>
                <p className="font-body-md">Chưa có công thức nào được lưu.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === "activity" && (
          <div className="space-y-4 p-md bg-surface-container-lowest border border-outline-variant/10 rounded-xl shadow-sm text-center py-10 text-on-surface-variant animate-in fade-in duration-300 select-none">
            <span className="material-symbols-outlined text-4xl mb-2 text-secondary">history</span>
            <p className="font-body-md">Không có hoạt động nào gần đây để hiển thị.</p>
          </div>
        )}
      </main>
      
      <Footer />
    </div>
  );
};

export default ChefProfilePage;
