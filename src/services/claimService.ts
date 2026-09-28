import { supabase } from '../lib/supabase';
import { Claim, Item } from '../types';
import { notificationService } from './notificationService';

export const SAFE_CAMPUS_HUBS = [
  'Central Library Helpdesk (Ground Floor)',
  'Main Gate Security Post (Agiripalli Campus)',
  'C Block Administrative Office (Room 104)',
  'Student Canteen Lost & Found Counter',
  'A Block Dean Office Reception',
];

export const claimService = {
  /**
   * Fetch all claims where the user is either the claimant or the owner of the found item
   */
  async getClaimsForUser(userId: string): Promise<Claim[]> {
    if (!userId) return [];

    const { data, error } = await supabase
      .from('claims')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data) {
      console.warn('Error fetching claims:', error);
      return [];
    }

    return data;
  },

  /**
   * Get an existing claim between two items
   */
  async getClaimByItems(lostItemId: string, foundItemId: string): Promise<Claim | null> {
    const { data, error } = await supabase
      .from('claims')
      .select('*')
      .eq('lost_item_id', lostItemId)
      .eq('found_item_id', foundItemId)
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    return data;
  },

  /**
   * Submit an ownership claim for a found item
   */
  async submitClaim(
    lostItem: Item,
    foundItem: Item,
    claimantUserId: string,
    verificationAnswer: string,
    safeLocation = 'Central Library Helpdesk (Ground Floor)',
    matchId?: string
  ): Promise<Claim> {
    if (!verificationAnswer?.trim()) {
      throw new Error('Please answer the ownership verification question.');
    }

    const { data, error } = await supabase
      .from('claims')
      .insert({
        match_id: matchId || null,
        lost_item_id: lostItem.id,
        found_item_id: foundItem.id,
        claimant_user_id: claimantUserId,
        verification_answer: verificationAnswer.trim(),
        safe_exchange_location: safeLocation,
        status: 'pending',
        contact_requested: true,
        contact_granted: false,
      })
      .select('*')
      .single();

    if (error || !data) {
      console.error('Submit claim error:', error);
      throw new Error(error?.message || 'Failed to submit ownership claim.');
    }

    // Update found item status to 'Verification Required'
    await supabase
      .from('items')
      .update({ status: 'Verification Required', updated_at: new Date().toISOString() })
      .eq('id', foundItem.id);

    // Notify found item reporter that a claim was filed
    await notificationService.createNotification(
      foundItem.user_id,
      'Ownership Claim Submitted',
      `A student has claimed your discovered item "${foundItem.name}" and provided verification details.`,
      'verification_required',
      foundItem.id,
      matchId
    );

    return data;
  },

  /**
   * Review & Verify a claim
   */
  async reviewClaim(
    claimId: string,
    status: 'verified' | 'rejected',
    reviewerUserId: string
  ): Promise<Claim> {
    const { data, error } = await supabase
      .from('claims')
      .update({
        status,
        contact_granted: status === 'verified',
        updated_at: new Date().toISOString(),
      })
      .eq('id', claimId)
      .select('*')
      .single();

    if (error || !data) {
      throw new Error(error?.message || 'Failed to update claim status.');
    }

    // If verified, mark both items as resolved
    if (status === 'verified') {
      await supabase
        .from('items')
        .update({
          status: 'Resolved',
          resolution_note: `Returned securely at ${data.safe_exchange_location}`,
          updated_at: new Date().toISOString(),
        })
        .in('id', [data.lost_item_id, data.found_item_id]);

      // Notify claimant that their claim is verified
      await notificationService.createNotification(
        data.claimant_user_id,
        'Claim Verified & Approved!',
        `Your ownership of "${data.lost_item_id}" was approved. Meet the custodian at ${data.safe_exchange_location} for safe collection.`,
        'item_resolved',
        data.lost_item_id,
        data.match_id || undefined
      );
    }

    return data;
  },

  /**
   * Update the safe exchange hub for item collection
   */
  async updateExchangeLocation(claimId: string, location: string): Promise<Claim> {
    const { data, error } = await supabase
      .from('claims')
      .update({ safe_exchange_location: location, updated_at: new Date().toISOString() })
      .eq('id', claimId)
      .select('*')
      .single();

    if (error || !data) {
      throw new Error(error?.message || 'Failed to update exchange location.');
    }
    return data;
  },
};
