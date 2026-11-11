import { useRequireLogin } from "../components/AuthPrompt";
import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useSelector } from 'react-redux';
import FridgeHistory from '../components/FridgeHistory';
import Header from "../components/Header";
import Footer from "../components/Footer";
import api, { getImageUrl } from "../services/api";

import { downloadShoppingPdf } from '../services/shoppingPdf';

const QUICK_INGREDIENTS = [
  "Trứng gà", "Cà chua", "Thịt heo", "Thịt bò", "Thịt gà",
  "Đậu hũ", "Tôm tươi", "Cà rốt", "Hành tây", "Nấm kim châm",
  "Khoai tây", "Bắp cải", "Rau cải", "Cá lóc", "Đậu bắp",
];

const recipeIngredientLabel = ingredient => {
  if (typeof ingredient === 'string') return ingredient;
  if (!ingredient || typeof ingredient.name !== 'string') return '';
  const quantity = typeof ingredient.quantity === 'number'
    ? Math.round(ingredient.quantity * 100) / 100 : ingredient.quantity;
  return [quantity, ingredient.unit, ingredient.name].filter(value => value !== undefined && value !== null && value !== '').join(' ');
};

const SmartFridgePage = ({ token }) => {
  const requireLogin = useRequireLogin();
  const draft = useLocation().state?.fridgeDraft;
  const hasSession = () => {
    const token = localStorage.getItem("token");
    return token && token !== "null" && token !== "undefined";
  };
  const [fridgeItems, setFridgeItems] = useState(() => {
    try {
      const saved = draft?.fridgeItems || JSON.parse(localStorage.getItem("fridgeItems") || "[]");
      return Array.isArray(saved) ? saved
        .map(item => typeof item === "string" ? { name: item, quantity: "" } : item)
        .filter(item => item && typeof item.name === "string") : [];
    } catch { return []; }
  });
  const [inputValue, setInputValue] = useState("");
  const [inputQuantity, setInputQuantity] = useState("");
  const [peopleCount, setPeopleCount] = useState(() => {
    if (draft?.peopleCount) return draft.peopleCount;
    const saved = localStorage.getItem("fridgePeopleCount");
    return saved ? Number(saved) : 2;
  });
  const [dishDistribution, setDishDistribution] = useState(() => {
    if (draft?.dishDistribution) return draft.dishDistribution;
    try {
      const saved = JSON.parse(localStorage.getItem("fridgeDishDistribution"));
      if (saved && typeof saved === "object") return saved;
    } catch { /* Use the default distribution for invalid browser data. */ }
    return { easy: 1, medium: 1, hard: 1 };
  });
  const [cookingSpeed, setCookingSpeed] = useState(() => {
    if (draft?.cookingSpeed) return draft.cookingSpeed;
    return localStorage.getItem("fridgeCookingSpeed") || "bình thường";
  });
  const [loading, setLoading] = useState(false);
  const [pdfBusy,setPdfBusy]=useState(false),[pdfError,setPdfError]=useState('');
  const [suggestions, setSuggestions] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("fridgeSuggestions") || "[]");
      return Array.isArray(saved) ? saved : [];
    } catch {
      return [];
    }
  });
  const [globalShoppingList, setGlobalShoppingList] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("fridgeShoppingList") || "[]");
      return Array.isArray(saved) ? saved : [];
    } catch {
      return [];
    }
  });
  const [activeRecipe, setActiveRecipe] = useState(null);
  const [error, setError] = useState("");
  const [modalCheckedIngredients, setModalCheckedIngredients] = useState([]);
  const [historyRevision, setHistoryRevision] = useState(0);
  const [restoredAt, setRestoredAt] = useState(null);

  // Tự động lưu cấu hình bữa ăn vào localStorage
  useEffect(() => {
    localStorage.setItem("fridgePeopleCount", String(peopleCount));
  }, [peopleCount]);

  useEffect(() => {
    localStorage.setItem("fridgeDishDistribution", JSON.stringify(dishDistribution));
  }, [dishDistribution]);

  useEffect(() => {
    localStorage.setItem("fridgeCookingSpeed", cookingSpeed);
  }, [cookingSpeed]);

  // Hỗ trợ nút Back của trình duyệt khi modal hướng dẫn nấu đang mở
  const handleOpenRecipeModal = (recipe) => {
    setModalCheckedIngredients([]);
    setActiveRecipe(recipe);
    window.history.pushState({ fridgeModal: true }, "");
  };

  const handleCloseRecipeModal = () => {
    if (window.history.state?.fridgeModal) {
      window.history.back();
    } else {
      setActiveRecipe(null);
    }
  };

  useEffect(() => {
    const handlePopState = () => {
      // Khi nhấn nút Back trên trình duyệt trong lúc modal mở, chỉ đóng modal
      setActiveRecipe(null);
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const clearSuggestions = () => {
    setSuggestions([]);
    setGlobalShoppingList([]);
    localStorage.removeItem("fridgeSuggestions");
    localStorage.removeItem("fridgeShoppingList");
    setRestoredAt(null);
  };

  const restoreHistory = entry => {
    const config = entry.request_config;
    const result = entry.result;
    setFridgeItems(config.ingredients);
    setPeopleCount(config.peopleCount);
    setCookingSpeed(config.cookingSpeed);
    // Older API clients did not send the difficulty distribution.
    setDishDistribution(config.dishDistribution || { easy: config.dishCount, medium: 0, hard: 0 });
    setSuggestions(result.recipes);
    setGlobalShoppingList(result.shoppingList || []);
    setActiveRecipe(null);
    setModalCheckedIngredients([]);
    setRestoredAt(entry.created_at);
    setError('');
    setPdfError('');
    try {
      localStorage.setItem('fridgeItems', JSON.stringify(config.ingredients));
      localStorage.setItem('fridgeSuggestions', JSON.stringify(result.recipes));
      localStorage.setItem('fridgeShoppingList', JSON.stringify(result.shoppingList || []));
    } catch {
      setError('Đã mở lịch sử. Trình duyệt chưa lưu được bản xem gần nhất.');
    }
    document.getElementById('ai-results')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const inferUnit = (name, qty) => {
    const n = (name || '').toLowerCase();
    if (n.includes('trung') || n.includes('trứng') || n.includes('cà chua') || n.includes('ớt') || n.includes('chanh')) return 'quả';
    if (n.includes('đậu hũ') || n.includes('dau hu') || n.includes('đậu phụ')) return 'bìa';
    if (n.includes('tỏi')) return 'tép';
    if (n.includes('hành')) return 'nhánh';
    if (n.includes('nước tương') || n.includes('dầu ăn') || n.includes('nước mắm') || n.includes('dấm') || n.includes('giấm')) return 'muỗng canh';
    if (n.includes('đường') || n.includes('muối') || n.includes('tiêu') || n.includes('hạt nêm') || n.includes('bột ngọt')) return 'muỗng cà phê';
    if (n.includes('nước lọc') || n.includes('nước dùng') || n.includes('sữa')) {
      if (Number(qty) <= 10) return 'muỗng canh';
      return 'ml';
    }
    if (n.includes('thịt') || n.includes('cá') || n.includes('tôm') || n.includes('nấm') || n.includes('mực') || n.includes('bột') || n.includes('bắp cải') || n.includes('khoai')) {
      if (Number(qty) >= 20) return 'g';
    }
    return '';
  };

  const formatIngredientDisplay = (raw) => {
    if (!raw || typeof raw !== 'string') return raw;
    // Dạng 1: "Tên: Số lượng Unit" (ví dụ: "Đậu hũ trắng: 8" hoặc "Thịt heo xay: 100 g")
    const colonMatch = raw.match(/^([^:]+):\s*([\d.,]+)\s*(.*)$/);
    if (colonMatch) {
      const [, name, qty, rawUnit] = colonMatch;
      const unit = rawUnit.trim() || inferUnit(name, qty);
      return `${qty}${unit ? ` ${unit}` : ''} ${name}`.trim();
    }
    // Dạng 2: "Số lượng Unit Tên"
    const prefixMatch = raw.match(/^([\d.,]+)\s*([a-zA-ZÀ-ỹ]*)\s+(.+)$/);
    if (prefixMatch) {
      const [, qty, possibleUnit, name] = prefixMatch;
      if (!possibleUnit || possibleUnit.length > 10) {
        const unit = inferUnit(name || possibleUnit, qty);
        return `${qty}${unit ? ` ${unit}` : ''} ${possibleUnit ? `${possibleUnit} ${name || ''}` : name}`.trim();
      }
    }
    return raw;
  };

  const toggleModalIngredient = (idx) => {
    setModalCheckedIngredients(prev =>
      prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]
    );
  };

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
    clearSuggestions();
    setActiveRecipe(null);
  };

  const handleAutoDistribute = async (timeLimitMinutes, currentPeople = peopleCount) => {
    setCookingSpeed(`${timeLimitMinutes} phút`);

    if (hasSession()) {
      try {
        setLoading(true);
        const res = await api.post("/api/ai/distribute-dishes", {
          peopleCount: currentPeople,
          cookingTime: timeLimitMinutes
        });
        if (res.data.success && res.data.data) {
          const { easy, medium, hard } = res.data.data;
          setDishDistribution({ easy: easy || 0, medium: medium || 0, hard: hard || 0 });
          return;
        }
      } catch (error) {
        if (error.response?.status === 401) return;
        console.error("Lỗi khi dùng AI chia món:", error);
      } finally {
        setLoading(false);
      }
    }
    const target = Math.min(6, currentPeople > 3 ? currentPeople : currentPeople + 1);
    let easy = 0, medium = 0, hard = 0, t = timeLimitMinutes;
    if (t >= 60 && currentPeople >= 3) { hard = 1; t -= 60; }
    while (t >= 30 && (easy + medium + hard) < target) { medium++; t -= 30; }
    while (t >= 15 && (easy + medium + hard) < target) { easy++; t -= 15; }
    while (t >= 15 && easy > 0) { easy--; medium++; t -= 15; }
    if (easy === 0 && medium === 0 && hard === 0) easy = 1;
    setDishDistribution({ easy, medium, hard });
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
    if (!requireLogin({
      message: "Đăng nhập để nhận gợi ý món ăn từ tủ lạnh.",
      fridgeDraft: { fridgeItems, peopleCount, dishDistribution, cookingSpeed },
    })) return;

    try {
      setLoading(true);
      setError("");
      setSuggestions([]);
      setGlobalShoppingList([]);
      setActiveRecipe(null);
      const complexityStr = `Yêu cầu phân bổ đúng độ khó: ${dishDistribution.easy} món dễ, ${dishDistribution.medium} món trung bình, ${dishDistribution.hard} món khó.`;
      
      const response = await api.post("/api/ai/fridge-suggest", {
        ingredients: fridgeItems, peopleCount, complexity: complexityStr, cookingSpeed, dishCount: totalDishes, dishDistribution,
      });
      if (localStorage.getItem('token') !== token) return;
      if (response.data.success) {
        let loadedSuggestions = [];
        let loadedShoppingList = [];
        if (Array.isArray(response.data.data)) {
            // Old format fallback
            loadedSuggestions = response.data.data;
            loadedShoppingList = [];
        } else {
            // New format
            loadedSuggestions = response.data.data.recipes || [];
            loadedShoppingList = response.data.data.shoppingList || [];
        }
        setSuggestions(loadedSuggestions);
        setGlobalShoppingList(loadedShoppingList);
        setRestoredAt(null);
        setHistoryRevision(value => value + 1);
        try {
          localStorage.setItem("fridgeSuggestions", JSON.stringify(loadedSuggestions));
          localStorage.setItem("fridgeShoppingList", JSON.stringify(loadedShoppingList));
        } catch (e) {
          console.warn("Lỗi lưu gợi ý vào localStorage:", e);
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

      <main className="smart-fridge-main flex-grow w-full px-6 sm:px-10 md:px-14 lg:px-20 xl:px-24 py-10">

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
          <form className="mobile-fridge-add" onSubmit={handleAddItem} style={{ display: "flex", gap: 8, marginBottom: 16 }}>
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
          <div className="mobile-meal-options" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 20 }}>

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
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 200px), 1fr))", gap: 12 }}>
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

        {token && <FridgeHistory key={`${token}:${historyRevision}`} token={token} onRestore={restoreHistory} disabled={loading} />}

        {/* ═══ PHẦN 3: KẾT QUẢ AI ═══ */}
        <div id="ai-results">
          {restoredAt && <p role="status" className="text-sm text-primary mb-3">Đang xem lần gợi ý ngày {new Date(restoredAt).toLocaleString('vi-VN')}.</p>}
          {loading ? (
            <div style={{ background: "#fff", borderRadius: 16, border: "1px solid rgba(225,191,183,0.15)", padding: 32, boxShadow: "0 4px 20px rgba(72,72,72,0.06)" }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 280px), 1fr))", gap: 20 }}>
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
                  Gợi ý {suggestions.length} món ăn từ tủ lạnh
                  {suggestions.some(recipe => recipe.source === "culinshare") && (
                    <span className="text-primary"> · Ưu tiên công thức CulinShare</span>
                  )}
                </span>
                <button onClick={clearSuggestions} style={{ fontSize: 12, fontWeight: 700, color: "#665e49", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 14 }}>refresh</span> Xóa
                </button>
              </div>

              <p className="text-xs text-secondary mb-4 px-1">Gia vị cơ bản như muối, đường, nước mắm, nước tương, hạt tiêu, dầu ăn, hạt nêm, bột ngọt và nước lọc được coi là có sẵn, không tính vào nguyên liệu cần mua thêm.</p>
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <button type="button" className="px-4 py-3 rounded-xl bg-primary text-white disabled:opacity-50" disabled={pdfBusy||!allMissingIngredients.length} onClick={async()=>{setPdfBusy(true);setPdfError('');try{await downloadShoppingPdf({items:allMissingIngredients.map(formatIngredientDisplay),recipes:suggestions,peopleCount:suggestions[0]?.servings||peopleCount});}catch(error){setPdfError(error.message||'Chưa tải được PDF. Bạn thử lại nhé.');}finally{setPdfBusy(false);}}}>{pdfBusy?'Đang tạo PDF…':'Tải danh sách đi chợ PDF'}</button>
                {!allMissingIngredients.length&&<span className="text-sm">Bạn không cần mua thêm nguyên liệu.</span>}
                {pdfError&&<p role="alert" className="text-red-700">{pdfError}</p>}
              </div>
              {/* Tổng hợp nguyên liệu cần mua thêm */}
              {allMissingIngredients.length > 0 && (
                <div style={{ background: "#fffbeb", border: "1px solid #fde68a", padding: "16px 20px", borderRadius: 12, marginBottom: 20, boxShadow: "0 2px 8px rgba(72,72,72,0.04)" }}>
                  <p style={{ fontSize: 14, fontWeight: 700, color: "#92400e", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>shopping_cart_checkout</span> 
                    Danh sách nguyên liệu cần mua thêm cho bữa ăn này:
                  </p>
                  <ul style={{ fontSize: 13, color: "#59413b", listStyle: "disc", paddingLeft: 22, lineHeight: "24px", display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "6px 20px" }}>
                    {allMissingIngredients.map((ing, idx) => (
                      <li key={idx} className="font-medium text-amber-950">
                        {formatIngredientDisplay(ing)}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Grid món ăn */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 320px), 1fr))", gap: 20 }}>
                {suggestions.map((recipe, index) => (
                  <div key={recipe.recipeId ? `recipe-${recipe.recipeId}` : `ai-${index}`} style={{ background: "#fff", borderRadius: 16, border: "1px solid rgba(225,191,183,0.15)", padding: 20, boxShadow: "0 4px 20px rgba(72,72,72,0.06)", display: "flex", flexDirection: "column", transition: "all 0.2s" }}>

                    {recipe.source === "culinshare" ? (
                      <>
                        {recipe.coverImageUrl && (
                          <Link to={`/recipe/${recipe.recipeId}`}>
                            <img src={getImageUrl(recipe.coverImageUrl)} alt={recipe.name} loading="lazy" className="w-full h-40 object-cover rounded-xl mb-3" />
                          </Link>
                        )}
                        <div className="flex flex-wrap gap-2 mb-2 text-xs font-bold">
                          <span className="rounded-full bg-primary/10 text-primary px-2 py-1">Có trên CulinShare</span>
                          {recipe.matchType === "rag" && <span className="rounded-full bg-green-50 text-green-800 px-2 py-1">Tìm bằng RAG</span>}
                          {recipe.matchType === "similar" && <span className="rounded-full bg-amber-50 text-amber-800 px-2 py-1">Công thức tương tự</span>}
                        </div>
                        <p className="text-xs text-secondary mb-2">Bởi {recipe.authorName || "Thành viên CulinShare"}</p>
                        {recipe.totalIngredientCount > 0 && (
                          <p className="text-xs text-primary font-bold mb-2" title="Mức khớp loại nguyên liệu do AI đối chiếu trong ngữ cảnh công thức truy xuất. Cần kiểm tra lại nếu tên nhập chưa rõ; định lượng thiếu được tính riêng.">
                            Có khoảng {recipe.matchedIngredientCount}/{recipe.totalIngredientCount} loại nguyên liệu · Khớp {Math.round(recipe.ingredientCoverage * 100)}%
                          </p>
                        )}
                        {recipe.matchType === "ingredients" && <p className="text-xs text-secondary mb-2">Đề xuất từ nguyên liệu trong tủ lạnh của bạn.</p>}
                        {recipe.matchType === "similar" && <p className="text-xs text-secondary mb-2">Phù hợp với gợi ý: {recipe.suggestedName}</p>}
                        <p className="text-xs text-secondary mb-2">
                          {recipe.quantityNeedsReview ? "Công thức chưa có khẩu phần gốc; cần kiểm tra định lượng." : `Nguyên liệu đã quy đổi cho ${recipe.servings} người. Xem khẩu phần gốc trong bài viết.`}
                        </p>
                      </>
                    ) : <span className="text-xs text-secondary mb-2">Gợi ý từ AI</span>}

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
                    <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16, flex: 1 }}>
                      {recipe.ingredients?.length > 0 && (
                        <div className="bg-surface-container-low border border-outline-variant/20 rounded-xl p-3">
                          <p className="text-xs font-bold text-on-surface mb-2 flex items-center gap-1"><span className="material-symbols-outlined text-sm">restaurant_menu</span>Nguyên liệu món ăn:</p>
                          <ul className="flex flex-wrap gap-1.5 text-xs text-secondary">
                            {recipe.ingredients.map((ingredient, index) => <li key={index} className="bg-white rounded-lg px-2 py-1 border border-outline-variant/15">{recipeIngredientLabel(ingredient)}</li>)}
                          </ul>
                        </div>
                      )}
                      <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", padding: 12, borderRadius: 12 }}>
                        <p style={{ fontSize: 12, fontWeight: 700, color: "#166534", display: "flex", alignItems: "center", gap: 4, marginBottom: 6 }}>
                          <span className="material-symbols-outlined" style={{ fontSize: 14 }}>check_circle</span>
                          Từ tủ lạnh:
                        </p>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                          {!recipe.fridgeIngredientsUsed?.length && <span className="text-xs text-secondary">Chưa xác định được nguyên liệu có sẵn phù hợp.</span>}
                          {recipe.fridgeIngredientsUsed?.map((ing, idx) => (
                            <span key={idx} style={{ fontSize: 12, background: "#dcfce7", color: "#166534", padding: "3px 10px", borderRadius: 10, fontWeight: 600 }}>
                              {formatIngredientDisplay(ing)}
                            </span>
                          ))}
                        </div>
                      </div>

                      {recipe.additionalIngredientsNeeded?.length > 0 && (
                        <div style={{ background: "#fffbeb", border: "1px solid #fde68a", padding: 12, borderRadius: 12 }}>
                          <p style={{ fontSize: 12, fontWeight: 700, color: "#92400e", display: "flex", alignItems: "center", gap: 4, marginBottom: 6 }}>
                            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>shopping_cart</span>
                            Cần mua thêm:
                          </p>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                            {recipe.additionalIngredientsNeeded.map((ing, idx) => (
                              <span key={idx} style={{ fontSize: 12, background: "#fef3c7", color: "#92400e", padding: "3px 10px", borderRadius: 10, fontWeight: 600 }}>
                                {formatIngredientDisplay(ing)}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Nút xem chi tiết */}
                    {recipe.source === "culinshare" ? (
                      <Link to={`/recipe/${recipe.recipeId}`} className="w-full py-3 bg-primary text-white rounded-xl text-center font-bold text-sm flex items-center justify-center gap-2 shadow-sm hover:bg-primary/90 transition-all">
                        <span className="material-symbols-outlined text-base">menu_book</span>
                        Xem công thức trên CulinShare
                      </Link>
                    ) : (
                      <button
                        onClick={() => handleOpenRecipeModal(recipe)}
                        style={{ width: "100%", padding: "11px 0", background: "#f5f3f3", border: "1px solid rgba(225,191,183,0.3)", borderRadius: 12, color: "#ab2e10", fontWeight: 700, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, transition: "all 0.2s" }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = "#ab2e10"; e.currentTarget.style.color = "#fff"; e.currentTarget.style.borderColor = "#ab2e10"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = "#f5f3f3"; e.currentTarget.style.color = "#ab2e10"; e.currentTarget.style.borderColor = "rgba(225,191,183,0.3)"; }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>menu_book</span>
                        Xem hướng dẫn nấu chi tiết
                      </button>
                    )}
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

      {/* ═══ MODAL CHI TIẾT CÔNG THỨC (FORMAT NHƯ RECIPEDETAILPAGE) ═══ */}
      {activeRecipe && (
        <div 
          onClick={handleCloseRecipeModal}
          style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.6)", backdropFilter: "blur(4px)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            style={{ background: "#fbf9f8", borderRadius: 20, border: "1px solid rgba(225,191,183,0.2)", maxWidth: 680, width: "100%", maxHeight: "90vh", overflow: "hidden", display: "flex", flexDirection: "column", boxShadow: "0 25px 50px -12px rgba(15,23,42,0.4)" }}
          >

            {/* Header */}
            <div style={{ background: "#f5f3f3", borderBottom: "1px solid rgba(225,191,183,0.2)", padding: "18px 24px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2.5 py-0.5 bg-primary/10 text-primary rounded-full text-xs font-bold uppercase tracking-wider">
                    Gợi ý từ AI
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${
                    activeRecipe.difficulty === "dễ" ? "bg-green-100 text-green-800" : activeRecipe.difficulty === "trung bình" ? "bg-amber-100 text-amber-800" : "bg-red-100 text-red-800"
                  }`}>
                    {activeRecipe.difficulty}
                  </span>
                </div>
                <h3 className="font-display font-bold text-2xl text-on-surface mt-1">{activeRecipe.name}</h3>
                <p className="text-xs text-on-surface-variant mt-1">{activeRecipe.description}</p>
              </div>
              <button
                onClick={handleCloseRecipeModal}
                className="w-8 h-8 rounded-full bg-white border border-outline-variant/30 flex items-center justify-center text-secondary hover:text-primary transition-colors flex-shrink-0 ml-4 shadow-sm"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            {/* Body */}
            <div style={{ padding: 24, overflowY: "auto", flex: 1 }}>

              {/* Thông số món ăn */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6 p-3.5 bg-surface-container-low rounded-xl text-xs font-semibold text-secondary">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-base">group</span>
                  <span>{peopleCount} người ăn</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-base">hourglass_empty</span>
                  <span>Chuẩn bị: {activeRecipe.prepTime}p</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-base">local_fire_department</span>
                  <span>Nấu: {activeRecipe.cookTime}p</span>
                </div>
                <div className="flex items-center gap-2 text-primary font-bold">
                  <span className="material-symbols-outlined text-base">schedule</span>
                  <span>Tổng: {(activeRecipe.prepTime || 0) + (activeRecipe.cookTime || 0)}p</span>
                </div>
              </div>

              {/* Nguyên liệu Section - chuẩn format RecipeDetailPage */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-xl font-bold">restaurant_menu</span>
                    <h4 className="font-headline-sm font-bold text-base text-on-surface">Nguyên liệu cần chuẩn bị</h4>
                  </div>
                  <span className="text-xs text-on-surface-variant">Tích chọn khi đã chuẩn bị xong</span>
                </div>

                <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/15 shadow-sm space-y-4">
                  {activeRecipe.pantryIngredients?.length > 0 && <div>
                    <p className="text-xs font-bold text-secondary uppercase tracking-wide mb-2">Gia vị cơ bản có sẵn ({activeRecipe.pantryIngredients.length})</p>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-secondary">
                      {activeRecipe.pantryIngredients.map((ingredient, index) => <li key={index} className="p-2 rounded-lg bg-surface-container-low">{recipeIngredientLabel(ingredient)}</li>)}
                    </ul>
                  </div>}
                  {/* Nguyên liệu từ tủ lạnh */}
                  {activeRecipe.fridgeIngredientsUsed?.length > 0 && (
                    <div>
                      <p className="text-xs font-bold text-green-700 uppercase tracking-wide flex items-center gap-1.5 mb-2">
                        <span className="material-symbols-outlined text-sm">check_circle</span>
                        Có sẵn trong tủ lạnh ({activeRecipe.fridgeIngredientsUsed.length})
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {activeRecipe.fridgeIngredientsUsed.map((ing, idx) => {
                          const key = `fridge-${idx}`;
                          const isChecked = modalCheckedIngredients.includes(key);
                          const formatted = formatIngredientDisplay(ing);
                          return (
                            <label key={key} className="flex items-center gap-2.5 cursor-pointer p-2 rounded-lg hover:bg-surface-container transition-colors select-none">
                              <input
                                type="checkbox"
                                className="hidden"
                                checked={isChecked}
                                onChange={() => toggleModalIngredient(key)}
                              />
                              <span className={`w-4 h-4 border-2 rounded flex items-center justify-center transition-colors flex-shrink-0 ${
                                isChecked ? "bg-primary border-primary text-white" : "border-outline-variant"
                              }`}>
                                {isChecked && <span className="material-symbols-outlined text-[12px] font-bold">check</span>}
                              </span>
                              <span className={`text-sm ${isChecked ? "line-through opacity-50 text-on-surface-variant" : "text-on-surface font-medium"}`}>
                                {formatted}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Nguyên liệu cần mua thêm */}
                  {activeRecipe.additionalIngredientsNeeded?.length > 0 && (
                    <div className={activeRecipe.fridgeIngredientsUsed?.length > 0 ? "pt-3 border-t border-outline-variant/15" : ""}>
                      <p className="text-xs font-bold text-amber-800 uppercase tracking-wide flex items-center gap-1.5 mb-2">
                        <span className="material-symbols-outlined text-sm">shopping_cart</span>
                        Cần mua / chuẩn bị thêm ({activeRecipe.additionalIngredientsNeeded.length})
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {activeRecipe.additionalIngredientsNeeded.map((ing, idx) => {
                          const key = `missing-${idx}`;
                          const isChecked = modalCheckedIngredients.includes(key);
                          const formatted = formatIngredientDisplay(ing);
                          return (
                            <label key={key} className="flex items-center gap-2.5 cursor-pointer p-2 rounded-lg hover:bg-surface-container transition-colors select-none">
                              <input
                                type="checkbox"
                                className="hidden"
                                checked={isChecked}
                                onChange={() => toggleModalIngredient(key)}
                              />
                              <span className={`w-4 h-4 border-2 rounded flex items-center justify-center transition-colors flex-shrink-0 ${
                                isChecked ? "bg-primary border-primary text-white" : "border-outline-variant"
                              }`}>
                                {isChecked && <span className="material-symbols-outlined text-[12px] font-bold">check</span>}
                              </span>
                              <span className={`text-sm ${isChecked ? "line-through opacity-50 text-on-surface-variant" : "text-on-surface font-medium"}`}>
                                {formatted}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Các bước chế biến - format card từng bước giống RecipeDetailPage */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="material-symbols-outlined text-primary text-xl font-bold">cooking</span>
                  <h4 className="font-headline-sm font-bold text-base text-on-surface">Các bước chế biến</h4>
                </div>

                <div className="space-y-3">
                  {activeRecipe.steps?.map((step, idx) => (
                    <div key={idx} className="flex gap-4 p-4 rounded-xl border border-outline-variant/15 bg-surface-container-lowest hover:bg-surface-container-low transition-all">
                      <div className="w-10 h-10 rounded-full bg-primary text-white font-bold flex items-center justify-center flex-shrink-0 text-sm shadow-sm mt-0.5">
                        {idx + 1}
                      </div>
                      <div className="flex-grow">
                        <h5 className="text-xs font-bold text-primary uppercase tracking-wider mb-1">
                          Bước {idx + 1}
                        </h5>
                        <p className="text-sm text-on-surface leading-relaxed">{step}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div style={{ background: "#f5f3f3", borderTop: "1px solid rgba(225,191,183,0.15)", padding: "14px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <p style={{ fontSize: 11, color: "rgba(102,94,73,0.5)" }}>Công thức gợi ý theo tủ lạnh thông minh CulinShare</p>
              <button
                onClick={handleCloseRecipeModal}
                className="px-6 py-2.5 bg-primary text-white font-bold text-sm rounded-xl hover:bg-primary/90 transition-all shadow-md active:scale-95 flex items-center gap-2"
              >
                <span>Bắt đầu nấu ngay</span> 🍳
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default function SmartFridge() {
  const token = useSelector(state => state.auth.token);
  return <SmartFridgePage key={token || 'guest'} token={token} />;
}
