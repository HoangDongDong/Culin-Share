import {Link,useLocation} from 'react-router-dom';
import {useSelector} from 'react-redux';

const Icon=({name})=>{
  const paths={search:<><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4.5 4.5"/></>,fridge:<><rect x="5" y="2" width="14" height="20" rx="2"/><path d="M5 10h14M8 6v2m0 5v3"/></>,home:<><path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1Z"/></>,community:<><path d="M21 11a8 8 0 0 1-8 8H6l-4 3V11a9 9 0 0 1 18-1"/><path d="M7 10h8m-8 4h5"/></>,profile:<><circle cx="12" cy="8" r="4"/><path d="M4 21v-2a8 8 0 0 1 16 0v2"/></>};
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
};
export default function MobileNavigation(){
  const {pathname}=useLocation(),{user}=useSelector(state=>state.auth);
  const items=[{to:'/search',name:'Khám phá',icon:'search',active:pathname.startsWith('/search')||pathname.startsWith('/recipe/')||pathname.startsWith('/product/')},{to:'/fridge',name:'Tủ lạnh AI',icon:'fridge',active:pathname==='/fridge'},{to:'/',name:'Trang chủ',icon:'home',active:pathname==='/'},{to:'/community',name:'Cộng đồng',icon:'community',active:pathname.startsWith('/community')},{to:user?'/profile':'/login',name:'Cá nhân',icon:'profile',active:['/profile','/login','/register','/saved-recipes','/forgot-password','/reset-password','/admin'].includes(pathname)}];
  return <nav className="mobile-bottom-nav" aria-label="Điều hướng chính trên điện thoại">{items.map(item=><Link key={item.icon} to={item.to} aria-current={item.active?'page':undefined} className={'mobile-nav-item '+(item.active?'is-active':'')}><span className="mobile-nav-icon"><Icon name={item.icon}/></span><span>{item.name}</span></Link>)}</nav>;
}
