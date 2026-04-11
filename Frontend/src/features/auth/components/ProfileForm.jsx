import React, { useEffect, useState } from "react";
import { useAuthStore } from "../../../store/authStore";
import { getMe, updateMe } from "../api/userApi"; // Đảm bảo rằng updateMe đã được import đúng
import Button from "../../../components/ui/Button";
import { getBranchById } from "../../facility/api/branchApi";

const ProfileForm = () => {
  const { setAuth } = useAuthStore();
  const [user, setUser] = useState(null);
  const [branchName, setBranchName] = useState(null);
  const [fullName, setFullName] = useState("");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await getMe(); // Gọi API để lấy dữ liệu người dùng
        const newUser = response.data?.data || response.data;
        setUser(newUser);
        setFullName(newUser?.full_name || "");
        console.log("Dữ liệu người dùng đã được tải:", newUser);
      } catch (error) {
        console.error("Lỗi khi lấy dữ liệu người dùng:", error);
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

      // Gọi API để cập nhật thông tin người dùng (ví dụ: updateMe)
      const res = await updateMe(payload);

      alert("Cập nhật thông tin thành công");

      // Lấy lại dữ liệu người dùng mới nhất từ API
      const newUserRes = await getMe();
      const newUser = newUserRes.data?.data || newUserRes.data;

      // Cập nhật lại thông tin người dùng và token
      setAuth({
        user: newUser,
        access_token: "your_access_token", // Thay bằng token thực tế
        refresh_token: "your_refresh_token", // Thay bằng token thực tế
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
    <div className="mx-auto max-w-2xl p-4">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-900">
            Thông tin cá nhân
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Quản lý thông tin tài khoản của bạn
          </p>
        </div>

        {!isEditing ? (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <InfoItem label="Họ tên" value={user?.full_name || "Chưa có"} />
              <InfoItem label="Email" value={user?.email || "Chưa có"} />
              <InfoItem
                label="Số điện thoại"
                value={user?.phone || "Chưa có"}
              />
              {user?.role === "customer" && (
                <>
                  <InfoItem
                    label="Điểm tích lũy"
                    value={user?.loyalty_points || "0"}
                  />
                  <InfoItem label="Hạng mức" value={user?.loyalty_tier} />
                  <InfoItem label="Hạng kỹ năng" value={user?.skill_rank} />
                  <InfoItem label="Điểm elo" value={user?.elo_score} />
                  <InfoItem
                    label="Số dư tài khoản"
                    value={user?.credit || "Chưa có"}
                  />
                </>
              )}

              {user?.role === "staff" && (
                <InfoItem label="Chi nhánh" value={branchName || "Chưa có"} />
              )}
            </div>
            <div className="pt-2">
              <Button onClick={() => setIsEditing(true)}>
                Chỉnh sửa thông tin
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <FormGroup label="Họ tên">
              <input
                type="text"
                name="full_name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Nhập họ tên"
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-emerald-500"
              />
            </FormGroup>
            <FormGroup label="Số điện thoại">
              <input
                type="text"
                name="phone"
                value={user?.phone || ""}
                onChange={(e) => setUser({ ...user, phone: e.target.value })}
                placeholder="Nhập số điện thoại"
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-emerald-500"
              />
            </FormGroup>

            {/* Thêm input cho Mật khẩu */}
             <FormGroup label="Mật khẩu cũ">
              <input
                type="password"
                name="old_password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                placeholder="Nhập mật khẩu cũ"
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-emerald-500"
              />
            </FormGroup>

            {/* Input cho mật khẩu mới */}
            <FormGroup label="Mật khẩu mới">
              <input
                type="password"
                name="new_password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Nhập mật khẩu mới"
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-emerald-500 gap-2"
              />
            </FormGroup>

            {/* Xác nhận mật khẩu mới */}
            <FormGroup label="Xác nhận mật khẩu mới">
              <input
                type="password"
                name="confirm_password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Nhập lại mật khẩu mới"
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-emerald-500 gap-2"
              />
            </FormGroup>
            <div className="flex flex-wrap gap-3 pt-2">
              <Button type="submit" loading={loading}>
                Lưu thay đổi
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setIsEditing(false)}
              >
                Hủy
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

const InfoItem = ({ label, value }) => (
  <div className="rounded-2xl bg-slate-50 p-4">
    <p className="text-sm text-slate-500">{label}</p>
    <p className="mt-1 font-medium text-slate-900">{value}</p>
  </div>
);

const FormGroup = ({ label, children }) => (
  <div>
    <label className="mb-2 block text-sm font-medium text-slate-700">
      {label}
    </label>
    {children}
  </div>
);

export default ProfileForm;
