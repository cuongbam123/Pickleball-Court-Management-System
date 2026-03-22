import { useState } from "react";
import { loginApi } from "../api/authApi";
import { useAuthStore } from "../../../store/authStore";

const LoginForm = () => {
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
      const accessToken = data.access_token;

      if (!accessToken) {
        throw new Error("Invalid response");
      }

      setAuth({
        user: data.user,
        accessToken: accessToken,
        // refreshToken: data.refreshToken,
        refreshToken: null,
      });

      window.location.href = "/";
    } catch (err) {
      console.error(err);
      alert("Sai tài khoản hoặc mật khẩu");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleLogin} className="flex flex-col gap-3">
      <input
        name="email"
        value={form.email}
        onChange={handleChange}
        placeholder="Email"
      />

      <input
        name="password"
        type="password"
        value={form.password}
        onChange={handleChange}
        placeholder="Password"
      />

      <button disabled={loading}>
        {loading ? "Đang đăng nhập..." : "Đăng nhập"}
      </button>
    </form>
  );
};

export default LoginForm;
