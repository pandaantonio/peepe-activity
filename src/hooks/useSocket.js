// hooks/useSocket.js
import { useEffect, useState, useRef, useCallback } from "react";
import { io } from "socket.io-client";

export function useSocket() {
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(true);
  const socketRef = useRef(null);

  useEffect(() => {
    let mounted = true;

    const initSocket = async () => {
      try {
        await fetch("/api/socket");
        
        const socket = io({
          path: "/api/socket",
          transports: ["polling", "websocket"],
          reconnection: true,
          reconnectionAttempts: 5,
          reconnectionDelay: 1000,
        });

        socket.on("connect", () => {
          console.log("Socket connected");
          if (mounted) {
            setConnected(true);
            setConnecting(false);
          }
        });

        socket.on("disconnect", () => {
          console.log("Socket disconnected");
          if (mounted) {
            setConnected(false);
          }
        });

        socket.on("connect_error", (error) => {
          console.error("Socket connection error:", error);
          if (mounted) {
            setConnecting(false);
          }
        });

        socketRef.current = socket;
      } catch (err) {
        console.error("Failed to initialize socket:", err);
        if (mounted) {
          setConnecting(false);
        }
      }
    };

    initSocket();

    return () => {
      mounted = false;
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  const emit = useCallback((event, data) => {
    return new Promise((resolve) => {
      if (!socketRef.current || !connected) {
        resolve({ success: false, error: "Socket not connected" });
        return;
      }
      
      socketRef.current.emit(event, data, (response) => {
        resolve(response || { success: true });
      });
    });
  }, [connected]);

  const on = useCallback((event, handler) => {
    if (!socketRef.current) return () => {};
    socketRef.current.on(event, handler);
    return () => {
      if (socketRef.current) {
        socketRef.current.off(event, handler);
      }
    };
  }, []);

  return { connected, connecting, emit, on };
}