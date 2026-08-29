import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL?.replace('/api', '') || window.location.origin;

// Singleton socket instance shared across all pages
let globalSocket: Socket | null = null;

function getSocket(): Socket {
  if (!globalSocket || !globalSocket.connected) {
    globalSocket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
    });
  }
  return globalSocket;
}

type SocketEventHandler = (data: unknown) => void;

export function useSocket(
  rooms: string[],
  handlers: Record<string, SocketEventHandler>,
) {
  const socketRef = useRef<Socket | null>(null);
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  const joinRooms = useCallback((socket: Socket, roomList: string[]) => {
    roomList.forEach(room => socket.emit('join_room', room));
  }, []);

  useEffect(() => {
    const socket = getSocket();
    socketRef.current = socket;

    // Join rooms
    if (socket.connected) {
      joinRooms(socket, rooms);
    } else {
      socket.on('connect', () => joinRooms(socket, rooms));
    }

    // Register all event handlers
    const wrappedHandlers: Record<string, SocketEventHandler> = {};
    Object.entries(handlers).forEach(([event, _handler]) => {
      const wrapped: SocketEventHandler = (data) => {
        handlersRef.current[event]?.(data);
      };
      wrappedHandlers[event] = wrapped;
      socket.on(event, wrapped);
    });

    return () => {
      // Remove handlers on cleanup
      Object.entries(wrappedHandlers).forEach(([event, wrapped]) => {
        socket.off(event, wrapped);
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return socketRef;
}

export function useSocketStatus() {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    socketRef.current = getSocket();
  }, []);

  return {
    isConnected: () => socketRef.current?.connected ?? false,
    socket: socketRef.current,
  };
}
