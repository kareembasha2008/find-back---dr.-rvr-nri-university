import { supabase } from '../lib/supabase';
import { ContactRequest } from '../types';
import { notificationService } from './notificationService';

export interface PermittedContactInfo {
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED';
  owner?: {
    full_name: string;
    university_email: string;
    phone_number: string;
    department: string;
  };
  requester?: {
    full_name: string;
    university_email: string;
    phone_number: string;
    department: string;
  };
  error?: string;
}

export const contactService = {
  /**
   * Request contact access for a specific lost or found item
   */
  async requestContact(
    itemId: string,
    ownerId: string,
    requesterId: string,
    message?: string,
    claimId?: string
  ): Promise<ContactRequest> {
    if (ownerId === requesterId) {
      throw new Error('You cannot request contact with yourself.');
    }

    // Check if an existing contact request is already pending or accepted
    const { data: existing } = await supabase
      .from('contact_requests')
      .select('*')
      .eq('item_id', itemId)
      .eq('requester_id', requesterId)
      .maybeSingle();

    if (existing) {
      if (existing.status === 'ACCEPTED') {
        return existing;
      }
      if (existing.status === 'PENDING') {
        throw new Error('A contact request is already pending review.');
      }
    }

    const { data, error } = await supabase
      .from('contact_requests')
      .insert({
        item_id: itemId,
        claim_id: claimId || null,
        requester_id: requesterId,
        owner_id: ownerId,
        status: 'PENDING',
        message: message?.trim() || 'Requesting contact clearance for campus item handover.',
      })
      .select('*')
      .single();

    if (error || !data) {
      console.error('Error creating contact request:', error);
      throw new Error(error?.message || 'Failed to send contact request.');
    }

    // Notify the item owner
    await notificationService.createNotification(
      ownerId,
      'Contact Clearance Request',
      'A fellow student has requested contact permission regarding your campus item report.',
      'verification_required',
      itemId
    );

    return data;
  },

  /**
   * Fetch all contact requests where current user is requester or owner
   */
  async getContactRequestsForUser(userId: string): Promise<ContactRequest[]> {
    if (!userId) return [];

    const { data, error } = await supabase
      .from('contact_requests')
      .select('*')
      .or(`requester_id.eq.${userId},owner_id.eq.${userId}`)
      .order('created_at', { ascending: false });

    if (error || !data) {
      return [];
    }

    return data;
  },

  /**
   * Owner responds to contact request: ACCEPTED or DECLINED
   */
  async respondToContactRequest(
    requestId: string,
    newStatus: 'ACCEPTED' | 'DECLINED',
    ownerId: string,
    responseNote?: string
  ): Promise<ContactRequest> {
    const { data, error } = await supabase
      .from('contact_requests')
      .update({
        status: newStatus,
        response_note: responseNote?.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', requestId)
      .eq('owner_id', ownerId)
      .select('*')
      .single();

    if (error || !data) {
      throw new Error(error?.message || 'Failed to update contact request.');
    }

    // Notify the requester of the decision
    await notificationService.createNotification(
      data.requester_id,
      newStatus === 'ACCEPTED' ? 'Contact Request Accepted!' : 'Contact Request Declined',
      newStatus === 'ACCEPTED'
        ? 'Your contact clearance was approved. You can now view the custodian’s verified university contact.'
        : 'Your contact clearance was declined by the item reporter.',
      'system',
      data.item_id
    );

    return data;
  },

  /**
   * Retrieves verified contact information via secure RPC function only after ACCEPTED status
   */
  async getPermittedContact(requestId: string): Promise<PermittedContactInfo> {
    const { data, error } = await supabase.rpc('get_permitted_contact', {
      p_contact_request_id: requestId,
    });

    if (error || !data || data.error) {
      throw new Error(data?.error || error?.message || 'Contact information is not permitted.');
    }

    return data as PermittedContactInfo;
  },
};
