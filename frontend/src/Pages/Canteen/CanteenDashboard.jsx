//frontend/src/pages/Canteen/CanteenDashboard.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  ShoppingBag, Clock, UtensilsCrossed, DollarSign,
  CheckCircle, XCircle, ChefHat, Package, Star,
  Plus, Eye, RefreshCw, Loader2, TrendingUp, Zap, TicketCheck
} from 'lucide-react';

const API = '/api/canteen/dashboard';

const STATUS_CONFIG = {
  pending:   { label: 'Pending',   color: 'bg-yellow-400', text: 'text-yellow-600 dark:text-yellow-400' },
  accepted:  { label: 'Accepted',  color: 'bg-blue-400',   text: 'text-blue-600 dark:text-blue-400'     },
  preparing: { label: 'Preparing', color: 'bg-purple-400', text: 'text-purple-600 dark:text-purple-400' },
  ready:     { label: 'Ready',     color: 'bg-green-400',  text: 'text-green-600 dark:text-green-400'   },
  completed: { label: 'Completed', color: 'bg-gray-400',   text: 'text-gray-600 dark:text-gray-400'     },
  cancelled: { label: 'Cancelled', color: 'bg-red-400',    text: 'text-red-600 dark:text-red-400'       },
};

export default function CanteenDashboard() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate              = useNavigate();

 const { user, token } = useAuth();
