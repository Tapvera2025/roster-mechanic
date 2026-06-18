import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';

const SocketContext = createContext(null);

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace(/\/api$/, '') || 'http://localhost:5000';

export function SocketProvider({ children }) {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const storeToken = useAuthStore((state) => state.token);
  const token = storeToken || localStorage.getItem('token');

  // Handle incoming notifications
  const handleNotification = useCallback((notification) => {
    console.log('Notification received:', notification);

    setNotifications((prev) => [
      {
        id: Date.now(),
        ...notification,
        read: false,
      },
      ...prev,
    ]);

    const toastOptions = {
      duration: 4000,
      position: 'top-right',
    };

    switch (notification.type) {
      case 'CLOCK_IN':
      case 'CLOCK_OUT':
        toast.success(notification.message, toastOptions);
        break;
      case 'SHIFT_DELETED':
        toast.error(notification.message, toastOptions);
        break;
      case 'SHIFT_CREATED':
      case 'SHIFT_UPDATED':
      case 'ROSTER_UPDATED':
      default:
        toast(notification.message, toastOptions);
    }
  }, []);

  // Initialize or tear down the socket whenever auth changes.
  useEffect(() => {
    if (!token) {
      setConnected(false);
      setSocket((currentSocket) => {
        if (currentSocket) {
          currentSocket.disconnect();
        }
        return null;
      });
      return undefined;
    }

    console.log('Initializing socket connection to:', SOCKET_URL);

    const socketInstance = io(SOCKET_URL, {
      auth: {
        token,
      },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    socketInstance.on('connect', () => {
      console.log('Socket connected:', socketInstance.id);
      setConnected(true);
    });

    socketInstance.on('connected', (data) => {
      console.log('Socket authenticated:', data);
    });

    socketInstance.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      setConnected(false);
    });

    socketInstance.on('connect_error', (error) => {
      console.error('Socket connection error:', error.message);
      setConnected(false);
    });

    socketInstance.on('notification', handleNotification);
    socketInstance.on('clock-in', handleNotification);
    socketInstance.on('clock-out', handleNotification);
    socketInstance.on('shift-created', handleNotification);
    socketInstance.on('shift-updated', handleNotification);
    socketInstance.on('shift-deleted', handleNotification);
    socketInstance.on('roster-updated', handleNotification);

    setSocket(socketInstance);

    return () => {
      console.log('Disconnecting socket');
      socketInstance.removeAllListeners();
      socketInstance.disconnect();
      setConnected(false);
      setSocket(null);
    };
  }, [token, handleNotification]);

  // Mark notification as read
  const markAsRead = useCallback((id) => {
    setNotifications((prev) =>
      prev.map((notif) =>
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
  }, []);

  // Clear all notifications
  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // Clear a single notification
  const removeNotification = useCallback((id) => {
    setNotifications((prev) => prev.filter((notif) => notif.id !== id));
  }, []);

  const value = {
    socket,
    connected,
    notifications,
    unreadCount: notifications.filter((n) => !n.read).length,
    markAsRead,
    clearNotifications,
    removeNotification,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
}

// Custom hook to use socket
export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
}

// Custom hook for specific socket events
export function useSocketEvent(eventName, handler) {
  const { socket } = useSocket();

  useEffect(() => {
    if (!socket) return;

    socket.on(eventName, handler);

    return () => {
      socket.off(eventName, handler);
    };
  }, [socket, eventName, handler]);
}
