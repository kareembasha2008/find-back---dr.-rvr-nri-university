import React, { useState } from 'react';
import { Department, Year, Section } from '../types';
import { authService, RegisterPayload } from '../services/authService';
import { configService } from '../services/configService';
import { VerificationModal } from '../components/VerificationModal';
import { ShieldCheck, AlertCircle, ArrowLeft, Building2, CheckCircle2 } from 'lucide-react';

interface RegisterPageProps {
  onNavigate: (path: string) => void;
  onRegistered: () => void;
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

export const RegisterPage: React.FC<RegisterPageProps> = ({ onNavigate, onRegistered }) => {
  const systemConfig = configService.getConfig();
  const [formData, setFormData] = useState<RegisterPayload>({
    full_name: '',
    student_id: '',
    university_email: '',
    phone_number: '',
    department: 'CSE',
    year: '1st Year',
    section: 'A',
    password: '',
    confirm_password: '',
    agree_terms: false,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Frontend validations
    if (!formData.full_name.trim()) {
      setError('Please enter your full name.');
      return;
    }
    if (!formData.student_id.trim()) {
      setError('Please enter your university student ID.');
      return;
    }
    if (!formData.university_email.trim() || !formData.university_email.includes('@')) {
      setError('Please enter your valid Gmail address.');
      return;
    }
    const cleanPhone = formData.phone_number.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      setError('Please enter a valid 10-digit phone number.');
      return;
    }
    if (!formData.password) {
      setError('Please enter a password.');
      return;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (formData.password !== formData.confirm_password) {
      setError('Passwords do not match.');
      return;
    }
    if (!formData.agree_terms) {
      setError('Please agree to the FIND BACK privacy and usage rules.');
      return;
    }

    // Register directly and open without verification
    setLoading(true);
    try {
      await authService.register(formData);
      onRegistered();
    } catch (err: any) {
      setError(err?.message || 'Registration failed. Please check your information.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifiedAndRegister = async () => {
    setLoading(true);
    setError(null);
    try {
      await authService.register(formData);
      onRegistered();
    } catch (err: any) {
      setError(err?.message || 'Registration failed. Please check your information.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 flex items-center justify-center relative">
      <div className="w-full max-w-lg lovable-card rounded-3xl p-6 sm:p-8 text-white relative z-10 shadow-2xl">
        <button
          onClick={() => onNavigate('/')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white mb-6 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Landing</span>
        </button>

        <div className="mb-6">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-2">
            <Building2 className="w-3.5 h-3.5" />
            <span>Dr. RVR NRI University</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            Create your FIND BACK account
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Fill in your authentic university credentials to access the campus Lost & Found network.
          </p>
        </div>

        {error && (
          <div className="mb-5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Full Name */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Full Name *
            </label>
            <input
              type="text"
              required
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              placeholder="e.g. S. Venkatesh / P. Ananya"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
            />
          </div>

          {/* Student ID & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Student ID *
              </label>
              <input
                type="text"
                required
                value={formData.student_id}
                onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
                placeholder="e.g. 23NRI1A0501"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all uppercase"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Phone Number *
              </label>
              <input
                type="tel"
                required
                value={formData.phone_number}
                onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                placeholder="e.g. 9876543210"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
              />
            </div>
          </div>

          {/* Gmail Address */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
                Gmail Address *
              </label>
              <span className="text-[10px] text-slate-400 font-medium">
                @{systemConfig.allowed_email_domain}
              </span>
            </div>
            <input
              type="email"
              required
              value={formData.university_email}
              onChange={(e) => setFormData({ ...formData, university_email: e.target.value })}
              placeholder={`yourname@${systemConfig.allowed_email_domain}`}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
            />
          </div>

          {/* Department, Year, Section */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Department *
              </label>
              <select
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value as Department })}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none cursor-pointer"
              >
                {DEPARTMENTS.map((d) => (
                  <option key={d} value={d} className="bg-slate-900 text-white">
                    {d}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Year *
              </label>
              <select
                value={formData.year}
                onChange={(e) => setFormData({ ...formData, year: e.target.value as Year })}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none cursor-pointer"
              >
                {YEARS.map((y) => (
                  <option key={y} value={y} className="bg-slate-900 text-white">
                    {y}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Section *
              </label>
              <select
                value={formData.section}
                onChange={(e) => setFormData({ ...formData, section: e.target.value as Section })}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none cursor-pointer"
              >
                {SECTIONS.map((s) => (
                  <option key={s} value={s} className="bg-slate-900 text-white">
                    Sec {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Password & Confirm Password */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Password *
              </label>
              <input
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Min 6 characters"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Confirm Password *
              </label>
              <input
                type="password"
                required
                value={formData.confirm_password}
                onChange={(e) => setFormData({ ...formData, confirm_password: e.target.value })}
                placeholder="Repeat password"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
              />
            </div>
          </div>

          {/* Checkbox agreement */}
          <div className="pt-2">
            <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-400">
              <input
                type="checkbox"
                checked={formData.agree_terms}
                onChange={(e) => setFormData({ ...formData, agree_terms: e.target.checked })}
                className="mt-0.5 rounded bg-slate-950 border-slate-800 text-indigo-600 focus:ring-indigo-500"
              />
              <span>
                I agree to the FIND BACK university privacy and usage rules.
              </span>
            </label>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 lovable-glow-btn text-white font-bold text-sm rounded-xl transition-all disabled:opacity-50 mt-2 cursor-pointer shadow-lg"
          >
            {loading ? 'Creating Account...' : 'Create Account & Open Directly (No Verification)'}
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-slate-800/80 text-center text-xs text-slate-400">
          Already have an account?{' '}
          <button
            onClick={() => onNavigate('/login')}
            className="font-bold text-indigo-400 hover:text-indigo-300 hover:underline cursor-pointer"
          >
            Login here
          </button>
        </div>
      </div>

      {/* Real Verification Modal: Dispatches OTP to student's Gmail or Phone */}
      <VerificationModal
        isOpen={isVerifyModalOpen}
        onClose={() => setIsVerifyModalOpen(false)}
        initialEmail={formData.university_email}
        initialPhone={formData.phone_number}
        fullName={formData.full_name}
        title="Verify Account Credentials"
        description="To protect campus property and prevent fake reports, verify your authentic phone number or Gmail address."
        onVerified={handleVerifiedAndRegister}
      />
    </div>
  );
};
