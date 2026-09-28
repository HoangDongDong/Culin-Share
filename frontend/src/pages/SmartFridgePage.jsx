import { useState, useEffect } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import api from "../services/api";

const QUICK_INGREDIENTS = [
  "Trứng gà", "Cà chua", "Thịt heo", "Thịt bò", "Thịt gà",
  "Đậu hũ", "Tôm tươi", "Cà rốt", "Hành tây", "Nấm kim châm",
  "Khoai tây", "Bắp cải", "Rau cải", "Cá lóc", "Đậu bắp",
];

const SmartFridgePage = () => {
  const [fridgeItems, setFridgeItems] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [inputQuantity, setInputQuantity] = useState("");
  const [peopleCount, setPeopleCount] = useState(2);
  const [dishDistribution, setDishDistribution] = useState({ easy: 1, medium: 1, hard: 1 });
  const [cookingSpeed, setCookingSpeed] = useState("bình thường");
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [globalShoppingList, setGlobalShoppingList] = useState([]);
  const [activeRecipe, setActiveRecipe] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const savedItems = localStorage.getItem("fridgeItems");
    if (savedItems) {
      try { 
        const parsed = JSON.parse(savedItems);
        const normalized = parsed.map(item => typeof item === 'string' ? { name: item, quantity: '' } : item);
        setFridgeItems(normalized); 
      } catch (e) { /* ignore */ }
    }
  }, []);

  const saveToLocalStorage = (items) => localStorage.setItem("fridgeItems", JSON.stringify(items));

  const handleAddItem = (e) => {
    if (e) e.preventDefault();
    const name = inputValue.trim();
    const quantity = inputQuantity.trim();
    
    if (!name) {
      setError("Vui lòng nhập tên nguyên liệu!");
      return;
    }
    
    if (!quantity) {
      setError("Vui lòng nhập số lượng nguyên liệu!");
      return;
    }
    
    const exists = fridgeItems.some(item => item.name === name);
    if (!exists) {
      const updated = [...fridgeItems, { name, quantity }];
      setFridgeItems(updated);
      saveToLocalStorage(updated);
      setInputValue("");
      setInputQuantity("");
      setError("");
    } else {
      setError("Nguyên liệu này đã có trong tủ lạnh!");
    }
  };

  const handleQuickAdd = (itemName) => {
    const exists = fridgeItems.some(item => item.name === itemName);
    if (!exists) {
      setInputValue(itemName);
      document.getElementById("quantity-input")?.focus();
      setError("");
    } else {
      setError("Nguyên liệu này đã có trong tủ lạnh!");
    }
  };

  const handleRemoveItem = (idx) => {
    const updated = fridgeItems.filter((_, i) => i !== idx);
    setFridgeItems(updated);
    saveToLocalStorage(updated);
  };

  const handleClearFridge = () => {
    setFridgeItems([]);
    localStorage.removeItem("fridgeItems");
    setSuggestions([]);
  };

  const handleAutoDistribute = async (timeLimitMinutes, currentPeople = peopleCount) => {
    setCookingSpeed(`${timeLimitMinutes} phút`);
    
    try {
      setLoading(true);
      const res = await api.post("/api/ai/distribute-dishes", {
        peopleCount: currentPeople,
        cookingTime: timeLimitMinutes
      });
      if (res.data.success && res.data.data) {
        const { easy, medium, hard } = res.data.data;
        setDishDistribution({ easy: easy || 0, medium: medium || 0, hard: hard || 0 });
      }
    } catch (error) {
      console.error("Lỗi khi dùng AI chia món:", error);
      // Fallback logic
      let target = Math.min(6, currentPeople > 3 ? currentPeople : currentPeople + 1);
      let easy = 0, medium = 0, hard = 0, t = timeLimitMinutes;
      if (t >= 60 && currentPeople >= 3) { hard = 1; t -= 60; }
      while (t >= 30 && (easy + medium + hard) < target) { medium++; t -= 30; }
      while (t >= 15 && (easy + medium + hard) < target) { easy++; t -= 15; }
      while (t >= 15 && easy > 0) { easy--; medium++; t -= 15; }
      if (easy === 0 && medium === 0 && hard === 0) easy = 1;
      setDishDistribution({ easy, medium, hard });
    } finally {
      setLoading(false);
    }
  };

  const handleGetSuggestions = async () => {
    if (fridgeItems.length === 0) {
      setError("Vui lòng thêm ít nhất một nguyên liệu vào tủ lạnh!");
      return;
    }
    const totalDishes = dishDistribution.easy + dishDistribution.medium + dishDistribution.hard;
    if (totalDishes === 0) {
      setError("Vui lòng chọn ít nhất 1 món ăn ở phần Tùy chọn bữa ăn!");
      return;
    }
    if (totalDishes > 7) {
      setError("Vui lòng chọn tối đa 7 món ăn để AI phân tích tốt nhất!");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setSuggestions([]);
      const complexityStr = `Yêu cầu phân bổ đúng độ khó: ${dishDistribution.easy} món dễ, ${dishDistribution.medium} món trung bình, ${dishDistribution.hard} món khó.`;
      
      const response = await api.post("/api/ai/fridge-suggest", {
        ingredients: fridgeItems, peopleCount, complexity: complexityStr, cookingSpeed, dishCount: totalDishes,
      });
      if (response.data.success) {
        if (Array.isArray(response.data.data)) {
            // Old format fallback
            setSuggestions(response.data.data);
            setGlobalShoppingList([]);
        } else {
            // New format
            setSuggestions(response.data.data.recipes || []);
            setGlobalShoppingList(response.data.data.shoppingList || []);
        }
        setTimeout(() => {
          const el = document.getElementById("ai-results");
          if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 100);
      } else {
        throw new Error(response.data.message || "Không thể lấy gợi ý");
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Lỗi kết nối AI. Vui lòng thử lại!");
    } finally {
      setLoading(false);
    }
  };

  /* ── Pill button helper ── */
  const pillBtn = (isActive) =>
    `py-2 text-sm font-bold rounded-xl border transition-all whitespace-nowrap ${
      isActive
        ? "bg-primary text-white border-primary shadow-sm"
        : "bg-surface-container-low text-secondary border-outline-variant/20 hover:border-primary/40 hover:bg-primary/5"
    }`;

  // Fallback in case old array format is returned without globalShoppingList
  const allMissingIngredients = globalShoppingList.length > 0 
    ? globalShoppingList 
    : Array.from(new Set(suggestions.flatMap(recipe => recipe.additionalIngredientsNeeded || [])));

  return (
    <div className="bg-surface text-on-surface font-body-md min-h-screen flex flex-col">
      <Header />

      <main style={{ maxWidth: 1100, margin: "0 auto", width: "100%", padding: "40px 16px" }} className="flex-grow">

        {/* ═══ BANNER ═══ */}
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <p className="font-label-md text-primary uppercase font-bold" style={{ letterSpacing: 3, marginBottom: 4 }}>
            Trải nghiệm ẩm thực thông minh
          </p>
          <h1 className="font-display-lg font-bold text-on-surface" style={{ fontSize: 36, lineHeight: "44px", display: "flex", alignItems: "center", justifyContent: "center", gap: 12 }}>
            <span className="material-symbols-outlined text-primary" style={{ fontSize: 36 }}>kitchen</span>
            Tủ Lạnh Thông Minh
          </h1>
          <p className="text-secondary" style={{ fontSize: 15, lineHeight: "24px", marginTop: 8, maxWidth: 600, marginLeft: "auto", marginRight: "auto" }}>
            Nhập nguyên liệu bạn đang có, chọn các tùy chọn bữa ăn và để AI gợi ý ngay các món ngon chế biến được!
          </p>
        </div>

        {/* ═══ PHẦN 1: NHẬP NGUYÊN LIỆU ═══ */}
        <div style={{ background: "#fff", borderRadius: 16, border: "1px solid rgba(225,191,183,0.15)", padding: 24, marginBottom: 16, boxShadow: "0 4px 20px rgba(72,72,72,0.06)" }}>
          <h2 className="font-bold text-on-surface" style={{ fontSize: 18, display: "flex", alignItems: "center", gap: 8, marginBottom: 16, paddingBottom: 12, borderBottom: "1px solid rgba(225,191,183,0.15)" }}>
            <span className="material-symbols-outlined text-primary" style={{ fontSize: 22 }}>flatware</span>
            Thực phẩm trong tủ lạnh
          </h2>

          {/* Input + nút thêm */}
          <form onSubmit={handleAddItem} style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            <input
              type="text"
              placeholder="Tên nguyên liệu (VD: bắp cải)"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              style={{ flex: 2, padding: "10px 16px", borderRadius: 12, border: "1px solid rgba(225,191,183,0.3)", background: "#f5f3f3", fontSize: 14, outline: "none", color: "#1b1c1c" }}
            />
            <input
              id="quantity-input"
              type="text"
              placeholder="Số lượng (VD: 200g)"
              value={inputQuantity}
              onChange={(e) => setInputQuantity(e.target.value)}
              style={{ flex: 1, padding: "10px 16px", borderRadius: 12, border: "1px solid rgba(225,191,183,0.3)", background: "#f5f3f3", fontSize: 14, outline: "none", color: "#1b1c1c" }}
            />
            <button type="submit" style={{ background: "#ab2e10", color: "#fff", borderRadius: 12, padding: "0 18px", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 22 }}>add</span>
            </button>
          </form>

          {/* Thêm nhanh */}
          <div style={{ marginBottom: 16 }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: "#665e49", marginBottom: 6 }}>Thêm nhanh nguyên liệu:</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {QUICK_INGREDIENTS.map((item) => {
                const added = fridgeItems.some(fi => fi.name === item);
                return (
                  <button
                    key={item} type="button"
                    onClick={() => handleQuickAdd(item)}
                    disabled={added}
                    style={{
                      fontSize: 12, padding: "4px 10px", borderRadius: 8,
                      border: added ? "1px solid rgba(225,191,183,0.1)" : "1px solid rgba(225,191,183,0.2)",
                      background: added ? "rgba(228,226,226,0.3)" : "#f5f3f3",
                      color: added ? "rgba(102,94,73,0.3)" : "#665e49",
                      cursor: added ? "not-allowed" : "pointer",
                    }}
                  >
                    + {item}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Danh sách trong tủ */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#1b1c1c" }}>Trong tủ lạnh ({fridgeItems.length})</span>
            {fridgeItems.length > 0 && (
              <button onClick={handleClearFridge} style={{ fontSize: 12, fontWeight: 700, color: "#ba1a1a", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>delete_sweep</span>
                Xóa tất cả
              </button>
            )}
          </div>
          {fridgeItems.length > 0 ? (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, padding: 14, background: "#f5f3f3", borderRadius: 12, border: "1px solid rgba(225,191,183,0.1)", minHeight: 50, maxHeight: 140, overflowY: "auto" }}>
              {fridgeItems.map((item, index) => (
                <span key={index} style={{ display: "inline-flex", alignItems: "center", background: "#ffdad2", color: "#3d0700", fontSize: 13, fontWeight: 600, padding: "5px 12px", borderRadius: 8, border: "1px solid #ffb4a3" }}>
                  {item.name} {item.quantity && `(${item.quantity})`}
                  <button type="button" onClick={() => handleRemoveItem(index)} style={{ marginLeft: 8, background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", alignItems: "center" }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 14, color: "#8b1b00" }}>close</span>
                  </button>
                </span>
              ))}
            </div>
          ) : (
            <div style={{ background: "#f5f3f3", borderRadius: 12, border: "2px dashed rgba(225,191,183,0.4)", padding: "30px 16px", textAlign: "center" }}>
              <span className="material-symbols-outlined" style={{ fontSize: 28, color: "rgba(102,94,73,0.25)", display: "block", marginBottom: 4 }}>kitchen</span>
              <p style={{ fontSize: 12, color: "rgba(102,94,73,0.5)" }}>Tủ lạnh đang trống. Hãy thêm nguyên liệu bạn có!</p>
            </div>
          )}
        </div>

        {/* ═══ PHẦN 2: TÙY CHỌN BỮA ĂN ═══ */}
        <div style={{ background: "#fff", borderRadius: 16, border: "1px solid rgba(225,191,183,0.15)", padding: 24, marginBottom: 24, boxShadow: "0 4px 20px rgba(72,72,72,0.06)" }}>
          <h2 className="font-bold text-on-surface" style={{ fontSize: 18, display: "flex", alignItems: "center", gap: 8, marginBottom: 20, paddingBottom: 12, borderBottom: "1px solid rgba(225,191,183,0.15)" }}>
            <span className="material-symbols-outlined text-primary" style={{ fontSize: 22 }}>settings_suggest</span>
            Tùy chọn bữa ăn
          </h2>

          {/* 4 hàng options */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 20 }}>

            {/* Số người */}
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#1b1c1c", marginBottom: 8 }}>Số người dùng bữa:</label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 6 }}>
                {[1, 2, 3, 4, 5].map((num) => (
                  <button key={num} type="button" onClick={() => setPeopleCount(num)} className={pillBtn(peopleCount === num)}>
                    {num === 5 ? "5+" : num}
                  </button>
                ))}
              </div>
            </div>

            {/* Thời gian nấu */}
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#1b1c1c", marginBottom: 8 }}>Thời gian nấu (tự động chia món):</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {[30, 45, 60, 90].map((val) => (
                  <button 
                    key={val} 
                    type="button" 
                    onClick={() => handleAutoDistribute(val, peopleCount)} 
                    className={pillBtn(cookingSpeed === `${val} phút`)}
                    style={{ padding: "8px 0", fontSize: 12, flex: "1 1 20%", textAlign: "center" }}
                  >
                    {val}p
                  </button>
                ))}
                <input 
                  type="number" 
                  placeholder="Nhập phút"
                  value={cookingSpeed.replace(/\D/g, '') || ''}
                  onChange={(e) => setCookingSpeed(e.target.value ? `${e.target.value} phút` : "")}
                  onBlur={(e) => {
                    const val = parseInt(e.target.value, 10);
                    if (val > 0) handleAutoDistribute(val, peopleCount);
                  }}
                  style={{ flex: "1 1 30%", padding: "8px", borderRadius: 12, border: "1px solid rgba(225,191,183,0.5)", background: "#f5f3f3", fontSize: 12, outline: "none", color: "#1b1c1c", textAlign: "center", minWidth: 60 }}
                />
              </div>
            </div>

            {/* Phân bổ độ khó */}
            <div style={{ gridColumn: "span 2" }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#1b1c1c", marginBottom: 8 }}>
                Số lượng món theo độ khó (Tổng: {dishDistribution.easy + dishDistribution.medium + dishDistribution.hard} món):
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
                {/* Dễ */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#f5f3f3", borderRadius: 12, padding: "6px 12px", border: "1px solid rgba(225,191,183,0.3)" }}>
                  <span style={{ fontSize: 13, color: "#166534", fontWeight: 600 }}>Món dễ</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <button type="button" onClick={() => setDishDistribution(p => ({ ...p, easy: Math.max(0, p.easy - 1) }))} style={{ width: 24, height: 24, borderRadius: "50%", background: "#fff", border: "1px solid #ddd", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>-</button>
                    <span style={{ fontSize: 14, fontWeight: 700, minWidth: 16, textAlign: "center" }}>{dishDistribution.easy}</span>
                    <button type="button" onClick={() => setDishDistribution(p => ({ ...p, easy: p.easy + 1 }))} style={{ width: 24, height: 24, borderRadius: "50%", background: "#ab2e10", color: "#fff", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>+</button>
                  </div>
                </div>

                {/* Trung bình */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#f5f3f3", borderRadius: 12, padding: "6px 12px", border: "1px solid rgba(225,191,183,0.3)" }}>
                  <span style={{ fontSize: 13, color: "#854d0e", fontWeight: 600 }}>Trung bình</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <button type="button" onClick={() => setDishDistribution(p => ({ ...p, medium: Math.max(0, p.medium - 1) }))} style={{ width: 24, height: 24, borderRadius: "50%", background: "#fff", border: "1px solid #ddd", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>-</button>
                    <span style={{ fontSize: 14, fontWeight: 700, minWidth: 16, textAlign: "center" }}>{dishDistribution.medium}</span>
                    <button type="button" onClick={() => setDishDistribution(p => ({ ...p, medium: p.medium + 1 }))} style={{ width: 24, height: 24, borderRadius: "50%", background: "#ab2e10", color: "#fff", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>+</button>
                  </div>
                </div>

                {/* Khó */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#f5f3f3", borderRadius: 12, padding: "6px 12px", border: "1px solid rgba(225,191,183,0.3)" }}>
                  <span style={{ fontSize: 13, color: "#991b1b", fontWeight: 600 }}>Món khó</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <button type="button" onClick={() => setDishDistribution(p => ({ ...p, hard: Math.max(0, p.hard - 1) }))} style={{ width: 24, height: 24, borderRadius: "50%", background: "#fff", border: "1px solid #ddd", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>-</button>
                    <span style={{ fontSize: 14, fontWeight: 700, minWidth: 16, textAlign: "center" }}>{dishDistribution.hard}</span>
                    <button type="button" onClick={() => setDishDistribution(p => ({ ...p, hard: p.hard + 1 }))} style={{ width: 24, height: 24, borderRadius: "50%", background: "#ab2e10", color: "#fff", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>+</button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Lỗi */}
          {error && (
            <div style={{ marginTop: 16, background: "rgba(186,26,26,0.06)", border: "1px solid rgba(186,26,26,0.2)", color: "#ba1a1a", padding: 12, borderRadius: 12, fontSize: 13, display: "flex", alignItems: "center", gap: 8 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>error</span>
              {error}
            </div>
          )}

          {/* Nút gợi ý */}
          <button
            onClick={handleGetSuggestions}
            disabled={loading}
            style={{
              marginTop: 20, width: "100%", padding: "14px 0", borderRadius: 12,
              background: loading ? "rgba(171,46,16,0.5)" : "#ab2e10", color: "#fff",
              fontWeight: 700, fontSize: 15, border: "none", cursor: loading ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              boxShadow: "0 4px 12px rgba(171,46,16,0.25)", transition: "all 0.2s",
            }}
          >
            {loading ? (
              <>
                <span className="material-symbols-outlined animate-spin" style={{ fontSize: 20 }}>progress_activity</span>
                AI đang tìm kiếm công thức...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined" style={{ fontSize: 20 }}>auto_awesome</span>
                Gợi ý {dishDistribution.easy + dishDistribution.medium + dishDistribution.hard} món ngon cùng AI
              </>
            )}
          </button>
        </div>

        {/* ═══ PHẦN 3: KẾT QUẢ AI ═══ */}
        <div id="ai-results">
          {loading ? (
            <div style={{ background: "#fff", borderRadius: 16, border: "1px solid rgba(225,191,183,0.15)", padding: 32, boxShadow: "0 4px 20px rgba(72,72,72,0.06)" }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 20 }}>
                {Array.from({ length: dishDistribution.easy + dishDistribution.medium + dishDistribution.hard || 3 }).map((_, i) => (
                  <div key={i} className="animate-pulse" style={{ border: "1px solid rgba(225,191,183,0.1)", borderRadius: 14, padding: 20, background: "rgba(245,243,243,0.5)" }}>
                    <div style={{ height: 18, background: "rgba(228,226,226,0.5)", borderRadius: 6, width: "70%", marginBottom: 12 }}></div>
                    <div style={{ height: 14, background: "rgba(228,226,226,0.35)", borderRadius: 6, width: "100%", marginBottom: 8 }}></div>
                    <div style={{ height: 14, background: "rgba(228,226,226,0.35)", borderRadius: 6, width: "85%", marginBottom: 8 }}></div>
                    <div style={{ height: 14, background: "rgba(228,226,226,0.35)", borderRadius: 6, width: "60%", marginBottom: 16 }}></div>
                    <div style={{ height: 36, background: "rgba(228,226,226,0.2)", borderRadius: 10 }}></div>
                  </div>
                ))}
              </div>
              <div style={{ textAlign: "center", marginTop: 24 }}>
                <span className="material-symbols-outlined animate-spin text-primary" style={{ fontSize: 30 }}>restaurant</span>
                <p className="text-primary font-bold" style={{ fontSize: 14, marginTop: 8 }}>AI MâmNgon đang suy nghĩ và tính toán...</p>
              </div>
            </div>
          ) : suggestions.length > 0 ? (
            <div>
              {/* Header kết quả */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#fff", borderRadius: 12, padding: "12px 20px", border: "1px solid rgba(225,191,183,0.1)", marginBottom: 16, boxShadow: "0 2px 8px rgba(72,72,72,0.04)" }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: "#1b1c1c", display: "flex", alignItems: "center", gap: 6 }}>
                  <span className="material-symbols-outlined text-primary" style={{ fontSize: 20 }}>auto_awesome</span>
                  AI gợi ý {suggestions.length} món ăn từ tủ lạnh
                </span>
                <button onClick={() => setSuggestions([])} style={{ fontSize: 12, fontWeight: 700, color: "#665e49", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 14 }}>refresh</span> Xóa
                </button>
              </div>

              {/* Tổng hợp nguyên liệu cần mua thêm */}
              {allMissingIngredients.length > 0 && (
                <div style={{ background: "#fffbeb", border: "1px solid #fde68a", padding: "16px 20px", borderRadius: 12, marginBottom: 20, boxShadow: "0 2px 8px rgba(72,72,72,0.04)" }}>
                  <p style={{ fontSize: 14, fontWeight: 700, color: "#92400e", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>shopping_cart_checkout</span> 
                    Danh sách nguyên liệu cần mua thêm cho bữa ăn này:
                  </p>
                  <ul style={{ fontSize: 13, color: "#59413b", listStyle: "disc", paddingLeft: 22, lineHeight: "24px", display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "4px 16px" }}>
                    {allMissingIngredients.map((ing, idx) => <li key={idx}>{ing}</li>)}
                  </ul>
                </div>
              )}

              {/* Grid món ăn */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 20 }}>
                {suggestions.map((recipe, index) => (
                  <div key={index} style={{ background: "#fff", borderRadius: 16, border: "1px solid rgba(225,191,183,0.15)", padding: 20, boxShadow: "0 4px 20px rgba(72,72,72,0.06)", display: "flex", flexDirection: "column", transition: "all 0.2s" }}>

                    {/* Tên + Độ khó */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 8 }}>
                      <h3 className="font-display font-bold" style={{ fontSize: 17, color: "#1b1c1c", lineHeight: "24px" }}>{recipe.name}</h3>
                      <span style={{
                        fontSize: 11, padding: "3px 10px", borderRadius: 20, fontWeight: 700, textTransform: "uppercase", whiteSpace: "nowrap", flexShrink: 0,
                        background: recipe.difficulty === "dễ" ? "#dcfce7" : recipe.difficulty === "trung bình" ? "#fef9c3" : "#fecaca",
                        color: recipe.difficulty === "dễ" ? "#166534" : recipe.difficulty === "trung bình" ? "#854d0e" : "#991b1b",
                      }}>
                        {recipe.difficulty}
                      </span>
                    </div>

                    {/* Mô tả */}
                    <p style={{ fontSize: 13, color: "#665e49", marginBottom: 12, lineHeight: "20px", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                      {recipe.description}
                    </p>

                    {/* Thời gian */}
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 12, fontSize: 12, color: "rgba(102,94,73,0.7)", marginBottom: 14, paddingBottom: 12, borderBottom: "1px solid rgba(225,191,183,0.1)" }}>
                      <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 14, color: "rgba(171,46,16,0.6)" }}>hourglass_empty</span>
                        Chuẩn bị: {recipe.prepTime}p
                      </span>
                      <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 14, color: "rgba(171,46,16,0.6)" }}>local_fire_department</span>
                        Nấu: {recipe.cookTime}p
                      </span>
                      <span style={{ display: "flex", alignItems: "center", gap: 3, fontWeight: 600, color: "rgba(171,46,16,0.7)" }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 14 }}>schedule</span>
                        Tổng: {(recipe.prepTime || 0) + (recipe.cookTime || 0)}p
                      </span>
                    </div>

                    {/* Nguyên liệu */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16, flex: 1 }}>
                      <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", padding: 12, borderRadius: 12 }}>
                        <p style={{ fontSize: 12, fontWeight: 700, color: "#166534", display: "flex", alignItems: "center", gap: 4, marginBottom: 6 }}>
                          <span className="material-symbols-outlined" style={{ fontSize: 14 }}>check_circle</span>
                          Từ tủ lạnh:
                        </p>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                          {recipe.fridgeIngredientsUsed?.map((ing, idx) => (
                            <span key={idx} style={{ fontSize: 11, background: "#dcfce7", color: "#166534", padding: "2px 8px", borderRadius: 12 }}>{ing}</span>
                          ))}
                        </div>
                      </div>

                      {recipe.additionalIngredientsNeeded?.length > 0 && (
                        <div style={{ background: "#fffbeb", border: "1px solid #fde68a", padding: 12, borderRadius: 12 }}>
                          <p style={{ fontSize: 12, fontWeight: 700, color: "#92400e", display: "flex", alignItems: "center", gap: 4, marginBottom: 6 }}>
                            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>shopping_cart</span>
                            Cần mua thêm:
                          </p>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                            {recipe.additionalIngredientsNeeded.map((ing, idx) => (
                              <span key={idx} style={{ fontSize: 11, background: "#fef3c7", color: "#92400e", padding: "2px 8px", borderRadius: 12 }}>{ing}</span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Nút xem chi tiết */}
                    <button
                      onClick={() => setActiveRecipe(recipe)}
                      style={{ width: "100%", padding: "10px 0", background: "#f5f3f3", border: "1px solid rgba(225,191,183,0.25)", borderRadius: 12, color: "#ab2e10", fontWeight: 700, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, transition: "all 0.2s" }}
                      onMouseEnter={(e) => { e.target.style.background = "#ab2e10"; e.target.style.color = "#fff"; e.target.style.borderColor = "#ab2e10"; }}
                      onMouseLeave={(e) => { e.target.style.background = "#f5f3f3"; e.target.style.color = "#ab2e10"; e.target.style.borderColor = "rgba(225,191,183,0.25)"; }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 16 }}>menu_book</span>
                      Xem hướng dẫn nấu chi tiết
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* Trạng thái mặc định */
            <div style={{ background: "#fff", borderRadius: 16, border: "1px solid rgba(225,191,183,0.15)", padding: "48px 24px", textAlign: "center", boxShadow: "0 4px 20px rgba(72,72,72,0.06)", display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div style={{ width: 64, height: 64, background: "rgba(171,46,16,0.05)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 32, color: "rgba(171,46,16,0.35)" }}>auto_awesome</span>
              </div>
              <h3 className="font-display font-bold" style={{ fontSize: 20, color: "#1b1c1c", marginBottom: 6 }}>
                Kết quả gợi ý sẽ hiển thị tại đây
              </h3>
              <p style={{ fontSize: 14, color: "#665e49", maxWidth: 450, lineHeight: "22px" }}>
                Thêm nguyên liệu vào tủ lạnh, chọn tùy chọn và nhấn <strong>"Gợi ý món ngon cùng AI"</strong> để bắt đầu!
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", marginTop: 16 }}>
                {["Phản hồi siêu tốc", "Hoàn toàn miễn phí", "Hướng dẫn từng bước"].map((text) => (
                  <span key={text} style={{ fontSize: 11, border: "1px solid rgba(225,191,183,0.2)", borderRadius: 20, padding: "4px 12px", color: "rgba(102,94,73,0.5)" }}>{text}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ═══ MODAL CHI TIẾT CÔNG THỨC ═══ */}
      {activeRecipe && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.6)", backdropFilter: "blur(4px)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div style={{ background: "#fbf9f8", borderRadius: 16, border: "1px solid rgba(225,191,183,0.15)", maxWidth: 640, width: "100%", maxHeight: "88vh", overflow: "hidden", display: "flex", flexDirection: "column", boxShadow: "0 20px 50px -20px rgba(15,23,42,0.35)" }}>

            {/* Header */}
            <div style={{ background: "#f5f3f3", borderBottom: "1px solid rgba(225,191,183,0.15)", padding: "16px 24px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <span style={{ fontSize: 10, textTransform: "uppercase", fontWeight: 700, color: "#ab2e10", letterSpacing: 1.5 }}>Công thức nấu ăn do AI tạo</span>
                <h3 className="font-display font-bold" style={{ fontSize: 22, color: "#1b1c1c", marginTop: 2 }}>{activeRecipe.name}</h3>
              </div>
              <button onClick={() => setActiveRecipe(null)} style={{ background: "#fbf9f8", border: "1px solid rgba(225,191,183,0.2)", width: 32, height: 32, borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginLeft: 16 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 18, color: "#665e49" }}>close</span>
              </button>
            </div>

            {/* Body */}
            <div style={{ padding: 24, overflowY: "auto", flex: 1 }}>

              {/* Thông tin nhanh */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 20, padding: 12, background: "#f5f3f3", borderRadius: 12, fontSize: 12, fontWeight: 600, color: "#665e49" }}>
                <span style={{ background: "rgba(171,46,16,0.1)", color: "#ab2e10", padding: "4px 10px", borderRadius: 8 }}>{peopleCount} người ăn</span>
                <span style={{ padding: "4px 10px", background: "#f0eded", borderRadius: 8 }}>Độ khó: {activeRecipe.difficulty}</span>
                <span style={{ padding: "4px 10px", background: "#f0eded", borderRadius: 8 }}>Chuẩn bị: {activeRecipe.prepTime}p</span>
                <span style={{ padding: "4px 10px", background: "#f0eded", borderRadius: 8 }}>Nấu: {activeRecipe.cookTime}p</span>
                <span style={{ background: "rgba(171,46,16,0.1)", color: "#ab2e10", padding: "4px 10px", borderRadius: 8, fontWeight: 700 }}>Tổng: {(activeRecipe.prepTime || 0) + (activeRecipe.cookTime || 0)}p</span>
              </div>

              {/* Nguyên liệu */}
              <h4 style={{ fontSize: 14, fontWeight: 700, color: "#1b1c1c", display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
                <span className="material-symbols-outlined text-primary" style={{ fontSize: 18 }}>shopping_bag</span>
                Nguyên liệu cần dùng
              </h4>
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
                <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", padding: 14, borderRadius: 12 }}>
                  <p style={{ fontSize: 12, fontWeight: 700, color: "#166534", marginBottom: 6, display: "flex", alignItems: "center", gap: 4 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 14 }}>check_box</span> Từ tủ lạnh:
                  </p>
                  <ul style={{ fontSize: 13, color: "#59413b", listStyle: "disc", paddingLeft: 18, lineHeight: "22px" }}>
                    {activeRecipe.fridgeIngredientsUsed?.map((ing, idx) => <li key={idx}>{ing}</li>)}
                  </ul>
                </div>
              </div>

              {/* Các bước */}
              <h4 style={{ fontSize: 14, fontWeight: 700, color: "#1b1c1c", display: "flex", alignItems: "center", gap: 6, marginBottom: 16, paddingBottom: 8, borderBottom: "1px solid rgba(225,191,183,0.15)" }}>
                <span className="material-symbols-outlined text-primary" style={{ fontSize: 18 }}>format_list_numbered</span>
                Các bước chế biến
              </h4>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {activeRecipe.steps?.map((step, idx) => (
                  <div key={idx} style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                    <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#ab2e10", color: "#fff", fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2, boxShadow: "0 2px 4px rgba(171,46,16,0.3)" }}>
                      {idx + 1}
                    </div>
                    <p style={{ fontSize: 14, color: "#59413b", lineHeight: "22px" }}>{step}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div style={{ background: "#f5f3f3", borderTop: "1px solid rgba(225,191,183,0.15)", padding: "14px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <p style={{ fontSize: 11, color: "rgba(102,94,73,0.45)" }}>Công thức được tạo bởi Gemini AI</p>
              <button
                onClick={() => setActiveRecipe(null)}
                style={{ padding: "10px 24px", background: "#ab2e10", color: "#fff", fontWeight: 700, fontSize: 13, borderRadius: 12, border: "none", cursor: "pointer", boxShadow: "0 2px 8px rgba(171,46,16,0.3)" }}
              >
                Bắt đầu nấu nào! 🍳
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default SmartFridgePage;
