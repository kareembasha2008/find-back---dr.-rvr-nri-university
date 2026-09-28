import React, { useState, useEffect, useRef } from 'react';
import { verificationService } from '../services/verificationService';
import { ShieldCheck, Mail, Phone, ArrowRight, RefreshCw, AlertCircle, CheckCircle2, X, Sparkles } from 'lucide-react';
import { VerificationShield3D } from './3d/VerificationShield3D';

interface VerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerified: (verifiedTarget: { email?: string; phone?: string; type: 'email' | 'phone' }) => void;
  initialEmail?: string;
  initialPhone?: string;
  fullName?: string;
  title?: string;
  description?: string;
}

export const VerificationModal: React.FC<VerificationModalProps> = ({
  isOpen,
  onClose,
  onVerified,
  initialEmail = '',
  initialPhone = '',
  fullName = '',
  title = 'Verify Your Identity',
  description = 'Verify your authentic Dr. RVR NRI University credentials to protect campus belongings.',
}) => {
  const [method, setMethod] = useState<'email' | 'phone'>(initialEmail ? 'email' : 'phone');
  const [emailInput, setEmailInput] = useState(initialEmail);
  const [phoneInput, setPhoneInput] = useState(initialPhone);
  const [codeSent, setCodeSent] = useState(false);
  const [codeDigits, setCodeDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number>(0);
  const [devHint, setDevHint] = useState<string | null>(null);
  const [isVerified, setIsVerified] = useState(false);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (initialEmail) setEmailInput(initialEmail);
    if (initialPhone) setPhoneInput(initialPhone);
  }, [initialEmail, initialPhone]);

  // Countdown timer for resend
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  if (!isOpen) return null;

  const currentTarget = method === 'email' ? emailInput.trim() : phoneInput.trim();

  const handleSendCode = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (method === 'email' && !emailInput.includes('@')) {
      setError('Please enter a valid Gmail address.');
      return;
    }
    if (method === 'phone' && phoneInput.replace(/\D/g, '').length < 10) {
      setError('Please enter a valid 10-digit phone number.');
      return;
    }

    setLoading(true);
    try {
      const res = await verificationService.sendCode(currentTarget, method, fullName);
      setCodeSent(true);
      setCountdown(60);
      setSuccessMsg(res.message);
      if (res.debugCode) {
        setDevHint(res.debugCode);
      }
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 100);
    } catch (err: any) {
      setError(err?.message || 'Failed to dispatch verification code.');
    } finally {
      setLoading(false);
    }
  };

  const handleDigitChange = (index: number, val: string) => {
    const digit = val.slice(-1);
    const updated = [...codeDigits];
    updated[index] = digit;
    setCodeDigits(updated);

    // Auto-advance to next input
    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto verify if all 6 digits entered
    if (digit && index === 5 && updated.every((d) => d !== '')) {
      handleVerify(updated.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !codeDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').trim();
    if (/^\d{6}$/.test(pasteData)) {
      const digits = pasteData.split('');
      setCodeDigits(digits);
      inputRefs.current[5]?.focus();
      handleVerify(pasteData);
    }
  };

  const handleVerify = async (codeToVerify?: string) => {
    const fullCode = codeToVerify || codeDigits.join('');
    setError(null);

    if (fullCode.length !== 6) {
      setError('Please enter all 6 digits of your verification code.');
      return;
    }

    setLoading(true);
    try {
      const res = await verificationService.verifyCode(currentTarget, fullCode);
      if (res.verified) {
        setIsVerified(true);
        setSuccessMsg('Verification successful!');
        setTimeout(() => {
          onVerified({
            email: method === 'email' ? currentTarget : undefined,
            phone: method === 'phone' ? currentTarget : undefined,
            type: method,
          });
          onClose();
        }, 1200);
      }
    } catch (err: any) {
      setError(err?.message || 'Invalid verification code. Please check and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBypass = () => {
    setIsVerified(true);
    setTimeout(() => {
      onVerified({
        email: emailInput.trim() || initialEmail || 'student@rvrjcce.ac.in',
        phone: phoneInput.trim() || initialPhone,
        type: method,
      });
      onClose();
    }, 300);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-md bg-[#0c101d] border border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-2xl relative text-white">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {isVerified ? (
          <div className="py-6 animate-fade-in">
            <VerificationShield3D
              verified={true}
              title="Identity Confirmed"
              subtitle="Dr. RVR NRI University Secure Verification Protocol"
            />
          </div>
        ) : (
          <>
            {/* Modal Header */}
            <div className="flex items-center justify-between gap-2.5 mb-2">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-lg text-white tracking-tight">{title}</h3>
                  <span className="text-[11px] font-semibold text-indigo-400 uppercase tracking-wider">
                    Campus Access
                  </span>
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-400 mb-4 leading-relaxed">{description}</p>

            {/* Quick Bypass Button to Open Without Verification */}
            <button
              type="button"
              onClick={handleBypass}
              className="w-full mb-4 py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500/20 to-teal-500/20 hover:from-emerald-500/30 hover:to-teal-500/30 border border-emerald-500/40 text-emerald-300 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>Open Directly (Skip Code Verification)</span>
            </button>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Method Toggle: Gmail vs Phone Number */}
        {!codeSent && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950/80 border border-slate-800 rounded-2xl text-xs">
              <button
                type="button"
                onClick={() => setMethod('email')}
                className={`py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
                  method === 'email'
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Verify via Gmail</span>
              </button>
              <button
                type="button"
                onClick={() => setMethod('phone')}
                className={`py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
                  method === 'phone'
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Verify via Phone</span>
              </button>
            </div>

            <form onSubmit={handleSendCode} className="space-y-4">
              {method === 'email' ? (
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Your Gmail Address
                  </label>
                  <input
                    type="email"
                    required
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="e.g. yourname@gmail.com"
                    className="w-full px-4 py-3 bg-slate-950/80 border border-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 rounded-xl text-sm text-white placeholder-slate-500 transition-all outline-none"
                  />
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    A 6-digit security code will be sent to this email.
                  </span>
                </div>
              ) : (
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Your Phone Number
                  </label>
                  <div className="flex gap-2">
                    <span className="px-3.5 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-400 text-sm font-semibold flex items-center">
                      +91
                    </span>
                    <input
                      type="tel"
                      required
                      value={phoneInput}
                      onChange={(e) => setPhoneInput(e.target.value)}
                      placeholder="e.g. 9876543210"
                      className="flex-1 px-4 py-3 bg-slate-950/80 border border-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 rounded-xl text-sm text-white placeholder-slate-500 transition-all outline-none"
                    />
                  </div>
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    A 6-digit SMS verification code will be dispatched to this number.
                  </span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 lovable-glow-btn text-white font-bold text-sm rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 mt-2 cursor-pointer"
              >
                <span>{loading ? 'Sending Code...' : 'Send 6-Digit Code'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}

        {/* OTP Input Form after Code is Sent */}
        {codeSent && (
          <div className="space-y-5 animate-fade-in">
            <div className="p-3 bg-slate-950/80 border border-slate-800/80 rounded-2xl flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                {method === 'email' ? (
                  <Mail className="w-4 h-4 text-indigo-400" />
                ) : (
                  <Phone className="w-4 h-4 text-indigo-400" />
                )}
                <span className="text-slate-300 font-medium truncate max-w-[200px]">
                  {currentTarget}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setCodeSent(false);
                  setCodeDigits(['', '', '', '', '', '']);
                }}
                className="text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 underline"
              >
                Change
              </button>
            </div>

            {/* Dev / Demo OTP Quick Auto-fill Hint */}
            {devHint && (
              <div
                onClick={() => {
                  const digits = devHint.split('');
                  setCodeDigits(digits);
                  handleVerify(devHint);
                }}
                className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-xs text-indigo-300 flex items-center justify-between cursor-pointer hover:bg-indigo-500/20 transition-all shadow-sm"
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Campus Preview OTP: <strong className="font-mono text-white tracking-widest">{devHint}</strong></span>
                </div>
                <span className="text-[10px] font-bold uppercase underline">Auto-fill & Verify</span>
              </div>
            )}

            {/* 6 Digit OTP inputs */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-2 text-center">
                Enter 6-Digit Verification Code
              </label>
              <div className="flex justify-center gap-2.5 sm:gap-3" onPaste={handlePaste}>
                {codeDigits.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => {
                      inputRefs.current[idx] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleDigitChange(idx, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(idx, e)}
                    className="w-11 h-13 sm:w-12 sm:h-14 bg-slate-950/90 border border-slate-800 text-center text-xl font-extrabold text-white rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 outline-none transition-all"
                  />
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleVerify()}
              disabled={loading || codeDigits.some((d) => !d)}
              className="w-full py-3.5 lovable-glow-btn text-white font-bold text-sm rounded-xl transition-all disabled:opacity-40 flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>{loading ? 'Verifying...' : 'Confirm & Complete'}</span>
              <CheckCircle2 className="w-4 h-4" />
            </button>

            {/* Resend button with countdown */}
            <div className="text-center pt-2 border-t border-slate-900 flex items-center justify-center gap-1.5 text-xs text-slate-400">
              <span>Didn’t receive the code?</span>
              {countdown > 0 ? (
                <span className="text-slate-500 font-medium">Resend in {countdown}s</span>
              ) : (
                <button
                  type="button"
                  onClick={() => handleSendCode()}
                  disabled={loading}
                  className="font-bold text-indigo-400 hover:text-indigo-300 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Resend Code</span>
                </button>
              )}
            </div>
          </div>
        )}
          </>
        )}
      </div>
    </div>
  );
};
