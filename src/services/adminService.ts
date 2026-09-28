import { supabase } from '../lib/supabase';
import { Item } from '../types';
import { itemService } from './itemService';
import { configService } from './configService';

export interface AdminStats {
  totalReports: number;
  lostCount: number;
  foundCount: number;
  possibleMatches: number;
  resolvedCount: number;
  pendingAbuseReports: number;
}

export interface ItemReportRecord {
  id: string;
  item_id: string;
  reporter_id: string;
  reason: string;
  details?: string;
  status: string;
  created_at: string;
}

export interface AuditLogRecord {
  id: string;
  admin_id: string;
  action: string;
  target_type: string;
  target_id: string;
  details?: any;
  created_at: string;
}

export const adminService = {
  /**
   * Checks whether the current session user has verified admin rights in Supabase
   */
  async checkIsAdmin(): Promise<boolean> {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user) return false;

      // 1. Direct query on admin_profiles table
      const { data, error } = await supabase
        .from('admin_profiles')
        .select('id, role')
        .eq('id', session.user.id)
        .maybeSingle();

      if (!error && data?.id) {
        return true;
      }

      // 2. Fallback check via is_admin() database function
      const { data: isAdm } = await supabase.rpc('is_admin');
      return Boolean(isAdm);
    } catch {
      return false;
    }
  },

  isAdminAuthenticated(): boolean {
    return sessionStorage.getItem('findback_admin_auth') === 'true';
  },

  setAdminAuthenticated(auth: boolean): void {
    if (auth) {
      sessionStorage.setItem('findback_admin_auth', 'true');
    } else {
      sessionStorage.removeItem('findback_admin_auth');
    }
  },

  updateUniversityDomain(domain: string, requireMatch: boolean): void {
    configService.updateConfig({
      allowed_email_domain: domain.trim().toLowerCase(),
      require_domain_match: requireMatch,
    });
  },

  async removeReport(itemId: string): Promise<void> {
    return this.adminDeleteReport(itemId, 'Removed via admin moderation table');
  },

  async forceResolveReport(itemId: string, note = 'Resolved by admin desk'): Promise<void> {
    return this.adminResolveReport(itemId, note);
  },

  /**
   * Log administrative actions to the official audit_logs table
   */
  async logAction(action: string, targetType: string, targetId: string, details: any = {}): Promise<void> {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user) return;

      await supabase.from('audit_logs').insert({
        admin_id: session.user.id,
        action,
        target_type: targetType,
        target_id: targetId,
        details,
      });
    } catch (e) {
      console.warn('Audit log write notice:', e);
    }
  },

  /**
   * Fetch platform metrics directly from Supabase
   */
  async getStats(): Promise<AdminStats> {
    const [
      { count: totalCount },
      { count: lostCount },
      { count: foundCount },
      { count: matchCount },
      { count: resolvedCount },
      { count: abuseCount },
    ] = await Promise.all([
      supabase.from('items').select('*', { count: 'exact', head: true }),
      supabase.from('items').select('*', { count: 'exact', head: true }).eq('type', 'lost'),
      supabase.from('items').select('*', { count: 'exact', head: true }).eq('type', 'found'),
      supabase.from('matches').select('*', { count: 'exact', head: true }).neq('status', 'dismissed'),
      supabase.from('items').select('*', { count: 'exact', head: true }).eq('status', 'Resolved'),
      supabase.from('item_reports').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    ]);

    return {
      totalReports: totalCount || 0,
      lostCount: lostCount || 0,
      foundCount: foundCount || 0,
      possibleMatches: matchCount || 0,
      resolvedCount: resolvedCount || 0,
      pendingAbuseReports: abuseCount || 0,
    };
  },

  /**
   * Fetch all reports for administrative review
   */
  async getAllAdminReports(): Promise<Item[]> {
    const { data, error } = await supabase
      .from('items')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data) {
      return [];
    }

    return data.map((r) => itemService.sanitizeItem(r, undefined, true));
  },

  /**
   * Delete an abusive or fake report and log the action
   */
  async adminDeleteReport(itemId: string, reason: string): Promise<void> {
    await this.logAction('REMOVE_REPORT', 'item', itemId, { reason });
    const { error } = await supabase.from('items').delete().eq('id', itemId);
    if (error) {
      throw new Error(error.message || 'Failed to remove report.');
    }
  },

  /**
   * Mark report as resolved by university administration
   */
  async adminResolveReport(itemId: string, note: string): Promise<void> {
    await this.logAction('RESOLVE_REPORT', 'item', itemId, { note });
    const { error } = await supabase
      .from('items')
      .update({
        status: 'Resolved',
        resolution_note: note,
        updated_at: new Date().toISOString(),
      })
      .eq('id', itemId);

    if (error) {
      throw new Error(error.message || 'Failed to resolve report.');
    }
  },

  /**
   * Submit an abuse report against an inappropriate item
   */
  async submitAbuseReport(
    itemId: string,
    reporterId: string,
    reason: 'Fake listing' | 'Spam' | 'Wrong information' | 'Inappropriate content' | 'Other',
    details?: string
  ): Promise<void> {
    const { error } = await supabase.from('item_reports').insert({
      item_id: itemId,
      reporter_id: reporterId,
      reason,
      details: details?.trim() || null,
      status: 'pending',
    });

    if (error) {
      throw new Error(error.message || 'Failed to submit abuse report.');
    }
  },

  /**
   * Fetch pending abuse reports for admin review
   */
  async getAbuseReports(): Promise<ItemReportRecord[]> {
    const { data, error } = await supabase
      .from('item_reports')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data) {
      return [];
    }

    return data;
  },

  /**
   * Fetch audit logs for compliance review
   */
  async getAuditLogs(): Promise<AuditLogRecord[]> {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error || !data) {
      return [];
    }

    return data;
  },
};
