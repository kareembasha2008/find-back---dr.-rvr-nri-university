import React, { useRef, useState } from 'react';
import { Upload, X, RefreshCw } from 'lucide-react';
import { storageService } from '../services/storageService';

interface ImageUploadProps {
  value?: string;
  onChange: (imageUrl: string) => void;
  label?: string;
  userId?: string;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  value,
  onChange,
  label = 'Item Photo (Optional)',
  userId = 'public_temp',
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setLoading(true);

    try {
      // 1. Generate local preview immediately
      const previewUrl = URL.createObjectURL(file);
      onChange(previewUrl);

      // 2. Upload to Supabase Storage bucket 'item-images'
      const uploadedUrl = await storageService.uploadItemImage(file, userId);
      onChange(uploadedUrl);
    } catch (err: any) {
      console.error('Image upload failed:', err);
      setError(err?.message || 'Failed to upload image. Please try again.');
      onChange(''); // clear so we do not create a broken item record
    } finally {
      setLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemove = () => {
    onChange('');
    setError(null);
  };

  return (
    <div className="space-y-2">
      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
        {label}
      </label>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/jpeg,image/png,image/webp,image/jpg"
        className="hidden"
      />

      {value ? (
        <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 max-h-56 flex items-center justify-center group">
          <img
            src={value}
            alt="Item preview"
            referrerPolicy="no-referrer"
            className="w-full h-48 object-cover"
          />
          <div className="absolute inset-0 bg-slate-950/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 bg-slate-900 border border-slate-700 text-white text-xs font-medium rounded-lg shadow-sm flex items-center gap-1.5 hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Replace
            </button>
            <button
              type="button"
              onClick={handleRemove}
              className="px-3 py-1.5 bg-rose-600 text-white text-xs font-medium rounded-lg shadow-sm flex items-center gap-1.5 hover:bg-rose-500 transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" /> Remove
            </button>
          </div>
        </div>
      ) : (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="cursor-pointer border-2 border-dashed border-slate-800 hover:border-indigo-500 rounded-2xl p-6 text-center transition-colors bg-slate-950/80 hover:bg-slate-900/60 flex flex-col items-center justify-center gap-2 group"
        >
          <div className="w-10 h-10 rounded-full bg-slate-900 group-hover:bg-indigo-500/20 text-slate-400 group-hover:text-indigo-400 flex items-center justify-center transition-colors">
            {loading ? (
              <RefreshCw className="w-5 h-5 animate-spin text-indigo-400" />
            ) : (
              <Upload className="w-5 h-5" />
            )}
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-200">
              {loading ? 'Uploading to campus storage...' : 'Tap to upload photo'}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              JPG, PNG, or WEBP (Saved securely to Supabase Storage)
            </p>
          </div>
        </div>
      )}

      {error && (
        <p className="text-xs text-rose-400 font-medium">{error}</p>
      )}
    </div>
  );
};
