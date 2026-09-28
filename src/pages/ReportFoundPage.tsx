import React, { useState, useEffect } from 'react';
import { User, ItemCategory, CampusLocation } from '../types';
import { itemService } from '../services/itemService';
import { ImageUpload } from '../components/ImageUpload';
import { GoogleMapPickerModal } from '../components/maps/GoogleMapPickerModal';
import { ArrowLeft, AlertCircle, CheckCircle2, MapPin, Navigation } from 'lucide-react';

interface ReportFoundPageProps {
  user: User;
  onNavigate: (path: string) => void;
  onSuccess: () => void;
}

const CATEGORIES: ItemCategory[] = [
  'ID Card',
  'Wallet',
  'Electronics',
  'Keys',
  'Books',
  'Bag',
  'Accessories',
  'Documents',
  'Other',
];

const LOCATIONS: CampusLocation[] = [
  'A Block',
  'B Block',
  'C Block',
  'Library',
  'Canteen',
  'Hostel',
  'Ground',
  'Parking',
  'Bus Area',
  'Other',
];

const DRAFT_FOUND_KEY = 'findback_draft_found_report';

export const ReportFoundPage: React.FC<ReportFoundPageProps> = ({
  user,
  onNavigate,
  onSuccess,
}) => {
  const today = new Date().toISOString().split('T')[0];

  const getSavedDraft = () => {
    try {
      const saved = localStorage.getItem(DRAFT_FOUND_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  };

  const draft = getSavedDraft();

  const [name, setName] = useState(draft?.name || '');
  const [category, setCategory] = useState<ItemCategory>(draft?.category || 'Electronics');
  const [location, setLocation] = useState<CampusLocation>(draft?.location || 'Library');
  const [buildingName, setBuildingName] = useState<string>(draft?.buildingName || 'Central University Library');
  const [latitude, setLatitude] = useState<number | null>(draft?.latitude || null);
  const [longitude, setLongitude] = useState<number | null>(draft?.longitude || null);
  const [date, setDate] = useState(draft?.date || today);
  const [approxTime, setApproxTime] = useState(draft?.approxTime || '02:00 PM');
  const [description, setDescription] = useState(draft?.description || '');
  const [photoUrl, setPhotoUrl] = useState(draft?.photoUrl || '');

  const [isMapPickerOpen, setIsMapPickerOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState(false);

  useEffect(() => {
    try {
      const dataToSave = {
        name,
        category,
        location,
        buildingName,
        latitude,
        longitude,
        date,
        approxTime,
        description,
        photoUrl,
      };
      localStorage.setItem(DRAFT_FOUND_KEY, JSON.stringify(dataToSave));
    } catch (e) {
      console.warn('Could not auto-save draft', e);
    }
  }, [name, category, location, buildingName, latitude, longitude, date, approxTime, description, photoUrl]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Please enter the item name.');
      return;
    }
    if (!category) {
      setError('Please select an item category.');
      return;
    }
    if (!location) {
      setError('Please select the campus location.');
      return;
    }
    if (!date) {
      setError('Please specify the date when you discovered the item.');
      return;
    }
    if (!description.trim()) {
      setError('Please describe the item to help genuine owners recognize it.');
      return;
    }

    setLoading(true);
    try {
      await itemService.createReport(
        {
          name,
          category,
          location,
          building_name: buildingName,
          latitude,
          longitude,
          date,
          approx_time: approxTime,
          description,
          photo_url: photoUrl,
          type: 'found',
        },
        {
          id: user.id,
          department: user.department,
          year: user.year,
        }
      );

      setSuccessNotice(true);
      try {
        localStorage.removeItem(DRAFT_FOUND_KEY);
      } catch (e) {
        // Ignore
      }
      setTimeout(() => {
        onSuccess();
      }, 1600);
    } catch (err: any) {
      setError(err?.message || 'Your found report could not be submitted. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 text-white">
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => onNavigate('/home')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white mb-6 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </button>

        <div className="lovable-card rounded-3xl p-6 sm:p-8 shadow-2xl relative">
          <div className="mb-6">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
              Discovery Report
            </span>
            <h1 className="text-2xl font-extrabold text-white tracking-tight mt-1">
              I Found Something
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Help reunite a fellow Dr. RVR NRI University student or faculty member with their lost belongings.
            </p>
          </div>

          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {successNotice ? (
            <div className="py-12 text-center space-y-3 animate-fade-in">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/10">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-bold text-white">
                Your found item has been reported.
              </h2>
              <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                Thank you for acting honestly. The matching system is checking for matching lost reports. Navigating to My Reports...
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Photo Upload */}
              <ImageUpload
                value={photoUrl}
                onChange={setPhotoUrl}
                userId={user.id}
                label="Safe Photo of Found Item (Recommended)"
              />

              {/* Item Name */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Item Title *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Student ID Card, Casio Calculator, Blue Keychain..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                />
              </div>

              {/* Category & Location */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Category *
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as ItemCategory)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-medium text-white focus:border-indigo-500 outline-none cursor-pointer"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c} className="bg-slate-900 text-white">
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Campus Zone *
                  </label>
                  <select
                    value={location}
                    onChange={(e) => setLocation(e.target.value as CampusLocation)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-medium text-white focus:border-indigo-500 outline-none cursor-pointer"
                  >
                    {LOCATIONS.map((loc) => (
                      <option key={loc} value={loc} className="bg-slate-900 text-white">
                        {loc}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Interactive Google Map Location Selection */}
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold text-white">Discovery Location on Map</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsMapPickerOpen(true)}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/40 border border-emerald-500/40 text-emerald-300 text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Navigation className="w-3.5 h-3.5" />
                    <span>Select Location on Map</span>
                  </button>
                </div>

                {buildingName ? (
                  <div className="flex items-center justify-between text-xs text-slate-300 pt-1">
                    <span className="font-semibold text-white truncate max-w-sm">
                      📍 {buildingName}
                    </span>
                    {latitude && longitude && (
                      <span className="text-[10px] font-mono text-emerald-400">
                        {latitude.toFixed(4)}°, {longitude.toFixed(4)}°
                      </span>
                    )}
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-400">
                    Pinpoint where the item was found across Dr. RVR NRI University.
                  </p>
                )}
              </div>

              {/* Date & Approximate Time */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Found Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={date}
                    max={today}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-white focus:border-indigo-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Approximate Time
                  </label>
                  <input
                    type="text"
                    value={approxTime}
                    onChange={(e) => setApproxTime(e.target.value)}
                    placeholder="e.g. 02:30 PM / End of lab session"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-white placeholder-slate-500 focus:border-indigo-500 outline-none"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Public Description *
                </label>
                <textarea
                  rows={3}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the item's general appearance. Keep secret/identifying marks unlisted to verify genuine owners later..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-white placeholder-slate-500 focus:border-indigo-500 outline-none resize-none"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 lovable-glow-btn text-white font-bold text-sm rounded-xl transition-all shadow-lg shadow-indigo-500/25 disabled:opacity-50 cursor-pointer active:scale-95"
              >
                {loading ? 'Submitting Report to Supabase...' : 'Submit Found Item Report'}
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Google Map Coordinates Picker Modal */}
      <GoogleMapPickerModal
        isOpen={isMapPickerOpen}
        onClose={() => setIsMapPickerOpen(false)}
        initialLat={latitude}
        initialLng={longitude}
        initialLocation={buildingName}
        onConfirm={(loc) => {
          setLatitude(loc.latitude);
          setLongitude(loc.longitude);
          setLocation(loc.location);
          setBuildingName(loc.buildingName);
        }}
      />
    </div>
  );
};
