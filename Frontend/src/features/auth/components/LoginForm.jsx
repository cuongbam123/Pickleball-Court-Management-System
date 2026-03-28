import { useState } from "react";
import { loginApi } from "../api/authApi";
import { useAuthStore } from "../../../store/authStore";
import { useNavigate } from "react-router-dom";

const LoginForm = () => { 
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    if (loading) return;

    try {
      setLoading(true);

      const res = await loginApi(form);
      const data = res.data.data;
      const access_token = data.access_token;
      const refresh_token = data.refresh_token;
      const user = data.user;
      
      if (!access_token || !user || !user.role) {
        throw new Error("Invalid response");
      }

      setAuth({
        user: data.user,
        access_token: access_token,
        refresh_token: refresh_token,
      });

      switch (user.role) {  
        case "admin":
          navigate("/admin", { replace: true });
          break;

        case "staff":
          navigate("/staff", { replace: true });
          break;

        case "customer":
          navigate("/", { replace: true });
          break;

        default:
          navigate("/403", { replace: true });
          break;
      }
    } catch (err) {
      console.error("LOGIN ERROR:", err);
       alert(err?.message || "Đăng nhập thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Tiêu đề cho Mobile */}
      <div className="mb-8 md:hidden">
        <div className="inline-flex items-center rounded-full bg-lime-100 px-3 py-1 text-sm font-semibold text-lime-700">
          Welcome Back
        </div>
        <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-zinc-900">
          Mừng trở lại sân!
        </h1>
        <p className="mt-2 text-sm leading-6 text-zinc-500">
          Đăng nhập để xem lịch đặt sân và tiếp tục đam mê Pickleball.
        </p>
      </div>

      {/* Tiêu đề cho Desktop */}
      <div className="mb-8 hidden md:block">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-cyan-700">
          Login Account
        </p>
        <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-zinc-900">
          Đăng nhập tài khoản
        </h2>
        <p className="mt-2 text-sm leading-6 text-zinc-500">
          Nhập email và mật khẩu của bạn để truy cập vào hệ thống.
        </p>
      </div>

      {/* Form xử lý */}
      <form onSubmit={handleLogin} className="space-y-5">
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
            placeholder="Nhập email của bạn"
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

        <button
          type="submit"
          disabled={loading}
          className="w-full mt-2 rounded-2xl bg-gradient-to-r from-lime-300 via-lime-400 to-emerald-400 px-5 py-3.5 text-sm font-extrabold text-zinc-900 shadow-lg shadow-lime-500/25 transition duration-200 hover:scale-[1.02] hover:shadow-xl hover:shadow-lime-500/30 disabled:cursor-not-allowed disabled:scale-100 disabled:opacity-60"
        >
          {loading ? "Đang đăng nhập..." : "Đăng nhập"}
        </button>

        <p className="text-center text-sm text-zinc-500">
          Chưa có tài khoản?{" "}
          <a href="/register" className="font-semibold text-lime-600 hover:text-lime-500 transition">
            Đăng ký ngay
          </a>
        </p>
      </form>
    </>
  );
};

export default LoginForm;
