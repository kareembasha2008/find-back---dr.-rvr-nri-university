import React, { useState } from 'react';
import { Building2, MapPin, Clock, ShieldCheck, Check, Navigation, Sparkles } from 'lucide-react';

export interface CampusCheckpoint {
  id: string;
  name: string;
  shortName: string;
  role: string;
  locationDetails: string;
  timing: string;
  isoX: number; // percentage
  isoY: number; // percentage
  accentColor: string;
  recommendedFor: string;
}

export const CAMPUS_CHECKPOINTS: CampusCheckpoint[] = [
  {
    id: 'library',
    name: 'Central University Library Helpdesk',
    shortName: 'Central Library',
    role: 'Ground Floor Custody Desk',
    locationDetails: 'Library Block, Ground Floor near Entrance Gate',
    timing: '09:00 AM – 05:00 PM (Mon-Sat)',
    isoX: 48,
    isoY: 34,
    accentColor: '#6366f1',
    recommendedFor: 'Textbooks, Notebooks, Scientific Calculators, Laptops',
  },
  {
    id: 'maingate',
    name: 'Main Gate Security Post',
    shortName: 'Main Campus Gate',
    role: '24/7 Campus Security Officer',
    locationDetails: 'Agiripalli Highway Campus Entrance Guard Post',
    timing: '24 Hours / 7 Days Available',
    isoX: 20,
    isoY: 65,
    accentColor: '#10b981',
    recommendedFor: 'Wallets, Cash, Mobile Phones, Vehicle Keys & Helmets',
  },
  {
    id: 'admin_c',
    name: 'C Block Administrative Office',
    shortName: 'C Block Room 104',
    role: 'Student Affairs Custodian',
    locationDetails: 'C Block Academic Wing, Room 104 (First Floor)',
    timing: '09:30 AM – 04:30 PM',
    isoX: 75,
    isoY: 42,
    accentColor: '#f59e0b',
    recommendedFor: 'Student ID Cards, Government Documents, Certificates',
  },
  {
    id: 'canteen',
    name: 'Student Canteen Counter',
    shortName: 'Student Canteen',
    role: 'North Cashier Desk Custodian',
    locationDetails: 'Campus Dining Complex, North Counter',
    timing: '10:00 AM – 04:00 PM',
    isoX: 42,
    isoY: 80,
    accentColor: '#ec4899',
    recommendedFor: 'Water Bottles, Umbrellas, Earbuds, Backpacks',
  },
];

interface CampusMap3DProps {
  selectedCheckpointId?: string;
  onSelectCheckpoint?: (hubName: string) => void;
  className?: string;
}

