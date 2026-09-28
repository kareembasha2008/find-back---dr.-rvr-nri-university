import React, { useState, useEffect } from 'react';
import { User, Item, ItemCategory, CampusLocation, ReportType, ItemStatus } from '../types';
import { itemService } from '../services/itemService';
import { ItemCard } from '../components/ItemCard';
import { OwnershipVerifyModal } from '../components/OwnershipVerifyModal';
import { GoogleMapViewerModal } from '../components/maps/GoogleMapViewerModal';
import { Search, Filter, RotateCcw, ShieldCheck, MapPin, Tag, Calendar, X, ArrowUpDown } from 'lucide-react';

interface SearchPageProps {
  user: User;
  onNavigate: (path: string) => void;
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

const LOCATIONS: CampusLocation[] = [
  'A Block',
  'B Block',
  'C Block',
  'Library',
  'Canteen',
  'Hostel',
  'Ground',
  'Parking',
  'Bus Area',
  'Other',
];

const STATUSES: ItemStatus[] = [
  'Searching',
  'Possible Match',
  'Verification Required',
  'Resolved',
  'Closed',
];

export const SearchPage: React.FC<SearchPageProps> = ({ user, onNavigate }) => {
  const [searchQuery, setSearchQuery] = useState(() => sessionStorage.getItem('findback_search_query') || '');
  const [typeFilter, setTypeFilter] = useState<ReportType | 'all'>(
    () => (sessionStorage.getItem('findback_search_type') as any) || 'all'
  );
  const [categoryFilter, setCategoryFilter] = useState<ItemCategory | 'all'>(
    () => (sessionStorage.getItem('findback_search_cat') as any) || 'all'
  );
  const [locationFilter, setLocationFilter] = useState<CampusLocation | 'all'>(
    () => (sessionStorage.getItem('findback_search_loc') as any) || 'all'
  );
  const [statusFilter, setStatusFilter] = useState<ItemStatus | 'all'>(
    () => (sessionStorage.getItem('findback_search_status') as any) || 'all'
  );
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'yesterday' | 'week'>(
    () => (sessionStorage.getItem('findback_search_date') as any) || 'all'
  );
  const [sortFilter, setSortFilter] = useState<'newest' | 'oldest' | 'recently_updated'>(
    () => (sessionStorage.getItem('findback_search_sort') as any) || 'newest'
  );

  const [results, setResults] = useState<Item[]>([]);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selectedItemDetail, setSelectedItemDetail] = useState<Item | null>(null);
  const [mapViewerItem, setMapViewerItem] = useState<Item | null>(null);
  const [showVerifyModal, setShowVerifyModal] = useState<{
    lostItem: Item;
    foundItem: Item;
  } | null>(null);
  const PAGE_SIZE = 20;

  useEffect(() => {
    sessionStorage.setItem('findback_search_query', searchQuery);
    sessionStorage.setItem('findback_search_type', typeFilter);
    sessionStorage.setItem('findback_search_cat', categoryFilter);
    sessionStorage.setItem('findback_search_loc', locationFilter);
    sessionStorage.setItem('findback_search_status', statusFilter);
    sessionStorage.setItem('findback_search_date', dateFilter);
    sessionStorage.setItem('findback_search_sort', sortFilter);
  }, [searchQuery, typeFilter, categoryFilter, locationFilter, statusFilter, dateFilter, sortFilter]);

