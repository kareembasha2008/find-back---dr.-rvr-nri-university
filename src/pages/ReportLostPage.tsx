import React, { useState, useEffect } from 'react';
import { User, ItemCategory, CampusLocation } from '../types';
import { itemService } from '../services/itemService';
import { ImageUpload } from '../components/ImageUpload';
import { GoogleMapPickerModal } from '../components/maps/GoogleMapPickerModal';
import { ArrowLeft, AlertCircle, CheckCircle2, Lock, MapPin, Navigation } from 'lucide-react';

interface ReportLostPageProps {
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

const DRAFT_LOST_KEY = 'findback_draft_lost_report';

export const ReportLostPage: React.FC<ReportLostPageProps> = ({
  user,
  onNavigate,
  onSuccess,
}) => {
  const today = new Date().toISOString().split('T')[0];

  const getSavedDraft = () => {
    try {
      const saved = localStorage.getItem(DRAFT_LOST_KEY);
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
  const [approxTime, setApproxTime] = useState(draft?.approxTime || '11:00 AM');
  const [description, setDescription] = useState(draft?.description || '');
  const [photoUrl, setPhotoUrl] = useState(draft?.photoUrl || '');
  const [privateQuestion, setPrivateQuestion] = useState(
    draft?.privateQuestion ||
      'What secret marker, lock code, sticker, or internal detail confirms ownership?'
  );
  const [privateAnswer, setPrivateAnswer] = useState(draft?.privateAnswer || '');

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
        privateQuestion,
        privateAnswer,
      };
      localStorage.setItem(DRAFT_LOST_KEY, JSON.stringify(dataToSave));
    } catch (e) {
      console.warn('Could not auto-save draft', e);
    }
  }, [
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
    privateQuestion,
    privateAnswer,
  ]);

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
      setError('Please select a campus location.');
      return;
    }
    if (!date) {
      setError('Please specify the date when the item was lost.');
      return;
    }
    if (!description.trim()) {
      setError('Please provide a descriptive explanation to assist campus matching.');
      return;
    }
    if (!privateAnswer.trim()) {
      setError('Please provide a secret ownership answer. This is kept strictly private.');
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
          type: 'lost',
          private_verification_question: privateQuestion,
          private_verification_answer: privateAnswer,
        },
        {
          id: user.id,
          department: user.department,
          year: user.year,
        }
      );

      setSuccessNotice(true);
      try {
        localStorage.removeItem(DRAFT_LOST_KEY);
      } catch (e) {
        // Ignore
      }
      setTimeout(() => {
        onSuccess();
      }, 1600);
    } catch (err: any) {
      setError(err?.message || 'Your report could not be submitted. Please try again.');
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
            <span className="text-xs font-bold text-rose-400 uppercase tracking-wider">
              Loss Report
            </span>
            <h1 className="text-2xl font-extrabold text-white tracking-tight mt-1">
              I Lost Something
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Submit your lost item details with Google Maps location and private verification to find it back.
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
                Your lost item has been reported.
              </h2>
              <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                The FIND BACK matching algorithm is actively scanning campus records. Navigating to My Reports...
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Photo Upload */}
              <ImageUpload
                value={photoUrl}
                onChange={setPhotoUrl}
                userId={user.id}
                label="Photo of Item (Optional)"
              />

              {/* Item Name */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Item Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Wireless Earbuds, Student ID Card, Scientific Calculator..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                />
              </div>

              {/* Category & Campus Location */}
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
                    <MapPin className="w-4 h-4 text-indigo-400" />
                    <span className="text-xs font-bold text-white">Precise Location on Map</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsMapPickerOpen(true)}
                    className="px-3 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/40 border border-indigo-500/40 text-indigo-300 text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
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
                      <span className="text-[10px] font-mono text-indigo-400">
                        {latitude.toFixed(4)}°, {longitude.toFixed(4)}°
                      </span>
                    )}
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-400">
                    Pinpoint the exact building, floor, or room coordinates across Dr. RVR NRI University.
                  </p>
                )}
              </div>

              {/* Date & Approximate Time */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Lost Date *
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
                    placeholder="e.g. 10:30 AM / After lunch period"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-white placeholder-slate-500 focus:border-indigo-500 outline-none"
                  />
                </div>
              </div>

              {/* Public Description */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Public Description *
                </label>
                <textarea
                  rows={3}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe color, model, distinguishing characteristics, or where you last used it..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-white placeholder-slate-500 focus:border-indigo-500 outline-none resize-none"
                />
              </div>

              {/* Secret Ownership Verification Clue */}
              <div className="p-4 rounded-2xl bg-indigo-950/30 border border-indigo-500/25 space-y-3">
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-emerald-400 shrink-0" />
                  <div>
                    <h4 className="text-xs font-bold text-white">
                      Private Ownership Verification Clue
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      Answer is stored securely and never displayed in public listings.
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Verification Question
                  </label>
                  <input
                    type="text"
                    required
                    value={privateQuestion}
                    onChange={(e) => setPrivateQuestion(e.target.value)}
                    placeholder="e.g., What wallpaper image is on the lock screen?"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:border-indigo-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Private Answer (Only you know this) *
                  </label>
                  <input
                    type="text"
                    required
                    value={privateAnswer}
                    onChange={(e) => setPrivateAnswer(e.target.value)}
                    placeholder="e.g., Photo of family dog / Blue Spider-Man sticker on back"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:border-indigo-500 outline-none"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 lovable-glow-btn text-white font-bold text-sm rounded-xl transition-all shadow-lg shadow-indigo-500/25 disabled:opacity-50 cursor-pointer active:scale-95"
              >
                {loading ? 'Submitting Report to Supabase...' : 'Submit Lost Item Report'}
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
