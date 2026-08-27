import React, { useEffect, useState, useCallback } from 'react';
import AdminHeader from './components/AdminHeader';
import { authFetch } from '../../utils/authFetch';
import {
  MessageSquare, Clock, CheckCircle, XCircle, Search,
  Filter, RefreshCw, Eye, Mail, ChevronDown,
  AlertTriangle, User, Store, Tag,
  Send, Paperclip, X, InboxIcon,
} from 'lucide-react';

const fmtDate  = (d) => d ? new Date(d).toLocaleDateString('en-US', { day:'numeric', month:'short', year:'numeric' }) : '—';
const fmtTime  = (d) => d ? new Date(d).toLocaleString('en-US', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' }) : '—';
const getId    = (id) => id ? String(id).slice(-6).toUpperCase() : '??????';

const imgUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('data:') || path.startsWith('http') || path.startsWith('blob:')) return path;
  const base = import.meta.env.VITE_API_URL || '';
  return `${base}${path}`;
};

const STATUS = {
  pending:   { label: 'Pending',   color: 'bg-yellow-50 text-yellow-600 ring-1 ring-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:ring-yellow-800',   dot: 'bg-yellow-500'  },
  inreview:  { label: 'In Review', color: 'bg-blue-50 text-blue-600 ring-1 ring-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:ring-blue-800',               dot: 'bg-blue-500'    },
  resolved:  { label: 'Resolved',  color: 'bg-green-50 text-green-600 ring-1 ring-green-200 dark:bg-green-900/20 dark:text-green-400 dark:ring-green-800',         dot: 'bg-green-500'   },
  closed:    { label: 'Closed',    color: 'bg-gray-100 text-gray-500 ring-1 ring-gray-200 dark:bg-gray-700 dark:text-gray-400 dark:ring-gray-600',                 dot: 'bg-gray-400'    },
};

const FILTERS = [
  { key: 'all',      label: 'All'       },
  { key: 'pending',  label: 'Pending'   },
  { key: 'inreview', label: 'In Review' },
  { key: 'resolved', label: 'Resolved'  },
  { key: 'closed',   label: 'Closed'    },
];

