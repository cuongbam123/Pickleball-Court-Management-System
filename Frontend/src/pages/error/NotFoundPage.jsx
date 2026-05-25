import React from "react";
import { FileQuestion, Home, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Button from "../../components/ui/Button";

const NotFoundPage = () => {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12 dark:bg-slate-950 sm:px-6 lg:px-8">
      <div className="w-full max-w-md text-center">
        {/* Animated Icon */}
        <div className="mx-auto mb-6 flex h-24 w-24 animate-pulse items-center justify-center rounded-full bg-blue-100 ring-4 ring-blue-50 dark:bg-blue-950/30 dark:ring-blue-950/20">
          <FileQuestion className="h-12 w-12 text-blue-600 dark:text-blue-500" />
        </div>

        {/* Status Code */}
        <h1 className="text-9xl font-extrabold tracking-widest text-blue-600 dark:text-blue-500">
          404
        </h1>

        {/* Error Messages */}
        <h2 className="mt-4 text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
          Không tìm thấy trang
        </h2>
        <p className="mt-4 text-base text-slate-600 dark:text-slate-400">
          Đường dẫn bạn truy cập không tồn tại hoặc đã bị di chuyển sang địa chỉ
          khác.
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

export default NotFoundPage;
