import React from 'react';
import { User } from '../types';
import { authService } from '../services/authService';
import { HelpCircle, FileSearch, ShieldCheck, Sparkles, ArrowRight } from 'lucide-react';

interface OnboardingPageProps {
  user: User;
  onFinish: (updatedUser: User) => void;
}

export const OnboardingPage: React.FC<OnboardingPageProps> = ({ user, onFinish }) => {
  const handleComplete = async () => {
    try {
      const updated = await authService.completeOnboarding(user.id);
      onFinish(updated);
    } catch {
      onFinish({ ...user, onboarding_completed: true });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 flex items-center justify-center">
      <div className="w-full max-w-xl bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-10">
        <div className="text-center max-w-md mx-auto mb-8">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-6 h-6" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Welcome to FIND BACK
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-2">
            Here is how you can report, discover, and securely recover items across Dr. RVR NRI University.
          </p>
        </div>

        {/* The 3 Cards */}
        <div className="space-y-4 mb-8">
          {/* Card 1 */}
          <div className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/50 flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
              1
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Lost Something?</h3>
              <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                Report it with a photo, campus block/location and time. Set a secret verification clue that only the true owner would know.
              </p>
            </div>
          </div>

          {/* Card 2 */}
          <div className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/50 flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
              2
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Found Something?</h3>
              <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                Post it so the owner can find it. You can safely deposit the item at a designated campus security or library desk.
              </p>
            </div>
          </div>

          {/* Card 3 */}
          <div className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/50 flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
              3
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Possible Match?</h3>
              <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                Verify ownership before contact information is shared. The system notifies both parties when details correspond.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-100">
          <button
            onClick={handleComplete}
            className="w-full sm:w-auto px-5 py-2.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
          >
            Skip
          </button>
          <button
            onClick={handleComplete}
            className="w-full sm:w-auto px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-slate-900/10 flex items-center justify-center gap-2 active:scale-[0.98]"
          >
            <span>Start Using FIND BACK</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
