import React, { useState, useEffect } from 'react';
import { User, Item, ItemCategory, Match, ReportType } from '../types';
import { itemService } from '../services/itemService';
import { matchService } from '../services/matchService';
import { contactService } from '../services/contactService';
import { adminService } from '../services/adminService';
import { ItemCard } from '../components/ItemCard';
import { MatchModal } from '../components/MatchModal';
import { OwnershipVerifyModal } from '../components/OwnershipVerifyModal';
import { TiltCard3D } from '../components/3d/TiltCard3D';
import { NriCampusMap } from '../components/maps/NriCampusMap';
import { GoogleMapViewerModal } from '../components/maps/GoogleMapViewerModal';
import { NearbyReportsMap } from '../components/maps/NearbyReportsMap';
import {
  Search,
  Sparkles,
  Building2,
  ArrowRight,
  ShieldCheck,
  CheckCircle,
  X,
  Radio,
  Compass,
  MapPin,
  MessageSquare,
  Navigation,
  ExternalLink,
  Flag,
} from 'lucide-react';

interface DashboardPageProps {
  user: User;
  onNavigate: (path: string) => void;
  onOpenReportModal?: (type: 'lost' | 'found') => void;
}

const CATEGORIES: ItemCategory[] = [
  'ID Card',
  'Wallet',
  'Electronics',
  'Keys',
  'Books',
  'Bag',
  'Accessories',
  'Documents',
  'Other',
];

