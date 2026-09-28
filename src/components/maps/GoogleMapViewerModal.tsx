import React, { useEffect, useRef, useState } from 'react';
import { X, MapPin, Building2, ExternalLink, Navigation } from 'lucide-react';
import { googleMapsService } from '../../services/googleMapsService';

interface GoogleMapViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  locationName: string;
  buildingName?: string;
  latitude?: number | null;
  longitude?: number | null;
}

export const GoogleMapViewerModal: React.FC<GoogleMapViewerModalProps> = ({
  isOpen,
  onClose,
  title,
  locationName,
  buildingName,
  latitude,
  longitude,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [hasGoogleMaps, setHasGoogleMaps] = useState(false);

  const lat = latitude || 16.6534;
  const lng = longitude || 80.8122;

  useEffect(() => {
    if (!isOpen) return;

    googleMapsService.loadGoogleMaps().then((loaded) => {
      setHasGoogleMaps(loaded);
      if (loaded && mapContainerRef.current && (window as any).google?.maps) {
        const center = { lat, lng };
        const map = new (window as any).google.maps.Map(mapContainerRef.current, {
          center,
          zoom: 18,
          mapTypeId: 'roadmap',
          styles: [
            { elementType: 'geometry', stylers: [{ color: '#0f172a' }] },
            { elementType: 'labels.text.stroke', stylers: [{ color: '#0f172a' }] },
            { elementType: 'labels.text.fill', stylers: [{ color: '#94a3b8' }] },
            { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#1e293b' }] },
            { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0284c7' }] },
          ],
        });

        new (window as any).google.maps.Marker({
          position: center,
          map,
          title: buildingName || locationName,
        });
      }
    });
  }, [isOpen, lat, lng, buildingName, locationName]);

  if (!isOpen) return null;

  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-xl bg-[#0c101d] rounded-3xl shadow-2xl border border-slate-800 text-white overflow-hidden my-4">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center">
              <MapPin className="w-5 h-5 text-rose-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Reported Campus Location
              </h2>
              <p className="text-[11px] text-slate-400 truncate max-w-xs">{title}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Map Viewport with Live NRI University Embed */}
        <div className="relative w-full h-[280px] sm:h-[320px] bg-slate-950 overflow-hidden">
          <iframe
            title={buildingName || locationName}
            src={`https://maps.google.com/maps?q=${lat},${lng}+(${encodeURIComponent(
              (buildingName || locationName) + ' - NRI University Agiripalli'
            )})&t=k&z=18&ie=UTF8&iwloc=&output=embed`}
            className="w-full h-full border-0 filter contrast-[1.05]"
            loading="lazy"
          />
        </div>

        {/* Footer Details */}
        <div className="p-4 sm:p-5 bg-slate-900/80 border-t border-slate-800 flex items-center justify-between gap-3">
          <div>
            <div className="text-xs font-bold text-white flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-indigo-400" />
              <span>{buildingName || locationName}</span>
            </div>
            <p className="text-[10px] text-slate-400 font-mono mt-0.5">
              Lat: {lat.toFixed(6)} | Lng: {lng.toFixed(6)}
            </p>
          </div>

          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <span>Google Maps</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
};
