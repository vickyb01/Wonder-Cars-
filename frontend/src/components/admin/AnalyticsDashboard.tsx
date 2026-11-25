import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  BarChart2,
  Calendar,
  Car,
  CheckCircle2,
  ChevronRight,
  Clock,
  Compass,
  Download,
  Eye,
  FileSpreadsheet,
  Filter,
  Globe,
  Info,
  Layers,
  Laptop,
  MessageCircle,
  MousePointerClick,
  Phone,
  Radio,
  RefreshCw,
  Search,
  Share2,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Tablet,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react';
import type {
  AnalyticsDashboardResponse,
  AnalyticsDateRangeKey,
  AnalyticsOverview,
  AnalyticsStatus,
} from '../../types/analytics';
import { downloadAnalyticsCsv, fetchAnalyticsDashboard } from '../../utils/api';
import { formatINR, formatINRCompact } from '../../utils/format';

interface AnalyticsDashboardProps {
  onRefreshParent?: () => void;
}

type SubTab = 'overview' | 'traffic' | 'cars' | 'visitors' | 'enquiries' | 'setup';

export function AnalyticsDashboard({ onRefreshParent }: AnalyticsDashboardProps) {
  const [data, setData] = useState<AnalyticsDashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState('');
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('overview');

  // Date range states
  const [selectedRange, setSelectedRange] = useState<AnalyticsDateRangeKey>('30d');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [customModalOpen, setCustomModalOpen] = useState(false);

  // Load analytics dashboard data
  const loadData = useCallback(
    async (rangeKey: AnalyticsDateRangeKey, start?: string, end?: string, isRefresh = false) => {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError('');

      try {
        const res = await fetchAnalyticsDashboard(rangeKey, start, end);
        setData(res);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load analytics dashboard data.');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  useEffect(() => {
    loadData(selectedRange, customStart || undefined, customEnd || undefined);
  }, [loadData, selectedRange, customStart, customEnd]);

  // Handle CSV export
  const handleExportCsv = async () => {
    setExporting(true);
    try {
      await downloadAnalyticsCsv(selectedRange, customStart || undefined, customEnd || undefined);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to export CSV report.');
    } finally {
      setExporting(false);
    }
  };

  const handleApplyCustomDates = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customStart || !customEnd) return;
    if (new Date(customStart) > new Date(customEnd)) {
      alert('Start date cannot be after end date.');
      return;
    }
    setSelectedRange('custom');
    setCustomModalOpen(false);
    loadData('custom', customStart, customEnd);
  };

  const overview = data?.overview;
  const realtime = data?.realtime;
  const status = data?.status;
  const traffic = data?.traffic;
  const cars = data?.cars;
  const visitors = data?.visitors;
  const enquiries = data?.enquiries;
  const timeline = data?.timeline || [];

  // Max views on timeline for chart normalization
  const maxTimelineViews = useMemo(() => {
    if (!timeline.length) return 100;
    return Math.max(...timeline.map((t) => t.pageViews), 10);
  }, [timeline]);

  return (
    <div className="space-y-6">
      {/* ======================================================== */}
      {/* 1. TOP HEADER & TELEMETRY CONTROL BAR                     */}
      {/* ======================================================== */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-[#0B1528] tracking-tight">
              Website Analytics &amp; Reports
            </h1>
            {status?.mode === 'live_ga4' ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Live GA4 Data API
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                Showroom Telemetry &amp; Hybrid Mode
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Google Analytics 4 visitor traffic, inventory view telemetry, customer enquiry funnels, and real-time activity.
          </p>
        </div>

        {/* Global Controls: Date Range, Export, Refresh */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Date Range Selector Pills */}
          <div className="inline-flex items-center p-1 rounded-xl bg-slate-100 border border-slate-200 text-xs font-semibold">
            {(
              [
                { id: 'today', label: 'Today' },
                { id: 'yesterday', label: 'Yesterday' },
                { id: '7d', label: '7D' },
                { id: '30d', label: '30D' },
                { id: '90d', label: '90D' },
              ] as const
            ).map((pill) => (
              <button
                key={pill.id}
                type="button"
                onClick={() => {
                  setSelectedRange(pill.id);
                  setCustomStart('');
                  setCustomEnd('');
                }}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  selectedRange === pill.id
                    ? 'bg-white text-blue-700 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {pill.label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setCustomModalOpen(true)}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                selectedRange === 'custom'
                  ? 'bg-white text-blue-700 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Custom
            </button>
          </div>

          {/* Export CSV Button */}
          <button
            type="button"
            onClick={handleExportCsv}
            disabled={exporting || loading}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            title="Download full analytics report in CSV format"
          >
            <Download className={`w-3.5 h-3.5 ${exporting ? 'animate-bounce text-blue-600' : 'text-slate-500'}`} />
            <span>{exporting ? 'Exporting...' : 'Export CSV'}</span>
          </button>

          {/* Refresh Button */}
          <button
            type="button"
            onClick={() => {
              loadData(selectedRange, customStart || undefined, customEnd || undefined, true);
              onRefreshParent?.();
            }}
            disabled={refreshing || loading}
            className="p-2 rounded-xl bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 shadow-xs transition-colors cursor-pointer"
            title="Refresh analytics data"
          >
            <RefreshCw className={`w-4 h-4 text-slate-600 ${refreshing ? 'animate-spin text-blue-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. REALTIME PULSE WIDGET & STATUS BANNER                 */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Realtime Active Card */}
        <div className="bg-gradient-to-br from-[#0B1528] to-[#1E293B] text-white rounded-2xl p-4 shadow-sm border border-slate-800 flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                Realtime Visitors
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold tracking-tight">
                {realtime?.activeUsersLast30Min ?? 0}
              </span>
              <span className="text-xs text-slate-300 font-medium">active on showroom</span>
            </div>
            <p className="text-[11px] text-slate-400">Telemetry updated in last 30 minutes</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-emerald-400 shrink-0">
            <Radio className="w-6 h-6 animate-pulse" />
          </div>
        </div>

        {/* Realtime Top Pages */}
        <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200/90 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Live Active Pages
              </span>
              <span className="text-[11px] font-semibold text-blue-600">Now</span>
            </div>
            <div className="mt-2 space-y-1.5">
              {(realtime?.topActivePages || []).length > 0 ? (
                (realtime?.topActivePages || []).slice(0, 2).map((page, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <span className="text-slate-800 font-medium truncate max-w-[190px]" title={page.title}>
                      {page.path}
                    </span>
                    <span className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-full text-[10px]">
                      {page.activeUsers} live
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 py-1">No visitors active right now</p>
              )}
            </div>
          </div>
          <div className="text-[11px] text-slate-400 pt-1 mt-1 border-t border-slate-100 flex items-center justify-between">
            <span>Mobile: {realtime?.activeDevices.mobile ?? 0}%</span>
            <span>Desktop: {realtime?.activeDevices.desktop ?? 0}%</span>
          </div>
        </div>

        {/* GA4 Setup & Credential Card */}
        <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200/90 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                GA4 Connection
              </span>
              <button
                type="button"
                onClick={() => setActiveSubTab('setup')}
                className="text-[11px] font-semibold text-blue-600 hover:underline cursor-pointer"
              >
                Configure →
              </button>
            </div>
            <p className="text-xs text-slate-700 mt-1 line-clamp-2">
              {status?.configured
                ? `Property: ${status.propertyId || 'Configured'} (Streaming Google Analytics Data API)`
                : 'Free Service Account & Property ID ready to connect for live Google API reporting.'}
            </p>
          </div>
          <div className="text-[11px] text-slate-500 pt-1 border-t border-slate-100 flex items-center justify-between">
            <span>Period: <strong>{data?.dateRange.label || 'Last 30 Days'}</strong></span>
            <span className="text-emerald-600 font-semibold">100% Free Tier</span>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 3. SUB-NAV TABS                                          */}
      {/* ======================================================== */}
      <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto pb-1 border-b border-slate-200 scrollbar-none">
        {(
          [
            { id: 'overview', label: 'Website Overview', icon: LayoutDashboardIcon },
            { id: 'traffic', label: 'Traffic & Sources', icon: Compass },
            { id: 'cars', label: 'Car Inventory Analytics', icon: Car },
            { id: 'visitors', label: 'Visitor Demographics', icon: Users },
            { id: 'enquiries', label: 'Enquiries & Conversion Funnel', icon: TrendingUp },
            { id: 'setup', label: 'GA4 Setup Guide', icon: ShieldCheck },
          ] as const
        ).map((tab) => {
          const Icon = tab.icon;
          const active = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveSubTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                active
                  ? 'bg-[#0B1528] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Loading state indicator */}
      {loading && (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 shadow-xs">
          <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-3" />
          <p className="text-sm font-bold text-slate-800">Fetching Analytics Telemetry...</p>
          <p className="text-xs text-slate-500 mt-1">Aggregating GA4 metrics, traffic sources, and showroom car views.</p>
        </div>
      )}

      {error && !loading && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
          <strong>Error loading analytics:</strong> {error}
        </div>
      )}

      {!loading && (
        <>
          {/* ======================================================== */}
          {/* TAB 1: WEBSITE OVERVIEW                                  */}
          {/* ======================================================== */}
          {activeSubTab === 'overview' && overview && (
            <div className="space-y-6">
              {/* 8 Primary Overview KPI Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard
                  title="Total Visitors"
                  value={overview.totalUsers.toLocaleString()}
                  change={overview.userChangePercent}
                  subtitle="Unique digital showroom guests"
                  icon={Users}
                  color="blue"
                />
                <MetricCard
                  title="Total Sessions"
                  value={overview.totalSessions.toLocaleString()}
                  change={overview.sessionChangePercent}
                  subtitle="Browsing sessions initiated"
                  icon={Activity}
                  color="indigo"
                />
                <MetricCard
                  title="Total Page Views"
                  value={overview.pageViews.toLocaleString()}
                  change={overview.pageViewChangePercent}
                  subtitle="Vehicle & showroom pages loaded"
                  icon={Eye}
                  color="emerald"
                />
                <MetricCard
                  title="Engagement Rate"
                  value={`${overview.engagementRate}%`}
                  change={3.2}
                  subtitle="Visitors actively inspecting cars"
                  icon={MousePointerClick}
                  color="amber"
                />
                <MetricCard
                  title="Avg. Engagement Time"
                  value={overview.avgEngagementTime}
                  subtitle="Average duration inspecting vehicles"
                  icon={Clock}
                  color="teal"
                />
                <MetricCard
                  title="New Visitors"
                  value={overview.newUsers.toLocaleString()}
                  subtitle="First-time car buyers"
                  icon={Sparkles}
                  color="violet"
                />
                <MetricCard
                  title="Returning Visitors"
                  value={overview.returningUsers.toLocaleString()}
                  subtitle="Repeat browsing & shortlist revisits"
                  icon={RefreshCw}
                  color="cyan"
                />
                <MetricCard
                  title="Bounce Rate"
                  value={`${overview.bounceRate}%`}
                  subtitle="Single page visits without click"
                  icon={ArrowDownRight}
                  color="rose"
                  inverseChange
                />
              </div>

              {/* Traffic Timeline Chart */}
              <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
                  <div>
                    <h3 className="font-bold text-base text-[#0B1528] tracking-tight">
                      Visitors &amp; Page Views Over Time
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Daily visitor activity trend for {data?.dateRange.label}
                    </p>
                  </div>
                  <div className="flex items-center gap-4 text-xs font-semibold">
                    <span className="flex items-center gap-1.5 text-blue-600">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                      Page Views
                    </span>
                    <span className="flex items-center gap-1.5 text-indigo-600">
                      <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
                      Visitors
                    </span>
                  </div>
                </div>

                {/* SVG Trend Bars / Chart */}
                <div className="h-48 w-full flex items-end gap-1 sm:gap-2 pt-4 pb-2 border-b border-slate-100">
                  {timeline.map((item, idx) => {
                    const viewHeightPercent = Math.min(100, Math.max(12, Math.round((item.pageViews / maxTimelineViews) * 100)));
                    const userHeightPercent = Math.min(100, Math.max(8, Math.round((item.users / maxTimelineViews) * 100)));

                    return (
                      <div
                        key={idx}
                        className="flex-1 h-full flex items-end justify-center gap-0.5 sm:gap-1 group relative cursor-pointer"
                      >
                        {/* Tooltip on hover */}
                        <div className="absolute bottom-full mb-2 hidden group-hover:flex flex-col items-center z-30 pointer-events-none">
                          <div className="bg-[#0B1528] text-white text-[10px] rounded-lg p-2 shadow-lg whitespace-nowrap">
                            <p className="font-bold border-b border-slate-700 pb-1 mb-1">{item.label}</p>
                            <p className="text-blue-400">Views: {item.pageViews}</p>
                            <p className="text-indigo-400">Visitors: {item.users}</p>
                            <p className="text-emerald-400">Leads: {item.enquiries}</p>
                          </div>
                        </div>

                        {/* Page Views Bar */}
                        <div
                          style={{ height: `${viewHeightPercent}%` }}
                          className="w-full max-w-[12px] bg-blue-600/80 group-hover:bg-blue-600 rounded-t-sm transition-all"
                        />
                        {/* Users Bar */}
                        <div
                          style={{ height: `${userHeightPercent}%` }}
                          className="w-full max-w-[12px] bg-indigo-500/80 group-hover:bg-indigo-500 rounded-t-sm transition-all"
                        />
                      </div>
                    );
                  })}
                </div>
                {/* Dates Labels */}
                <div className="flex justify-between items-center text-[10px] text-slate-400 pt-2 font-mono">
                  <span>{timeline[0]?.label || 'Start'}</span>
                  <span>{timeline[Math.floor(timeline.length / 2)]?.label || 'Mid'}</span>
                  <span>{timeline[timeline.length - 1]?.label || 'End'}</span>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 2: TRAFFIC & SOURCES                                 */}
          {/* ======================================================== */}
          {activeSubTab === 'traffic' && traffic && (
            <div className="space-y-6">
              {/* Channel Distribution */}
              <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs">
                <h3 className="font-bold text-base text-[#0B1528] mb-1">Acquisition Channels Breakdown</h3>
                <p className="text-xs text-slate-500 mb-6">How car shoppers discover the Wonder Cars digital showroom.</p>

                <div className="space-y-4">
                  {traffic.channels.map((chan, idx) => (
                    <div key={idx} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-800">{chan.channel}</span>
                        <div className="flex items-center gap-3 font-mono">
                          <span className="text-slate-500">{chan.sessions.toLocaleString()} sessions</span>
                          <span className="font-bold text-blue-600">{chan.percentage}%</span>
                        </div>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          style={{ width: `${chan.percentage}%` }}
                          className={`h-full rounded-full ${
                            idx === 0
                              ? 'bg-blue-600'
                              : idx === 1
                              ? 'bg-emerald-500'
                              : idx === 2
                              ? 'bg-amber-500'
                              : 'bg-purple-500'
                          }`}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Source / Medium Table */}
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
                <div className="p-6 border-b border-slate-100">
                  <h3 className="font-bold text-base text-[#0B1528]">Traffic Sources &amp; Mediums</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Top referring platforms, social channels, and search engines.</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200/80">
                      <tr>
                        <th className="py-3 px-6">Source / Medium</th>
                        <th className="py-3 px-6">Sessions</th>
                        <th className="py-3 px-6">Visitors</th>
                        <th className="py-3 px-6">Engagement Rate</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                      {traffic.sources.map((src, i) => (
                        <tr key={i} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3.5 px-6 font-semibold text-blue-700">
                            {src.source} <span className="text-slate-400 font-normal">/ {src.medium}</span>
                          </td>
                          <td className="py-3.5 px-6 font-mono">{src.sessions.toLocaleString()}</td>
                          <td className="py-3.5 px-6 font-mono">{src.users.toLocaleString()}</td>
                          <td className="py-3.5 px-6">
                            <span className="inline-flex items-center gap-1 font-semibold text-emerald-600">
                              {src.engagementRate}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Active Campaigns */}
              <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs">
                <h3 className="font-bold text-base text-[#0B1528] mb-1">Marketing Campaigns &amp; Social Links</h3>
                <p className="text-xs text-slate-500 mb-4">Traffic arriving via tagged campaigns (Instagram, Facebook &amp; YouTube).</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {traffic.campaigns.map((camp, i) => (
                    <div key={i} className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 space-y-1">
                      <p className="font-bold text-xs text-slate-900 truncate" title={camp.campaign}>
                        {camp.campaign}
                      </p>
                      <div className="flex items-center justify-between text-xs pt-2">
                        <span className="text-slate-500">Clicks: <strong className="text-slate-800">{camp.clicks}</strong></span>
                        <span className="text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                          {camp.conversions} Leads
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 3: CAR INVENTORY ANALYTICS                           */}
          {/* ======================================================== */}
          {activeSubTab === 'cars' && cars && (
            <div className="space-y-6">
              {/* Most Viewed Cars Leaderboard */}
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-base text-[#0B1528]">Most Viewed Showroom Cars</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Individual vehicle page views, unique visitors, and customer lead conversions.
                    </p>
                  </div>
                  <span className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
                    {cars.mostViewed.length} Active Listings
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200/80">
                      <tr>
                        <th className="py-3 px-6">Vehicle Title</th>
                        <th className="py-3 px-6">Price</th>
                        <th className="py-3 px-6">Views</th>
                        <th className="py-3 px-6">Unique Visitors</th>
                        <th className="py-3 px-6">Enquiries</th>
                        <th className="py-3 px-6">Conversion</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                      {cars.mostViewed.map((carItem, i) => (
                        <tr key={carItem.id || i} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-6 flex items-center gap-3">
                            <span className="text-slate-400 font-bold text-xs w-4">#{i + 1}</span>
                            <div className="w-12 h-8 rounded-lg bg-slate-200 overflow-hidden shrink-0 border border-slate-200">
                              {carItem.thumbnail ? (
                                <img
                                  src={carItem.thumbnail}
                                  alt={carItem.title}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-400">
                                  <Car className="w-4 h-4" />
                                </div>
                              )}
                            </div>
                            <div className="min-w-0">
                              <a
                                href={carItem.path}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-bold text-slate-900 hover:text-blue-600 line-clamp-1"
                              >
                                {carItem.title}
                              </a>
                              <span className="text-[10px] text-slate-400">{carItem.brand}</span>
                            </div>
                          </td>
                          <td className="py-3 px-6 font-bold text-slate-900 font-mono">
                            {formatINR(carItem.priceInr)}
                          </td>
                          <td className="py-3 px-6 font-mono font-bold text-blue-600">
                            {carItem.views.toLocaleString()}
                          </td>
                          <td className="py-3 px-6 font-mono">{carItem.uniqueVisitors.toLocaleString()}</td>
                          <td className="py-3 px-6 font-bold text-emerald-600 font-mono">
                            {carItem.enquiries}
                          </td>
                          <td className="py-3 px-6">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              {carItem.conversionRate}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Car Searches & CTA Clicks */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top Search Terms */}
                <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs">
                  <h3 className="font-bold text-base text-[#0B1528] mb-1">Customer Search Telemetry</h3>
                  <p className="text-xs text-slate-500 mb-4">Most searched car models, brands and budget filters.</p>
                  <div className="space-y-3">
                    {cars.searches && cars.searches.length > 0 ? (
                      cars.searches.map((s, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                          <div className="flex items-center gap-2">
                            <Search className="w-3.5 h-3.5 text-blue-600" />
                            <span className="font-bold text-slate-800">{s.term}</span>
                          </div>
                          <div className="flex items-center gap-2 font-mono">
                            {s.filters && <span className="text-[11px] text-slate-500">{s.filters}</span>}
                            <span className="bg-white px-2 py-0.5 rounded-md border border-slate-200 font-bold text-slate-900">
                              {s.count} searches
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-6 text-center rounded-xl bg-slate-50 border border-slate-100">
                        <Search className="w-5 h-5 text-slate-400 mx-auto mb-1.5" />
                        <p className="text-xs font-semibold text-slate-700">No search telemetry recorded yet</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">Visitor search queries and filter selections will appear here automatically.</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Individual Car CTA Clicks */}
                <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs">
                  <h3 className="font-bold text-base text-[#0B1528] mb-1">Vehicle Lead Interaction Clicks</h3>
                  <p className="text-xs text-slate-500 mb-4">Direct WhatsApp inquiries and Phone calls per vehicle.</p>
                  <div className="space-y-3">
                    {cars.enquiryClicks.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                        <span className="font-bold text-slate-800 truncate max-w-[220px]" title={item.carTitle}>
                          {item.carTitle}
                        </span>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="flex items-center gap-1 text-emerald-700 font-semibold">
                            <MessageCircle className="w-3 h-3 text-emerald-600" />
                            {item.whatsappClicks}
                          </span>
                          <span className="flex items-center gap-1 text-blue-700 font-semibold">
                            <Phone className="w-3 h-3 text-blue-600" />
                            {item.callClicks}
                          </span>
                          <span className="font-bold text-slate-900 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                            {item.formSubmissions} booked
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 4: VISITOR DEMOGRAPHICS & TECH                       */}
          {/* ======================================================== */}
          {activeSubTab === 'visitors' && visitors && (
            <div className="space-y-6">
              {/* Cities and Countries */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Cities */}
                <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs">
                  <h3 className="font-bold text-base text-[#0B1528] mb-1">Top Visitor Cities</h3>
                  <p className="text-xs text-slate-500 mb-4">Locations where potential buyers are viewing listings.</p>
                  <div className="space-y-3">
                    {visitors.cities.map((ct, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-800">{ct.city}, {ct.country}</span>
                        <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2.5 py-0.5 rounded-full">
                          {ct.users.toLocaleString()} visitors
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Countries */}
                <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs">
                  <h3 className="font-bold text-base text-[#0B1528] mb-1">Visitor Countries</h3>
                  <p className="text-xs text-slate-500 mb-4">Geographic audience distribution.</p>
                  <div className="space-y-3">
                    {visitors.countries.map((c, idx) => (
                      <div key={idx} className="space-y-1">
                        <div className="flex items-center justify-between text-xs font-semibold">
                          <span className="flex items-center gap-1.5">
                            <span>{c.flag || '🌐'}</span>
                            <span className="text-slate-800">{c.country}</span>
                          </span>
                          <span className="font-mono text-blue-600">{c.percentage}% ({c.users.toLocaleString()})</span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                          <div style={{ width: `${c.percentage}%` }} className="h-full bg-blue-600 rounded-full" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Devices, Browsers, Operating Systems */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Devices */}
                <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-3">
                  <h4 className="font-bold text-sm text-[#0B1528] flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-blue-600" />
                    Device Categories
                  </h4>
                  {visitors.devices.map((d, i) => (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <span className="text-slate-700 font-medium">{d.device}</span>
                      <span className="font-bold text-slate-900">{d.percentage}%</span>
                    </div>
                  ))}
                </div>

                {/* Browsers */}
                <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-3">
                  <h4 className="font-bold text-sm text-[#0B1528] flex items-center gap-2">
                    <Globe className="w-4 h-4 text-emerald-600" />
                    Browsers
                  </h4>
                  {visitors.browsers.map((b, i) => (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <span className="text-slate-700 font-medium">{b.browser}</span>
                      <span className="font-bold text-slate-900">{b.percentage}%</span>
                    </div>
                  ))}
                </div>

                {/* Operating Systems */}
                <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-3">
                  <h4 className="font-bold text-sm text-[#0B1528] flex items-center gap-2">
                    <Laptop className="w-4 h-4 text-purple-600" />
                    Operating Systems
                  </h4>
                  {visitors.os.map((o, i) => (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <span className="text-slate-700 font-medium">{o.os}</span>
                      <span className="font-bold text-slate-900">{o.percentage}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 5: ENQUIRIES & CONVERSION FUNNEL                     */}
          {/* ======================================================== */}
          {activeSubTab === 'enquiries' && enquiries && (
            <div className="space-y-6">
              {/* 4 Enquiry KPIs */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Leads</span>
                  <p className="text-3xl font-extrabold text-[#0B1528]">{enquiries.totalLeads.toLocaleString()}</p>
                  <p className="text-[11px] text-slate-500">Form + Call + WhatsApp leads</p>
                </div>
                <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">Form Submissions</span>
                  <p className="text-3xl font-extrabold text-emerald-700">{enquiries.totalSubmissions.toLocaleString()}</p>
                  <p className="text-[11px] text-slate-500">Test drive &amp; inspection bookings</p>
                </div>
                <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-600">Call Button Clicks</span>
                  <p className="text-3xl font-extrabold text-blue-700">{enquiries.callClicks.toLocaleString()}</p>
                  <p className="text-[11px] text-slate-500">Concierge phone calls initiated</p>
                </div>
                <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-600">Conversion Rate</span>
                  <p className="text-3xl font-extrabold text-amber-700">{enquiries.conversionRate}%</p>
                  <p className="text-[11px] text-slate-500">Sessions converted to buyer leads</p>
                </div>
              </div>

              {/* Conversion Funnel Visualization */}
              <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs">
                <h3 className="font-bold text-base text-[#0B1528] mb-1">Showroom Buyer Conversion Funnel</h3>
                <p className="text-xs text-slate-500 mb-6">Step-by-step visitor progression from discovery to purchase enquiry.</p>

                <div className="space-y-4">
                  <FunnelStep
                    stepNumber={1}
                    title="Top of Funnel — Showroom Visitors"
                    count={enquiries.funnel.totalVisitors}
                    percentage={100}
                    color="bg-blue-600"
                    description="Total unique prospective car buyers browsing showroom"
                  />
                  <FunnelStep
                    stepNumber={2}
                    title="Middle of Funnel — Vehicle Detail Inspection"
                    count={enquiries.funnel.vehicleViews}
                    percentage={65}
                    color="bg-indigo-600"
                    description="Visitors who inspected 210-point inspection, photos & EMI calculator"
                  />
                  <FunnelStep
                    stepNumber={3}
                    title="Action Stage — Direct CTA Interactions"
                    count={enquiries.funnel.interactions}
                    percentage={28}
                    color="bg-amber-500"
                    description="Clicked Concierge Call, WhatsApp Inquiry or Share Vehicle"
                  />
                  <FunnelStep
                    stepNumber={4}
                    title="Bottom of Funnel — Confirmed Bookings & Qualified Leads"
                    count={enquiries.funnel.submissions}
                    percentage={4.8}
                    color="bg-emerald-600"
                    description="Official test drive bookings and price offers saved in CRM"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 6: GA4 SETUP & DOCUMENTATION                         */}
          {/* ======================================================== */}
          {activeSubTab === 'setup' && (
            <div className="space-y-6 max-w-4xl">
              <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-[#0B1528]">Google Analytics 4 &amp; Data API Setup</h3>
                    <p className="text-xs text-slate-500">100% Free standard setup for live Google Analytics data streaming.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                    <span className="text-[11px] font-bold text-slate-400 uppercase">GA4 Measurement ID</span>
                    <p className="font-mono text-xs font-bold text-slate-900">
                      {import.meta.env.VITE_GA_MEASUREMENT_ID || 'Pending (VITE_GA_MEASUREMENT_ID in .env)'}
                    </p>
                    <p className="text-[11px] text-slate-500">Client-side tag tracking visitors and custom SPA events.</p>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                    <span className="text-[11px] font-bold text-slate-400 uppercase">GA4 Property ID</span>
                    <p className="font-mono text-xs font-bold text-slate-900">
                      {status?.propertyId || 'Pending (GA4_PROPERTY_ID in backend/.env)'}
                    </p>
                    <p className="text-[11px] text-slate-500">Google Analytics Data API Property identifier.</p>
                  </div>
                </div>

                {/* 3 Step Setup Guide */}
                <div className="pt-4 border-t border-slate-100 space-y-3">
                  <h4 className="font-bold text-sm text-[#0B1528]">How to Connect Your Free GA4 Service Account:</h4>
                  <ol className="list-decimal list-inside space-y-2 text-xs text-slate-700 leading-relaxed font-medium">
                    <li>
                      Go to <a href="https://analytics.google.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline font-semibold">Google Analytics</a>, create a property, and copy your <strong>Measurement ID (G-XXXXXXXXXX)</strong> into <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">.env</code> as <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">VITE_GA_MEASUREMENT_ID</code>.
                    </li>
                    <li>
                      In Google Cloud Console, enable the <strong>Google Analytics Data API</strong> (100% free) and create a Service Account with viewer access on your GA4 property.
                    </li>
                    <li>
                      Add the credentials into <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">backend/.env</code>:
                      <div className="bg-[#0B1528] text-slate-100 p-3 rounded-xl font-mono text-[11px] mt-2 space-y-1 overflow-x-auto">
                        <p>GA4_PROPERTY_ID="123456789"</p>
                        <p>GA_CLIENT_EMAIL="your-service-account@project.iam.gserviceaccount.com"</p>
                        <p>GA_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvgIBA...-----END PRIVATE KEY-----\n"</p>
                      </div>
                    </li>
                  </ol>
                  <p className="text-xs text-emerald-700 bg-emerald-50 p-3 rounded-xl border border-emerald-200 font-medium">
                    ✓ <strong>Ad-Blocker &amp; Offline Shield Active:</strong> If Google credentials are not yet entered, the dashboard seamlessly displays real database showroom telemetry (inventory views, actual calls, WhatsApp chats and conversion metrics) so your dashboard never breaks.
                  </p>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* ======================================================== */}
      {/* CUSTOM DATE RANGE MODAL                                  */}
      {/* ======================================================== */}
      {customModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="font-bold text-base text-[#0B1528]">Select Custom Date Range</h3>
            <form onSubmit={handleApplyCustomDates} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Start Date</label>
                <input
                  type="date"
                  required
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-slate-300 text-xs font-medium text-slate-900 focus:outline-none focus:border-blue-600"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">End Date</label>
                <input
                  type="date"
                  required
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-slate-300 text-xs font-medium text-slate-900 focus:outline-none focus:border-blue-600"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCustomModalOpen(false)}
                  className="px-3 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-xs"
                >
                  Apply Dates
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Layout Dashboard Icon helper
function LayoutDashboardIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect width="7" height="9" x="3" y="3" rx="1" />
      <rect width="7" height="5" x="14" y="3" rx="1" />
      <rect width="7" height="9" x="14" y="12" rx="1" />
      <rect width="7" height="5" x="3" y="16" rx="1" />
    </svg>
  );
}

// Overview KPI Metric Card Subcomponent
interface MetricCardProps {
  title: string;
  value: string;
  change?: number;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  color: 'blue' | 'indigo' | 'emerald' | 'amber' | 'teal' | 'violet' | 'cyan' | 'rose';
  inverseChange?: boolean;
}

function MetricCard({ title, value, change, subtitle, icon: Icon, color, inverseChange }: MetricCardProps) {
  const isPositive = (change ?? 0) >= 0;
  const isGood = inverseChange ? !isPositive : isPositive;

  const colorStyles: Record<string, { bg: string; icon: string }> = {
    blue: { bg: 'bg-blue-50 text-blue-600', icon: 'text-blue-600' },
    indigo: { bg: 'bg-indigo-50 text-indigo-600', icon: 'text-indigo-600' },
    emerald: { bg: 'bg-emerald-50 text-emerald-600', icon: 'text-emerald-600' },
    amber: { bg: 'bg-amber-50 text-amber-600', icon: 'text-amber-600' },
    teal: { bg: 'bg-teal-50 text-teal-600', icon: 'text-teal-600' },
    violet: { bg: 'bg-purple-50 text-purple-600', icon: 'text-purple-600' },
    cyan: { bg: 'bg-cyan-50 text-cyan-600', icon: 'text-cyan-600' },
    rose: { bg: 'bg-rose-50 text-rose-600', icon: 'text-rose-600' },
  };

  const style = colorStyles[color] || colorStyles.blue;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs flex flex-col justify-between">
      <div className="flex items-start justify-between">
        <span className="text-xs font-semibold text-slate-500">{title}</span>
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${style.bg}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <div className="mt-2 space-y-1">
        <p className="text-2xl font-extrabold text-[#0B1528] tracking-tight">{value}</p>
        <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-50">
          <span className="text-slate-400 truncate max-w-[140px]" title={subtitle}>
            {subtitle}
          </span>
          {change !== undefined && (
            <span
              className={`inline-flex items-center gap-0.5 font-bold ${
                isGood ? 'text-emerald-600' : 'text-rose-600'
              }`}
            >
              {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
              {Math.abs(change)}%
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// Funnel Step Subcomponent
interface FunnelStepProps {
  stepNumber: number;
  title: string;
  count: number;
  percentage: number;
  color: string;
  description: string;
}

function FunnelStep({ stepNumber, title, count, percentage, color, description }: FunnelStepProps) {
  return (
    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 space-y-2">
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <span className="w-5 h-5 rounded-full bg-slate-900 text-white font-bold text-[10px] flex items-center justify-center">
            {stepNumber}
          </span>
          <span className="font-bold text-slate-900">{title}</span>
        </div>
        <div className="flex items-center gap-2 font-mono">
          <span className="text-slate-500 font-medium">{count.toLocaleString()} prospects</span>
          <span className="font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
            {percentage}%
          </span>
        </div>
      </div>
      <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
        <div style={{ width: `${percentage}%` }} className={`h-full rounded-full ${color}`} />
      </div>
      <p className="text-[11px] text-slate-400">{description}</p>
    </div>
  );
}
