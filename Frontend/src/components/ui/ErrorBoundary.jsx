import React from "react";

/**
 * ErrorBoundary – Bắt các lỗi crash bất ngờ trong React component tree.
 *
 * Cách dùng:
 *   <ErrorBoundary>
 *     <YourApp />
 *   </ErrorBoundary>
 *
 * ErrorBoundary phải là Class Component vì chỉ class component mới có
 * lifecycle: componentDidCatch và getDerivedStateFromError.
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  // Cập nhật state khi có lỗi – render fallback UI ở lần render tiếp theo
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  // Log lỗi ra console (hoặc gửi lên error-tracking service như Sentry)
  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    // TODO: gửi lỗi lên Sentry hoặc service tracking tương tự
    console.error("[ErrorBoundary] Uncaught error:", error, errorInfo);
  }

  // Reset state để thử render lại
  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-6">
          <div className="max-w-lg w-full bg-slate-800/60 backdrop-blur-md border border-slate-700/60 rounded-3xl p-10 text-center shadow-2xl">

            {/* Icon lỗi */}
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-500/15 ring-1 ring-red-500/30">
              <svg
                className="h-10 w-10 text-red-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
                />
              </svg>
            </div>

            {/* Tiêu đề */}
            <h1 className="text-2xl font-bold text-slate-100 mb-2">
              Đã xảy ra sự cố
            </h1>

            {/* Mô tả */}
            <p className="text-slate-400 text-sm leading-relaxed mb-2">
              Ứng dụng gặp lỗi không mong muốn. Thử tải lại trang hoặc quay về
              trang chủ.
            </p>

            {/* Chi tiết lỗi – chỉ hiển thị trong môi trường development */}
            {import.meta.env.DEV && this.state.error && (
              <details className="mb-6 text-left">
                <summary className="cursor-pointer text-xs text-slate-500 hover:text-slate-300 transition-colors">
                  Chi tiết lỗi (dev only)
                </summary>
                <pre className="mt-2 max-h-40 overflow-auto rounded-xl bg-slate-900/70 p-3 text-xs text-red-300 leading-relaxed whitespace-pre-wrap break-words">
                  {this.state.error.toString()}
                  {"\n\n"}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}

            {/* Nút hành động */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center mt-6">
              {/* Thử lại – reset Error Boundary */}
              <button
                onClick={this.handleReset}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-600 active:scale-95 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-800"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
                </svg>
                Thử lại
              </button>

              {/* Quay về trang chủ – hard redirect để thoát hoàn toàn */}
              <button
                onClick={() => (window.location.href = "/")}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-600 bg-slate-700/50 px-5 py-2.5 text-sm font-semibold text-slate-200 hover:bg-slate-700 active:scale-95 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-800"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
                </svg>
                Trang chủ
              </button>
            </div>
          </div>
        </div>
      );
    }

    // Không có lỗi → render children bình thường
    return this.props.children;
  }
}

export default ErrorBoundary;
