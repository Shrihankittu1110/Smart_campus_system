import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { authFetch } from '../../utils/authFetch';
import AdminHeader from './components/AdminHeader';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, LabelList,
} from 'recharts';
import {
  Users, Store, ShoppingBag, Download,
  TrendingUp, Activity,
  ChevronLeft, ChevronRight,
} from 'lucide-react';

// ── Activity badge config ────────────────────────────────────────────────────
const ACTIVITY_CONFIG = {
  ORDER_PLACED:        { label: 'Order Placed',        color: 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300 ring-1 ring-blue-200 dark:ring-blue-800' },
  ORDER_CANCELLED:     { label: 'Order Cancelled',     color: 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-300 ring-1 ring-red-200 dark:ring-red-800' },
  ORDER_COMPLETED:     { label: 'Order Completed',     color: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-300 ring-1 ring-emerald-200 dark:ring-emerald-800' },
  CANTEEN_APPROVED:    { label: 'Canteen Approved',    color: 'bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-300 ring-1 ring-green-200 dark:ring-green-800' },
  CANTEEN_REJECTED:    { label: 'Canteen Rejected',    color: 'bg-orange-50 text-orange-600 dark:bg-orange-900/30 dark:text-orange-300 ring-1 ring-orange-200 dark:ring-orange-800' },
  CANTEEN_REGISTERED:  { label: 'Canteen Registered',  color: 'bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-300 ring-1 ring-purple-200 dark:ring-purple-800' },
  MEAL_ADDED:          { label: 'Meal Added',          color: 'bg-teal-50 text-teal-600 dark:bg-teal-900/30 dark:text-teal-300 ring-1 ring-teal-200 dark:ring-teal-800' },
  MEAL_UPDATED:        { label: 'Meal Updated',        color: 'bg-cyan-50 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-300 ring-1 ring-cyan-200 dark:ring-cyan-800' },
  MEAL_DELETED:        { label: 'Meal Deleted',        color: 'bg-rose-50 text-rose-600 dark:bg-rose-900/30 dark:text-rose-300 ring-1 ring-rose-200 dark:ring-rose-800' },
  USER_REGISTERED:     { label: 'User Registered',     color: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-300 ring-1 ring-indigo-200 dark:ring-indigo-800' },
  USER_BLOCKED:        { label: 'User Blocked',        color: 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-300 ring-1 ring-gray-200 dark:ring-gray-600' },
  USER_UNBLOCKED:      { label: 'User Unblocked',      color: 'bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-300 ring-1 ring-green-200 dark:ring-green-800' },
  COMPLAINT_SUBMITTED: { label: 'Complaint',           color: 'bg-yellow-50 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-300 ring-1 ring-yellow-200 dark:ring-yellow-800' },
  COMPLAINT_RESOLVED:  { label: 'Resolved',            color: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-300 ring-1 ring-emerald-200 dark:ring-emerald-800' },
  CANTEEN_VISIBLE:     { label: 'Canteen Visible',     color: 'bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-300 ring-1 ring-green-200 dark:ring-green-800' },
CANTEEN_HIDDEN:      { label: 'Canteen Hidden',      color: 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-300 ring-1 ring-gray-200 dark:ring-gray-600' },
};

const BAR_COLORS = ['#22c55e', '#16a34a', '#4ade80', '#15803d', '#86efac', '#166534'];

const fmt = (n) => (n ?? 0).toLocaleString();
const timeAgo = (dateStr) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
};

const exportCSV = (data) => {
  if (!data.length) return;
  const blob = new Blob(
    ['Canteen,Orders Today\n' + data.map(r => `"${r.canteenName}",${r.totalOrders}`).join('\n')],
    { type: 'text/csv' }
  );
  const a = Object.assign(document.createElement('a'), {
    href: URL.createObjectURL(blob),
    download: `orders_${new Date().toISOString().slice(0, 10)}.csv`,
  });
  a.click();
  URL.revokeObjectURL(a.href);
};

// ── Stat Card ────────────────────────────────────────────────────────────────
const StatCard = ({ icon: Icon, label, value, gradient, loading }) => (
  <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700/60 p-5 flex items-center gap-4 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
    <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center ${gradient}`}>
      <Icon className="w-6 h-6 text-white" strokeWidth={1.8} />
    </div>
    <div className="min-w-0">
      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-0.5">{label}</p>
      {loading
        ? <div className="h-7 w-16 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse mt-1" />
        : <p className="text-2xl font-black text-gray-800 dark:text-white tabular-nums">{fmt(value)}</p>
      }
    </div>
    <div className={`absolute -right-3 -top-3 w-20 h-20 rounded-full opacity-[0.07] ${gradient}`} />
  </div>
);



// ── Main Dashboard ────────────────────────────────────────────────────────────
const AdminDashboard = () => {
  const { theme } = useTheme();

  const [stats, setStats]           = useState({ totalUsers: 0, totalApprovedCanteens: 0, totalOrders: 0 });
  const [chartData, setChartData]   = useState([]);
  const [activities, setActivities] = useState([]);
  const [actTotal, setActTotal]     = useState(0);
  const [page, setPage]             = useState(1);
  const LIMIT = 8;

  const [loadingStats, setLoadingStats]         = useState(true);
  const [loadingChart, setLoadingChart]         = useState(true);
  const [loadingActivity, setLoadingActivity]   = useState(true);
  const [refreshing, setRefreshing]             = useState(false);
  const [lastRefresh, setLastRefresh]           = useState(new Date());
  const chartScrollRef = useRef(null);

  const scrollChart = (dir) => {
    const el = chartScrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * 200, behavior: 'smooth' });
  };

  const fetchStats = useCallback(async () => {
    try {
      const res = await authFetch('/api/admin/dashboard/stats');
      const json = await res.json();
      if (json.success) setStats(json.data);
    } catch {}
    finally { setLoadingStats(false); }
  }, []);

  const fetchChart = useCallback(async () => {
    try {
      const res = await authFetch('/api/admin/dashboard/orders-by-canteen');
      const json = await res.json();
      if (json.success) setChartData(json.data);
    } catch {}
    finally { setLoadingChart(false); }
  }, []);

  const fetchActivity = useCallback(async (p = 1) => {
    setLoadingActivity(true);
    try {
      const res = await authFetch(`/api/admin/dashboard/activity?page=${p}&limit=${LIMIT}`);
      const json = await res.json();
      if (json.success) { setActivities(json.data); setActTotal(json.total); }
    } catch {}
    finally { setLoadingActivity(false); }
  }, []);

  useEffect(() => { fetchStats(); fetchChart(); fetchActivity(1); }, []);
  useEffect(() => { fetchActivity(page); }, [page]);

  const handleRefresh = async () => {
    setRefreshing(true);
    setLoadingStats(true); setLoadingChart(true);
    await Promise.all([fetchStats(), fetchChart(), fetchActivity(page)]);
    setLastRefresh(new Date());
    setRefreshing(false);
  };

  const totalPages = Math.ceil(actTotal / LIMIT);

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-gray-50 dark:bg-gray-900">

      {/* ── Header ── */}
      <AdminHeader
        title="Dashboard"
        subtitle={new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        onRefresh={handleRefresh}
        refreshing={refreshing}
        lastRefresh={lastRefresh}
        adminName="Admin"
      />

      {/* ── Scrollable content ── */}
      <div
  className="flex-1 overflow-y-auto px-5 py-4 space-y-4"
  style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
>
  <style>{`/* hide main page scrollbar */ .flex-1::-webkit-scrollbar { display: none; }`}</style>

        {/* Stat Cards */}
        <div className="grid grid-cols-3 gap-4">
          <StatCard icon={Users}       label="Total Users"       value={stats.totalUsers}            gradient="bg-indigo-500"      loading={loadingStats} />
          <StatCard icon={Store}       label="Approved Canteens" value={stats.totalApprovedCanteens} gradient="bg-primary-500"     loading={loadingStats} />
          <StatCard icon={ShoppingBag} label="Total Orders"      value={stats.totalOrders}           gradient="bg-amber-500"       loading={loadingStats} />
        </div>

        {/* ── Chart + Activity side by side ── */}
        <div className="grid grid-cols-5 gap-4" style={{ minHeight: 0 }}>

          {/* Bar Chart — 3/5 width */}
          <div className="col-span-3 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700/60 p-5 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-primary-500" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-800 dark:text-white">Orders by Canteen</h3>
                  <p className="text-[11px] text-gray-400 dark:text-gray-500">Today's distribution</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {/* Scroll arrows — only show when there's data */}
                {chartData.length > 0 && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => scrollChart(-1)}
                      className="w-6 h-6 flex items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-primary-50 dark:hover:bg-primary-900/30 hover:text-primary-500 transition-colors"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => scrollChart(1)}
                      className="w-6 h-6 flex items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-primary-50 dark:hover:bg-primary-900/30 hover:text-primary-500 transition-colors"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
                <button
                  onClick={() => exportCSV(chartData)}
                  disabled={!chartData.length}
                  className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <Download className="w-3 h-3" />
                  Export CSV
                </button>
              </div>
            </div>

            {/* Vertical Bar Chart — horizontally scrollable, hidden scrollbar */}
            <div
              ref={chartScrollRef}
              className="flex-1 overflow-y-hidden chart-scroll"
              style={{
                overflowX: 'auto',
                minHeight: 200,  
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
              }}
            >
              <style>{`.chart-scroll::-webkit-scrollbar { display: none; }`}</style>
              {loadingChart ? (
                <div className="flex items-end gap-4 h-full px-2 pb-6">
                  {[60, 85, 45, 90, 55].map((h, i) => (
                    <div key={i} className="flex flex-col items-center gap-2 animate-pulse flex-shrink-0" style={{ width: 56 }}>
                      <div className="w-full rounded-t-lg bg-gray-200 dark:bg-gray-700" style={{ height: `${h}%` }} />
                      <div className="h-2 w-14 bg-gray-200 dark:bg-gray-700 rounded" />
                    </div>
                  ))}
                </div>
              ) : chartData.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-300 dark:text-gray-600 py-10">
                  <ShoppingBag className="w-10 h-10 mb-2" />
                  <p className="text-sm font-medium">No orders today</p>
                </div>
              ) : (
                // minWidth: each bar gets 80px — scrolls when canteens exceed visible area
                <div style={{ minWidth: Math.max(chartData.length * 80 + 60, 300), height: '100%' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={chartData}
                      margin={{ top: 16, right: 20, left: -10, bottom: 8 }}
                      barSize={40}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#1f2937' : '#f3f4f6'} vertical={false} />
                      <XAxis
                        dataKey="canteenName"
                        tick={{ fontSize: 11, fill: theme === 'dark' ? '#6b7280' : '#9ca3af' }}
                        axisLine={false}
                        tickLine={false}
                        interval={0}
                      />
                     <YAxis
                        allowDecimals={false}
                        tick={{ fontSize: 11, fill: theme === 'dark' ? '#6b7280' : '#9ca3af' }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(value) => value % 2 === 0 ? value : ''}
                         interval={0}
                      />
                      <Tooltip
                        cursor={{ fill: theme === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)', radius: 6 }}
                        content={({ active, payload }) => {
                          if (!active || !payload?.length) return null;
                          return (
                            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl shadow-xl px-3 py-2 text-xs">
                              <p className="font-bold text-gray-700 dark:text-gray-200 mb-0.5">{payload[0].payload.canteenName}</p>
                              <p className="text-primary-500 font-black text-lg leading-none">{payload[0].value} <span className="text-gray-400 text-xs font-normal">orders</span></p>
                            </div>
                          );
                        }}
                      />
                      <Bar dataKey="totalOrders" radius={[6, 6, 0, 0]}>
                        {chartData.map((_, i) => (
                          <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                        ))}
                        <LabelList
                          dataKey="totalOrders"
                          position="top"
                          style={{ fontSize: 11, fontWeight: 700, fill: theme === 'dark' ? '#9ca3af' : '#6b7280' }}
                        />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>

          {/* Activity Feed — 2/5 width */}
          <div className="col-span-2 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700/60 flex flex-col overflow-hidden">
            {/* Header */}
            <div className="px-4 py-3.5 border-b border-gray-100 dark:border-gray-700/60 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center">
                  <Activity className="w-4 h-4 text-primary-500" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-800 dark:text-white">System Activity</h3>
                  <p className="text-[11px] text-gray-400 dark:text-gray-500">{actTotal} total events</p>
                </div>
              </div>
            </div>

            {/* Activity list */}
            <div className="flex-1 overflow-y-auto">
              {loadingActivity ? (
                <div className="p-3 space-y-2">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3 p-2 animate-pulse">
                      <div className="h-5 w-24 bg-gray-200 dark:bg-gray-700 rounded-full flex-shrink-0" />
                      <div className="h-3 flex-1 bg-gray-100 dark:bg-gray-700/60 rounded" />
                    </div>
                  ))}
                </div>
              ) : activities.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-300 dark:text-gray-600 py-8">
                  <Activity className="w-8 h-8 mb-2" />
                  <p className="text-sm">No activity yet</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-50 dark:divide-gray-700/50">
                  {activities.map((act) => {
                    const cfg = ACTIVITY_CONFIG[act.type] || { label: act.type, color: 'bg-gray-100 text-gray-500 ring-1 ring-gray-200' };
                    return (
                      <div key={act._id} className="px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700/20 transition-colors">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold flex-shrink-0 ${cfg.color}`}>
                            {cfg.label}
                          </span>
                          <span className="text-[10px] text-gray-400 dark:text-gray-500 whitespace-nowrap flex-shrink-0">
                            {timeAgo(act.createdAt)}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 truncate">{act.description}</p>
                        {act.performedBy?.name && (
                          <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">
                            {act.performedBy.name}
                            <span className="ml-1 opacity-60">· {act.performedBy.role}</span>
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-4 py-2.5 border-t border-gray-100 dark:border-gray-700/60 flex items-center justify-between flex-shrink-0">
                <span className="text-[11px] text-gray-400 dark:text-gray-500">
                  {page} / {totalPages}
                </span>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-30 transition-colors"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-30 transition-colors"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};


export default AdminDashboard;