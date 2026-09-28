import { Link } from "react-router-dom";
import { useSelector } from "react-redux";

const AdminSidebar = ({ activeTab, setActiveTab }) => {
  const { user } = useSelector((state) => state.auth);

  return (
    <aside className="h-full w-64 fixed left-0 top-0 bg-surface-container-low flex flex-col p-md gap-sm shadow-md z-40 select-none border-r border-outline-variant/10">
      <div className="mb-md">
        <Link to="/" className="font-headline-sm text-headline-sm font-black text-primary hover:opacity-90 block">
          CulinShare
        </Link>
      </div>
      
      {/* Admin avatar */}
      <div className="flex items-center gap-sm p-sm mb-lg bg-surface-container-high rounded-xl border border-outline-variant/15 shadow-sm">
        <img
          alt={user?.full_name || "Admin Avatar"}
          className="w-10 h-10 rounded-full object-cover border border-outline-variant"
          src={user?.avatar_url || "https://lh3.googleusercontent.com/aida-public/AB6AXuBG9O1ZQKYHNuni1zWWdQqNlphxL9M8b43LiJ8F70YjsN5UnQzqwoB9pXT4-Ur1wyFPjdC3jFitoDDdZWPiLv0_83l-Y7BWXuY1CVZLJ_3kzl4x4_3e3JaaeATzHTSQcLnqzWfNfjy8skNNxF-hvpRri4fkPPQOzCSnXwAYSE2T29gWmLfIAQBA_BFndKtfJPcyTsweoIM__Whyvc6bpWaLoYwBL7diTpn3MgiugWB-t_nFKwjCmRMPSctRregPHQJVcjvrpEZ7IA"}
        />
        <div>
          <p className="font-label-md text-label-md text-primary font-bold line-clamp-1">{user?.full_name || user?.username || "Chef Admin"}</p>
          <p className="font-label-sm text-label-sm text-on-surface-variant font-medium capitalize">{user?.role === 'admin' ? 'Quản trị viên' : 'Thành viên'}</p>
        </div>
      </div>
      
      {/* Navigation menu */}
      <nav className="flex flex-col gap-xs flex-grow">
        <a 
          onClick={(e) => { e.preventDefault(); setActiveTab('dashboard'); }}
          className={`flex items-center gap-sm p-sm rounded-lg transition-all active:scale-95 cursor-pointer ${activeTab === 'dashboard' ? 'bg-secondary-container text-on-secondary-container font-bold shadow-sm' : 'text-on-surface-variant hover:bg-surface-variant'}`} 
          href="#"
        >
          <span className="material-symbols-outlined">dashboard</span>
          <span className="font-label-md text-label-md">Dashboard</span>
        </a>
        <a 
          onClick={(e) => { e.preventDefault(); setActiveTab('users'); }}
          className={`flex items-center gap-sm p-sm rounded-lg transition-all active:scale-95 cursor-pointer ${activeTab === 'users' ? 'bg-secondary-container text-on-secondary-container font-bold shadow-sm' : 'text-on-surface-variant hover:bg-surface-variant'}`} 
          href="#"
        >
          <span className="material-symbols-outlined">person</span>
          <span className="font-label-md text-label-md">Quản lý User</span>
        </a>
        <a 
          onClick={(e) => { e.preventDefault(); setActiveTab('recipes'); }}
          className={`flex items-center gap-sm p-sm rounded-lg transition-all active:scale-95 cursor-pointer ${activeTab === 'recipes' ? 'bg-secondary-container text-on-secondary-container font-bold shadow-sm' : 'text-on-surface-variant hover:bg-surface-variant'}`} 
          href="#"
        >
          <span className="material-symbols-outlined">menu_book</span>
          <span className="font-label-md text-label-md">Quản lý Công thức</span>
        </a>
        <a 
          onClick={(e) => { e.preventDefault(); setActiveTab('approve'); }}
          className={`flex items-center gap-sm p-sm rounded-lg transition-all active:scale-95 cursor-pointer ${activeTab === 'approve' ? 'bg-secondary-container text-on-secondary-container font-bold shadow-sm' : 'text-on-surface-variant hover:bg-surface-variant'}`} 
          href="#"
        >
          <span className="material-symbols-outlined">fact_check</span>
          <span className="font-label-md text-label-md">Duyệt bài</span>
        </a>
        <a 
          onClick={(e) => { e.preventDefault(); setActiveTab('categories'); }}
          className={`flex items-center gap-sm p-sm rounded-lg transition-all active:scale-95 cursor-pointer ${activeTab === 'categories' ? 'bg-secondary-container text-on-secondary-container font-bold shadow-sm' : 'text-on-surface-variant hover:bg-surface-variant'}`} 
          href="#"
        >
          <span className="material-symbols-outlined">category</span>
          <span className="font-label-md text-label-md">Danh mục</span>
        </a>
      </nav>
    </aside>
  );
};

export default AdminSidebar;