const StatusBadge = ({ status }) => {
  const cfg = STATUS[status] || STATUS.pending;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${cfg.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
};

const StatCard = ({ icon: Icon, label, value, color, loading }) => (
  <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700/60 p-5 flex items-center gap-4 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
    <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
      <Icon className="w-6 h-6 text-white" strokeWidth={1.8} />
    </div>
    <div>
      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-0.5">{label}</p>
      {loading ? <div className="h-7 w-16 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse mt-1" />
               : <p className="text-2xl font-black text-gray-800 dark:text-white tabular-nums">{value ?? 0}</p>}
    </div>
    <div className={`absolute -right-3 -top-3 w-20 h-20 rounded-full opacity-[0.07] ${color}`} />
  </div>
);

const EmailModal = ({ complaint, onClose, onSend, sending }) => {
  const [subject, setSubject] = useState(`Re: Complaint #${getId(complaint?._id)} — ${complaint?.category || ''}`);
  const [body, setBody]       = useState('');
  if (!complaint) return null;
  const recipientEmail = complaint.submittedByEmail || '';
  const recipientName  = complaint.submittedByName  || 'User';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
              <Mail className="w-4 h-4 text-blue-500" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">Send Email</h3>
              <p className="text-[10px] text-gray-400">To: {recipientName} · {recipientEmail}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="px-6 py-3 bg-gray-50 dark:bg-gray-700/30 border-b border-gray-100 dark:border-gray-700">
          <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400 mb-1">Regarding Complaint</p>
          <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 truncate">#{getId(complaint._id)} — {complaint.category} · <StatusBadge status={complaint.status} /></p>
        </div>
        <div className="px-6 py-4 space-y-3">
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wide text-gray-400 mb-1 block">Subject</label>
            <input value={subject} onChange={e => setSubject(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all" />
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wide text-gray-400 mb-1 block">Message</label>
            <textarea value={body} onChange={e => setBody(e.target.value)} rows={5}
              placeholder={`Dear ${recipientName},\n\nRegarding your complaint...`}
              className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none transition-all" />
          </div>
        </div>
        <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-700 flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 text-sm font-semibold rounded-xl border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">Cancel</button>
          <button onClick={() => onSend({ complaintId: complaint._id, to: recipientEmail, subject, body })}
            disabled={sending || !body.trim() || !recipientEmail}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold rounded-xl bg-blue-500 hover:bg-blue-600 text-white disabled:opacity-50 transition-colors">
            {sending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Send Email
          </button>
        </div>
      </div>
    </div>
  );
};

const DetailModal = ({ complaint, onClose, onStatusChange, onEmail, statusLoading }) => {
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  if (!complaint) return null;

  const resolvedCanteenName =
    (complaint.canteenName && complaint.canteenName !== '—' ? complaint.canteenName : null) ||
    (complaint.canteen?.name ? complaint.canteen.name : null);

  const STATUS_ACTIONS = [
    { key: 'pending',  label: 'Mark Pending',   icon: Clock,       cls: 'text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-900/20' },
    { key: 'inreview', label: 'Mark In Review',  icon: Eye,         cls: 'text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20'       },
    { key: 'resolved', label: 'Mark Resolved',   icon: CheckCircle, cls: 'text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20'    },
    { key: 'closed',   label: 'Mark Closed',     icon: XCircle,     cls: 'text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700/50'       },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg border border-gray-200 dark:border-gray-700 overflow-hidden max-h-[90vh] flex flex-col">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-start justify-between flex-shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-black text-gray-400 dark:text-gray-500">#{getId(complaint._id)}</span>
              <StatusBadge status={complaint.status} />
            </div>
            <h2 className="text-base font-bold text-gray-900 dark:text-white">{complaint.category}</h2>
            <p className="text-[11px] text-gray-400 mt-0.5">{fmtTime(complaint.createdAt)}</p>
          </div>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 flex-shrink-0 mt-1">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {resolvedCanteenName && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800">
              <Store className="w-4 h-4 text-purple-500 flex-shrink-0" />
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wide text-purple-400 mb-0.5">
                  {complaint.submitterType === 'canteen' ? 'Submitted By Canteen' : 'Complaint About'}
                </p>
                <p className="text-sm font-bold text-purple-700 dark:text-purple-300">{resolvedCanteenName}</p>
              </div>
            </div>
          )}
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
            <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400 mb-2">Description</p>
            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
              {complaint.description || 'No description provided.'}
            </p>
          </div>
          {complaint.attachment && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400 mb-2">Attachment</p>
              <div className="rounded-xl overflow-hidden border border-gray-200 dark:border-gray-600">
                <img src={imgUrl(complaint.attachment)} alt="Complaint attachment"
                  className="w-full max-h-64 object-contain bg-gray-50 dark:bg-gray-700"
                  onError={(e) => { e.target.style.display = 'none'; }} />
              </div>
              <a href={imgUrl(complaint.attachment)} target="_blank" rel="noreferrer"
                className="inline-flex items-center gap-1.5 mt-2 text-xs text-blue-500 hover:text-blue-600 font-semibold">
                <Paperclip className="w-3.5 h-3.5" /> View full image
              </a>
            </div>
          )}
        </div>
        <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-700 flex items-center gap-3 flex-shrink-0">
          <button onClick={() => onEmail(complaint)}
            className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-bold rounded-xl bg-blue-500 hover:bg-blue-600 text-white transition-colors">
            <Mail className="w-4 h-4" /> Email User
          </button>
          <div className="relative">
            <button onClick={() => setShowStatusMenu(v => !v)} disabled={statusLoading}
              className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-bold rounded-xl border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors">
              {statusLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ChevronDown className="w-4 h-4" />}
              Change Status
            </button>
            {showStatusMenu && (
              <div className="absolute bottom-full mb-2 left-0 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 py-1 min-w-44 z-10">
                {STATUS_ACTIONS.map(({ key, label, icon: Icon, cls }) => (
                  <button key={key} onClick={() => { onStatusChange(complaint._id, key); setShowStatusMenu(false); }}
                    className={`w-full flex items-center gap-2 px-4 py-2 text-sm font-semibold transition-colors ${cls} ${complaint.status === key ? 'opacity-40 cursor-not-allowed' : ''}`}
                    disabled={complaint.status === key}>
                    <Icon className="w-3.5 h-3.5" /> {label}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button onClick={onClose} className="ml-auto px-4 py-2.5 text-sm font-semibold rounded-xl border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

const Toast = ({ toast }) => {
  if (!toast) return null;
  return (
    <div className={`fixed top-4 right-4 z-[60] px-4 py-3 rounded-xl shadow-lg text-sm font-semibold flex items-center gap-2 ${toast.type === 'error' ? 'bg-red-500' : 'bg-green-500'} text-white`}>
      {toast.type === 'error' ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
      {toast.msg}
    </div>
  );
};

const LIMIT = 20;

const ComplaintManagement = () => {
  const [complaints, setComplaints]       = useState([]);
  const [allComplaints, setAllComplaints] = useState([]);
  const [stats, setStats]                 = useState({ total: 0, pending: 0, resolved: 0 });
  const [loading, setLoading]             = useState(true);
  const [statsLoading, setStatsLoading]   = useState(true);
  const [selected, setSelected]           = useState(null);
  const [emailTarget, setEmailTarget]     = useState(null);
  const [search, setSearch]               = useState('');
  const [filterStatus, setFilterStatus]   = useState('all');
  const [filterType, setFilterType]       = useState('all');
  const [statusLoading, setStatusLoading] = useState(false);
  const [emailSending, setEmailSending]   = useState(false);
  const [toast, setToast]                 = useState(null);
  const [page, setPage]                   = useState(1);
  const [total, setTotal]                 = useState(0);

  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3500); };

  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const r = await authFetch('/api/admin/complaints/stats');
      const j = await r.json();
      if (j.success) setStats(j.data);
    } catch {} finally { setStatsLoading(false); }
  }, []);

  const fetchComplaints = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const r = await authFetch(`/api/admin/complaints?page=${p}&limit=${LIMIT}`);
      const j = await r.json();
      if (j.success) {
        setAllComplaints(j.data);
        setComplaints(j.data);
        setTotal(j.total);
      }
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchStats(); fetchComplaints(1); }, []);

  useEffect(() => {
    let result = allComplaints;
    if (filterStatus !== 'all') result = result.filter(c => c.status === filterStatus);
    if (filterType   !== 'all') result = result.filter(c => c.submitterType === filterType);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(c =>
        getId(c._id).toLowerCase().includes(q) ||
        c.submittedByName?.toLowerCase().includes(q) ||
        c.submittedByEmail?.toLowerCase().includes(q) ||
        c.category?.toLowerCase().includes(q) ||
        c.description?.toLowerCase().includes(q) ||
        c.canteenName?.toLowerCase().includes(q)
      );
    }
    setComplaints(result);
  }, [search, filterStatus, filterType, allComplaints]);

  const handleStatusChange = async (id, newStatus) => {
    setStatusLoading(true);
    try {
      const r = await authFetch(`/api/admin/complaints/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.message);
      setAllComplaints(prev => prev.map(c => c._id?.toString() === id.toString() ? { ...c, status: newStatus } : c));
      if (selected?._id?.toString() === id.toString()) setSelected(prev => ({ ...prev, status: newStatus }));
      fetchStats();
      showToast(`Complaint marked as ${STATUS[newStatus]?.label}`);
    } catch (err) { showToast(err.message, 'error'); }
    finally { setStatusLoading(false); }
  };

  const handleSendEmail = async ({ complaintId, to, subject, body }) => {
    setEmailSending(true);
    try {
      const r = await authFetch('/api/admin/complaints/send-email', {
        method: 'POST',
        body: JSON.stringify({ complaintId, to, subject, body }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.message);
      setEmailTarget(null);
      showToast(`Email sent to ${to}`);
    } catch (err) { showToast(err.message, 'error'); }
    finally { setEmailSending(false); }
  };

  const openEmail = (complaint) => { setSelected(null); setEmailTarget(complaint); };

  const TYPE_FILTERS = [
    { key: 'all',     label: 'All Types' },
    { key: 'user',    label: 'Users'     },
    { key: 'canteen', label: 'Canteens'  },
  ];

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-gray-50 dark:bg-gray-900">
      <AdminHeader title="Complaint Management" subtitle="Track and resolve user and canteen complaints" />
      <Toast toast={toast} />

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4" style={{ scrollbarWidth: 'none' }}>
        <style>{`*::-webkit-scrollbar{display:none}`}</style>

        <div className="grid grid-cols-3 gap-4">
          <StatCard icon={MessageSquare} label="Total Complaints" value={stats.total}    color="bg-indigo-500"  loading={statsLoading} />
          <StatCard icon={Clock}         label="Pending"          value={stats.pending}  color="bg-yellow-500" loading={statsLoading} />
          <StatCard icon={CheckCircle}   label="Resolved"         value={stats.resolved} color="bg-green-500"  loading={statsLoading} />
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700/60 overflow-hidden">
          <div className="px-5 pt-4 pb-3 border-b border-gray-100 dark:border-gray-700/60 space-y-3">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2 flex-shrink-0">
                <AlertTriangle className="w-4 h-4 text-orange-400" />
                <h3 className="text-sm font-bold text-gray-800 dark:text-white">All Complaints</h3>
              </div>
              <div className="flex items-center gap-1.5">
                {TYPE_FILTERS.map(f => (
                  <button key={f.key} onClick={() => setFilterType(f.key)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all ${filterType === f.key
                      ? 'bg-indigo-50 text-indigo-600 border-indigo-200 dark:bg-indigo-900/20 dark:text-indigo-400 dark:border-indigo-800'
                      : 'text-gray-400 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-gray-300'}`}>
                    {f.label}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-1.5 ml-2">
                <Filter className="w-3 h-3 text-gray-400 flex-shrink-0" />
                {FILTERS.map(f => (
                  <button key={f.key} onClick={() => setFilterStatus(f.key)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all ${filterStatus === f.key
                      ? `${f.key === 'pending'  ? 'bg-yellow-50 text-yellow-600 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800'
                          : f.key === 'inreview' ? 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800'
                          : f.key === 'resolved' ? 'bg-green-50 text-green-600 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800'
                          : f.key === 'closed'   ? 'bg-gray-100 text-gray-500 border-gray-300 dark:bg-gray-700 dark:text-gray-400 dark:border-gray-600'
                          : 'bg-indigo-50 text-indigo-600 border-indigo-200 dark:bg-indigo-900/20 dark:text-indigo-400 dark:border-indigo-800'}`
                      : 'text-gray-400 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-gray-300'}`}>
                    {f.label}
                  </button>
                ))}
              </div>
              <span className="ml-auto text-[11px] font-bold text-gray-400 flex-shrink-0">
                {complaints.length} complaint{complaints.length !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search by ID, name, email, canteen, category or description..."
                className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-all" />
            </div>
          </div>

          {/* Table header */}
          <div className="grid gap-3 px-5 py-2.5 bg-gray-50 dark:bg-gray-700/30 border-b border-gray-100 dark:border-gray-700/60"
            style={{ gridTemplateColumns: 'repeat(13, minmax(0, 1fr))' }}>
            {[
              { label: 'ID',           span: 1 },
              { label: 'Submitted By', span: 2 },
              { label: 'Type',         span: 1 },
              { label: 'Canteen',      span: 2 },
              { label: 'Category',     span: 2 },
              { label: 'Description',  span: 2 },
              { label: 'Date',         span: 1 },
              { label: 'Status',       span: 1 },
              { label: 'Actions',      span: 1 },
            ].map(({ label, span }) => (
              <div key={label} style={{ gridColumn: `span ${span}` }}
                className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{label}</div>
            ))}
          </div>

          {loading ? (
            <div className="divide-y divide-gray-50 dark:divide-gray-700/50">
              {[1,2,3,4,5].map(i => (
                <div key={i} className="grid px-5 py-3.5 animate-pulse items-center gap-3"
                  style={{ gridTemplateColumns: 'repeat(13, minmax(0, 1fr))' }}>
                  <div className="h-5 w-14 bg-gray-200 dark:bg-gray-700 rounded" style={{ gridColumn: 'span 1' }} />
                  <div className="h-3 w-24 bg-gray-200 dark:bg-gray-700 rounded" style={{ gridColumn: 'span 2' }} />
                  <div className="h-5 w-12 bg-gray-100 dark:bg-gray-700 rounded-full" style={{ gridColumn: 'span 1' }} />
                  <div className="h-3 w-20 bg-gray-100 dark:bg-gray-700 rounded" style={{ gridColumn: 'span 2' }} />
                  <div className="h-3 w-20 bg-gray-100 dark:bg-gray-700 rounded" style={{ gridColumn: 'span 2' }} />
                  <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded" style={{ gridColumn: 'span 2' }} />
                  <div className="h-3 w-16 bg-gray-100 dark:bg-gray-700 rounded" style={{ gridColumn: 'span 1' }} />
                  <div className="h-5 w-16 bg-gray-100 dark:bg-gray-700 rounded-full" style={{ gridColumn: 'span 1' }} />
                  <div className="flex gap-1 justify-end" style={{ gridColumn: 'span 1' }}>
                    <div className="h-7 w-7 bg-gray-100 dark:bg-gray-700 rounded-lg" />
                    <div className="h-7 w-7 bg-gray-100 dark:bg-gray-700 rounded-lg" />
                  </div>
                </div>
              ))}
            </div>
          ) : complaints.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-300 dark:text-gray-600">
              <InboxIcon className="w-10 h-10 mb-2" />
              <p className="text-sm font-medium text-gray-400">
                {search ? `No complaints matching "${search}"` : 'No complaints found'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50 dark:divide-gray-700/50">
              {complaints.map(c => {
                const resolvedCanteenName =
                  (c.canteenName && c.canteenName !== '—' ? c.canteenName : null) ||
                  (c.canteen?.name ? c.canteen.name : null);
                return (
                  <div key={c._id} className="grid px-5 py-3 items-center hover:bg-gray-50 dark:hover:bg-gray-700/20 transition-colors gap-3"
                    style={{ gridTemplateColumns: 'repeat(13, minmax(0, 1fr))' }}>
                    <div style={{ gridColumn: 'span 1' }}>
                      <span className="text-[11px] font-black text-gray-400 dark:text-gray-500 font-mono">#{getId(c._id)}</span>
                    </div>
                    <div style={{ gridColumn: 'span 2' }} className="min-w-0">
                      <p className="text-xs font-bold text-gray-800 dark:text-white truncate">{c.submittedByName || '—'}</p>
                      <p className="text-[10px] text-gray-400 truncate">{c.submittedByEmail || '—'}</p>
                    </div>
                    <div style={{ gridColumn: 'span 1' }}>
                      <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
                        c.submitterType === 'canteen'
                          ? 'bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400'
                          : 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'}`}>
                        {c.submitterType === 'canteen' ? <Store className="w-2.5 h-2.5" /> : <User className="w-2.5 h-2.5" />}
                        {c.submitterType === 'canteen' ? 'Canteen' : 'User'}
                      </span>
                    </div>
                    <div style={{ gridColumn: 'span 2' }} className="min-w-0">
                      {resolvedCanteenName ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-semibold bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 truncate max-w-full">
                          <Store className="w-2.5 h-2.5 flex-shrink-0" />
                          <span className="truncate">{resolvedCanteenName}</span>
                        </span>
                      ) : (
                        <span className="text-[11px] text-gray-300 dark:text-gray-600">—</span>
                      )}
                    </div>
                    <div style={{ gridColumn: 'span 2' }} className="min-w-0">
                      <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 truncate">{c.category || '—'}</p>
                    </div>
                    <div style={{ gridColumn: 'span 2' }} className="min-w-0">
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{c.description || '—'}</p>
                      {c.attachment && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] text-blue-400 mt-0.5">
                          <Paperclip className="w-2.5 h-2.5" /> Attachment
                        </span>
                      )}
                    </div>
                    <div style={{ gridColumn: 'span 1' }}>
                      <p className="text-[10px] text-gray-400">{fmtDate(c.createdAt)}</p>
                    </div>
                    <div style={{ gridColumn: 'span 1' }}><StatusBadge status={c.status} /></div>
                    <div style={{ gridColumn: 'span 1' }} className="flex items-center justify-end gap-1">
                      <button onClick={() => setSelected(c)} title="View Details"
                        className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200 dark:border-gray-600 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-600 transition-colors">
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => setEmailTarget(c)} title="Send Email"
                        className="w-7 h-7 flex items-center justify-center rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 text-blue-500 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors">
                        <Mail className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Footer with stats + pagination */}
          {!loading && (
            <div className="px-5 py-2.5 border-t border-gray-100 dark:border-gray-700/60 bg-gray-50 dark:bg-gray-800 flex items-center justify-between">
              <div className="flex items-center gap-4 text-[11px] text-gray-400">
                <span>{complaints.length} shown</span>
                <span>·</span>
                <span className="text-yellow-500 font-bold">{complaints.filter(c=>c.status==='pending').length} pending</span>
                <span>·</span>
                <span className="text-blue-500 font-bold">{complaints.filter(c=>c.status==='inreview').length} in review</span>
                <span>·</span>
                <span className="text-green-500 font-bold">{complaints.filter(c=>c.status==='resolved').length} resolved</span>
              </div>
              {totalPages > 1 && (
                <div className="flex items-center gap-3">
                  <span className="text-[11px] text-gray-400">Page {page} of {totalPages}</span>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => { const p = page - 1; setPage(p); fetchComplaints(p); }}
                      disabled={page === 1}
                      className="px-3 py-1.5 text-xs font-bold rounded-lg border border-gray-200 dark:border-gray-600 text-gray-500 disabled:opacity-30 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      Previous
                    </button>
                    <button
                      onClick={() => { const p = page + 1; setPage(p); fetchComplaints(p); }}
                      disabled={page >= totalPages}
                      className="px-3 py-1.5 text-xs font-bold rounded-lg border border-gray-200 dark:border-gray-600 text-gray-500 disabled:opacity-30 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {selected && (
        <DetailModal complaint={selected} onClose={() => setSelected(null)}
          onStatusChange={handleStatusChange} onEmail={openEmail} statusLoading={statusLoading} />
      )}
      {emailTarget && (
        <EmailModal complaint={emailTarget} onClose={() => setEmailTarget(null)}
          onSend={handleSendEmail} sending={emailSending} />
      )}
    </div>
  );
};

export default ComplaintManagement;