const canteen = user?.canteenName || user?.name || 'My Canteen';

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const r = await fetch(API, { headers: { Authorization: `Bearer ${token}` } });
      const j = await r.json();
      if (j.success) setData(j.data);
    } catch (e) {
      console.error(e);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchDashboard(); }, []);

  const now  = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';

  if (loading) return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900 items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-green-500" />
      <p className="text-sm text-gray-400 mt-3">Loading dashboard...</p>
    </div>
  );

  const totalOrders    = data?.orderStatusBreakdown?.reduce((s, o) => s + o.count, 0) || 0;
  const statusTotal    = totalOrders || 1;

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-gray-50 dark:bg-gray-900">

      {/* Header */}
      <div className="flex-shrink-0 px-6 py-4 bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700/60 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-900 dark:text-white">
            {greeting}, {canteen} 👋
          </h1>
          <p className="text-xs text-gray-400">
            {now.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <button onClick={fetchDashboard}
          className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5" style={{ scrollbarWidth: 'none' }}>

        {/* ── 4 Summary Cards ── */}
        <div className="grid grid-cols-4 gap-4">
          {[
            {
              label: "Today's Orders",
              value: data?.todayOrders ?? 0,
              icon: ShoppingBag,
              color: 'bg-blue-500',
              bg: 'bg-blue-50 dark:bg-blue-900/10',
              sub: 'orders placed today',
            },
            {
              label: 'Pending Meals',
              value: data?.pendingOrders ?? 0,
              icon: Clock,
              color: 'bg-yellow-500',
              bg: 'bg-yellow-50 dark:bg-yellow-900/10',
              sub: 'awaiting action',
            },
            {
              label: 'Total Meals',
              value: data?.totalMeals ?? 0,
              icon: UtensilsCrossed,
              color: 'bg-green-500',
              bg: 'bg-green-50 dark:bg-green-900/10',
              sub: 'on your menu',
            },
            {
              label: "Today's Revenue",
              value: `Rs. ${(data?.todayRevenue ?? 0).toLocaleString()}`,
              icon: DollarSign,
              color: 'bg-purple-500',
              bg: 'bg-purple-50 dark:bg-purple-900/10',
              sub: 'from completed orders',
            },
          ].map(({ label, value, icon: Icon, color, bg, sub }) => (
            <div key={label} className={`${bg} rounded-2xl border border-gray-100 dark:border-gray-700/60 p-5`}>
              <div className="flex items-start justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <TrendingUp className="w-4 h-4 text-gray-300 dark:text-gray-600" />
              </div>
              <p className="text-2xl font-black text-gray-800 dark:text-white">{value}</p>
              <p className="text-xs font-bold text-gray-600 dark:text-gray-300 mt-0.5">{label}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">{sub}</p>
            </div>
          ))}
        </div>

        {/* ── Middle row ── */}
        <div className="grid grid-cols-3 gap-5">

          {/* Order Status Overview */}
          <div className="col-span-2 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700/60 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-800 dark:text-white">Order Status Overview</h2>
              <button onClick={() => navigate('/canteen/orders')}
                className="text-xs font-semibold text-green-500 hover:text-green-600 flex items-center gap-1">
                <Eye className="w-3.5 h-3.5" /> View All
              </button>
            </div>

            {!data?.orderStatusBreakdown?.length ? (
              <div className="flex items-center justify-center h-24 text-gray-400">
                <p className="text-sm">No orders yet today</p>
              </div>
            ) : (
              <div className="space-y-3">
                {Object.entries(STATUS_CONFIG).map(([status, cfg]) => {
                  const found = data.orderStatusBreakdown.find(o => o._id === status);
                  const count = found?.count || 0;
                  const pct   = Math.round((count / statusTotal) * 100);
                  return (
                    <div key={status} className="flex items-center gap-3">
                      <span className={`text-xs font-bold w-20 ${cfg.text}`}>{cfg.label}</span>
                      <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-full h-2.5">
                        <div className={`${cfg.color} h-2.5 rounded-full transition-all duration-700`}
                          style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-xs font-black text-gray-700 dark:text-gray-200 w-6 text-right">{count}</span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Total */}
            <div className="mt-4 pt-4 border-t border-gray-50 dark:border-gray-700/50 flex items-center justify-between">
              <p className="text-xs text-gray-400">Total orders (all time)</p>
              <p className="text-sm font-black text-gray-700 dark:text-gray-200">{totalOrders}</p>
            </div>
          </div>

          {/* Popular Meals */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700/60 p-5">
            <div className="flex items-center gap-2 mb-4">
              <Star className="w-4 h-4 text-yellow-500 fill-yellow-400" />
              <h2 className="font-bold text-gray-800 dark:text-white">Popular Meals</h2>
            </div>

            {!data?.popularMeals?.length ? (
              <div className="flex items-center justify-center h-24 text-gray-400">
                <p className="text-sm">No data yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {data.popularMeals.slice(0, 5).map((meal, i) => {
                  const medals = ['🥇', '🥈', '🥉'];
                  return (
                    <div key={meal.name} className="flex items-center gap-2">
                      <span className="text-base w-6">{medals[i] || `#${i + 1}`}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-800 dark:text-white truncate">{meal.name}</p>
                        <p className="text-[10px] text-gray-400">{meal.totalOrders} orders</p>
                      </div>
                      <span className="text-xs font-black text-green-600 dark:text-green-400 flex-shrink-0">
                        Rs.{meal.totalRevenue?.toLocaleString()}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            <button onClick={() => navigate('/canteen/revenue')}
              className="w-full mt-4 pt-3 border-t border-gray-50 dark:border-gray-700/50 text-xs font-semibold text-green-500 hover:text-green-600 text-center">
              View Revenue →
            </button>
          </div>
        </div>

        {/* ── Quick Actions ── */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700/60 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-4 h-4 text-yellow-500" />
            <h2 className="font-bold text-gray-800 dark:text-white">Quick Actions</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              { label: 'Add Meal',      icon: Plus,          color: 'bg-green-500',  href: '/canteen/meals'    },
              { label: 'View Orders',   icon: ShoppingBag,   color: 'bg-blue-500',   href: '/canteen/orders'   },
              { label: 'Queue',         icon: TicketCheck,   color: 'bg-emerald-500', href: '/canteen/queue'   },
              { label: 'Edit Profile',  icon: UtensilsCrossed, color: 'bg-purple-500', href: '/canteen/profile' },
              { label: 'View Revenue',  icon: DollarSign,    color: 'bg-yellow-500', href: '/canteen/revenue'  },
            ].map(({ label, icon: Icon, color, href }) => (
              <button key={label} onClick={() => navigate(href)}
                className="flex flex-col items-center gap-2 p-4 rounded-xl border border-gray-100 dark:border-gray-700/60 hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-all group">
                <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <p className="text-xs font-semibold text-gray-600 dark:text-gray-300">{label}</p>
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
