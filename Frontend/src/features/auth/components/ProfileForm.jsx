import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../../store/authStore";
import { getMe, updateMe } from "../api/userApi";
import { getBranchById } from "../../facility/api/branchApi";
import { ProfileInfoSkeleton } from "../../../components/ui/SkeletonLoader";
import EmptyState from "../../../components/ui/EmptyState";
import MainLayout from "../../../layouts/MainLayout";

const ProfileForm = () => {
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [branchName, setBranchName] = useState(null);
  const [fullName, setFullName] = useState("");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setIsFetching(true);
        setFetchError(null);
        const response = await getMe();
        const newUser = response.data?.data || response.data;
        setUser(newUser);
        setFullName(newUser?.full_name || "");
        console.log("Dữ liệu người dùng đã được tải:", newUser);
      } catch (error) {
        console.error("Lỗi khi lấy dữ liệu người dùng:", error);
        setFetchError("Không thể tải thông tin cá nhân. Vui lòng thử lại sau.");
      } finally {
        setIsFetching(false);
      }
    };

    fetchUserData();
  }, []);

  useEffect(() => {
    const fetchBranchName = async () => {
      if (user?.branch_id) {
        try {
          const res = await getBranchById(user.branch_id);
          const branchData = res.data?.data || res.data;
          setBranchName(branchData?.name || "Không xác định");
        } catch (error) {
          console.error("Lỗi khi lấy tên chi nhánh:", error);
          setBranchName("Không xác định");
        }
      }
    };

    fetchBranchName();
  }, [user?.branch_id]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      const payload = {
        full_name: fullName,
        phone: user?.phone,
        password: user?.password,
        old_password: oldPassword,
        new_password: newPassword,
        confirm_new_password: confirmPassword,
      };

      const res = await updateMe(payload);
      alert("Cập nhật thông tin thành công");

      const newUserRes = await getMe();
      const newUser = newUserRes.data?.data || newUserRes.data;

      setAuth({
        user: newUser,
        access_token: "your_access_token",
        refresh_token: "your_refresh_token",
      });

      setUser(newUser);
      setFullName(newUser?.full_name || "");
      setIsEditing(false);
    } catch (error) {
      console.error("Lỗi khi cập nhật:", error);
      alert("Cập nhật thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="mx-auto w-full max-w-[95%] lg:max-w-[90%] xl:max-w-[85%] px-4 py-12 font-sans space-y-6 bg-slate-50/50">
        
        {/* Top Header Profile Card */}
        <div className="bg-white p-6 rounded-3xl shadow-[0_4px_24px_rgba(0,0,0,0.06)] border border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-lime-400/5 to-transparent pointer-events-none" />
          <div className="flex flex-col sm:flex-row items-center gap-6 relative z-10">
            <div className="w-24 h-24 rounded-full border-4 border-[#064e3b] flex items-center justify-center bg-white text-[#064e3b] font-black text-4xl shadow-md shrink-0">
              {(user?.full_name || "Cường").charAt(0).toUpperCase()}
            </div>
            <div className="text-center sm:text-left">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                <h2 className="text-2xl font-black text-slate-800 leading-none">
                  {user?.full_name || "Cường"}
                </h2>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-black bg-lime-400 text-emerald-950 uppercase tracking-wider">
                  Premium Member
                </span>
              </div>
              <p className="text-sm font-bold text-[#064e3b] mt-2 flex items-center justify-center sm:justify-start gap-1">
                Rating: 4.8 <span className="text-amber-500 text-base">★</span>
              </p>
            </div>
          </div>
          <div className="flex gap-3 relative z-10 shrink-0">
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="bg-white text-slate-700 hover:text-[#064e3b] border border-slate-200 hover:border-lime-400 font-bold py-2.5 px-4 rounded-xl text-sm transition-all duration-300 shadow-sm hover:shadow-md cursor-pointer"
              >
                Chỉnh sửa thông tin
              </button>
            )}
            <button
              onClick={() => navigate("/logout")}
              className="bg-[#064e3b] text-lime-400 hover:bg-lime-400 hover:text-emerald-950 font-black py-2.5 px-4 rounded-xl text-sm transition-all duration-300 shadow-sm hover:shadow-md cursor-pointer"
            >
              Đăng xuất
            </button>
          </div>
        </div>

        {/* Content Area */}
        {isFetching ? (
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_4px_24px_rgba(0,0,0,0.06)]">
            <ProfileInfoSkeleton />
          </div>
        ) : fetchError ? (
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_4px_24px_rgba(0,0,0,0.06)]">
            <EmptyState
              variant="light"
              title="Không tải được hồ sơ"
              description={fetchError}
              actionButton={
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="bg-[#064e3b] text-lime-400 hover:bg-lime-400 hover:text-[#064e3b] px-4 py-2 rounded-xl text-sm font-bold shadow-md cursor-pointer"
                >
                  Thử lại
                </button>
              }
            />
          </div>
        ) : !isEditing ? (
          <div className="space-y-6">
            {/* CARD: THÔNG TIN CÁ NHÂN */}
            <div className="bg-white rounded-3xl shadow-[0_4px_24px_rgba(0,0,0,0.06)] border border-slate-100 p-6">
              <h3 className="text-lg font-black text-[#064e3b] mb-6 border-l-4 border-lime-400 pl-3 uppercase tracking-wider">
                Thông tin cá nhân
              </h3>
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-4">
                <InfoItem label="Họ tên" value={user?.full_name || "Cường"} />
                <InfoItem label="Email" value={user?.email || "quoccuong@gmail.com"} />
                <InfoItem label="Số điện thoại" value={user?.phone || "0342067898"} />
                <InfoItem label="Điểm tích lũy" value={user?.loyalty_points ?? 0} />
                <InfoItem label="Hạng mức" value={user?.loyalty_tier || "standard"} />
                <InfoItem label="Hạng kỹ năng" value={user?.skill_rank || "A"} />
                <InfoItem label="Điểm elo" value={user?.elo_score ?? 4000} />
                <InfoItem label="Số dư tài khoản" value={user?.credit ? `${user.credit.toLocaleString('vi-VN')} đ` : "Chưa có"} />
              </div>
            </div>

            {/* TWO-COLUMN GRID: HOẠT ĐỘNG GẦN ĐÂY & HỆ THỐNG BOOKING */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* CARD: HOẠT ĐỘNG GẦN ĐÂY */}
              <div className="bg-white rounded-3xl shadow-[0_4px_24px_rgba(0,0,0,0.06)] border border-slate-100 p-6 flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-black text-[#064e3b] mb-6 border-l-4 border-lime-400 pl-3 uppercase tracking-wider">
                    Hoạt động gần đây
                  </h3>
                  <div className="space-y-4">
                    <ActivityItem title="Sân 03 - 18:00" subtitle="Today" />
                    <ActivityItem title="Sân Super VIP - 19:00" subtitle="Yesterday" />
                    <ActivityItem title="Sân 03 - VIP - 19:00" subtitle="Yesterday" />
                  </div>
                </div>
              </div>

              {/* CARD: HỆ THỐNG BOOKING */}
              <div className="bg-white rounded-3xl shadow-[0_4px_24px_rgba(0,0,0,0.06)] border border-slate-100 p-6">
                <h3 className="text-lg font-black text-[#064e3b] mb-6 border-l-4 border-lime-400 pl-3 uppercase tracking-wider">
                  Hệ thống Booking
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* Column 1: Lịch */}
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-xs font-bold text-slate-700">Tuần tới</span>
                    </div>
                    {/* Mini Calendar Grid */}
                    <div className="grid grid-cols-7 gap-1 text-center text-[10px]">
                      {['Sun', 'Mo', 'Tue', 'We', 'Thu', 'Fri', 'Sat'].map(d => (
                        <div key={d} className="font-bold text-slate-450 py-1">{d}</div>
                      ))}
                      {Array.from({ length: 30 }).map((_, idx) => {
                        const dateNum = idx + 1;
                        const isBooked = [8, 9, 10, 15, 16, 17, 22, 23].includes(dateNum);
                        return (
                          <div
                            key={dateNum}
                            className={`py-1.5 rounded-full flex items-center justify-center font-semibold transition-all ${
                              isBooked
                                ? 'bg-lime-400/20 text-[#064e3b] font-bold shadow-sm'
                                : 'text-slate-600 hover:bg-slate-50'
                            }`}
                          >
                            {dateNum}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Column 2: Tóm tắt & Liên kết */}
                  <div className="flex flex-col justify-between border-t sm:border-t-0 sm:border-l border-slate-100 pt-6 sm:pt-0 sm:pl-6">
                    <div className="space-y-4">
                      <div>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tổng booking</p>
                        <p className="text-xl font-black text-slate-800 mt-1">2 đặt đặt</p>
                      </div>
                      
                      <div className="space-y-2 pt-2 border-t border-slate-50">
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Nhanh links</p>
                        <button
                          onClick={() => navigate("/my-bookings")}
                          className="block text-sm font-bold text-[#064e3b] hover:text-lime-500 transition-colors text-left cursor-pointer"
                        >
                          Sân đã đặt
                        </button>
                        <button
                          onClick={() => navigate("/my-bookings")}
                          className="block text-sm font-bold text-[#064e3b] hover:text-lime-500 transition-colors text-left cursor-pointer"
                        >
                          Quản lý đặt sân
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-[0_4px_24px_rgba(0,0,0,0.06)] border border-slate-100 p-6 space-y-6">
            <h3 className="text-lg font-black text-[#064e3b] border-l-4 border-lime-400 pl-3 uppercase tracking-wider">
              Chỉnh sửa thông tin cá nhân
            </h3>
            
            <div className="grid gap-6 sm:grid-cols-2">
              <FormGroup label="Họ tên">
                <input
                  type="text"
                  name="full_name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Nhập họ tên"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition duration-300 focus:border-lime-400 focus:ring-4 focus:ring-lime-400/20 text-sm"
                />
              </FormGroup>
              <FormGroup label="Số điện thoại">
                <input
                  type="text"
                  name="phone"
                  value={user?.phone || ""}
                  onChange={(e) => setUser({ ...user, phone: e.target.value })}
                  placeholder="Nhập số điện thoại"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition duration-300 focus:border-lime-400 focus:ring-4 focus:ring-lime-400/20 text-sm"
                />
              </FormGroup>
            </div>

            <div className="grid gap-6 sm:grid-cols-3">
              <FormGroup label="Mật khẩu cũ">
                <input
                  type="password"
                  name="old_password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="Nhập mật khẩu cũ"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition duration-300 focus:border-lime-400 focus:ring-4 focus:ring-lime-400/20 text-sm"
                />
              </FormGroup>
              <FormGroup label="Mật khẩu mới">
                <input
                  type="password"
                  name="new_password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Nhập mật khẩu mới"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition duration-300 focus:border-lime-400 focus:ring-4 focus:ring-lime-400/20 text-sm"
                />
              </FormGroup>
              <FormGroup label="Xác nhận mật khẩu mới">
                <input
                  type="password"
                  name="confirm_password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Nhập lại mật khẩu mới"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition duration-300 focus:border-lime-400 focus:ring-4 focus:ring-lime-400/20 text-sm"
                />
              </FormGroup>
            </div>

            <div className="flex gap-3 pt-4 border-t border-slate-100">
              <button
                type="submit"
                disabled={loading}
                className="bg-[#064e3b] text-lime-400 hover:bg-lime-400 hover:text-emerald-950 font-black py-2.5 px-6 rounded-xl text-sm transition-all duration-300 shadow-md hover:shadow-lg disabled:opacity-50 cursor-pointer"
              >
                {loading ? "Đang lưu..." : "Lưu thay đổi"}
              </button>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="bg-slate-100 text-slate-700 hover:bg-slate-200 font-bold py-2.5 px-6 rounded-xl text-sm transition-all duration-300 cursor-pointer"
              >
                Hủy
              </button>
            </div>
          </form>
        )}

      </div>
    </MainLayout>
  );
};

const InfoItem = ({ label, value }) => (
  <div className="rounded-2xl bg-slate-50 border border-slate-100/50 p-4 transition-all hover:bg-slate-100/30">
    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{label}</p>
    <p className="mt-1 font-bold text-slate-800 text-sm">{value}</p>
  </div>
);

const ActivityItem = ({ title, subtitle }) => (
  <div className="flex justify-between items-center p-3 rounded-2xl bg-slate-50 border border-slate-100/50 hover:bg-slate-100/30 transition-all">
    <div>
      <p className="text-sm font-bold text-slate-800">{title}</p>
      <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
    </div>
    <span className="relative flex h-2.5 w-2.5">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#00C853]"></span>
    </span>
  </div>
);

const FormGroup = ({ label, children }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
      {label}
    </label>
    {children}
  </div>
);

export default ProfileForm;
