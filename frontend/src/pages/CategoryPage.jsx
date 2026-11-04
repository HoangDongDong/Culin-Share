import {useEffect,useState} from 'react';
import {Link,useParams,useSearchParams} from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import RecipeCard from '../components/RecipeCard';
import api from '../services/api';
import {applySeo,categorySeo,routeSeo} from '../services/seo.mjs';

export default function CategoryPage(){
  const {slug}=useParams();const [params]=useSearchParams();
  const page=Math.max(1,Math.min(100000,Number.parseInt(params.get('page'))||1));
  const [state,setState]=useState({loading:true,category:null,recipes:[],pages:0,error:''});
  useEffect(()=>{
    const controller=new AbortController();
    (async()=>{
      try{
        const {data:response}=await api.get('/api/categories',{signal:controller.signal});
        const category=response.data.find(item=>item.slug===slug);
        if(!category)throw Error('Không tìm thấy danh mục.');
        const {data:result}=await api.get('/api/recipes',{params:{category:slug,page,limit:12},signal:controller.signal});
        if(!controller.signal.aborted)setState({loading:false,category,recipes:result.data,pages:result.meta.totalPages,error:''});
      }catch(error){if(!controller.signal.aborted)setState({loading:false,category:null,recipes:[],pages:0,error:error.message||'Không tải được danh mục.'});}
    })();return()=>controller.abort();
  },[slug,page]);
  useEffect(()=>{
    if(state.category?.slug===slug)applySeo({...categorySeo(state.category),noindex:params.toString()!==''});
    else if(!state.loading)applySeo({...routeSeo('/category/'+encodeURIComponent(slug)),noindex:true});
  },[state.category,state.loading,slug,params]);
  const category=state.category?.slug===slug?state.category:null;
  return <div className="bg-surface min-h-screen flex flex-col"><Header/><main className="max-w-7xl mx-auto w-full px-4 py-8 flex-1"><nav className="mb-4 text-sm"><Link to="/">Trang chủ</Link> / <Link to="/search">Công thức</Link> / {category?.name||'Danh mục'}</nav><h1 className="text-3xl font-bold mb-3">{category?.name||'Công thức theo danh mục'}</h1>{category?.description&&<p className="mb-6 text-stone-600">{category.description}</p>}{state.loading&&<p role="status">Đang tải danh mục…</p>}{state.error&&<p role="alert">{state.error}</p>}<div className="mobile-recipe-grid grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">{state.recipes.map(recipe=><RecipeCard key={recipe.id} recipe={recipe}/>)}</div>{!state.loading&&!state.error&&!state.recipes.length&&<p>Chưa có công thức công khai trong danh mục này.</p>}<nav aria-label="Phân trang danh mục" className="flex justify-center gap-6 mt-8">{page>1&&<Link to={`?page=${page-1}`}>← Trang trước</Link>}{page<state.pages&&<Link to={`?page=${page+1}`}>Trang sau →</Link>}</nav></main><Footer/></div>;
}
