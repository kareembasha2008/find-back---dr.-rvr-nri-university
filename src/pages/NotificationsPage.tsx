import React, { useState, useEffect } from 'react';
import { User, Notification } from '../types';
import { notificationService } from '../services/notificationService';
import { Bell, CheckCheck, Trash2, ArrowRight, Sparkles, FileText, CheckCircle2, ShieldAlert } from 'lucide-react';

interface NotificationsPageProps {
  user: User;
  onNavigate: (path: string) => void;
  onRefreshUnread: () => void;
}

export const NotificationsPage: React.FC<NotificationsPageProps> = ({
  user,
  onNavigate,
  onRefreshUnread,
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const loadNotifications = async () => {
    const list = await notificationService.getUserNotifications(user.id);
    setNotifications(list);
    onRefreshUnread();
  };

  useEffect(() => {
    loadNotifications();

    const unsubscribe = notificationService.subscribeToUserNotifications(user.id, (newNotif) => {
      setNotifications((prev) => [newNotif, ...prev.filter((n) => n.id !== newNotif.id)]);
      onRefreshUnread();
    });

    return () => {
      unsubscribe();
    };
  }, [user.id]);

  const handleMarkAsRead = async (id: string) => {
    await notificationService.markAsRead(id);
    await loadNotifications();
  };

  const handleMarkAllAsRead = async () => {
    await notificationService.markAllAsRead(user.id);
    await loadNotifications();
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await notificationService.deleteNotification(id);
    await loadNotifications();
  };

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'possible_match':
        return <Sparkles className="w-5 h-5 text-amber-600" />;
      case 'report_created':
        return <FileText className="w-5 h-5 text-blue-600" />;
      case 'item_resolved':
        return <CheckCircle2 className="w-5 h-5 text-emerald-600" />;
      case 'verification_required':
        return <ShieldAlert className="w-5 h-5 text-indigo-600" />;
      default:
        return <Bell className="w-5 h-5 text-slate-600" />;
    }
  };

  return (
    <div className="min-h-screen text-white pb-20 md:pb-12 pt-6 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">
              Notification Center
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Live updates on your reported items, campus match alerts, and verification status
            </p>
          </div>

          {notifications.some((n) => !n.read) && (
            <button
              onClick={handleMarkAllAsRead}
              className="self-start sm:self-auto px-3.5 py-2 text-xs font-semibold text-indigo-300 hover:text-white bg-slate-900/80 border border-slate-800 rounded-xl transition-colors flex items-center gap-1.5 shadow-md cursor-pointer"
            >
              <CheckCheck className="w-3.5 h-3.5 text-indigo-400" />
              <span>Mark all as read</span>
            </button>
          )}
        </div>

        {/* List */}
        {notifications.length === 0 ? (
          <div className="lovable-card rounded-3xl p-12 text-center max-w-md mx-auto my-8">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto mb-3">
              <Bell className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-white text-base">No notifications</h3>
            <p className="text-xs text-slate-400 mt-1 mb-5">
              You are all caught up. When a match is found or an item status changes, you will receive an alert here.
            </p>
            <button
              onClick={() => onNavigate('/home')}
              className="px-5 py-2.5 lovable-glow-btn text-white text-xs font-bold rounded-xl transition-all shadow-md cursor-pointer"
            >
              Back to Dashboard
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => {
                  if (!notif.read) handleMarkAsRead(notif.id);
                  if (notif.type === 'possible_match' || notif.type === 'verification_required') {
                    onNavigate('/reports');
                  }
                }}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-4 ${
                  !notif.read
                    ? 'bg-[#0e1322] border-indigo-500/40 shadow-lg shadow-indigo-950/20 ring-1 ring-indigo-500/20'
                    : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700 text-slate-400 hover:text-slate-300'
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5 border ${
                    !notif.read
                      ? 'bg-indigo-500/10 border-indigo-500/20'
                      : 'bg-slate-900 border-slate-800 text-slate-400'
                  }`}
                >
                  {getIcon(notif.type)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h3
                      className={`text-sm tracking-tight truncate ${
                        !notif.read ? 'font-bold text-white' : 'font-semibold text-slate-300'
                      }`}
                    >
                      {notif.title}
                    </h3>
                    <span className="text-[10px] text-slate-500 tabular-nums shrink-0">
                      {new Date(notif.created_at).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    {notif.message}
                  </p>

                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-[10px] text-slate-500 tabular-nums">
                      {new Date(notif.created_at).toLocaleDateString()}
                    </span>

                    <button
                      onClick={(e) => handleDelete(notif.id, e)}
                      className="p-1 text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {!notif.read && (
                  <span className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.8)] shrink-0 mt-2"></span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
