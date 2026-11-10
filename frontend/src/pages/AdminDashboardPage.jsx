import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
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
  deleteAdminCategoryApi,
  getAdminReportsApi,
  updateAdminReportStatusApi,
  handleAdminReportActionApi
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

const REPORT_REASONS = {
  spam: { label: "Spam / Quảng cáo", color: "bg-amber-100 text-amber-900 border-amber-300" },
  inappropriate: { label: "Nội dung phản cảm", color: "bg-red-100 text-red-900 border-red-300" },
  harassment: { label: "Quấy rối / Công kích", color: "bg-purple-100 text-purple-900 border-purple-300" },
  false_information: { label: "Thông tin sai lệch", color: "bg-orange-100 text-orange-900 border-orange-300" },
  copyright: { label: "Vi phạm bản quyền", color: "bg-blue-100 text-blue-900 border-blue-300" },
  other: { label: "Lý do khác", color: "bg-slate-100 text-slate-800 border-slate-300" }
};

const REPORT_STATUS = {
  pending: { label: "Chờ xử lý", badge: "bg-amber-50 text-amber-800 border-amber-300 font-bold" },
  reviewed: { label: "Đã xử lý", badge: "bg-emerald-50 text-emerald-800 border-emerald-300 font-bold" },
  dismissed: { label: "Đã bác bỏ", badge: "bg-slate-100 text-slate-600 border-slate-300 font-bold" }
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

  // Community Reports Tab State
  const [reports, setReports] = useState([]);
  const [reportStats, setReportStats] = useState({ total: 0, pending: 0, reviewed: 0, dismissed: 0 });
  const [reportStatusFilter, setReportStatusFilter] = useState("all");
  const [reportTargetFilter, setReportTargetFilter] = useState("all");
  const [reportSearch, setReportSearch] = useState("");

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

  // 6. Fetch Community Reports Data
  const loadReportsData = async (status = reportStatusFilter) => {
    try {
      setLoading(true);
      const data = await getAdminReportsApi(status);
      setReports(data?.reports || []);
      if (data?.stats) {
        setReportStats(data.stats);
      }
    } catch (err) {
      console.error(err);
      setError("Không thể tải danh sách báo cáo cộng đồng");
    } finally {
      setLoading(false);
    }
  };

  // Initial Load (Dashboard, Pending List, Report Stats)
  useEffect(() => {
    fetchStats();
    loadPendingRecipesData();
    loadReportsData();
  }, []);

  // Fetch data on Tab switch
  useEffect(() => {
    setError("");
    if (activeTab === "dashboard") {
      fetchStats();
      loadPendingRecipesData();
      loadReportsData();
    } else if (activeTab === "users") {
      loadUsersData();
    } else if (activeTab === "recipes") {
      loadRecipesData();
    } else if (activeTab === "approve") {
      loadPendingRecipesData();
    } else if (activeTab === "categories") {
      loadCategoriesData();
    } else if (activeTab === "reports") {
      loadReportsData(reportStatusFilter);
    }
  }, [activeTab, reportStatusFilter]);

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

  // Community Reports Actions
  const handleReportAction = async (reportId, action, confirmMessage) => {
    if (confirmMessage && !window.confirm(confirmMessage)) {
      return;
    }
    try {
      await handleAdminReportActionApi(reportId, action);
      const actionLabels = {
        hide_content: "Đã ẩn nội dung vi phạm thành công!",
        delete_content: "Đã xóa nội dung vi phạm thành công!",
        restore_content: "Đã khôi phục nội dung hiển thị thành công!",
        dismiss_report: "Đã bác bỏ báo cáo này!",
        reopen_report: "Đã mở lại báo cáo để kiểm duyệt!"
      };
      triggerToast(actionLabels[action] || "Thao tác thành công!");
      await loadReportsData(reportStatusFilter);
      fetchStats();
    } catch (err) {
      alert(err.message || "Lỗi khi xử lý báo cáo");
    }
  };

  // Charts data mapping
  const recipeData = stats?.recipeStats?.map(item => ({
    name: item?.month || "",
    "Số công thức": item?.count || 0
  })) || [];

  const aiLogsData = stats?.aiLogsStats?.map(item => ({
    name: item?.month || "",
    "Lượt dùng AI": item?.count || 0
  })) || [];

  const preferenceData = stats?.preferenceStats?.slice(0, 7) || [];
  const difficultyData = stats?.difficultyStats?.map(item => ({
    name: item?.difficulty
      ? (typeof item.difficulty === 'string' ? item.difficulty.charAt(0).toUpperCase() + item.difficulty.slice(1) : String(item.difficulty))
      : "Khác",
    value: item?.count || 0
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

  const filteredReports = reports.filter((rep) => {
    if (reportTargetFilter !== "all" && rep.target_type !== reportTargetFilter) {
      return false;
    }
    if (!reportSearch.trim()) return true;
    const q = reportSearch.toLowerCase();
    const content = (rep.post_content || rep.comment_content || "").toLowerCase();
    const title = (rep.post_title || rep.comment_post_title || "").toLowerCase();
    const reporter = (rep.reporter_name || rep.reporter_username || "").toLowerCase();
    const author = (rep.post_author_name || rep.post_author_username || rep.comment_author_name || rep.comment_author_username || "").toLowerCase();
    const reasonText = (REPORT_REASONS[rep.reason]?.label || rep.reason || "").toLowerCase();
    const desc = (rep.description || "").toLowerCase();

    return content.includes(q) || title.includes(q) || reporter.includes(q) || author.includes(q) || reasonText.includes(q) || desc.includes(q);
  });

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
      <AdminSidebar activeTab={activeTab} setActiveTab={setActiveTab} pendingReportsCount={reportStats?.pending || 0} />
      
      {/* Main Container */}
      <div className="ml-64 flex-grow flex flex-col min-h-screen">
        <AdminHeader />
        
        <main className="p-gutter px-6 sm:px-10 md:px-14 lg:px-20 xl:px-24 w-full flex-grow">
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
              <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-md mb-lg select-none">
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
                
                <div className="bg-surface-container-lowest p-md rounded-xl recipe-card-shadow flex items-center justify-between border-l-4 border-error border-t border-r border-b border-outline-variant/15 cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab("approve")}>
                  <div>
                    <p className="text-on-surface-variant font-label-md text-label-md uppercase tracking-wider mb-xs font-bold">Công thức Chờ Duyệt</p>
                    <p className="text-headline-md text-on-surface font-bold" style={{ fontFamily: "var(--font-family-sans, sans-serif)" }}>{pendingRecipes.length}</p>
                    <p className="text-error font-label-sm text-label-sm mt-xs font-bold flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                      Bấm để duyệt ngay
                    </p>
                  </div>
                  <div className="bg-error-container p-sm rounded-full text-error shadow-inner">
                    <span className="material-symbols-outlined text-3xl font-bold">pending_actions</span>
                  </div>
                </div>

                <div className="bg-surface-container-lowest p-md rounded-xl recipe-card-shadow flex items-center justify-between border-l-4 border-amber-500 border-t border-r border-b border-outline-variant/15 cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab("reports")}>
                  <div>
                    <p className="text-on-surface-variant font-label-md text-label-md uppercase tracking-wider mb-xs font-bold">Báo Cáo Vi Phạm</p>
                    <p className="text-headline-md text-on-surface font-bold" style={{ fontFamily: "var(--font-family-sans, sans-serif)" }}>
                      {reportStats?.pending || 0}
                    </p>
                    <p className="text-amber-700 font-label-sm text-label-sm mt-xs font-bold flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">flag</span>
                      {reportStats?.pending ? "Cần kiểm duyệt ngay" : "Đã xử lý gọn gàng"}
                    </p>
                  </div>
                  <div className="bg-amber-100 p-sm rounded-full text-amber-800 shadow-inner">
                    <span className="material-symbols-outlined text-3xl font-bold">flag</span>
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
                                  <Cell key={`cell-${index}`} fill={DIFFICULTY_COLORS[entry?.name?.toLowerCase()] || "#6b7280"} />
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

          {/* ════════════════════════════════════════
              TAB 6: COMMUNITY REPORTS MODERATION
              ════════════════════════════════════════ */}
          {activeTab === "reports" && (
            <div className="space-y-lg">
              {/* Header Title & Actions */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-md">
                <div>
                  <h1 className="font-headline-sm text-headline-sm text-on-surface font-bold flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-[28px]">flag</span>
                    Xử lý Báo cáo Cộng đồng
                  </h1>
                  <p className="font-body-md text-on-surface-variant text-sm mt-1">
                    Xem xét, xử lý các báo cáo vi phạm nội dung bài viết và bình luận từ cộng đồng CulinShare.
                  </p>
                </div>
                <button
                  onClick={() => loadReportsData(reportStatusFilter)}
                  className="px-4 py-2 bg-surface-container-high hover:bg-surface-variant text-on-surface font-label-md font-bold text-sm rounded-lg border border-outline-variant/30 flex items-center gap-2 transition-all active:scale-95 shadow-sm"
                  title="Làm mới danh sách"
                >
                  <span className="material-symbols-outlined text-[18px]">refresh</span>
                  Làm mới
                </button>
              </div>

              {/* Status Filter Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-md">
                <button
                  type="button"
                  onClick={() => setReportStatusFilter("all")}
                  className={`p-md rounded-xl text-left border transition-all ${
                    reportStatusFilter === "all"
                      ? "bg-surface-container-highest border-primary shadow-sm ring-1 ring-primary"
                      : "bg-surface-container-lowest border-outline-variant/15 hover:border-outline-variant/40"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-label-sm text-label-sm text-on-surface-variant uppercase font-bold">Tất cả báo cáo</span>
                    <span className="material-symbols-outlined text-on-surface-variant text-[20px]">list_alt</span>
                  </div>
                  <p className="text-headline-md font-bold text-on-surface">{reportStats.total}</p>
                  <p className="text-xs text-on-surface-variant mt-1">Tổng số báo cáo ghi nhận</p>
                </button>

                <button
                  type="button"
                  onClick={() => setReportStatusFilter("pending")}
                  className={`p-md rounded-xl text-left border transition-all ${
                    reportStatusFilter === "pending"
                      ? "bg-amber-50/70 border-amber-500 shadow-sm ring-1 ring-amber-500"
                      : "bg-surface-container-lowest border-outline-variant/15 hover:border-amber-300"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-label-sm text-label-sm text-amber-800 uppercase font-bold">Chờ xử lý</span>
                    <span className="material-symbols-outlined text-amber-600 text-[20px]">pending_actions</span>
                  </div>
                  <p className="text-headline-md font-bold text-amber-700">{reportStats.pending}</p>
                  <p className="text-xs text-amber-800 mt-1">Cần xem xét và can thiệp</p>
                </button>

                <button
                  type="button"
                  onClick={() => setReportStatusFilter("reviewed")}
                  className={`p-md rounded-xl text-left border transition-all ${
                    reportStatusFilter === "reviewed"
                      ? "bg-emerald-50/70 border-emerald-500 shadow-sm ring-1 ring-emerald-500"
                      : "bg-surface-container-lowest border-outline-variant/15 hover:border-emerald-300"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-label-sm text-label-sm text-emerald-800 uppercase font-bold">Đã xử lý</span>
                    <span className="material-symbols-outlined text-emerald-600 text-[20px]">check_circle</span>
                  </div>
                  <p className="text-headline-md font-bold text-emerald-700">{reportStats.reviewed}</p>
                  <p className="text-xs text-emerald-800 mt-1">Đã ẩn, xóa hoặc khôi phục</p>
                </button>

                <button
                  type="button"
                  onClick={() => setReportStatusFilter("dismissed")}
                  className={`p-md rounded-xl text-left border transition-all ${
                    reportStatusFilter === "dismissed"
                      ? "bg-slate-100 border-slate-500 shadow-sm ring-1 ring-slate-500"
                      : "bg-surface-container-lowest border-outline-variant/15 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-label-sm text-label-sm text-slate-700 uppercase font-bold">Đã bác bỏ</span>
                    <span className="material-symbols-outlined text-slate-500 text-[20px]">do_not_disturb_on</span>
                  </div>
                  <p className="text-headline-md font-bold text-slate-700">{reportStats.dismissed}</p>
                  <p className="text-xs text-slate-600 mt-1">Báo cáo không vi phạm</p>
                </button>
              </div>

              {/* Filter & Search Bar */}
              <div className="bg-surface-container-lowest p-md rounded-xl border border-outline-variant/15 shadow-sm flex flex-col md:flex-row gap-md items-center justify-between">
                <div className="flex flex-wrap items-center gap-xs w-full md:w-auto">
                  <span className="text-xs font-bold text-on-surface-variant uppercase mr-1">Đối tượng:</span>
                  <button
                    type="button"
                    onClick={() => setReportTargetFilter("all")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      reportTargetFilter === "all"
                        ? "bg-primary text-on-primary shadow-xs"
                        : "bg-surface-container-high text-on-surface-variant hover:bg-surface-variant"
                    }`}
                  >
                    Tất cả
                  </button>
                  <button
                    type="button"
                    onClick={() => setReportTargetFilter("post")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${
                      reportTargetFilter === "post"
                        ? "bg-primary text-on-primary shadow-xs"
                        : "bg-surface-container-high text-on-surface-variant hover:bg-surface-variant"
                    }`}
                  >
                    <span className="material-symbols-outlined text-[15px]">article</span>
                    Bài viết
                  </button>
                  <button
                    type="button"
                    onClick={() => setReportTargetFilter("comment")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${
                      reportTargetFilter === "comment"
                        ? "bg-primary text-on-primary shadow-xs"
                        : "bg-surface-container-high text-on-surface-variant hover:bg-surface-variant"
                    }`}
                  >
                    <span className="material-symbols-outlined text-[15px]">chat_bubble</span>
                    Bình luận
                  </button>
                </div>

                <div className="relative w-full md:w-80">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline-variant text-[18px]">
                    search
                  </span>
                  <input
                    type="text"
                    value={reportSearch}
                    onChange={(e) => setReportSearch(e.target.value)}
                    placeholder="Tìm theo nội dung, tác giả, người báo..."
                    className="w-full pl-9 pr-3 py-1.5 bg-surface text-on-surface text-sm rounded-lg border border-outline-variant/30 focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                  />
                  {reportSearch && (
                    <button
                      type="button"
                      onClick={() => setReportSearch("")}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-outline-variant hover:text-on-surface"
                    >
                      <span className="material-symbols-outlined text-[16px]">close</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Reports List */}
              {loading ? (
                <div className="bg-surface-container-lowest p-12 rounded-xl border border-outline-variant/15 flex flex-col items-center justify-center">
                  <span className="material-symbols-outlined text-4xl text-outline-variant animate-spin">progress_activity</span>
                  <p className="text-on-surface-variant text-sm mt-3 font-bold">Đang tải danh sách báo cáo...</p>
                </div>
              ) : filteredReports.length === 0 ? (
                <div className="bg-surface-container-lowest p-12 rounded-xl border border-outline-variant/15 text-center">
                  <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
                    <span className="material-symbols-outlined text-3xl">verified_user</span>
                  </div>
                  <h3 className="font-headline-sm text-base text-on-surface font-bold mb-1">
                    Không có báo cáo nào
                  </h3>
                  <p className="text-sm text-on-surface-variant max-w-md mx-auto">
                    {reportStatusFilter === "pending"
                      ? "Tuyệt vời! Không còn nội dung nào đang chờ kiểm duyệt xử lý."
                      : "Không tìm thấy báo cáo nào phù hợp với bộ lọc hiện tại."}
                  </p>
                </div>
              ) : (
                <div className="space-y-md">
                  {filteredReports.map((rep) => {
                    const isPost = rep.target_type === "post";
                    const isComment = rep.target_type === "comment";
                    const authorName = isPost ? (rep.post_author_name || rep.post_author_username) : (rep.comment_author_name || rep.comment_author_username);
                    const authorAvatar = isPost ? rep.post_author_avatar : rep.comment_author_avatar;
                    const contentText = isPost ? rep.post_content : rep.comment_content;
                    const contentStatus = isPost ? rep.post_status : rep.comment_status;
                    const isDeleted = isPost ? !!rep.post_deleted_at : !!rep.comment_deleted_at;
                    const isHidden = contentStatus === "hidden";
                    const reasonConfig = REPORT_REASONS[rep.reason] || REPORT_REASONS.other;
                    const statusConfig = REPORT_STATUS[rep.status] || REPORT_STATUS.pending;
                    const postLink = isPost ? `/community/posts/${rep.post_id}` : `/community/posts/${rep.comment_post_id}`;

                    return (
                      <div
                        key={rep.id}
                        className={`bg-surface-container-lowest rounded-xl border transition-all overflow-hidden ${
                          rep.status === "pending"
                            ? "border-amber-300 shadow-sm ring-1 ring-amber-100"
                            : "border-outline-variant/15"
                        }`}
                      >
                        {/* Report Top Meta Bar */}
                        <div className="px-md py-3 bg-surface-variant/40 border-b border-outline-variant/10 flex flex-wrap items-center justify-between gap-2 text-xs">
                          <div className="flex items-center gap-2">
                            {/* Target Type Badge */}
                            <span
                              className={`px-2.5 py-1 rounded-md font-bold uppercase tracking-wide flex items-center gap-1 ${
                                isPost ? "bg-primary/10 text-primary border border-primary/20" : "bg-sky-100 text-sky-800 border border-sky-200"
                              }`}
                            >
                              <span className="material-symbols-outlined text-[14px]">
                                {isPost ? "article" : "chat_bubble"}
                              </span>
                              {isPost ? "Bài viết" : "Bình luận"}
                            </span>

                            {/* Report Status Badge */}
                            <span className={`px-2.5 py-1 rounded-md border ${statusConfig.badge}`}>
                              {statusConfig.label}
                            </span>

                            {/* Violation Reason Badge */}
                            <span className={`px-2.5 py-1 rounded-md border font-semibold ${reasonConfig.color}`}>
                              Lý do: {reasonConfig.label}
                            </span>

                            <span className="text-on-surface-variant/70 font-mono">
                              #{rep.id}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 text-on-surface-variant">
                            <span className="material-symbols-outlined text-[15px]">schedule</span>
                            <span>{new Date(rep.created_at).toLocaleString("vi-VN")}</span>
                          </div>
                        </div>

                        {/* Report Body Grid */}
                        <div className="p-md grid grid-cols-1 lg:grid-cols-12 gap-md">
                          {/* Left Column: Reported Content Details (8 cols) */}
                          <div className="lg:col-span-8 space-y-sm">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <img
                                  src={authorAvatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=80&q=80"}
                                  alt={authorName}
                                  className="w-8 h-8 rounded-full object-cover border border-outline-variant/30"
                                />
                                <div>
                                  <span className="font-bold text-sm text-on-surface block leading-tight">
                                    {authorName || "Người dùng ẩn danh"}
                                  </span>
                                  <span className="text-xs text-on-surface-variant">
                                    Tác giả {isPost ? "bài viết" : "bình luận"}
                                  </span>
                                </div>
                              </div>

                              {/* Content status badge */}
                              <div>
                                {isDeleted ? (
                                  <span className="px-2 py-0.5 rounded text-xs font-bold bg-red-100 text-red-800 border border-red-200 flex items-center gap-1">
                                    <span className="material-symbols-outlined text-[13px]">delete</span>
                                    Đã bị xóa
                                  </span>
                                ) : isHidden ? (
                                  <span className="px-2 py-0.5 rounded text-xs font-bold bg-amber-100 text-amber-900 border border-amber-200 flex items-center gap-1">
                                    <span className="material-symbols-outlined text-[13px]">visibility_off</span>
                                    Đang bị ẩn
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                                    <span className="material-symbols-outlined text-[13px]">check</span>
                                    Đang hiển thị công khai
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Content Display */}
                            <div className="p-sm bg-surface-container-high/40 rounded-lg border border-outline-variant/15">
                              {isPost && rep.post_title && (
                                <h4 className="font-bold text-sm text-on-surface mb-1">
                                  {rep.post_title}
                                </h4>
                              )}

                              <p className="text-sm text-on-surface whitespace-pre-wrap leading-relaxed">
                                {contentText || (
                                  <span className="italic text-on-surface-variant">
                                    (Không có nội dung văn bản)
                                  </span>
                                )}
                              </p>

                              {/* Post Media if available */}
                              {isPost && rep.post_media && rep.post_media.length > 0 && (
                                <div className="mt-2 flex flex-wrap gap-2">
                                  {rep.post_media.map((url, i) => (
                                    <a
                                      key={i}
                                      href={url}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="relative group block rounded-md overflow-hidden border border-outline-variant/30"
                                    >
                                      <img
                                        src={url}
                                        alt={`Đính kèm ${i + 1}`}
                                        className="w-20 h-20 object-cover group-hover:scale-105 transition-transform"
                                      />
                                      <span className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                                        <span className="material-symbols-outlined text-[18px]">zoom_in</span>
                                      </span>
                                    </a>
                                  ))}
                                </div>
                              )}
                            </div>

                            {/* Context link to community post */}
                            <div className="flex items-center gap-2 pt-1 text-xs">
                              <a
                                href={postLink}
                                target="_blank"
                                rel="noreferrer"
                                className="text-primary hover:underline font-bold flex items-center gap-1"
                              >
                                <span>Xem trực tiếp trên CulinShare</span>
                                <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                              </a>
                              {isComment && rep.comment_post_title && (
                                <span className="text-on-surface-variant">
                                  (Bài viết: &quot;{rep.comment_post_title}&quot;)
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Right Column: Reporter & Report Reasons (4 cols) */}
                          <div className="lg:col-span-4 bg-surface-container-high/30 p-sm rounded-lg border border-outline-variant/10 flex flex-col justify-between">
                            <div className="space-y-2">
                              <div className="text-xs font-bold text-on-surface-variant uppercase tracking-wider flex items-center gap-1">
                                <span className="material-symbols-outlined text-[15px]">report</span>
                                Người báo cáo
                              </div>

                              <div className="flex items-center gap-2">
                                <img
                                  src={rep.reporter_avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=80&q=80"}
                                  alt={rep.reporter_name}
                                  className="w-7 h-7 rounded-full object-cover border border-outline-variant/20"
                                />
                                <div>
                                  <p className="font-bold text-xs text-on-surface leading-tight">
                                    {rep.reporter_name || rep.reporter_username}
                                  </p>
                                  <p className="text-[11px] text-on-surface-variant">
                                    @{rep.reporter_username}
                                  </p>
                                </div>
                              </div>

                              <div className="pt-1">
                                <span className="text-xs font-semibold text-on-surface-variant block mb-1">
                                  Mô tả chi tiết vi phạm:
                                </span>
                                <div className="p-2 bg-surface rounded text-xs text-on-surface border border-outline-variant/15 italic">
                                  {rep.description || "(Không có mô tả chi tiết kèm theo)"}
                                </div>
                              </div>

                              {rep.reviewed_at && (
                                <div className="text-[11px] text-on-surface-variant pt-2 border-t border-outline-variant/10">
                                  Đã duyệt bởi: <span className="font-bold text-on-surface">{rep.reviewer_name || "Quản trị viên"}</span>
                                  <br />
                                  Vào lúc: {new Date(rep.reviewed_at).toLocaleString("vi-VN")}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Report Action Buttons Footer */}
                        <div className="px-md py-3 bg-surface-container-high/20 border-t border-outline-variant/10 flex flex-wrap items-center justify-between gap-2">
                          <div className="text-xs text-on-surface-variant flex items-center gap-1">
                            <span className="material-symbols-outlined text-[15px]">gavel</span>
                            Hành động can thiệp:
                          </div>

                          <div className="flex flex-wrap items-center gap-2">
                            {/* Hide content button */}
                            {!isHidden && !isDeleted && (
                              <button
                                type="button"
                                onClick={() => handleReportAction(rep.id, "hide_content", "Bạn có chắc chắn muốn ẩn nội dung này khỏi cộng đồng?")}
                                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-100 text-amber-900 hover:bg-amber-200 active:scale-95 transition-all flex items-center gap-1 shadow-xs"
                                title="Ẩn nội dung để người dùng khác không thể thấy"
                              >
                                <span className="material-symbols-outlined text-[15px]">visibility_off</span>
                                Ẩn nội dung
                              </button>
                            )}

                            {/* Delete content button */}
                            {!isDeleted && (
                              <button
                                type="button"
                                onClick={() => handleReportAction(rep.id, "delete_content", "Bạn có chắc chắn muốn xóa nội dung này? Thao tác này sẽ gỡ bài viết/bình luận.")}
                                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-error-container text-error hover:bg-error/20 active:scale-95 transition-all flex items-center gap-1 shadow-xs"
                                title="Xóa nội dung vi phạm"
                              >
                                <span className="material-symbols-outlined text-[15px]">delete</span>
                                Xóa nội dung
                              </button>
                            )}

                            {/* Restore content button if currently hidden or deleted */}
                            {(isHidden || isDeleted) && (
                              <button
                                type="button"
                                onClick={() => handleReportAction(rep.id, "restore_content", "Khôi phục và công khai lại nội dung này trên cộng đồng?")}
                                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-100 text-emerald-800 hover:bg-emerald-200 active:scale-95 transition-all flex items-center gap-1 shadow-xs"
                                title="Bỏ ẩn / Khôi phục nội dung"
                              >
                                <span className="material-symbols-outlined text-[15px]">visibility</span>
                                Khôi phục hiển thị
                              </button>
                            )}

                            {/* Dismiss report button if not already dismissed */}
                            {rep.status !== "dismissed" && (
                              <button
                                type="button"
                                onClick={() => handleReportAction(rep.id, "dismiss_report", "Bác bỏ báo cáo này nếu nội dung không vi phạm quy định cộng đồng?")}
                                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-surface-container-high text-on-surface hover:bg-surface-variant border border-outline-variant/30 active:scale-95 transition-all flex items-center gap-1 shadow-xs"
                                title="Đóng báo cáo vì không vi phạm"
                              >
                                <span className="material-symbols-outlined text-[15px]">do_not_disturb_on</span>
                                Bác bỏ báo cáo
                              </button>
                            )}

                            {/* Reopen report button if reviewed or dismissed */}
                            {rep.status !== "pending" && (
                              <button
                                type="button"
                                onClick={() => handleReportAction(rep.id, "reopen_report", "Đưa báo cáo này trở lại trạng thái chờ xử lý?")}
                                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-surface-container-high text-on-surface hover:bg-surface-variant border border-outline-variant/30 active:scale-95 transition-all flex items-center gap-1 shadow-xs"
                                title="Mở lại báo cáo để kiểm duyệt lại"
                              >
                                <span className="material-symbols-outlined text-[15px]">restart_alt</span>
                                Mở lại
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </main>
        
        {/* Footer */}
        <footer className="w-full py-xl border-t border-outline-variant/20 bg-surface-container-highest select-none mt-auto">
          <div className="flex flex-col md:flex-row justify-between items-center px-6 sm:px-10 md:px-14 lg:px-20 xl:px-24 w-full gap-md">
            <div className="flex flex-col items-center md:items-start">
              <span className="font-headline-sm text-headline-sm font-bold text-on-surface mb-2 font-display-md text-primary">CulinShare</span>
              <p className="font-body-md text-body-md text-on-surface-variant">© {new Date().getFullYear()} CulinShare. Crafted for home chefs.</p>
            </div>
            <div className="flex gap-lg">
              <Link className="font-label-sm text-label-sm text-on-surface-variant hover:text-primary underline transition-all" to="/about">About</Link>
              <Link className="font-label-sm text-label-sm text-on-surface-variant hover:text-primary underline transition-all" to="/privacy">Privacy</Link>
              <Link className="font-label-sm text-label-sm text-on-surface-variant hover:text-primary underline transition-all" to="/terms">Terms</Link>
              <Link className="font-label-sm text-label-sm text-on-surface-variant hover:text-primary underline transition-all" to="/contact#faq">Help</Link>
              <Link className="font-label-sm text-label-sm text-on-surface-variant hover:text-primary underline transition-all" to="/contact">Contact</Link>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
