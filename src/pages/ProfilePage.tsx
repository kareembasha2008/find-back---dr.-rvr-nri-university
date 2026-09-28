import React, { useState, useRef } from 'react';
import { User, Department, Year, Section } from '../types';
import { supabase } from '../lib/supabase';
import { authService } from '../services/authService';
import { storageService } from '../services/storageService';
import {
  Building2,
  Shield,
  LogOut,
  KeyRound,
  Edit3,
  Check,
  AlertCircle,
  CheckCircle2,
  Lock,
  Camera,
  Loader2,
} from 'lucide-react';

interface ProfilePageProps {
  user: User;
  onUpdateUser: (user: User) => void;
  onLogout: () => void;
}

const DEPARTMENTS: Department[] = [
  'CSE',
  'CSE-AI & ML',
  'ECE',
  'EEE',
  'ME',
  'CE',
  'Other',
];
const YEARS: Year[] = ['1st Year', '2nd Year', '3rd Year', '4th Year'];
const SECTIONS: Section[] = ['A', 'B', 'C', 'D', 'Other'];

export const ProfilePage: React.FC<ProfilePageProps> = ({
  user,
  onUpdateUser,
  onLogout,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [phone, setPhone] = useState(user.phone_number);
  const [dept, setDept] = useState<Department>(user.department);
  const [year, setYear] = useState<Year>(user.year);
  const [section, setSection] = useState<Section>(user.section);

  const [editSuccess, setEditSuccess] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Change password modal
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingPhoto(true);
    try {
      const photoUrl = await storageService.uploadProfilePhoto(file, user.id);
      const updated = await authService.updateProfile(user.id, {
        profile_photo_url: photoUrl,
      });
      onUpdateUser(updated);
      setEditSuccess('Profile photo updated successfully.');
      setTimeout(() => setEditSuccess(null), 3000);
    } catch (err: any) {
      alert(err?.message || 'Failed to upload profile photo.');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) {
      alert('Please enter a phone number.');
      return;
    }
    try {
      const updated = await authService.updateProfile(user.id, {
        phone_number: phone.trim(),
        department: dept,
        year,
        section,
      });
      onUpdateUser(updated);
      setIsEditing(false);
      setEditSuccess('Profile details updated successfully.');
      setTimeout(() => setEditSuccess(null), 3000);
    } catch (err: any) {
      alert(err?.message || 'Failed to update profile.');
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match.');
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setPasswordSuccess('Password successfully changed.');
      setTimeout(() => {
        setShowPasswordModal(false);
        setPasswordSuccess(null);
        setNewPassword('');
        setConfirmPassword('');
      }, 1800);
    } catch (err: any) {
      setPasswordError(err?.message || 'Failed to update password.');
    }
  };

  return (
    <div className="min-h-screen text-white pb-20 md:pb-12 pt-6 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">
              Student Profile
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Verified credentials at Dr. RVR NRI University, Agiripalli
            </p>
          </div>

          <button
            onClick={onLogout}
            className="px-3.5 py-2 text-xs font-semibold text-rose-400 hover:text-white hover:bg-rose-600/80 border border-rose-500/30 rounded-xl transition-all flex items-center gap-1.5 shadow-md cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Logout</span>
          </button>
        </div>

        {editSuccess && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 flex items-center gap-2 font-medium animate-fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{editSuccess}</span>
          </div>
        )}

        {/* Profile Card */}
        <div className="lovable-card rounded-3xl p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between pb-6 border-b border-slate-800/80">
            <div className="flex items-center gap-4">
              <div className="relative group">
                {user.profile_photo_url ? (
                  <img
                    src={user.profile_photo_url}
                    alt={user.full_name}
                    className="w-16 h-16 rounded-2xl object-cover border border-slate-700 shadow-md shadow-indigo-500/10"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-blue-500 text-white flex items-center justify-center font-extrabold text-2xl uppercase shadow-md shadow-indigo-500/20">
                    {user.full_name.charAt(0)}
                  </div>
                )}

                <button
                  type="button"
                  disabled={uploadingPhoto}
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute -bottom-1 -right-1 w-6 h-6 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center shadow-md transition-colors cursor-pointer border border-slate-900"
                  title="Upload profile photo"
                >
                  {uploadingPhoto ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Camera className="w-3 h-3" />
                  )}
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handlePhotoUpload}
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                />
              </div>

              <div>
                <h2 className="text-lg font-extrabold text-white">{user.full_name}</h2>
                <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                  <span className="font-semibold text-indigo-400">{user.student_id}</span>
                  <span>·</span>
                  <span>{user.department}</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setIsEditing(!isEditing)}
              className="px-3 py-1.5 rounded-xl border border-slate-800 hover:bg-slate-800 text-xs font-semibold text-slate-300 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>{isEditing ? 'Cancel' : 'Edit Profile'}</span>
            </button>
          </div>

          {/* Privacy Note */}
          <div className="p-3.5 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl text-xs text-indigo-300 flex items-start gap-2.5">
            <Shield className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-white">Student Privacy Shielded</span>
              <p className="text-indigo-300 mt-0.5">
                Your phone number and student ID are never shown to other students in campus reports or search results.
              </p>
            </div>
          </div>

          {isEditing ? (
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-white font-medium focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Department
                  </label>
                  <select
                    value={dept}
                    onChange={(e) => setDept(e.target.value as Department)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs font-medium text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    {DEPARTMENTS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Year of Study
                  </label>
                  <select
                    value={year}
                    onChange={(e) => setYear(e.target.value as Year)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs font-medium text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    {YEARS.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Section
                  </label>
                  <select
                    value={section}
                    onChange={(e) => setSection(e.target.value as Section)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs font-medium text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    {SECTIONS.map((s) => (
                      <option key={s} value={s}>
                        Sec {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 lovable-glow-btn text-white text-xs font-bold rounded-xl shadow-md cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800/80">
                <span className="font-semibold text-slate-400 uppercase tracking-wider text-[10px]">
                  Gmail Address
                </span>
                <p className="font-medium text-white mt-1 tabular-nums">
                  {user.university_email}
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800/80">
                <span className="font-semibold text-slate-400 uppercase tracking-wider text-[10px]">
                  Student ID
                </span>
                <p className="font-medium text-white mt-1 uppercase">
                  {user.student_id}
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800/80">
                <span className="font-semibold text-slate-400 uppercase tracking-wider text-[10px]">
                  Phone Number
                </span>
                <p className="font-medium text-white mt-1 tabular-nums">
                  {user.phone_number}
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800/80">
                <span className="font-semibold text-slate-400 uppercase tracking-wider text-[10px]">
                  Academic Section
                </span>
                <p className="font-medium text-white mt-1">
                  {user.year} · Sec {user.section}
                </p>
              </div>
            </div>
          )}

          {/* Account Actions */}
          <div className="pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3">
            <button
              onClick={() => {
                setShowPasswordModal(true);
                setPasswordError(null);
                setPasswordSuccess(null);
              }}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-800 hover:bg-slate-800 text-xs font-semibold text-slate-300 hover:text-white transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <KeyRound className="w-3.5 h-3.5 text-indigo-400" />
              <span>Change Password</span>
            </button>

            <button
              onClick={onLogout}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:bg-rose-500/10 text-slate-300 hover:text-rose-400 text-xs font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-sm bg-[#0c101d] rounded-3xl p-6 shadow-2xl border border-slate-800 text-white">
            <div className="flex items-center gap-2 mb-3">
              <KeyRound className="w-5 h-5 text-indigo-400" />
              <h3 className="font-bold text-base text-white">Change Password</h3>
            </div>

            {passwordError && (
              <div className="mb-3 p-2.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 font-medium">
                {passwordError}
              </div>
            )}
            {passwordSuccess && (
              <div className="mb-3 p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 font-medium flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>{passwordSuccess}</span>
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="px-3 py-2 text-xs font-semibold text-slate-400 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 lovable-glow-btn text-white text-xs font-bold rounded-xl shadow-md cursor-pointer"
                >
                  Update Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
