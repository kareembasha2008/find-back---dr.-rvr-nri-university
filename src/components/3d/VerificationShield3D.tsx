import React from 'react';
import { ShieldCheck, CheckCircle2, Lock, Sparkles } from 'lucide-react';

interface VerificationShield3DProps {
  verified?: boolean;
  title?: string;
  subtitle?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const VerificationShield3D: React.FC<VerificationShield3DProps> = ({
  verified = true,
  title = 'Ownership Confirmed',
  subtitle = 'Dr. RVR NRI University Safe Protocol',
  size = 'md',
}) => {
  return (
    <div className="relative flex flex-col items-center justify-center p-6 text-center select-none" style={{ perspective: '800px' }}>
      {/* 3D Animated Floating Shield Emblem */}
      <div
        className="relative flex items-center justify-center transform-gpu transition-all duration-700 hover:scale-110 cursor-pointer"
        style={{
          transformStyle: 'preserve-3d',
          animation: 'shieldFloat 4s ease-in-out infinite',
        }}
      >
        {/* Glow Halo */}
        <div
          className={`absolute rounded-full filter blur-xl opacity-60 transition-colors duration-500 ${
            verified ? 'w-28 h-28 bg-emerald-500' : 'w-24 h-24 bg-indigo-500'
          }`}
          style={{ transform: 'translateZ(-20px)' }}
        />

        {/* 3D Rotating Outer Gyro Ring */}
        <div
          className="absolute w-28 h-28 rounded-full border-2 border-dashed border-indigo-400/40 pointer-events-none"
          style={{
            animation: 'gyroRotate 8s linear infinite',
            transform: 'rotateX(60deg)',
          }}
        />

        {/* 3D Counter Rotating Ring */}
        <div
          className="absolute w-24 h-24 rounded-full border border-emerald-400/50 pointer-events-none"
          style={{
            animation: 'gyroRotateCounter 6s linear infinite',
            transform: 'rotateY(60deg)',
          }}
        />

        {/* Main 3D Metallic Shield Core */}
        <div
          className={`relative w-20 h-20 rounded-2xl flex items-center justify-center border shadow-2xl transition-all duration-500 ${
            verified
              ? 'bg-gradient-to-tr from-emerald-950 via-emerald-800 to-teal-700 border-emerald-400 text-emerald-200 shadow-emerald-500/30'
              : 'bg-gradient-to-tr from-indigo-950 via-indigo-900 to-blue-800 border-indigo-400 text-indigo-200 shadow-indigo-500/30'
          }`}
          style={{
            transform: 'translateZ(15px) rotateY(-10deg)',
            boxShadow: '0 20px 30px -10px rgba(0,0,0,0.8), inset 0 2px 4px rgba(255,255,255,0.4)',
          }}
        >
          {verified ? (
            <ShieldCheck className="w-10 h-10 drop-shadow-md text-emerald-300 animate-pulse" />
          ) : (
            <Lock className="w-9 h-9 drop-shadow-md text-indigo-300" />
          )}

          {/* Sparkle badge */}
          <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center shadow-lg">
            <Sparkles className="w-3.5 h-3.5 fill-slate-950" />
          </div>
        </div>
      </div>

      {/* Title & Subtitle */}
      {title && (
        <h3 className="mt-4 text-base font-extrabold text-white tracking-tight flex items-center gap-1.5">
          <span>{title}</span>
          {verified && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
        </h3>
      )}
      {subtitle && (
        <p className="text-xs text-slate-400 max-w-xs mt-1 leading-relaxed">
          {subtitle}
        </p>
      )}

      {/* Embedded 3D Keyframe Animations */}
      <style>{`
        @keyframes shieldFloat {
          0%, 100% {
            transform: translateY(0px) rotateY(-8deg) rotateX(4deg);
          }
          50% {
            transform: translateY(-8px) rotateY(8deg) rotateX(-4deg);
          }
        }
        @keyframes gyroRotate {
          from {
            transform: rotateX(60deg) rotateZ(0deg);
          }
          to {
            transform: rotateX(60deg) rotateZ(360deg);
          }
        }
        @keyframes gyroRotateCounter {
          from {
            transform: rotateY(60deg) rotateZ(360deg);
          }
          to {
            transform: rotateY(60deg) rotateZ(0deg);
          }
        }
      `}</style>
    </div>
  );
};
