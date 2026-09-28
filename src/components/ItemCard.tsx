import React from 'react';
import { Item } from '../types';
import { MapPin, ShieldCheck, Tag, Navigation } from 'lucide-react';
import { TiltCard3D } from './3d/TiltCard3D';

interface ItemCardProps {
  item: Item;
  onClick?: () => void;
  onViewLocation?: (item: Item) => void;
  showStatus?: boolean;
  isOwner?: boolean;
}

export const ItemCard: React.FC<ItemCardProps> = ({
  item,
  onClick,
  onViewLocation,
  showStatus = true,
  isOwner = false,
}) => {
  const isLost = item.type === 'lost';

  return (
    <TiltCard3D
      onClick={onClick}
      maxTilt={6}
      scale={1.02}
      className="group relative lovable-card rounded-3xl overflow-hidden transition-all duration-300 hover:border-slate-700/90 hover:shadow-2xl cursor-pointer flex flex-col"
    >
      {/* Visual Image / Resilient Fallback */}
      <div className="relative w-full h-44 bg-slate-950/90 flex items-center justify-center overflow-hidden border-b border-slate-800/60">
        {item.photo_url ? (
          <img
            src={item.photo_url}
            alt={item.name}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-slate-500 p-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 mb-2">
              <Tag className="w-6 h-6 stroke-[1.5]" />
            </div>
            <span className="text-xs font-medium text-slate-400">{item.category}</span>
          </div>
        )}

        {/* Clean top indicator */}
        <div className="absolute top-3 left-3">
          <span
            className={`text-xs font-bold px-2.5 py-1 rounded-lg tracking-wide uppercase shadow-md ${
              isLost
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30 backdrop-blur-md'
                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 backdrop-blur-md'
            }`}
          >
            {isLost ? 'Lost Item' : 'Found Item'}
          </span>
        </div>

        {showStatus && item.status !== 'Searching' && (
          <div className="absolute top-3 right-3">
            <span
              className={`text-xs font-bold px-2.5 py-1 rounded-lg backdrop-blur-md border ${
                item.status === 'Resolved'
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                  : item.status === 'Possible Match'
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                  : 'bg-blue-500/20 text-blue-300 border-blue-500/30'
              }`}
            >
              {item.status}
            </span>
          </div>
        )}
      </div>

      {/* Card Content with Zero-Pill Metadata */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
        <div>
          {/* Metadata line with typographic separators */}
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5 font-medium">
            <div className="flex items-center gap-1.5 truncate">
              <span>{item.category}</span>
              <span aria-hidden="true" className="text-slate-600">·</span>
              <span className="flex items-center gap-1 text-slate-400 truncate">
                <MapPin className="w-3 h-3 text-indigo-400 shrink-0" />
                <span className="truncate">{item.building_name || item.location}</span>
              </span>
            </div>

            {onViewLocation && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onViewLocation(item);
                }}
                className="text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors ml-2 shrink-0 cursor-pointer"
                title="View location on Google Maps"
              >
                <Navigation className="w-3 h-3" />
                <span>Map</span>
              </button>
            )}
          </div>

          <h3 className="text-base font-bold text-white line-clamp-1 group-hover:text-indigo-400 transition-colors">
            {item.name}
          </h3>

          <p className="text-xs text-slate-400 line-clamp-2 mt-1.5 leading-relaxed">
            {item.description}
          </p>
        </div>

        {/* Card Footer: Privacy & Date */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-1 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="truncate max-w-[140px] text-slate-400">
              {isOwner ? 'Reported by you' : 'Student info protected'}
            </span>
          </div>
          <span className="tabular-nums text-slate-400 font-mono">{item.date}</span>
        </div>
      </div>
    </TiltCard3D>
  );
};
