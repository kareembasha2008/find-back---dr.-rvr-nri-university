import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  MapPin,
  Search,
  CheckCircle2,
  Building2,
  Navigation,
  Info,
  Compass,
} from 'lucide-react';
import {
  googleMapsService,
  CAMPUS_CENTER,
  CAMPUS_HOTSPOTS,
  CampusWaypoint,
} from '../../services/googleMapsService';
import { CampusLocation } from '../../types';

interface GoogleMapPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialLat?: number | null;
  initialLng?: number | null;
  initialLocation?: string;
  onConfirm: (loc: {
    latitude: number;
    longitude: number;
    location: CampusLocation;
    buildingName: string;
  }) => void;
}

export const GoogleMapPickerModal: React.FC<GoogleMapPickerModalProps> = ({
  isOpen,
  onClose,
  initialLat,
  initialLng,
  initialLocation,
  onConfirm,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [hasGoogleMaps, setHasGoogleMaps] = useState(false);
  const [selectedLat, setSelectedLat] = useState<number>(initialLat || CAMPUS_CENTER.lat);
  const [selectedLng, setSelectedLng] = useState<number>(initialLng || CAMPUS_CENTER.lng);
  const [selectedLocation, setSelectedLocation] = useState<CampusLocation>('Library');
  const [buildingName, setBuildingName] = useState<string>(initialLocation || 'Central Library Helpdesk');
  const [searchQuery, setSearchQuery] = useState('');
  const [googleMapInstance, setGoogleMapInstance] = useState<any>(null);
  const [markerInstance, setMarkerInstance] = useState<any>(null);

  useEffect(() => {
    if (!isOpen) return;

    googleMapsService.loadGoogleMaps().then((loaded) => {
      setHasGoogleMaps(loaded);
      if (loaded && mapContainerRef.current && (window as any).google?.maps) {
        const center = { lat: selectedLat, lng: selectedLng };
        const map = new (window as any).google.maps.Map(mapContainerRef.current, {
          center,
          zoom: 17,
          mapTypeId: 'roadmap',
          styles: [
            { elementType: 'geometry', stylers: [{ color: '#0f172a' }] },
            { elementType: 'labels.text.stroke', stylers: [{ color: '#0f172a' }] },
            { elementType: 'labels.text.fill', stylers: [{ color: '#94a3b8' }] },
            { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#1e293b' }] },
            { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0284c7' }] },
          ],
        });

        const marker = new (window as any).google.maps.Marker({
          position: center,
          map,
          draggable: true,
          title: 'Drag to report location',
        });

        map.addListener('click', (e: any) => {
          const lat = e.latLng.lat();
          const lng = e.latLng.lng();
          marker.setPosition({ lat, lng });
          updateCoordinates(lat, lng);
        });

        marker.addListener('dragend', (e: any) => {
          const lat = e.latLng.lat();
          const lng = e.latLng.lng();
          updateCoordinates(lat, lng);
        });

        setGoogleMapInstance(map);
        setMarkerInstance(marker);
      }
    });
  }, [isOpen]);

  const updateCoordinates = (lat: number, lng: number) => {
    setSelectedLat(lat);
    setSelectedLng(lng);
    const closest = googleMapsService.findClosestWaypoint(lat, lng);
    setSelectedLocation(closest.category as CampusLocation);
    setBuildingName(closest.name);
  };

  const handleSelectHotspot = (spot: CampusWaypoint) => {
    setSelectedLat(spot.lat);
    setSelectedLng(spot.lng);
    setSelectedLocation(spot.category as CampusLocation);
    setBuildingName(spot.name);

    if (googleMapInstance && markerInstance) {
      const pos = { lat: spot.lat, lng: spot.lng };
      googleMapInstance.setCenter(pos);
      googleMapInstance.setZoom(18);
      markerInstance.setPosition(pos);
    }
  };

  const handleConfirm = () => {
    onConfirm({
      latitude: Number(selectedLat.toFixed(6)),
      longitude: Number(selectedLng.toFixed(6)),
      location: selectedLocation,
      buildingName: buildingName || 'Campus Ground',
    });
    onClose();
  };

  if (!isOpen) return null;

  const filteredHotspots = CAMPUS_HOTSPOTS.filter(
    (h) =>
      !searchQuery.trim() ||
      h.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      h.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      h.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-[#0c101d] rounded-3xl shadow-2xl border border-slate-800 text-white overflow-hidden my-4">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <MapPin className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                Select Location on Map
              </h2>
              <p className="text-xs text-slate-400">
                Dr. RVR NRI University · Agiripalli Campus
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Notice */}
        <div className="p-4 bg-slate-950/70 border-b border-slate-800 space-y-3">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search campus buildings, departments, or blocks..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:border-indigo-500 outline-none"
            />
          </div>

          {!hasGoogleMaps && (
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-indigo-950/40 border border-indigo-500/20 text-[11px] text-slate-300">
              <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
              <span>
                Using University GPS Geocache for Dr. RVR NRI University. Click any official building waypoint or hotspot below to pin the precise location coordinates.
              </span>
            </div>
          )}
        </div>

        {/* Map Viewport / Live NRI University Agiripalli Map */}
        <div className="relative w-full h-[220px] sm:h-[260px] bg-slate-950 overflow-hidden border-b border-slate-800">
          <iframe
            title="NRI University Location Picker"
            src={`https://maps.google.com/maps?q=${selectedLat},${selectedLng}+(${encodeURIComponent(
              buildingName + ' - NRI University Agiripalli'
            )})&t=k&z=18&ie=UTF8&iwloc=&output=embed`}
            className="w-full h-full border-0 filter contrast-[1.05]"
            loading="lazy"
          />

          <div className="absolute top-2 left-2 z-10 pointer-events-none">
            <div className="px-2.5 py-1 rounded-lg bg-[#080b14]/85 border border-slate-700/80 backdrop-blur-md text-[10px] text-slate-200 flex items-center gap-1.5 shadow">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-semibold text-white">NRI University Agiripalli:</span>
              <span className="font-mono text-indigo-300">
                {selectedLat.toFixed(4)}°, {selectedLng.toFixed(4)}°
              </span>
            </div>
          </div>
        </div>

        {/* Hotspots Quick Grid */}
        <div className="p-3 sm:p-4 bg-slate-950 max-h-[180px] overflow-y-auto">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {filteredHotspots.map((spot) => (
              <button
                key={spot.id}
                type="button"
                onClick={() => handleSelectHotspot(spot)}
                className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer ${
                  spot.name === buildingName
                    ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-md'
                    : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs">
                  <Building2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  <span className="truncate">{spot.category}</span>
                </div>
                <p className="text-[11px] text-slate-400 truncate mt-0.5">{spot.name}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Selected Location Summary & Confirm */}
        <div className="p-4 sm:p-6 bg-slate-900/60 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="w-full sm:w-auto">
            <span className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider">
              Selected Campus Location
            </span>
            <div className="flex items-center gap-2 mt-0.5">
              <MapPin className="w-4 h-4 text-rose-400 shrink-0" />
              <span className="text-sm font-bold text-white truncate max-w-sm">
                {buildingName}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono mt-0.5">
              Latitude: {selectedLat.toFixed(6)} | Longitude: {selectedLng.toFixed(6)}
            </p>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              className="px-5 py-2.5 lovable-glow-btn rounded-xl text-xs font-bold text-white transition-all shadow-md flex items-center gap-2 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Confirm Location</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