export const DashboardPage: React.FC<DashboardPageProps> = ({
  user,
  onNavigate,
}) => {
  const [selectedType, setSelectedType] = useState<ReportType | 'all'>('all');
  const [selectedCategory, setSelectedCategory] = useState<ItemCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);

  const [activeMatch, setActiveMatch] = useState<{
    match: Match;
    lostItem: Item;
    foundItem: Item;
  } | null>(null);
  const [showVerifyModal, setShowVerifyModal] = useState<{
    lostItem: Item;
    foundItem: Item;
    matchId?: string;
  } | null>(null);
  const [selectedItemDetail, setSelectedItemDetail] = useState<Item | null>(null);
  const [selectedMapViewerItem, setSelectedMapViewerItem] = useState<Item | null>(null);
  const [topMatch, setTopMatch] = useState<Match | null>(null);
  const [active3dTab, setActive3dTab] = useState<'none' | 'map' | 'nearby'>('nearby');
  const [contactNotice, setContactNotice] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await itemService.getPublicSafeItems(
        {
          type: selectedType,
          category: selectedCategory,
          search: searchQuery,
        },
        user.id
      );
      setItems(res.items);

      const userMatches = await matchService.getMatchesForUser(user.id);
      if (userMatches.length > 0) {
        setTopMatch(userMatches[0]);
      } else {
        setTopMatch(null);
      }
    } catch (e) {
      console.warn('Could not load university items:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedType, selectedCategory, searchQuery, user.id]);

  // Real-Time Feed Subscription: new reports appear live without manual page refresh
  useEffect(() => {
    const unsubscribe = itemService.subscribeToFeed((newItem) => {
      setItems((prev) => {
        if (prev.some((item) => item.id === newItem.id)) return prev;
        return [newItem, ...prev];
      });
    });

    return () => unsubscribe();
  }, []);

  const handleReviewMatch = async (match: Match) => {
    const lost = await itemService.getReportById(match.lost_item_id, user.id);
    const found = await itemService.getReportById(match.found_item_id, user.id);
    if (lost && found) {
      setActiveMatch({ match, lostItem: lost, foundItem: found });
    }
  };

  const [reportingAbuseItem, setReportingAbuseItem] = useState<Item | null>(null);
  const [abuseReason, setAbuseReason] = useState<'Fake listing' | 'Spam' | 'Wrong information' | 'Inappropriate content' | 'Other'>('Fake listing');
  const [abuseDetails, setAbuseDetails] = useState('');
  const [abuseNotice, setAbuseNotice] = useState<string | null>(null);

  const handleSubmitAbuse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportingAbuseItem) return;
    try {
      await adminService.submitAbuseReport(reportingAbuseItem.id, user.id, abuseReason, abuseDetails);
      setAbuseNotice('Abuse report submitted to university administration desk.');
      setTimeout(() => {
        setReportingAbuseItem(null);
        setAbuseNotice(null);
        setAbuseDetails('');
      }, 2000);
    } catch (err: any) {
      alert(err?.message || 'Failed to submit report.');
    }
  };

  const handleRequestContact = async (item: Item) => {
    try {
      await contactService.requestContact(
        item.id,
        item.user_id,
        user.id,
        `Hello, I would like to coordinate verification and handover for "${item.name}".`
      );
      setContactNotice('Contact request sent. You will be notified when approved.');
      setTimeout(() => setContactNotice(null), 4000);
    } catch (err: any) {
      setContactNotice(err.message || 'Could not send contact request.');
      setTimeout(() => setContactNotice(null), 4000);
    }
  };

  return (
    <div className="min-h-screen pb-20 md:pb-12 text-slate-100">
      {/* Top Welcome / Campus Banner */}
      <div className="border-b border-slate-800/80 pt-6 pb-8 px-4 sm:px-6 bg-[#080b14]/60 backdrop-blur-md">
        <div className="max-w-6xl mx-auto">
          {/* Institution Subtitle */}
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400 mb-1">
            <Building2 className="w-3.5 h-3.5" />
            <span>Dr. RVR NRI University · Agiripalli Campus</span>
          </div>

          {/* User's Real Greeting */}
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Hello, {user.full_name}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            {user.department} · {user.year} · Section {user.section} · Student ID: {user.student_id}
          </p>

          {/* Possible Match Alert Banner if user has an active match */}
          {topMatch && topMatch.status !== 'verified' && (
            <div className="mt-5 p-4 rounded-3xl bg-amber-500/10 border border-amber-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-in backdrop-blur-md">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-amber-300 uppercase tracking-wide">
                      Possible Match Detected
                    </span>
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-500/20 text-amber-300 tabular-nums border border-amber-500/30">
                      {topMatch.score}% Match
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Your reported item matches a campus discovery. Review match details and verify ownership.
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleReviewMatch(topMatch)}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl transition-all shadow-md shrink-0 cursor-pointer"
              >
                Review Match
              </button>
            </div>
          )}

          {/* Two Main Action Cards with 3D Tilt */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
            <TiltCard3D
              onClick={() => onNavigate('/lost')}
              maxTilt={7}
              scale={1.02}
              className="p-6 rounded-3xl bg-gradient-to-br from-rose-950/80 via-slate-900 to-slate-950 border border-rose-500/25 text-left transition-all duration-300 hover:border-rose-500/50 hover:shadow-xl hover:shadow-rose-950/40 cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400">
                    Campus Loss Report
                  </span>
                  <h2 className="text-lg sm:text-xl font-extrabold mt-0.5 tracking-tight text-white group-hover:text-rose-200 transition-colors">
                    I LOST SOMETHING
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Report missing items with Google Maps location, photo & private clue.
                  </p>
                </div>
                <div className="w-11 h-11 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 flex items-center justify-center shrink-0 ml-3">
                  <ArrowRight className="w-5 h-5" />
                </div>
              </div>
            </TiltCard3D>

            <TiltCard3D
              onClick={() => onNavigate('/found')}
              maxTilt={7}
              scale={1.02}
              className="p-6 rounded-3xl bg-gradient-to-br from-emerald-950/80 via-slate-900 to-slate-950 border border-emerald-500/25 text-left transition-all duration-300 hover:border-emerald-500/50 hover:shadow-xl hover:shadow-emerald-950/40 cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                    Campus Discovery Report
                  </span>
                  <h2 className="text-lg sm:text-xl font-extrabold mt-0.5 tracking-tight text-white group-hover:text-emerald-200 transition-colors">
                    I FOUND SOMETHING
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Post discovered belongings to return them safely to genuine owners.
                  </p>
                </div>
                <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 flex items-center justify-center shrink-0 ml-3">
                  <ArrowRight className="w-5 h-5" />
                </div>
              </div>
            </TiltCard3D>
          </div>

          {/* Interactive Campus Radar & Google Maps Navigation Tabs */}
          <div className="mt-6 pt-4 border-t border-slate-800/80">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5 uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                NRI University Campus Maps
              </span>
              <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800">
                <button
                  onClick={() => setActive3dTab(active3dTab === 'nearby' ? 'none' : 'nearby')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    active3dTab === 'nearby'
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <MapPin className="w-3.5 h-3.5" />
                  <span>Reports Near You</span>
                </button>
                <button
                  onClick={() => setActive3dTab(active3dTab === 'map' ? 'none' : 'map')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    active3dTab === 'map'
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5" />
                  <span>NRI Campus Map & Waypoints</span>
                </button>
              </div>
            </div>

            {active3dTab === 'nearby' && (
              <div className="animate-fade-in">
                <NearbyReportsMap onSelectItem={(item) => setSelectedItemDetail(item)} />
              </div>
            )}

            {active3dTab === 'map' && (
              <div className="animate-fade-in">
                <NriCampusMap onSelectCheckpoint={() => {}} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area: Feed with Filters & Search */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-8 space-y-6">
        {contactNotice && (
          <div className="p-3.5 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 text-xs font-semibold text-indigo-300 animate-fade-in flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{contactNotice}</span>
          </div>
        )}

        {/* Search Bar & Type Segmented Controls */}
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search live university reports (e.g. calculator, keys, id card, C Block)..."
              className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-sm text-white placeholder:text-slate-500 outline-none transition-all"
            />
          </div>

          {/* Type Filter Tabs: All, Lost Items, Found Items */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-950/80 border border-slate-800">
              <button
                onClick={() => setSelectedType('all')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  selectedType === 'all'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                All Campus Reports
              </button>
              <button
                onClick={() => setSelectedType('lost')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  selectedType === 'lost'
                    ? 'bg-rose-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-rose-400" />
                <span>Lost Items</span>
              </button>
              <button
                onClick={() => setSelectedType('found')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  selectedType === 'found'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>Found Items</span>
              </button>
            </div>

            {/* Category Segmented Scroll */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full scrollbar-none">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategory === 'all'
                    ? 'bg-indigo-600 text-white shadow-md font-bold'
                    : 'bg-slate-900/80 border border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                All Categories
              </button>
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-indigo-600 text-white shadow-md font-bold'
                      : 'bg-slate-900/80 border border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Section Title */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">
              {selectedType === 'lost'
                ? 'University Lost Items Feed'
                : selectedType === 'found'
                ? 'University Found Items Feed'
                : 'Recent Campus Reports'}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Live reports across Dr. RVR NRI University with zero exposure privacy shielding
            </p>
          </div>
          <button
            onClick={() => onNavigate('/search')}
            className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1 cursor-pointer"
          >
            <span>Advanced Search</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Live Items Grid */}
        {loading ? (
          <div className="py-20 text-center">
            <div className="w-8 h-8 rounded-full border-2 border-indigo-500/20 border-t-indigo-500 animate-spin mx-auto mb-3" />
            <p className="text-xs text-slate-400">Loading university reports from Supabase...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="lovable-card rounded-3xl p-12 text-center max-w-md mx-auto my-8">
            <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto mb-3">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-white text-base">No reports found</h3>
            <p className="text-xs text-slate-400 mt-1 mb-6">
              {searchQuery
                ? `No reports match "${searchQuery}". Try a different keyword.`
                : 'No items currently posted under this category. Be the first to report!'}
            </p>
            <div className="flex justify-center gap-2">
              <button
                onClick={() => onNavigate('/lost')}
                className="px-4 py-2 lovable-glow-btn text-white text-xs font-bold rounded-xl cursor-pointer"
              >
                Report Lost Item
              </button>
              <button
                onClick={() => onNavigate('/found')}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-xl cursor-pointer"
              >
                Report Found Item
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {items.map((item) => (
              <ItemCard
                key={item.id}
                item={item}
                isOwner={item.user_id === user.id}
                onClick={() => setSelectedItemDetail(item)}
                onViewLocation={(it) => setSelectedMapViewerItem(it)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Item Detail Modal */}
      {selectedItemDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in overflow-y-auto">
          <div className="relative w-full max-w-lg bg-[#0c101d] rounded-3xl shadow-2xl border border-slate-800 overflow-hidden my-8 text-white">
            <div className="relative h-56 bg-slate-950 flex items-center justify-center">
              {selectedItemDetail.photo_url ? (
                <img
                  src={selectedItemDetail.photo_url}
                  alt={selectedItemDetail.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-slate-500 text-center">
                  <p className="text-xs font-semibold uppercase">{selectedItemDetail.category}</p>
                </div>
              )}
              <button
                onClick={() => setSelectedItemDetail(null)}
                className="absolute top-4 right-4 p-2 rounded-full bg-black/60 hover:bg-black/90 text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="absolute bottom-3 left-4">
                <span
                  className={`text-xs font-bold px-2.5 py-1 rounded-lg text-white uppercase shadow-md ${
                    selectedItemDetail.type === 'lost' ? 'bg-rose-600' : 'bg-emerald-600'
                  }`}
                >
                  {selectedItemDetail.type === 'lost' ? 'Lost Item' : 'Found Item'}
                </span>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <div className="flex items-center gap-2 text-xs text-slate-400 font-medium mb-1">
                  <span>{selectedItemDetail.category}</span>
                  <span>·</span>
                  <span>{selectedItemDetail.building_name || selectedItemDetail.location}</span>
                </div>
                <h2 className="text-xl font-bold text-white">
                  {selectedItemDetail.name}
                </h2>
              </div>

              <div className="space-y-2 text-xs text-slate-300 bg-slate-950/80 p-4 rounded-2xl border border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-semibold">Incident Date:</span>
                  <span className="tabular-nums font-mono">{selectedItemDetail.date}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-semibold">Approx Time:</span>
                  <span>{selectedItemDetail.approx_time}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-semibold">Campus Location:</span>
                  <div className="flex items-center gap-1.5">
                    <span>{selectedItemDetail.building_name || selectedItemDetail.location}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedMapViewerItem(selectedItemDetail);
                      }}
                      className="text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 underline cursor-pointer ml-1"
                    >
                      <Navigation className="w-3 h-3" />
                      <span>View Map</span>
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-semibold">Status:</span>
                  <span className="font-bold text-indigo-400">{selectedItemDetail.status}</span>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Description
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {selectedItemDetail.description}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-800/80">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setSelectedItemDetail(null)}
                    className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
                  >
                    Close
                  </button>
                  {selectedItemDetail.user_id !== user.id && (
                    <button
                      type="button"
                      onClick={() => setReportingAbuseItem(selectedItemDetail)}
                      className="text-xs text-slate-500 hover:text-rose-400 flex items-center gap-1 transition-colors cursor-pointer"
                      title="Report inappropriate listing"
                    >
                      <Flag className="w-3.5 h-3.5" />
                      <span>Report Abuse</span>
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {/* Request Contact Button for other students */}
                  {selectedItemDetail.user_id !== user.id && (
                    <button
                      onClick={() => {
                        handleRequestContact(selectedItemDetail);
                      }}
                      className="px-3.5 py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Request Contact</span>
                    </button>
                  )}

                  {/* Verify Ownership Button */}
                  {selectedItemDetail.type === 'found' &&
                    selectedItemDetail.user_id !== user.id &&
                    selectedItemDetail.status !== 'Resolved' && (
                      <button
                        onClick={() => {
                          const item = selectedItemDetail;
                          setSelectedItemDetail(null);
                          setShowVerifyModal({
                            lostItem: item,
                            foundItem: item,
                          });
                        }}
                        className="px-4 py-2.5 lovable-glow-btn text-white text-xs font-bold rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer"
                      >
                        <ShieldCheck className="w-4 h-4" />
                        <span>This Is Mine · Verify</span>
                      </button>
                    )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Abuse Report Modal */}
      {reportingAbuseItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-sm bg-[#0c101d] rounded-3xl p-6 shadow-2xl border border-slate-800 space-y-4 text-white">
            <div className="flex items-center gap-2">
              <Flag className="w-5 h-5 text-rose-500" />
              <h3 className="font-bold text-base text-white">Report Listing</h3>
            </div>
            <p className="text-xs text-slate-400">
              Help Dr. RVR NRI University keep FIND BACK safe and authentic. What is wrong with "{reportingAbuseItem.name}"?
            </p>

            {abuseNotice && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 font-medium">
                {abuseNotice}
              </div>
            )}

            <form onSubmit={handleSubmitAbuse} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Reason
                </label>
                <select
                  value={abuseReason}
                  onChange={(e) => setAbuseReason(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="Fake listing">Fake listing</option>
                  <option value="Spam">Spam</option>
                  <option value="Wrong information">Wrong information</option>
                  <option value="Inappropriate content">Inappropriate content</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Details (Optional)
                </label>
                <textarea
                  rows={2}
                  value={abuseDetails}
                  onChange={(e) => setAbuseDetails(e.target.value)}
                  placeholder="Explain why this listing is invalid..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setReportingAbuseItem(null)}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-400 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl shadow-md transition-colors cursor-pointer"
                >
                  Submit Report
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Google Map Coordinates Viewer Modal */}
      {selectedMapViewerItem && (
        <GoogleMapViewerModal
          isOpen={Boolean(selectedMapViewerItem)}
          onClose={() => setSelectedMapViewerItem(null)}
          title={selectedMapViewerItem.name}
          locationName={selectedMapViewerItem.location}
          buildingName={selectedMapViewerItem.building_name}
          latitude={selectedMapViewerItem.latitude}
          longitude={selectedMapViewerItem.longitude}
        />
      )}

      {/* Match Review Modal */}
      {activeMatch && (
        <MatchModal
          onClose={() => setActiveMatch(null)}
          match={activeMatch.match}
          lostItem={activeMatch.lostItem}
          foundItem={activeMatch.foundItem}
          currentUserId={user.id}
          onStartVerification={() => {
            setShowVerifyModal({
              lostItem: activeMatch.lostItem,
              foundItem: activeMatch.foundItem,
              matchId: activeMatch.match.id,
            });
            setActiveMatch(null);
          }}
        />
      )}

      {/* Ownership Verification Modal */}
      {showVerifyModal && (
        <OwnershipVerifyModal
          onClose={() => setShowVerifyModal(null)}
          lostItem={showVerifyModal.lostItem}
          foundItem={showVerifyModal.foundItem}
          currentUserId={user.id}
          matchId={showVerifyModal.matchId}
          onSuccess={() => {
            setShowVerifyModal(null);
            loadData();
          }}
        />
      )}
    </div>
  );
};
