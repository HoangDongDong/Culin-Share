import { useRequireLogin } from "../components/AuthPrompt";
import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useSelector } from "react-redux";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { StepTimer } from '../components/CookingTimers';
import DeleteConfirmModal from "../components/DeleteConfirmModal";
import DeleteSuccessModal from "../components/DeleteSuccessModal";
import api, { getImageUrl } from "../services/api";
import {applySeo, recipeSeo, routeSeo} from "../services/seo.mjs";
import {
  getRecipeByIdApi,
  submitReviewApi,
  deleteReviewApi,
  submitCommentApi,
  saveRecipeApi,
  unsaveRecipeApi,
  updateSavedCollectionApi,
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
  const requireLogin = useRequireLogin();
  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checkedIngredients, setCheckedIngredients] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [parentId, setParentId] = useState(null);
  const [isFollowed, setIsFollowed] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [savedCollection, setSavedCollection] = useState("want_to_try");
  const [isSaveDropdownOpen, setIsSaveDropdownOpen] = useState(false);
  const [userRating, setUserRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewTip, setReviewTip] = useState("");
  const [cooksnapFile, setCooksnapFile] = useState(null);
  const [cooksnapPreview, setCooksnapPreview] = useState("");
  const [activePreviewImage, setActivePreviewImage] = useState(null);
  const [submittingReview, setSubmittingReview] = useState(false);
  const { user } = useSelector((state) => state.auth);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleteSuccessOpen, setIsDeleteSuccessOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [timerError, setTimerError] = useState(null);
  const missingTimers = recipe?.steps?.some(step => !(Number(step.timer_seconds) > 0));
  const timerErrorMessage = timerError?.recipeId === id ? timerError.message : '';

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
      setRecipe(null);
      const data = await getRecipeByIdApi(id);
      setRecipe(data);

      if (token) {
        const savedRes = await checkSavedStatusApi(id);
        setIsSaved(savedRes.saved);
        if (savedRes.collection) {
          setSavedCollection(savedRes.collection);
        }

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
    fetchRecipeDetails();
  }, [id, token]);

  useEffect(() => {
    if (!recipe || String(recipe.id) !== id || !missingTimers || timerErrorMessage) return;
    const controller = new AbortController();
    api.post(`/api/recipes/${id}/step-timers`, {}, { signal: controller.signal }).then(response => {
      if (controller.signal.aborted) return;
      const updated = new Map(response.data.data.steps.map(step => [step.id, step]));
      if (recipe.steps.some(step => updated.get(step.id)?.instruction !== step.instruction || !(updated.get(step.id)?.timer_seconds > 0))) {
        throw new Error('Công thức vừa thay đổi. Hãy tải lại trang để cập nhật thời gian.');
      }
      setRecipe(current => !current || String(current.id) !== id ? current : {
        ...current, steps: current.steps.map(step => updated.get(step.id)?.instruction === step.instruction ?
          { ...step, timer_seconds: updated.get(step.id).timer_seconds } : step)
      });
    }).catch(error => {
      if (!controller.signal.aborted) setTimerError({ recipeId: id,
        message: error.response?.data?.message || error.message || 'AI chưa bổ sung được thời gian. Vui lòng thử lại.' });
    });
    return () => controller.abort();
  }, [id, recipe, missingTimers, timerErrorMessage]);

  useEffect(() => {
    if(recipe && String(recipe.id) === String(id)) applySeo(recipeSeo(recipe));
    else if(!loading) applySeo({...routeSeo(`/recipe/${id}`), title:"Không tìm thấy công thức | CulinShare", noindex:true});
  }, [recipe,id,loading]);

  const handleIngredientToggle = (idx) => {
    setCheckedIngredients((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
    );
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!requireLogin({ message: "Đăng nhập để bình luận." })) return;
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
    if (!requireLogin({ message: "Đăng nhập để theo dõi đầu bếp." })) return;
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

  const handleSaveToCollection = async (targetCol) => {
    if (!requireLogin({ message: "Đăng nhập để lưu công thức." })) return;
    try {
      await saveRecipeApi(id, targetCol);
      setIsSaved(true);
      setSavedCollection(targetCol);
      setIsSaveDropdownOpen(false);
    } catch (err) {
      alert(err.message || "Không thể lưu vào bộ sưu tập");
    }
  };

  const handleUnsaveDirectly = async () => {
    try {
      await unsaveRecipeApi(id);
      setIsSaved(false);
      setIsSaveDropdownOpen(false);
    } catch (err) {
      alert(err.message || "Không thể hủy lưu");
    }
  };

  const handleCooksnapFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert("Dung lượng ảnh tối đa là 5MB!");
      return;
    }
    setCooksnapFile(file);
    const previewUrl = URL.createObjectURL(file);
    setCooksnapPreview(previewUrl);
  };

  const handleRemoveCooksnapFile = () => {
    setCooksnapFile(null);
    if (cooksnapPreview) {
      URL.revokeObjectURL(cooksnapPreview);
      setCooksnapPreview("");
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!requireLogin({ message: "Đăng nhập để chia sẻ ảnh thành phẩm và đánh giá." })) return;
    try {
      setSubmittingReview(true);
      await submitReviewApi(id, {
        rating: userRating,
        comment: reviewComment.trim(),
        tip: reviewTip.trim() || undefined,
        imageFile: cooksnapFile
      });
      alert(cooksnapFile ? "Đã đăng ảnh thành phẩm và đánh giá thành công!" : "Đăng đánh giá thành công!");
      setReviewComment("");
      setReviewTip("");
      handleRemoveCooksnapFile();
      // Auto save as cooked
      setIsSaved(true);
      setSavedCollection("cooked");
      // Reload details to get new reviews and rating
      const updatedData = await getRecipeByIdApi(id);
      setRecipe(updatedData);
    } catch (err) {
      alert(err.message || "Không thể gửi đánh giá");
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa đánh giá này?")) return;
    try {
      await deleteReviewApi(reviewId);
      const updatedData = await getRecipeByIdApi(id);
      setRecipe(updatedData);
    } catch (err) {
      alert(err.message || "Không thể xóa đánh giá");
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

  const cooksnaps = recipe?.reviews?.filter(r => !!r.image_url) || [];

  return (
    <div className="bg-surface text-on-surface font-body-md min-h-screen flex flex-col">
      <Header />

      <main className="w-full px-6 sm:px-10 md:px-14 lg:px-20 xl:px-24 py-base flex-grow">
        {recipe.importInfo && (
          <aside aria-label="Thông tin công thức" className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-stone-700">
            <p>Nguồn chưa cung cấp riêng thời gian chuẩn bị và độ khó. Số liệu dinh dưỡng chưa xác minh đơn vị/khẩu phần nên chưa dùng cho phân tích sức khỏe.</p>
            {recipe.status !== 'published' && <p className="font-semibold mt-2">Bản nháp nhập liệu — cần kiểm tra ảnh và nội dung trước khi công khai.</p>}
            {recipe.importInfo.tips && <p className="mt-2 whitespace-pre-wrap"><strong>Mách nhỏ từ nguồn: </strong>{recipe.importInfo.tips}</p>}
          </aside>
        )}
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
                    const cooksnaps = recipe?.reviews?.filter(r => !!r.image_url) || [];

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
                {missingTimers && <div className="rounded-xl bg-primary/5 p-3 text-sm" role="status">
                  {timerErrorMessage ? <><p>{timerErrorMessage}</p><button type="button" className="mt-2 text-primary font-bold underline" onClick={() => setTimerError(null)}>Yêu cầu AI bổ sung lại</button></> :
                    <p>AI đang bổ sung thời gian cho các bước còn thiếu…</p>}
                </div>}
                <p className="text-xs text-secondary">Thời gian còn thiếu được AI ước tính theo từng thao tác. Bạn có thể điều chỉnh trước khi bắt đầu.</p>
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
                      <StepTimer key={`${recipe.id}:${step.id || idx + 1}`} recipeId={recipe.id} recipeTitle={recipe.title}
                        stepId={step.id || idx + 1} stepNumber={step.step_number || idx + 1} durationSeconds={step.timer_seconds}
                        estimating={missingTimers && !timerErrorMessage} />
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Review and Cooksnap Section */}
            <section id="cooksnaps" className="space-y-md">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 select-none">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-primary text-2xl font-bold">photo_camera</span>
                  <h2 className="font-headline-md text-headline-md font-bold">
                    Ảnh thành phẩm & Đánh giá ({recipe.reviews?.length || 0})
                  </h2>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center text-yellow-500">
                    <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                    <span className="font-bold text-sm text-on-surface ml-1">{recipe.averageRating ? recipe.averageRating.toFixed(1) : "5.0"}</span>
                  </div>
                  <span className="text-xs text-on-surface-variant">
                    ({recipe.reviewCount || recipe.reviews?.length || 0} đánh giá • {cooksnaps.length} ảnh thực tế)
                  </span>
                </div>
              </div>

              {/* Cooksnaps Real Photos Showcase Gallery */}
              {cooksnaps.length > 0 && (
                <div className="bg-surface-container-lowest p-md rounded-2xl recipe-shadow border border-outline-variant/15">
                  <h3 className="font-label-md text-primary uppercase font-bold text-xs flex items-center gap-1.5 mb-3">
                    <span className="material-symbols-outlined text-[18px]">verified</span>
                    Thành phẩm thực tế từ người làm theo ({cooksnaps.length})
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {cooksnaps.map((rev) => (
                      <div
                        key={rev.id}
                        onClick={() => setActivePreviewImage(getImageUrl(rev.image_url))}
                        className="group relative aspect-square rounded-xl overflow-hidden cursor-pointer border border-outline-variant/20 shadow-xs hover:shadow-md transition-all"
                      >
                        <img
                          src={getImageUrl(rev.image_url)}
                          alt={`Thành phẩm của ${rev.full_name || rev.username}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-90 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2 text-white">
                          <div className="flex items-center gap-1 text-[11px] font-bold">
                            <img
                              src={getImageUrl(rev.avatar_url) || "https://images.unsplash.com/photo-1534528741775-53994a69daeb"}
                              alt={rev.full_name || rev.username}
                              className="w-4 h-4 rounded-full object-cover border border-white/40"
                            />
                            <span className="truncate">{rev.full_name || rev.username}</span>
                          </div>
                          <div className="flex items-center text-yellow-400 text-[10px] mt-0.5">
                            {[...Array(rev.rating || 5)].map((_, i) => (
                              <span key={i} className="material-symbols-outlined text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Form gửi đánh giá & ảnh thành phẩm */}
              <div className="bg-surface-container-lowest p-md rounded-2xl recipe-shadow border border-outline-variant/15">
                <div className="flex items-center justify-between mb-3 border-b border-outline-variant/10 pb-2">
                  <div>
                    <h3 className="font-headline-sm text-base text-on-surface font-bold">
                      Chia sẻ thành phẩm của bạn
                    </h3>
                    <p className="text-xs text-on-surface-variant">
                      Chụp ảnh đĩa thức ăn bạn đã nấu và gửi nhận xét để truyền cảm hứng cho cộng đồng.
                    </p>
                  </div>
                </div>

                <form onSubmit={handleReviewSubmit} className="space-y-4">
                  {/* Rating Stars */}
                  <div>
                    <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider block mb-1">
                      Đánh giá độ ngon / độ dễ:
                    </label>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setUserRating(star)}
                          className="material-symbols-outlined text-yellow-500 text-3xl focus:outline-none hover:scale-110 active:scale-95 transition-transform"
                          style={{ fontVariationSettings: userRating >= star ? "'FILL' 1" : "'FILL' 0" }}
                          title={`${star} sao`}
                        >
                          star
                        </button>
                      ))}
                      <span className="text-xs text-on-surface-variant font-bold ml-2">
                        {userRating === 5 ? "Rất ngon & chuẩn vị!" : userRating === 4 ? "Ngon miệng" : userRating === 3 ? "Bình thường" : userRating === 2 ? "Cần cải thiện" : "Chưa hài lòng"}
                      </span>
                    </div>
                  </div>

                  {/* Cooksnap Image Upload */}
                  <div>
                    <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider block mb-1">
                      Ảnh thành phẩm thực tế (Cooksnap):
                    </label>

                    {cooksnapPreview ? (
                      <div className="relative inline-block rounded-xl overflow-hidden border border-outline-variant/30 shadow-xs">
                        <img
                          src={cooksnapPreview}
                          alt="Xem trước ảnh thành phẩm"
                          className="w-48 h-36 object-cover"
                        />
                        <button
                          type="button"
                          onClick={handleRemoveCooksnapFile}
                          className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/70 hover:bg-black text-white flex items-center justify-center transition-all"
                          title="Gỡ ảnh này"
                        >
                          <span className="material-symbols-outlined text-[16px]">close</span>
                        </button>
                        <div className="absolute bottom-0 inset-x-0 bg-emerald-600/90 text-white text-[11px] font-bold text-center py-0.5">
                          Đã chọn ảnh thành phẩm
                        </div>
                      </div>
                    ) : (
                      <label className="border-2 border-dashed border-outline-variant/40 hover:border-primary/60 bg-surface hover:bg-primary/5 rounded-xl p-4 flex flex-col sm:flex-row items-center gap-3 cursor-pointer transition-all">
                        <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                          <span className="material-symbols-outlined text-xl">add_a_photo</span>
                        </div>
                        <div className="text-center sm:text-left">
                          <span className="text-sm font-bold text-primary block">
                            Tải lên ảnh thành phẩm thực tế của bạn
                          </span>
                          <span className="text-xs text-on-surface-variant">
                            PNG, JPG, WebP tối đa 5MB (chụp món ăn bạn vừa nấu xong)
                          </span>
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleCooksnapFileChange}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>

                  {/* Tip input (Optional) */}
                  <div>
                    <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider block mb-1">
                      Mẹo nhỏ khi nấu (tùy chọn):
                    </label>
                    <input
                      type="text"
                      placeholder="Ví dụ: Rán lửa nhỏ 5 phút sẽ giòn hơn, giảm bớt 1 thìa đường..."
                      value={reviewTip}
                      onChange={(e) => setReviewTip(e.target.value)}
                      className="w-full bg-surface border border-outline-variant/30 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none text-on-surface"
                    />
                  </div>

                  {/* Comment text */}
                  <div>
                    <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider block mb-1">
                      Nhận xét & cảm nhận:
                    </label>
                    <textarea
                      rows="3"
                      placeholder="Chia sẻ trải nghiệm của bạn khi nấu món này (hương vị, độ vừa miệng, độ khó)..."
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      className="w-full bg-surface border border-outline-variant/30 rounded-lg p-3 text-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all placeholder:text-on-surface-variant/50 text-on-surface resize-none"
                    />
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={submittingReview}
                      className="bg-primary text-white px-6 py-2.5 rounded-full font-label-md font-bold text-sm hover:bg-primary/95 transition-all active:scale-95 shadow-sm disabled:opacity-50 flex items-center gap-1.5"
                    >
                      {submittingReview ? (
                        <>
                          <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                          Đang gửi...
                        </>
                      ) : (
                        <>
                          <span className="material-symbols-outlined text-[18px]">
                            {cooksnapFile ? "add_a_photo" : "send"}
                          </span>
                          {cooksnapFile ? "Đăng ảnh thành phẩm & Đánh giá" : "Gửi đánh giá"}
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>

              {/* Reviews List */}
              <div className="bg-surface-container-lowest p-md rounded-2xl recipe-shadow border border-outline-variant/15">
                <h3 className="font-headline-sm text-base text-on-surface font-bold mb-md pb-2 border-b border-outline-variant/10">
                  Phản hồi từ các đầu bếp gia đình ({recipe.reviews?.length || 0})
                </h3>

                {recipe.reviews && recipe.reviews.length > 0 ? (
                  <div className="space-y-md divide-y divide-outline-variant/10">
                    {recipe.reviews.map((rev) => (
                      <div key={rev.id} className="pt-md first:pt-0 space-y-2">
                        {/* Reviewer Meta */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <img
                              src={getImageUrl(rev.avatar_url) || "https://images.unsplash.com/photo-1534528741775-53994a69daeb"}
                              alt={rev.full_name || rev.username}
                              className="w-9 h-9 rounded-full object-cover border border-outline-variant/20 shadow-xs"
                            />
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-sm text-on-surface">
                                  {rev.full_name || rev.username}
                                </span>
                                {rev.image_url && (
                                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                                    <span className="material-symbols-outlined text-[13px]">check_circle</span>
                                    Đã nấu thành công
                                  </span>
                                )}
                              </div>
                              <span className="text-[11px] text-on-surface-variant">
                                {new Date(rev.created_at).toLocaleDateString("vi-VN")}
                              </span>
                            </div>
                          </div>

                          {/* Star Rating */}
                          <div className="flex items-center text-yellow-500">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <span
                                key={star}
                                className="material-symbols-outlined text-[16px]"
                                style={{ fontVariationSettings: (rev.rating || 5) >= star ? "'FILL' 1" : "'FILL' 0" }}
                              >
                                star
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Cooksnap Image if available */}
                        {rev.image_url && (
                          <div className="mt-2">
                            <div
                              onClick={() => setActivePreviewImage(getImageUrl(rev.image_url))}
                              className="relative group rounded-xl overflow-hidden border border-outline-variant/20 max-w-sm cursor-pointer shadow-xs"
                            >
                              <img
                                src={getImageUrl(rev.image_url)}
                                alt={`Thành phẩm của ${rev.full_name || rev.username}`}
                                className="w-full h-56 object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                              <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                                <span className="material-symbols-outlined text-2xl">zoom_in</span>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Tip block */}
                        {rev.tip && (
                          <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2">
                            <span className="material-symbols-outlined text-amber-700 text-[18px] flex-shrink-0 mt-0.5">
                              tips_and_updates
                            </span>
                            <div>
                              <strong className="font-bold">Mẹo từ người nấu: </strong>
                              <span>{rev.tip}</span>
                            </div>
                          </div>
                        )}

                        {/* Comment text */}
                        {rev.comment && (
                          <p className="text-sm text-on-surface leading-relaxed whitespace-pre-wrap">
                            {rev.comment}
                          </p>
                        )}

                        {/* Delete action for author or admin */}
                        {user && (user.id === rev.user_id || user.role === "admin") && (
                          <div className="pt-1 flex justify-end">
                            <button
                              type="button"
                              onClick={() => handleDeleteReview(rev.id)}
                              className="text-xs text-error hover:underline flex items-center gap-1 font-semibold"
                            >
                              <span className="material-symbols-outlined text-[14px]">delete</span>
                              Xóa đánh giá
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-on-surface-variant">
                    <span className="material-symbols-outlined text-4xl text-outline-variant mb-2">
                      photo_camera
                    </span>
                    <p className="text-sm font-semibold">Chưa có ảnh thành phẩm hoặc đánh giá nào.</p>
                    <p className="text-xs mt-1">Hãy là người đầu tiên nấu thử và chia sẻ ảnh đĩa thức ăn của bạn!</p>
                  </div>
                )}
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
                  <span className="font-label-md text-on-surface font-bold">{recipe.importInfo&&recipe.prep_time_minutes==null?'Chưa có dữ liệu':`${recipe.prep_time_minutes || recipe.prepTimeMinutes || 0} phút`}</span>
                </div>
                <div className="flex flex-col items-center p-3 rounded-lg bg-surface">
                  <span className="material-symbols-outlined text-primary mb-1">outdoor_grill</span>
                  <span className="text-xs text-on-surface-variant uppercase font-label-sm">Chế biến</span>
                  <span className="font-label-md text-on-surface font-bold">{recipe.cook_time_minutes || recipe.cookTimeMinutes || 0} phút</span>
                </div>
                <div className="flex flex-col items-center p-3 rounded-lg bg-surface">
                  <span className="material-symbols-outlined text-primary mb-1">groups</span>
                  <span className="text-xs text-on-surface-variant uppercase font-label-sm">Khẩu phần</span>
                  <span className="font-label-md text-on-surface font-bold">{recipe.importInfo&&!recipe.servings?'Chưa xác minh':`${recipe.servings || 4} người`}</span>
                </div>
                <div className="flex flex-col items-center p-3 rounded-lg bg-surface">
                  <span className="material-symbols-outlined text-primary mb-1">local_fire_department</span>
                  <span className="text-xs text-on-surface-variant uppercase font-label-sm">Calories</span>
                  <span className="font-label-md text-on-surface font-bold">{recipe.importInfo&&recipe.calories==null?'Chưa xác minh':`${recipe.calories || 0} kcal`}</span>
                </div>
              </div>

              {/* Bookmark & Collection selector */}
              <div className="relative mt-6">
                <button
                  type="button"
                  onClick={() => setIsSaveDropdownOpen(!isSaveDropdownOpen)}
                  className={`w-full py-3 rounded-full font-label-md font-bold flex items-center justify-center gap-2 border transition-all active:scale-95 shadow-sm ${
                    isSaved
                      ? "bg-primary-container text-primary border-primary"
                      : "bg-primary text-white border-primary hover:bg-primary/90"
                  }`}
                >
                  <span className="material-symbols-outlined text-sm font-bold">
                    {isSaved ? "bookmark_added" : "bookmark"}
                  </span>
                  <span>
                    {isSaved
                      ? (savedCollection === "cooked"
                          ? "Đã lưu: Món đã nấu"
                          : savedCollection === "quick_dinner"
                          ? "Đã lưu: Bữa tối nhanh"
                          : "Đã lưu: Món muốn thử")
                      : "Lưu vào Bộ sưu tập"}
                  </span>
                  <span className="material-symbols-outlined text-sm">
                    {isSaveDropdownOpen ? "expand_less" : "expand_more"}
                  </span>
                </button>

                {/* Dropdown Menu */}
                {isSaveDropdownOpen && (
                  <div className="absolute right-0 left-0 mt-2 bg-surface-container-lowest rounded-2xl shadow-xl border border-outline-variant/20 p-2 z-50 animate-in fade-in duration-200">
                    <p className="px-3 py-1.5 text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                      Chọn bộ sưu tập
                    </p>
                    <button
                      type="button"
                      onClick={() => handleSaveToCollection("want_to_try")}
                      className={`w-full px-3 py-2.5 rounded-xl text-left text-sm flex items-center justify-between transition-colors ${
                        isSaved && savedCollection === "want_to_try" ? "bg-amber-50 text-amber-900 font-bold" : "hover:bg-surface-variant text-on-surface"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-amber-600 text-[20px]">bookmark</span>
                        <div>
                          <p className="font-bold text-xs">Món muốn thử</p>
                          <p className="text-[11px] text-on-surface-variant">Dự định nấu khi rảnh</p>
                        </div>
                      </div>
                      {isSaved && savedCollection === "want_to_try" && (
                        <span className="material-symbols-outlined text-amber-600 text-sm">check</span>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSaveToCollection("quick_dinner")}
                      className={`w-full px-3 py-2.5 rounded-xl text-left text-sm flex items-center justify-between transition-colors ${
                        isSaved && savedCollection === "quick_dinner" ? "bg-sky-50 text-sky-900 font-bold" : "hover:bg-surface-variant text-on-surface"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-sky-600 text-[20px]">bolt</span>
                        <div>
                          <p className="font-bold text-xs">Bữa tối nhanh</p>
                          <p className="text-[11px] text-on-surface-variant">Món nhanh cho ngày bận</p>
                        </div>
                      </div>
                      {isSaved && savedCollection === "quick_dinner" && (
                        <span className="material-symbols-outlined text-sky-600 text-sm">check</span>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSaveToCollection("cooked")}
                      className={`w-full px-3 py-2.5 rounded-xl text-left text-sm flex items-center justify-between transition-colors ${
                        isSaved && savedCollection === "cooked" ? "bg-emerald-50 text-emerald-900 font-bold" : "hover:bg-surface-variant text-on-surface"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-emerald-600 text-[20px]">check_circle</span>
                        <div>
                          <p className="font-bold text-xs">Món đã nấu</p>
                          <p className="text-[11px] text-on-surface-variant">Đã trổ tài thành công</p>
                        </div>
                      </div>
                      {isSaved && savedCollection === "cooked" && (
                        <span className="material-symbols-outlined text-emerald-600 text-sm">check</span>
                      )}
                    </button>

                    {isSaved && (
                      <div className="pt-1 mt-1 border-t border-outline-variant/10">
                        <button
                          type="button"
                          onClick={handleUnsaveDirectly}
                          className="w-full px-3 py-2 rounded-xl text-left text-xs font-bold text-error hover:bg-error-container/20 flex items-center gap-2"
                        >
                          <span className="material-symbols-outlined text-[16px]">bookmark_remove</span>
                          Bỏ lưu công thức
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Phân tích Dinh dưỡng & Calo Card */}
            <div className="bg-surface-container-lowest p-md rounded-xl recipe-shadow border border-outline-variant/10">
              <h3 className="font-label-md text-primary mb-3 uppercase font-bold flex items-center gap-xs">
                <span className="material-symbols-outlined text-[18px]">monitoring</span>
                Dinh dưỡng & Sức khỏe
              </h3>
              
              {recipe.importInfo&&recipe.calories==null ? <p className="text-sm text-on-surface-variant">Chưa có số liệu dinh dưỡng được xác minh theo khẩu phần để phân tích sức khỏe cho công thức nhập này.</p> : userHasHealthStats ? (
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
onClick={() => { if (requireLogin({ from: "/profile" })) navigate("/profile"); }}
                    className="w-full py-2 bg-secondary/10 hover:bg-secondary/20 text-secondary border border-secondary/20 rounded-full font-label-md font-bold transition-all text-center text-xs cursor-pointer"
                  >
                    Thiết lập chỉ số sức khỏe
                  </button>
                </div>
              )}
            </div>

            {/* Author Info */}
            <div className="bg-surface-container-lowest p-md rounded-xl recipe-shadow border border-outline-variant/10">
              <h3 className="font-label-md text-primary mb-4 uppercase font-bold">{recipe.importInfo ? 'Tài khoản đăng lại' : 'Tác giả'}</h3>
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

      {/* Lightbox Image Preview Modal */}
      {activePreviewImage && (
        <div
          onClick={() => setActivePreviewImage(null)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
        >
          <div className="relative max-w-4xl max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            <img
              src={activePreviewImage}
              alt="Ảnh thành phẩm phóng to"
              className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl"
            />
            <button
              onClick={() => setActivePreviewImage(null)}
              className="absolute top-3 right-3 w-10 h-10 rounded-full bg-black/60 hover:bg-black text-white flex items-center justify-center shadow-lg transition-all"
              title="Đóng"
            >
              <span className="material-symbols-outlined text-2xl">close</span>
            </button>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default RecipeDetailPage;
