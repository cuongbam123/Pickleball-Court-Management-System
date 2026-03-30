import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../../hooks/useAuth";
import { updateMe } from "../api/userApi";
import { getMe } from "../api/userApi";
import { useAuthStore } from "../../../store/authStore";
import Button from "../../../components/ui/Button";

const initialPasswordForm = {
  old_password: "",
  new_password: "",
  confirm_new_password: "",
};

const ProfileForm = () => {
  const { user } = useAuth();
  const setAuth = useAuthStore((s) => s.setAuth);

  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  const [fullName, setFullName] = useState("");
  const [passwordForm, setPasswordForm] = useState(initialPasswordForm);

  useEffect(() => {
    if (user?.full_name) {
      setFullName(user.full_name);
    }
  }, [user]);

  const hasNameChanged = useMemo(() => {
    return fullName.trim() !== (user?.full_name || "").trim();
  }, [fullName, user]);

  const isTypingPassword = useMemo(() => {
    return (
      passwordForm.old_password ||
      passwordForm.new_password ||
      passwordForm.confirm_new_password
    );
  }, [passwordForm]);

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const resetForm = () => {
    setFullName(user?.full_name || "");
    setPasswordForm(initialPasswordForm);
    setIsEditing(false);
  };

  const validateForm = () => {
    if (!hasNameChanged && !isTypingPassword) {
      return "Không có dữ liệu thay đổi";
    }

    if (isTypingPassword) {
      const { old_password, new_password, confirm_new_password } = passwordForm;

      if (!old_password || !new_password || !confirm_new_password) {
        return "Vui lòng nhập đầy đủ mật khẩu cũ, mật khẩu mới và xác nhận mật khẩu";
      }

      if (new_password !== confirm_new_password) {
        return "Mật khẩu xác nhận không khớp";
      }

      if (new_password.length < 6) {
        return "Mật khẩu mới phải có ít nhất 6 ký tự";
      }
    }

    return null;
  };

  const buildPayload = () => {
    const payload = {};

    if (hasNameChanged) {
      payload.full_name = fullName.trim();
    }

    if (isTypingPassword) {
      payload.old_password = passwordForm.old_password;
      payload.new_password = passwordForm.new_password;
      payload.confirm_new_password = passwordForm.confirm_new_password;
    }

    return payload;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const errorMessage = validateForm();
    if (errorMessage) {
      alert(errorMessage);
      return;
    }

    const payload = buildPayload();

    try {
      setLoading(true);

      const res = await updateMe(payload);
      const data = res.data?.data || res.data;

      const newUserRes = await getMe();
      const newUser = newUserRes.data?.data || newUserRes.data;
      const { access_token, refresh_token } = useAuthStore.getState();

      setAuth({
        user: newUser,
        access_token,
        refresh_token,
      });

      setAuth(newUser);

      alert(data?.message || "Cập nhật thông tin thành công");

      setPasswordForm(initialPasswordForm);
      setIsEditing(false);
    } catch (error) {
      console.error("update error:", error);
      alert(error?.response?.data?.message || "Cập nhật thất bại");
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
              <InfoItem label="Vai trò" value={user?.role || "Chưa có"} />
              <InfoItem label="Branch" value={user?.branch_id || "Chưa có"} />
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

            <div className="border-t border-slate-200 pt-5">
              <h3 className="text-lg font-semibold text-slate-900">
                Đổi mật khẩu
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Bỏ trống nếu bạn không muốn đổi mật khẩu
              </p>
            </div>

            <FormGroup label="Mật khẩu cũ">
              <input
                type="password"
                name="old_password"
                value={passwordForm.old_password}
                onChange={handlePasswordChange}
                placeholder="Nhập mật khẩu cũ"
                autoComplete="current-password"
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-emerald-500"
              />
            </FormGroup>

            <FormGroup label="Mật khẩu mới">
              <input
                type="password"
                name="new_password"
                value={passwordForm.new_password}
                onChange={handlePasswordChange}
                placeholder="Nhập mật khẩu mới"
                autoComplete="new-password"
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-emerald-500"
              />
            </FormGroup>

            <FormGroup label="Xác nhận mật khẩu mới">
              <input
                type="password"
                name="confirm_new_password"
                value={passwordForm.confirm_new_password}
                onChange={handlePasswordChange}
                placeholder="Nhập lại mật khẩu mới"
                autoComplete="new-password"
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-emerald-500"
              />
            </FormGroup>

            <div className="flex flex-wrap gap-3 pt-2">
              <Button type="submit" loading={loading}>
                Lưu thay đổi
              </Button>

              <Button type="button" variant="secondary" onClick={resetForm}>
                Hủy
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

const InfoItem = ({ label, value }) => {
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 font-medium text-slate-900">{value}</p>
    </div>
  );
};

const FormGroup = ({ label, children }) => {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-700">
        {label}
      </label>
      {children}
    </div>
  );
};

export default ProfileForm;
