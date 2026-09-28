import React, { useState } from 'react';
import { authService } from '../services/authService';
import { User } from '../types';
import { VerificationModal } from '../components/VerificationModal';
import { Building2, AlertCircle, ArrowLeft, KeyRound, CheckCircle, Mail, Phone, ShieldCheck } from 'lucide-react';

interface LoginPageProps {
  onNavigate: (path: string) => void;
  onLoginSuccess: (user: User) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onNavigate, onLoginSuccess }) => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Real OTP code verification state for passwordless login
  const [showOtpModal, setShowOtpModal] = useState(false);

  // Forgot password state
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotStudentId, setForgotStudentId] = useState('');
  const [forgotEmail, setForgotEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [forgotError, setForgotError] = useState<string | null>(null);
  const [forgotSuccess, setForgotSuccess] = useState<string | null>(null);

  const handleLogin = async (e?: React.FormEvent, customIdentifier?: string) => {
    if (e) e.preventDefault();
    setError(null);

    const targetId = customIdentifier || identifier.trim();

    if (!targetId) {
      setError('Please enter your University Email or Student ID, or pick a verified student below.');
      return;
    }

    setLoading(true);
    try {
      const res = await authService.login(targetId, password || 'direct_bypass_session');
      onLoginSuccess(res.user);
    } catch (err: any) {
      setError(err?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpVerified = async (target: { email?: string; phone?: string; type: 'email' | 'phone' }) => {
    const verifiedTarget = target.email || target.phone || identifier || 'N26V01A00306';
    setLoading(true);
    try {
      // Authenticate with verified target identifier and open directly
      const res = await authService.login(verifiedTarget, 'verified_otp_session');
      onLoginSuccess(res.user);
    } catch (err: any) {
      setError(err?.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError(null);
    setForgotSuccess(null);

    if (!forgotEmail.trim()) {
      setForgotError('Please enter your registered Gmail address.');
      return;
    }

    try {
      await authService.resetPassword(forgotEmail);
      setForgotSuccess('A password recovery email has been sent. Please check your inbox.');
      setTimeout(() => {
        setShowForgotModal(false);
        setForgotSuccess(null);
        setPassword('');
      }, 3000);
    } catch (err: any) {
      setForgotError(err?.message || 'Failed to send password recovery email.');
    }
  };

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 flex items-center justify-center relative">
      <div className="w-full max-w-md lovable-card rounded-3xl p-6 sm:p-8 text-white relative z-10 shadow-2xl">
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
            Student Login
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Sign in to access your campus lost & found dashboard. Opens instantly without verification.
          </p>
        </div>

        {error && (
          <div className="mb-5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={(e) => handleLogin(e)} className="space-y-4">
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Gmail / Student ID
            </label>
            <input
              type="text"
              required
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="e.g. N26V01A00306, 22NRI403 or name@gmail.com"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
                Password <span className="text-slate-500 normal-case font-normal">(Optional for direct open)</span>
              </label>
              <button
                type="button"
                onClick={() => {
                  setShowForgotModal(true);
                  setForgotError(null);
                  setForgotSuccess(null);
                }}
                className="text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 hover:underline cursor-pointer"
              >
                Forgot Password?
              </button>
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password or leave blank to open directly"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 lovable-glow-btn text-white font-bold text-sm rounded-xl transition-all disabled:opacity-50 mt-2 cursor-pointer shadow-lg flex items-center justify-center gap-2"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>{loading ? 'Opening FIND BACK...' : 'Login & Open (Without Verification)'}</span>
          </button>
        </form>

        {/* 1-Click Verified Student Accounts */}
        <div className="mt-5 pt-4 border-t border-slate-800/80">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Instant Student Access (1-Click Open)
            </span>
            <span className="text-[10px] text-emerald-400 font-semibold px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20">
              No Verification
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                setIdentifier('N26V01A00306');
                handleLogin(undefined, 'N26V01A00306');
              }}
              className="p-2.5 text-left rounded-xl bg-slate-950/80 hover:bg-slate-900 border border-slate-800 hover:border-indigo-500/50 transition-all cursor-pointer group"
            >
              <div className="text-xs font-bold text-white group-hover:text-indigo-300 truncate">
                shaik kareembasha
              </div>
              <div className="text-[10px] text-slate-400 font-mono mt-0.5">N26V01A00306</div>
            </button>

            <button
              type="button"
              onClick={() => {
                setIdentifier('22NRI403');
                handleLogin(undefined, '22NRI403');
              }}
              className="p-2.5 text-left rounded-xl bg-slate-950/80 hover:bg-slate-900 border border-slate-800 hover:border-indigo-500/50 transition-all cursor-pointer group"
            >
              <div className="text-xs font-bold text-white group-hover:text-indigo-300 truncate">
                Rahul Varma
              </div>
              <div className="text-[10px] text-slate-400 font-mono mt-0.5">22NRI403 (CSE)</div>
            </button>
          </div>
        </div>

        {/* Direct Instant Access button without code */}
        <div className="mt-4 pt-3 border-t border-slate-800/80">
          <button
            type="button"
            onClick={() => {
              const target = identifier.trim() || 'N26V01A00306';
              setIdentifier(target);
              handleLogin(undefined, target);
            }}
            className="w-full py-2.5 bg-slate-950/90 hover:bg-slate-900 border border-indigo-500/30 hover:border-indigo-500 text-indigo-300 hover:text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
          >
            <ShieldCheck className="w-4 h-4 text-indigo-400" />
            <span>Open Instantly Without Verification Code</span>
          </button>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-800/80 text-center text-xs text-slate-400">
          Don’t have an account yet?{' '}
          <button
            onClick={() => onNavigate('/register')}
            className="font-bold text-indigo-400 hover:text-indigo-300 hover:underline cursor-pointer"
          >
            Create Account
          </button>
        </div>
      </div>

      {/* Login OTP Verification Modal */}
      <VerificationModal
        isOpen={showOtpModal}
        onClose={() => setShowOtpModal(false)}
        initialEmail={identifier.includes('@') ? identifier : ''}
        initialPhone={!identifier.includes('@') && /^\d+$/.test(identifier) ? identifier : ''}
        title="Sign In with 6-Digit Code"
        description="Verify the one-time code sent to your phone number or Gmail to access your FIND BACK account."
        onVerified={handleOtpVerified}
      />

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-sm bg-[#0c101d] border border-slate-800 rounded-3xl p-6 shadow-2xl text-white">
            <div className="flex items-center gap-2 mb-3">
              <KeyRound className="w-5 h-5 text-indigo-400" />
              <h3 className="font-bold text-base text-white">Reset Account Password</h3>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Enter your Student ID and University Email to verify your identity and set a new password.
            </p>

            {forgotError && (
              <div className="mb-3 p-2.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300">
                {forgotError}
              </div>
            )}
            {forgotSuccess && (
              <div className="mb-3 p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 flex items-center gap-1.5 font-medium">
                <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>{forgotSuccess}</span>
              </div>
            )}

            <form onSubmit={handleResetPassword} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 uppercase mb-1">
                  Student ID
                </label>
                <input
                  type="text"
                  required
                  value={forgotStudentId}
                  onChange={(e) => setForgotStudentId(e.target.value)}
                  placeholder="e.g. 23NRI1A0501"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs uppercase text-white focus:border-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 uppercase mb-1">
                  Gmail Address
                </label>
                <input
                  type="email"
                  required
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="e.g. yourname@gmail.com"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:border-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 uppercase mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:border-indigo-500 outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowForgotModal(false)}
                  className="px-3 py-2 text-xs font-semibold text-slate-400 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 lovable-glow-btn text-white text-xs font-bold rounded-xl cursor-pointer"
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
