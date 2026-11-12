import { recipePath } from "../services/seo.mjs";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { getRecipesRankingApi, getChefsRankingApi } from "../services/recipeApi";
import { getImageUrl } from "../services/api";

const TopChefsPage = () => {
  const [recipeRankings, setRecipeRankings] = useState({});
  const [chefs, setChefs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadErrors, setLoadErrors] = useState({});
  const [activeTab, setActiveTab] = useState("recipes"); // "recipes" (Công thức) or "chefs" (Đầu bếp)
  const [recipeCriterion, setRecipeCriterion] = useState("mostSaved");
  const [chefCriterion, setChefCriterion] = useState("followers_count");
  const isRecipeTab = activeTab === "recipes";

  useEffect(() => {
    const fetchRanking = async () => {
      const [recipesResult, chefsResult] = await Promise.allSettled([
        getRecipesRankingApi(),
        getChefsRankingApi(),
      ]);
      setRecipeRankings(recipesResult.value || {});
      setChefs(chefsResult.value || []);
      setLoadErrors({
        recipes: recipesResult.status === "rejected",
        chefs: chefsResult.status === "rejected",
      });
      setIsLoading(false);
    };
    fetchRanking();
  }, []);

  // Xác định dữ liệu hoạt động dựa trên Tab được chọn
  const activeItems = isRecipeTab
    ? recipeRankings[recipeCriterion] || []
    : [...chefs].sort((a, b) => b[chefCriterion] - a[chefCriterion] || a.id - b.id);

  // Chia làm Top 3 (Vinh danh Podium) và danh sách còn lại
  const top3 = activeItems.slice(0, 3);
  
  // Sắp xếp lại thứ tự Top 3 để vẽ Podium đẹp: [Hạng 2, Hạng 1, Hạng 3]
  const podiumItems = [];
  if (top3[1]) podiumItems.push({ ...top3[1], rank: 2 });
  if (top3[0]) podiumItems.push({ ...top3[0], rank: 1 });
  if (top3[2]) podiumItems.push({ ...top3[2], rank: 3 });

  const remainingItems = activeItems.slice(3);

  // Hàm render số sao đánh giá (cho công thức)
  const renderStars = (rating) => {
    const stars = [];
    const floorRating = Math.floor(rating);
    for (let i = 1; i <= 5; i++) {
      if (i <= floorRating) {
        stars.push(<span key={i} className="text-amber-500 text-sm">★</span>);
      } else if (i - 0.5 <= rating) {
        stars.push(<span key={i} className="text-amber-500 text-sm">½</span>);
      } else {
        stars.push(<span key={i} className="text-outline-variant text-sm">☆</span>);
      }
    }
    return <div className="flex justify-center items-center gap-0.5">{stars}</div>;
  };

  return (
    <div className="bg-surface text-on-surface font-body-md min-h-screen flex flex-col">
      <Header />

      <main className="w-full px-6 sm:px-10 md:px-14 lg:px-20 xl:px-24 py-xl flex-grow">
        {/* Page Title Section */}
        <section className="text-center max-w-2xl mx-auto mb-xl">
          <span className="text-primary font-bold text-xs uppercase tracking-widest bg-primary/10 px-3 py-1 rounded-full">Bảng Vàng Danh Vọng</span>
          <h1 className="font-display-lg text-display-lg-mobile md:text-display-lg text-on-background font-bold mt-3 leading-tight">
            Bảng Xếp Hạng CulinShare
          </h1>
          <p className="text-on-surface-variant font-body-md mt-4 leading-relaxed">
            Nơi tôn vinh những công thức nấu ăn được yêu thích nhất và những đầu bếp tài hoa có sức ảnh hưởng lớn nhất trong cộng đồng.
          </p>
        </section>

        {/* Tab Switcher - Styled premiumly with sliding capsule look */}
        <div className="flex justify-center mb-4">
          <div className="bg-surface-container-low p-1.5 rounded-full border border-outline-variant/30 flex gap-2 shadow-inner select-none">
            <button
              onClick={() => setActiveTab("recipes")}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-full font-label-md font-bold transition-all duration-300 ${
                activeTab === "recipes"
                  ? "bg-primary text-on-primary shadow-md transform scale-105"
                  : "text-secondary hover:text-primary"
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">restaurant_menu</span>
              Công thức
            </button>
            <button
              onClick={() => setActiveTab("chefs")}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-full font-label-md font-bold transition-all duration-300 ${
                activeTab === "chefs"
                  ? "bg-primary text-on-primary shadow-md transform scale-105"
                  : "text-secondary hover:text-primary"
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">person_check</span>
              Đầu bếp nổi bật
            </button>
          </div>
        </div>

        <label className="flex flex-wrap items-center justify-center gap-2 mb-10 text-sm font-bold">
          Xếp hạng theo
          <select
            className="min-h-11 rounded-xl border border-outline-variant bg-surface-container-lowest px-3 text-on-surface"
            value={isRecipeTab ? recipeCriterion : chefCriterion}
            onChange={(event) => (isRecipeTab ? setRecipeCriterion : setChefCriterion)(event.target.value)}
          >
            {isRecipeTab ? (
              <>
                <option value="mostSaved">Lượt yêu thích</option>
                <option value="mostReviewed">Lượt đánh giá</option>
              </>
            ) : (
              <>
                <option value="likes_count">Lượt yêu thích</option>
                <option value="followers_count">Lượt theo dõi</option>
              </>
            )}
          </select>
        </label>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <span className="material-symbols-outlined text-4xl animate-spin text-primary">progress_activity</span>
            <p className="text-on-surface-variant font-bold">Đang tải bảng xếp hạng...</p>
          </div>
        ) : loadErrors[activeTab] ? (
          <p role="alert" className="text-center py-16 text-on-surface-variant">
            Không tải được bảng xếp hạng. Vui lòng tải lại trang.
          </p>
        ) : activeItems.length === 0 ? (
          <div className="text-center py-16 bg-surface-container-lowest rounded-3xl border border-outline-variant/20 shadow-sm">
            <span className="material-symbols-outlined text-5xl text-on-surface-variant/40">workspace_premium</span>
            <p className="text-on-surface-variant font-bold mt-4">Chưa có dữ liệu bảng xếp hạng.</p>
          </div>
        ) : (
          <>
            {/* 🏆 Section 1: Top 3 Podium (Bục vinh danh) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-end max-w-5xl mx-auto mb-16 select-none">
              {podiumItems.map((item) => {
                const isRank1 = item.rank === 1;
                const isRank2 = item.rank === 2;
                const medalBg = isRank1 ? "bg-amber-400" : isRank2 ? "bg-slate-300" : "bg-amber-600";
                const medalIcon = isRank1 ? "🏆" : isRank2 ? "🥈" : "🥉";
                
                return (
                  <div
                    key={item.id}
                    className={`flex flex-col items-center relative transition-all duration-500 hover:-translate-y-2 ${
                      isRank1 ? "order-1 md:order-2 md:mb-6" : isRank2 ? "order-2 md:order-1" : "order-3"
                    }`}
                  >
                    {/* Podium Card */}
                    <div 
                      className={`w-full bg-surface-container-lowest border rounded-3xl p-5 text-center shadow-md flex flex-col items-center ${
                        isRank1 
                          ? "border-amber-400/50 shadow-amber-400/10 ring-2 ring-amber-400/20" 
                          : "border-outline-variant/30"
                      }`}
                    >
                      {/* Rank Tag */}
                      <div className={`absolute -top-4 w-10 h-10 ${medalBg} text-white rounded-full flex items-center justify-center font-bold text-lg shadow-md border-2 border-white z-10`}>
                        {item.rank}
                      </div>

                      {/* Display for RECIPES */}
                      {activeTab === "recipes" ? (
                        <>
                          {/* Recipe Cover Image */}
                          <Link to={recipePath(item)} className="relative mt-2 block w-full aspect-video rounded-2xl overflow-hidden border border-outline-variant/35 shadow-inner">
                            <img
                              alt={item.title}
                              src={getImageUrl(item.cover_image_url) || "https://images.unsplash.com/photo-1596797038530-2c107229654b"}
                              className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                            />
                            <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded-full backdrop-blur-sm">
                              {medalIcon}
                            </div>
                          </Link>

                          {/* Recipe Title */}
                          <Link to={recipePath(item)} className="mt-4 block hover:text-primary transition-colors w-full">
                            <h3 className="font-headline-sm text-headline-sm font-bold truncate px-1">
                              {item.title}
                            </h3>
                          </Link>
                          
                          <p className="text-xs text-on-surface-variant font-medium mt-1">
                            Tác giả: <span className="font-bold text-on-surface">{item.author_name || "Thành viên"}</span>
                          </p>

                          <div className="flex gap-2 items-center justify-center mt-2.5 text-xs text-on-surface-variant font-semibold select-none bg-surface-container-low px-3 py-1 rounded-full">
                            <span className="capitalize">{item.difficulty}</span>
                            <span>•</span>
                            <span>{item.prep_time_minutes + item.cook_time_minutes} phút</span>
                          </div>

                          {/* Stats Grid */}
                          <div className="grid grid-cols-3 gap-2 w-full mt-5 pt-4 border-t border-outline-variant/20 text-center">
                            <div>
                              <span className="block font-bold text-sm text-on-background">{item.likes_count}</span>
                              <span className="text-[10px] text-on-surface-variant uppercase tracking-wider">Yêu thích</span>
                            </div>
                            <div>
                              <div className="flex justify-center items-center gap-0.5 min-h-[20px]">
                                {renderStars(Number(item.avg_rating))}
                              </div>
                              <span className="text-[10px] text-on-surface-variant uppercase tracking-wider">Điểm trung bình</span>
                            </div>
                            <div>
                              <span className="block font-bold text-sm text-on-background">{item.reviews_count}</span>
                              <span className="text-[10px] text-on-surface-variant uppercase tracking-wider">Lượt đánh giá</span>
                            </div>
                          </div>
                        </>
                      ) : (
                        /* Display for CHEFS */
                        <>
                          {/* Chef Avatar (Circular) */}
                          <Link to={`/chef/${item.id}`} className="relative mt-2 block">
                            <div className={`w-24 h-24 rounded-full overflow-hidden border-4 ${isRank1 ? "border-amber-400" : "border-outline-variant"} shadow-inner`}>
                              <img
                                alt={item.full_name || item.username}
                                src={getImageUrl(item.avatar_url) || "https://images.unsplash.com/photo-1577219491135-ce391730fb2c"}
                                className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                              />
                            </div>
                            <div className="absolute -bottom-1 -right-1 bg-white text-md px-1.5 py-0.5 rounded-full shadow-sm border border-outline-variant z-10">
                              {medalIcon}
                            </div>
                          </Link>

                          {/* Chef Name */}
                          <Link to={`/chef/${item.id}`} className="mt-4 block hover:text-primary transition-colors">
                            <h3 className="font-headline-sm text-headline-sm font-bold truncate max-w-[200px] px-1">
                              {item.full_name || item.username}
                            </h3>
                          </Link>
                          
                          <p className="text-xs text-on-surface-variant font-medium mt-1 uppercase tracking-wider">
                            {item.role === 'admin' ? 'Chuyên Gia Ẩm Thực' : 'Đầu Bếp Thành Viên'}
                          </p>

                          {/* Chef Bio */}
                          <p className="text-on-surface-variant text-xs mt-3 line-clamp-2 min-h-[32px] px-2 leading-relaxed">
                            {item.bio || "Thành viên đam mê ẩm thực Việt."}
                          </p>

                          {/* Stats Grid */}
                          <div className="grid grid-cols-3 gap-2 w-full mt-5 pt-4 border-t border-outline-variant/20 text-center">
                            <div>
                              <span className="block font-bold text-sm text-on-background">{item.recipes_count}</span>
                              <span className="text-[10px] text-on-surface-variant uppercase tracking-wider">Công thức</span>
                            </div>
                            <div>
                              <span className="block font-bold text-sm text-on-background">{item.likes_count}</span>
                              <span className="text-[10px] text-on-surface-variant uppercase tracking-wider">Yêu thích</span>
                            </div>
                            <div>
                              <span className="block font-bold text-sm text-on-background">{item.followers_count}</span>
                              <span className="text-[10px] text-on-surface-variant uppercase tracking-wider">Theo dõi</span>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 📋 Section 2: Remaining Items List (Thẻ hàng dọc) */}
            {remainingItems.length > 0 && (
              <div className="max-w-5xl mx-auto">
                <h2 className="font-headline-md text-headline-md font-bold mb-6 text-on-background pl-2 border-l-4 border-primary select-none">
                  Vị Trí Tiếp Theo
                </h2>
                <div className="space-y-4">
                  {remainingItems.map((item, idx) => {
                    const rank = idx + 4;
                    return (
                      <div
                        key={item.id}
                        className="mobile-ranking-row bg-surface-container-lowest border border-outline-variant/20 rounded-2xl p-4 flex items-center justify-between shadow-sm hover:shadow-md transition-all duration-300 hover:border-outline"
                      >
                        {activeTab === "recipes" ? (
                          /* List Row for RECIPES */
                          <>
                            {/* Left Info: Rank, Cover, Title */}
                            <div className="flex items-center gap-4 flex-grow max-w-xl">
                              <span className="w-8 text-center font-bold text-on-surface-variant text-lg select-none">
                                #{rank}
                              </span>
                              <img
                                alt={item.title}
                                src={getImageUrl(item.cover_image_url) || "https://images.unsplash.com/photo-1596797038530-2c107229654b"}
                                className="w-16 h-16 rounded-xl object-cover border border-outline-variant/20 flex-shrink-0"
                              />
                              <div className="truncate">
                                <Link to={recipePath(item)} className="font-bold text-on-surface hover:text-primary transition-colors text-body-lg block truncate">
                                  {item.title}
                                </Link>
                                <span className="text-xs text-on-surface-variant block mt-0.5">
                                  Tác giả: <span className="font-bold text-secondary">{item.author_name}</span> | Độ khó: <span className="capitalize">{item.difficulty}</span>
                                </span>
                              </div>
                            </div>

                            {/* Mid Info: Stats */}
                            <div className="flex items-center gap-4 lg:gap-8 text-center select-none sm:mr-4">
                              <div>
                                <span className="block font-bold text-sm text-on-background">{item.likes_count}</span>
                                <span className="text-[10px] text-on-surface-variant uppercase tracking-wider">Yêu thích</span>
                              </div>
                              <div>
                                <div className="min-h-[20px] flex items-center justify-center">
                                  {renderStars(Number(item.avg_rating))}
                                </div>
                                <span className="text-[10px] text-on-surface-variant uppercase tracking-wider">Điểm trung bình</span>
                              </div>
                              <div>
                                <span className="block font-bold text-sm text-on-background">{item.reviews_count}</span>
                                <span className="text-[10px] text-on-surface-variant uppercase tracking-wider">Lượt đánh giá</span>
                              </div>
                            </div>

                            {/* Right Info: Action Button */}
                            <Link
                              to={recipePath(item)}
                              className="px-4 py-2 bg-outline-variant/10 hover:bg-primary hover:text-on-primary text-on-surface-variant font-label-md font-bold text-sm rounded-xl transition-all active:scale-95 flex-shrink-0"
                            >
                              Xem công thức
                            </Link>
                          </>
                        ) : (
                          /* List Row for CHEFS */
                          <>
                            {/* Left Info: Rank, Avatar, Name */}
                            <div className="flex items-center gap-4 flex-grow max-w-xl">
                              <span className="w-8 text-center font-bold text-on-surface-variant text-lg select-none">
                                #{rank}
                              </span>
                              <img
                                alt={item.full_name || item.username}
                                src={getImageUrl(item.avatar_url) || "https://images.unsplash.com/photo-1577219491135-ce391730fb2c"}
                                className="w-16 h-16 rounded-full object-cover border border-outline-variant/20 flex-shrink-0"
                              />
                              <div className="truncate">
                                <Link to={`/chef/${item.id}`} className="font-bold text-on-surface hover:text-primary transition-colors text-body-lg block truncate">
                                  {item.full_name || item.username}
                                </Link>
                                <span className="text-xs text-on-surface-variant block mt-0.5">
                                  {item.role === 'admin' ? 'Chuyên Gia Ẩm Thực' : 'Đầu Bếp Thành Viên'} | Số công thức: <span className="font-bold text-secondary">{item.recipes_count}</span>
                                </span>
                              </div>
                            </div>

                            {/* Mid Info: Stats */}
                            <div className="flex items-center gap-4 lg:gap-8 text-center select-none sm:mr-4">
                              <div>
                                <span className="block font-bold text-sm text-on-background">{item.likes_count}</span>
                                <span className="text-[10px] text-on-surface-variant uppercase tracking-wider">Yêu thích</span>
                              </div>
                              <div>
                                <span className="block font-bold text-sm text-on-background">{item.followers_count}</span>
                                <span className="text-[10px] text-on-surface-variant uppercase tracking-wider">Theo dõi</span>
                              </div>
                            </div>

                            {/* Right Info: Action Button */}
                            <Link
                              to={`/chef/${item.id}`}
                              className="px-4 py-2 bg-outline-variant/10 hover:bg-primary hover:text-on-primary text-on-surface-variant font-label-md font-bold text-sm rounded-xl transition-all active:scale-95 flex-shrink-0"
                            >
                              Xem hồ sơ
                            </Link>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default TopChefsPage;
