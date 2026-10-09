import React from "react";
import { AlertCircle, AlertTriangle, Bell, CheckCircle2, Info, X } from "lucide-react";
import { useEditor } from "../../context/EditorContext";

export default function NotificationPanel({ isOpen, onClose }) {
  const {
    notifications,
    unreadCount,
    markNotificationRead,
    markAllNotificationsRead,
    clearNotifications,
  } = useEditor();

  if (!isOpen) return null;

  const formatTimeAgo = (isoString) => {
    if (!isoString) return "";
    const diffSeconds = Math.floor((new Date() - new Date(isoString)) / 1000);
    if (diffSeconds < 60) return "Just now";
    if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)}m ago`;
    if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)}h ago`;
    return `${Math.floor(diffSeconds / 86400)}d ago`;
  };

  const getNotifIcon = (type) => {
    switch (type) {
      case "success":
        return <CheckCircle2 size={16} className="notif-icon-success" />;
      case "error":
        return <AlertCircle size={16} className="notif-icon-error" />;
      case "warning":
        return <AlertTriangle size={16} className="notif-icon-warning" />;
      default:
        return <Info size={16} className="notif-icon-info" />;
    }
  };

  return (
    <div className="notification-panel-popover" role="dialog" aria-label="Notifications Panel">
      <div className="notification-panel-header">
        <div className="notification-header-title">
          <Bell size={16} className="text-red" />
          <span>Notifications</span>
          {unreadCount > 0 && <span className="unread-badge-pill">{unreadCount}</span>}
        </div>
        <div className="notification-header-actions">
          {unreadCount > 0 && (
            <button
              type="button"
              className="notif-text-action"
              onClick={markAllNotificationsRead}
            >
              Mark all read
            </button>
          )}
          {notifications.length > 0 && (
            <button
              type="button"
              className="notif-text-action text-muted"
              onClick={clearNotifications}
            >
              Clear
            </button>
          )}
          <button
            type="button"
            className="notif-close-btn"
            onClick={onClose}
            aria-label="Close notifications"
          >
            <X size={15} />
          </button>
        </div>
      </div>

      <div className="notification-panel-body">
        {notifications.length === 0 ? (
          <div className="notification-empty-state">
            <div className="empty-bell-icon-wrap">
              <Bell size={32} />
            </div>
            <h4>No notifications</h4>
            <p>You’re all caught up.</p>
          </div>
        ) : (
          <div className="notification-list">
            {notifications.map((item) => (
              <div
                key={item.id}
                className={`notification-item ${!item.read ? "unread" : ""}`}
                onClick={() => markNotificationRead(item.id)}
              >
                <div className="notif-item-left">
                  {getNotifIcon(item.type)}
                </div>
                <div className="notif-item-content">
                  <div className="notif-item-title-row">
                    <span className="notif-item-title">{item.title}</span>
                    <span className="notif-item-time">{formatTimeAgo(item.time)}</span>
                  </div>
                  <p className="notif-item-message">{item.message}</p>
                </div>
                {!item.read && <span className="unread-dot-indicator" />}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