  const handleSearch = async (targetPage = page) => {
    setLoading(true);
    try {
      const res = await itemService.getPublicSafeItems({
        search: searchQuery,
        type: typeFilter,
        category: categoryFilter,
        location: locationFilter,
        status: statusFilter,
        dateFilter,
        sort: sortFilter,
        page: targetPage,
        pageSize: PAGE_SIZE,
      }, user.id);
      setResults(res.items);
      setTotalCount(res.total);
    } catch (err) {
      console.error('Search query error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
    handleSearch(1);
  }, [searchQuery, typeFilter, categoryFilter, locationFilter, statusFilter, dateFilter, sortFilter]);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    handleSearch(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleReset = () => {
    setSearchQuery('');
    setTypeFilter('all');
    setCategoryFilter('all');
    setLocationFilter('all');
    setStatusFilter('all');
    setDateFilter('all');
    setSortFilter('newest');
    setPage(1);
  };

  return (
    <div className="min-h-screen text-white pb-20 md:pb-12 pt-6 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">
              Campus Search
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Instant multi-attribute search across Dr. RVR NRI University lost & found reports
            </p>
          </div>

          <button
            onClick={handleReset}
            className="self-start sm:self-auto px-3.5 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-900/80 border border-slate-800 rounded-xl transition-colors flex items-center gap-1.5 shadow-md cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset All Filters</span>
          </button>
        </div>

        {/* Search Input Bar */}
        <div className="lovable-card p-4 rounded-3xl space-y-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by item name, keywords, or details (e.g. 'earbuds', 'fastrack', 'calculator')..."
              className="w-full pl-11 pr-4 py-3 rounded-2xl bg-slate-950/80 border border-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-sm text-white placeholder:text-slate-500 transition-all"
            />
          </div>

          {/* Filter Dropdowns Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-1">
            {/* Type */}
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Report Type
              </label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-xs font-medium text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="all">All Types</option>
                <option value="lost">Lost Only</option>
                <option value="found">Found Only</option>
              </select>
            </div>

            {/* Category */}
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Category
              </label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-xs font-medium text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="all">All Categories</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Location */}
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Location
              </label>
              <select
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-xs font-medium text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="all">All Campus Locations</option>
                {LOCATIONS.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-xs font-medium text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="all">All Statuses</option>
                {STATUSES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>

            {/* Date */}
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Date Range
              </label>
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-xs font-medium text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="yesterday">Yesterday</option>
                <option value="week">This Week</option>
              </select>
            </div>

            {/* Sort */}
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Sort By
              </label>
              <select
                value={sortFilter}
                onChange={(e) => setSortFilter(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-xs font-medium text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="recently_updated">Recently Updated</option>
              </select>
            </div>
          </div>
        </div>

        {/* Results Counter & Privacy badge */}
        <div className="flex items-center justify-between text-xs text-slate-400 px-1">
          <span className="font-semibold text-slate-200 tabular-nums">
            Showing {results.length} active {results.length === 1 ? 'report' : 'reports'}
          </span>
          <span className="flex items-center gap-1 font-medium text-indigo-400">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Student information protected</span>
          </span>
        </div>

        {/* Search Results Grid */}
        {results.length === 0 ? (
          <div className="lovable-card rounded-3xl p-12 text-center max-w-md mx-auto my-8">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto mb-3">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-white text-base">No search results</h3>
            <p className="text-xs text-slate-400 mt-1 mb-5">
              We couldn't find any campus items matching your criteria. Try widening your search filters or report an item.
            </p>
            <div className="flex justify-center gap-2">
              <button
                onClick={handleReset}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
              >
                Clear Filters
              </button>
              <button
                onClick={() => onNavigate('/lost')}
                className="px-4 py-2 lovable-glow-btn text-white text-xs font-bold rounded-xl transition-all shadow-md cursor-pointer"
              >
                Report Lost Item
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {results.map((item) => (
                <ItemCard
                  key={item.id}
                  item={item}
                  isOwner={item.user_id === user.id}
                  onClick={() => setSelectedItemDetail(item)}
                  onViewLocation={(itm) => setMapViewerItem(itm)}
                />
              ))}
            </div>

            {/* Pagination Controls */}
            {totalCount > PAGE_SIZE && (
              <div className="flex items-center justify-between lovable-card px-4 py-3 rounded-2xl">
                <button
                  disabled={page <= 1 || loading}
                  onClick={() => handlePageChange(page - 1)}
                  className="px-3 py-1.5 rounded-lg border border-slate-800 text-xs font-semibold text-slate-300 disabled:opacity-40 hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Previous
                </button>
                <span className="text-xs text-slate-400 font-medium">
                  Page {page} of {Math.ceil(totalCount / PAGE_SIZE)} ({totalCount} total items)
                </span>
                <button
                  disabled={page * PAGE_SIZE >= totalCount || loading}
                  onClick={() => handlePageChange(page + 1)}
                  className="px-3 py-1.5 rounded-lg border border-slate-800 text-xs font-semibold text-slate-300 disabled:opacity-40 hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Next
                </button>
              </div>
            )}
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
                  <span>{selectedItemDetail.location}</span>
                  {selectedItemDetail.building_name && (
                    <>
                      <span>·</span>
                      <span className="text-indigo-400">{selectedItemDetail.building_name}</span>
                    </>
                  )}
                </div>
                <h2 className="text-xl font-bold text-white">
                  {selectedItemDetail.name}
                </h2>
              </div>

              <div className="space-y-2 text-xs text-slate-300 bg-slate-950/80 p-4 rounded-2xl border border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-semibold">Date:</span>
                  <span className="tabular-nums font-mono">{selectedItemDetail.date}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-semibold">Approx Time:</span>
                  <span>{selectedItemDetail.approx_time}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-semibold">Campus Location:</span>
                  <span>{selectedItemDetail.location} {selectedItemDetail.building_name ? `(${selectedItemDetail.building_name})` : ''}</span>
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

              <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedItemDetail(null)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
                  >
                    Close
                  </button>
                  {selectedItemDetail.latitude && selectedItemDetail.longitude && (
                    <button
                      onClick={() => setMapViewerItem(selectedItemDetail)}
                      className="px-3.5 py-2 bg-slate-900 border border-indigo-500/40 hover:border-indigo-400 text-indigo-300 hover:text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <MapPin className="w-3.5 h-3.5 text-indigo-400" />
                      <span>View on Map</span>
                    </button>
                  )}
                </div>

                {selectedItemDetail.type === 'found' && selectedItemDetail.user_id !== user.id && selectedItemDetail.status !== 'Resolved' && (
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
                    <span>This Is Mine · Verify Ownership</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
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

      {/* Ownership Verification Modal */}
      {showVerifyModal && (
        <OwnershipVerifyModal
          onClose={() => setShowVerifyModal(null)}
          lostItem={showVerifyModal.lostItem}
          foundItem={showVerifyModal.foundItem}
          currentUserId={user.id}
          onSuccess={() => {
            setShowVerifyModal(null);
            handleSearch(page);
          }}
        />
      )}
    </div>
  );
};
