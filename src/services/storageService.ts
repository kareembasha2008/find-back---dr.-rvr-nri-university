import { supabase, isSupabaseConfigured } from '../lib/supabase';

const ITEM_BUCKET = 'item-images';
const PROFILE_BUCKET = 'profile-images';

/**
 * Image storage & compression utility
 * Compresses images client-side and uploads securely to Supabase Storage
 */
export const storageService = {
  /**
   * Reads and compresses an image file to a compact base64 Data URL or Blob
   */
  async processAndCompressImage(file: File, maxDimension = 960, quality = 0.75): Promise<string> {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type.toLowerCase())) {
      throw new Error('Unsupported image format. Please upload JPG, PNG, or WEBP.');
    }

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          let { width, height } = img;
          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            } else {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(e.target?.result as string);
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
          resolve(compressedDataUrl);
        };
        img.onerror = () => reject(new Error('Failed to process image file.'));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error('Failed to read image file.'));
      reader.readAsDataURL(file);
    });
  },

  /**
   * Uploads an item image to Supabase Storage under `item-images/items/{user_id}/...`
   */
  async uploadItemImage(file: File, userId: string): Promise<string> {
    if (!isSupabaseConfigured()) {
      return this.processAndCompressImage(file);
    }

    try {
      const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
      const filePath = `items/${userId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from(ITEM_BUCKET)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        console.warn('Supabase Storage upload notice, using compressed image:', uploadError.message);
        return this.processAndCompressImage(file);
      }

      const { data } = supabase.storage.from(ITEM_BUCKET).getPublicUrl(filePath);
      return data.publicUrl;
    } catch (storageErr) {
      console.warn('Supabase Storage network error, falling back to local compressed DataURL:', storageErr);
      return this.processAndCompressImage(file);
    }
  },

  /**
   * Uploads a profile photo to Supabase Storage under `profile-images/{user_id}/...`
   */
  async uploadProfilePhoto(file: File, userId: string): Promise<string> {
    if (!isSupabaseConfigured()) {
      return this.processAndCompressImage(file);
    }

    const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const fileName = `avatar_${Date.now()}.${fileExt}`;
    const filePath = `${userId}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from(PROFILE_BUCKET)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
      });

    if (uploadError) {
      console.error('Profile photo upload error:', uploadError);
      return this.processAndCompressImage(file);
    }

    const { data } = supabase.storage.from(PROFILE_BUCKET).getPublicUrl(filePath);
    return data.publicUrl;
  },
};
