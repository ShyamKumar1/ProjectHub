'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { api } from '@/lib/api';
import { Bell, CheckCheck } from 'lucide-react';
import toast from 'react-hot-toast';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchNotifications(); }, []);

  const fetchNotifications = async () => {
    try {
      const res = await api.getNotifications();
      setNotifications(res.data || []);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  const handleMarkRead = async () => {
    try {
      await api.markNotificationsRead();
      toast.success('Marked all as read');
      fetchNotifications();
    } catch {
      toast.error('Failed to mark as read');
    }
  };

  const unreadCount = notifications.filter((n: any) => !n.read).length;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-h4 font-medium text-text-primary">Notifications</h1>
          {unreadCount > 0 && (
            <span className="bg-accent/15 text-accent text-xs font-medium px-2 py-0.5 rounded-pill">
              {unreadCount} unread
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <Button variant="ghost" size="sm" onClick={handleMarkRead}>
            <CheckCheck size={14} />
            Mark all read
          </Button>
        )}
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => <div key={i} className="h-16 bg-dark-700 rounded-xl animate-pulse" />)}
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-20 text-text-muted">
          <Bell size={48} className="mx-auto mb-4" />
          <p className="text-sm">No notifications yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n: any) => (
            <Card
              key={n.id}
              variant="bordered"
              className={`p-4 flex items-start gap-3 ${!n.read ? 'border-accent/20 bg-accent/5' : ''}`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                !n.read ? 'bg-accent/20' : 'bg-dark-700'
              }`}>
                <Bell size={14} className={!n.read ? 'text-accent' : 'text-text-muted'} />
              </div>
              <div className="flex-1">
                <p className={`text-sm ${!n.read ? 'text-text-primary font-medium' : 'text-text-secondary'}`}>
                  {n.title}
                </p>
                {n.body && <p className="text-xs text-text-muted mt-0.5">{n.body}</p>}
                <p className="text-xs text-text-muted mt-1">
                  {new Date(n.created_at).toLocaleString()}
                </p>
              </div>
            </Card>
          ))}
        </div>
      )}
    </motion.div>
  );
}
