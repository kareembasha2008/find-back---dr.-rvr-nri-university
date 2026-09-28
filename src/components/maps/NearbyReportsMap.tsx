import React, { useEffect, useState } from 'react';
import { MapPin, Navigation, Building2, Layers, Compass, ExternalLink } from 'lucide-react';
import { Item } from '../../types';
import { itemService } from '../../services/itemService';
import { CAMPUS_CENTER } from '../../services/googleMapsService';

interface NearbyReportsMapProps {
  onSelectItem?: (item: Item) => void;
  className?: string;
}

export const NearbyReportsMap: React.FC<NearbyReportsMapProps> = ({
  onSelectItem,
  className = '',
}) => {
  const [nearbyItems, setNearbyItems] = useState<Item[]>([]);
  const [selectedPinItem, setSelectedPinItem] = useState<Item | null>(null);
  const [mapMode, setMapMode] = useState<'satellite' | 'roadmap'>('satellite');

  useEffect(() => {
    itemService.getNearbyItems(20).then((items) => {
      setNearbyItems(items);
    });
  }, []);

  const activeLat = selectedPinItem?.latitude || CAMPUS_CENTER.lat;
  const activeLng = selectedPinItem?.longitude || CAMPUS_CENTER.lng;
  const activeLabel = selectedPinItem?.name || 'NRI University Agiripalli';

  const embedUrl = `https://maps.google.com/maps?q=${activeLat},${activeLng}+(${encodeURIComponent(
    activeLabel + ' - NRI University Agiripalli'
  )})&t=${mapMode === 'satellite' ? 'k' : 'm'}&z=17&ie=UTF8&iwloc=&output=embed`;

  const externalMapUrl = `https://www.google.com/maps/search/?api=1&query=${activeLat},${activeLng}`;

  return (
    <div className={`lovable-card rounded-3xl p-5 sm:p-6 shadow-2xl relative overflow-hidden border border-slate-800 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-1">
            <Building2 className="w-3.5 h-3.5" />
            <span>NRI University · Agiripalli Campus GPS</span>
          </div>
          <h3 className="text-base font-bold text-white tracking-tight">
            Active Campus Lost & Found Map
          </h3>
          <p className="text-xs text-slate-400">
            Real satellite & street view of NRI Institute of Technology, Pothavarappadu, Agiripalli.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* Map view toggle */}
          <div className="flex items-center p-1 rounded-xl bg-slate-950/90 border border-slate-800 text-xs">
            <button
              type="button"
              onClick={() => setMapMode('satellite')}
              className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 transition-all cursor-pointer ${
                mapMode === 'satellite'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="w-3 h-3" />
              <span>Satellite</span>
            </button>
            <button
              type="button"
              onClick={() => setMapMode('roadmap')}
              className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 transition-all cursor-pointer ${
                mapMode === 'roadmap'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Compass className="w-3 h-3" />
              <span>Roadmap</span>
            </button>
          </div>

          <a
            href={externalMapUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-indigo-400 hover:text-white transition-all"
            title="Open in Google Maps App"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Map Viewport */}
      <div className="relative w-full h-[280px] sm:h-[340px] rounded-2xl bg-slate-950 overflow-hidden border border-slate-800 shadow-inner">
        <iframe
          title="NRI University Agiripalli Campus Map"
          src={embedUrl}
          className="w-full h-full border-0 filter contrast-[1.05]"
          loading="lazy"
        />

        {/* GPS Live Badge */}
        <div className="absolute top-3 left-3 z-10 pointer-events-none">
          <div className="px-3 py-1.5 rounded-xl bg-[#080b14]/85 border border-slate-700/80 backdrop-blur-md text-[11px] text-slate-200 flex items-center gap-2 shadow-lg">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-semibold text-white">Agiripalli Campus:</span>
            <span className="font-mono text-indigo-300">
              {activeLat.toFixed(4)}° N, {activeLng.toFixed(4)}° E
            </span>
          </div>
        </div>

        {/* Floating Selected Pin Info Card */}
        {selectedPinItem && (
          <div className="absolute bottom-3 left-3 right-3 sm:right-auto sm:max-w-sm p-3.5 bg-slate-900/95 border border-slate-800 rounded-2xl backdrop-blur-xl shadow-2xl animate-fade-in flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-1">
                <span
                  className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                    selectedPinItem.type === 'lost'
                      ? 'bg-rose-500/20 text-rose-300'
                      : 'bg-emerald-500/20 text-emerald-300'
                  }`}
                >
                  {selectedPinItem.type}
                </span>
                <span className="text-[11px] text-slate-400 truncate">
                  {selectedPinItem.building_name || selectedPinItem.location}
                </span>
              </div>
              <h4 className="text-xs font-bold text-white truncate">{selectedPinItem.name}</h4>
              <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                {selectedPinItem.description}
              </p>
            </div>
            <button
              onClick={() => {
                if (onSelectItem) onSelectItem(selectedPinItem);
                setSelectedPinItem(null);
              }}
              className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md shrink-0 cursor-pointer self-center"
            >
              Open
            </button>
          </div>
        )}
      </div>

      {/* Nearby Reports Chips Bar */}
      {nearbyItems.length > 0 && (
        <div className="mt-3.5 pt-3 border-t border-slate-800/80">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Pinpointed Reports on Campus ({nearbyItems.length})
            </span>
            <span className="text-[10px] text-indigo-400 font-semibold">Click to Center on Map</span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {nearbyItems.map((item) => {
              const isSelected = selectedPinItem?.id === item.id;
              const isLost = item.type === 'lost';
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedPinItem(item)}
                  className={`px-3 py-2 rounded-xl text-left border transition-all shrink-0 cursor-pointer flex items-center gap-2 ${
                    isSelected
                      ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-md'
                      : 'bg-slate-950/80 hover:bg-slate-900 border-slate-800 text-slate-300'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full shrink-0 ${
                      isLost ? 'bg-rose-500' : 'bg-emerald-500'
                    }`}
                  />
                  <div className="max-w-[140px] truncate text-xs font-medium">
                    {item.name}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
