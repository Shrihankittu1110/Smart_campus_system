//frontend/src/pages/Canteen/OrdersPage.jsx

import { useState, useEffect } from 'react';
import {
  ShoppingBag, Clock, CheckCircle, XCircle, ChefHat,
  Loader2, Search, Eye, X, ChevronDown,
  Mail, Phone, User, RefreshCw
} from 'lucide-react';

const API = '/api/canteen/orders';

const STATUSES = ['pending', 'accepted', 'preparing', 'ready', 'completed', 'cancelled'];

const STATUS_CONFIG = {
  pending:    { label: 'Pending',    color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400', dot: 'bg-yellow-400' },
  accepted:   { label: 'Accepted',   color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',         dot: 'bg-blue-400'   },
  preparing:  { label: 'Preparing',  color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400', dot: 'bg-purple-400' },
  ready:      { label: 'Ready',      color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',     dot: 'bg-green-400'  },
  completed:  { label: 'Completed',  color: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300',            dot: 'bg-gray-400'   },
  cancelled:  { label: 'Cancelled',  color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',             dot: 'bg-red-400'    },
};

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${cfg.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

function Toast({ toast }) {
  if (!toast) return null;
  return (
    <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg text-sm font-semibold flex items-center gap-2 ${
      toast.type === 'error' ? 'bg-red-500' : 'bg-green-500'} text-white`}>
      {toast.type === 'error' ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
      {toast.msg}
    </div>
  );
}

export default function OrdersPage() {
  const [orders, setOrders]             = useState([]);
  const [loading, setLoading]           = useState(true);
  const [toast, setToast]               = useState(null);
  const [search, setSearch]             = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [selected, setSelected]         = useState(null);
  const [updating, setUpdating]         = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  // ✅ Update both orders list and open modal simultaneously
  const updateOrderState = (orderId, status) => {
    setOrders(prev => prev.map(o => o._id === orderId ? { ...o, status } : o));
    setSelected(prev => prev?._id === orderId ? { ...prev, status } : prev);
  };

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const r = await fetch(API, { headers: { Authorization: `Bearer ${token}` } });
      const j = await r.json();
      if (j.success) {
        setOrders(j.data);
        setSelected(prev => {
          if (!prev) return prev;
          const updated = j.data.find(o => o._id === prev._id);
          return updated || prev;
        });
      }
    } catch { showToast('Failed to load orders', 'error'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchOrders(); }, []);

  // ── Accept ────────────────────────────────────────────────────────────────
  const handleAccept = async (orderId) => {
    setUpdating(orderId);
    try {
      const token = localStorage.getItem('token');
      const r = await fetch(`${API}/${orderId}/accept`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.message);
      updateOrderState(orderId, 'accepted');
      showToast('Order accepted! Email sent to student.');
    } catch (err) { showToast(err.message || 'Failed', 'error'); }
    finally { setUpdating(null); }
  };

  // ── Reject ────────────────────────────────────────────────────────────────
  const handleReject = async (orderId) => {
    setUpdating(orderId);
    try {
      const token = localStorage.getItem('token');
      const r = await fetch(`${API}/${orderId}/reject`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.message);
      updateOrderState(orderId, 'cancelled');
      showToast('Order rejected. Email sent to student.');
    } catch (err) { showToast(err.message || 'Failed', 'error'); }
    finally { setUpdating(null); }
  };

  // ── Status change ─────────────────────────────────────────────────────────
  const handleStatusChange = async (orderId, status) => {
    setUpdating(orderId);
    try {
      const token = localStorage.getItem('token');
      const r = await fetch(`${API}/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.message);
      updateOrderState(orderId, status);
      showToast(`Status updated to ${STATUS_CONFIG[status].label}!`);
    } catch (err) { showToast(err.message || 'Failed', 'error'); }
    finally { setUpdating(null); }
  };

  // ── Filter ────────────────────────────────────────────────────────────────
  const filtered = orders.filter(o => {
    const matchSearch = o.studentName?.toLowerCase().includes(search.toLowerCase()) ||
      o._id?.toString().slice(-6).includes(search);
    const matchStatus = filterStatus === 'All' || o.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const stats = {
    total:     orders.length,
    pending:   orders.filter(o => o.status === 'pending').length,
    preparing: orders.filter(o => o.status === 'preparing').length,
    completed: orders.filter(o => o.status === 'completed').length,
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-gray-50 dark:bg-gray-900">
      <Toast toast={toast} />

      {/* Header */}
      <div className="flex-shrink-0 px-6 py-4 bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700/60 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-900 dark:text-white">Orders</h1>
          <p className="text-xs text-gray-400">{stats.pending} pending · {stats.preparing} preparing</p>
        </div>
        <button onClick={fetchOrders}
          className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Stat cards */}
      <div className="flex-shrink-0 grid grid-cols-4 gap-4 px-6 py-4">
        {[
          { label: 'Total Orders',  value: stats.total,     icon: ShoppingBag, color: 'bg-blue-500'   },
          { label: 'Pending',       value: stats.pending,   icon: Clock,       color: 'bg-yellow-500' },
          { label: 'Preparing',     value: stats.preparing, icon: ChefHat,     color: 'bg-purple-500' },
          { label: 'Completed',     value: stats.completed, icon: CheckCircle, color: 'bg-green-500'  },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700/60 p-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center`}>
              <Icon className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-black text-gray-800 dark:text-white">{value}</p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex-shrink-0 px-6 pb-3 flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by student name or order ID..."
            className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400 transition-all" />
        </div>
        <div className="relative">
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            className="appearance-none pl-3 pr-8 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-green-400 transition-all cursor-pointer">
            <option value="All">All Status</option>
            {STATUSES.map(s => <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>)}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
        </div>
        <span className="text-xs text-gray-400">{filtered.length} orders</span>
      </div>

      {/* Orders table */}
      <div className="flex-1 overflow-y-auto px-6 pb-5" style={{ scrollbarWidth: 'none' }}>
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="w-7 h-7 animate-spin text-green-500" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-gray-400">
            <p className="text-4xl mb-3">🛍️</p>
            <p className="font-semibold">No orders found</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700/60 overflow-hidden">
            <div className="grid grid-cols-12 gap-3 px-5 py-3 bg-gray-50 dark:bg-gray-700/30 border-b border-gray-100 dark:border-gray-700/60">
              {['Order ID', 'Student', 'Items', 'Total', 'Time', 'Status', 'Actions'].map((h, i) => (
                <div key={h} className={`text-[10px] font-bold uppercase tracking-widest text-gray-400 ${
                  i === 0 ? 'col-span-1' : i === 1 ? 'col-span-2' : i === 2 ? 'col-span-3' :
                  i === 3 ? 'col-span-1' : i === 4 ? 'col-span-2' : i === 5 ? 'col-span-2' : 'col-span-1'
                }`}>{h}</div>
              ))}
            </div>
            <div className="divide-y divide-gray-50 dark:divide-gray-700/50">
              {filtered.map(order => (
                <div key={order._id} className="grid grid-cols-12 gap-3 px-5 py-3.5 items-center hover:bg-gray-50/50 dark:hover:bg-gray-700/20 transition-colors">
                  <div className="col-span-1">
                    <p className="text-xs font-mono font-bold text-gray-500 dark:text-gray-400">
                      #{order._id?.toString().slice(-6).toUpperCase()}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm font-semibold text-gray-800 dark:text-white truncate">{order.studentName || 'Student'}</p>
                    <p className="text-[10px] text-gray-400 truncate">{order.studentEmail || ''}</p>
                  </div>
                  <div className="col-span-3">
                    <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2">
                      {order.items?.map(i => `${i.name} x${i.quantity}`).join(', ') || '-'}
                    </p>
                  </div>
                  <div className="col-span-1">
                    <p className="text-sm font-black text-green-600 dark:text-green-400">Rs.{order.totalAmount}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <p className="text-[10px] text-gray-400">{new Date(order.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="col-span-2">
                    <StatusBadge status={order.status} />
                  </div>
                  <div className="col-span-1">
                    <button onClick={() => setSelected(order)}
                      className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-500 flex items-center justify-center hover:bg-blue-100 transition-colors">
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Order Detail Modal ── */}
      {selected && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setSelected(null); }}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl" style={{ scrollbarWidth: 'none' }}>

            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-700/60">
              <div>
                <h2 className="font-bold text-gray-800 dark:text-white">
                  Order #{selected._id?.toString().slice(-6).toUpperCase()}
                </h2>
                <p className="text-xs text-gray-400">{new Date(selected.createdAt).toLocaleString()}</p>
              </div>
              {/* ✅ Close button */}
              <button onClick={() => setSelected(null)}
                className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            <div className="p-5 space-y-4">

              {/* Student info */}
              <div className="bg-gray-50 dark:bg-gray-700/30 rounded-xl p-4 space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Student Info</p>
                <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <User className="w-4 h-4 text-gray-400" />{selected.studentName || 'N/A'}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <Mail className="w-4 h-4 text-gray-400" />{selected.studentEmail || 'N/A'}
                </div>
                {selected.studentPhone && (
                  <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                    <Phone className="w-4 h-4 text-gray-400" />{selected.studentPhone}
                  </div>
                )}
              </div>

              {/* Order items */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Order Items</p>
                <div className="space-y-2">
                  {selected.items?.map((item, i) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 dark:border-gray-700/50 last:border-0">
                      <div>
                        <p className="text-sm font-semibold text-gray-800 dark:text-white">{item.name}</p>
                        {item.size && <p className="text-[10px] text-gray-400">Size: {item.size}</p>}
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">x{item.quantity}</p>
                        <p className="text-sm font-bold text-green-600">Rs.{item.price * item.quantity}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-100 dark:border-gray-700/60">
                  <p className="font-bold text-gray-700 dark:text-gray-200">Total</p>
                  <p className="font-black text-green-600 dark:text-green-400 text-lg">Rs.{selected.totalAmount}</p>
                </div>
              </div>

              {/* Current status */}
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Current Status</p>
                <StatusBadge status={selected.status} />
              </div>

              {/* ✅ Accept / Reject — only for pending */}
              {selected.status === 'pending' && (
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => handleAccept(selected._id)} disabled={!!updating}
                    className="flex items-center justify-center gap-2 py-2.5 bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white text-sm font-bold rounded-xl transition-colors">
                    {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                    Accept Order
                  </button>
                  <button onClick={() => handleReject(selected._id)} disabled={!!updating}
                    className="flex items-center justify-center gap-2 py-2.5 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white text-sm font-bold rounded-xl transition-colors">
                    {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                    Reject Order
                  </button>
                </div>
              )}

              {/* ✅ Status update — for accepted/preparing/ready */}
              {['accepted', 'preparing', 'ready'].includes(selected.status) && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Update Status</p>
                  <div className="grid grid-cols-3 gap-2">
                    {STATUSES.filter(s => !['pending', 'cancelled'].includes(s)).map(s => (
                      <button key={s}
                        onClick={() => handleStatusChange(selected._id, s)}
                        disabled={selected.status === s || !!updating}
                        className={`py-2 text-xs font-bold rounded-xl transition-colors ${
                          selected.status === s
                            ? 'bg-green-500 text-white'
                            : 'border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                        } disabled:opacity-50`}>
                        {STATUS_CONFIG[s].label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <p className="text-[11px] text-gray-400 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5" />
                Email notification is sent automatically on accept/reject
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}