import { supabase } from '../lib/supabase';
import { Notification } from '../types';

export const notificationService = {
  /**
   * Fetch private notifications for the authenticated user from Supabase
   */
  async getUserNotifications(userId: string): Promise<Notification[]> {
    if (!userId) return [];

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error || !data) {
      console.error('Error fetching notifications:', error);
      return [];
    }

    return data.map((row) => ({
      id: row.id,
      user_id: row.user_id,
      title: row.title,
      message: row.message,
      type: row.type,
      item_id: row.item_id,
      match_id: row.match_id,
      read: Boolean(row.is_read),
      created_at: row.created_at,
      updated_at: row.updated_at || row.created_at,
    }));
  },

  /**
   * Get real unread notification count for user
   */
  async getUnreadCount(userId: string): Promise<number> {
    if (!userId) return 0;

    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error || count === null) {
      return 0;
    }

    return count;
  },

  /**
   * Mark a single notification as read
   */
  async markAsRead(notificationId: string): Promise<void> {
    if (!notificationId) return;

    await supabase
      .from('notifications')
      .update({ is_read: true, updated_at: new Date().toISOString() })
      .eq('id', notificationId);
  },

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string): Promise<void> {
    if (!userId) return;

    await supabase
      .from('notifications')
      .update({ is_read: true, updated_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('is_read', false);
  },

  /**
   * Delete a notification
   */
  async deleteNotification(notificationId: string): Promise<void> {
    if (!notificationId) return;

    await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId);
  },

  /**
   * Create a new notification for a specific user
   */
  async createNotification(
    userId: string,
    title: string,
    message: string,
    type: 'report_created' | 'possible_match' | 'verification_required' | 'item_resolved' | 'system',
    itemId?: string,
    matchId?: string
  ): Promise<Notification | null> {
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        title: title.trim(),
        message: message.trim(),
        type,
        item_id: itemId || null,
        match_id: matchId || null,
        is_read: false,
      })
      .select('*')
      .single();

    if (error || !data) {
      console.warn('Failed to insert notification:', error);
      return null;
    }

    return {
      id: data.id,
      user_id: data.user_id,
      title: data.title,
      message: data.message,
      type: data.type,
      item_id: data.item_id,
      match_id: data.match_id,
      read: Boolean(data.is_read),
      created_at: data.created_at,
      updated_at: data.updated_at,
    };
  },

  /**
   * Subscribe to real-time notification stream for a specific user
   */
  subscribeToUserNotifications(
    userId: string,
    onNotification: (notif: Notification) => void
  ): () => void {
    if (!userId) return () => {};

    const channel = supabase
      .channel(`user-notifs-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          if (payload.new) {
            onNotification({
              id: payload.new.id,
              user_id: payload.new.user_id,
              title: payload.new.title,
              message: payload.new.message,
              type: payload.new.type,
              item_id: payload.new.item_id,
              match_id: payload.new.match_id,
              read: Boolean(payload.new.is_read),
              created_at: payload.new.created_at,
              updated_at: payload.new.updated_at || payload.new.created_at,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },
};
