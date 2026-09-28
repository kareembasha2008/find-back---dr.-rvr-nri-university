import React, { useState, useEffect, useRef } from 'react';
import { User, Item, ReportType, Match, ContactRequest } from '../types';
import { itemService } from '../services/itemService';
import { matchService } from '../services/matchService';
import { contactService, PermittedContactInfo } from '../services/contactService';
import { ItemCard } from '../components/ItemCard';
import { MatchModal } from '../components/MatchModal';
import { OwnershipVerifyModal } from '../components/OwnershipVerifyModal';
import { GoogleMapViewerModal } from '../components/maps/GoogleMapViewerModal';
import {
  FileText,
  Plus,
  Sparkles,
  CheckCircle,
  Trash2,
  MapPin,
  Calendar,
  Lock,
  ArrowRight,
  CheckCircle2,
  Search,
  ShieldCheck,
  Layers,
  ChevronLeft,
  ChevronRight,
  Filter,
  PhoneCall,
  Check,
  X,
  UserCheck,
} from 'lucide-react';

export type StatusFilterCategory = 'all' | 'Searching' | 'Possible Match' | 'Verification Required' | 'Resolved';

interface MyReportsPageProps {
  user: User;
  onNavigate: (path: string) => void;
}

export const MyReportsPage: React.FC<MyReportsPageProps> = ({ user, onNavigate }) => {
  const [activeTab, setActiveTab] = useState<ReportType>(() => {
    return (sessionStorage.getItem('findback_myreports_tab') as ReportType) || 'lost';
  });
  const [lostReports, setLostReports] = useState<Item[]>([]);
  const [foundReports, setFoundReports] = useState<Item[]>([]);
  const [selectedReport, setSelectedReport] = useState<Item | null>(null);
  const [mapViewerItem, setMapViewerItem] = useState<Item | null>(null);

  // Match / Verification Modals
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

  // Resolution modal state
  const [resolvingItem, setResolvingItem] = useState<Item | null>(null);
  const [resolutionNote, setResolutionNote] = useState('');

  // Contact Requests State
  const [contactRequests, setContactRequests] = useState<ContactRequest[]>([]);
  const [revealedContacts, setRevealedContacts] = useState<Record<string, PermittedContactInfo>>({});
  const [processingRequestId, setProcessingRequestId] = useState<string | null>(null);

  const [itemMatchesMap, setItemMatchesMap] = useState<Record<string, Match[]>>({});

  const loadReports = async () => {
    try {
      const res = await itemService.getMyReports(user.id);
      setLostReports(res.filter((i) => i.type === 'lost'));
      setFoundReports(res.filter((i) => i.type === 'found'));

      const userMatches = await matchService.getMatchesForUser(user.id);
      const map: Record<string, Match[]> = {};
      for (const m of userMatches) {
        if (!map[m.lost_item_id]) map[m.lost_item_id] = [];
        map[m.lost_item_id].push(m);
        if (!map[m.found_item_id]) map[m.found_item_id] = [];
        map[m.found_item_id].push(m);
      }
      setItemMatchesMap(map);

      // Load contact clearance requests
      const reqs = await contactService.getContactRequestsForUser(user.id);
      setContactRequests(reqs);
    } catch (e) {
      console.error('Error loading reports:', e);
    }
  };

  useEffect(() => {
    loadReports();
  }, [user.id]);

  const handleRespondContact = async (requestId: string, status: 'ACCEPTED' | 'DECLINED') => {
    setProcessingRequestId(requestId);
    try {
      await contactService.respondToContactRequest(requestId, status, user.id);
      await loadReports();
    } catch (err: any) {
      alert(err?.message || 'Failed to update contact request.');
    } finally {
      setProcessingRequestId(null);
    }
  };

  const handleRevealContact = async (requestId: string) => {
    try {
      const info = await contactService.getPermittedContact(requestId);
      setRevealedContacts((prev) => ({ ...prev, [requestId]: info }));
    } catch (err: any) {
      alert(err?.message || 'Failed to retrieve contact details.');
    }
  };

  const [statusFilter, setStatusFilter] = useState<StatusFilterCategory>(() => {
    return (sessionStorage.getItem('findback_myreports_status') as any) || 'all';
  });

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = () => {
    const el = scrollContainerRef.current;
    if (el) {
      setCanScrollLeft(el.scrollLeft > 6);
      setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 6);
    }
  };

  useEffect(() => {
    checkScroll();
    const el = scrollContainerRef.current;
    if (el) {
      el.addEventListener('scroll', checkScroll, { passive: true });
    }
    window.addEventListener('resize', checkScroll);
    return () => {
      if (el) {
        el.removeEventListener('scroll', checkScroll);
      }
      window.removeEventListener('resize', checkScroll);
    };
  }, [lostReports, foundReports]);

  const handleScroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = direction === 'left' ? -240 : 240;
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const handleTabChange = (tab: ReportType) => {
    setActiveTab(tab);
    sessionStorage.setItem('findback_myreports_tab', tab);
  };

  const handleStatusFilterChange = (status: StatusFilterCategory) => {
    setStatusFilter(status);
    sessionStorage.setItem('findback_myreports_status', status);
  };

  const currentList = activeTab === 'lost' ? lostReports : foundReports;

  // Calculate status counts for current tab
  const getStatusCount = (status: StatusFilterCategory) => {
    if (status === 'all') return currentList.length;
    return currentList.filter((i) => i.status === status).length;
  };

  const filteredList = currentList.filter((item) => {
    if (statusFilter === 'all') return true;
    return item.status === statusFilter;
  });

  const handleOpenDetail = async (item: Item) => {
    const full = await itemService.getReportById(item.id, user.id);
    setSelectedReport(full);
  };

  const handleCheckMatches = async (item: Item) => {
    const matches = await matchService.getMatchesForItem(item.id);
    if (matches.length > 0) {
      const top = matches[0];
      const lost = await itemService.getReportById(top.lost_item_id, user.id);
      const found = await itemService.getReportById(top.found_item_id, user.id);
      if (lost && found) {
        setActiveMatch({ match: top, lostItem: lost, foundItem: found });
      }
    }
  };

  const handleConfirmResolve = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolvingItem) return;
    try {
      await itemService.markResolved(
        resolvingItem.id,
        resolutionNote || 'Item safely recovered and returned.',
        user.id
      );
      setResolvingItem(null);
      setResolutionNote('');
      setSelectedReport(null);
      await loadReports();
    } catch (err: any) {
      alert(err?.message || 'Failed to update report status.');
    }
  };

  const handleDelete = async (itemId: string) => {
    if (window.confirm('Are you sure you want to delete this report?')) {
      await itemService.deleteReport(itemId, user.id);
      setSelectedReport(null);
      await loadReports();
    }
  };

  const filterPills: Array<{
    id: StatusFilterCategory;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    accentColor: string;
    activeBg: string;
    inactiveBadge: string;
  }> = [
    {
      id: 'all',
      label: 'All',
      icon: Layers,
      accentColor: 'text-slate-400',
      activeBg: 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30',
      inactiveBadge: 'bg-slate-800 text-slate-300',
    },
    {
      id: 'Searching',
      label: 'Searching',
      icon: Search,
      accentColor: 'text-sky-400',
      activeBg: 'bg-sky-600 text-white shadow-md shadow-sky-600/30',
      inactiveBadge: 'bg-sky-950/60 text-sky-300 border border-sky-800/60',
    },
    {
      id: 'Possible Match',
      label: 'Possible Match',
      icon: Sparkles,
      accentColor: 'text-amber-400',
      activeBg: 'bg-amber-600 text-white shadow-md shadow-amber-600/30',
      inactiveBadge: 'bg-amber-950/60 text-amber-300 border border-amber-800/60',
    },
    {
      id: 'Verification Required',
      label: 'Verification Required',
      icon: ShieldCheck,
      accentColor: 'text-purple-400',
      activeBg: 'bg-purple-600 text-white shadow-md shadow-purple-600/30',
      inactiveBadge: 'bg-purple-950/60 text-purple-300 border border-purple-800/60',
    },
    {
      id: 'Resolved',
      label: 'Resolved',
      icon: CheckCircle2,
      accentColor: 'text-emerald-400',
      activeBg: 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30',
      inactiveBadge: 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/60',
    },
  ];

  return (
    <div className="min-h-screen pb-20 md:pb-12 pt-6 px-4 sm:px-6 text-white">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header with Title and Quick Add */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">
              My Reports
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Manage your lost items and items you found on campus
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigate('/lost')}
              className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-md shadow-rose-600/30 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Report Lost</span>
            </button>
            <button
              onClick={() => onNavigate('/found')}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-md shadow-emerald-600/30 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Report Found</span>
            </button>
          </div>
        </div>

        {/* Top Controls: Tabs + Horizontal Scrollable Status Filter Pills */}
        <div className="space-y-3">
          {/* Tabs: Lost vs Found */}
          <div className="flex items-center gap-2 p-1 bg-slate-950/80 rounded-2xl border border-slate-800 shadow-md max-w-sm">
            <button
              onClick={() => {
                handleTabChange('lost');
                handleStatusFilterChange('all');
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'lost'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>Lost Items</span>
              <span className="px-1.5 py-0.2 rounded-md bg-white/20 text-[10px] tabular-nums font-bold">
                {lostReports.length}
              </span>
            </button>

            <button
              onClick={() => {
                handleTabChange('found');
                handleStatusFilterChange('all');
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'found'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>Found Items</span>
              <span className="px-1.5 py-0.2 rounded-md bg-white/20 text-[10px] tabular-nums font-bold">
                {foundReports.length}
              </span>
            </button>
          </div>

          {/* Horizontal Scrollable Filter Strip for Status Categories */}
          <div className="relative group">
            {/* Scroll Left Button */}
            {canScrollLeft && (
              <button
                type="button"
                onClick={() => handleScroll('left')}
                className="hidden sm:flex absolute left-0 top-1/2 -translate-y-1/2 -ml-3 z-20 w-8 h-8 rounded-full bg-slate-900 shadow-md border border-slate-700 items-center justify-center text-slate-300 hover:text-white transition-all hover:scale-105 active:scale-95 cursor-pointer"
                aria-label="Scroll filter strip left"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}

            {/* Scrollable Container */}
            <div
              ref={scrollContainerRef}
              onWheel={(e) => {
                if (Math.abs(e.deltaY) > Math.abs(e.deltaX) && scrollContainerRef.current) {
                  scrollContainerRef.current.scrollLeft += e.deltaY;
                }
              }}
              className="flex items-center gap-2 overflow-x-auto pb-2 pt-1 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-none scroll-smooth"
            >
              {filterPills.map((pill) => {
                const count = getStatusCount(pill.id);
                const isActive = statusFilter === pill.id;
                const Icon = pill.icon;

                return (
                  <button
                    key={pill.id}
                    onClick={() => handleStatusFilterChange(pill.id)}
                    className={`min-h-[44px] px-4 py-2.5 rounded-2xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2.5 shrink-0 active:scale-[0.98] cursor-pointer ${
                      isActive
                        ? pill.activeBg
                        : 'bg-slate-900/80 text-slate-300 border border-slate-800 hover:border-slate-700 hover:text-white shadow-xs'
                    }`}
                  >
                    <Icon
                      className={`w-3.5 h-3.5 shrink-0 ${
                        isActive ? 'text-white' : pill.accentColor
                      }`}
                    />
                    <span>{pill.label}</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full tabular-nums ${
                        isActive ? 'bg-white/20 text-white' : pill.inactiveBadge
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Right Edge Gradient Fade */}
            {canScrollRight && (
              <div className="pointer-events-none absolute right-0 top-0 bottom-2 w-8 bg-gradient-to-l from-[#07090e] to-transparent z-10 -mr-4 sm:mr-0" />
            )}

            {/* Scroll Right Button (Desktop/Tablet) */}
            {canScrollRight && (
              <button
                type="button"
                onClick={() => handleScroll('right')}
                className="hidden sm:flex absolute right-0 top-1/2 -translate-y-1/2 -mr-3 z-20 w-8 h-8 rounded-full bg-slate-900/90 shadow-md border border-slate-800 items-center justify-center text-slate-300 hover:text-white transition-all hover:scale-105 active:scale-95"
                aria-label="Scroll filter strip right"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Active Filter Helper Bar for Users with Many Reports */}
          {statusFilter !== 'all' && (
            <div className="flex items-center justify-between px-1 text-xs">
              <div className="flex items-center gap-2 text-slate-400 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                <span>
                  Filtering by <strong className="text-white font-bold">{statusFilter}</strong>
                </span>
                <span className="text-slate-600">•</span>
                <span className="text-slate-400">
                  Showing {filteredList.length} of {currentList.length} reports
                </span>
              </div>
              <button
                onClick={() => handleStatusFilterChange('all')}
                className="text-xs font-bold text-indigo-400 hover:text-indigo-300 underline underline-offset-2 transition-colors cursor-pointer"
              >
                Reset to All
              </button>
            </div>
          )}
        </div>

        {/* Content List */}
        {currentList.length === 0 ? (
          <div className="lovable-card rounded-3xl p-12 text-center max-w-md mx-auto my-8">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto mb-3">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-white text-base">
              No {activeTab} reports yet
            </h3>
            <p className="text-xs text-slate-400 mt-1 mb-5">
              {activeTab === 'lost'
                ? 'You have not reported any missing belongings on campus.'
                : 'You have not posted any discovered items on campus.'}
            </p>
            <button
              onClick={() => onNavigate(activeTab === 'lost' ? '/lost' : '/found')}
              className="px-5 py-2.5 lovable-glow-btn text-white text-xs font-bold rounded-xl transition-all shadow-md cursor-pointer"
            >
              Report {activeTab === 'lost' ? 'Lost Item' : 'Found Item'}
            </button>
          </div>
        ) : filteredList.length === 0 ? (
          <div className="lovable-card rounded-3xl p-10 text-center max-w-md mx-auto my-6">
            <div className="w-10 h-10 rounded-2xl bg-slate-900 border border-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <FileText className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-white text-base">
              No reports found with status "{statusFilter}"
            </h3>
            <p className="text-xs text-slate-400 mt-1 mb-4">
              None of your {activeTab} campus reports currently match this status filter.
            </p>
            <button
              onClick={() => handleStatusFilterChange('all')}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
            >
              Show All Statuses
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredList.map((item) => {
              const matches = itemMatchesMap[item.id] || [];
              const hasPossibleMatch = matches.length > 0;

              return (
                <div key={item.id} className="relative group">
                  <ItemCard
                    item={item}
                    isOwner={true}
                    onClick={() => handleOpenDetail(item)}
                    onViewLocation={(itm) => setMapViewerItem(itm)}
                  />

                  {/* Match alert ribbon if match exists */}
                  {hasPossibleMatch && item.status !== 'Resolved' && (
                    <div className="mt-2 flex items-center justify-between p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs">
                      <span className="font-bold text-amber-300 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                        <span>Possible Match ({matches[0].score}%)</span>
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCheckMatches(item);
                        }}
                        className="px-2.5 py-1 bg-amber-500 text-slate-950 font-extrabold text-[11px] rounded-lg hover:bg-amber-400 transition-colors cursor-pointer"
                      >
                        Review
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Report Detail Modal */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in overflow-y-auto">
          <div className="relative w-full max-w-lg bg-[#0c101d] rounded-3xl shadow-2xl border border-slate-800 overflow-hidden my-8 text-white">
            <div className="relative h-52 bg-slate-950 flex items-center justify-center border-b border-slate-800">
              {selectedReport.photo_url ? (
                <img
                  src={selectedReport.photo_url}
                  alt={selectedReport.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <p className="text-xs font-semibold text-slate-500">
                  {selectedReport.category}
                </p>
              )}
              <button
                onClick={() => setSelectedReport(null)}
                className="absolute top-4 right-4 p-2 rounded-full bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <div className="flex items-center gap-2 text-xs text-indigo-400 font-medium mb-1">
                  <span>{selectedReport.category}</span>
                  <span>·</span>
                  <span>{selectedReport.location}</span>
                </div>
                <h2 className="text-xl font-extrabold text-white">
                  {selectedReport.name}
                </h2>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs bg-slate-950/80 p-4 rounded-2xl border border-slate-800/80">
                <div>
                  <span className="font-semibold text-slate-400">Date:</span>
                  <p className="tabular-nums text-slate-200 mt-0.5">{selectedReport.date}</p>
                </div>
                <div>
                  <span className="font-semibold text-slate-400">Approx Time:</span>
                  <p className="text-slate-200 mt-0.5">{selectedReport.approx_time}</p>
                </div>
                <div>
                  <span className="font-semibold text-slate-400">Location:</span>
                  <p className="text-slate-200 mt-0.5">{selectedReport.location}</p>
                </div>
                <div>
                  <span className="font-semibold text-slate-400">Status:</span>
                  <p className="font-bold text-indigo-400 mt-0.5">{selectedReport.status}</p>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Description
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">
                  {selectedReport.description}
                </p>
              </div>

              {/* Private Clue (Owner can review what they entered) */}
              {selectedReport.private_verification_answer && (
                <div className="p-3.5 bg-indigo-500/10 border border-indigo-500/20 rounded-xl space-y-1 text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-indigo-300">
                    <Lock className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Your Secret Ownership Clue</span>
                  </div>
                  <p className="text-indigo-200">
                    {selectedReport.private_verification_answer}
                  </p>
                </div>
              )}

              {selectedReport.status === 'Resolved' && selectedReport.resolution_note && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-300 flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Resolved Note:</span>
                    <p className="mt-0.5">{selectedReport.resolution_note}</p>
                  </div>
                </div>
              )}

              {/* Contact Clearance Requests for this Item */}
              {(() => {
                const itemRequests = contactRequests.filter((cr) => cr.item_id === selectedReport.id);
                if (itemRequests.length === 0) return null;

                return (
                  <div className="space-y-2 pt-2 border-t border-slate-800">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300 uppercase tracking-wider">
                      <PhoneCall className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Contact Clearance Requests ({itemRequests.length})</span>
                    </div>
                    <div className="space-y-2">
                      {itemRequests.map((req) => {
                        const isOwner = req.owner_id === user.id;
                        const revealed = revealedContacts[req.id];

                        return (
                          <div key={req.id} className="p-3 bg-slate-950 rounded-2xl border border-slate-800 text-xs space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-slate-300">
                                {isOwner ? 'Request from Student' : 'Your Contact Request'}
                              </span>
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                                  req.status === 'ACCEPTED'
                                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                    : req.status === 'DECLINED'
                                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                }`}
                              >
                                {req.status}
                              </span>
                            </div>
                            {req.message && (
                              <p className="text-slate-400 italic">"{req.message}"</p>
                            )}

                            {/* Owner actions when PENDING */}
                            {isOwner && req.status === 'PENDING' && (
                              <div className="flex items-center gap-2 pt-1">
                                <button
                                  type="button"
                                  disabled={processingRequestId === req.id}
                                  onClick={() => handleRespondContact(req.id, 'ACCEPTED')}
                                  className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-1 text-[11px] cursor-pointer"
                                >
                                  <Check className="w-3 h-3" />
                                  <span>Grant Clearance</span>
                                </button>
                                <button
                                  type="button"
                                  disabled={processingRequestId === req.id}
                                  onClick={() => handleRespondContact(req.id, 'DECLINED')}
                                  className="flex-1 py-1.5 bg-slate-800 hover:bg-rose-900/50 text-slate-300 hover:text-rose-200 font-bold rounded-lg transition-colors flex items-center justify-center gap-1 text-[11px] cursor-pointer"
                                >
                                  <X className="w-3 h-3" />
                                  <span>Decline</span>
                                </button>
                              </div>
                            )}

                            {/* Once ACCEPTED, show view contact button */}
                            {req.status === 'ACCEPTED' && (
                              <div className="pt-1">
                                {revealed ? (
                                  <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/20 rounded-xl space-y-1 text-slate-200">
                                    <div className="font-bold text-indigo-300 flex items-center gap-1 text-xs">
                                      <UserCheck className="w-3.5 h-3.5 text-indigo-400" />
                                      <span>Permitted Contact Details</span>
                                    </div>
                                    {isOwner && revealed.requester ? (
                                      <>
                                        <p><strong className="text-slate-400">Name:</strong> {revealed.requester.full_name}</p>
                                        <p><strong className="text-slate-400">Phone:</strong> {revealed.requester.phone_number}</p>
                                        <p><strong className="text-slate-400">Email:</strong> {revealed.requester.university_email}</p>
                                        <p><strong className="text-slate-400">Dept:</strong> {revealed.requester.department}</p>
                                      </>
                                    ) : revealed.owner ? (
                                      <>
                                        <p><strong className="text-slate-400">Owner:</strong> {revealed.owner.full_name}</p>
                                        <p><strong className="text-slate-400">Phone:</strong> {revealed.owner.phone_number}</p>
                                        <p><strong className="text-slate-400">Email:</strong> {revealed.owner.university_email}</p>
                                        <p><strong className="text-slate-400">Dept:</strong> {revealed.owner.department}</p>
                                      </>
                                    ) : null}
                                  </div>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => handleRevealContact(req.id)}
                                    className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 text-[11px] cursor-pointer"
                                  >
                                    <PhoneCall className="w-3 h-3" />
                                    <span>View Authorized Contact Info</span>
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

              {/* Action Buttons */}
              <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-800/80">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleDelete(selectedReport.id)}
                    className="px-3.5 py-2 text-xs font-semibold text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Report</span>
                  </button>
                  {selectedReport.latitude && selectedReport.longitude && (
                    <button
                      type="button"
                      onClick={() => setMapViewerItem(selectedReport)}
                      className="px-3.5 py-2 bg-slate-900 border border-indigo-500/40 hover:border-indigo-400 text-indigo-300 hover:text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <MapPin className="w-3.5 h-3.5 text-indigo-400" />
                      <span>View Map</span>
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {selectedReport.status !== 'Resolved' && (
                    <button
                      type="button"
                      onClick={() => setResolvingItem(selectedReport)}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-md transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Mark Resolved</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setSelectedReport(null)}
                    className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-semibold rounded-xl hover:bg-slate-700 hover:text-white transition-colors cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Resolve Confirmation Modal */}
      {resolvingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-sm bg-[#0c101d] rounded-3xl p-6 shadow-2xl border border-slate-800 space-y-4 text-white">
            <h3 className="font-bold text-base text-white">
              Mark Item as Resolved
            </h3>
            <p className="text-xs text-slate-400">
              Has this item been safely returned to its owner? Add an optional resolution note.
            </p>

            <form onSubmit={handleConfirmResolve} className="space-y-4">
              <input
                type="text"
                value={resolutionNote}
                onChange={(e) => setResolutionNote(e.target.value)}
                placeholder="e.g. Picked up from Central Library Desk"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              />

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setResolvingItem(null)}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-400 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-500 shadow-md cursor-pointer"
                >
                  Confirm Resolution
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Match Modal */}
      {activeMatch && (
        <MatchModal
          match={activeMatch.match}
          lostItem={activeMatch.lostItem}
          foundItem={activeMatch.foundItem}
          currentUserId={user.id}
          onClose={() => setActiveMatch(null)}
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
          lostItem={showVerifyModal.lostItem}
          foundItem={showVerifyModal.foundItem}
          currentUserId={user.id}
          matchId={showVerifyModal.matchId}
          onClose={() => setShowVerifyModal(null)}
          onSuccess={() => {
            setShowVerifyModal(null);
            loadReports();
          }}
        />
      )}

      {/* Google Maps Location Viewer Modal */}
      {mapViewerItem && (
        <GoogleMapViewerModal
          isOpen={!!mapViewerItem}
          onClose={() => setMapViewerItem(null)}
          title={mapViewerItem.name}
          locationName={mapViewerItem.location}
          buildingName={mapViewerItem.building_name}
          latitude={mapViewerItem.latitude}
          longitude={mapViewerItem.longitude}
        />
      )}
    </div>
  );
};