export const CampusMap3D: React.FC<CampusMap3DProps> = ({
  selectedCheckpointId = 'library',
  onSelectCheckpoint,
  className = '',
}) => {
  const [activeId, setActiveId] = useState<string>(selectedCheckpointId);
  const activeCheckpoint = CAMPUS_CHECKPOINTS.find((c) => c.id === activeId) || CAMPUS_CHECKPOINTS[0];

  const handleSelect = (c: CampusCheckpoint) => {
    setActiveId(c.id);
    if (onSelectCheckpoint) {
      onSelectCheckpoint(c.name);
    }
  };

  return (
    <div className={`relative w-full rounded-3xl overflow-hidden bg-gradient-to-b from-[#0a0e1a] via-[#080c16] to-[#04060c] border border-slate-800 shadow-2xl p-6 ${className}`}>
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400">
            <Building2 className="w-3.5 h-3.5" />
            <span>Dr. RVR NRI University · Agiripalli Campus Checkpoints</span>
          </div>
          <h3 className="text-lg font-extrabold text-white mt-0.5 tracking-tight">
            3D Safe Return Campus Map
          </h3>
        </div>
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-semibold text-emerald-400 w-fit">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Physical ID Verification at All Desks</span>
        </span>
      </div>

      {/* 3D Isometric Campus Map Board */}
      <div
        className="relative w-full h-80 sm:h-96 rounded-2xl bg-slate-950/90 border border-indigo-500/20 overflow-hidden flex items-center justify-center select-none"
        style={{ perspective: '1000px' }}
      >
        {/* Isometric Grid Floor Plane */}
        <div
          className="absolute w-[120%] h-[120%] transition-transform duration-500"
          style={{
            transform: 'rotateX(55deg) rotateZ(-30deg)',
            transformStyle: 'preserve-3d',
            backgroundImage: `
              radial-gradient(circle at 50% 50%, rgba(99, 102, 241, 0.12) 0%, transparent 70%),
              linear-gradient(to right, rgba(99, 102, 241, 0.15) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(99, 102, 241, 0.15) 1px, transparent 1px)
            `,
            backgroundSize: '100% 100%, 32px 32px, 32px 32px',
          }}
        >
          {/* Main Highway / Campus Roadway Ribbons */}
          <div className="absolute top-[20%] left-0 right-0 h-4 bg-slate-800/60 transform rotate-12" />
          <div className="absolute top-0 bottom-0 left-[40%] w-6 bg-slate-800/80 transform -rotate-6" />

          {/* 3D Block Silhouettes (Agiripalli Campus Buildings) */}
          {/* A & B Block */}
          <div
            className="absolute top-[20%] left-[25%] w-24 h-16 rounded-lg bg-indigo-950/80 border border-indigo-500/30 flex items-center justify-center shadow-lg"
            style={{ transform: 'translateZ(18px)' }}
          >
            <span className="text-[10px] font-bold text-indigo-300">A & B Blocks</span>
          </div>

          {/* Central Library Block */}
          <div
            className="absolute top-[35%] left-[45%] w-28 h-20 rounded-xl bg-indigo-900/70 border-2 border-indigo-400/50 flex flex-col items-center justify-center shadow-2xl"
            style={{ transform: 'translateZ(26px)' }}
          >
            <span className="text-[10px] font-extrabold text-white">Central Library</span>
            <span className="text-[8px] text-indigo-200">Main Custody Desk</span>
          </div>

          {/* C Block Academic */}
          <div
            className="absolute top-[40%] left-[72%] w-26 h-18 rounded-lg bg-amber-950/70 border border-amber-500/40 flex items-center justify-center shadow-lg"
            style={{ transform: 'translateZ(20px)' }}
          >
            <span className="text-[10px] font-bold text-amber-300">C Block (Admin)</span>
          </div>

          {/* Student Canteen */}
          <div
            className="absolute top-[75%] left-[38%] w-26 h-16 rounded-lg bg-pink-950/70 border border-pink-500/40 flex items-center justify-center shadow-lg"
            style={{ transform: 'translateZ(14px)' }}
          >
            <span className="text-[10px] font-bold text-pink-300">Student Canteen</span>
          </div>

          {/* Main Gate Security Cabins */}
          <div
            className="absolute top-[60%] left-[16%] w-20 h-14 rounded-lg bg-emerald-950/70 border border-emerald-500/40 flex items-center justify-center shadow-lg"
            style={{ transform: 'translateZ(16px)' }}
          >
            <span className="text-[10px] font-bold text-emerald-300">Main Gate 24/7</span>
          </div>

          {/* Interactive Checkpoint Markers positioned in 3D isometric plane */}
          {CAMPUS_CHECKPOINTS.map((checkpoint) => {
            const isSelected = activeId === checkpoint.id;
            return (
              <div
                key={checkpoint.id}
                onClick={(e) => {
                  e.stopPropagation();
                  handleSelect(checkpoint);
                }}
                className="absolute z-30 cursor-pointer group"
                style={{
                  left: `${checkpoint.isoX}%`,
                  top: `${checkpoint.isoY}%`,
                  transform: 'translate(-50%, -50%) translateZ(40px)',
                }}
              >
                {/* 3D Pulsing Ground Ring */}
                <div
                  className="w-10 h-10 rounded-full border-2 border-dashed flex items-center justify-center animate-spin"
                  style={{
                    borderColor: checkpoint.accentColor,
                    animationDuration: '10s',
                  }}
                />

                {/* 3D Floating Beacon Pin */}
                <div
                  className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center shadow-lg transition-transform duration-300 ${
                    isSelected
                      ? 'scale-125 ring-4 ring-white/40'
                      : 'hover:scale-110'
                  }`}
                  style={{
                    backgroundColor: checkpoint.accentColor,
                    boxShadow: `0 0 20px ${checkpoint.accentColor}`,
                  }}
                >
                  <MapPin className="w-3.5 h-3.5 text-white" />
                </div>

                {/* Billboarded Label hovering upright against isometric tilt */}
                <div
                  className="absolute bottom-10 left-1/2 -translate-x-1/2 whitespace-nowrap pointer-events-none"
                  style={{
                    transform: 'rotateZ(30deg) rotateX(-55deg) translateZ(10px)',
                  }}
                >
                  <div
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold shadow-2xl border backdrop-blur-md transition-all ${
                      isSelected
                        ? 'bg-slate-900 text-white border-white scale-110'
                        : 'bg-slate-950/90 text-slate-300 border-slate-700'
                    }`}
                  >
                    <span>{checkpoint.shortName}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend Hint overlay on bottom left */}
        <div className="absolute bottom-3 left-3 z-20 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 backdrop-blur-md text-[11px] text-slate-400 flex items-center gap-2 pointer-events-none">
          <Navigation className="w-3 h-3 text-indigo-400" />
          <span>Click any 3D marker to inspect Safe Desk details</span>
        </div>
      </div>

      {/* Selected Checkpoint Detail Card */}
      <div className="mt-4 p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: activeCheckpoint.accentColor }}
            />
            <h4 className="text-sm font-bold text-white">
              {activeCheckpoint.name}
            </h4>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
              {activeCheckpoint.role}
            </span>
          </div>

          <p className="text-xs text-slate-400">
            {activeCheckpoint.locationDetails}
          </p>

          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300 pt-1">
            <div className="flex items-center gap-1 text-slate-400">
              <Clock className="w-3.5 h-3.5 text-indigo-400" />
              <span>{activeCheckpoint.timing}</span>
            </div>
            <div className="flex items-center gap-1 text-slate-400">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Best for: {activeCheckpoint.recommendedFor}</span>
            </div>
          </div>
        </div>

        <button
          onClick={() => onSelectCheckpoint && onSelectCheckpoint(activeCheckpoint.name)}
          className="px-4 py-2.5 rounded-xl font-bold text-xs text-white lovable-glow-btn shadow-md shrink-0 flex items-center justify-center gap-2 cursor-pointer"
        >
          <Check className="w-3.5 h-3.5" />
          <span>Choose This Desk</span>
        </button>
      </div>
    </div>
  );
};
