import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useSelector } from "react-redux";
import Header from "../components/Header";
import Footer from "../components/Footer";
import DeleteConfirmModal from "../components/DeleteConfirmModal";
import DeleteSuccessModal from "../components/DeleteSuccessModal";
import { getImageUrl } from "../services/api";
import {
  getRecipeByIdApi,
  submitReviewApi,
  submitCommentApi,
  saveRecipeApi,
  unsaveRecipeApi,
  checkSavedStatusApi,
  followUserApi,
  unfollowUserApi,
  checkFollowStatusApi,
  deleteRecipeApi,
  deleteCommentApi
} from "../services/recipeApi";

const RecipeDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checkedIngredients, setCheckedIngredients] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [parentId, setParentId] = useState(null);
  const [isFollowed, setIsFollowed] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [userRating, setUserRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const { user } = useSelector((state) => state.auth);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleteSuccessOpen, setIsDeleteSuccessOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const userHasHealthStats = user?.height && user?.weight;
  
  const userTdee = (() => {
    if (!userHasHealthStats) return null;
    const weightVal = parseFloat(user.weight);
    const heightVal = parseFloat(user.height);
    const ageVal = parseInt(user.age) || 25; 
    const genderVal = user.gender || "male";
    const bmr = (10 * weightVal) + (6.25 * heightVal) - (5 * ageVal) + (genderVal === 'female' ? -161 : 5);
    const multipliers = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      active: 1.725,
      very_active: 1.9
    };
    const activityLevel = user.activity_level || user.activityLevel || "sedentary";
    const mult = multipliers[activityLevel] || 1.2;
    return Math.round(bmr * mult);
  })();

  const caloriePercentage = (recipe?.calories && userTdee) 
    ? Math.round((recipe.calories / userTdee) * 100) 
    : 0;

  const token = localStorage.getItem("token");

  const handleDeleteRecipe = async () => {
    try {
      setIsDeleting(true);
      await deleteRecipeApi(id);
      setIsDeleteModalOpen(false);
      setIsDeleteSuccessOpen(true);
    } catch (err) {
      alert(err.message || "Lỗi khi xóa công thức");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteSuccessClose = () => {
    setIsDeleteSuccessOpen(false);
    navigate("/");
  };

  const fetchRecipeDetails = async () => {
    try {
      setLoading(true);
      const data = await getRecipeByIdApi(id);
      setRecipe(data);

      if (token) {
        const savedRes = await checkSavedStatusApi(id);
        setIsSaved(savedRes.saved);

        if (data.author_id) {
          const followRes = await checkFollowStatusApi(data.author_id);
          setIsFollowed(followRes.followed);
        }
      }
    } catch (err) {
      console.error("Lỗi khi tải chi tiết công thức:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token || token === "null" || token === "undefined") {
      setShowAuthModal(true);
      setLoading(false);
      return;
    }
    fetchRecipeDetails();
  }, [id, token]);

  const handleIngredientToggle = (idx) => {
    setCheckedIngredients((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
    );
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!token) {
      alert("Vui lòng đăng nhập để bình luận!");
      navigate("/login");
      return;
    }
    if (!commentText.trim()) return;

    try {
      await submitCommentApi(id, commentText.trim(), parentId);
      setCommentText("");
      setParentId(null);
      // Reload comments
      const updatedData = await getRecipeByIdApi(id);
      setRecipe(updatedData);
    } catch (err) {
      alert(err.message || "Không thể gửi bình luận");
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa bình luận này không?")) return;
    try {
      await deleteCommentApi(commentId);
      // Reload comments
      const updatedData = await getRecipeByIdApi(id);
      setRecipe(updatedData);
    } catch (err) {
      alert(err.message || "Không thể xóa bình luận");
    }
  };

  const handleFollowToggle = async () => {
    if (!token) {
      alert("Vui lòng đăng nhập để theo dõi đầu bếp!");
      navigate("/login");
      return;
    }
    try {
      if (isFollowed) {
        await unfollowUserApi(recipe.author_id);
        setIsFollowed(false);
      } else {
        await followUserApi(recipe.author_id);
        setIsFollowed(true);
      }
    } catch (err) {
      alert(err.message || "Không thể thực hiện tác vụ");
    }
  };

  const handleSaveToggle = async () => {
    if (!token || token === "null" || token === "undefined") {
      alert("Vui lòng đăng nhập để lưu công thức!");
      navigate("/login");
      return;
    }
    try {
      if (isSaved) {
        await unsaveRecipeApi(id);
        setIsSaved(false);
      } else {
        await saveRecipeApi(id);
        setIsSaved(true);
      }
    } catch (err) {
      alert(err.message || "Không thể thực hiện tác vụ");
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!token) {
      alert("Vui lòng đăng nhập để đánh giá món ăn!");
      navigate("/login");
      return;
    }
    try {
      setSubmittingReview(true);
      await submitReviewApi(id, userRating, reviewComment);
      alert("Đăng đánh giá thành công!");
      setReviewComment("");
      // Reload details to get new average rating
      const updatedData = await getRecipeByIdApi(id);
      setRecipe(updatedData);
    } catch (err) {
      alert(err.message || "Không thể gửi đánh giá");
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-surface text-on-surface font-body-md min-h-screen flex flex-col">
        <Header />
        <div className="flex-grow flex flex-col items-center justify-center py-20">
          <span className="material-symbols-outlined text-5xl text-primary animate-spin">progress_activity</span>
          <p className="mt-4 text-on-surface-variant">Đang tải chi tiết công thức...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (showAuthModal) {
    return (
      <div className="bg-surface text-on-surface font-body-md min-h-screen flex flex-col">
        <Header />
        
        {/* Modal Backdrop blur */}
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          {/* Modal Container */}
          <div 
            className="bg-white border border-outline-variant/10 rounded-2xl p-6 md:p-8 max-w-md w-full text-center shadow-2xl"
            style={{
              animation: 'fadeSlideIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
            }}
          >
            {/* Lock Icon */}
            <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-5">
              <span className="material-symbols-outlined text-3xl font-bold">lock</span>
            </div>
            
            {/* Content */}
            <h2 className="text-2xl font-bold text-on-surface mb-3">Yêu cầu Đăng nhập</h2>
            <p className="text-sm text-on-surface-variant leading-relaxed mb-6">
              Bạn cần đăng nhập tài khoản CulinShare để có thể khám phá đầy đủ nguyên liệu, định lượng và xem các bước hướng dẫn nấu ăn chi tiết của công thức này.
            </p>
            
            {/* Buttons */}
            <div className="flex flex-col gap-3">
              <button
                onClick={() => navigate("/login")}
                className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3 rounded-full transition-all active:scale-95 shadow-md flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-sm font-bold">login</span>
                Đăng nhập ngay
              </button>
              
              <button
                onClick={() => navigate("/")}
                className="w-full bg-transparent hover:bg-surface-container-low text-secondary font-semibold py-2.5 rounded-full transition-all active:scale-95 border border-outline-variant/30"
              >
                Quay lại trang chủ
              </button>
            </div>
          </div>
        </div>

        {/* CSS Keyframes inline */}
        <style>{`
          @keyframes fadeSlideIn {
            from {
              opacity: 0;
              transform: translateY(-20px) scale(0.95);
            }
            to {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
          }
        `}</style>
        
        <Footer />
      </div>
    );
  }

  if (!recipe) {
    return (
      <div className="bg-surface text-on-surface font-body-md min-h-screen flex flex-col">
        <Header />
        <div className="flex-grow flex flex-col items-center justify-center py-20">
          <span className="material-symbols-outlined text-5xl text-primary-fixed">sentiment_dissatisfied</span>
          <h2 className="text-2xl font-bold mt-4">Không tìm thấy công thức</h2>
          <Link to="/search" className="mt-4 text-primary font-bold hover:underline">Quay lại tìm kiếm</Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="bg-surface text-on-surface font-body-md min-h-screen flex flex-col">
      <Header />

      <main className="max-w-max-width mx-auto px-margin-mobile md:px-margin-desktop py-base flex-grow w-full">
        {/* Banner Section */}
        <section className="relative w-full mb-lg overflow-hidden rounded-xl select-none shadow-sm">
          <div className="aspect-[16/9] md:aspect-[21/9] w-full relative">
            <img
              alt={recipe.title}
              className="w-full h-full object-cover"
              src={getImageUrl(recipe.cover_image_url || recipe.coverImageUrl) || "https://images.unsplash.com/photo-1596797038530-2c107229654b"}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex flex-col justify-end p-md md:p-lg">
              <div className="bg-tertiary-container/30 backdrop-blur-md inline-block px-3 py-1 rounded-full mb-4 w-fit select-none">
                <span className="text-tertiary-fixed font-label-md uppercase tracking-wider font-bold">
                  {recipe.categories?.[0]?.name || recipe.categories?.[0] || "CulinShare"}
                </span>
              </div>
              <h1 className="text-white font-display-lg text-display-lg-mobile md:text-display-lg mb-2 font-bold">{recipe.title}</h1>
              {user && (user.id === recipe.author_id || user.role === "admin") && (
                <div className="flex gap-3 mt-4 mb-2 select-none">
                  <button
                    onClick={() => navigate(`/edit-recipe/${recipe.id}`)}
                    className="flex items-center gap-2 px-4 py-2 bg-surface-container-low/20 backdrop-blur-md text-white border border-white/30 rounded-full font-label-md hover:bg-white/20 transition-all active:scale-95 cursor-pointer font-bold"
                  >
                    <span className="material-symbols-outlined text-[20px]">edit</span>
                    Chỉnh sửa
                  </button>
                  <button
                    onClick={() => setIsDeleteModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-error/80 backdrop-blur-md text-white border border-error/30 rounded-full font-label-md hover:bg-error transition-all active:scale-95 cursor-pointer font-bold"
                  >
                    <span className="material-symbols-outlined text-[20px]">delete</span>
                    Xóa bài
                  </button>
                </div>
              )}
              <p className="text-white/90 font-body-lg max-w-2xl">{recipe.description}</p>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-lg items-start">
          {/* Left Column: Ingredients and Instructions */}
          <div className="md:col-span-8 space-y-xl">
            {/* Ingredients Section */}
            <section className="select-none">
              <div className="flex items-center gap-3 mb-md">
                <span className="material-symbols-outlined text-primary text-2xl font-bold">restaurant_menu</span>
                <h2 className="font-headline-md text-headline-md font-bold">Nguyên liệu</h2>
              </div>
              <div className="bg-surface-container-lowest p-md md:p-lg rounded-xl recipe-shadow border border-outline-variant/10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-gutter">
                  {recipe.ingredients && recipe.ingredients.map((ing, idx) => {
                    const isChecked = checkedIngredients.includes(idx);
                    const displayName = `${ing.quantity || ""} ${ing.unit || ""} ${ing.name}`.trim();
                    return (
                      <label key={ing.id || idx} className="flex items-center gap-3 cursor-pointer group">
                        <input
                          type="checkbox"
                          className="hidden"
                          checked={isChecked}
                          onChange={() => handleIngredientToggle(idx)}
                        />
                        <span className={`w-5 h-5 border-2 rounded transition-colors flex items-center justify-center ${
                          isChecked ? "bg-primary border-primary" : "border-outline-variant group-hover:border-primary"
                        }`}>
                          <span className={`material-symbols-outlined text-[14px] text-white transition-opacity font-bold ${
                            isChecked ? "opacity-100" : "opacity-0"
                          }`}>
                            check
                          </span>
                        </span>
                        <span className={`font-body-md transition-all ${
                          isChecked ? "line-through opacity-50 text-on-surface-variant" : "text-on-surface"
                        }`}>
                          {displayName}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </section>

            {/* Instructions Section */}
            <section className="select-none">
              <div className="flex items-center gap-3 mb-md">
                <span className="material-symbols-outlined text-primary text-2xl font-bold">cooking</span>
                <h2 className="font-headline-md text-headline-md font-bold">Cách chế biến</h2>
              </div>
              <div className="space-y-md">
                {recipe.steps && recipe.steps.map((step, idx) => (
                  <div key={step.id || idx} className={`flex flex-col md:flex-row gap-6 p-4 rounded-xl hover:bg-surface-container transition-all border-l-4 ${idx === 0 ? "border-primary bg-surface-container-low" : "border-outline-variant bg-surface-container-lowest"}`}>
                    <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center font-display-lg text-headline-sm font-bold shadow-sm ${idx === 0 ? "bg-primary text-white" : "bg-surface-container-highest text-secondary border border-outline-variant/20"}`}>
                      {step.step_number || (idx + 1)}
                    </div>
                    <div className="flex-grow">
                      <h3 className="font-label-md text-primary mb-2 uppercase font-bold">Bước {step.step_number || (idx + 1)}</h3>
                      <p className="text-on-surface mb-4 leading-relaxed">{step.instruction}</p>
                      {step.image_url && (
                        <img
                          className="w-48 h-32 object-cover rounded-lg shadow-sm border border-outline-variant/20"
                          src={getImageUrl(step.image_url)}
                          alt={`Bước ${step.step_number || (idx + 1)}`}
                        />
                      )}
                      {step.timer_seconds > 0 && (
                        <div className="mt-3 flex items-center gap-2 text-xs text-primary font-bold">
                          <span className="material-symbols-outlined text-sm">alarm</span>
                          Hẹn giờ: {Math.floor(step.timer_seconds / 60)} phút {step.timer_seconds % 60} giây
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Review and Rating Section */}
            <section>
              <div className="flex items-center gap-3 mb-md select-none">
                <span className="material-symbols-outlined text-primary text-2xl font-bold">star</span>
                <h2 className="font-headline-md text-headline-md font-bold">Đánh giá & Nhận xét</h2>
              </div>
              <div className="bg-surface-container-lowest p-md rounded-xl recipe-shadow border border-outline-variant/10 mb-md">
                <h3 className="font-label-md text-primary mb-3 uppercase font-bold">Gửi đánh giá của bạn</h3>
                <div className="flex items-center gap-xs mb-md">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setUserRating(star)}
                      className="material-symbols-outlined text-yellow-500 text-3xl focus:outline-none"
                      style={{ fontVariationSettings: userRating >= star ? "'FILL' 1" : "'FILL' 0" }}
                    >
                      star
                    </button>
                  ))}
                </div>
                <form onSubmit={handleReviewSubmit} className="flex gap-4">
                  <input
                    type="text"
                    placeholder="Chia sẻ nhận xét của bạn về công thức..."
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    className="flex-grow bg-surface border border-outline-variant/30 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-on-surface"
                  />
                  <button
                    type="submit"
                    disabled={submittingReview}
                    className="bg-primary text-white px-6 py-2 rounded-full font-label-md font-bold hover:bg-primary/90 transition-all active:scale-95 disabled:opacity-50"
                  >
                    Đánh giá
                  </button>
                </form>
              </div>
            </section>

            {/* Comment Section */}
            <section>
              <div className="flex items-center gap-3 mb-md select-none">
                <span className="material-symbols-outlined text-primary text-2xl font-bold">forum</span>
                <h2 className="font-headline-md text-headline-md font-bold">Bình luận ({recipe.comments?.length || 0})</h2>
              </div>
              <div className="bg-surface-container-lowest p-md rounded-xl recipe-shadow border border-outline-variant/10">
                <form onSubmit={handleCommentSubmit} className="flex gap-4 mb-lg">
                  <div className="w-10 h-10 rounded-full bg-secondary-container flex items-center justify-center flex-shrink-0 shadow-sm select-none">
                    <span className="material-symbols-outlined text-on-secondary-container">person</span>
                  </div>
                  <div className="flex-grow">
                    {parentId && (
                      <div className="mb-2 bg-surface-container p-2 rounded-lg text-xs flex justify-between items-center text-on-surface-variant">
                        <span>Đang phản hồi bình luận...</span>
                        <button onClick={() => setParentId(null)} className="text-primary hover:underline">Hủy</button>
                      </div>
                    )}
                    <textarea
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      className="w-full bg-surface border border-outline-variant/30 rounded-lg p-3 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-on-surface-variant/50 text-on-surface"
                      placeholder="Chia sẻ cảm nhận của bạn về món ăn này..."
                      rows="3"
                    ></textarea>
                    <button
                      type="submit"
                      className="mt-2 bg-primary text-white px-6 py-2 rounded-full font-label-md font-bold hover:bg-primary/90 transition-all active:scale-95 shadow-sm"
                    >
                      Gửi bình luận
                    </button>
                  </div>
                </form>
                
                <div className="space-y-6">
                  {recipe.comments && recipe.comments.map((comment) => (
                    <div key={comment.id} className="space-y-3 border-b border-outline-variant/10 pb-4 last:border-b-0">
                      <div className="flex gap-4 animate-in fade-in duration-300">
                        <img
                          className="w-10 h-10 rounded-full object-cover shadow-sm select-none"
                          src={getImageUrl(comment.avatar_url) || "https://images.unsplash.com/photo-1534528741775-53994a69daeb"}
                          alt={comment.full_name || comment.username}
                        />
                        <div>
                          <div className="flex items-center gap-2 mb-1 select-none">
                            <span className="font-label-md font-bold text-on-surface">{comment.full_name || comment.username}</span>
                            <span className="text-xs text-on-surface-variant">
                              {new Date(comment.created_at).toLocaleDateString("vi-VN")}
                            </span>
                          </div>
                          <p className="text-on-surface-variant text-body-md leading-relaxed">{comment.content}</p>
                          <button
                            onClick={() => {
                              setParentId(comment.id);
                              setCommentText(`@${comment.username} `);
                            }}
                            className="text-xs text-primary font-bold mt-1 hover:underline focus:outline-none"
                          >
                            Phản hồi
                          </button>
                          {user && (user.id === comment.user_id || user.role === 'admin') && (
                            <>
                              <span className="text-xs text-on-surface-variant/40 mx-2 select-none">•</span>
                              <button
                                onClick={() => handleDeleteComment(comment.id)}
                                className="text-xs text-error font-bold mt-1 hover:underline focus:outline-none inline-flex items-center gap-1"
                                title="Xóa bình luận"
                              >
                                <span className="material-symbols-outlined !text-sm">delete</span>
                                <span>Xóa</span>
                              </button>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Comment replies */}
                      {comment.replies && comment.replies.map((reply) => (
                        <div key={reply.id} className="ml-14 flex gap-4 animate-in fade-in duration-300">
                          <img
                            className="w-8 h-8 rounded-full object-cover shadow-sm select-none"
                            src={getImageUrl(reply.avatar_url) || "https://images.unsplash.com/photo-1534528741775-53994a69daeb"}
                            alt={reply.full_name || reply.username}
                          />
                          <div>
                            <div className="flex items-center gap-2 mb-1 select-none">
                              <span className="font-label-md font-bold text-on-surface">{reply.full_name || reply.username}</span>
                              <span className="text-xs text-on-surface-variant">
                                {new Date(reply.created_at).toLocaleDateString("vi-VN")}
                              </span>
                            </div>
                            <p className="text-on-surface-variant text-body-md leading-relaxed">{reply.content}</p>
                            {user && (user.id === reply.user_id || user.role === 'admin') && (
                              <button
                                onClick={() => handleDeleteComment(reply.id)}
                                className="text-xs text-error font-bold mt-1 hover:underline focus:outline-none inline-flex items-center gap-1"
                                title="Xóa bình luận"
                              >
                                <span className="material-symbols-outlined !text-sm">delete</span>
                                <span>Xóa</span>
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </div>

          {/* Right Column: Sidebar */}
          <aside className="md:col-span-4 space-y-md sticky top-24 select-none">
            {/* Recipe Stats Card */}
            <div className="bg-surface-container-lowest p-md rounded-xl recipe-shadow border border-outline-variant/10">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col items-center p-3 rounded-lg bg-surface">
                  <span className="material-symbols-outlined text-primary mb-1">timer</span>
                  <span className="text-xs text-on-surface-variant uppercase font-label-sm">Chuẩn bị</span>
                  <span className="font-label-md text-on-surface font-bold">{recipe.prep_time_minutes || recipe.prepTimeMinutes || 0} phút</span>
                </div>
                <div className="flex flex-col items-center p-3 rounded-lg bg-surface">
                  <span className="material-symbols-outlined text-primary mb-1">outdoor_grill</span>
                  <span className="text-xs text-on-surface-variant uppercase font-label-sm">Chế biến</span>
                  <span className="font-label-md text-on-surface font-bold">{recipe.cook_time_minutes || recipe.cookTimeMinutes || 0} phút</span>
                </div>
                <div className="flex flex-col items-center p-3 rounded-lg bg-surface">
                  <span className="material-symbols-outlined text-primary mb-1">groups</span>
                  <span className="text-xs text-on-surface-variant uppercase font-label-sm">Khẩu phần</span>
                  <span className="font-label-md text-on-surface font-bold">{recipe.servings || 4} người</span>
                </div>
                <div className="flex flex-col items-center p-3 rounded-lg bg-surface">
                  <span className="material-symbols-outlined text-primary mb-1">local_fire_department</span>
                  <span className="text-xs text-on-surface-variant uppercase font-label-sm">Calories</span>
                  <span className="font-label-md text-on-surface font-bold">{recipe.calories || 0} kcal</span>
                </div>
              </div>

              {/* Bookmark buttons */}
              <button
                onClick={handleSaveToggle}
                className={`w-full mt-6 py-3 rounded-full font-label-md font-bold flex items-center justify-center gap-2 border transition-all active:scale-95 shadow-sm ${
                  isSaved
                    ? "bg-primary-container text-primary border-primary"
                    : "bg-primary text-white border-primary hover:bg-primary/90"
                }`}
              >
                <span className="material-symbols-outlined text-sm font-bold">
                  {isSaved ? "bookmark_added" : "bookmark"}
                </span>
                {isSaved ? "Đã lưu công thức" : "Lưu công thức"}
              </button>
            </div>

            {/* Phân tích Dinh dưỡng & Calo Card */}
            <div className="bg-surface-container-lowest p-md rounded-xl recipe-shadow border border-outline-variant/10">
              <h3 className="font-label-md text-primary mb-3 uppercase font-bold flex items-center gap-xs">
                <span className="material-symbols-outlined text-[18px]">monitoring</span>
                Dinh dưỡng & Sức khỏe
              </h3>
              
              {userHasHealthStats ? (
                <div className="space-y-sm">
                  <div className="flex justify-between text-sm text-on-surface-variant font-medium">
                    <span>% Calo ngày cần thiết (TDEE):</span>
                    <span className="font-bold text-on-surface">{caloriePercentage}%</span>
                  </div>
                  
                  {/* Progress bar */}
                  <div className="w-full bg-surface-container-highest rounded-full h-2.5 overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        caloriePercentage > 50 
                          ? "bg-error" 
                          : caloriePercentage > 35 
                            ? "bg-amber-500" 
                            : "bg-primary"
                      }`}
                      style={{ width: `${Math.min(caloriePercentage, 100)}%` }}
                    ></div>
                  </div>
                  
                  <p className="text-xs text-on-surface-variant leading-relaxed">
                    Món ăn này chứa <span className="font-bold text-on-surface">{recipe.calories || 0} kcal</span>, chiếm <span className="font-bold text-on-surface">{caloriePercentage}%</span> trong tổng số nhu cầu năng lượng hàng ngày của bạn (<span className="font-bold text-on-surface">{userTdee} kcal</span>).
                  </p>
                </div>
              ) : (
                <div className="space-y-sm">
                  <p className="text-xs text-on-surface-variant leading-relaxed">
                    Cập nhật chiều cao, cân nặng trên trang cá nhân để xem phân tích phần trăm dinh dưỡng món ăn so với nhu cầu hàng ngày của bạn!
                  </p>
                  <button
                    onClick={() => navigate("/profile")}
                    className="w-full py-2 bg-secondary/10 hover:bg-secondary/20 text-secondary border border-secondary/20 rounded-full font-label-md font-bold transition-all text-center text-xs cursor-pointer"
                  >
                    Thiết lập chỉ số sức khỏe
                  </button>
                </div>
              )}
            </div>

            {/* Author Info */}
            <div className="bg-surface-container-lowest p-md rounded-xl recipe-shadow border border-outline-variant/10">
              <h3 className="font-label-md text-primary mb-4 uppercase font-bold">Tác giả</h3>
              <div className="flex items-center gap-4 mb-4">
                <img
                  className="w-16 h-16 rounded-full object-cover shadow-sm cursor-pointer"
                  src={getImageUrl(recipe.author_avatar) || "https://images.unsplash.com/photo-1577219491135-ce391730fb2c"}
                  alt={recipe.author_name}
                  onClick={() => navigate(`/chef/${recipe.author_id}`)}
                />
                <div>
                  <p
                    className="font-headline-sm text-headline-sm leading-tight font-bold cursor-pointer hover:text-primary transition-colors"
                    onClick={() => navigate(`/chef/${recipe.author_id}`)}
                  >
                    {recipe.author_name || "Đầu bếp CulinShare"}
                  </p>
                  <p className="text-on-surface-variant text-sm">Chuyên gia ẩm thực</p>
                </div>
              </div>
              {recipe.author_bio && (
                <p className="text-on-surface-variant text-sm mb-4 leading-relaxed">{recipe.author_bio}</p>
              )}
              <button
                onClick={handleFollowToggle}
                className={`w-full py-2 border rounded-full font-label-md font-bold transition-all ${
                  isFollowed
                    ? "border-primary bg-primary-container/10 text-primary"
                    : "border-outline text-secondary hover:bg-surface-variant"
                }`}
              >
                {isFollowed ? "Đang theo dõi" : "Theo dõi"}
              </button>
            </div>

            {/* Tags / Categories */}
            <div className="bg-surface-container-lowest p-md rounded-xl recipe-shadow border border-outline-variant/10">
              <h3 className="font-label-md text-primary mb-4 uppercase font-bold">Phân loại</h3>
              <div className="flex flex-wrap gap-2">
                {recipe.categories && recipe.categories.map((cat, idx) => (
                  <span key={cat.id || idx} className="bg-tertiary/10 text-tertiary px-3 py-1 rounded-full text-xs font-label-md font-bold">
                    {cat.name || cat}
                  </span>
                ))}
                {recipe.difficulty && (
                  <span className="bg-secondary/10 text-secondary px-3 py-1 rounded-full text-xs font-label-md font-bold">
                    {recipe.difficulty}
                  </span>
                )}
              </div>
            </div>
          </aside>
        </div>
      </main>

      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteRecipe}
        isSubmitting={isDeleting}
      />
      <DeleteSuccessModal
        isOpen={isDeleteSuccessOpen}
        onClose={handleDeleteSuccessClose}
      />

      <Footer />
    </div>
  );
};

export default RecipeDetailPage;
