"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { Bell, Check, CheckCheck, BookOpen, ShieldCheck, IndianRupee, Megaphone, X, Loader2 } from "lucide-react";
import api from "@/lib/api";
import { useRouter } from "next/navigation";

// ─── Types ─────────────────────────────────────────────────────────────────────
interface Notification {
  _id: string;
  title: string;
  body: string;
  type: "booking" | "approval" | "payment" | "system" | "promo";
  isRead: boolean;
  createdAt: string;
  recipientType?: "admin" | "vendor" | "user";
  metadata?: Record<string, any>;
}

interface Props {
  /** Override the default token key. Defaults to auto-detect. */
  tokenKey?: "admin_token" | "nexora_token";
  /** Theme: 'dark' for sidebar use (admin/partner), 'light' for navbar use */
  theme?: "dark" | "light";
  /** Explicitly pass the role to avoid relying on localStorage which can be stale during testing */
  userRole?: "admin" | "vendor" | "user";
}

// ─── Helpers ───────────────────────────────────────────────────────────────────
const TYPE_ICON: Record<string, React.ElementType> = {
  booking: BookOpen,
  approval: ShieldCheck,
  payment: IndianRupee,
  promo: Megaphone,
  system: Bell,
};

const TYPE_COLOR: Record<string, string> = {
  booking: "bg-blue-500/15 text-blue-600",
  approval: "bg-emerald-500/15 text-emerald-600",
  payment: "bg-amber-500/15 text-amber-600",
  promo: "bg-purple-500/15 text-purple-600",
  system: "bg-slate-500/15 text-slate-600",
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// ─── Component ─────────────────────────────────────────────────────────────────
export default function NotificationBell({ tokenKey, theme = "dark", userRole = "user" }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Detect token from storage ──────────────────────────────────────────────
  const getToken = useCallback((): string | null => {
    if (typeof window === "undefined") return null;
    if (tokenKey) return localStorage.getItem(tokenKey);
    // Auto-detect: try admin_token first, then nexora_token
    return (
      localStorage.getItem("admin_token") ||
      localStorage.getItem("nexora_token") ||
      null
    );
  }, [tokenKey]);

  // ── Fetch notifications from API ───────────────────────────────────────────
  const fetchNotifications = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    try {
      const { data } = await api.get("/notifications", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (data?.success) {
        setNotifications(data.data || []);
        setUnread(data.unreadCount ?? 0);
      }
    } catch {
      // Silently fail — bell should never block the UI
    }
  }, [getToken]);

  // ── Initial fetch + polling every 10s ─────────────────────────────────────
  useEffect(() => {
    fetchNotifications();
    intervalRef.current = setInterval(fetchNotifications, 10000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchNotifications]);

  // ── Close panel on outside click ──────────────────────────────────────────
  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  // ── Mark single notification read ─────────────────────────────────────────
  const markOneRead = async (id: string) => {
    const token = getToken();
    if (!token) return;
    try {
      await api.patch(`/notifications/${id}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
      setUnread((c) => Math.max(0, c - 1));
    } catch {}
  };

  // ── Mark all read ─────────────────────────────────────────────────────────
  const markAllRead = async () => {
    const token = getToken();
    if (!token || markingAll) return;
    setMarkingAll(true);
    try {
      await api.patch("/notifications/read-all", {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnread(0);
    } catch {}
    setMarkingAll(false);
  };

  // ── Toggle panel (fetch fresh on open) ────────────────────────────────────
  const handleBellClick = async () => {
    if (!open) {
      setLoading(true);
      await fetchNotifications();
      setLoading(false);
    }
    setOpen((s) => !s);
  };

  const handleNotificationClick = async (n: Notification) => {
    // Always mark as read, never redirect
    if (!n.isRead) await markOneRead(n._id);
  };

  // ── Styles ────────────────────────────────────────────────────────────────
  const btnBase =
    theme === "dark"
      ? "relative flex items-center justify-center w-9 h-9 rounded-xl hover:bg-white/10 transition-colors text-white/70 hover:text-white"
      : "relative flex items-center justify-center w-9 h-9 rounded-xl hover:bg-gold/10 transition-colors text-foreground/60 hover:text-primary";

  return (
    <div className="relative" ref={panelRef}>
      {/* ── Bell Button ──────────────────────────────────────────────── */}
      <button
        id="notification-bell-btn"
        onClick={handleBellClick}
        className={btnBase}
        aria-label={`Notifications${unread > 0 ? ` (${unread} unread)` : ""}`}
      >
        <Bell className="w-5 h-5" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 shadow-lg shadow-red-500/30 animate-pulse">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>

      {/* ── Dropdown Panel ───────────────────────────────────────────── */}
      {open && (
        <div className="absolute right-0 top-12 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-gold/20 z-[200] overflow-hidden animate-in slide-in-from-top-2 duration-150">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gold/15 bg-cream/60">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-primary" />
              <h3 className="font-bold text-sm text-primary">Notifications</h3>
              {unread > 0 && (
                <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {unread}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {unread > 0 && (
                <button
                  onClick={markAllRead}
                  disabled={markingAll}
                  className="flex items-center gap-1 text-[10px] font-bold text-primary/70 hover:text-primary transition-colors disabled:opacity-50"
                >
                  {markingAll ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <CheckCheck className="w-3 h-3" />
                  )}
                  Mark all read
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="p-1 rounded-lg hover:bg-gold/10 text-foreground/50 hover:text-foreground transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="max-h-[60vh] overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 text-primary animate-spin" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-14 px-4 text-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gold/10 flex items-center justify-center">
                  <Bell className="w-6 h-6 text-gold/50" />
                </div>
                <p className="text-sm font-semibold text-primary">All caught up!</p>
                <p className="text-xs text-foreground/45 leading-relaxed">
                  New notifications about bookings, payments, and updates will appear here.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-gold/10">
                {notifications.map((n) => {
                  const Icon = TYPE_ICON[n.type] ?? Bell;
                  const colorClass = TYPE_COLOR[n.type] ?? TYPE_COLOR.system;
                  return (
                    <li
                      key={n._id}
                      onClick={() => handleNotificationClick(n)}
                      className={`flex items-start gap-3 px-4 py-3.5 transition-colors group cursor-default ${
                        n.isRead ? "bg-white hover:bg-cream/30" : "bg-blue-50/40 hover:bg-blue-50/70"
                      }`}
                    >
                      {/* Icon */}
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${colorClass}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={`text-xs font-bold leading-tight ${n.isRead ? "text-foreground/75" : "text-primary"}`}>
                            {n.title}
                          </p>
                          {!n.isRead && (
                            <button
                              onClick={(e) => { e.stopPropagation(); markOneRead(n._id); }}
                              className="opacity-0 group-hover:opacity-100 flex-shrink-0 p-0.5 rounded hover:bg-primary/10 transition-all"
                              title="Mark as read"
                            >
                              <Check className="w-3 h-3 text-primary" />
                            </button>
                          )}
                        </div>
                        <p className="text-[11px] text-foreground/55 mt-0.5 leading-snug line-clamp-2">
                          {n.body}
                        </p>
                        <p className="text-[10px] text-foreground/35 mt-1 font-medium">
                          {timeAgo(n.createdAt)}
                        </p>
                      </div>
                      {/* Unread dot */}
                      {!n.isRead && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1.5" />
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2.5 border-t border-gold/15 bg-cream/40 flex items-center justify-between gap-2">
            <p className="text-[10px] text-foreground/40 font-medium">
              {notifications.length > 0 ? `${notifications.length} notification${notifications.length !== 1 ? 's' : ''}` : ''}
            </p>
            <button onClick={() => { 
                setOpen(false); 
                // Always trust the explicit userRole prop or fallback to theme check.
                const isVendor = userRole === 'vendor' || (typeof window !== 'undefined' && localStorage.getItem('nexora_role') === 'vendor');
                if (isVendor) {
                  router.push('/partner/bookings'); // As requested: redirect to active booking page
                } else {
                  router.push('/profile/notifications'); // Customer notification page
                }
              }}
              className="text-[10px] font-bold text-primary hover:underline">
              View All →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
