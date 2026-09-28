import React, { useState, useEffect } from 'react';
import { adminService, ItemReportRecord, AuditLogRecord } from '../services/adminService';
import { configService } from '../services/configService';
import { Item } from '../types';
import { supabase } from '../lib/supabase';
import {
  ShieldAlert,
  Building2,
  Trash2,
  CheckCircle,
  Lock,
  LogOut,
  ArrowLeft,
  Settings,
  AlertTriangle,
  RefreshCw,
  Search,
  Flag,
  History,
  FileSpreadsheet,
  Check,
  X,
} from 'lucide-react';

interface AdminPageProps {
  onNavigate: (path: string) => void;
}

export const AdminPage: React.FC<AdminPageProps> = ({ onNavigate }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(adminService.isAdminAuthenticated());
  const [passkey, setPasskey] = useState('');
  const [error, setError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<'reports' | 'abuse' | 'audit' | 'settings'>('reports');

  const [stats, setStats] = useState({
    totalReports: 0,
    lostCount: 0,
    foundCount: 0,
    possibleMatches: 0,
    resolvedCount: 0,
    pendingAbuseReports: 0,
  });
  const [reports, setReports] = useState<Item[]>([]);
  const [abuseReports, setAbuseReports] = useState<ItemReportRecord[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogRecord[]>([]);
  const [filterType, setFilterType] = useState<'all' | 'lost' | 'found'>('all');
  const [search, setSearch] = useState('');

  // Settings state
  const [allowedDomain, setAllowedDomain] = useState('');
  const [requireDomain, setRequireDomain] = useState(true);
  const [settingsNotice, setSettingsNotice] = useState<string | null>(null);

  useEffect(() => {
    adminService.checkIsAdmin().then((isAdmin) => {
      if (isAdmin) {
        setIsAuthenticated(true);
      }
    });
  }, []);

  const loadAdminData = async () => {
    try {
      const [s, r, a, logs] = await Promise.all([
        adminService.getStats(),
        adminService.getAllAdminReports(),
        adminService.getAbuseReports(),
        adminService.getAuditLogs(),
      ]);
      setStats(s);
      setReports(r);
      setAbuseReports(a);
      setAuditLogs(logs);
    } catch (err: any) {
      setError(err?.message || 'Access denied: Administrator permissions required.');
    }

    const cfg = configService.getConfig();
    setAllowedDomain(cfg.allowed_email_domain);
    setRequireDomain(cfg.require_domain_match);
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadAdminData();
    }
  }, [isAuthenticated]);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!passkey.trim()) {
      setError('Please enter the administrative key.');
      return;
    }

    // Check passkey or backend admin role
    const isDbAdmin = await adminService.checkIsAdmin();
    if (isDbAdmin || passkey.trim() === 'RVRNRI@ADMIN2026') {
      adminService.setAdminAuthenticated(true);
      setIsAuthenticated(true);
      setPasskey('');
    } else {
      setError('Invalid administrative passkey. Access restricted to university desk custodians.');
    }
  };

  const handleAdminLogout = () => {
    adminService.setAdminAuthenticated(false);
    setIsAuthenticated(false);
  };

  const handleRemoveReport = async (itemId: string) => {
    if (window.confirm('Are you sure you want to remove this report from campus records?')) {
      try {
        await adminService.removeReport(itemId);
        await loadAdminData();
      } catch (err: any) {
        alert(err?.message || 'Database permission denied: Only authorized administrators can delete records.');
      }
    }
  };

  const handleForceResolve = async (itemId: string) => {
    const note = window.prompt(
      'Enter resolution note (e.g. Custody verified at Administrative Office):',
      'Dispute resolved at Administration Desk'
    );
    if (note !== null) {
      try {
        await adminService.forceResolveReport(itemId, note);
        await loadAdminData();
      } catch (err: any) {
        alert(err?.message || 'Database permission denied: Only authorized administrators can resolve records.');
      }
    }
  };

  const handleDismissAbuseReport = async (reportId: string) => {
    try {
      await supabase
        .from('item_reports')
        .update({ status: 'dismissed' })
        .eq('id', reportId);
      await adminService.logAction('DISMISS_ABUSE_REPORT', 'item_report', reportId);
      await loadAdminData();
    } catch (err: any) {
      alert(err?.message || 'Failed to dismiss abuse report.');
    }
  };

  const handlePurgeAbuseItem = async (reportId: string, itemId: string, reason: string) => {
    if (window.confirm('Delete this reported item and mark the abuse report resolved?')) {
      try {
        await adminService.adminDeleteReport(itemId, `Purged due to abuse flag: ${reason}`);
        await supabase
          .from('item_reports')
          .update({ status: 'resolved' })
          .eq('id', reportId);
        await loadAdminData();
      } catch (err: any) {
        alert(err?.message || 'Failed to delete reported item.');
      }
    }
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    if (!allowedDomain.trim()) return;
    adminService.updateUniversityDomain(allowedDomain, requireDomain);
    setSettingsNotice('Email domain rules saved successfully.');
    setTimeout(() => setSettingsNotice(null), 3000);
  };

  const filteredReports = reports
    .filter((r) => filterType === 'all' || r.type === filterType)
    .filter(
      (r) =>
        !search.trim() ||
        r.name.toLowerCase().includes(search.toLowerCase()) ||
        r.location.toLowerCase().includes(search.toLowerCase()) ||
        r.category.toLowerCase().includes(search.toLowerCase()) ||
        r.description.toLowerCase().includes(search.toLowerCase())
    );

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen text-white py-12 px-4 sm:px-6 flex items-center justify-center">
        <div className="w-full max-w-md lovable-card-elevated rounded-3xl border border-slate-800 shadow-2xl p-6 sm:p-8">
          <button
            onClick={() => onNavigate('/')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white mb-6 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Public Website</span>
          </button>

          <div className="mb-6">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-2">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Campus Administration Desk</span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">
              Administrative Console
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Restricted to authorized Dr. RVR NRI University custodians, security desk officers, and administration staff.
            </p>
          </div>

          {error && (
            <div className="mb-5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Administrative Passkey
              </label>
              <input
                type="password"
                required
                value={passkey}
                onChange={(e) => setPasskey(e.target.value)}
                placeholder="Enter university admin key"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-sm text-white focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Authorized master key: <code className="font-mono text-indigo-400 font-bold">RVRNRI@ADMIN2026</code>
              </p>
            </div>

            <button
              type="submit"
              className="w-full py-3 lovable-glow-btn text-white text-xs font-bold rounded-xl transition-all shadow-md cursor-pointer"
            >
              Authenticate & Enter Desk
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white pb-16 pt-6 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 lovable-card p-6 rounded-3xl border border-slate-800 shadow-md">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400 mb-1">
              <Building2 className="w-3.5 h-3.5" />
              <span>Dr. RVR NRI University · Custodian Administration Desk</span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">
              FIND BACK Campus Control Desk
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate('/')}
              className="px-3.5 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-900 border border-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              Public View
            </button>
            <button
              onClick={handleAdminLogout}
              className="px-3.5 py-2 text-xs font-semibold text-rose-400 hover:bg-rose-500/10 border border-rose-500/30 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Exit Admin Desk</span>
            </button>
          </div>
        </div>

        {/* Real-time Statistics Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="lovable-card p-4 rounded-2xl border border-slate-800/80">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Total Reports
            </span>
            <p className="text-2xl font-extrabold text-white tabular-nums mt-1">
              {stats.totalReports}
            </p>
          </div>

          <div className="lovable-card p-4 rounded-2xl border border-slate-800/80">
            <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider">
              Lost Items
            </span>
            <p className="text-2xl font-extrabold text-rose-400 tabular-nums mt-1">
              {stats.lostCount}
            </p>
          </div>

          <div className="lovable-card p-4 rounded-2xl border border-slate-800/80">
            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
              Found Items
            </span>
            <p className="text-2xl font-extrabold text-emerald-400 tabular-nums mt-1">
              {stats.foundCount}
            </p>
          </div>

          <div className="lovable-card p-4 rounded-2xl border border-slate-800/80">
            <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">
              Possible Matches
            </span>
            <p className="text-2xl font-extrabold text-amber-400 tabular-nums mt-1">
              {stats.possibleMatches}
            </p>
          </div>

          <div className="lovable-card p-4 rounded-2xl border border-slate-800/80">
            <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">
              Resolved & Returned
            </span>
            <p className="text-2xl font-extrabold text-indigo-300 tabular-nums mt-1">
              {stats.resolvedCount}
            </p>
          </div>

          <div className="lovable-card p-4 rounded-2xl border border-slate-800/80">
            <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider">
              Abuse Flags
            </span>
            <p className="text-2xl font-extrabold text-red-400 tabular-nums mt-1">
              {stats.pendingAbuseReports}
            </p>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-2 p-1.5 bg-slate-950/80 border border-slate-800 rounded-2xl w-fit">
          <button
            onClick={() => setActiveTab('reports')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'reports'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Campus Reports ({reports.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('abuse')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'abuse'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Flag className="w-3.5 h-3.5 text-rose-400" />
            <span>Abuse Flags ({abuseReports.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('audit')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'audit'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <History className="w-3.5 h-3.5 text-amber-400" />
            <span>Audit Logs ({auditLogs.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'settings'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>University Rules</span>
          </button>
        </div>

        {/* Tab 1: All Reports Moderation Table */}
        {activeTab === 'reports' && (
          <div className="lovable-card rounded-3xl border border-slate-800 shadow-md overflow-hidden">
            <div className="p-6 border-b border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-white">
                  All Campus Reports Moderation
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Review reports, resolve disputes, or purge inappropriate submissions
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Filter records..."
                    className="pl-8 pr-3 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as any)}
                  className="px-3 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs font-semibold text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value="all">All Types</option>
                  <option value="lost">Lost</option>
                  <option value="found">Found</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/80 border-b border-slate-800/80 text-slate-400 uppercase font-semibold">
                  <tr>
                    <th className="px-5 py-3">Item</th>
                    <th className="px-5 py-3">Type</th>
                    <th className="px-5 py-3">Category</th>
                    <th className="px-5 py-3">Location</th>
                    <th className="px-5 py-3">Date</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3 text-right">Desk Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredReports.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-5 py-8 text-center text-slate-500">
                        No matching records found.
                      </td>
                    </tr>
                  ) : (
                    filteredReports.map((report) => (
                      <tr key={report.id} className="hover:bg-slate-900/40 transition-colors">
                        <td className="px-5 py-3.5 font-bold text-white max-w-[180px] truncate">
                          {report.name}
                        </td>
                        <td className="px-5 py-3.5">
                          <span
                            className={`font-bold uppercase text-[10px] px-2 py-0.5 rounded-md ${
                              report.type === 'lost'
                                ? 'bg-rose-500/10 border border-rose-500/20 text-rose-400'
                                : 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                            }`}
                          >
                            {report.type}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-slate-300">{report.category}</td>
                        <td className="px-5 py-3.5 text-slate-300">{report.location}</td>
                        <td className="px-5 py-3.5 text-slate-300 tabular-nums">{report.date}</td>
                        <td className="px-5 py-3.5">
                          <span className="font-semibold text-indigo-300">{report.status}</span>
                        </td>
                        <td className="px-5 py-3.5 text-right space-x-2">
                          {report.status !== 'Resolved' && (
                            <button
                              onClick={() => handleForceResolve(report.id)}
                              className="p-1.5 text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors cursor-pointer"
                              title="Force Resolve"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handleRemoveReport(report.id)}
                            className="p-1.5 text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                            title="Purge / Remove Report"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 2: Abuse Reports Review */}
        {activeTab === 'abuse' && (
          <div className="lovable-card rounded-3xl border border-slate-800 shadow-md overflow-hidden">
            <div className="p-6 border-b border-slate-800/80">
              <h2 className="text-base font-bold text-white">
                Student Abuse & Inappropriate Listing Reports
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Investigate user-submitted reports for fake listings, spam, wrong info, or inappropriate content
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/80 border-b border-slate-800/80 text-slate-400 uppercase font-semibold">
                  <tr>
                    <th className="px-5 py-3">Reported Reason</th>
                    <th className="px-5 py-3">Details</th>
                    <th className="px-5 py-3">Target Item ID</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">Date</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {abuseReports.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-8 text-center text-slate-500">
                        No abuse reports submitted. Clean campus feed!
                      </td>
                    </tr>
                  ) : (
                    abuseReports.map((ar) => (
                      <tr key={ar.id} className="hover:bg-slate-900/40 transition-colors">
                        <td className="px-5 py-3.5 font-bold text-rose-400">
                          {ar.reason}
                        </td>
                        <td className="px-5 py-3.5 text-slate-300 max-w-[200px] truncate">
                          {ar.details || 'No additional details provided'}
                        </td>
                        <td className="px-5 py-3.5 font-mono text-[11px] text-slate-400">
                          {ar.item_id.substring(0, 8)}...
                        </td>
                        <td className="px-5 py-3.5">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              ar.status === 'pending'
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                : ar.status === 'resolved'
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {ar.status}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-slate-400 tabular-nums">
                          {new Date(ar.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-5 py-3.5 text-right space-x-2">
                          {ar.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handlePurgeAbuseItem(ar.id, ar.item_id, ar.reason)}
                                className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-bold rounded-lg transition-colors cursor-pointer"
                                title="Delete Item & Resolve Report"
                              >
                                Delete Item
                              </button>
                              <button
                                onClick={() => handleDismissAbuseReport(ar.id)}
                                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-bold rounded-lg transition-colors cursor-pointer"
                                title="Dismiss Flag"
                              >
                                Dismiss
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: Administrator Audit Log */}
        {activeTab === 'audit' && (
          <div className="lovable-card rounded-3xl border border-slate-800 shadow-md overflow-hidden">
            <div className="p-6 border-b border-slate-800/80">
              <h2 className="text-base font-bold text-white">
                Administrative Audit Trail
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Cryptographic immutable log of administrative actions, report purges, and dispute resolutions
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/80 border-b border-slate-800/80 text-slate-400 uppercase font-semibold">
                  <tr>
                    <th className="px-5 py-3">Timestamp</th>
                    <th className="px-5 py-3">Action</th>
                    <th className="px-5 py-3">Target</th>
                    <th className="px-5 py-3">Target ID</th>
                    <th className="px-5 py-3">Details</th>
                    <th className="px-5 py-3">Admin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {auditLogs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-8 text-center text-slate-500 font-sans">
                        No audit events recorded yet.
                      </td>
                    </tr>
                  ) : (
                    auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-900/40 transition-colors">
                        <td className="px-5 py-3 text-slate-400 tabular-nums">
                          {new Date(log.created_at).toLocaleString()}
                        </td>
                        <td className="px-5 py-3 font-bold text-indigo-400">
                          {log.action}
                        </td>
                        <td className="px-5 py-3 text-slate-300">
                          {log.target_type}
                        </td>
                        <td className="px-5 py-3 text-slate-400">
                          {log.target_id ? log.target_id.substring(0, 10) + '...' : '-'}
                        </td>
                        <td className="px-5 py-3 text-slate-400 max-w-[200px] truncate">
                          {log.details ? JSON.stringify(log.details) : '-'}
                        </td>
                        <td className="px-5 py-3 text-slate-500">
                          {log.admin_id.substring(0, 8)}...
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 4: University Email Domain Configuration */}
        {activeTab === 'settings' && (
          <div className="lovable-card p-6 rounded-3xl border border-slate-800 shadow-md">
            <div className="flex items-center gap-2 mb-3">
              <Settings className="w-5 h-5 text-indigo-400" />
              <h2 className="text-base font-bold text-white">
                Campus University Access Settings
              </h2>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Configure the required student email domain rule (default: gmail.com) for Dr. RVR NRI University account registration.
            </p>

            {settingsNotice && (
              <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 font-medium">
                {settingsNotice}
              </div>
            )}

            <form onSubmit={handleSaveSettings} className="flex flex-col sm:flex-row items-end gap-4">
              <div className="flex-1 w-full">
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Allowed Email Domain (e.g. gmail.com)
                </label>
                <input
                  type="text"
                  value={allowedDomain}
                  onChange={(e) => setAllowedDomain(e.target.value)}
                  placeholder="e.g. gmail.com"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center gap-2 pb-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-300">
                  <input
                    type="checkbox"
                    checked={requireDomain}
                    onChange={(e) => setRequireDomain(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500 bg-slate-950 border-slate-800"
                  />
                  <span>Strictly enforce domain requirement</span>
                </label>
              </div>

              <button
                type="submit"
                className="px-4 py-2.5 lovable-glow-btn text-white text-xs font-bold rounded-xl transition-all shadow-md shrink-0 cursor-pointer"
              >
                Update Domain Rule
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
