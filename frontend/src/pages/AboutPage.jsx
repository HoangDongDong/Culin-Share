import {Link} from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import {ABOUT_INTRO,ABOUT_SECTIONS} from '../services/aboutContent.mjs';

export default function AboutPage(){
  return <div className="min-h-screen bg-surface flex flex-col"><Header/><main className="w-full max-w-4xl mx-auto px-4 sm:px-8 py-10 flex-1"><nav className="text-sm text-stone-600 mb-6"><Link to="/">Trang chủ</Link> / Giới thiệu</nav><p className="text-primary font-semibold mb-3">Cộng đồng yêu bếp</p><h1 className="text-3xl sm:text-4xl font-bold mb-5">Bếp Nhà Mình – CulinShare</h1><p className="text-lg text-stone-600 leading-relaxed mb-10">{ABOUT_INTRO}</p><div className="space-y-8">{ABOUT_SECTIONS.map(section=><section key={section.to} className="rounded-2xl border border-stone-200 bg-white p-5 sm:p-7"><h2 className="text-xl font-bold mb-3">{section.title}</h2><p className="text-stone-600 leading-relaxed mb-4">{section.text}</p><Link className="text-primary font-semibold underline underline-offset-4" to={section.to}>{section.label} →</Link></section>)}</div></main><Footer/></div>;
}
