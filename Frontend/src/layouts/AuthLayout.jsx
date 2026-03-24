import React from "react";

const AuthLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-950 via-cyan-900 to-lime-500 px-4 py-10">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-6xl items-center justify-center">
        <div className="grid w-full max-w-5xl overflow-hidden rounded-[32px] border border-white/20 bg-white/10 shadow-2xl backdrop-blur-xl md:grid-cols-2">
          
          {/* Cột trái: Banner giới thiệu */}
          <div className="relative hidden overflow-hidden bg-transparent p-10 md:flex md:flex-col md:justify-between">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(163,230,53,0.28),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(34,211,238,0.24),transparent_40%)]" />
            <div className="relative z-10">
              <div className="inline-flex items-center rounded-full border border-lime-300/40 bg-lime-300/15 px-4 py-1 text-sm font-medium text-lime-100 backdrop-blur">
                Pickleball Community
              </div>

              <h1 className="mt-6 max-w-md text-4xl font-extrabold leading-tight text-white">
                Tham gia sân Pickleball
              </h1>

              <p className="mt-4 max-w-md text-base leading-7 text-cyan-50/85">
                Tạo tài khoản để đặt sân, kết nối cộng đồng và bắt đầu hành trình thi đấu thật bùng nổ.
              </p>
            </div>

            <div className="relative z-10 mt-10">
              <div className="flex items-end gap-3">
                <div className="h-24 w-24 rounded-full border-4 border-zinc-950 bg-lime-300 shadow-[0_0_40px_rgba(163,230,53,0.45)]" />
                <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm text-white/90 backdrop-blur">
                  Năng động • Hiện đại • Đậm chất thể thao
                </div>
              </div>
            </div>
          </div>

          {/* Cột phải: Form nhập liệu (Nội dung của children sẽ đổ vào đây) */}
          <div className="bg-white px-6 py-8 sm:px-10 sm:py-10">
            <div className="mx-auto w-full max-w-md">
              {children}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default AuthLayout;