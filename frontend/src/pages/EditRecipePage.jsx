import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { getCategoriesApi } from "../services/categoryApi";
import { getRecipeByIdApi, updateRecipeApi } from "../services/recipeApi";
import { getImageUrl } from "../services/api";

const EditRecipePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [categoriesList, setCategoriesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showToast, setShowToast] = useState(false);

  // Form states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [ingredients, setIngredients] = useState([{ quantity: "", name: "" }]);
  const [steps, setSteps] = useState([{ step_number: 1, instruction: "", image_url: "", image_file: null, image_preview: "" }]);
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [coverImageFile, setCoverImageFile] = useState(null);
  const [coverImagePreview, setCoverImagePreview] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [prepTime, setPrepTime] = useState(30);
  const [cookTime, setCookTime] = useState(20);
  const [servings, setServings] = useState(4);
  const [calories, setCalories] = useState(0);
  const [difficulty, setDifficulty] = useState("dễ");

  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token || token === "null" || token === "undefined") {
      setShowAuthModal(true);
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        // Load categories list
        const cats = await getCategoriesApi();
        setCategoriesList(cats);

        // Load recipe detail
        const recipeData = await getRecipeByIdApi(id);
        
        setTitle(recipeData.title || "");
        setDescription(recipeData.description || "");
        setCoverImageUrl(recipeData.cover_image_url || recipeData.coverImageUrl || "");
        setPrepTime(recipeData.prep_time_minutes || recipeData.prepTimeMinutes || 0);
        setCookTime(recipeData.cook_time_minutes || recipeData.cookTimeMinutes || 0);
        setServings(recipeData.servings || 4);
        setCalories(recipeData.calories || 0);
        setDifficulty(recipeData.difficulty || "dễ");

        if (recipeData.categories && recipeData.categories.length > 0) {
          setSelectedCategoryId(recipeData.categories[0].id || "");
        } else if (cats.length > 0) {
          setSelectedCategoryId(cats[0].id || "");
        }

        // Format ingredients
        if (recipeData.ingredients && recipeData.ingredients.length > 0) {
          const formattedIngs = recipeData.ingredients.map(ing => {
            const qtyStr = `${ing.quantity || ""} ${ing.unit || ""}`.trim();
            return {
              quantity: qtyStr,
              name: ing.name || ""
            };
          });
          setIngredients(formattedIngs);
        } else {
          setIngredients([{ quantity: "", name: "" }]);
        }

        // Format steps
        if (recipeData.steps && recipeData.steps.length > 0) {
          const formattedSteps = recipeData.steps.map(step => ({
            step_number: step.step_number || 1,
            instruction: step.instruction || "",
            image_url: step.image_url || "",
            image_file: null,
            image_preview: ""
          }));
          setSteps(formattedSteps);
        } else {
          setSteps([{ step_number: 1, instruction: "", image_url: "", image_file: null, image_preview: "" }]);
        }

      } catch (err) {
        console.error("Lỗi khi tải dữ liệu công thức:", err);
        alert("Không thể tải thông tin công thức nấu ăn này.");
        navigate("/");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, navigate]);

  const handleAddIngredient = () => {
    setIngredients([...ingredients, { quantity: "", name: "" }]);
  };

  const handleIngredientChange = (index, field, value) => {
    const list = [...ingredients];
    list[index][field] = value;
    setIngredients(list);
  };

  const handleRemoveIngredient = (index) => {
    if (ingredients.length > 1) {
      setIngredients(ingredients.filter((_, i) => i !== index));
    }
  };

  const handleAddStep = () => {
    setSteps([...steps, { step_number: steps.length + 1, instruction: "", image_url: "", image_file: null, image_preview: "" }]);
  };

  const handleStepChange = (index, field, value) => {
    setSteps((currentSteps) => currentSteps.map((step, stepIndex) => (
      stepIndex === index ? { ...step, [field]: value } : step
    )));
  };

  const handleRemoveStep = (index) => {
    if (steps.length > 1) {
      const list = steps.filter((_, i) => i !== index).map((s, idx) => ({
        ...s,
        step_number: idx + 1
      }));
      setSteps(list);
    }
  };

  const handleCoverFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setCoverImageFile(file);
    setCoverImagePreview(URL.createObjectURL(file));
  };

  const handleStepFileChange = (index, event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    handleStepChange(index, "image_file", file);
    handleStepChange(index, "image_preview", URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Vui lòng đăng nhập để chỉnh sửa công thức!");
      navigate("/login");
      return;
    }

    setSubmitting(true);
    try {
      // Map ingredients to backend expected format
      const formattedIngs = ingredients
        .filter(ing => ing.name.trim() !== "")
        .map(ing => {
          // Parse quantity and unit if quantity contains characters (e.g. 500g -> quantity: 500, unit: g)
          // For simplicity, we can pass it as name and quantity, or split it if it has trailing letters.
          // Let's split it: if quantity contains letters at the end (e.g. '500g' or '30ml'), extract them.
          const qtyVal = ing.quantity.trim();
          const match = qtyVal.match(/^(\d+(?:\.\d+)?)\s*([a-zA-Z\u00C0-\u1EF9]+)?$/);
          if (match) {
            return {
              name: ing.name.trim(),
              quantity: match[1],
              unit: match[2] || ""
            };
          }
          return {
            name: ing.name.trim(),
            quantity: qtyVal,
            unit: ""
          };
        });

      const payload = {
        title,
        description,
        cover_image_url: coverImageUrl || "https://images.unsplash.com/photo-1596797038530-2c107229654b",
        coverImageFile,
        prep_time_minutes: parseInt(prepTime) || 0,
        cook_time_minutes: parseInt(cookTime) || 0,
        servings: parseInt(servings) || 4,
        calories: parseInt(calories) || 0,
        difficulty,
        ingredients: formattedIngs,
        steps: steps.filter(s => s.instruction.trim() !== "").map((s, idx) => ({
          step_number: idx + 1,
          instruction: s.instruction,
          image_url: s.image_url,
          image_file: s.image_file
        })),
        categoryIds: selectedCategoryId ? [parseInt(selectedCategoryId)] : []
      };

      await updateRecipeApi(id, payload);
      
      setShowToast(true);
      setTimeout(() => {
        setShowToast(false);
        navigate(`/recipe/${id}`);
      }, 2000);
    } catch (err) {
      alert(err.message || "Lỗi khi cập nhật công thức");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-surface text-on-surface font-body-md min-h-screen flex flex-col">
        <Header />
        <div className="flex-grow flex flex-col items-center justify-center py-20">
          <span className="material-symbols-outlined text-5xl text-primary animate-spin">progress_activity</span>
          <p className="mt-4 text-on-surface-variant font-label-md">Đang tải dữ liệu công thức...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (showAuthModal) {
    return (
      <div className="bg-surface text-on-surface font-body-md min-h-screen flex flex-col">
        <Header />
        
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div 
            className="bg-white border border-outline-variant/10 rounded-2xl p-6 md:p-8 max-w-md w-full text-center shadow-2xl"
            style={{
              animation: 'fadeSlideIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
            }}
          >
            <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-5">
              <span className="material-symbols-outlined text-3xl font-bold">lock</span>
            </div>
            
            <h2 className="text-2xl font-bold text-on-surface mb-3">Yêu cầu Đăng nhập</h2>
            <p className="text-sm text-on-surface-variant leading-relaxed mb-6">
              Bạn cần đăng nhập tài khoản CulinShare để có thể chỉnh sửa và quản lý các công thức nấu ăn của mình.
            </p>
            
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
      </div>
    );
  }

  return (
    <div className="bg-background font-body-md text-on-background min-h-screen flex flex-col">
      <Header />

      {/* Success Toast */}
      {showToast && (
        <div className="fixed top-20 right-8 z-[100] animate-in fade-in slide-in-from-right-10 duration-300">
          <div className="bg-tertiary-container text-on-tertiary-container px-md py-sm rounded-xl shadow-soft flex items-center gap-sm border border-tertiary font-label-md font-bold">
            <span className="material-symbols-outlined font-bold">check_circle</span>
            <span>Cập nhật công thức thành công!</span>
          </div>
        </div>
      )}

      <main className="max-w-max-width mx-auto px-margin-mobile md:px-margin-desktop py-lg flex-grow w-full">
        {/* Header Section */}
        <form onSubmit={handleSubmit}>
          <div className="mb-lg flex flex-col md:flex-row md:items-end justify-between gap-md">
            <div>
              <nav className="flex items-center gap-xs text-on-surface-variant mb-xs select-none">
                <span className="text-label-sm font-label-sm">My Recipes</span>
                <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                <span className="text-label-sm font-label-sm">Edit</span>
              </nav>
              <h1 className="font-headline-md text-headline-md text-on-surface font-bold">Chỉnh sửa công thức</h1>
            </div>
            <div className="flex gap-sm select-none">
              <button 
                type="button" 
                onClick={() => window.history.back()}
                className="px-md py-sm rounded-lg border border-outline text-on-surface-variant font-label-md hover:bg-surface-container-low transition-all font-bold cursor-pointer"
              >
                Hủy
              </button>
              <button 
                type="submit"
                disabled={submitting}
                className="bg-primary text-on-primary px-md py-sm rounded-lg font-label-md shadow-soft hover:brightness-110 active:scale-95 transition-all flex items-center gap-sm font-bold cursor-pointer disabled:opacity-80"
              >
                <span>Cập nhật bài viết</span>
                {submitting && (
                  <span className="animate-spin material-symbols-outlined text-sm">progress_activity</span>
                )}
              </button>
            </div>
          </div>

          {/* Form Layout: Asymmetric Two-Column */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-lg items-start">
            {/* Left Column: Main Details */}
            <div className="lg:col-span-8 space-y-lg">
              {/* Recipe Basic Info */}
              <section className="bg-surface-container-lowest p-md md:p-lg rounded-xl shadow-soft border border-surface-variant">
                <div className="space-y-md">
                  <div className="space-y-xs">
                    <label className="font-label-md text-on-surface-variant font-bold">Tiêu đề công thức</label>
                    <input 
                      className="w-full bg-white border border-outline-variant rounded-lg p-sm focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none font-headline-sm text-headline-sm text-on-surface"
                      placeholder="Nhập tên món ăn..." 
                      type="text" 
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-xs">
                    <label className="font-label-md text-on-surface-variant font-bold">Mô tả ngắn</label>
                    <textarea 
                      className="w-full bg-white border border-outline-variant rounded-lg p-sm focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none text-on-surface leading-relaxed" 
                      placeholder="Chia sẻ câu chuyện đằng sau món ăn này..." 
                      rows="4"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      required
                    ></textarea>
                  </div>
                </div>
              </section>

              {/* Ingredients Section */}
              <section className="bg-surface-container-lowest p-md md:p-lg rounded-xl shadow-soft border border-surface-variant">
                <div className="flex justify-between items-center mb-md select-none">
                  <h2 className="font-headline-sm text-headline-sm font-bold">Nguyên liệu</h2>
                  <button 
                    type="button"
                    onClick={handleAddIngredient}
                    className="text-primary font-label-md flex items-center gap-xs font-bold hover:opacity-85"
                  >
                    <span className="material-symbols-outlined text-[20px] font-bold">add_circle</span> Thêm nguyên liệu
                  </button>
                </div>
                <div className="space-y-sm">
                  {ingredients.map((ing, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-sm items-center group animate-in fade-in duration-200">
                      <div className="col-span-1 flex justify-center text-on-surface-variant select-none">
                        <span className="material-symbols-outlined cursor-grab">drag_indicator</span>
                      </div>
                      <input 
                        className="col-span-3 bg-white border border-outline-variant rounded-lg p-sm focus:ring-1 focus:ring-primary outline-none text-on-surface" 
                        placeholder="Số lượng (vd: 500g)" 
                        type="text" 
                        value={ing.quantity}
                        onChange={(e) => handleIngredientChange(idx, "quantity", e.target.value)}
                        required
                      />
                      <input 
                        className="col-span-7 bg-white border border-outline-variant rounded-lg p-sm focus:ring-1 focus:ring-primary outline-none text-on-surface" 
                        placeholder="Tên nguyên liệu (vd: Thịt ba chỉ)" 
                        type="text" 
                        value={ing.name}
                        onChange={(e) => handleIngredientChange(idx, "name", e.target.value)}
                        required
                      />
                      <button 
                        type="button"
                        onClick={() => handleRemoveIngredient(idx)}
                        disabled={ingredients.length <= 1}
                        className="col-span-1 text-on-surface-variant hover:text-error transition-colors p-1 disabled:opacity-30"
                      >
                        <span className="material-symbols-outlined">delete</span>
                      </button>
                    </div>
                  ))}
                </div>
              </section>

              {/* Steps Section */}
              <section className="bg-surface-container-lowest p-md md:p-lg rounded-xl shadow-soft border border-surface-variant">
                <div className="flex justify-between items-center mb-md select-none">
                  <h2 className="font-headline-sm text-headline-sm font-bold">Các bước thực hiện</h2>
                  <button 
                    type="button"
                    onClick={handleAddStep}
                    className="text-primary font-label-md flex items-center gap-xs font-bold hover:opacity-85"
                  >
                    <span className="material-symbols-outlined text-[20px] font-bold">add_circle</span> Thêm bước mới
                  </button>
                </div>
                <div className="space-y-lg">
                  {steps.map((step, idx) => (
                    <div key={idx} className="relative pl-sm border-b border-outline-variant/10 pb-lg last:border-b-0 last:pb-0 animate-in fade-in duration-300">
                      <div className="flex items-start gap-md">
                        <div className="bg-secondary-container text-on-secondary-container w-8 h-8 rounded-full flex items-center justify-center font-bold flex-shrink-0 select-none shadow-sm">
                          {idx + 1}
                        </div>
                        <div className="flex-grow space-y-sm">
                          <textarea 
                            className="w-full bg-white border border-outline-variant rounded-lg p-sm focus:ring-2 focus:ring-primary outline-none text-on-surface leading-relaxed" 
                            placeholder="Mô tả chi tiết bước này..." 
                            rows="3"
                            value={step.instruction}
                            onChange={(e) => handleStepChange(idx, "instruction", e.target.value)}
                            required
                          ></textarea>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-sm items-end">
                            <div className="flex flex-col gap-1">
                              <label className="text-xs font-bold text-on-surface-variant">Link ảnh minh họa bước (Tùy chọn)</label>
                              <input 
                                className="w-full px-3 py-1.5 bg-white border border-outline-variant rounded-lg focus:ring-1 focus:ring-primary outline-none text-on-surface text-sm" 
                                placeholder="Dán link ảnh bước..." 
                                type="text"
                                value={step.image_url}
                                onChange={(e) => {
                                  handleStepChange(idx, "image_url", e.target.value);
                                  handleStepChange(idx, "image_file", null);
                                  handleStepChange(idx, "image_preview", "");
                                }}
                              />
                              <label className="mt-2 flex items-center justify-center gap-2 px-3 py-1.5 border border-dashed border-primary/50 rounded-lg text-primary text-sm font-bold cursor-pointer hover:bg-primary/5 transition-colors">
                                <span className="material-symbols-outlined text-[18px]">upload</span>
                                Tải ảnh bước
                                <input
                                  className="hidden"
                                  type="file"
                                  accept="image/jpeg,image/png,image/gif,image/webp"
                                  onChange={(e) => handleStepFileChange(idx, e)}
                                />
                              </label>
                            </div>
                            
                            <div className="flex items-center gap-sm justify-between">
                              {(step.image_preview || step.image_url) ? (
                                <div className="w-32 h-20 bg-surface-container-low border border-outline-variant rounded flex items-center justify-center overflow-hidden group select-none">
                                  <img 
                                    alt={`Bước ${idx + 1}`} 
                                    className="object-cover w-full h-full group-hover:scale-110 transition-transform" 
                                    src={step.image_preview || getImageUrl(step.image_url)}
                                    onError={(e) => {
                                      e.target.onerror = null;
                                      e.target.src = "https://images.unsplash.com/photo-1596797038530-2c107229654b";
                                    }}
                                  />
                                </div>
                              ) : (
                                <div className="w-32 h-20 border-2 border-dashed border-outline-variant rounded flex flex-col items-center justify-center text-on-surface-variant select-none">
                                  <span className="material-symbols-outlined text-sm">add_a_photo</span>
                                  <span className="text-[10px] font-label-sm">Chưa có ảnh</span>
                                </div>
                              )}
                              
                              <button
                                type="button"
                                onClick={() => handleRemoveStep(idx)}
                                disabled={steps.length <= 1}
                                className="text-on-surface-variant hover:text-error transition-colors p-1 disabled:opacity-30 select-none"
                              >
                                <span className="material-symbols-outlined">delete</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            {/* Right Column: Sidebar Settings */}
            <div className="lg:col-span-4 space-y-lg sticky top-24">
              {/* Cover Image */}
              <section className="bg-surface-container-lowest p-md rounded-xl shadow-soft border border-surface-variant overflow-hidden">
                <label className="font-label-md text-on-surface-variant mb-sm block font-bold">Ảnh bìa công thức</label>
                
                <input 
                  className="w-full bg-white border border-outline-variant rounded-lg p-sm focus:ring-1 focus:ring-primary outline-none text-on-surface mb-3 text-sm" 
                  placeholder="Dán link ảnh bìa mới..." 
                  type="text" 
                  value={coverImageUrl}
                  onChange={(e) => {
                    setCoverImageUrl(e.target.value);
                    setCoverImageFile(null);
                    setCoverImagePreview("");
                  }}
                />
                <label className="mb-3 flex items-center justify-center gap-2 px-md py-2.5 border border-dashed border-primary/50 rounded-lg text-primary font-label-md font-bold cursor-pointer hover:bg-primary/5 transition-colors">
                  <span className="material-symbols-outlined">upload</span>
                  Tải ảnh từ máy
                  <input
                    className="hidden"
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    onChange={handleCoverFileChange}
                  />
                </label>

                <div className="relative aspect-[4/3] rounded-lg overflow-hidden group select-none shadow-sm border border-outline-variant/10 bg-surface-container">
                  <img 
                    alt={title || "Cover"} 
                    className="w-full h-full object-cover" 
                    src={coverImagePreview || getImageUrl(coverImageUrl) || "https://images.unsplash.com/photo-1596797038530-2c107229654b"} 
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "https://images.unsplash.com/photo-1596797038530-2c107229654b";
                    }}
                  />
                </div>
              </section>

              {/* Metadata Settings */}
              <section className="bg-surface-container-lowest p-md rounded-xl shadow-soft border border-surface-variant space-y-md">
                <div className="grid grid-cols-1 gap-md">
                  {/* Prep Time */}
                  <div className="space-y-xs">
                    <label className="font-label-md text-on-surface-variant flex items-center gap-xs font-bold select-none">
                      <span className="material-symbols-outlined text-[18px]">schedule</span> Thời gian chuẩn bị
                    </label>
                    <div className="relative">
                      <input 
                        className="w-full bg-white border border-outline-variant rounded-lg p-sm pr-12 focus:ring-1 focus:ring-primary outline-none text-on-surface" 
                        type="number" 
                        min="0"
                        value={prepTime}
                        onChange={(e) => setPrepTime(e.target.value)}
                        required
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-label-sm font-bold select-none">Phút</span>
                    </div>
                  </div>

                  {/* Cook Time */}
                  <div className="space-y-xs">
                    <label className="font-label-md text-on-surface-variant flex items-center gap-xs font-bold select-none">
                      <span className="material-symbols-outlined text-[18px]">outdoor_grill</span> Thời gian chế biến
                    </label>
                    <div className="relative">
                      <input 
                        className="w-full bg-white border border-outline-variant rounded-lg p-sm pr-12 focus:ring-1 focus:ring-primary outline-none text-on-surface" 
                        type="number" 
                        min="0"
                        value={cookTime}
                        onChange={(e) => setCookTime(e.target.value)}
                        required
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-label-sm font-bold select-none">Phút</span>
                    </div>
                  </div>

                  {/* Servings */}
                  <div className="space-y-xs">
                    <label className="font-label-md text-on-surface-variant flex items-center gap-xs font-bold select-none">
                      <span className="material-symbols-outlined text-[18px]">group</span> Khẩu phần
                    </label>
                    <div className="relative">
                      <input 
                        className="w-full bg-white border border-outline-variant rounded-lg p-sm pr-12 focus:ring-1 focus:ring-primary outline-none text-on-surface" 
                        type="number" 
                        min="1"
                        value={servings}
                        onChange={(e) => setServings(e.target.value)}
                        required
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-label-sm font-bold select-none">Người</span>
                    </div>
                  </div>

                  {/* Calories */}
                  <div className="space-y-xs">
                    <label className="font-label-md text-on-surface-variant flex items-center gap-xs font-bold select-none">
                      <span className="material-symbols-outlined text-[18px]">local_fire_department</span> Calories
                    </label>
                    <div className="relative">
                      <input 
                        className="w-full bg-white border border-outline-variant rounded-lg p-sm pr-12 focus:ring-1 focus:ring-primary outline-none text-on-surface" 
                        type="number" 
                        min="0"
                        value={calories}
                        onChange={(e) => setCalories(e.target.value)}
                        required
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-label-sm font-bold select-none">kcal</span>
                    </div>
                  </div>

                  {/* Difficulty */}
                  <div className="space-y-xs">
                    <label className="font-label-md text-on-surface-variant flex items-center gap-xs font-bold select-none">
                      <span className="material-symbols-outlined text-[18px]">equalizer</span> Độ khó
                    </label>
                    <select 
                      value={difficulty}
                      onChange={(e) => setDifficulty(e.target.value)}
                      className="w-full bg-white border border-outline-variant rounded-lg p-sm focus:ring-1 focus:ring-primary outline-none text-on-surface"
                    >
                      <option value="dễ">Dễ</option>
                      <option value="trung bình">Trung bình</option>
                      <option value="khó">Khó</option>
                    </select>
                  </div>
                </div>
              </section>

              {/* Tags / Category */}
              <section className="bg-surface-container-lowest p-md rounded-xl shadow-soft border border-surface-variant">
                <label className="font-label-md text-on-surface-variant mb-sm block font-bold select-none">Danh mục &amp; Phân loại</label>
                <select
                  value={selectedCategoryId}
                  onChange={(e) => setSelectedCategoryId(e.target.value)}
                  className="w-full bg-white border border-outline-variant rounded-lg p-sm focus:ring-1 focus:ring-primary outline-none text-on-surface"
                  required
                >
                  <option value="">Chọn danh mục</option>
                  {categoriesList.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </section>
            </div>
          </div>

          {/* Mobile Bottom Bar Actions */}
          <div className="fixed bottom-0 left-0 right-0 bg-white p-md border-t border-outline-variant md:hidden z-40 flex gap-sm select-none">
            <button 
              type="button" 
              onClick={() => window.history.back()}
              className="flex-1 py-sm rounded-lg border border-outline text-on-surface-variant font-label-md font-bold"
            >
              Hủy
            </button>
            <button 
              type="submit"
              disabled={submitting}
              className="flex-[2] bg-primary text-on-primary py-sm rounded-lg font-label-md font-bold disabled:opacity-80"
            >
              {submitting ? "Đang cập nhật..." : "Cập nhật"}
            </button>
          </div>
        </form>
      </main>

      <Footer />
    </div>
  );
};

export default EditRecipePage;
