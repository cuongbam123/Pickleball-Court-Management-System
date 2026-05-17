import AppRoutes from "./routes/AppRoutes";
import { Toaster } from "react-hot-toast";
import ErrorBoundary from "./components/ui/ErrorBoundary";

function App() {
  return (
    // ErrorBoundary bọc ngoài cùng – catch mọi lỗi crash React UI
    <ErrorBoundary>
      {/* Toaster hiển thị toàn cục – được gọi từ bất kỳ đâu trong app */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: "#1e293b",   // slate-800
            color: "#f1f5f9",        // slate-100
            borderRadius: "12px",
            fontSize: "14px",
            boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
          },
          success: {
            iconTheme: { primary: "#10b981", secondary: "#fff" }, // emerald-500
          },
          error: {
            iconTheme: { primary: "#ef4444", secondary: "#fff" }, // red-500
          },
        }}
      />
      <AppRoutes />
    </ErrorBoundary>
  );
}

export default App;