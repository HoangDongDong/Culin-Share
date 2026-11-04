import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import RecipeCard from "../components/RecipeCard";
import { getCategoriesApi } from "../services/categoryApi";
import api from "../services/api";
import SearchSuggestions from "../components/SearchSuggestions";

const SearchPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const paramsKey=searchParams.toString();
  const q=searchParams.get('q')||'';
  const selectedCategories=(searchParams.get('category')||'').split(',').filter(Boolean);
  const selectedDifficulty=searchParams.get('difficulty')||'all';
  const sortBy=searchParams.get('sort')||'newest';
  const currentPage=Math.max(1,Number(searchParams.get('page'))||1);
  const [searchQuery,setSearchQuery]=useState(q);
  const [dbRecipes,setDbRecipes]=useState([]),[dbCategories,setDbCategories]=useState([]);
  const [meta,setMeta]=useState({total:0,totalPages:0}),[loading,setLoading]=useState(true),[error,setError]=useState('');
  const [filtersOpen,setFiltersOpen]=useState(false);
  const [revision,setRevision]=useState(0);
  const update=(values)=>{setRevision(value=>value+1);const next=new URLSearchParams(searchParams);next.delete('page');for(const [key,value] of Object.entries(values)){if(value===undefined||value===''||value==='all')next.delete(key);else next.set(key,String(value));}setSearchParams(next);};
  useEffect(()=>{getCategoriesApi().then(setDbCategories).catch(()=>setDbCategories([]));},[]);
  useEffect(()=>{const timer=setTimeout(()=>setSearchQuery(q),0);return()=>clearTimeout(timer);},[q]);
  useEffect(()=>{
    const controller=new AbortController();
    api.get('/api/recipes',{params:{...Object.fromEntries(new URLSearchParams(paramsKey)),limit:6},signal:controller.signal}).then(response=>{setDbRecipes(response.data.data);setMeta(response.data.meta);setError('');}).catch(err=>{if(!controller.signal.aborted){setDbRecipes([]);setMeta({total:0,totalPages:0});setError(err.response?.data?.message||'Không tải được kết quả.');}}).finally(()=>{if(!controller.signal.aborted)setLoading(false);});
    return ()=>controller.abort();
  },[paramsKey,revision]);
  const handleCategoryChange=category=>{setLoading(true);update({category:(selectedCategories.includes(category)?selectedCategories.filter(value=>value!==category):[...selectedCategories,category]).join(',')});};
  const handleSearchSubmit=event=>{event.preventDefault();setLoading(true);update({q:searchQuery.trim()});};
  const resetFilters=()=>{setSearchParams({});setSearchQuery('');};
  const displayedRecipes=dbRecipes,totalPages=meta.totalPages;
  const setCurrentPage=value=>{setLoading(true);update({page:typeof value==='function'?value(currentPage):value});};

  return (
    <div className="search-page bg-surface text-on-surface font-body-md min-h-screen flex flex-col">
      <Header />
      
      {/* Hero Section */}
      <section className="bg-transparent pt-4 pb-6 select-none">
        <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-xs mb-md text-label-sm font-label-sm text-on-surface-variant">
            <Link to="/" className="hover:text-primary">Trang chủ</Link>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span className="text-primary font-bold">Khám phá công thức</span>
          </nav>
          
          <div className="grid md:grid-cols-2 gap-lg items-center">
            <div>
              <h1 className="font-display-lg text-display-lg text-on-surface mb-md font-bold">
                Tìm cảm hứng cho bữa tối tiếp theo
              </h1>
              <form onSubmit={handleSearchSubmit} className="relative max-w-lg">
                <SearchSuggestions value={searchQuery} onChange={setSearchQuery} onSelect={value=>{setSearchQuery(value);setLoading(true);update({q:value});}}/>
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant">
                  search
                </span>
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-primary text-on-primary px-md py-2.5 rounded-lg font-label-md hover:opacity-90 transition-all font-bold"
                >
                  Tìm kiếm
                </button>
              </form>
            </div>
            
            <div className="hidden md:block relative h-[300px] rounded-2xl overflow-hidden shadow-md">
              <img
                className="w-full h-full object-cover"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAffFMQq_0Q67H-vnKJ0E5blK0Rqt6ar7t--bR-Ud9VgGfdCpVu-cORUjZCUVcji-5dNi9kcUiivQoTCM-uqvdSgVeb1TF7keQcy-jcClgSSwQ82LZTWkZjk3YA3PKPSwFmXMgUof_7_3CYQhEFsr0abNyY-SF9hFW81PLwqjViY3pM6mB87X3hMu0rWPGZo_RtG2jrttzdJQe1xou7iTueHBMPjrRSgiaUIABNqq0qqaMUl_8v5X9oidqbHjf_6y4oj-1im_JrvA"
                alt="Table setup"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="max-w-[1360px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 flex-grow flex flex-col md:flex-row gap-lg">
        {/* Filter Sidebar */}
        <aside className="w-full md:w-64 flex-shrink-0 select-none">
          <button type="button" className="md:hidden w-full border rounded-xl p-3 mb-3" aria-expanded={filtersOpen} onClick={()=>setFiltersOpen(value=>!value)}>Bộ lọc {filtersOpen?"▲":"▼"}</button>
          <div className={(filtersOpen?"block ":"hidden md:block ")+"md:sticky top-24 space-y-lg bg-surface-container-lowest p-md rounded-xl border border-outline-variant/15 shadow-sm"}>
            
            {/* Categories */}
            <div>
              <h3 className="font-headline-sm text-headline-sm text-on-surface mb-md font-bold flex items-center gap-xs">
                <span className="material-symbols-outlined text-[20px] text-primary">category</span>
                Danh mục
              </h3>
              <div className="space-y-sm max-h-48 overflow-y-auto pr-xs">
                {loading ? (
                  <p className="text-xs text-on-surface-variant font-bold">Đang tải...</p>
                ) : (
                  dbCategories.map((cat) => (
                    <label key={cat.id} className="flex items-center gap-sm cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={selectedCategories.includes(cat.name)}
                        onChange={() => handleCategoryChange(cat.name)}
                        className="w-5 h-5 border-outline-variant text-primary rounded focus:ring-primary focus:outline-none"
                      />
                      <span className="font-body-md text-on-surface-variant group-hover:text-primary transition-colors">
                        {cat.name}
                      </span>
                    </label>
                  ))
                )}
              </div>
            </div>
            
            <fieldset className="border-t pt-4"><legend className="font-bold">Tổng thời gian (phút)</legend><div className="grid grid-cols-2 gap-2">{['minTime','maxTime'].map((key,index)=><label key={key} className="text-sm">{index?'Tối đa':'Tối thiểu'}<input aria-label={index?'Thời gian tối đa':'Thời gian tối thiểu'} type="number" min="0" max="10080" value={searchParams.get(key)||''} onChange={event=>{setLoading(true);update({[key]:event.target.value});}} className="w-full min-w-0 border rounded-lg p-2"/></label>)}</div></fieldset>
            <fieldset className="border-t pt-4"><legend className="font-bold">Năng lượng (kcal/khẩu phần)</legend><div className="grid grid-cols-2 gap-2">{['minCalories','maxCalories'].map((key,index)=><label key={key} className="text-sm">{index?'Tối đa':'Tối thiểu'}<input aria-label={index?'Calo tối đa':'Calo tối thiểu'} type="number" min="0" max="100000" value={searchParams.get(key)||''} onChange={event=>{setLoading(true);update({[key]:event.target.value});}} className="w-full min-w-0 border rounded-lg p-2"/></label>)}</div></fieldset>

            {/* Difficulty */}
            <div className="border-t border-outline-variant/15 pt-md">
              <h3 className="font-headline-sm text-headline-sm text-on-surface mb-md font-bold flex items-center gap-xs">
                <span className="material-symbols-outlined text-[20px] text-primary">fitness_center</span>
                Độ khó
              </h3>
              <div className="flex flex-wrap gap-xs">
                {["all", "dễ", "trung bình", "khó"].map((diff) => (
                  <button
                    key={diff}
                    onClick={() => { setLoading(true);update({difficulty:diff}); }}
                    className={`px-3 py-1.5 rounded-full border text-label-md font-label-md transition-all font-bold ${
                      selectedDifficulty === diff
                        ? "border-primary bg-primary-container/10 text-primary"
                        : "border-outline-variant text-secondary hover:bg-secondary-container hover:text-on-secondary-container"
                    }`}
                  >
                    {diff === "all" ? "Tất cả" : diff}
                  </button>
                ))}
              </div>
            </div>

            {/* Reset Filter Button */}
            <button
              onClick={resetFilters}
              className="w-full mt-md py-2.5 bg-outline-variant/10 text-secondary hover:bg-primary/5 hover:text-primary font-label-md font-bold rounded-xl transition-all border border-transparent hover:border-primary/25"
            >
              Xoá bộ lọc
            </button>
          </div>
        </aside>

        {/* Results Grid Area */}
        <section className="flex-grow min-w-0">
          {error&&<p role="alert" className="p-4 mb-4 rounded-xl bg-red-50 text-red-700">{error}</p>}
          {/* Header & Sort */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-sm mb-lg pb-md border-b border-outline-variant/10 select-none">
            <p className="text-on-surface-variant font-label-md text-label-md font-bold">
              Tìm thấy <span className="text-primary">{meta.total}</span> công thức nấu ăn
            </p>
            <div className="flex items-center gap-sm">
              <span className="text-label-md font-label-md text-secondary font-bold whitespace-nowrap">Sắp xếp:</span>
              <select
                value={sortBy}
                onChange={(e) => { setLoading(true);update({sort:e.target.value}); }}
                className="bg-surface-container-lowest border border-outline-variant text-on-surface text-label-md rounded-lg p-2 outline-none focus:border-primary font-bold shadow-sm"
              >
                <option value="newest">Mới nhất</option>
                <option value="rating">Đánh giá cao</option>
              </select>
            </div>
          </div>

          {/* Recipe List */}
          {loading ? (
            <div className="mobile-recipe-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter">
              {Array.from({ length: 6 }).map((_, idx) => (
                <div key={idx} className="bg-surface-container-lowest rounded-2xl h-96 animate-pulse border border-outline-variant/10 shadow-sm flex flex-col p-4">
                  <div className="bg-surface-variant w-full h-48 rounded-xl mb-4"></div>
                  <div className="bg-surface-variant w-1/3 h-4 rounded mb-2"></div>
                  <div className="bg-surface-variant w-3/4 h-6 rounded mb-2"></div>
                  <div className="bg-surface-variant w-full h-12 rounded mt-auto"></div>
                </div>
              ))}
            </div>
          ) : displayedRecipes.length > 0 ? (
            <div className="mobile-recipe-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter">
              {displayedRecipes.map((recipe) => (
                <RecipeCard key={recipe.id} recipe={recipe} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-surface-container-lowest rounded-2xl border border-dashed border-outline-variant/30 select-none">
              <span className="material-symbols-outlined text-[48px] text-outline-variant animate-bounce mb-md">sentiment_dissatisfied</span>
              <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold mb-xs">Không tìm thấy công thức</h3>
              <p className="text-on-surface-variant text-body-md max-w-sm mx-auto">
                Thử tìm kiếm với từ khoá khác hoặc xoá bớt các bộ lọc để có thêm kết quả gợi ý.
              </p>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-xs mt-xl select-none">
              <button
                aria-label="Trang trước" disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => prev - 1)}
                className="p-2 hover:bg-surface-variant rounded-full text-on-surface-variant disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
              >
                <span className="material-symbols-outlined">chevron_left</span>
              </button>
              {Array.from({length:Math.min(5,totalPages)},(_,offset)=>Math.max(1,Math.min(currentPage-2,totalPages-4))+offset).map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-9 h-9 flex items-center justify-center rounded-full text-label-md font-bold transition-all ${
                    currentPage === page
                      ? "bg-primary text-on-primary shadow-md"
                      : "hover:bg-surface-variant text-on-surface-variant"
                  }`}
                >
                  {page}
                </button>
              ))}
              <button
                aria-label="Trang sau" disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage(prev => prev + 1)}
                className="p-2 hover:bg-surface-variant rounded-full text-on-surface-variant disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
              >
                <span className="material-symbols-outlined">chevron_right</span>
              </button>
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default SearchPage;
