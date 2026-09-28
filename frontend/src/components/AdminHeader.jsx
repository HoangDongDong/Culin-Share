import { Link } from "react-router-dom";
import NotificationBell from "./NotificationBell";

const AdminHeader = () => {
  return (
    <header className="h-16 flex justify-between items-center px-gutter bg-background border-b border-outline-variant/10 shadow-sm sticky top-0 z-30 select-none">
      <div>
        <h1 className="font-headline-sm text-headline-sm font-bold text-primary">Quản trị hệ thống</h1>
      </div>
      
      <div className="flex items-center gap-md">
        {/* Search bar */}
        <div className="relative hidden md:block">
          <span className="absolute inset-y-0 left-3 flex items-center text-on-surface-variant">
            <span className="material-symbols-outlined">search</span>
          </span>
          <input
            className="pl-10 pr-4 py-2 bg-surface-container-lowest border border-outline-variant/20 rounded-full focus:outline-none focus:border-primary text-label-md w-64 text-on-surface"
            placeholder="Tìm kiếm công thức..."
            type="text"
          />
        </div>
        
        {/* Notification */}
        <NotificationBell />
        
        <div className="h-8 w-[1px] bg-outline-variant/30"></div>
        
        {/* Profile */}
        <div className="flex items-center gap-sm">
          <span className="font-label-md text-label-md text-on-surface font-semibold hidden lg:block select-none">
            Admin Workspace
          </span>
          <div className="h-8 w-8 rounded-full overflow-hidden border border-outline-variant shadow-sm">
            <img
              alt="Admin Profile Small"
              className="w-full h-full object-cover"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuChFEgmD5OVLmaDawps1KHVro9fqcE-cu8C_HVR9Fvsuif86LEnc7ZnMeztkBp1uJLbwUxzpqj_PEj8BVcXMDQoLZ1MkXNoZCfTIwhhjAfoLV6dliSI1dUHpNHfjqLvQf-Vl7-S5UpBEarGxwWgeLDkT2nkUuSrMFH4bGSWjmsscYDFClbZnxC-TfJYAyMb8pFUu1gTsJujmrkQtE2Hl16-T7UAkSj4nvqKOcvSuBs4RXmprmCURqA27Qoom4GOY31FCUGm56IPdA"
            />
          </div>
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;
