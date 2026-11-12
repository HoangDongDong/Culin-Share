import { recipePath } from "../services/seo.mjs";
import { AuthLink, useRequireLogin } from "../components/AuthPrompt";
import SearchSuggestions from '../components/SearchSuggestions';
import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import api, { getImageUrl } from "../services/api";
import { useSelector } from "react-redux";
import toast from "react-hot-toast";
import { saveRecipeApi, unsaveRecipeApi, followUserApi, unfollowUserApi } from "../services/recipeApi";

function HomeImage({src,alt,className}) {
  const [failed,setFailed]=useState(null);
  return src&&failed!==src?<img src={src} alt={alt} className={className} onError={()=>setFailed(src)}/>:<span role="img" aria-label={alt} className={className+' inline-grid place-items-center bg-stone-100 text-stone-400'}>🍽</span>;
}
const mapRecipe = recipe => ({...recipe,image:getImageUrl(recipe.cover_image_url),time:((recipe.prep_time_minutes??0)+(recipe.cook_time_minutes??0))+' phút',author:{name:recipe.author_name,avatar:getImageUrl(recipe.author_avatar)},likes:recipe.save_count});
const emptyHome={categories:[],recipes:[],chefs:[],posts:[],trends:[]};

const HomePage = () => {
  const navigate = useNavigate();
  const {user}=useSelector(state=>state.auth);
  const [searchQuery,setSearchQuery]=useState('');
  const [featuredTab,setFeaturedTab]=useState('newest');
  const [home,setHome]=useState(emptyHome),[loading,setLoading]=useState(true),[error,setError]=useState('');
  const [revision,setRevision]=useState(0),[pending,setPending]=useState({});
  const locks=useRef(new Set());
  useEffect(()=>{
    const controller=new AbortController();
    api.get('/api/home',{params:{sort:featuredTab},signal:controller.signal}).then(response=>{
      if(controller.signal.aborted)return;
      const data=response.data?.data;
      if(!data||!Object.keys(emptyHome).every(key=>Array.isArray(data[key]))){
        throw new Error('Máy chủ trả dữ liệu trang chủ không hợp lệ. Vui lòng kiểm tra cấu hình kết nối API.');
      }
      setHome(data);setError('');
    }).catch(err=>{if(!controller.signal.aborted){setHome(emptyHome);setError(err.response?.data?.message||err.message||'Không tải được dữ liệu trang chủ.');}}).finally(()=>{if(!controller.signal.aborted)setLoading(false);});
    return ()=>controller.abort();
  },[featuredTab,user?.id,revision]);
  const popularCategories=home.categories.map(category=>({...category,count:category.recipe_count+' công thức',image:getImageUrl(category.image)}));
  const featuredRecipes=home.recipes.map(mapRecipe);
  const featuredChefs=home.chefs.map(chef=>({...chef,name:chef.full_name,avatar:getImageUrl(chef.avatar_url),followers:chef.followers_count+' người theo dõi'}));
  const communityItems=home.posts.map(post=>({...post,title:post.title||post.content,author:post.author_name,avatar:getImageUrl(post.author_avatar),image:getImageUrl(post.media?.[0]?.media_url),time:new Date(post.created_at).toLocaleDateString('vi-VN'),likes:post.like_count,comments:post.comment_count}));
  const weeklyTrends=home.trends.map((recipe,index)=>({...mapRecipe(recipe),rank:index+1,views:recipe.weekly_saves+' lượt lưu trong 7 ngày'}));
  const savedRecipes=Object.fromEntries([...home.recipes,...home.trends].map(recipe=>[recipe.id,!!recipe.saved]));
  const followedChefs=Object.fromEntries(home.chefs.map(chef=>[chef.id,!!chef.followed]));
  const handleSearchSubmit=event=>{event.preventDefault();navigate(searchQuery.trim()?'/search?q='+encodeURIComponent(searchQuery.trim()):'/search');};
  const handleFilterClick=tag=>navigate('/search?category='+encodeURIComponent(tag));
  const requireLogin = useRequireLogin();
  const mutate=async(key,action,update)=>{
    if(!requireLogin()||locks.current.has(key))return;
    locks.current.add(key);setPending(current=>({...current,[key]:true}));
    try {await action();setHome(update);setRevision(value=>value+1);}
    catch(err){toast.error(err?.message||'Chưa thể lưu thay đổi. Bạn thử lại nhé.');}
    finally {locks.current.delete(key);setPending(current=>({...current,[key]:false}));}
  };
  const toggleSaveRecipe=(recipeId,event)=>{
    event.preventDefault();event.stopPropagation();
    const saved=!!savedRecipes[recipeId];
    mutate('recipe-'+recipeId,()=>saved?unsaveRecipeApi(recipeId):saveRecipeApi(recipeId),current=>{
      const update=recipe=>recipe.id===recipeId?{...recipe,saved:!saved,save_count:Math.max(0,Number(recipe.save_count)+(saved?-1:1))}:recipe;
      return {...current,recipes:current.recipes.map(update),trends:current.trends.map(update)};
    });
  };
  const toggleFollowChef=chefId=>{
    const followed=!!followedChefs[chefId];
    mutate('chef-'+chefId,()=>followed?unfollowUserApi(chefId):followUserApi(chefId),current=>({...current,chefs:current.chefs.map(chef=>chef.id===chefId?{...chef,followed:!followed,followers_count:Math.max(0,Number(chef.followers_count)+(followed?-1:1))}:chef)}));
  };

  return (
    <div className="bg-[#FAF8F5] text-stone-800 font-sans min-h-screen flex flex-col selection:bg-primary/10 selection:text-primary">
      <Header />

      <main className="flex-1 w-full pb-16">
        {/* ========================================================================= */}
        {/* HERO SECTION - SEAMLESS FULL BANNER WITH GRADIENT BLEND */}
        {/* ========================================================================= */}
        <section data-mobile-hero="true" className="relative w-full overflow-hidden border-b border-stone-200/50 bg-[#F5ECE0]">
          {/* Full Banner Background Container using exact user image */}
          <div className="absolute inset-0 z-0 pointer-events-none">
            <HomeImage
              src="/hero_banner_exact.png"
              alt="CulinShare Nấu ngon hơn mỗi ngày"
              className="w-full h-full object-cover object-center"
            />
          </div>

          {/* Content Layer */}
          <div className="relative z-10 max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 lg:py-12">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center min-h-[300px] lg:min-h-[340px]">

              {/* Left Column: Title, Subtitle, Search Bar, Quick Filters */}
              <div className="lg:col-span-7 xl:col-span-6 flex flex-col justify-center">
                <span className="font-bold text-xs uppercase tracking-[0.25em] text-[#ab2e10] mb-2 select-none">
                  BẾP NHÀ MÌNH · CULINSHARE
                </span>

                <h1 className="font-display text-4xl sm:text-5xl lg:text-[54px] font-bold text-stone-900 leading-[1.15] tracking-tight">
                  Nấu ngon hơn <br />
                  <span className="text-[#ab2e10]">mỗi ngày</span>
                </h1>

                <p className="text-stone-600 text-xs sm:text-sm md:text-base mt-3.5 max-w-lg leading-relaxed">
                  Bếp Nhà Mình – CulinShare: khám phá công thức nấu ăn ngon, dễ làm và chia sẻ kinh nghiệm cho bữa cơm gia đình.
                </p>

                {/* Search Bar */}
                <form
                  onSubmit={handleSearchSubmit}
                  className="mt-6 max-w-xl bg-white border border-stone-200/90 rounded-2xl p-2 sm:p-2.5 shadow-sm hover:border-stone-300 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/10 transition-all flex items-center gap-2"
                >
                  <div className="pl-2 sm:pl-3 text-stone-400 flex items-center pointer-events-none">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <circle cx="11" cy="11" r="8" strokeWidth="2" />
                      <path d="M21 21l-4.35-4.35" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  </div>
                  <SearchSuggestions value={searchQuery} onChange={setSearchQuery} onSelect={value=>{setSearchQuery(value);navigate('/search?q='+encodeURIComponent(value));}} inputClassName="w-full bg-transparent text-xs sm:text-sm md:text-base text-stone-800 placeholder-stone-400 outline-none"/>
                  <button
                    type="submit"
                    className="bg-[#ab2e10] hover:bg-[#8f240a] text-white px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl font-medium text-xs sm:text-sm active:scale-95 transition-all shadow-xs flex-shrink-0"
                  >
                    Tìm kiếm
                  </button>
                </form>

                <div className="flex flex-wrap gap-2 mt-5">{home.categories.slice(0,5).map(category=><button key={category.id} onClick={()=>handleFilterClick(category.name)} className="rounded-full border border-stone-200 bg-white text-stone-700 text-sm px-3.5 py-1.5 hover:text-primary">{category.name}</button>)}</div>
              </div>
              <div className="hidden lg:flex lg:col-span-5 xl:col-span-6 justify-end items-center pr-2 xl:pr-8 select-none pointer-events-none">
                <div className="text-white text-right drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)]">
                  <p className="font-display italic text-lg sm:text-xl lg:text-2xl leading-snug font-medium text-amber-50 tracking-wide">Chia sẻ<br/>yêu thương<br/>qua từng<br/>món ăn</p>
                  <p className="text-amber-200 text-2xl leading-none mt-2">♡</p>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* MAIN SPLIT LAYOUT: MAIN CONTENT (LEFT) + COMMUNITY/TRENDS SIDEBAR (RIGHT) */}
        {/* ========================================================================= */}
        <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 pt-8">
          {loading&&<p role="status" className="mb-6 text-stone-500">Đang tải dữ liệu trang chủ…</p>}
          {error&&<div role="alert" className="mb-6 rounded-xl border border-red-200 p-4 text-red-700">{error}<button className="ml-4 underline" onClick={()=>{setLoading(true);setRevision(value=>value+1);}}>Thử lại</button></div>}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

            {/* ===================================================================== */}
            {/* LEFT / CENTER MAIN COLUMN (8 cols out of 12) */}
            {/* ===================================================================== */}
            <div className="home-main-column lg:col-span-8 space-y-10">

              {/* BLOCK 1: DANH MỤC PHỔ BIẾN (8 ITEMS) */}
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-5 h-5 grid grid-cols-2 gap-0.5">
                    <div className="bg-[#ab2e10] rounded-xs"></div>
                    <div className="bg-[#ab2e10] rounded-xs"></div>
                    <div className="bg-[#ab2e10] rounded-xs"></div>
                    <div className="bg-[#ab2e10] rounded-xs"></div>
                  </div>
                  <h2 className="text-lg sm:text-xl font-bold text-stone-900 tracking-tight">
                    Danh mục phổ biến
                  </h2>
                </div>

                <div className="home-category-grid grid grid-cols-4 sm:grid-cols-8 gap-2.5 sm:gap-3">
                  {!loading&&!popularCategories.length&&<p className="text-sm text-stone-500 col-span-full">Chưa có danh mục.</p>}
                  {popularCategories.map((cat) => (
                    <Link
                      key={cat.id}
                      to={`/category/${encodeURIComponent(cat.slug)}`}
                      className="bg-white hover:bg-stone-50 border border-stone-200/80 hover:border-stone-300 rounded-2xl p-2 text-center flex flex-col items-center group shadow-2xs hover:shadow-md transition-all duration-200"
                    >
                      <div className="w-full aspect-square rounded-xl overflow-hidden bg-stone-100 mb-1.5">
                        <HomeImage
                          src={cat.image}
                          alt={cat.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                      </div>
                      <p className="font-semibold text-stone-800 text-[11px] sm:text-xs group-hover:text-[#ab2e10] transition-colors line-clamp-1">
                        {cat.name}
                      </p>
                      <span className="text-[10px] text-stone-400 whitespace-nowrap">
                        {cat.count}
                      </span>
                    </Link>
                  ))}
                </div>
              </section>

              {/* BLOCK 2: 🔥 CÔNG THỨC NỔI BẬT */}
              <section>
                <div className="home-featured-toolbar flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-lg sm:text-xl">🔥</span>
                    <h2 className="text-lg sm:text-xl font-bold text-stone-900 tracking-tight">
                      Công thức nổi bật
                    </h2>
                  </div>

                  {/* Tabs: Mới nhất | Được yêu thích | Đánh giá cao */}
                  <div className="flex items-center gap-1 sm:gap-2 self-start sm:self-auto bg-stone-100/80 p-1 rounded-xl border border-stone-200/60">
                    <button
                      onClick={() => {setLoading(true);setFeaturedTab("newest");setRevision(value=>value+1);}}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                        featuredTab === "newest"
                          ? "bg-white text-[#ab2e10] shadow-2xs"
                          : "text-stone-600 hover:text-stone-900"
                      }`}
                    >
                      Mới nhất
                    </button>
                    <button
                      onClick={() => {setLoading(true);setFeaturedTab("favorite");setRevision(value=>value+1);}}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                        featuredTab === "favorite"
                          ? "bg-white text-[#ab2e10] shadow-2xs"
                          : "text-stone-600 hover:text-stone-900"
                      }`}
                    >
                      Được yêu thích
                    </button>
                    <button
                      onClick={() => {setLoading(true);setFeaturedTab("rating");setRevision(value=>value+1);}}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                        featuredTab === "rating"
                          ? "bg-white text-[#ab2e10] shadow-2xs"
                          : "text-stone-600 hover:text-stone-900"
                      }`}
                    >
                      Đánh giá cao
                    </button>
                  </div>

                  <Link
                    to="/search"
                    className="text-xs font-semibold text-[#ab2e10] hover:underline"
                  >
                    Xem tất cả →
                  </Link>
                </div>

                {/* 4 Recipe Cards Grid */}
                <div className="home-recipe-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {!loading&&!featuredRecipes.length&&<p className="text-sm text-stone-500">Chưa có công thức được xuất bản.</p>}
                  {featuredRecipes.map((recipe) => (
                    <div
                      key={recipe.id}
                      className="bg-white rounded-2xl border border-stone-200/80 hover:border-stone-300 overflow-hidden shadow-2xs hover:shadow-md transition-all group flex flex-col"
                    >
                      <Link to={recipePath(recipe)} className="relative aspect-[16/11] overflow-hidden block">
                        <HomeImage
                          src={recipe.image}
                          alt={recipe.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                        />

                        {/* Time Pill Top Right */}
                        <div className="absolute top-2.5 right-2.5 bg-white/90 backdrop-blur-xs px-2 py-0.5 rounded-full text-[10px] font-semibold text-stone-700 shadow-2xs flex items-center gap-1 select-none">
                          <span>⏱</span> {recipe.time}
                        </div>

                        {/* Category Pill Bottom Left */}
                        <div className="absolute bottom-2.5 left-2.5 bg-[#e8ede4]/90 backdrop-blur-xs text-[#3a522f] px-2 py-0.5 rounded-full text-[10px] font-semibold shadow-2xs select-none">
                          {recipe.category}
                        </div>
                      </Link>

                      <div className="p-3.5 flex flex-col flex-1 justify-between">
                        <Link to={recipePath(recipe)} className="block">
                          <h3 className="font-bold text-stone-900 text-xs sm:text-sm group-hover:text-[#ab2e10] transition-colors line-clamp-1">
                            {recipe.title}
                          </h3>
                        </Link>

                        <div className="flex items-center justify-between mt-2.5 pt-2.5 border-t border-stone-100 text-[11px] text-stone-500">
                          {/* Author */}
                          <div className="flex items-center gap-1.5 truncate max-w-[100px]">
                            <HomeImage
                              src={recipe.author.avatar}
                              alt={recipe.author.name}
                              className="w-5 h-5 rounded-full object-cover flex-shrink-0"
                            />
                            <span className="font-medium text-stone-700 truncate">{recipe.author.name}</span>
                          </div>

                          {/* Stats & Save */}
                          <div className="flex items-center gap-2.5 flex-shrink-0">
                            <span className="flex items-center gap-1 text-stone-500 font-medium">
                              <svg className="w-3.5 h-3.5 fill-red-500 text-red-500" viewBox="0 0 24 24">
                                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                              </svg>
                              <span title="Lượt lưu công thức">{recipe.likes}</span>
                            </span>

                            <button
                              onClick={(e) => toggleSaveRecipe(recipe.id, e)}
                              title={savedRecipes[recipe.id]?"Bỏ lưu công thức":"Lưu công thức"}
                              disabled={pending["recipe-"+recipe.id]}
                              aria-pressed={!!savedRecipes[recipe.id]}
                              className="text-stone-400 hover:text-stone-800 transition-colors"
                            >
                              <svg
                                className={`w-3.5 h-3.5 ${savedRecipes[recipe.id] ? "fill-[#ab2e10] text-[#ab2e10]" : "fill-none stroke-current"}`}
                                strokeWidth="2"
                                viewBox="0 0 24 24"
                              >
                                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* BLOCK 3: 👨‍🍳 ĐẦU BẾP NỔI BẬT */}
              <section>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-lg sm:text-xl">👨‍🍳</span>
                    <h2 className="text-lg sm:text-xl font-bold text-stone-900 tracking-tight">
                      Đầu bếp nổi bật
                    </h2>
                  </div>
                  <Link to="/chefs" className="text-xs font-semibold text-[#ab2e10] hover:underline">
                    Xem tất cả →
                  </Link>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {!loading&&!featuredChefs.length&&<p className="text-sm text-stone-500">Chưa có đầu bếp đăng công thức.</p>}
                  {featuredChefs.map((chef) => (
                    <div
                      key={chef.id}
                      className="bg-white rounded-2xl border border-stone-200/80 p-4 shadow-2xs hover:shadow-md transition-all flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <HomeImage
                          src={chef.avatar}
                          alt={chef.name}
                          className="w-11 h-11 rounded-full object-cover"
                        />
                        <div>
                          <h4 className="font-bold text-xs sm:text-sm text-stone-900 leading-tight">
                            <Link to={"/chef/"+chef.id}>{chef.name}</Link>
                          </h4>
                          <p className="text-[11px] text-stone-400 mt-0.5">
                            {chef.followers}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => toggleFollowChef(chef.id)}
                        disabled={pending["chef-"+chef.id] || user?.id===chef.id}
                        className={`text-xs px-3 py-1.5 rounded-xl border transition-all active:scale-95 ${
                          followedChefs[chef.id]
                            ? "bg-stone-50 border-stone-200 text-stone-600"
                            : "bg-[#fff3f0] hover:bg-[#fde5df] border-[#f5ded5] text-[#ab2e10] font-semibold"
                        }`}
                      >
                        {user?.id===chef.id?"Bạn":followedChefs[chef.id] ? "Đang theo dõi" : "Theo dõi"}
                      </button>
                    </div>
                  ))}
                </div>
              </section>

            </div>

            {/* ===================================================================== */}
            {/* RIGHT SIDEBAR: CỘNG ĐỒNG ĐANG HOẠT ĐỘNG & XU HƯỚNG TUẦN NÀY (4 cols) */}
            {/* ===================================================================== */}
            <aside className="lg:col-span-4 space-y-6">

              {/* SIDEBAR CARD 1: 👥 CỘNG ĐỒNG ĐANG HOẠT ĐỘNG */}
              <div className="bg-[#fff9f7] border border-[#f5ded5] rounded-3xl p-5 sm:p-6 shadow-2xs">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-base text-[#ab2e10]">👥</span>
                    <h3 className="font-bold text-stone-900 text-sm sm:text-base">
                      Cộng đồng đang hoạt động
                    </h3>
                  </div>
                  <Link to="/community" className="text-xs text-[#ab2e10] hover:underline font-medium">
                    Xem tất cả →
                  </Link>
                </div>

                <div className="space-y-4">
                  {!loading&&!communityItems.length&&<p className="text-sm text-stone-500">Chưa có bài viết cộng đồng.</p>}
                  {communityItems.map((item) => (
                    <Link to={"/community/posts/"+item.id} key={item.id} className="flex gap-3 items-center">
                      <div className="w-16 h-16 rounded-xl overflow-hidden bg-stone-100 flex-shrink-0 shadow-2xs border border-stone-200/60">
                        <HomeImage
                          src={item.image}
                          alt={item.title}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        {/* Author line */}
                        <div className="flex items-center gap-1.5">
                          <HomeImage
                            src={item.avatar}
                            alt={item.author}
                            className="w-4 h-4 rounded-full object-cover flex-shrink-0"
                          />
                          <span className="text-[11px] text-stone-600 font-medium truncate">
                            {item.author}
                          </span>
                          <span className="text-stone-300">•</span>
                          <span className="text-[10px] text-stone-400 whitespace-nowrap">
                            {item.time}
                          </span>
                        </div>

                        {/* Title */}
                        <h4 className="font-semibold text-xs text-stone-800 line-clamp-1 mt-1 hover:text-[#ab2e10] transition-colors cursor-pointer">
                          {item.title}
                        </h4>

                        {/* Stats */}
                        <div className="flex items-center gap-3 mt-1.5 text-[10px] text-stone-400 font-medium">
                          <span className="flex items-center gap-1">
                            <span className="text-red-500">❤️</span> {item.likes}
                          </span>
                          <span className="flex items-center gap-1">
                            <span>💬</span> {item.comments}
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

              {/* SIDEBAR CARD 2: 📈 XU HƯỚNG TUẦN NÀY */}
              <div className="bg-white border border-stone-200/80 rounded-3xl p-5 sm:p-6 shadow-2xs">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-base text-rose-500">📈</span>
                    <h3 className="font-bold text-stone-900 text-sm sm:text-base">
                      Được lưu tuần này
                    </h3>
                  </div>
                  <Link to="/search" className="text-xs text-[#ab2e10] hover:underline font-medium">
                    Xem tất cả →
                  </Link>
                </div>

                <div className="space-y-3.5">
                  {!loading&&!weeklyTrends.length&&<p className="text-sm text-stone-500">Chưa có lượt lưu công thức trong 7 ngày qua.</p>}
                  {weeklyTrends.map((trend) => (
                    <div key={trend.id} className="flex items-center justify-between gap-3 group cursor-pointer">
                      <Link to={recipePath(trend)} className="flex items-center gap-3">
                        <span className="text-sm font-bold text-[#ab2e10] w-4">
                          #{trend.rank}
                        </span>

                        <div className="w-12 h-12 rounded-xl overflow-hidden bg-stone-100 flex-shrink-0 shadow-2xs border border-stone-200/60">
                          <HomeImage
                            src={trend.image}
                            alt={trend.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>

                        <div>
                          <h4 className="font-bold text-xs sm:text-sm text-stone-800 group-hover:text-[#ab2e10] transition-colors line-clamp-1">
                            {trend.title}
                          </h4>
                          <p className="text-[11px] text-stone-400 mt-0.5">
                            {trend.views}
                          </p>
                        </div>
                      </Link>

                      <button
                        onClick={event=>toggleSaveRecipe(trend.id,event)}
                        disabled={pending["recipe-"+trend.id]}
                        aria-pressed={!!savedRecipes[trend.id]}
                        title={savedRecipes[trend.id]?"Bỏ lưu công thức":"Lưu công thức"}
                        className="text-stone-300 hover:text-red-500 transition-colors p-1"
                      >
                        <svg className={"w-4 h-4 stroke-current "+(savedRecipes[trend.id]?"fill-[#ab2e10] text-[#ab2e10]":"fill-none")} strokeWidth="2" viewBox="0 0 24 24">
                          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>

            </aside>

          </div>
        </div>
      </main>

      <Footer />

      {/* Floating Action Button */}
      <AuthLink
        to="/submit-recipe"
        className="fixed bottom-6 right-6 w-14 h-14 bg-[#ab2e10] text-white rounded-full shadow-2xl flex items-center justify-center active:scale-95 transition-all duration-300 hover:scale-105 z-40 select-none group"
        title="Đăng công thức"
      >
        <span className="text-2xl font-bold leading-none">+</span>
      </AuthLink>
    </div>
  );
};

export default HomePage;
