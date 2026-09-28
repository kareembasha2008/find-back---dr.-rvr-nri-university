import { supabase } from '../lib/supabase';
import { User, Department, Year, Section } from '../types';

export const profileService = {
  /**
   * Fetch current user's profile from Supabase
   */
  async getProfile(userId: string): Promise<User | null> {
    if (!userId) return null;

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    return {
      id: data.id,
      full_name: data.full_name,
      student_id: data.student_id,
      university_email: data.university_email,
      phone_number: data.phone_number || '',
      department: (data.department as Department) || 'CSE',
      year: (data.year as Year) || '1st Year',
      section: (data.section as Section) || 'A',
      role: data.role || 'student',
      profile_photo_url: data.profile_photo_url || undefined,
      onboarding_completed: Boolean(data.onboarding_completed),
      profile_confirmed: Boolean(data.profile_confirmed),
      created_at: data.created_at,
      updated_at: data.updated_at,
    };
  },

  /**
   * Update profile fields for the authenticated user in Supabase
   */
  async updateProfile(userId: string, updates: Partial<User>): Promise<User> {
    const updatePayload: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (updates.full_name !== undefined) updatePayload.full_name = updates.full_name.trim();
    if (updates.profile_photo_url !== undefined) updatePayload.profile_photo_url = updates.profile_photo_url;
    if (updates.phone_number !== undefined) {
      const cleanPhone = updates.phone_number.trim().replace(/\s+/g, '');
      // Check if phone number is taken by another account
      const { data: existingPhone } = await supabase
        .from('profiles')
        .select('id')
        .eq('phone_number', cleanPhone)
        .neq('id', userId)
        .maybeSingle();

      if (existingPhone) {
        throw new Error('This phone number is already registered by another account.');
      }
      updatePayload.phone_number = cleanPhone;
    }
    if (updates.department !== undefined) updatePayload.department = updates.department;
    if (updates.year !== undefined) updatePayload.year = updates.year;
    if (updates.section !== undefined) updatePayload.section = updates.section;
    if (updates.profile_confirmed !== undefined) updatePayload.profile_confirmed = updates.profile_confirmed;
    if (updates.onboarding_completed !== undefined) updatePayload.onboarding_completed = updates.onboarding_completed;

    const { data, error } = await supabase
      .from('profiles')
      .update(updatePayload)
      .eq('id', userId)
      .select('*')
      .single();

    if (error || !data) {
      throw new Error(error?.message || 'Failed to update profile.');
    }

    return {
      id: data.id,
      full_name: data.full_name,
      student_id: data.student_id,
      university_email: data.university_email,
      phone_number: data.phone_number || '',
      department: (data.department as Department) || 'CSE',
      year: (data.year as Year) || '1st Year',
      section: (data.section as Section) || 'A',
      role: data.role || 'student',
      profile_photo_url: data.profile_photo_url || undefined,
      onboarding_completed: Boolean(data.onboarding_completed),
      profile_confirmed: Boolean(data.profile_confirmed),
      created_at: data.created_at,
      updated_at: data.updated_at,
    };
  },

  /**
   * Confirm profile during initial setup flow
   */
  async confirmProfile(userId: string, confirmedData?: Partial<User>): Promise<User> {
    return this.updateProfile(userId, {
      ...(confirmedData || {}),
      profile_confirmed: true,
    });
  },

  /**
   * Mark onboarding completed
   */
  async completeOnboarding(userId: string): Promise<User> {
    return this.updateProfile(userId, {
      onboarding_completed: true,
    });
  },
};
