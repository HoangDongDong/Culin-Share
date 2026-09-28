import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { logoutAccount, uploadUserAvatar } from "../store/authSlice";
import { getProfileApi, updateProfileApi } from "../services/authApi";
import { getImageUrl } from "../services/api";
import { updateHealthStatsApi, changePasswordApi } from "../services/recipeApi";

const ProfilePage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  const [name, setName] = useState(user?.fullName || user?.full_name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [bio, setBio] = useState("");
  const [phone, setPhone] = useState("");
  const [facebook, setFacebook] = useState("");
  const [instagram, setInstagram] = useState("");
  const [loading, setLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Health stats & TDEE state
  const [section, setSection] = useState("personal");
  const [height, setHeight] = useState(user?.height || "");
  const [weight, setWeight] = useState(user?.weight || "");
  const [activityLevel, setActivityLevel] = useState(user?.activity_level || user?.activityLevel || "sedentary");
  const [gender, setGender] = useState("male");
  const [age, setAge] = useState("25");
  const [healthResult, setHealthResult] = useState(null);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const data = await getProfileApi();
        setName(data.full_name || data.fullName || "");
        setEmail(data.email || "");
        setBio(data.bio || "");
        setPhone(data.phone || "");
        setFacebook(data.facebook_url || data.facebookUrl || "");
        setInstagram(data.instagram_username || data.instagramUsername || "");
        
        // Health stats
        setHeight(data.height || "");
        setWeight(data.weight || "");
        setActivityLevel(data.activity_level || data.activityLevel || "sedentary");

        // Sync with Redux and localStorage
        localStorage.setItem("user", JSON.stringify(data));
        dispatch({
          type: "auth/updateUserProfile/fulfilled",
          payload: data
        });
      } catch (err) {
        console.error("Lỗi khi tải profile:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [dispatch]);

  const handleLogout = () => {
    dispatch(logoutAccount());
    navigate("/login");
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      const resultAction = await dispatch(uploadUserAvatar(file));
      if (uploadUserAvatar.fulfilled.match(resultAction)) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2000);
      } else {
        alert(resultAction.payload || "Lỗi khi tải lên ảnh đại diện");
      }
    } catch (err) {
      alert(err.message || "Lỗi khi tải lên ảnh đại diện");
    } finally {
      setLoading(false);
      if (e.target) {
        e.target.value = "";
      }
    }
  };

  const handleRemoveAvatar = async () => {
    setLoading(true);
    try {
      const updatedUser = await updateProfileApi({
        avatarUrl: ""
      });
      localStorage.setItem("user", JSON.stringify(updatedUser));
      dispatch({
        type: "auth/updateUserProfile/fulfilled",
        payload: updatedUser
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (err) {
      alert(err.message || "Lỗi khi xóa ảnh đại diện");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const updatedUser = await updateProfileApi({
        fullName: name,
        email,
        bio,
        phone,
        facebookUrl: facebook,
        instagramUsername: instagram
      });
      localStorage.setItem("user", JSON.stringify(updatedUser));
      dispatch({
        type: "auth/updateUserProfile/fulfilled",
        payload: updatedUser
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (err) {
      alert(err.message || "Lỗi khi cập nhật profile");
    } finally {
      setLoading(false);
    }
  };

  const handleHealthSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await updateHealthStatsApi({
        height: parseInt(height),
        weight: parseInt(weight),
        activity_level: activityLevel,
        gender,
        age: parseInt(age)
      });
      setHealthResult(result.health_stats);
      const updatedUser = result.user;
      localStorage.setItem("user", JSON.stringify(updatedUser));
      dispatch({
        type: "auth/updateUserProfile/fulfilled",
        payload: updatedUser
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (err) {
      alert(err.message || "Lỗi khi cập nhật chỉ số sức khỏe");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSave = async (e) => {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess("");

    if (newPassword !== confirmPassword) {
      setPasswordError("Mật khẩu xác nhận không khớp");
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError("Mật khẩu mới phải từ 6 ký tự trở lên");
      return;
    }

    try {
      setLoading(true);
      await changePasswordApi({
        currentPassword,
        newPassword
      });
      setPasswordSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setPasswordSuccess(false), 3000);
    } catch (err) {
      setPasswordError(err.message || "Lỗi khi đổi mật khẩu");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-surface text-on-surface font-body-md min-h-screen flex flex-col">
      <Header />
      
      <main className="max-w-max-width mx-auto px-margin-mobile md:px-margin-desktop py-lg flex-grow w-full">
        <div className="flex flex-col md:flex-row gap-lg">
          {/* Side Navigation */}
          <aside className="w-full md:w-64 shrink-0 select-none">
            <div className="space-y-base">
              <button
                onClick={() => setSection("personal")}
                className={`w-full flex items-center gap-sm px-md py-3 rounded-lg font-bold transition-all shadow-sm text-left ${
                  section === "personal" ? "bg-primary-container/10 text-primary" : "text-secondary hover:bg-surface-container-low"
                }`}
              >
                <span className="material-symbols-outlined text-sm font-bold">person</span>
                <span className="font-label-md text-label-md">Thông tin cá nhân</span>
              </button>
              <button
                onClick={() => setSection("health")}
                className={`w-full flex items-center gap-sm px-md py-3 rounded-lg font-bold transition-all shadow-sm text-left ${
                  section === "health" ? "bg-primary-container/10 text-primary" : "text-secondary hover:bg-surface-container-low"
                }`}
              >
                <span className="material-symbols-outlined text-sm font-bold">monitoring</span>
                <span className="font-label-md text-label-md">Chỉ số sức khỏe & TDEE</span>
              </button>
              <button
                onClick={() => setSection("security")}
                className={`w-full flex items-center gap-sm px-md py-3 rounded-lg font-bold transition-all shadow-sm text-left ${
                  section === "security" ? "bg-primary-container/10 text-primary" : "text-secondary hover:bg-surface-container-low"
                }`}
              >
                <span className="material-symbols-outlined text-sm font-bold">lock</span>
                <span className="font-label-md text-label-md">Mật khẩu & Bảo mật</span>
              </button>
              <Link to="/saved-recipes" className="flex items-center gap-sm px-md py-3 rounded-lg text-secondary hover:bg-surface-container-low transition-colors">
                <span className="material-symbols-outlined text-sm">bookmark</span>
                <span className="font-label-md text-label-md">Công thức đã lưu</span>
              </Link>
              
              <div className="pt-lg">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-sm px-md py-3 rounded-lg text-error hover:bg-error-container/10 transition-colors text-left font-bold"
                >
                  <span className="material-symbols-outlined text-sm font-bold">logout</span>
                  <span className="font-label-md text-label-md">Đăng xuất</span>
                </button>
              </div>
            </div>
          </aside>

          {/* Main Content Area */}
          <section className="flex-grow">
            {section === "personal" ? (
              <>
                <div className="mb-lg select-none">
                  <h1 className="font-headline-md text-headline-md text-on-surface mb-xs font-bold">Cài đặt hồ sơ</h1>
                  <p className="text-on-surface-variant font-body-md">Quản lý thông tin công khai và cài đặt tài khoản của bạn.</p>
                </div>
                
                <div className="bg-surface-container-lowest rounded-xl p-md md:p-lg shadow-soft border border-outline-variant/10">
                  {/* Profile Picture Section */}
                  <div className="flex flex-col items-center md:flex-row md:items-start gap-md mb-lg border-b border-outline-variant/20 pb-lg">
                    <div className="relative group cursor-pointer select-none">
                      <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-surface-container-high shadow-sm">
                        <img
                          alt="User avatar preview"
                          className="w-full h-full object-cover"
                          src={getImageUrl(user?.avatarUrl || user?.avatar_url || user?.avatar) || "https://lh3.googleusercontent.com/aida-public/AB6AXuAJo_eCiHEmgpJvhk5_EqIDtHApDD7mQOsztmQH04030D2ZbgjV3pMSRkeW7rZE8rhhQxG2ppeWl7pJvDbppLZn9XLqmJWIaNeminSRoka2zzE9nyCYIlk0ZMLOPrfuWofeM12lXn-HG_pFXCuMeN15SV4ZfZdPNe4Xfmqe4mew_R9OeCshJraJ4_c-9XhdGzjQbzpbQ7mIRzufxncVevVyOF6H9tpRloO6SMq8D6Ol3MKStLwkxTRuVbHmtx1JMFojYkrlH2n7XA"}
                        />
                      </div>
                      <div 
                        onClick={() => document.getElementById("avatar-upload-input").click()}
                        className="absolute inset-0 bg-on-background/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <span className="material-symbols-outlined text-surface font-bold">edit</span>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        id="avatar-upload-input"
                        onChange={handleAvatarChange}
                      />
                    </div>
                    
                    <div className="text-center md:text-left pt-xs select-none">
                      <h3 className="font-headline-sm text-headline-sm mb-xs font-bold text-on-surface">Ảnh đại diện</h3>
                      <p className="text-on-surface-variant font-body-md mb-sm">Tải lên ảnh mới. Định dạng PNG, JPG hoặc GIF.</p>
                      <div className="flex gap-sm justify-center md:justify-start">
                        <button 
                          type="button"
                          onClick={() => document.getElementById("avatar-upload-input").click()}
                          className="px-5 py-2 rounded-full border border-outline text-on-surface hover:bg-surface-container-high transition-colors font-label-md text-label-md font-bold shadow-sm"
                        >
                          Thay đổi
                        </button>
                        <button 
                          type="button"
                          onClick={handleRemoveAvatar}
                          className="px-5 py-2 rounded-full text-error hover:bg-error-container/10 transition-colors font-label-md text-label-md font-bold"
                        >
                          Xóa ảnh
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Form Fields */}
                  <form onSubmit={handleSave} className="space-y-md">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
                      {/* Full Name */}
                      <div className="flex flex-col gap-xs">
                        <label className="font-label-md text-label-md text-on-surface-variant px-xs font-bold">Họ và tên</label>
                        <input
                          className="w-full bg-white border border-outline-variant/30 rounded-lg px-md py-2.5 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-on-surface"
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          required
                        />
                      </div>
                      {/* Email */}
                      <div className="flex flex-col gap-xs">
                        <label className="font-label-md text-label-md text-on-surface-variant px-xs font-bold">Email</label>
                        <input
                          className="w-full bg-white border border-outline-variant/30 rounded-lg px-md py-2.5 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-on-surface"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                    
                    {/* Bio */}
                    <div className="flex flex-col gap-xs">
                      <label className="font-label-md text-label-md text-on-surface-variant px-xs font-bold">Giới thiệu bản thân</label>
                      <textarea
                        className="w-full bg-white border border-outline-variant/30 rounded-lg px-md py-2.5 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none text-on-surface leading-relaxed"
                        rows="4"
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                      ></textarea>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
                      {/* Phone */}
                      <div className="flex flex-col gap-xs">
                        <label className="font-label-md text-label-md text-on-surface-variant px-xs font-bold">Số điện thoại</label>
                        <input
                          className="w-full bg-white border border-outline-variant/30 rounded-lg px-md py-2.5 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-on-surface"
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                        />
                      </div>
                      
                      {/* Food Preferences */}
                      <div className="flex flex-col gap-xs select-none">
                        <label className="font-label-md text-label-md text-on-surface-variant px-xs font-bold">Sở thích ẩm thực</label>
                        <div className="flex flex-wrap gap-xs py-xs">
                          {["Món Việt", "Baking", "Eat Clean"].map((pref) => (
                            <span key={pref} className="px-3 py-1 rounded-full bg-tertiary/10 text-tertiary font-label-sm text-label-sm font-bold">
                              {pref}
                            </span>
                          ))}
                          <button type="button" className="px-3 py-1 rounded-full border border-dashed border-outline-variant text-on-surface-variant font-label-sm text-label-sm flex items-center gap-1 hover:bg-surface-container transition-all font-bold">
                            <span className="material-symbols-outlined text-[14px]">add</span>Thêm
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Social Links */}
                    <div className="pt-md select-none">
                      <h4 className="font-label-md text-label-md text-on-surface-variant mb-sm uppercase tracking-wider font-bold">Mạng xã hội</h4>
                      <div className="space-y-sm">
                        <div className="flex items-center gap-sm">
                          <div className="w-10 h-10 flex items-center justify-center rounded-lg bg-surface-container-high text-secondary">
                            <span className="material-symbols-outlined">link</span>
                          </div>
                          <input
                            className="flex-1 bg-white border border-outline-variant/30 rounded-lg px-md py-2.5 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-on-surface"
                            placeholder="Facebook profile URL"
                            type="text"
                            value={facebook}
                            onChange={(e) => setFacebook(e.target.value)}
                          />
                        </div>
                        <div className="flex items-center gap-sm">
                          <div className="w-10 h-10 flex items-center justify-center rounded-lg bg-surface-container-high text-secondary">
                            <span className="material-symbols-outlined">photo_camera</span>
                          </div>
                          <input
                            className="flex-1 bg-white border border-outline-variant/30 rounded-lg px-md py-2.5 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-on-surface"
                            placeholder="Instagram username"
                            type="text"
                            value={instagram}
                            onChange={(e) => setInstagram(e.target.value)}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-lg flex items-center justify-end gap-md select-none border-t border-outline-variant/10">
                      <button
                        type="button"
                        onClick={() => navigate("/")}
                        className="px-6 py-2.5 rounded-full text-secondary hover:bg-surface-container-high transition-colors font-label-md text-label-md font-bold"
                      >
                        Hủy bỏ
                      </button>
                      <button
                        type="submit"
                        disabled={loading}
                        className={`px-6 py-2.5 rounded-full font-label-md text-label-md font-bold transition-all shadow-sm flex items-center justify-center gap-2 ${
                          saveSuccess ? "bg-tertiary text-white" : "bg-primary text-white hover:bg-primary/90 active:scale-95"
                        }`}
                      >
                        {loading ? (
                          <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>
                        ) : saveSuccess ? (
                          "Đã lưu!"
                        ) : (
                          "Lưu thay đổi"
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </>
            ) : section === "health" ? (
              <>
                <div className="mb-lg select-none">
                  <h1 className="font-headline-md text-headline-md text-on-surface mb-xs font-bold">Chỉ số sức khỏe & TDEE</h1>
                  <p className="text-on-surface-variant font-body-md">Theo dõi chiều cao, cân nặng và mức độ hoạt động để tính toán dinh dưỡng cá nhân hóa.</p>
                </div>
                
                <div className="bg-surface-container-lowest rounded-xl p-md md:p-lg shadow-soft border border-outline-variant/10">
                  <form onSubmit={handleHealthSave} className="space-y-md">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
                      {/* Height */}
                      <div className="flex flex-col gap-xs">
                        <label className="font-label-md text-label-md text-on-surface-variant px-xs font-bold">Chiều cao (cm)</label>
                        <input
                          className="w-full bg-white border border-outline-variant/30 rounded-lg px-md py-2.5 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-on-surface"
                          type="number"
                          value={height}
                          onChange={(e) => setHeight(e.target.value)}
                          placeholder="Ví dụ: 170"
                          required
                        />
                      </div>
                      {/* Weight */}
                      <div className="flex flex-col gap-xs">
                        <label className="font-label-md text-label-md text-on-surface-variant px-xs font-bold">Cân nặng (kg)</label>
                        <input
                          className="w-full bg-white border border-outline-variant/30 rounded-lg px-md py-2.5 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-on-surface"
                          type="number"
                          value={weight}
                          onChange={(e) => setWeight(e.target.value)}
                          placeholder="Ví dụ: 65"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-md">
                      {/* Gender */}
                      <div className="flex flex-col gap-xs">
                        <label className="font-label-md text-label-md text-on-surface-variant px-xs font-bold">Giới tính</label>
                        <select
                          className="w-full bg-white border border-outline-variant/30 rounded-lg px-md py-2.5 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-on-surface"
                          value={gender}
                          onChange={(e) => setGender(e.target.value)}
                        >
                          <option value="male">Nam</option>
                          <option value="female">Nữ</option>
                        </select>
                      </div>
                      {/* Age */}
                      <div className="flex flex-col gap-xs">
                        <label className="font-label-md text-label-md text-on-surface-variant px-xs font-bold">Tuổi</label>
                        <input
                          className="w-full bg-white border border-outline-variant/30 rounded-lg px-md py-2.5 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-on-surface"
                          type="number"
                          value={age}
                          onChange={(e) => setAge(e.target.value)}
                          placeholder="Ví dụ: 25"
                          required
                        />
                      </div>
                      {/* Activity Level */}
                      <div className="flex flex-col gap-xs">
                        <label className="font-label-md text-label-md text-on-surface-variant px-xs font-bold">Mức độ hoạt động</label>
                        <select
                          className="w-full bg-white border border-outline-variant/30 rounded-lg px-md py-2.5 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-on-surface"
                          value={activityLevel}
                          onChange={(e) => setActivityLevel(e.target.value)}
                        >
                          <option value="sedentary">Ít vận động (sedentary)</option>
                          <option value="light">Vận động nhẹ (light)</option>
                          <option value="moderate">Vận động vừa (moderate)</option>
                          <option value="active">Vận động mạnh (active)</option>
                          <option value="very_active">Vận động cực nhiều (very_active)</option>
                        </select>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-lg flex items-center justify-end gap-md select-none border-t border-outline-variant/10">
                      <button
                        type="submit"
                        disabled={loading}
                        className={`px-6 py-2.5 rounded-full font-label-md text-label-md font-bold transition-all shadow-sm flex items-center justify-center gap-2 ${
                          saveSuccess ? "bg-tertiary text-white" : "bg-primary text-white hover:bg-primary/90 active:scale-95"
                        }`}
                      >
                        {loading ? (
                          <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>
                        ) : saveSuccess ? (
                          "Đã tính toán!"
                        ) : (
                          "Lưu & Tính TDEE"
                        )}
                      </button>
                    </div>
                  </form>

                  {/* Health Results */}
                  {(healthResult || (user?.height && user?.weight)) && (
                    <div className="mt-lg border-t border-outline-variant/20 pt-lg space-y-md">
                      <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">Kết quả chỉ số cơ thể</h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-md">
                        {/* BMI */}
                        <div className="bg-surface-container-low rounded-xl p-md border border-outline-variant/5 shadow-soft">
                          <span className="text-xs text-on-surface-variant font-bold uppercase tracking-wider block mb-1">Chỉ số BMI</span>
                          <div className="flex items-baseline gap-2">
                            <span className="text-headline-sm font-bold text-on-background">
                              {healthResult ? healthResult.bmi : parseFloat((user.weight / ((user.height / 100) * (user.height / 100))).toFixed(2))}
                            </span>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                              (() => {
                                const bmiVal = healthResult ? healthResult.bmi : (user.weight / ((user.height / 100) * (user.height / 100)));
                                if (bmiVal < 18.5) return "bg-amber-100 text-amber-800";
                                if (bmiVal >= 18.5 && bmiVal < 25) return "bg-green-100 text-green-800";
                                return "bg-red-100 text-red-800";
                              })()
                            }`}>
                              {healthResult ? healthResult.bmi_status : (() => {
                                const bmiVal = (user.weight / ((user.height / 100) * (user.height / 100)));
                                if (bmiVal < 18.5) return "Thiếu cân";
                                if (bmiVal >= 18.5 && bmiVal < 25) return "Bình thường";
                                if (bmiVal >= 25 && bmiVal < 29.9) return "Thừa cân";
                                return "Béo phì";
                              })()}
                            </span>
                          </div>
                        </div>

                        {/* BMR */}
                        <div className="bg-surface-container-low rounded-xl p-md border border-outline-variant/5 shadow-soft">
                          <span className="text-xs text-on-surface-variant font-bold uppercase tracking-wider block mb-1">BMR (Calo tối thiểu)</span>
                          <div className="flex items-baseline gap-1">
                            <span className="text-headline-sm font-bold text-on-background">
                              {healthResult ? healthResult.bmr : Math.round((10 * user.weight) + (6.25 * user.height) - (5 * 25) + 5)}
                            </span>
                            <span className="text-xs text-on-surface-variant">kcal/ngày</span>
                          </div>
                        </div>

                        {/* TDEE */}
                        <div className="bg-surface-container-low rounded-xl p-md border border-outline-variant/5 shadow-soft bg-primary/5">
                          <span className="text-xs text-primary font-bold uppercase tracking-wider block mb-1">TDEE (Calo tiêu thụ)</span>
                          <div className="flex items-baseline gap-1">
                            <span className="text-headline-sm font-bold text-primary">
                              {healthResult ? healthResult.tdee : (() => {
                                const bmrVal = (10 * user.weight) + (6.25 * user.height) - (5 * 25) + 5;
                                const multipliers = {
                                  sedentary: 1.2,
                                  light: 1.375,
                                  moderate: 1.55,
                                  active: 1.725,
                                  very_active: 1.9
                                };
                                const mult = multipliers[user.activity_level || user.activityLevel || "sedentary"] || 1.2;
                                return Math.round(bmrVal * mult);
                              })()}
                            </span>
                            <span className="text-xs text-primary font-bold">kcal/ngày</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : section === "security" ? (
              <>
                <div className="mb-lg select-none">
                  <h1 className="font-headline-md text-headline-md text-on-surface mb-xs font-bold">Mật khẩu & Bảo mật</h1>
                  <p className="text-on-surface-variant font-body-md">Đổi mật khẩu tài khoản của bạn để đảm bảo an toàn.</p>
                </div>
                
                <div className="bg-surface-container-lowest rounded-xl p-md md:p-lg shadow-soft border border-outline-variant/10">
                  <form onSubmit={handlePasswordSave} className="space-y-md">
                    <div className="flex flex-col gap-xs">
                      <label className="font-label-md text-label-md text-on-surface-variant px-xs font-bold">Mật khẩu hiện tại</label>
                      <input
                        className="w-full bg-white border border-outline-variant/30 rounded-lg px-md py-2.5 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-on-surface"
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="Nhập mật khẩu hiện tại"
                        required
                      />
                    </div>

                    <div className="flex flex-col gap-xs">
                      <label className="font-label-md text-label-md text-on-surface-variant px-xs font-bold">Mật khẩu mới</label>
                      <input
                        className="w-full bg-white border border-outline-variant/30 rounded-lg px-md py-2.5 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-on-surface"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Tối thiểu 6 ký tự"
                        required
                      />
                    </div>

                    <div className="flex flex-col gap-xs">
                      <label className="font-label-md text-label-md text-on-surface-variant px-xs font-bold">Xác nhận mật khẩu mới</label>
                      <input
                        className="w-full bg-white border border-outline-variant/30 rounded-lg px-md py-2.5 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-on-surface"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Nhập lại mật khẩu mới"
                        required
                      />
                    </div>

                    {passwordError && (
                      <p className="text-error text-xs px-xs font-bold">{passwordError}</p>
                    )}

                    {passwordSuccess && (
                      <p className="text-tertiary text-xs px-xs font-bold">Đổi mật khẩu thành công!</p>
                    )}

                    <div className="pt-lg flex items-center justify-end gap-md select-none border-t border-outline-variant/10">
                      <button
                        type="submit"
                        disabled={loading}
                        className={`px-6 py-2.5 rounded-full font-label-md text-label-md font-bold transition-all shadow-sm flex items-center justify-center gap-2 bg-primary text-white hover:bg-primary/90 active:scale-95`}
                      >
                        {loading ? (
                          <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>
                        ) : (
                          "Đổi mật khẩu"
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </>
            ) : null}
          </section>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default ProfilePage;
