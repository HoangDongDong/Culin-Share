import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AdminSidebar from "../components/AdminSidebar";
import AdminHeader from "../components/AdminHeader";
import api from "../services/api";
import {
  getAdminUsersApi,
  deleteAdminUserApi,
  updateAdminUserRoleApi,
  getAdminRecipesApi,
  updateAdminRecipeStatusApi,
  deleteAdminRecipeApi,
  createAdminCategoryApi,
  deleteAdminCategoryApi
} from "../services/recipeApi";
import { getCategoriesApi } from "../services/categoryApi";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from "recharts";

const COLORS = ["#ab2e10", "#0284c7", "#059669", "#d97706", "#7c3aed", "#ec4899", "#6b7280"];
const DIFFICULTY_COLORS = {
  "dễ": "#059669",
  "trung bình": "#d97706",
  "khó": "#ab2e10"
};

const AdminDashboardPage = () => {
  const navigate = useNavigate();
  
  // Tab control
  const [activeTab, setActiveTab] = useState("dashboard");

  // Stats State
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  // Users Tab State
  const [users, setUsers] = useState([]);
  const [usersSearch, setUsersSearch] = useState("");

  // Recipes Tab State
  const [recipes, setRecipes] = useState([]);
  const [recipesSearch, setRecipesSearch] = useState("");

  // Pending Recipes State
  const [pendingRecipes, setPendingRecipes] = useState([]);

  // Categories Tab State
  const [categoriesList, setCategoriesList] = useState([]);
  const [newCatName, setNewCatName] = useState("");
  const [newCatDesc, setNewCatDesc] = useState("");
  const [newCatImg, setNewCatImg] = useState("");

  // Trigger Toast Alert
  const triggerToast = (msg) => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
    }, 3000);
  };

  // 1. Fetch Stats for Dashboard Tab
  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await api.get("/api/admin/stats");
      if (response.data.success) {
        setStats(response.data.data);
      } else {
        throw new Error(response.data.message || "Không thể lấy dữ liệu thống kê");
      }
    } catch (err) {
      console.error("Lỗi lấy dữ liệu thống kê:", err);
      setError(err.message || "Lỗi kết nối server");
    } finally {
      setLoading(false);
    }
  };

  // 2. Fetch Users Tab Data
  const loadUsersData = async () => {
    try {
      setLoading(true);
      const data = await getAdminUsersApi();
      setUsers(data);
    } catch (err) {
      console.error(err);
      setError("Không thể tải danh sách người dùng");
    } finally {
      setLoading(false);
    }
  };

  // 3. Fetch Recipes Tab Data
  const loadRecipesData = async () => {
    try {
      setLoading(true);
      const data = await getAdminRecipesApi();
      setRecipes(data);
    } catch (err) {
      console.error(err);
      setError("Không thể tải danh sách công thức");
    } finally {
      setLoading(false);
    }
  };

  // 4. Fetch Pending Recipes (Approval Tab & Dashboard bottom table)
  const loadPendingRecipesData = async () => {
    try {
      setLoading(true);
      const data = await getAdminRecipesApi("pending");
      setPendingRecipes(data);
    } catch (err) {
      console.error(err);
      setError("Không thể tải danh sách công thức chờ duyệt");
    } finally {
      setLoading(false);
    }
  };

  // 5. Fetch Categories Data
  const loadCategoriesData = async () => {
    try {
      setLoading(true);
      const data = await getCategoriesApi();
      setCategoriesList(data);
    } catch (err) {
      console.error(err);
      setError("Không thể tải danh sách danh mục");
    } finally {
      setLoading(false);
    }
  };

  // Initial Load (Dashboard & Pending List)
  useEffect(() => {
    fetchStats();
    loadPendingRecipesData();
  }, []);

  // Fetch data on Tab switch
  useEffect(() => {
    setError("");
    if (activeTab === "dashboard") {
      fetchStats();
      loadPendingRecipesData();
    } else if (activeTab === "users") {
      loadUsersData();
    } else if (activeTab === "recipes") {
      loadRecipesData();
    } else if (activeTab === "approve") {
      loadPendingRecipesData();
    } else if (activeTab === "categories") {
      loadCategoriesData();
    }
  }, [activeTab]);

  // ========================
  // ACTION HANDLERS
  // ========================

  // User Actions
  const handleToggleRole = async (id, currentRole) => {
    const newRole = currentRole === "admin" ? "user" : "admin";
    try {
      await updateAdminUserRoleApi(id, newRole);
      triggerToast(`Đã thay đổi vai trò người dùng sang ${newRole}!`);
      loadUsersData();
    } catch (err) {
      alert(err.message || "Lỗi khi thay đổi vai trò");
    }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa người dùng này? Thao tác này sẽ xóa toàn bộ dữ liệu liên quan và không thể phục hồi!")) {
      return;
    }
    try {
      await deleteAdminUserApi(id);
      triggerToast("Xóa người dùng thành công!");
      loadUsersData();
    } catch (err) {
      alert(err.message || "Lỗi khi xóa người dùng");
    }
  };

  // Recipe Actions
  const handleDeleteRecipe = async (id) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa công thức nấu ăn này?")) {
      return;
    }
    try {
      await deleteAdminRecipeApi(id);
      triggerToast("Đã xóa công thức nấu ăn thành công!");
      if (activeTab === "recipes") {
        loadRecipesData();
      } else {
        loadPendingRecipesData();
      }
    } catch (err) {
      alert(err.message || "Lỗi khi xóa công thức");
    }
  };

  // Approval Actions
  const handleApprove = async (id) => {
    try {
      await updateAdminRecipeStatusApi(id, "published");
      triggerToast("Phê duyệt công thức thành công! Đã công khai trên CulinShare.");
      loadPendingRecipesData();
      fetchStats(); // Update stats
    } catch (err) {
      alert(err.message || "Lỗi khi phê duyệt");
    }
  };

  const handleReject = async (id) => {
    if (!window.confirm("Bạn có chắc chắn muốn từ chối công thức này? Thao tác này sẽ xóa công thức khỏi danh sách chờ duyệt.")) {
      return;
    }
    try {
      await deleteAdminRecipeApi(id);
      triggerToast("Đã từ chối và xóa công thức nấu ăn!");
      loadPendingRecipesData();
      fetchStats(); // Update stats
    } catch (err) {
      alert(err.message || "Lỗi khi từ chối");
    }
  };

  // Category Actions
  const handleCreateCategory = async (e) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    try {
      await createAdminCategoryApi({
        name: newCatName,
        description: newCatDesc,
        imageUrl: newCatImg || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c"
      });
      triggerToast("Đã thêm danh mục mới thành công!");
      setNewCatName("");
      setNewCatDesc("");
      setNewCatImg("");
      loadCategoriesData();
    } catch (err) {
      alert(err.message || "Lỗi khi tạo danh mục");
    }
  };

  const handleDeleteCategory = async (id) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa danh mục này? Thao tác này có thể ảnh hưởng đến các công thức đang liên kết.")) {
      return;
    }
    try {
      await deleteAdminCategoryApi(id);
      triggerToast("Đã xóa danh mục thành công!");
      loadCategoriesData();
    } catch (err) {
      alert(err.message || "Lỗi khi xóa danh mục");
    }
  };

  // Charts data mapping
  const recipeData = stats?.recipeStats?.map(item => ({
    name: item.month,
    "Số công thức": item.count
  })) || [];

  const aiLogsData = stats?.aiLogsStats?.map(item => ({
    name: item.month,
    "Lượt dùng AI": item.count
  })) || [];

  const preferenceData = stats?.preferenceStats?.slice(0, 7) || [];
  const difficultyData = stats?.difficultyStats?.map(item => ({
    name: item.difficulty.charAt(0).toUpperCase() + item.difficulty.slice(1),
    value: item.count
  })) || [];

  // Filters search matching
  const filteredUsers = users.filter(u => 
    u.full_name?.toLowerCase().includes(usersSearch.toLowerCase()) ||
    u.username?.toLowerCase().includes(usersSearch.toLowerCase()) ||
    u.email?.toLowerCase().includes(usersSearch.toLowerCase())
  );

  const filteredRecipes = recipes.filter(r => 
    r.title?.toLowerCase().includes(recipesSearch.toLowerCase()) ||
    r.author_name?.toLowerCase().includes(recipesSearch.toLowerCase())
  );

  return (
    <div className="bg-surface text-on-surface font-body-md min-h-screen flex">
      {/* Toast Alert */}
      {showToast && (
        <div className="fixed top-20 right-8 z-[100] animate-in fade-in slide-in-from-right-10 duration-300">
          <div className="bg-tertiary-container text-on-tertiary-container px-md py-sm rounded-xl shadow-soft flex items-center gap-sm border border-tertiary font-label-md font-bold">
            <span className="material-symbols-outlined font-bold">check_circle</span>
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <AdminSidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      {/* Main Container */}
      <div className="ml-64 flex-grow flex flex-col min-h-screen">
        <AdminHeader />
        
        <main className="p-gutter max-w-max-width mx-auto w-full flex-grow">
          {error && (
            <div className="mb-md bg-error-container/30 border border-error text-error p-md rounded-xl text-sm flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">error</span>
              {error}
            </div>
          )}

          {/* ════════════════════════════════════════
              TAB 1: DASHBOARD (CHARTS & SUMMARY)
              ════════════════════════════════════════ */}
          {activeTab === "dashboard" && (
            <>
              {/* Statistics Bento Grid */}
              <section className="grid grid-cols-1 md:grid-cols-3 gap-md mb-lg select-none">
                <div className="bg-surface-container-lowest p-md rounded-xl recipe-card-shadow flex items-center justify-between border-l-4 border-primary border-t border-r border-b border-outline-variant/15">
                  <div>
                    <p className="text-on-surface-variant font-label-md text-label-md uppercase tracking-wider mb-xs font-bold">Tổng Người Dùng</p>
                    <p className="text-headline-md text-on-surface font-bold" style={{ fontFamily: "var(--font-family-sans, sans-serif)" }}>
                      {loading ? "..." : (stats?.summary?.totalUsers?.toLocaleString() || "0")}
                    </p>
                    <p className="text-tertiary font-label-sm text-label-sm mt-xs flex items-center gap-1 font-bold">
                      <span className="material-symbols-outlined text-[14px]">trending_up</span>
                      Dữ liệu thời gian thực
                    </p>
                  </div>
                  <div className="bg-primary-fixed p-sm rounded-full text-primary shadow-inner">
                    <span className="material-symbols-outlined text-3xl font-bold">group</span>
                  </div>
                </div>
                
                <div className="bg-surface-container-lowest p-md rounded-xl recipe-card-shadow flex items-center justify-between border-l-4 border-tertiary border-t border-r border-b border-outline-variant/15">
                  <div>
                    <p className="text-on-surface-variant font-label-md text-label-md uppercase tracking-wider mb-xs font-bold">Tổng Công Thức</p>
                    <p className="text-headline-md text-on-surface font-bold" style={{ fontFamily: "var(--font-family-sans, sans-serif)" }}>
                      {loading ? "..." : (stats?.summary?.totalRecipes?.toLocaleString() || "0")}
                    </p>
                    <p className="text-tertiary font-label-sm text-label-sm mt-xs flex items-center gap-1 font-bold">
                      <span className="material-symbols-outlined text-[14px]">trending_up</span>
                      Dữ liệu thời gian thực
                    </p>
                  </div>
                  <div className="bg-tertiary-fixed p-sm rounded-full text-tertiary shadow-inner">
                    <span className="material-symbols-outlined text-3xl font-bold">restaurant</span>
                  </div>
                </div>
                
                <div className="bg-surface-container-lowest p-md rounded-xl recipe-card-shadow flex items-center justify-between border-l-4 border-error border-t border-r border-b border-outline-variant/15 cursor-pointer" onClick={() => setActiveTab("approve")}>
                  <div>
                    <p className="text-on-surface-variant font-label-md text-label-md uppercase tracking-wider mb-xs font-bold">Chờ Duyệt</p>
                    <p className="text-headline-md text-on-surface font-bold" style={{ fontFamily: "var(--font-family-sans, sans-serif)" }}>{pendingRecipes.length}</p>
                    <p className="text-error font-label-sm text-label-sm mt-xs font-bold">Bấm để duyệt ngay</p>
                  </div>
                  <div className="bg-error-container p-sm rounded-full text-error shadow-inner">
                    <span className="material-symbols-outlined text-3xl font-bold">pending_actions</span>
                  </div>
                </div>
              </section>

              <h2 className="font-headline-sm text-headline-sm text-on-surface font-bold mb-md select-none">Biểu đồ thống kê hoạt động & AI</h2>

              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-md mb-lg">
                  <div className="bg-surface-container-lowest p-md rounded-xl h-[360px] animate-pulse border border-outline-variant/15 flex flex-col justify-center items-center">
                    <span className="material-symbols-outlined text-[32px] text-outline-variant animate-spin">progress_activity</span>
                    <p className="text-on-surface-variant text-sm mt-2 font-bold">Đang tải biểu đồ...</p>
                  </div>
                  <div className="bg-surface-container-lowest p-md rounded-xl h-[360px] animate-pulse border border-outline-variant/15 flex flex-col justify-center items-center">
                    <span className="material-symbols-outlined text-[32px] text-outline-variant animate-spin">progress_activity</span>
                    <p className="text-on-surface-variant text-sm mt-2 font-bold">Đang tải biểu đồ...</p>
                  </div>
                </div>
              ) : (
                <>
                  <section className="grid grid-cols-1 lg:grid-cols-2 gap-md mb-lg">
                    {/* Chart 1: Công thức mới */}
                    <div className="bg-surface-container-lowest p-md rounded-xl recipe-card-shadow border border-outline-variant/15 flex flex-col">
                      <h3 className="font-headline-sm text-[16px] text-on-surface font-bold mb-md select-none flex items-center gap-1">
                        <span className="material-symbols-outlined text-primary text-[20px]">calendar_month</span>
                        Công thức mới theo tháng
                      </h3>
                      <div className="w-full h-[300px]">
                        {recipeData.length > 0 ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={recipeData} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="rgba(225,191,183,0.15)" />
                              <XAxis dataKey="name" stroke="#665e49" fontSize={11} fontWeight={600} />
                              <YAxis stroke="#665e49" fontSize={11} fontWeight={600} />
                              <Tooltip contentStyle={{ background: "#fff", border: "1px solid rgba(225,191,183,0.2)", borderRadius: 12 }} />
                              <Legend wrapperStyle={{ fontSize: 12, fontWeight: 700 }} />
                              <Line type="monotone" dataKey="Số công thức" stroke="#ab2e10" strokeWidth={3} dot={{ r: 4, stroke: "#ab2e10", strokeWidth: 2, fill: "#fff" }} activeDot={{ r: 6 }} />
                            </LineChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="h-full flex items-center justify-center text-on-surface-variant text-sm font-bold">Không có dữ liệu bài viết mới</div>
                        )}
                      </div>
                    </div>

                    {/* Chart 2: AI Logs */}
                    <div className="bg-surface-container-lowest p-md rounded-xl recipe-card-shadow border border-outline-variant/15 flex flex-col">
                      <h3 className="font-headline-sm text-[16px] text-on-surface font-bold mb-md select-none flex items-center gap-1">
                        <span className="material-symbols-outlined text-tertiary text-[20px]">auto_awesome</span>
                        Lượt sử dụng AI Tủ lạnh ảo
                      </h3>
                      <div className="w-full h-[300px]">
                        {aiLogsData.length > 0 ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={aiLogsData} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="rgba(225,191,183,0.15)" />
                              <XAxis dataKey="name" stroke="#665e49" fontSize={11} fontWeight={600} />
                              <YAxis stroke="#665e49" fontSize={11} fontWeight={600} />
                              <Tooltip contentStyle={{ background: "#fff", border: "1px solid rgba(225,191,183,0.2)", borderRadius: 12 }} />
                              <Legend wrapperStyle={{ fontSize: 12, fontWeight: 700 }} />
                              <Bar dataKey="Lượt dùng AI" fill="#0284c7" radius={[4, 4, 0, 0]} barSize={40} />
                            </BarChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="h-full flex items-center justify-center text-on-surface-variant text-sm font-bold">Chưa có lượt sử dụng AI nào được log</div>
                        )}
                      </div>
                    </div>
                  </section>

                  <section className="grid grid-cols-1 lg:grid-cols-2 gap-md mb-lg">
                    {/* Chart 3: Sở thích ẩm thực */}
                    <div className="bg-surface-container-lowest p-md rounded-xl recipe-card-shadow border border-outline-variant/15 flex flex-col">
                      <h3 className="font-headline-sm text-[16px] text-on-surface font-bold mb-md select-none flex items-center gap-1">
                        <span className="material-symbols-outlined text-primary text-[20px]">volunteer_activism</span>
                        Sở thích & Mục tiêu dinh dưỡng (Top 7)
                      </h3>
                      <div className="w-full h-[300px] flex items-center justify-center">
                        {preferenceData.length > 0 ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={preferenceData}
                                cx="50%"
                                cy="45%"
                                labelLine={true}
                                label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                                outerRadius={80}
                                dataKey="value"
                              >
                                {preferenceData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                              </Pie>
                              <Tooltip contentStyle={{ background: "#fff", border: "1px solid rgba(225,191,183,0.2)", borderRadius: 12 }} />
                              <Legend wrapperStyle={{ fontSize: 11, fontWeight: 700 }} />
                            </PieChart>
                          </ResponsiveContainer>
                        ) : (
                          <p className="text-on-surface-variant text-sm font-bold">Chưa cập nhật sở thích người dùng</p>
                        )}
                      </div>
                    </div>

                    {/* Chart 4: Phân bố độ khó */}
                    <div className="bg-surface-container-lowest p-md rounded-xl recipe-card-shadow border border-outline-variant/15 flex flex-col">
                      <h3 className="font-headline-sm text-[16px] text-on-surface font-bold mb-md select-none flex items-center gap-1">
                        <span className="material-symbols-outlined text-error text-[20px]">fitness_center</span>
                        Phân bổ độ khó của công thức
                      </h3>
                      <div className="w-full h-[300px] flex items-center justify-center">
                        {difficultyData.length > 0 ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={difficultyData}
                                cx="50%"
                                cy="45%"
                                innerRadius={60}
                                outerRadius={85}
                                paddingAngle={5}
                                dataKey="value"
                                label={({ name, value }) => `${name}: ${value}`}
                              >
                                {difficultyData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={DIFFICULTY_COLORS[entry.name.toLowerCase()] || "#6b7280"} />
                                ))}
                              </Pie>
                              <Tooltip contentStyle={{ background: "#fff", border: "1px solid rgba(225,191,183,0.2)", borderRadius: 12 }} />
                              <Legend wrapperStyle={{ fontSize: 11, fontWeight: 700 }} />
                            </PieChart>
                          </ResponsiveContainer>
                        ) : (
                          <p className="text-on-surface-variant text-sm font-bold">Không có dữ liệu độ khó</p>
                        )}
                      </div>
                    </div>
                  </section>
                </>
              )}
            </>
          )}

          {/* ════════════════════════════════════════
              TAB 2: USER MANAGEMENT (ACTUAL USERS)
              ════════════════════════════════════════ */}
          {activeTab === "users" && (
            <section className="bg-surface-container-lowest rounded-xl shadow-soft overflow-hidden border border-outline-variant/10">
              <div className="p-md border-b border-outline-variant/10 flex flex-col md:flex-row justify-between items-start md:items-center gap-sm">
                <h2 className="font-headline-sm text-headline-sm text-on-surface font-bold">Quản lý Thành viên</h2>
                
                {/* Search input */}
                <div className="relative w-full md:w-72">
                  <input
                    type="text"
                    placeholder="Tìm kiếm theo tên, email..."
                    value={usersSearch}
                    onChange={(e) => setUsersSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-outline-variant/35 rounded-lg text-sm bg-surface focus:outline-none focus:border-primary text-on-surface"
                  />
                  <span className="material-symbols-outlined absolute left-3 top-2.5 text-on-surface-variant text-[20px]">search</span>
                </div>
              </div>

              <div className="overflow-x-auto">
                {loading ? (
                  <div className="p-10 text-center font-bold">Đang tải danh sách người dùng...</div>
                ) : filteredUsers.length > 0 ? (
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-surface-variant text-on-surface-variant border-b border-outline-variant/20 select-none">
                        <th className="px-md py-4 font-label-md text-label-md uppercase font-bold">Người dùng</th>
                        <th className="px-md py-4 font-label-md text-label-md uppercase font-bold">Email</th>
                        <th className="px-md py-4 font-label-md text-label-md uppercase font-bold">Vai trò</th>
                        <th className="px-md py-4 font-label-md text-label-md uppercase font-bold">Trạng thái</th>
                        <th className="px-md py-4 font-label-md text-label-md uppercase font-bold">Ngày tham gia</th>
                        <th className="px-md py-4 font-label-md text-label-md uppercase text-right font-bold">Hành động</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/10">
                      {filteredUsers.map((item) => (
                        <tr key={item.id} className="hover:bg-surface-bright transition-colors">
                          <td className="px-md py-4">
                            <div className="flex items-center gap-sm">
                              <img
                                alt={item.full_name || item.username}
                                className="w-10 h-10 rounded-full object-cover border border-outline-variant"
                                src={item.avatar_url || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde"}
                              />
                              <div>
                                <p className="font-label-md text-label-md text-on-surface font-bold">{item.full_name || "Chưa cập nhật"}</p>
                                <p className="text-xs text-on-surface-variant">@{item.username}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-md py-4 text-body-md text-on-surface-variant">{item.email}</td>
                          <td className="px-md py-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${item.role === 'admin' ? 'bg-primary-container text-primary' : 'bg-surface-container-high text-on-surface-variant'}`}>
                              {item.role}
                            </span>
                          </td>
                          <td className="px-md py-4">
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold select-none ${item.is_verified ? 'bg-tertiary-container text-on-tertiary-container' : 'bg-error-container text-error'}`}>
                              {item.is_verified ? 'Đã kích hoạt' : 'Chưa xác thực'}
                            </span>
                          </td>
                          <td className="px-md py-4 text-body-md text-on-surface-variant">
                            {new Date(item.created_at).toLocaleDateString("vi-VN")}
                          </td>
                          <td className="px-md py-4 text-right">
                            <div className="flex justify-end gap-sm select-none">
                              <button
                                onClick={() => handleToggleRole(item.id, item.role)}
                                className="px-3 py-1.5 bg-outline-variant/20 hover:bg-outline-variant/40 text-on-surface-variant rounded-lg font-label-sm font-bold text-xs transition-all active:scale-95"
                                title="Đổi quyền"
                              >
                                Đổi Quyền
                              </button>
                              <button
                                onClick={() => handleDeleteUser(item.id)}
                                className="w-8 h-8 flex items-center justify-center rounded-full bg-error-container text-error hover:scale-110 active:scale-95 transition-all shadow-sm"
                                title="Xóa người dùng"
                              >
                                <span className="material-symbols-outlined text-[18px]">delete</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="p-8 text-center text-on-surface-variant font-bold">Không tìm thấy người dùng nào!</div>
                )}
              </div>
            </section>
          )}

          {/* ════════════════════════════════════════
              TAB 3: RECIPE MANAGEMENT (ACTUAL RECIPES)
              ════════════════════════════════════════ */}
          {activeTab === "recipes" && (
            <section className="bg-surface-container-lowest rounded-xl shadow-soft overflow-hidden border border-outline-variant/10">
              <div className="p-md border-b border-outline-variant/10 flex flex-col md:flex-row justify-between items-start md:items-center gap-sm">
                <h2 className="font-headline-sm text-headline-sm text-on-surface font-bold">Quản lý Công thức nấu ăn</h2>
                
                {/* Search input */}
                <div className="relative w-full md:w-72">
                  <input
                    type="text"
                    placeholder="Tìm tên công thức, đầu bếp..."
                    value={recipesSearch}
                    onChange={(e) => setRecipesSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-outline-variant/35 rounded-lg text-sm bg-surface focus:outline-none focus:border-primary text-on-surface"
                  />
                  <span className="material-symbols-outlined absolute left-3 top-2.5 text-on-surface-variant text-[20px]">search</span>
                </div>
              </div>

              <div className="overflow-x-auto">
                {loading ? (
                  <div className="p-10 text-center font-bold">Đang tải danh sách công thức...</div>
                ) : filteredRecipes.length > 0 ? (
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-surface-variant text-on-surface-variant border-b border-outline-variant/20 select-none">
                        <th className="px-md py-4 font-label-md text-label-md uppercase font-bold">Món ăn</th>
                        <th className="px-md py-4 font-label-md text-label-md uppercase font-bold">Tác giả</th>
                        <th className="px-md py-4 font-label-md text-label-md uppercase font-bold">Lượt lưu</th>
                        <th className="px-md py-4 font-label-md text-label-md uppercase font-bold">Độ khó</th>
                        <th className="px-md py-4 font-label-md text-label-md uppercase font-bold">Trạng thái</th>
                        <th className="px-md py-4 font-label-md text-label-md uppercase text-right font-bold">Hành động</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/10">
                      {filteredRecipes.map((item) => (
                        <tr key={item.id} className="hover:bg-surface-bright transition-colors group">
                          <td className="px-md py-4">
                            <div className="flex items-center gap-sm">
                              <img
                                alt={item.title}
                                className="w-12 h-12 rounded-lg object-cover border border-outline-variant/10 shadow-sm"
                                src={item.cover_image_url || "https://images.unsplash.com/photo-1495521821757-a1efb6729352"}
                              />
                              <span className="font-label-md text-label-md text-on-surface font-bold group-hover:text-primary transition-colors cursor-pointer" onClick={() => navigate(`/recipe/${item.id}`)}>
                                {item.title}
                              </span>
                            </div>
                          </td>
                          <td className="px-md py-4 text-body-md text-on-surface-variant">{item.author_name || item.author_username}</td>
                          <td className="px-md py-4 text-body-md font-bold text-primary">{item.save_count || 0}</td>
                          <td className="px-md py-4">
                            <span className="px-2 py-0.5 rounded text-xs font-bold text-white uppercase" style={{ backgroundColor: DIFFICULTY_COLORS[item.difficulty] || "#665e49" }}>
                              {item.difficulty}
                            </span>
                          </td>
                          <td className="px-md py-4">
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold select-none ${item.status === 'published' ? 'bg-tertiary-container text-on-tertiary-container' : item.status === 'pending' ? 'bg-secondary-container text-on-secondary-container' : 'bg-surface-container-high text-on-surface-variant'}`}>
                              {item.status === 'published' ? 'Đã đăng' : item.status === 'pending' ? 'Chờ duyệt' : 'Bản nháp'}
                            </span>
                          </td>
                          <td className="px-md py-4 text-right">
                            <div className="flex justify-end gap-sm select-none">
                              <button
                                onClick={() => navigate(`/recipe/${item.id}`)}
                                className="px-3 py-1.5 bg-outline-variant/20 hover:bg-outline-variant/40 text-on-surface-variant rounded-lg font-label-sm font-bold text-xs transition-all active:scale-95"
                              >
                                Chi tiết
                              </button>
                              <button
                                onClick={() => handleDeleteRecipe(item.id)}
                                className="w-8 h-8 flex items-center justify-center rounded-full bg-error-container text-error hover:scale-110 active:scale-95 transition-all shadow-sm"
                                title="Xóa công thức"
                              >
                                <span className="material-symbols-outlined text-[18px]">delete</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="p-8 text-center text-on-surface-variant font-bold">Không tìm thấy công thức nào!</div>
                )}
              </div>
            </section>
          )}

          {/* ════════════════════════════════════════
              TAB 4: PENDING RECIPES APPROVAL
              ════════════════════════════════════════ */}
          {activeTab === "approve" && (
            <section className="bg-surface-container-lowest rounded-xl shadow-soft overflow-hidden border border-outline-variant/10">
              <div className="p-md border-b border-outline-variant/10">
                <h2 className="font-headline-sm text-headline-sm text-on-surface font-bold">Phê duyệt Công thức Nấu ăn</h2>
              </div>

              <div className="overflow-x-auto">
                {loading ? (
                  <div className="p-10 text-center font-bold">Đang tải danh sách chờ duyệt...</div>
                ) : pendingRecipes.length > 0 ? (
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-surface-variant text-on-surface-variant border-b border-outline-variant/20 select-none">
                        <th className="px-md py-4 font-label-md text-label-md uppercase font-bold">Món ăn</th>
                        <th className="px-md py-4 font-label-md text-label-md uppercase font-bold">Tác giả</th>
                        <th className="px-md py-4 font-label-md text-label-md uppercase font-bold">Thời gian chuẩn bị</th>
                        <th className="px-md py-4 font-label-md text-label-md uppercase font-bold">Độ khó</th>
                        <th className="px-md py-4 font-label-md text-label-md uppercase text-right font-bold">Hành động phê duyệt</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/10">
                      {pendingRecipes.map((recipe) => (
                        <tr key={recipe.id} className="hover:bg-surface-bright transition-colors group">
                          <td className="px-md py-4">
                            <div className="flex items-center gap-sm">
                              <img
                                alt={recipe.title}
                                className="w-12 h-12 rounded-lg object-cover border border-outline-variant/10 shadow-sm animate-fade-in"
                                src={recipe.cover_image_url || "https://images.unsplash.com/photo-1495521821757-a1efb6729352"}
                              />
                              <span className="font-label-md text-label-md text-on-surface font-bold group-hover:text-primary transition-colors cursor-pointer" onClick={() => navigate(`/recipe/${recipe.id}`)}>
                                {recipe.title}
                              </span>
                            </div>
                          </td>
                          <td className="px-md py-4 text-body-md text-on-surface-variant">{recipe.author_name || recipe.author_username}</td>
                          <td className="px-md py-4 text-body-md text-on-surface-variant">{recipe.prep_time_minutes} phút</td>
                          <td className="px-md py-4 text-body-md text-on-surface-variant">
                            <span className="px-2 py-0.5 rounded text-xs font-bold text-white uppercase" style={{ backgroundColor: DIFFICULTY_COLORS[recipe.difficulty] || "#665e49" }}>
                              {recipe.difficulty}
                            </span>
                          </td>
                          <td className="px-md py-4 text-right">
                            <div className="flex justify-end gap-sm select-none">
                              <button
                                onClick={() => handleApprove(recipe.id)}
                                className="px-4 py-2 bg-tertiary-fixed text-tertiary hover:scale-105 active:scale-95 transition-all rounded-lg font-label-md font-bold text-xs shadow-sm flex items-center gap-xs"
                                title="Phê duyệt"
                              >
                                <span className="material-symbols-outlined text-[16px] font-bold">check</span>
                                Phê Duyệt
                              </button>
                              <button
                                onClick={() => handleReject(recipe.id)}
                                className="px-4 py-2 bg-error-container text-error hover:scale-105 active:scale-95 transition-all rounded-lg font-label-md font-bold text-xs shadow-sm flex items-center gap-xs"
                                title="Từ chối"
                              >
                                <span className="material-symbols-outlined text-[16px]">close</span>
                                Từ Chối
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="p-8 text-center text-on-surface-variant font-bold">
                    Tuyệt vời! Không còn công thức nào đang chờ phê duyệt.
                  </div>
                )}
              </div>
            </section>
          )}

          {/* ════════════════════════════════════════
              TAB 5: CATEGORY MANAGEMENT
              ════════════════════════════════════════ */}
          {activeTab === "categories" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-lg">
              {/* Form Add New Category (Left Column) */}
              <div className="lg:col-span-1 bg-surface-container-lowest p-md rounded-xl recipe-card-shadow border border-outline-variant/15 h-fit">
                <h3 className="font-headline-sm text-[18px] text-on-surface font-bold mb-md select-none flex items-center gap-1 border-b border-outline-variant/10 pb-xs">
                  <span className="material-symbols-outlined text-primary">add_box</span>
                  Thêm danh mục mới
                </h3>
                
                <form onSubmit={handleCreateCategory} className="space-y-md">
                  <div className="space-y-xs">
                    <label className="font-label-md text-label-md text-on-surface-variant font-bold" htmlFor="cat-name">Tên danh mục</label>
                    <input
                      id="cat-name"
                      type="text"
                      required
                      placeholder="Ví dụ: Món chay, Tráng miệng..."
                      value={newCatName}
                      onChange={(e) => setNewCatName(e.target.value)}
                      className="w-full px-md py-sm bg-surface border border-outline-variant/30 rounded-lg font-body-md text-body-md focus:ring-1 focus:ring-primary focus:border-primary transition-all outline-none text-on-surface"
                    />
                  </div>

                  <div className="space-y-xs">
                    <label className="font-label-md text-label-md text-on-surface-variant font-bold" htmlFor="cat-img">Link ảnh đại diện</label>
                    <input
                      id="cat-img"
                      type="url"
                      placeholder="https://example.com/image.jpg"
                      value={newCatImg}
                      onChange={(e) => setNewCatImg(e.target.value)}
                      className="w-full px-md py-sm bg-surface border border-outline-variant/30 rounded-lg font-body-md text-body-md focus:ring-1 focus:ring-primary focus:border-primary transition-all outline-none text-on-surface"
                    />
                  </div>

                  <div className="space-y-xs">
                    <label className="font-label-md text-label-md text-on-surface-variant font-bold" htmlFor="cat-desc">Mô tả danh mục</label>
                    <textarea
                      id="cat-desc"
                      rows={4}
                      placeholder="Nhập vài dòng mô tả ngắn về danh mục này..."
                      value={newCatDesc}
                      onChange={(e) => setNewCatDesc(e.target.value)}
                      className="w-full px-md py-sm bg-surface border border-outline-variant/30 rounded-lg font-body-md text-body-md focus:ring-1 focus:ring-primary focus:border-primary transition-all outline-none text-on-surface resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-md bg-primary hover:bg-primary/95 text-on-primary font-label-md text-label-md font-bold rounded-lg shadow-sm transition-all active:scale-95 flex items-center justify-center gap-xs"
                  >
                    <span className="material-symbols-outlined text-[18px]">add</span>
                    Tạo danh mục
                  </button>
                </form>
              </div>

              {/* Categories List (Right Column) */}
              <div className="lg:col-span-2 bg-surface-container-lowest rounded-xl shadow-soft overflow-hidden border border-outline-variant/10 h-fit">
                <div className="p-md border-b border-outline-variant/10">
                  <h2 className="font-headline-sm text-[18px] text-on-surface font-bold">Danh sách Danh mục hiện tại</h2>
                </div>

                <div className="overflow-x-auto">
                  {loading ? (
                    <div className="p-10 text-center font-bold">Đang tải danh mục...</div>
                  ) : categoriesList.length > 0 ? (
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-surface-variant text-on-surface-variant border-b border-outline-variant/20 select-none">
                          <th className="px-md py-4 font-label-md text-label-md uppercase font-bold">Hình ảnh</th>
                          <th className="px-md py-4 font-label-md text-label-md uppercase font-bold">Tên danh mục</th>
                          <th className="px-md py-4 font-label-md text-label-md uppercase font-bold">Mô tả</th>
                          <th className="px-md py-4 font-label-md text-label-md uppercase font-bold">Slug</th>
                          <th className="px-md py-4 font-label-md text-label-md uppercase text-right font-bold">Xóa</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-outline-variant/10">
                        {categoriesList.map((cat) => (
                          <tr key={cat.id} className="hover:bg-surface-bright transition-colors">
                            <td className="px-md py-4">
                              <img
                                alt={cat.name}
                                className="w-10 h-10 rounded-lg object-cover border border-outline-variant/15 shadow-sm"
                                src={cat.image_url || cat.imageUrl || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c"}
                              />
                            </td>
                            <td className="px-md py-4 font-bold text-on-surface">{cat.name}</td>
                            <td className="px-md py-4 text-xs text-on-surface-variant max-w-xs truncate">{cat.description || "—"}</td>
                            <td className="px-md py-4 text-xs text-on-surface-variant font-mono">{cat.slug}</td>
                            <td className="px-md py-4 text-right">
                              <button
                                onClick={() => handleDeleteCategory(cat.id)}
                                className="w-8 h-8 flex items-center justify-center rounded-full bg-error-container text-error hover:scale-110 active:scale-95 transition-all shadow-sm mx-auto"
                                title="Xóa danh mục"
                              >
                                <span className="material-symbols-outlined text-[18px]">delete</span>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="p-8 text-center text-on-surface-variant font-bold">Chưa có danh mục nào được khởi tạo!</div>
                  )}
                </div>
              </div>
            </div>
          )}
        </main>
        
        {/* Footer */}
        <footer className="w-full py-xl border-t border-outline-variant/20 bg-surface-container-highest select-none mt-auto">
          <div className="flex flex-col md:flex-row justify-between items-center px-margin-desktop w-full max-w-max-width mx-auto gap-md">
            <div className="flex flex-col items-center md:items-start">
              <span className="font-headline-sm text-headline-sm font-bold text-on-surface mb-2 font-display-md text-primary">CulinShare</span>
              <p className="font-body-md text-body-md text-on-surface-variant">© {new Date().getFullYear()} CulinShare. Crafted for home chefs.</p>
            </div>
            <div className="flex gap-lg">
              <a className="font-label-sm text-label-sm text-on-surface-variant hover:text-primary underline transition-all" href="#">About</a>
              <a className="font-label-sm text-label-sm text-on-surface-variant hover:text-primary underline transition-all" href="#">Privacy</a>
              <a className="font-label-sm text-label-sm text-on-surface-variant hover:text-primary underline transition-all" href="#">Terms</a>
              <a className="font-label-sm text-label-sm text-on-surface-variant hover:text-primary underline transition-all" href="#">Help</a>
              <a className="font-label-sm text-label-sm text-on-surface-variant hover:text-primary underline transition-all" href="#">Contact</a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
