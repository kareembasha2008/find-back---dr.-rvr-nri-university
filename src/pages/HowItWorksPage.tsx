import React from 'react';
import { ArrowLeft, UserPlus, FilePlus2, Sparkles, Bell, ShieldCheck, CheckCheck } from 'lucide-react';
import { TiltCard3D } from '../components/3d/TiltCard3D';
import { NriCampusMap } from '../components/maps/NriCampusMap';

interface HowItWorksPageProps {
  onNavigate: (path: string) => void;
  isAuthenticated: boolean;
}

export const HowItWorksPage: React.FC<HowItWorksPageProps> = ({ onNavigate, isAuthenticated }) => {
  const steps = [
    {
      num: '01',
      title: 'Create your university account',
      desc: 'Sign up using your Dr. RVR NRI University student ID and Gmail address. Your identity is verified and kept private from public view.',
      icon: UserPlus,
    },
    {
      num: '02',
      title: 'Report your lost or found item',
      desc: 'Submit a simple report with a photo, campus block/location, category, and date. For lost items, set a private verification answer only you know.',
      icon: FilePlus2,
    },
    {
      num: '03',
      title: 'FIND BACK checks for possible matches',
      desc: 'The campus matching system immediately scores your report against existing records using category, title keywords, location, date, and description.',
      icon: Sparkles,
    },
    {
      num: '04',
      title: 'Receive a notification when a match is detected',
      desc: 'Get an instant in-app alert with match score and side-by-side comparison between the reported lost and found items.',
      icon: Bell,
    },
    {
      num: '05',
      title: 'Verify ownership',
      desc: 'Before contact is permitted, the claimant must verify secret details not visible publicly (such as phone lock wallpaper or inside wallet contents).',
      icon: ShieldCheck,
    },
    {
      num: '06',
      title: 'Safely coordinate the return',
      desc: 'Handover takes place at designated campus custody points (e.g. Central Library Helpdesk or Main Security Post) under university supervision.',
      icon: CheckCheck,
    },
  ];

  return (
    <div className="min-h-screen text-white py-8 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <button
          onClick={() => onNavigate(isAuthenticated ? '/home' : '/')}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to {isAuthenticated ? 'Dashboard' : 'Home'}</span>
        </button>

        <div className="lovable-card rounded-3xl p-6 sm:p-10 border border-slate-800">
          <div className="text-center max-w-xl mx-auto mb-10">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
              Campus Protocol
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1">
              How FIND BACK Works
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-2">
              A private, university-governed cycle from loss to verified recovery.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {steps.map((s) => {
              const IconComp = s.icon;
              return (
                <TiltCard3D
                  key={s.num}
                  maxTilt={6}
                  scale={1.02}
                  className="flex items-start gap-4 p-5 rounded-2xl border border-slate-800/80 bg-slate-950/60 hover:bg-slate-900/40 transition-colors"
                >
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    <IconComp className="w-5 h-5 text-indigo-400" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-mono font-bold text-indigo-400">STEP {s.num}</span>
                    </div>
                    <h3 className="text-sm font-bold text-white">{s.title}</h3>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">{s.desc}</p>
                  </div>
                </TiltCard3D>
              );
            })}
          </div>

          {/* Realistic NRI University Agiripalli Campus Map */}
          <div className="mt-10 pt-8 border-t border-slate-800/80">
            <NriCampusMap
              onSelectCheckpoint={() => {
                if (!isAuthenticated) onNavigate('/register');
              }}
            />
          </div>

          {/* Final Message */}
          <TiltCard3D
            maxTilt={5}
            scale={1.01}
            className="mt-10 p-6 rounded-2xl bg-gradient-to-r from-indigo-950/60 via-slate-900 to-indigo-950/60 border border-indigo-500/30 text-white text-center"
          >
            <p className="text-xs uppercase tracking-widest text-indigo-300 font-bold mb-1">
              Guiding Workflow
            </p>
            <p className="text-lg sm:text-xl font-black tracking-wide text-white">
              Lost → Matched → Verified → Returned.
            </p>
            <div className="mt-6 flex justify-center gap-3">
              {!isAuthenticated ? (
                <>
                  <button
                    onClick={() => onNavigate('/register')}
                    className="px-5 py-2.5 lovable-glow-btn text-white text-xs font-bold rounded-xl transition-all shadow-md cursor-pointer"
                  >
                    Create Account
                  </button>
                  <button
                    onClick={() => onNavigate('/login')}
                    className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                  >
                    Login
                  </button>
                </>
              ) : (
                <button
                  onClick={() => onNavigate('/home')}
                  className="px-5 py-2.5 lovable-glow-btn text-white text-xs font-bold rounded-xl transition-all shadow-md cursor-pointer"
                >
                  Go to Dashboard
                </button>
              )}
            </div>
          </TiltCard3D>
        </div>
      </div>
    </div>
  );
};
