import { useState, useRef, useEffect } from 'react';
import { Bell, Check, X, Trash2 } from 'lucide-react';
import { useSocket } from '../../contexts/SocketContext';

export default function NotificationBell() {
  const { notifications, unreadCount, markAsRead, removeNotification, clearNotifications } = useSocket();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Prevent body scroll when dropdown is open on mobile
  useEffect(() => {
    if (showDropdown) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showDropdown]);

  const handleNotificationClick = (notification) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }
  };

  const getNotificationIcon = (type) => {
    const iconClass = "w-4 h-4";
    switch (type) {
      case 'CLOCK_IN':
        return <span className="text-green-500">📍</span>;
      case 'CLOCK_OUT':
        return <span className="text-blue-500">🏁</span>;
      case 'SHIFT_CREATED':
        return <span className="text-purple-500">📅</span>;
      case 'SHIFT_UPDATED':
        return <span className="text-yellow-500">✏️</span>;
      case 'SHIFT_DELETED':
        return <span className="text-red-500">🗑️</span>;
      case 'ROSTER_UPDATED':
        return <span className="text-indigo-500">📋</span>;
      default:
        return <Bell className={iconClass} />;
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <>
      <div className="relative" ref={dropdownRef}>
        {/* Notification Bell Button */}
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors touch-manipulation"
          title="Notifications"
          aria-label="Notifications"
        >
          <Bell className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 sm:top-0 sm:right-0 min-w-[20px] h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold px-1">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {/* Desktop Dropdown */}
        {showDropdown && (
          <div className="hidden md:block absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-2xl border border-gray-200 z-50 max-h-[600px] flex flex-col">
            {/* Header */}
            <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">Notifications</h3>
                <p className="text-xs text-gray-500">
                  {unreadCount} unread
                </p>
              </div>
              {notifications.length > 0 && (
                <button
                  onClick={clearNotifications}
                  className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  title="Clear all"
                >
                  <Trash2 className="w-3 h-3" />
                  Clear all
                </button>
              )}
            </div>

            {/* Notifications List */}
            <div className="overflow-y-auto flex-1">
              {notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">No notifications</p>
                  <p className="text-gray-400 text-xs mt-1">
                    You're all caught up!
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer relative group ${
                        !notification.read ? 'bg-blue-50' : ''
                      }`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      {/* Unread indicator */}
                      {!notification.read && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-blue-500 rounded-r"></div>
                      )}

                      {/* Delete button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeNotification(notification.id);
                        }}
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-200 rounded"
                        title="Remove"
                      >
                        <X className="w-3 h-3 text-gray-500" />
                      </button>

                      <div className="flex gap-3">
                        {/* Icon */}
                        <div className="flex-shrink-0 mt-1">
                          {getNotificationIcon(notification.type)}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 mb-1">
                            {notification.title}
                          </p>
                          <p className="text-sm text-gray-600 mb-2">
                            {notification.message}
                          </p>

                          {/* Additional data */}
                          {notification.data && (
                            <div className="text-xs text-gray-500 space-y-1">
                              {notification.data.employeeName && (
                                <div>👤 {notification.data.employeeName}</div>
                              )}
                              {notification.data.siteName && (
                                <div>📍 {notification.data.siteName}</div>
                              )}
                              {notification.data.duration && (
                                <div>⏱️ Duration: {notification.data.duration} mins</div>
                              )}
                            </div>
                          )}

                          {/* Timestamp */}
                          <p className="text-xs text-gray-400 mt-2">
                            {formatTime(notification.timestamp)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
                <p className="text-xs text-center text-gray-500">
                  Showing {notifications.length} notification{notifications.length !== 1 ? 's' : ''}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Mobile Bottom Sheet */}
      {showDropdown && (
        <div className="md:hidden fixed inset-0 z-50 flex items-end">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={() => setShowDropdown(false)}
          ></div>

          {/* Bottom Sheet */}
          <div className="relative w-full bg-white rounded-t-2xl shadow-2xl max-h-[85vh] flex flex-col animate-slide-up">
            {/* Handle bar */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-12 h-1 bg-gray-300 rounded-full"></div>
            </div>

            {/* Header */}
            <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
              <div>
                <h3 className="font-semibold text-gray-900 text-lg">Notifications</h3>
                <p className="text-sm text-gray-500">
                  {unreadCount} unread
                </p>
              </div>
              <div className="flex items-center gap-2">
                {notifications.length > 0 && (
                  <button
                    onClick={clearNotifications}
                    className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-blue-50"
                    title="Clear all"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span className="hidden sm:inline">Clear</span>
                  </button>
                )}
                <button
                  onClick={() => setShowDropdown(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                  aria-label="Close"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>

            {/* Notifications List */}
            <div className="overflow-y-auto flex-1">
              {notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-base">No notifications</p>
                  <p className="text-gray-400 text-sm mt-2">
                    You're all caught up!
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 active:bg-gray-100 transition-colors touch-manipulation relative ${
                        !notification.read ? 'bg-blue-50' : ''
                      }`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      {/* Unread indicator */}
                      {!notification.read && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-12 bg-blue-500 rounded-r"></div>
                      )}

                      {/* Delete button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeNotification(notification.id);
                        }}
                        className="absolute top-3 right-3 p-2 bg-gray-100 hover:bg-gray-200 rounded-full touch-manipulation"
                        aria-label="Remove notification"
                      >
                        <X className="w-4 h-4 text-gray-500" />
                      </button>

                      <div className="flex gap-3 pr-10">
                        {/* Icon */}
                        <div className="flex-shrink-0 mt-1 text-xl">
                          {getNotificationIcon(notification.type)}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <p className="text-base font-medium text-gray-900 mb-1.5">
                            {notification.title}
                          </p>
                          <p className="text-sm text-gray-600 mb-2 leading-relaxed">
                            {notification.message}
                          </p>

                          {/* Additional data */}
                          {notification.data && (
                            <div className="text-sm text-gray-500 space-y-1.5 mb-2">
                              {notification.data.employeeName && (
                                <div className="flex items-center gap-2">
                                  <span>👤</span>
                                  <span>{notification.data.employeeName}</span>
                                </div>
                              )}
                              {notification.data.siteName && (
                                <div className="flex items-center gap-2">
                                  <span>📍</span>
                                  <span>{notification.data.siteName}</span>
                                </div>
                              )}
                              {notification.data.duration && (
                                <div className="flex items-center gap-2">
                                  <span>⏱️</span>
                                  <span>Duration: {notification.data.duration} mins</span>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Timestamp */}
                          <p className="text-xs text-gray-400 mt-2">
                            {formatTime(notification.timestamp)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Safe area for iPhone notch */}
            <div className="h-safe-bottom bg-white"></div>
          </div>
        </div>
      )}
    </>
  );
}
