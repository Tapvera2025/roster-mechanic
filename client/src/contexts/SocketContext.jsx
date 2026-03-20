import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';

const SocketContext = createContext(null);

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

export function SocketProvider({ children }) {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [notifications, setNotifications] = useState([]);

  // Initialize socket connection
  useEffect(() => {
    // Get auth token from localStorage
    const token = localStorage.getItem('token');

    if (!token) {
      console.log('No token found, skipping socket connection');
      return;
    }

    console.log('Initializing socket connection to:', SOCKET_URL);

    // Create socket connection
    const socketInstance = io(SOCKET_URL, {
      auth: {
        token,
      },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    // Connection event handlers
    socketInstance.on('connect', () => {
      console.log('✓ Socket connected:', socketInstance.id);
      setConnected(true);
    });

    socketInstance.on('connected', (data) => {
      console.log('✓ Socket authenticated:', data);
    });

    socketInstance.on('disconnect', (reason) => {
      console.log('✗ Socket disconnected:', reason);
      setConnected(false);
    });

    socketInstance.on('connect_error', (error) => {
      console.error('✗ Socket connection error:', error.message);
      setConnected(false);
    });

    // Listen for all notification types
    socketInstance.on('notification', (notification) => {
      handleNotification(notification);
    });

    // Clock in/out events
    socketInstance.on('clock-in', (data) => {
      handleNotification(data);
    });

    socketInstance.on('clock-out', (data) => {
      handleNotification(data);
    });

    // Shift events
    socketInstance.on('shift-created', (data) => {
      handleNotification(data);
    });

    socketInstance.on('shift-updated', (data) => {
      handleNotification(data);
    });

    socketInstance.on('shift-deleted', (data) => {
      handleNotification(data);
    });

    // Roster events
    socketInstance.on('roster-updated', (data) => {
      handleNotification(data);
    });

    setSocket(socketInstance);

    // Cleanup on unmount
    return () => {
      console.log('Disconnecting socket');
      socketInstance.disconnect();
    };
  }, []);

  // Handle incoming notifications
  const handleNotification = useCallback((notification) => {
    console.log('📬 Notification received:', notification);

    // Add to notifications list
    setNotifications((prev) => [
      {
        id: Date.now(),
        ...notification,
        read: false,
      },
      ...prev,
    ]);

    // Show toast notification
    const toastOptions = {
      duration: 4000,
      position: 'top-right',
    };

    switch (notification.type) {
      case 'CLOCK_IN':
        toast.success(notification.message, toastOptions);
        break;
      case 'CLOCK_OUT':
        toast.success(notification.message, toastOptions);
        break;
      case 'SHIFT_CREATED':
        toast.info(notification.message, toastOptions);
        break;
      case 'SHIFT_UPDATED':
        toast(notification.message, toastOptions);
        break;
      case 'SHIFT_DELETED':
        toast.error(notification.message, toastOptions);
        break;
      case 'ROSTER_UPDATED':
        toast.info(notification.message, toastOptions);
        break;
      default:
        toast(notification.message, toastOptions);
    }
  }, []);

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
