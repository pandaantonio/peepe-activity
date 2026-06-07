// hooks/useSocket.js
import { useEffect, useRef, useState, useCallback } from "react";
import { io } from "socket.io-client";

let globalSocket = null;
let connectionPromise = null;

export function useSocket() {
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(true);
  const socketRef = useRef(null);

  useEffect(() => {
    let mounted = true;

    const initSocket = async () => {
      if (!connectionPromise) {
        connectionPromise = fetch("/api/socket").then(() => {
          if (!globalSocket) {
            globalSocket = io({
              path: "/api/socket",
              reconnection: true,
              reconnectionAttempts: 10,
              reconnectionDelay: 1000,
              reconnectionDelayMax: 5000,
              timeout: 20000,
            });
          }
          return globalSocket;
        });
      }

      try {
        const socket = await connectionPromise;
        socketRef.current = socket;

        if (mounted) {
          if (socket.connected) {
            setConnected(true);
            setConnecting(false);
          }

          socket.on("connect", () => {
            if (mounted) {
              setConnected(true);
              setConnecting(false);
            }
          });

          socket.on("disconnect", () => {
            if (mounted) {
              setConnected(false);
            }
          });

          socket.on("connect_error", () => {
            if (mounted) {
              setConnecting(false);
            }
          });
        }
      } catch (err) {
        console.error("[Socket] Erro ao conectar:", err);
        if (mounted) setConnecting(false);
      }
    };

    initSocket();

    return () => {
      mounted = false;
    };
  }, []);

  const emit = useCallback((event, data) => {
    return new Promise((resolve) => {
      if (!socketRef.current) {
        resolve({ success: false, error: "Socket não inicializado." });
        return;
      }
      socketRef.current.emit(event, data, (response) => {
        resolve(response || { success: true });
      });
    });
  }, []);

  const on = useCallback((event, handler) => {
    if (!socketRef.current) return () => {};
    socketRef.current.on(event, handler);
    return () => {
      if (socketRef.current) {
        socketRef.current.off(event, handler);
      }
    };
  }, []);

  return { socket: socketRef.current, connected, connecting, emit, on };
}
