import { supabase } from '../lib/supabase';
import { Item, ItemCategory, CampusLocation, ReportType, ItemStatus } from '../types';
import { notificationService } from './notificationService';

export interface CreateItemPayload {
  name: string;
  category: ItemCategory;
  location: CampusLocation;
  building_name?: string;
  latitude?: number | null;
  longitude?: number | null;
  date: string;
  approx_time: string;
  description: string;
  photo_url?: string;
  type: ReportType;
  private_verification_question?: string;
  private_verification_answer?: string;
}

export interface ItemQueryOptions {
  type?: ReportType | 'all';
  category?: ItemCategory | 'all';
  location?: CampusLocation | 'all';
  status?: ItemStatus | 'all';
  search?: string;
  dateFilter?: 'today' | 'yesterday' | 'week' | 'all';
  sort?: 'newest' | 'oldest' | 'recently_updated';
  page?: number;
  pageSize?: number;
}

export const itemService = {
  /**
   * Sanitizes item record to never leak private verification answer to third parties
   */
  sanitizeItem(item: any, currentUserId?: string, isAdmin?: boolean): Item {
    const isOwner = currentUserId && item.user_id === currentUserId;
    const canViewSecret = isOwner || isAdmin;

    return {
      id: item.id,
      user_id: item.user_id,
      reporter_dept: item.reporter_dept || 'Student Desk',
      reporter_year: item.reporter_year || 'Undergraduate',
      type: item.type,
      name: item.name,
      category: item.category,
      location: item.location,
      building_name: item.building_name || undefined,
      latitude: item.latitude !== null && item.latitude !== undefined ? Number(item.latitude) : null,
      longitude: item.longitude !== null && item.longitude !== undefined ? Number(item.longitude) : null,
      date: item.date,
      approx_time: item.approx_time || '11:00 AM',
      description: item.description,
      photo_url: item.photo_url || '',
      private_verification_question: item.private_verification_question || '',
      private_verification_answer: canViewSecret ? item.private_verification_answer : undefined,
      status: item.status,
      resolution_note: item.resolution_note || '',
      created_at: item.created_at,
      updated_at: item.updated_at || item.created_at,
    };
  },

  /**
   * Fetch public safe items from Supabase with filters, search, and sorting
   */
  async getPublicSafeItems(
    options: ItemQueryOptions = {},
    currentUserId?: string,
    isAdmin?: boolean
  ): Promise<{ items: Item[]; total: number }> {
    const page = options.page || 1;
    const pageSize = options.pageSize || 30;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
      .from('safe_items')
      .select('*', { count: 'exact' });

    // 1. Filter by report type (lost / found)
    if (options.type && options.type !== 'all') {
      query = query.eq('type', options.type);
    }

    // 2. Filter by item category
    if (options.category && options.category !== 'all') {
      query = query.eq('category', options.category);
    }

    // 3. Filter by campus location
    if (options.location && options.location !== 'all') {
      query = query.eq('location', options.location);
    }

    // 4. Filter by status
    if (options.status && options.status !== 'all') {
      query = query.eq('status', options.status);
    }

    // 5. Keyword search across name, description, location, building
    if (options.search?.trim()) {
      const q = `%${options.search.trim()}%`;
      query = query.or(
        `name.ilike.${q},description.ilike.${q},location.ilike.${q},building_name.ilike.${q}`
      );
    }

    // 6. Date filters
    const now = new Date();
    if (options.dateFilter === 'today') {
      const todayStr = now.toISOString().split('T')[0];
      query = query.eq('date', todayStr);
    } else if (options.dateFilter === 'yesterday') {
      const yesterday = new Date(now.getTime() - 24 * 3600 * 1000);
      query = query.eq('date', yesterday.toISOString().split('T')[0]);
    } else if (options.dateFilter === 'week') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 3600 * 1000);
      query = query.gte('date', weekAgo.toISOString().split('T')[0]);
    }

    // 7. Sorting
    if (options.sort === 'oldest') {
      query = query.order('created_at', { ascending: true });
    } else if (options.sort === 'recently_updated') {
      query = query.order('updated_at', { ascending: false });
    } else {
      query = query.order('created_at', { ascending: false });
    }

    query = query.range(from, to);

    const { data, count, error } = await query;

    if (error) {
      console.error('Error fetching public items from Supabase:', error);
      throw new Error(error.message || 'Failed to load campus feed.');
    }

    const items = (data || []).map((row) => this.sanitizeItem(row, currentUserId, isAdmin));
    return { items, total: count || 0 };
  },

  /**
   * Fetch a single item report by ID
   */
  async getReportById(id: string, currentUserId?: string, isAdmin?: boolean): Promise<Item | null> {
    if (!id) return null;

    const { data, error } = await supabase
      .from('safe_items')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    return this.sanitizeItem(data, currentUserId, isAdmin);
  },

  /**
   * Fetch all reports submitted by a specific user
   */
  async getMyReports(userId: string): Promise<Item[]> {
    if (!userId) return [];

    const { data, error } = await supabase
      .from('items')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user reports:', error);
      return [];
    }

    return (data || []).map((row) => this.sanitizeItem(row, userId, true));
  },

  /**
   * Create a new Lost or Found item report in Supabase
   */
  async createReport(
    payload: CreateItemPayload,
    user: { id: string; department?: string; year?: string }
  ): Promise<Item> {
    if (!payload.name?.trim()) throw new Error('Please enter the item name.');
    if (!payload.category) throw new Error('Please select an item category.');
    if (!payload.location) throw new Error('Please select the campus location.');
    if (!payload.date) throw new Error('Please select the incident date.');
    if (!payload.description?.trim()) throw new Error('Please provide an item description.');

    const isValidUUID = (id?: string) =>
      Boolean(id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id));
    const safeUserId = isValidUUID(user.id) ? user.id : '14b48ba1-5dda-4373-a009-159346c3212b';

    const insertRecord = {
      user_id: safeUserId,
      type: payload.type,
      name: payload.name.trim(),
      category: payload.category,
      location: payload.location,
      building_name: payload.building_name?.trim() || null,
      latitude: payload.latitude !== undefined ? payload.latitude : null,
      longitude: payload.longitude !== undefined ? payload.longitude : null,
      date: payload.date,
      approx_time: payload.approx_time?.trim() || '11:00 AM',
      description: payload.description.trim(),
      photo_url: payload.photo_url || null,
      private_verification_question: payload.private_verification_question?.trim() || null,
      private_verification_answer: payload.private_verification_answer?.trim() || null,
      status: 'Searching' as ItemStatus,
      reporter_dept: user.department || 'CSE',
      reporter_year: user.year || '1st Year',
    };

    let data: any = null;
    let insertError: any = null;

    try {
      const res = await supabase
        .from('items')
        .insert(insertRecord)
        .select('*')
        .single();
      data = res.data;
      insertError = res.error;
    } catch (netErr: any) {
      console.warn('Direct Supabase insert network notice:', netErr);
      insertError = netErr;
    }

    // If direct Supabase client failed (e.g., browser CORS/fetch block), use backend relay
    if (insertError || !data) {
      try {
        const relayRes = await fetch('/api/reports/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ insertRecord }),
        });
        const relayData = await relayRes.json();
        if (relayRes.ok && relayData.item) {
          data = relayData.item;
          insertError = null;
        } else {
          throw new Error(relayData.error || insertError?.message || 'Failed to submit report');
        }
      } catch (relayErr: any) {
        console.error('Report submission failed:', relayErr);
        throw new Error(
          relayErr?.message?.includes('fetch')
            ? 'Unable to connect to university database. Please check your internet connection and try again.'
            : relayErr?.message || insertError?.message || 'Failed to submit campus report.'
        );
      }
    }

    const createdItem = this.sanitizeItem(data, safeUserId, true);

    // 1. Dispatch confirmation notification
    try {
      await notificationService.createNotification(
        user.id,
        payload.type === 'lost' ? 'Lost Item Reported' : 'Found Item Reported',
        payload.type === 'lost'
          ? `Your lost report for "${createdItem.name}" was submitted. FIND BACK radar is scanning for matches.`
          : `Thank you for reporting found "${createdItem.name}". FIND BACK is checking for matching lost reports.`,
        'report_created',
        createdItem.id
      );
    } catch (notifErr) {
      console.warn('Notification dispatch notice:', notifErr);
    }

    // 2. Trigger automated backend matching algorithm
    try {
      await supabase.rpc('run_smart_matching_for_item', {
        p_item_id: createdItem.id,
      });
    } catch (matchErr) {
      console.warn('Backend matching trigger notice:', matchErr);
    }

    return createdItem;
  },

  /**
   * Update an existing report
   */
  async updateReport(
    id: string,
    updates: Partial<CreateItemPayload>,
    currentUserId: string,
    isAdmin?: boolean
  ): Promise<Item> {
    const updateRecord: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (updates.name !== undefined) updateRecord.name = updates.name.trim();
    if (updates.category !== undefined) updateRecord.category = updates.category;
    if (updates.location !== undefined) updateRecord.location = updates.location;
    if (updates.building_name !== undefined) updateRecord.building_name = updates.building_name;
    if (updates.latitude !== undefined) updateRecord.latitude = updates.latitude;
    if (updates.longitude !== undefined) updateRecord.longitude = updates.longitude;
    if (updates.date !== undefined) updateRecord.date = updates.date;
    if (updates.approx_time !== undefined) updateRecord.approx_time = updates.approx_time.trim();
    if (updates.description !== undefined) updateRecord.description = updates.description.trim();
    if (updates.photo_url !== undefined) updateRecord.photo_url = updates.photo_url;
    if (updates.private_verification_question !== undefined) {
      updateRecord.private_verification_question = updates.private_verification_question.trim();
    }
    if (updates.private_verification_answer !== undefined) {
      updateRecord.private_verification_answer = updates.private_verification_answer.trim();
    }

    let query = supabase.from('items').update(updateRecord).eq('id', id);
    if (!isAdmin) {
      query = query.eq('user_id', currentUserId);
    }

    const { data, error } = await query.select('*').single();
    if (error || !data) {
      throw new Error(error?.message || 'Failed to update report.');
    }

    return this.sanitizeItem(data, currentUserId, isAdmin);
  },

  /**
   * Delete an existing report
   */
  async deleteReport(id: string, currentUserId: string, isAdmin?: boolean): Promise<boolean> {
    let query = supabase.from('items').delete().eq('id', id);
    if (!isAdmin) {
      query = query.eq('user_id', currentUserId);
    }

    const { error } = await query;
    if (error) {
      throw new Error(error.message || 'Failed to delete report.');
    }
    return true;
  },

  /**
   * Mark an item as Resolved
   */
  async markResolved(
    id: string,
    resolutionNote: string,
    currentUserId: string,
    isAdmin?: boolean
  ): Promise<Item> {
    let query = supabase
      .from('items')
      .update({
        status: 'Resolved',
        resolution_note: resolutionNote.trim(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (!isAdmin) {
      query = query.eq('user_id', currentUserId);
    }

    const { data, error } = await query.select('*').single();
    if (error || !data) {
      throw new Error(error?.message || 'Failed to mark report as resolved.');
    }

    return this.sanitizeItem(data, currentUserId, isAdmin);
  },

  /**
   * Fetch nearby public reports with valid GPS coordinates
   */
  async getNearbyItems(maxCount = 20): Promise<Item[]> {
    const { data, error } = await supabase
      .from('safe_items')
      .select('*')
      .not('latitude', 'is', null)
      .not('longitude', 'is', null)
      .neq('status', 'Resolved')
      .order('created_at', { ascending: false })
      .limit(maxCount);

    if (error || !data) {
      return [];
    }

    return data.map((r) => this.sanitizeItem(r));
  },

  /**
   * Realtime subscription to university lost & found feed
   */
  subscribeToFeed(onNewItem: (item: Item) => void): () => void {
    const channel = supabase
      .channel('public-feed-updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'items',
        },
        (payload) => {
          if (payload.new) {
            onNewItem(itemService.sanitizeItem(payload.new));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },
};
