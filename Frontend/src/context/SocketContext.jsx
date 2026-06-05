import React, { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Trích xuất host protocol từ VITE_API_URL
    const rawUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";
    let socketUrl = "http://localhost:5000";
    try {
      socketUrl = new URL(rawUrl).origin;
    } catch (e) {
      socketUrl = rawUrl;
    }

    console.log("🔌 Initiating socket connection to:", socketUrl);
    const socketInstance = io(socketUrl, {
      transports: ["websocket"],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    socketInstance.on("connect", () => {
      console.log("✅ Socket.io connected successfully. Client ID:", socketInstance.id);
      setIsConnected(true);
    });

    socketInstance.on("disconnect", () => {
      console.log("❌ Socket.io disconnected.");
      setIsConnected(false);
    });

    socketInstance.on("connect_error", (error) => {
      console.warn("⚠️ Socket.io connection error:", error.message);
    });

    setSocket(socketInstance);

    return () => {
      console.log("🔌 Cleaning up socket connection...");
      socketInstance.disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
};
