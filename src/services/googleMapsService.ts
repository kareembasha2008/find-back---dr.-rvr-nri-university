// Google Maps Integration Service for Dr. RVR NRI University

export interface CampusWaypoint {
  id: string;
  name: string;
  category: string;
  lat: number;
  lng: number;
  description: string;
}

export const CAMPUS_CENTER = {
  lat: 16.6543,
  lng: 80.8123,
};

export const CAMPUS_HOTSPOTS: CampusWaypoint[] = [
  {
    id: 'main-gate',
    name: 'Main Entrance & Security Arch (Agiripalli Highway)',
    category: 'Security',
    lat: 16.6528,
    lng: 80.8125,
    description: 'Main campus security post (24/7 Custody for wallets, phones & keys)',
  },
  {
    id: 'library',
    name: 'Central University Library (Ground Floor)',
    category: 'Library',
    lat: 16.6536,
    lng: 80.8128,
    description: 'Safe collection desk for books, calculators, bags & laptops (09:00 AM - 05:00 PM)',
  },
  {
    id: 'cse-block',
    name: 'Computer Science & IT Block (CSE / AI & ML)',
    category: 'CSE Block',
    lat: 16.6542,
    lng: 80.8126,
    description: 'AI & Data Science Labs, IoT Research Center, Seminar Halls',
  },
  {
    id: 'a-block',
    name: 'Administrative & Principal Block (A-Block)',
    category: 'A Block',
    lat: 16.6538,
    lng: 80.8122,
    description: 'Principal office lobby, examination section, student affairs',
  },
  {
    id: 'mech-block',
    name: 'Mechanical & Civil Engineering Block (B-Block)',
    category: 'B Block',
    lat: 16.6546,
    lng: 80.8118,
    description: 'Workshop, CAD/CAM Labs, Civil Structures department',
  },
  {
    id: 'pharmacy',
    name: 'NRI College of Pharmacy Block',
    category: 'Pharmacy',
    lat: 16.6550,
    lng: 80.8129,
    description: 'Pharmacy campus block, healthcare lab & dispensary desk',
  },
  {
    id: 'canteen',
    name: 'Student Canteen & Central Food Court',
    category: 'Canteen',
    lat: 16.6532,
    lng: 80.8120,
    description: 'Student dining hall, refreshment counter & seating pavilion',
  },
  {
    id: 'sports',
    name: 'Campus Sports Arena & Cricket Field',
    category: 'Ground',
    lat: 16.6548,
    lng: 80.8135,
    description: 'Cricket grounds, basketball court, outdoor athletics area',
  },
  {
    id: 'bus-bay',
    name: 'University Bus Bay & Parking Complex',
    category: 'Parking',
    lat: 16.6525,
    lng: 80.8120,
    description: 'University bus parking terminal & student 2-wheeler lots',
  },
  {
    id: 'hostel',
    name: 'NRI University Student Hostels',
    category: 'Hostel',
    lat: 16.6555,
    lng: 80.8115,
    description: 'Boys & girls residential hostel lobbies, warden security desk',
  },
];

let googleMapsScriptPromise: Promise<boolean> | null = null;

export const googleMapsService = {
  getApiKey(): string {
    return import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
  },

  isKeyConfigured(): boolean {
    const key = this.getApiKey();
    return Boolean(key && key !== 'YOUR_GOOGLE_MAPS_API_KEY' && key.length > 10);
  },

  /**
   * Dynamically load Google Maps script tag if API key is provided
   */
  loadGoogleMaps(): Promise<boolean> {
    if (typeof window !== 'undefined' && (window as any).google?.maps) {
      return Promise.resolve(true);
    }

    if (googleMapsScriptPromise) {
      return googleMapsScriptPromise;
    }

    const apiKey = this.getApiKey();
    if (!this.isKeyConfigured()) {
      return Promise.resolve(false);
    }

    googleMapsScriptPromise = new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = () => resolve(true);
      script.onerror = () => {
        console.warn('Failed to load Google Maps script. Using university coordinate engine.');
        resolve(false);
      };
      document.head.appendChild(script);
    });

    return googleMapsScriptPromise;
  },

  /**
   * Find closest campus waypoint from GPS coordinates
   */
  findClosestWaypoint(lat: number, lng: number): CampusWaypoint {
    let closest = CAMPUS_HOTSPOTS[0];
    let minDistance = Infinity;

    for (const spot of CAMPUS_HOTSPOTS) {
      const dLat = spot.lat - lat;
      const dLng = spot.lng - lng;
      const dist = Math.sqrt(dLat * dLat + dLng * dLng);
      if (dist < minDistance) {
        minDistance = dist;
        closest = spot;
      }
    }

    return closest;
  },
};
