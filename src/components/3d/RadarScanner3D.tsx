import React, { useState, useEffect } from 'react';
import { Sparkles, MapPin, Radio, ShieldCheck, Compass } from 'lucide-react';

interface RadarItem {
  id: string;
  name: string;
  category: string;
  location: string;
  type: 'lost' | 'found';
  score?: number;
  x: number; // -100 to 100
  y: number; // -100 to 100
}

interface RadarScanner3DProps {
  items?: RadarItem[];
  activeScore?: number;
  interactive?: boolean;
  onSelectItem?: (item: RadarItem) => void;
  className?: string;
}

export const RadarScanner3D: React.FC<RadarScanner3DProps> = ({
  items = [
    { id: '1', name: 'Student ID Card', category: 'ID Card', location: 'Central Library', type: 'found', score: 94, x: -35, y: -25 },
    { id: '2', name: 'Casio Scientific Calculator', category: 'Electronics', location: 'C Block Room 104', type: 'found', score: 86, x: 45, y: -40 },
    { id: '3', name: 'Hostel Room Keys & Ring', category: 'Keys', location: 'Main Gate Security', type: 'found', score: 78, x: -50, y: 35 },
    { id: '4', name: 'Noise Wireless Earbuds Case', category: 'Accessories', location: 'Student Canteen', type: 'found', score: 92, x: 30, y: 40 },
  ],
  activeScore = 94,
  interactive = true,
  onSelectItem,
  className = '',
}) => {
  const [selectedBlip, setSelectedBlip] = useState<RadarItem | null>(items[0] || null);
  const [isScanning, setIsScanning] = useState(true);

  return (
    <div
      className={`relative w-full overflow-hidden rounded-3xl p-6 bg-gradient-to-b from-[#0b0f19] via-[#090d16] to-[#060810] border border-indigo-500/20 shadow-2xl flex flex-col items-center select-none ${className}`}
      style={{ perspective: '1100px' }}
    >
      {/* Header Info */}
      <div className="w-full flex items-center justify-between mb-4 z-20">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
          <span className="text-xs font-bold text-indigo-300 uppercase tracking-widest flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-indigo-400" />
            3D Campus Match Radar
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-[10px] font-mono text-indigo-300">
            RAD: 350m · Agiripalli
          </span>
          <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[10px] font-bold text-emerald-400">
            {items.length} Matches Detected
          </span>
        </div>
      </div>

      {/* 3D Tilted Radar Dish Viewport */}
      <div
        className="relative w-72 h-72 sm:w-80 sm:h-80 my-4 flex items-center justify-center transition-transform duration-700"
        style={{
          transform: 'rotateX(58deg) rotateZ(0deg)',
          transformStyle: 'preserve-3d',
        }}
      >
        {/* Glow ambient background underneath */}
        <div className="absolute inset-0 rounded-full bg-indigo-600/15 filter blur-xl transform -translate-z-10" />

        {/* Concentric Radar Range Rings */}
        <div className="absolute inset-0 rounded-full border border-indigo-500/30 bg-slate-950/60 shadow-[inset_0_0_40px_rgba(79,70,229,0.2)]" />
        <div className="absolute inset-8 rounded-full border border-indigo-500/25 border-dashed" />
        <div className="absolute inset-16 rounded-full border border-indigo-500/35" />
        <div className="absolute inset-24 rounded-full border border-indigo-500/20" />

        {/* Crosshair coordinate axes */}
        <div className="absolute top-0 bottom-0 left-1/2 w-[1px] bg-indigo-500/25 -translate-x-1/2" />
        <div className="absolute left-0 right-0 top-1/2 h-[1px] bg-indigo-500/25 -translate-y-1/2" />

        {/* Radar Sweeper Cone */}
        {isScanning && (
          <div
            className="absolute inset-0 rounded-full origin-center pointer-events-none"
            style={{
              animation: 'radarSweep 4s linear infinite',
              background: 'conic-gradient(from 0deg, rgba(99, 102, 241, 0.45) 0deg, rgba(6, 182, 212, 0.25) 35deg, transparent 75deg)',
            }}
          />
        )}

        {/* Center Campus Hub Beacon */}
        <div className="relative z-10 w-5 h-5 rounded-full bg-indigo-500 border-2 border-white shadow-[0_0_15px_#6366f1] flex items-center justify-center">
          <div className="w-1.5 h-1.5 rounded-full bg-white" />
        </div>

        {/* 3D Blips (Detected Items with vertical projection sticks) */}
        {items.map((item) => {
          const isSelected = selectedBlip?.id === item.id;
          return (
            <div
              key={item.id}
              onClick={() => {
                setSelectedBlip(item);
                if (onSelectItem) onSelectItem(item);
              }}
              className="absolute z-20 cursor-pointer group"
              style={{
                left: `calc(50% + ${item.x}%)`,
                top: `calc(50% + ${item.y}%)`,
                transform: 'translate(-50%, -50%)',
              }}
            >
              {/* Ground projection marker */}
              <div
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  isSelected
                    ? 'bg-amber-400 shadow-[0_0_15px_#f59e0b] scale-125'
                    : 'bg-emerald-400 group-hover:scale-125 shadow-[0_0_10px_#10b981]'
                }`}
              />

              {/* Billboarded floating badge that resists tilt */}
              <div
                className="absolute bottom-5 left-1/2 -translate-x-1/2 pointer-events-none whitespace-nowrap opacity-90 group-hover:opacity-100 transition-opacity"
                style={{
                  transform: 'rotateX(-58deg) translateZ(20px)',
                  transformStyle: 'preserve-3d',
                }}
              >
                <div
                  className={`px-2 py-0.5 rounded-md text-[10px] font-bold shadow-lg border backdrop-blur-md flex items-center gap-1 ${
                    isSelected
                      ? 'bg-amber-500/20 text-amber-200 border-amber-500/40'
                      : 'bg-slate-900/90 text-white border-slate-700'
                  }`}
                >
                  <span>{item.name}</span>
                  {item.score && (
                    <span className="text-emerald-400 font-mono">
                      {item.score}%
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Blip Detail Card below radar */}
      {selectedBlip && (
        <div className="w-full mt-2 p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-between z-20 animate-fade-in backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-xs">
              <Sparkles className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-bold text-white line-clamp-1">
                  {selectedBlip.name}
                </h4>
                {selectedBlip.score && (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                    {selectedBlip.score}% Match
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                <span className="text-slate-300">{selectedBlip.category}</span>
                <span>·</span>
                <span className="flex items-center gap-1 text-slate-400">
                  <MapPin className="w-3 h-3 text-indigo-400" />
                  {selectedBlip.location}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onSelectItem && onSelectItem(selectedBlip)}
              className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
            >
              Inspect
            </button>
          </div>
        </div>
      )}

      {/* Embedded Animation CSS for Radar Sweep */}
      <style>{`
        @keyframes radarSweep {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
};
