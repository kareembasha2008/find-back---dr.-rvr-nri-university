import React, { useState } from 'react';
import {
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Building2,
  Lock,
  CheckCircle,
  Radio,
  Compass,
  Box,
  Layers,
  MapPin,
} from 'lucide-react';
import { Hero3DScene } from '../components/3d/Hero3DScene';
import { TiltCard3D } from '../components/3d/TiltCard3D';
import { NriCampusMap } from '../components/maps/NriCampusMap';

interface LandingPageProps {
  onNavigate: (path: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate }) => {
  const [activeVisualizer, setActiveVisualizer] = useState<'map' | 'beacon'>('map');

  return (
    <div className="min-h-screen flex flex-col text-slate-100 overflow-x-hidden relative">
      {/* 1. Cinematic Hero Section with Large Negative Space */}
      <section className="relative pt-20 pb-24 md:pt-32 md:pb-36 px-4 sm:px-6 max-w-5xl mx-auto w-full text-center flex flex-col items-center justify-center">
        {/* Institutional Trust Kicker */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900/80 border border-indigo-500/30 text-xs font-semibold text-indigo-300 mb-8 backdrop-blur-xl shadow-lg shadow-indigo-950/20 animate-fade-in">
          <Building2 className="w-3.5 h-3.5 text-indigo-400" />
          <span>Dr. RVR NRI University · Agiripalli Campus</span>
        </div>

        {/* Primary Wordmark & Iconic Tagline Hierarchy */}
        <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tight leading-none text-white uppercase select-none drop-shadow-lg">
          FIND BACK
        </h1>

        <p className="mt-4 sm:mt-5 text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight">
          <span className="bg-gradient-to-r from-blue-300 via-indigo-200 to-cyan-200 bg-clip-text text-transparent">
            Lost something? Find it back.
          </span>
        </p>

        {/* Concise Institutional Platform Summary */}
        <p className="mt-5 text-sm sm:text-base md:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
          The official lost and found intelligence platform for Dr. RVR NRI University. Real-time 3D matching radar, zero-exposure verification, and official safe custody checkpoints.
        </p>

        {/* Primary Hero Actions: [ I LOST SOMETHING ] [ I FOUND SOMETHING ] */}
        <div className="mt-10 sm:mt-12 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-5 w-full max-w-lg mx-auto">
          <button
            onClick={() => onNavigate('/lost')}
            className="w-full sm:w-1/2 py-4 px-6 hero-lost-btn text-white font-extrabold text-sm sm:text-base rounded-2xl flex items-center justify-center gap-2.5 cursor-pointer shadow-2xl tracking-wide group"
          >
            <span className="w-2.5 h-2.5 rounded-full bg-rose-400 animate-pulse" />
            <span>I LOST SOMETHING</span>
            <ArrowRight className="w-4 h-4 text-rose-300 group-hover:translate-x-1 transition-transform" />
          </button>

          <button
            onClick={() => onNavigate('/found')}
            className="w-full sm:w-1/2 py-4 px-6 hero-found-btn text-white font-extrabold text-sm sm:text-base rounded-2xl flex items-center justify-center gap-2.5 cursor-pointer shadow-2xl tracking-wide group"
          >
            <Sparkles className="w-4 h-4 text-emerald-300 group-hover:rotate-12 transition-transform" />
            <span>I FOUND SOMETHING</span>
            <ArrowRight className="w-4 h-4 text-emerald-300 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* Secondary Navigation Actions */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3 text-xs font-semibold text-slate-400">
          <button
            onClick={() => onNavigate('/login')}
            className="px-4 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-200 border border-slate-800 hover:border-slate-700 transition-all cursor-pointer backdrop-blur-md shadow-sm"
          >
            Student Login
          </button>
          <button
            onClick={() => onNavigate('/register')}
            className="px-4 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-200 border border-slate-800 hover:border-slate-700 transition-all cursor-pointer backdrop-blur-md shadow-sm"
          >
            Create Account
          </button>
          <button
            onClick={() => onNavigate('/how-it-works')}
            className="px-3.5 py-2 text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1 cursor-pointer"
          >
            <span>How It Works</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Zero-Exposure Privacy Guarantee Kicker */}
        <div className="mt-10 inline-flex items-center gap-2 text-xs font-semibold text-slate-300 bg-slate-950/70 border border-slate-800 px-4 py-2 rounded-xl backdrop-blur-md shadow-lg">
          <Lock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span>Zero Data Exposure · Student phone numbers and IDs shielded by OTP verification</span>
        </div>
      </section>

      {/* 2. Interactive 3D Campus Intelligence Hub (Beacon / Radar / Map) */}
      <section className="py-12 md:py-16 max-w-5xl mx-auto px-4 sm:px-6 w-full">
        <div className="lovable-card rounded-3xl p-5 sm:p-7 shadow-2xl relative overflow-hidden">
          {/* Header & Segmented Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-slate-800/80 pb-5">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs font-semibold text-indigo-400 mb-1.5">
                <Box className="w-3.5 h-3.5" />
                <span>3D Campus Visualizer</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                Agiripalli Campus 3D Workstation
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Interactive real-time 3D simulation of campus beacons, matching radar, and handover checkpoints.
              </p>
            </div>

            {/* Segmented Switcher */}
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-950/90 border border-slate-800 self-start sm:self-auto">
              <button
                onClick={() => setActiveVisualizer('map')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeVisualizer === 'map'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>NRI Campus Map</span>
              </button>

              <button
                onClick={() => setActiveVisualizer('beacon')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeVisualizer === 'beacon'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>3D Beacon</span>
              </button>
            </div>
          </div>

          {/* Visualizer Display Box */}
          <div className="relative rounded-2xl overflow-hidden bg-slate-950/50 border border-slate-800/80">
            {activeVisualizer === 'map' && (
              <div className="p-2 sm:p-4">
                <NriCampusMap onSelectCheckpoint={() => onNavigate('/register')} />
              </div>
            )}

            {activeVisualizer === 'beacon' && (
              <div className="relative w-full h-[400px] sm:h-[450px]">
                <Hero3DScene interactive={true} showArtifacts={true} />

                {/* Status Badges */}
                <div className="absolute top-4 right-4 z-20 pointer-events-none">
                  <span className="px-3 py-1 rounded-full bg-slate-900/90 border border-indigo-500/30 text-[10px] font-bold text-indigo-300 backdrop-blur-md flex items-center gap-1.5 shadow-md">
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                    <span>WebGL 3D · Move mouse to rotate artifacts</span>
                  </span>
                </div>

                <div className="absolute bottom-4 left-4 z-20 pointer-events-none">
                  <div className="px-3 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800 backdrop-blur-md text-[11px] text-slate-300">
                    <span className="font-semibold text-white">Campus 3D Beacon:</span> Agiripalli Coordinates Active
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 3. Feature Highlights Grid with Subtle Glassmorphic Tilt Cards */}
      <section className="py-14 md:py-20 max-w-6xl mx-auto px-4 sm:px-6 w-full flex-1">
        <div className="text-center max-w-xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs font-semibold text-indigo-400 mb-3">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Guaranteed Security</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Engineered for Campus Integrity
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-2">
            Built to safely connect lost items with genuine owners at Dr. RVR NRI University.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <TiltCard3D
            maxTilt={7}
            scale={1.03}
            className="lovable-card p-6 rounded-3xl flex flex-col justify-between hover:border-slate-700/80 transition-all cursor-pointer"
          >
            <div>
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mb-4">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-white text-base">University-Only Access</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Compulsory student registration with Gmail and phone code verification. Outside visitors cannot view or alter campus reports.
              </p>
            </div>
            <div className="mt-6 pt-3 border-t border-slate-800 text-[11px] font-semibold text-blue-400 flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5 text-blue-400" />
              <span>Verified student profiles</span>
            </div>
          </TiltCard3D>

          <TiltCard3D
            maxTilt={7}
            scale={1.03}
            className="lovable-card p-6 rounded-3xl flex flex-col justify-between hover:border-slate-700/80 transition-all cursor-pointer"
          >
            <div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-4">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-white text-base">Smart Match Scoring</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Instant multi-factor comparison based on item category, location, date, time, and keyword descriptions with automatic student alerts.
              </p>
            </div>
            <div className="mt-6 pt-3 border-t border-slate-800 text-[11px] font-semibold text-emerald-400 flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
              <span>Real-time match alerts</span>
            </div>
          </TiltCard3D>

          <TiltCard3D
            maxTilt={7}
            scale={1.03}
            className="lovable-card p-6 rounded-3xl flex flex-col justify-between hover:border-slate-700/80 transition-all cursor-pointer"
          >
            <div>
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mb-4">
                <Building2 className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-white text-base">Safe Campus Handover</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Coordinate item returns at designated university checkpoints (Main Gate Security, Central Library, or C Block Administration).
              </p>
            </div>
            <div className="mt-6 pt-3 border-t border-slate-800 text-[11px] font-semibold text-amber-400 flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5 text-amber-400" />
              <span>Verified physical custody</span>
            </div>
          </TiltCard3D>
        </div>
      </section>

      {/* 4. Footer */}
      <footer className="border-t border-slate-800/80 py-8 px-4 sm:px-6 bg-[#07090e]/80 backdrop-blur-md">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div>
            <span className="font-bold text-white">FIND BACK</span>
            <span className="mx-2">·</span>
            <span>Dr. RVR NRI University, Agiripalli</span>
          </div>

          <div className="flex items-center gap-6">
            <button
              onClick={() => onNavigate('/how-it-works')}
              className="hover:text-white transition-colors cursor-pointer"
            >
              How It Works
            </button>
            <button
              onClick={() => onNavigate('/login')}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Student Login
            </button>
            <button
              onClick={() => onNavigate('/admin')}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Campus Admin Desk
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};
