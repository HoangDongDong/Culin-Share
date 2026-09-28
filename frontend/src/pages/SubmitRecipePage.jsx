import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { getCategoriesApi } from "../services/categoryApi";
import { createRecipeApi } from "../services/recipeApi";

const SubmitRecipePage = () => {
  const navigate = useNavigate();
  const [categoriesList, setCategoriesList] = useState([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [ingredients, setIngredients] = useState([{ quantity: "", name: "" }]);
  const [steps, setSteps] = useState([{ instruction: "", image_url: "", image_file: null, image_preview: "" }]);
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [coverImageFile, setCoverImageFile] = useState(null);
  const [coverImagePreview, setCoverImagePreview] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [prepTime, setPrepTime] = useState(15);
  const [cookTime, setCookTime] = useState(15);
  const [servings, setServings] = useState(4);
  const [calories, setCalories] = useState(350);
  const [difficulty, setDifficulty] = useState("dễ");

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token || token === "null" || token === "undefined") {
      setShowAuthModal(true);
      return;
    }

    const fetchCats = async () => {
      try {
        const cats = await getCategoriesApi();
        setCategoriesList(cats);
        if (cats.length > 0) {
          setSelectedCategoryId(cats[0].id);
        }
      } catch (err) {
        console.error("Lỗi khi tải danh mục:", err);
      }
    };
    fetchCats();
  }, [navigate]);

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
    setSteps([...steps, { instruction: "", image_url: "", image_file: null, image_preview: "" }]);
  };

  const handleStepChange = (index, field, value) => {
    setSteps((currentSteps) => currentSteps.map((step, stepIndex) => (
      stepIndex === index ? { ...step, [field]: value } : step
    )));
  };

  const handleRemoveStep = (index) => {
    if (steps.length > 1) {
      setSteps(steps.filter((_, i) => i !== index));
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
    const token = localStorage.getItem("accessToken") || localStorage.getItem("token") || localStorage.getItem("authToken");
    if (!token) {
      alert("Vui lòng đăng nhập để đăng công thức nấu ăn!");
      navigate("/login");
      return;
    }

    setLoading(true);
    try {
      // Map ingredients to backend expected format
      const formattedIngs = ingredients
        .filter(ing => ing.name.trim() !== "")
        .map(ing => {
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
        prep_time_minutes: prepTime,
        cook_time_minutes: cookTime,
        servings,
        calories,
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

      await createRecipeApi(payload);
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        navigate("/");
      }, 2000);
    } catch (err) {
      alert(err.message || "Lỗi khi đăng công thức nấu ăn");
    } finally {
      setLoading(false);
    }
  };

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
              Bạn cần đăng nhập tài khoản CulinShare để có thể tạo và chia sẻ các công thức nấu ăn của riêng mình với cộng đồng.
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
    <div className="bg-surface text-on-surface font-body-md min-h-screen flex flex-col">
      <Header />
      
      <main className="max-w-max-width mx-auto px-margin-mobile md:px-margin-desktop py-lg flex-grow w-full">
        {/* Header Section */}
        <div className="mb-xl select-none">
          <h1 className="font-display-lg text-display-lg-mobile md:text-display-lg text-on-background mb-sm font-bold">
            Chia sẻ công thức của bạn
          </h1>
          <p className="font-body-lg text-on-surface-variant max-w-2xl">
            Hòa mình vào cộng đồng yêu bếp, nơi mỗi công thức là một câu chuyện và niềm đam mê được lan tỏa.
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-xl">
          {/* Left Column: Primary Content */}
          <div className="lg:col-span-8 space-y-lg">
            {/* Basic Info Card */}
            <section className="bg-surface-container-lowest p-md md:p-lg rounded-xl shadow-soft border border-outline-variant/10">
              <div className="space-y-gutter">
                <div>
                  <label className="block font-label-md text-label-md text-on-surface-variant mb-xs font-bold">
                    Tên món ăn
                  </label>
                  <input
                    className="w-full px-md py-2.5 bg-surface-container-lowest border border-outline-variant/50 rounded-lg focus:border-primary focus:ring-0 transition-all font-body-md outline-none text-on-surface"
                    placeholder="Ví dụ: Phở bò truyền thống"
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block font-label-md text-label-md text-on-surface-variant mb-xs font-bold">
                    Mô tả ngắn
                  </label>
                  <textarea
                    className="w-full px-md py-2.5 bg-surface-container-lowest border border-outline-variant/50 rounded-lg focus:border-primary focus:ring-0 transition-all font-body-md outline-none text-on-surface leading-relaxed"
                    placeholder="Chia sẻ một chút về nguồn gốc hoặc hương vị đặc biệt của món ăn này..."
                    rows="3"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                  ></textarea>
                </div>
              </div>
            </section>
            
            {/* Ingredients Section */}
            <section className="bg-surface-container-lowest p-md md:p-lg rounded-xl shadow-soft border border-outline-variant/10">
              <div className="flex items-center justify-between mb-gutter select-none">
                <h2 className="font-headline-sm text-headline-sm text-on-background font-bold">Nguyên liệu</h2>
                <button
                  type="button"
                  onClick={handleAddIngredient}
                  className="flex items-center gap-xs text-primary font-label-md hover:opacity-80 transition-opacity font-bold"
                >
                  <span className="material-symbols-outlined text-[20px] font-bold">add_circle</span>
                  Thêm nguyên liệu
                </button>
              </div>
              <div className="space-y-sm">
                {ingredients.map((ing, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-sm items-center group animate-in fade-in duration-200">
                    <input
                      className="col-span-4 px-md py-2.5 bg-surface-container-lowest border border-outline-variant/50 rounded-lg focus:border-primary focus:ring-0 transition-all font-body-md outline-none text-on-surface"
                      placeholder="Định lượng (vd: 500g)"
                      type="text"
                      value={ing.quantity}
                      onChange={(e) => handleIngredientChange(idx, "quantity", e.target.value)}
                      required
                    />
                    <input
                      className="col-span-7 px-md py-2.5 bg-surface-container-lowest border border-outline-variant/50 rounded-lg focus:border-primary focus:ring-0 transition-all font-body-md outline-none text-on-surface"
                      placeholder="Tên nguyên liệu (vd: Thịt bò)"
                      type="text"
                      value={ing.name}
                      onChange={(e) => handleIngredientChange(idx, "name", e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveIngredient(idx)}
                      className="col-span-1 text-on-surface-variant/40 hover:text-error transition-colors p-1 flex justify-center disabled:opacity-30"
                      disabled={ingredients.length <= 1}
                    >
                      <span className="material-symbols-outlined">delete</span>
                    </button>
                  </div>
                ))}
              </div>
            </section>
            
            {/* Preparation Steps */}
            <section className="bg-surface-container-lowest p-md md:p-lg rounded-xl shadow-soft border border-outline-variant/10">
              <div className="flex items-center justify-between mb-gutter select-none">
                <h2 className="font-headline-sm text-headline-sm text-on-background font-bold">Các bước thực hiện</h2>
                <button
                  type="button"
                  onClick={handleAddStep}
                  className="flex items-center gap-xs text-primary font-label-md hover:opacity-80 transition-opacity font-bold"
                >
                  <span className="material-symbols-outlined text-[20px] font-bold">add_circle</span>
                  Thêm bước mới
                </button>
              </div>
              
              <div className="space-y-lg">
                {steps.map((step, idx) => (
                  <div key={idx} className="step-item space-y-sm animate-in fade-in duration-300">
                    <div className="flex items-center justify-between select-none">
                      <div className="flex items-center gap-sm">
                        <div className="w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold text-label-md shadow-sm">
                          {idx + 1}
                        </div>
                        <h3 className="font-label-md text-label-md text-on-background font-bold">Mô tả bước</h3>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveStep(idx)}
                        className="text-on-surface-variant/40 hover:text-error transition-colors p-1"
                        disabled={steps.length <= 1}
                      >
                        <span className="material-symbols-outlined">close</span>
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-sm">
                      <div className="md:col-span-2">
                        <textarea
                          rows="3"
                          placeholder="Mô tả chi tiết cách thực hiện bước này..."
                          value={step.instruction}
                          onChange={(e) => handleStepChange(idx, "instruction", e.target.value)}
                          className="w-full h-full px-md py-2.5 bg-surface-container-lowest border border-outline-variant/50 rounded-lg focus:border-primary focus:ring-0 transition-all font-body-md outline-none text-on-surface leading-relaxed"
                          required
                        ></textarea>
                      </div>
                      
                      <div className="md:col-span-1 flex flex-col gap-2">
                        <input
                          className="w-full px-3 py-2 bg-surface-container-lowest border border-outline-variant/50 rounded-lg focus:border-primary focus:ring-0 transition-all font-body-md outline-none text-on-surface"
                          placeholder="Link ảnh minh họa bước"
                          type="text"
                          value={step.image_url}
                          onChange={(e) => {
                            handleStepChange(idx, "image_url", e.target.value);
                            handleStepChange(idx, "image_file", null);
                            handleStepChange(idx, "image_preview", "");
                          }}
                        />
                        <label className="flex items-center justify-center gap-2 px-3 py-2 border border-dashed border-primary/50 rounded-lg text-primary text-sm font-bold cursor-pointer hover:bg-primary/5 transition-colors">
                          <span className="material-symbols-outlined text-[18px]">upload</span>
                          Tải ảnh bước
                          <input
                            className="hidden"
                            type="file"
                            accept="image/jpeg,image/png,image/gif,image/webp"
                            onChange={(e) => handleStepFileChange(idx, e)}
                          />
                        </label>
                        {(step.image_preview || step.image_url) && (
                          <img
                            src={step.image_preview || step.image_url}
                            alt={`Bước ${idx + 1}`}
                            className="w-full h-24 object-cover rounded-lg border border-outline-variant/20"
                          />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
          
          {/* Right Column: Sidebar & Actions */}
          <div className="lg:col-span-4 space-y-lg select-none">
            {/* Cover Image URL */}
            <section className="bg-surface-container-lowest p-md rounded-xl shadow-soft border border-outline-variant/10">
              <h2 className="font-label-md text-label-md text-on-surface-variant mb-gutter font-bold">Ảnh bìa món ăn</h2>
              <input
                className="w-full px-md py-2.5 bg-surface-container-lowest border border-outline-variant/50 rounded-lg focus:border-primary focus:ring-0 transition-all font-body-md outline-none text-on-surface mb-2"
                placeholder="Dán link ảnh bìa (Unsplash, v.v.)"
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
              {(coverImagePreview || coverImageUrl) && (
                <div className="aspect-[4/3] rounded-lg overflow-hidden border border-outline-variant/20">
                  <img src={coverImagePreview || coverImageUrl} alt="Ảnh bìa xem trước" className="w-full h-full object-cover" />
                </div>
              )}
            </section>
            
            {/* Stats Card */}
            <section className="bg-surface-container-lowest p-md rounded-xl shadow-soft border border-outline-variant/10">
              <h2 className="font-label-md text-label-md text-on-surface-variant mb-gutter font-bold">Thông số chi tiết</h2>
              <div className="space-y-sm">
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant mb-1">Chuẩn bị (phút)</label>
                  <input
                    type="number"
                    value={prepTime}
                    onChange={(e) => setPrepTime(e.target.value)}
                    className="w-full px-3 py-1.5 bg-surface-container-lowest border border-outline-variant/50 rounded-lg focus:border-primary focus:ring-0 text-on-surface outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant mb-1">Chế biến (phút)</label>
                  <input
                    type="number"
                    value={cookTime}
                    onChange={(e) => setCookTime(e.target.value)}
                    className="w-full px-3 py-1.5 bg-surface-container-lowest border border-outline-variant/50 rounded-lg focus:border-primary focus:ring-0 text-on-surface outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant mb-1">Khẩu phần (người)</label>
                  <input
                    type="number"
                    value={servings}
                    onChange={(e) => setServings(e.target.value)}
                    className="w-full px-3 py-1.5 bg-surface-container-lowest border border-outline-variant/50 rounded-lg focus:border-primary focus:ring-0 text-on-surface outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant mb-1">Calories (kcal)</label>
                  <input
                    type="number"
                    value={calories}
                    onChange={(e) => setCalories(e.target.value)}
                    className="w-full px-3 py-1.5 bg-surface-container-lowest border border-outline-variant/50 rounded-lg focus:border-primary focus:ring-0 text-on-surface outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant mb-1">Độ khó</label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                    className="w-full px-3 py-1.5 bg-surface-container-lowest border border-outline-variant/50 rounded-lg focus:border-primary focus:ring-0 text-on-surface outline-none"
                  >
                    <option value="dễ">Dễ</option>
                    <option value="trung bình">Trung bình</option>
                    <option value="khó">Khó</option>
                  </select>
                </div>
              </div>
            </section>

            {/* Categories & Tags */}
            <section className="bg-surface-container-lowest p-md rounded-xl shadow-soft border border-outline-variant/10">
              <h2 className="font-label-md text-label-md text-on-surface-variant mb-sm font-bold">Phân loại & Danh mục</h2>
              <div className="space-y-sm">
                <select
                  value={selectedCategoryId}
                  onChange={(e) => setSelectedCategoryId(e.target.value)}
                  className="w-full px-md py-2.5 bg-surface-container-lowest border border-outline-variant/50 rounded-lg focus:border-primary focus:ring-0 transition-all font-body-md outline-none text-on-surface"
                >
                  <option value="">Chọn danh mục</option>
                  {categoriesList.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
            </section>
            
            {/* Final Actions */}
            <div className="space-y-sm sticky top-[100px]">
              <button
                type="submit"
                disabled={loading}
                className={`w-full py-md rounded-lg font-label-md text-lg shadow-soft transition-all font-bold flex items-center justify-center gap-2 ${
                  success ? "bg-tertiary text-white" : "bg-primary text-on-primary hover:bg-primary-container active:scale-95"
                }`}
              >
                {loading ? (
                  <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>
                ) : success ? (
                  <>
                    <span className="material-symbols-outlined">check_circle</span>
                    Công thức đã đăng!
                  </>
                ) : (
                  "Đăng công thức"
                )}
              </button>
              
              <button
                type="button"
                className="w-full bg-transparent border border-outline text-outline py-md rounded-lg font-label-md hover:bg-outline/5 transition-all font-bold"
              >
                Lưu bản nháp
              </button>
              
              <p className="text-center font-label-sm text-label-sm text-on-surface-variant px-md pt-xs leading-relaxed">
                Bằng cách đăng, bạn đồng ý với các Điều khoản cộng đồng của CulinShare.
              </p>
            </div>
          </div>
        </form>
      </main>
      
      <Footer />
    </div>
  );
};

export default SubmitRecipePage;
