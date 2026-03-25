import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { registerApi } from "../api/authApi";

const RegisterForm = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    if (loading) return;

    if (form.password !== form.confirmPassword) {
      return alert("Mật khẩu nhập lại không khớp!");
    }

    try {
      setLoading(true);

      const payload = {
        full_name: form.full_name,
        email: form.email,
        password: form.password,
      };

      await registerApi(payload);
      
      alert("Đăng ký thành công!");
      navigate("/login", { replace: true });
      
    } catch (err) {
      console.error("REGISTER ERROR:", err);
      alert(err?.response?.data?.message || err?.message || "Đăng ký thất bại");
    } finally {
      setLoading(false);
    }
  };

return (
    <>
      {/* Tiêu đề cho Mobile */}
      <div className="mb-8 md:hidden">
        <div className="inline-flex items-center rounded-full bg-lime-100 px-3 py-1 text-sm font-semibold text-lime-700">
          Pickleball Community
        </div>
        <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-zinc-900">
          Tham gia sân Pickleball
        </h1>
        <p className="mt-2 text-sm leading-6 text-zinc-500">
          Tạo tài khoản để bắt đầu trải nghiệm đặt sân và kết nối cộng đồng.
        </p>
      </div>

      {/* Tiêu đề cho Desktop */}
      <div className="mb-8 hidden md:block">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-cyan-700">
          Register Account
        </p>
        <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-zinc-900">
          Tạo tài khoản mới
        </h2>
        <p className="mt-2 text-sm leading-6 text-zinc-500">
          Điền đầy đủ thông tin bên dưới để tham gia hệ thống quản lý sân.
        </p>
      </div>

      {/* Form xử lý */}
      <form onSubmit={handleRegister} className="space-y-5">
        <div>
          <label htmlFor="full_name" className="mb-2 block text-sm font-semibold text-zinc-700">
            Họ và tên
          </label>
          <input
            id="full_name"
            name="full_name"
            value={form.full_name}
            onChange={handleChange}
            placeholder="Nhập họ và tên"
            className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3.5 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-lime-400 focus:bg-white focus:ring-4 focus:ring-lime-300/40"
          />
        </div>

        <div>
          <label htmlFor="email" className="mb-2 block text-sm font-semibold text-zinc-700">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            placeholder="Nhập email"
            className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3.5 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-lime-400 focus:bg-white focus:ring-4 focus:ring-lime-300/40"
          />
        </div>

        <div>
          <label htmlFor="password" className="mb-2 block text-sm font-semibold text-zinc-700">
            Mật khẩu
          </label>
          <input
            id="password"
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            placeholder="Nhập mật khẩu"
            className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3.5 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-lime-400 focus:bg-white focus:ring-4 focus:ring-lime-300/40"
          />
        </div>

        <div>
          <label htmlFor="confirmPassword" className="mb-2 block text-sm font-semibold text-zinc-700">
            Nhập lại mật khẩu
          </label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            value={form.confirmPassword}
            onChange={handleChange}
            placeholder="Nhập lại mật khẩu"
            className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3.5 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-lime-400 focus:bg-white focus:ring-4 focus:ring-lime-300/40"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-2xl bg-gradient-to-r from-lime-300 via-lime-400 to-emerald-400 px-5 py-3.5 text-sm font-extrabold text-zinc-900 shadow-lg shadow-lime-500/25 transition duration-200 hover:scale-[1.02] hover:shadow-xl hover:shadow-lime-500/30 disabled:cursor-not-allowed disabled:scale-100 disabled:opacity-60"
        >
          {loading ? "Đang đăng ký..." : "Đăng ký"}
        </button>

        <p className="text-center text-sm text-zinc-500">
          Tham gia để đặt sân, quản lý lịch chơi và kết nối cộng đồng Pickleball.
        </p>
      </form>
    </>
  );
};
export default RegisterForm;