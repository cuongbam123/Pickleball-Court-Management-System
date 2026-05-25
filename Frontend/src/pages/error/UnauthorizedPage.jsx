import React from "react";
import { ShieldAlert, Home, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Button from "../../components/ui/Button";

const UnauthorizedPage = () => {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12 dark:bg-slate-950 sm:px-6 lg:px-8">
      <div className="w-full max-w-md text-center">
        {/* Animated Icon */}
        <div className="mx-auto mb-6 flex h-24 w-24 animate-bounce items-center justify-center rounded-full bg-red-100 ring-4 ring-red-50 dark:bg-red-950/30 dark:ring-red-950/20">
          <ShieldAlert className="h-12 w-12 text-red-600 dark:text-red-500" />
        </div>

        {/* Status Code */}
        <h1 className="text-9xl font-extrabold tracking-widest text-red-600 dark:text-red-500">
          403
        </h1>

        {/* Error Messages */}
        <h2 className="mt-4 text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
          Truy cập bị từ chối
        </h2>
        <p className="mt-4 text-base text-slate-600 dark:text-slate-400">
          Bạn không có quyền truy cập vào trang này. Vui lòng liên hệ quản trị
          viên hoặc thử đăng nhập bằng tài khoản có quyền cao hơn.
        </p>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button
            onClick={() => navigate(-1)}
            variant="ghost"
            className="flex items-center justify-center gap-2 border border-slate-300 dark:border-slate-700"
          >
            <ArrowLeft size={16} />
            Quay lại
          </Button>

          <Button
            onClick={() => navigate("/home")}
            className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Home size={16} />
            Trang chủ
          </Button>
        </div>
      </div>
    </div>
  );
};

export default UnauthorizedPage;
