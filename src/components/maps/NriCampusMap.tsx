import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Building2,
  Navigation,
  Compass,
  ExternalLink,
  Layers,
  Search,
  CheckCircle2,
  Clock,
  ShieldCheck,
  AlertCircle,
  Eye,
  Radio,
} from 'lucide-react';
import {
  CAMPUS_CENTER,
  CAMPUS_HOTSPOTS,
  CampusWaypoint,
} from '../../services/googleMapsService';
import { Item } from '../../types';
import { itemService } from '../../services/itemService';

interface NriCampusMapProps {
  selectedCheckpointId?: string;
  onSelectCheckpoint?: (checkpointName: string) => void;
  className?: string;
  showReportsList?: boolean;
}

export const NriCampusMap: React.FC<NriCampusMapProps> = ({
  selectedCheckpointId = 'library',
  onSelectCheckpoint,
  className = '',
  showReportsList = true,
}) => {
  const [selectedSpot, setSelectedSpot] = useState<CampusWaypoint>(() => {
    return (
      CAMPUS_HOTSPOTS.find((s) => s.id === selectedCheckpointId) ||
      CAMPUS_HOTSPOTS[0]
    );
  });
  const [mapMode, setMapMode] = useState<'satellite' | 'roadmap'>('satellite');
  const [searchQuery, setSearchQuery] = useState('');
  const [nearbyItems, setNearbyItems] = useState<Item[]>([]);
  const [selectedItemPin, setSelectedItemPin] = useState<Item | null>(null);

  useEffect(() => {
    itemService.getNearbyItems(20).then((items) => {
      setNearbyItems(items);
    });
  }, []);

  useEffect(() => {
    if (selectedCheckpointId) {
      const found = CAMPUS_HOTSPOTS.find((s) => s.id === selectedCheckpointId);
      if (found) setSelectedSpot(found);
    }
  }, [selectedCheckpointId]);

  const filteredHotspots = CAMPUS_HOTSPOTS.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSpotClick = (spot: CampusWaypoint) => {
    setSelectedSpot(spot);
    setSelectedItemPin(null);
    if (onSelectCheckpoint) {
      onSelectCheckpoint(spot.name);
    }
  };

  // Google Maps real satellite/roadmap embed for NRI Institute of Technology, Agiripalli
  const embedUrl = `https://maps.google.com/maps?q=${selectedSpot.lat},${selectedSpot.lng}+(${encodeURIComponent(
    selectedSpot.name + ' - NRI University Agiripalli'
  )})&t=${mapMode === 'satellite' ? 'k' : 'm'}&z=18&ie=UTF8&iwloc=&output=embed`;

  const externalMapUrl = `https://www.google.com/maps/search/?api=1&query=${selectedSpot.lat},${selectedSpot.lng}`;

  return (
    <div
      className={`lovable-card rounded-3xl p-5 sm:p-7 shadow-2xl border border-slate-800 text-white relative overflow-hidden ${className}`}
    >
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-2">
            <Building2 className="w-3.5 h-3.5" />
            <span>NRI University · Agiripalli Campus Map</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
            Realistic Campus Locator & Checkpoints
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            NRI Institute of Technology, Pothavarappadu, Agiripalli (AP) · Real coordinates & official custody desks.
          </p>
        </div>

        {/* View Switcher: Satellite vs Roadmap & External Link */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="flex items-center p-1 rounded-xl bg-slate-950/90 border border-slate-800 text-xs">
            <button
              type="button"
              onClick={() => setMapMode('satellite')}
              className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                mapMode === 'satellite'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Satellite</span>
            </button>
            <button
              type="button"
              onClick={() => setMapMode('roadmap')}
              className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                mapMode === 'roadmap'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Roadmap</span>
            </button>
          </div>

          <a
            href={externalMapUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-indigo-400 hover:text-white transition-all cursor-pointer"
            title="Open in Google Maps"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>

      {/* Main Grid: Interactive Map + Landmark Selector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column: Real Google Maps Viewport */}
        <div className="lg:col-span-8 flex flex-col gap-3">
          <div className="relative w-full h-[340px] sm:h-[420px] rounded-2xl overflow-hidden border border-slate-800/90 bg-slate-950 shadow-inner">
            <iframe
              title="NRI University Agiripalli Campus Map"
              src={embedUrl}
              className="w-full h-full border-0 filter contrast-[1.05]"
              loading="lazy"
              allowFullScreen
            />

            {/* GPS Overlay HUD */}
            <div className="absolute top-3 left-3 z-10 pointer-events-none">
              <div className="px-3 py-1.5 rounded-xl bg-[#080b14]/85 border border-slate-700/80 backdrop-blur-md text-[11px] text-slate-200 flex items-center gap-2 shadow-lg">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                <span className="font-semibold text-white">Live NRI Campus GPS:</span>
                <span className="font-mono text-indigo-300">
                  {selectedSpot.lat.toFixed(4)}° N, {selectedSpot.lng.toFixed(4)}° E
                </span>
              </div>
            </div>

            {/* Selected Spot Details Badge */}
            <div className="absolute bottom-3 left-3 right-3 z-10 pointer-events-none">
              <div className="p-3 rounded-xl bg-[#080b14]/90 border border-slate-700/80 backdrop-blur-md flex items-center justify-between gap-3 shadow-xl">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center shrink-0">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-white truncate">
                      {selectedSpot.name}
                    </h4>
                    <p className="text-[11px] text-slate-400 truncate">
                      {selectedSpot.description}
                    </p>
                  </div>
                </div>

                <a
                  href={externalMapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="pointer-events-auto px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold transition-all shadow shrink-0 flex items-center gap-1.5"
                >
                  <Navigation className="w-3 h-3" />
                  <span>Navigate</span>
                </a>
              </div>
            </div>
          </div>

          {/* Safe Handover Protocols Footer info */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 flex items-center gap-2.5 text-xs">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <div>
                <div className="font-bold text-white">4 Verified Desks</div>
                <div className="text-[10px] text-slate-400">Official university custody</div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 flex items-center gap-2.5 text-xs">
              <Clock className="w-4 h-4 text-amber-400 shrink-0" />
              <div>
                <div className="font-bold text-white">24/7 Security Gate</div>
                <div className="text-[10px] text-slate-400">Night & weekend turn-in</div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 flex items-center gap-2.5 text-xs">
              <Building2 className="w-4 h-4 text-indigo-400 shrink-0" />
              <div>
                <div className="font-bold text-white">Agiripalli Campus</div>
                <div className="text-[10px] text-slate-400">Eluru / Krishna District, AP</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Campus Landmarks & Checkpoints Explorer */}
        <div className="lg:col-span-4 flex flex-col gap-3">
          <div className="flex items-center justify-between mb-0.5">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Campus Waypoints ({filteredHotspots.length})
            </span>
            <span className="text-[10px] text-indigo-400 font-semibold">Click to Pin</span>
          </div>

          {/* Search Landmarks */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search library, canteen, block..."
              className="w-full pl-8.5 pr-3 py-2 bg-slate-950/90 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:border-indigo-500 outline-none transition-all"
            />
          </div>

          {/* Landmark List */}
          <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
            {filteredHotspots.map((spot) => {
              const isSelected = selectedSpot.id === spot.id;
              return (
                <button
                  key={spot.id}
                  type="button"
                  onClick={() => handleSpotClick(spot)}
                  className={`w-full p-2.5 rounded-xl text-left border transition-all cursor-pointer flex items-center justify-between gap-2.5 ${
                    isSelected
                      ? 'bg-indigo-600/20 border-indigo-500/60 shadow-md ring-1 ring-indigo-500/30'
                      : 'bg-slate-950/60 hover:bg-slate-900/80 border-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                        isSelected
                          ? 'bg-indigo-500 text-white'
                          : 'bg-slate-900 border border-slate-800 text-slate-400'
                      }`}
                    >
                      <MapPin className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-white truncate">
                        {spot.name}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate">
                        {spot.category}
                      </div>
                    </div>
                  </div>

                  {isSelected && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Active Reports Pin Tracker (Realistic alternative to 3D Radar) */}
      {showReportsList && nearbyItems.length > 0 && (
        <div className="mt-6 pt-5 border-t border-slate-800/80">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Active Reports at NRI University Agiripalli ({nearbyItems.length})
              </h3>
            </div>
            <span className="text-[11px] text-slate-400">Live Campus Feed</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
            {nearbyItems.slice(0, 6).map((item) => {
              const isLost = item.type === 'lost';
              return (
                <div
                  key={item.id}
                  onClick={() => {
                    setSelectedItemPin(item);
                    if (item.latitude && item.longitude) {
                      setSelectedSpot({
                        id: item.id,
                        name: item.name + ` (${item.location})`,
                        category: item.category,
                        lat: item.latitude,
                        lng: item.longitude,
                        description: `Reported on ${item.date} near ${item.building_name || item.location}`,
                      });
                    }
                  }}
                  className="p-3 rounded-xl bg-slate-950/70 hover:bg-slate-900 border border-slate-800 hover:border-indigo-500/50 transition-all cursor-pointer flex flex-col justify-between gap-2 group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        isLost
                          ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      }`}
                    >
                      {item.type}
                    </span>
                    <span className="text-[10px] text-slate-500">{item.date}</span>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-white group-hover:text-indigo-300 truncate">
                      {item.name}
                    </h4>
                    <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5 truncate">
                      <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                      <span>{item.building_name || item.location}</span>
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
