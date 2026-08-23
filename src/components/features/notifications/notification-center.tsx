"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  Check,
  CheckCheck,
  Calendar,
  Pill,
  Truck,
  Info,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  useGetNotificationsQuery,
  useGetUnreadCountQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
} from "@/store/api/notificationApi";
import type { NotificationItem } from "@/store/api/notificationApi";

// =============================================================================
// Helpers
// =============================================================================

function getNotificationIcon(type: string) {
  switch (type) {
    case "APPOINTMENT_BOOKED":
    case "APPOINTMENT_CONFIRMED":
    case "APPOINTMENT_CANCELLED":
    case "APPOINTMENT_REMINDER":
      return <Calendar className="h-4 w-4" />;
    case "PRESCRIPTION_CREATED":
    case "PRESCRIPTION_FINALIZED":
      return <Pill className="h-4 w-4" />;
    case "PHARMACY_FULFILLMENT_RECEIVED":
    case "PHARMACY_FULFILLMENT_ACCEPTED":
    case "PHARMACY_FULFILLMENT_REJECTED":
    case "PHARMACY_FULFILLMENT_READY":
    case "PHARMACY_FULFILLMENT_COMPLETED":
      return <Truck className="h-4 w-4" />;
    case "DOCTOR_VERIFIED":
      return <Check className="h-4 w-4" />;
    default:
      return <Info className="h-4 w-4" />;
  }
}

function getNotificationColor(type: string): string {
  if (type.includes("CANCELLED") || type.includes("REJECTED")) {
    return "text-red-500 dark:text-red-400";
  }
  if (type.includes("CONFIRMED") || type.includes("COMPLETED") || type.includes("READY")) {
    return "text-emerald-500 dark:text-emerald-400";
  }
  if (type.includes("REMINDER")) {
    return "text-amber-500 dark:text-amber-400";
  }
  return "text-violet-500 dark:text-violet-400";
}

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return "Just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// =============================================================================
// Component
// =============================================================================

export function NotificationCenter() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const { data: countData } = useGetUnreadCountQuery();
  const { data: notificationsData, isLoading } = useGetNotificationsQuery(
    { limit: 15 },
    { skip: !isOpen },
  );

  const [markRead] = useMarkNotificationReadMutation();
  const [markAllRead] = useMarkAllNotificationsReadMutation();

  const unreadCount = countData?.data?.count || 0;
  const notifications = notificationsData?.data || [];

  // Close on outside click
  const handleClickOutside = useCallback((e: MouseEvent) => {
    if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
      setIsOpen(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, handleClickOutside]);

  // Close on Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, []);

  const handleNotificationClick = async (notification: NotificationItem) => {
    // Mark as read
    if (!notification.read) {
      markRead(notification.id);
    }

    // Navigate if link exists
    if (notification.link) {
      router.push(notification.link);
    }

    setIsOpen(false);
  };

  const handleMarkAllRead = () => {
    markAllRead();
  };

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-red-500 rounded-full">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -5, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -5, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-background border border-border rounded-xl shadow-xl z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <h3 className="font-semibold text-foreground">Notifications</h3>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-xs text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 font-medium flex items-center gap-1"
                >
                  <CheckCheck className="h-3.5 w-3.5" />
                  Mark all read
                </button>
              )}
            </div>

            {/* Notification List */}
            <div className="max-h-96 overflow-y-auto">
              {isLoading ? (
                <div className="p-4 space-y-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="flex gap-3 animate-pulse">
                      <div className="h-8 w-8 rounded-full bg-muted" />
                      <div className="flex-1 space-y-2">
                        <div className="h-3 bg-muted rounded w-3/4" />
                        <div className="h-3 bg-muted rounded w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <Bell className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">You&apos;re all caught up.</p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <button
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors border-b border-border last:border-0 ${
                      !notification.read ? "bg-violet-50/50 dark:bg-violet-950/20" : ""
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`mt-0.5 ${getNotificationColor(notification.type)}`}>
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className={`text-sm font-medium ${!notification.read ? "text-foreground" : "text-muted-foreground"}`}>
                            {notification.title}
                          </p>
                          {!notification.read && (
                            <span className="h-2 w-2 rounded-full bg-violet-500 flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                          {notification.message}
                        </p>
                        <p className="text-xs text-muted-foreground/70 mt-1">
                          {timeAgo(notification.createdAt)}
                        </p>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="px-4 py-2 border-t border-border text-center">
              <button
                onClick={() => {
                  setIsOpen(false);
                  // Navigate to a notifications page if one exists
                }}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                View all notifications
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
