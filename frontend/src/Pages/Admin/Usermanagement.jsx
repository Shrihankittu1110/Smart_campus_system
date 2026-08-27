import React, { useEffect, useState, useCallback } from 'react';
import jsPDF from 'jspdf';
import logoSrc from '../../assets/logo.png';
import { authFetch } from '../../utils/authFetch';
import AdminHeader from './components/AdminHeader';
import {
  Users, UserCheck, UserX, Search, Filter,
  FileDown, RefreshCw, CheckCircle, XCircle,
  Shield, ShieldOff, Mail, Phone, Calendar, Eye, BookOpen
} from 'lucide-react';

const fmt = (n) => (n ?? 0).toLocaleString();
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
const getInitials = (name) => name ? name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() : '?';
const AVATAR_COLORS = ['from-violet-400 to-violet-600','from-blue-400 to-blue-600','from-emerald-400 to-emerald-600','from-amber-400 to-amber-600','from-rose-400 to-rose-600','from-cyan-400 to-cyan-600'];
const avatarColor = (name) => AVATAR_COLORS[(name?.charCodeAt(0) || 0) % AVATAR_COLORS.length];

const getLogoBase64 = () => new Promise((resolve) => {
  const img = new Image();
  img.onload = () => {
    const canvas = document.createElement('canvas');
    canvas.width = img.width; canvas.height = img.height;
    canvas.getContext('2d').drawImage(img, 0, 0);
    resolve(canvas.toDataURL('image/png'));
  };
  img.onerror = () => resolve(null);
  img.src = logoSrc;
});

const generatePDF = async (users, filterStatus, stats) => {
  const logoBase64 = await getLogoBase64();
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const now = new Date();

  doc.setFillColor(30, 27, 75);
  doc.rect(0, 0, W, 22, 'F');
  if (logoBase64) doc.addImage(logoBase64, 'PNG', 8, 3, 16, 16);
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14); doc.setFont('helvetica', 'bold');
  doc.text('SmartMess — User Management Report', logoBase64 ? 28 : 14, 14);
  doc.setFontSize(8); doc.setFont('helvetica', 'normal');
  doc.text(`Generated: ${now.toLocaleString()}   |   Filter: ${filterStatus.toUpperCase()}   |   Total: ${users.length}`, W - 14, 14, { align: 'right' });

  const boxes = [
    { label: 'Total Users',   value: stats.total,   color: [99, 102, 241] },
    { label: 'Active Users',  value: stats.active,  color: [34, 197, 94]  },
    { label: 'Blocked Users', value: stats.blocked, color: [239, 68, 68]  },
  ];
  boxes.forEach((b, i) => {
    const x = 14 + i * 65;
    doc.setFillColor(...b.color);
    doc.roundedRect(x, 28, 60, 18, 3, 3, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16); doc.setFont('helvetica', 'bold');
    doc.text(String(b.value), x + 30, 39, { align: 'center' });
    doc.setFontSize(7); doc.setFont('helvetica', 'normal');
    doc.text(b.label, x + 30, 43, { align: 'center' });
  });

  const startY = 52;
  const cols = [
    { header: '#',          width: 10 },
    { header: 'Full Name',  width: 50 },
    { header: 'Email',      width: 65 },
    { header: 'Phone',      width: 35 },
    { header: 'NIC',        width: 35 },
    { header: 'Registered', width: 30 },
    { header: 'Status',     width: 25 },
  ];

  let x = 14;
  doc.setFillColor(243, 244, 246);
  doc.rect(14, startY, W - 28, 8, 'F');
  doc.setTextColor(75, 85, 99);
  doc.setFontSize(8); doc.setFont('helvetica', 'bold');
  cols.forEach(col => { doc.text(col.header, x + 2, startY + 5.5); x += col.width; });

  doc.setFont('helvetica', 'normal');
  let y = startY + 8;
  users.forEach((u, i) => {
    if (y > H - 20) { doc.addPage(); y = 20; }
    if (i % 2 === 0) { doc.setFillColor(249, 250, 251); doc.rect(14, y, W - 28, 8, 'F'); }
    const status = u.isBlocked ? 'Blocked' : 'Active';
    const statusColor = u.isBlocked ? [239, 68, 68] : [34, 197, 94];
    const row = [String(i+1), u.name||'—', u.email||'—', u.phone||'—', u.nic||'—', fmtDate(u.createdAt), status];
    x = 14;
    doc.setFontSize(7.5);
    cols.forEach((col, ci) => {
      if (ci === 6) { doc.setTextColor(...statusColor); doc.setFont('helvetica', 'bold'); }
      else          { doc.setTextColor(31, 41, 55);     doc.setFont('helvetica', 'normal'); }
      doc.text(doc.splitTextToSize(row[ci], col.width - 3)[0], x + 2, y + 5.5);
      x += col.width;
    });
    doc.setDrawColor(229, 231, 235); doc.line(14, y + 8, W - 14, y + 8);
    y += 8;
  });

  doc.setTextColor(156, 163, 175); doc.setFontSize(7); doc.setFont('helvetica', 'normal');
  doc.text('SmartMess Admin System — Confidential', 14, H - 5);
  doc.text('Page 1', W - 14, H - 5, { align: 'right' });
  doc.save(`users_report_${now.toISOString().slice(0, 10)}.pdf`);
};

const StatCard = ({ icon: Icon, label, value, color, loading }) => (
  <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700/60 p-5 flex items-center gap-4 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
    <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
      <Icon className="w-6 h-6 text-white" strokeWidth={1.8} />
    </div>
    <div>
      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-0.5">{label}</p>
      {loading ? <div className="h-7 w-16 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse mt-1" />
               : <p className="text-2xl font-black text-gray-800 dark:text-white tabular-nums">{fmt(value)}</p>}
    </div>
    <div className={`absolute -right-3 -top-3 w-20 h-20 rounded-full opacity-[0.07] ${color}`} />
  </div>
);

const UserModal = ({ user, onClose, onBlock, onUnblock, actionLoading }) => {
  if (!user) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-6 pt-6 pb-4 flex items-center gap-4">
          <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${avatarColor(user.name)} flex items-center justify-center flex-shrink-0`}>
            <span className="text-white font-black text-lg">{getInitials(user.name)}</span>
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-bold text-gray-900 dark:text-white truncate">{user.name}</h2>
            <p className="text-xs text-gray-400 truncate">{user.email}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${user.isBlocked ? 'bg-red-50 text-red-600 ring-1 ring-red-200 dark:bg-red-900/20 dark:text-red-400 dark:ring-red-800' : 'bg-green-50 text-green-600 ring-1 ring-green-200 dark:bg-green-900/20 dark:text-green-400 dark:ring-green-800'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${user.isBlocked ? 'bg-red-500' : 'bg-green-500'}`} />
              {user.isBlocked ? 'Blocked' : 'Active'}
            </span>
            <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400">
              <XCircle className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="px-6 pb-4 grid grid-cols-2 gap-3">
          {[
            { icon: Mail,     label: 'Email',      value: user.email || '—' },
            { icon: Phone,    label: 'Phone',      value: user.phone || '—' },
            { icon: Calendar, label: 'Registered', value: fmtDate(user.createdAt) },
            { icon: Shield,      label: 'Student ID',  value: user.studentId || '—' },
            { icon: BookOpen,    label: 'University',  value: user.university || '—' },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-1">
                <Icon className="w-3.5 h-3.5 text-gray-400" />
                <span className="text-[10px] font-bold uppercase tracking-wide text-gray-400">{label}</span>
              </div>
              <p className="text-xs font-semibold text-gray-800 dark:text-white truncate">{value}</p>
            </div>
          ))}
        </div>

        <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-700 flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 text-sm font-semibold rounded-xl border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            Close
          </button>
          {user.isBlocked ? (
            <button onClick={() => onUnblock(user._id)} disabled={actionLoading}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold rounded-xl bg-green-500 hover:bg-green-600 text-white disabled:opacity-50 transition-colors">
              {actionLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <UserCheck className="w-4 h-4" />} Unblock User
            </button>
          ) : (
            <button onClick={() => onBlock(user._id)} disabled={actionLoading}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold rounded-xl bg-red-500 hover:bg-red-600 text-white disabled:opacity-50 transition-colors">
              {actionLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldOff className="w-4 h-4" />} Block User
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const UserManagement = () => {
  const [users, setUsers]                 = useState([]);
  const [allUsers, setAllUsers]           = useState([]);
  const [stats, setStats]                 = useState({ total: 0, active: 0, blocked: 0 });
  const [loading, setLoading]             = useState(true);
  const [statsLoading, setStatsLoading]   = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [selected, setSelected]           = useState(null);
  const [search, setSearch]               = useState('');
  const [filterStatus, setFilterStatus]   = useState('all');
  const [toast, setToast]                 = useState(null);
  const [pdfLoading, setPdfLoading]       = useState(false);

  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      // ✅ authFetch
      const r = await authFetch('/api/admin/users/stats');
      const j = await r.json();
      if (j.success) setStats(j.data);
    } catch {}
    finally { setStatsLoading(false); }
  }, []);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      // ✅ authFetch
      const r = await authFetch('/api/admin/users');
      const j = await r.json();
      if (j.success) { setAllUsers(j.data); setUsers(j.data); }
    } catch {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchStats(); fetchUsers(); }, []);

  useEffect(() => {
    let result = allUsers;
    if (filterStatus === 'blocked') result = result.filter(u => u.isBlocked);
    if (filterStatus === 'active')  result = result.filter(u => !u.isBlocked);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(u =>
        u.name?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.phone?.includes(q) ||
        u.nic?.toLowerCase().includes(q)
      );
    }
    setUsers(result);
  }, [search, filterStatus, allUsers]);

  const handleBlock = async (id) => {
    setActionLoading(true);
    try {
      // ✅ authFetch
      const r = await authFetch(`/api/admin/users/${id}/block`, { method: 'PUT' });
      const j = await r.json();
      if (!r.ok) throw new Error(j.message);
      setAllUsers(prev => prev.map(u => u._id?.toString() === id.toString() ? { ...u, isBlocked: true } : u));
      if (selected?._id?.toString() === id.toString()) setSelected(prev => ({ ...prev, isBlocked: true }));
      fetchStats();
      showToast('User blocked successfully');
    } catch (err) { showToast(err.message, 'error'); }
    finally { setActionLoading(false); }
  };

  const handleUnblock = async (id) => {
    setActionLoading(true);
    try {
      // ✅ authFetch
      const r = await authFetch(`/api/admin/users/${id}/unblock`, { method: 'PUT' });
      const j = await r.json();
      if (!r.ok) throw new Error(j.message);
      setAllUsers(prev => prev.map(u => u._id?.toString() === id.toString() ? { ...u, isBlocked: false } : u));
      if (selected?._id?.toString() === id.toString()) setSelected(prev => ({ ...prev, isBlocked: false }));
      fetchStats();
      showToast('User unblocked successfully');
    } catch (err) { showToast(err.message, 'error'); }
    finally { setActionLoading(false); }
  };

  const handleExportPDF = async () => {
    setPdfLoading(true);
    try { await generatePDF(users, filterStatus, stats); showToast('PDF exported successfully!'); }
    catch (err) { showToast('PDF export failed: ' + err.message, 'error'); }
    finally { setPdfLoading(false); }
  };

  const FILTERS = [
    { key: 'all',     label: 'All',     cls: 'text-indigo-600 bg-indigo-50 border-indigo-200 dark:bg-indigo-900/20 dark:border-indigo-700 dark:text-indigo-400' },
    { key: 'active',  label: 'Active',  cls: 'text-green-600 bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400' },
    { key: 'blocked', label: 'Blocked', cls: 'text-red-600 bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400' },
  ];

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-gray-50 dark:bg-gray-900">
      <AdminHeader title="User Management" subtitle="Manage User accounts and access" />

      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg text-sm font-semibold flex items-center gap-2 ${toast.type === 'error' ? 'bg-red-500' : 'bg-green-500'} text-white`}>
          {toast.type === 'error' ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />} {toast.msg}
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4" style={{ scrollbarWidth: 'none' }}>
        <style>{`*::-webkit-scrollbar{display:none}`}</style>

        <div className="grid grid-cols-3 gap-4">
          <StatCard icon={Users}     label="Total Users"   value={stats.total}   color="bg-indigo-500"  loading={statsLoading} />
          <StatCard icon={UserCheck} label="Active Users"  value={stats.active}  color="bg-primary-500" loading={statsLoading} />
          <StatCard icon={UserX}     label="Blocked Users" value={stats.blocked} color="bg-red-500"     loading={statsLoading} />
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, email, phone or NIC..."
              className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-400 transition-all" />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
            {FILTERS.map(f => (
              <button key={f.key} onClick={() => setFilterStatus(f.key)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${filterStatus === f.key ? f.cls : 'text-gray-400 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-gray-300'}`}>
                {f.label}
              </button>
            ))}
          </div>
          <button onClick={handleExportPDF} disabled={pdfLoading || users.length === 0}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white disabled:opacity-50 transition-colors shadow-sm">
            {pdfLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <FileDown className="w-3.5 h-3.5" />} Export PDF
          </button>
        </div>

        {(search || filterStatus !== 'all') && (
          <p className="text-xs text-gray-400 dark:text-gray-500">
            Showing <span className="font-semibold text-gray-600 dark:text-gray-300">{users.length}</span> user{users.length !== 1 ? 's' : ''}
            {search && <> matching "<span className="font-semibold text-gray-600 dark:text-gray-300">{search}</span>"</>}
            {filterStatus !== 'all' && <> · <span className="capitalize">{filterStatus}</span> only</>}
          </p>
        )}

        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700/60 overflow-hidden">
          <div className="grid grid-cols-12 gap-4 px-5 py-3 border-b border-gray-100 dark:border-gray-700/60 bg-gray-50 dark:bg-gray-700/30">
            <div className="col-span-4 text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">User</div>
            <div className="col-span-3 text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">Email</div>
            <div className="col-span-2 text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">Registered</div>
            <div className="col-span-2 text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">Status</div>
            <div className="col-span-1 text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 text-right">Action</div>
          </div>

          {loading ? (
            <div className="divide-y divide-gray-50 dark:divide-gray-700/50">
              {[1,2,3,4,5,6].map(i => (
                <div key={i} className="grid grid-cols-12 gap-4 px-5 py-3.5 animate-pulse items-center">
                  <div className="col-span-4 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gray-200 dark:bg-gray-700 flex-shrink-0" />
                    <div className="space-y-1.5 flex-1"><div className="h-3 w-28 bg-gray-200 dark:bg-gray-700 rounded" /><div className="h-2.5 w-20 bg-gray-100 dark:bg-gray-700 rounded" /></div>
                  </div>
                  <div className="col-span-3 h-3 bg-gray-100 dark:bg-gray-700 rounded" />
                  <div className="col-span-2 h-3 bg-gray-100 dark:bg-gray-700 rounded" />
                  <div className="col-span-2 h-5 w-16 bg-gray-100 dark:bg-gray-700 rounded-full" />
                  <div className="col-span-1 h-7 w-14 bg-gray-100 dark:bg-gray-700 rounded-xl ml-auto" />
                </div>
              ))}
            </div>
          ) : users.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-300 dark:text-gray-600">
              <Users className="w-10 h-10 mb-2" />
              <p className="text-sm font-medium text-gray-400">{search ? `No results for "${search}"` : 'No users found'}</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50 dark:divide-gray-700/50">
              {users.map(u => (
                <div key={u._id} className="grid grid-cols-12 gap-4 px-5 py-3.5 items-center hover:bg-gray-50 dark:hover:bg-gray-700/20 transition-colors">
                  <div className="col-span-4 flex items-center gap-3 min-w-0">
                    <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${avatarColor(u.name)} flex items-center justify-center flex-shrink-0`}>
                      <span className="text-white font-bold text-xs">{getInitials(u.name)}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-gray-800 dark:text-white truncate">{u.name}</p>
                      <p className="text-[10px] text-gray-400 truncate">{u.phone || u.nic || 'No contact info'}</p>
                    </div>
                  </div>
                  <div className="col-span-3 min-w-0">
                    <p className="text-xs text-gray-600 dark:text-gray-400 truncate">{u.email}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs text-gray-500 dark:text-gray-400">{fmtDate(u.createdAt)}</p>
                  </div>
                  <div className="col-span-2">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${u.isBlocked ? 'bg-red-50 text-red-600 ring-1 ring-red-200 dark:bg-red-900/20 dark:text-red-400 dark:ring-red-800' : 'bg-green-50 text-green-600 ring-1 ring-green-200 dark:bg-green-900/20 dark:text-green-400 dark:ring-green-800'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${u.isBlocked ? 'bg-red-500' : 'bg-green-500'}`} />
                      {u.isBlocked ? 'Blocked' : 'Active'}
                    </span>
                  </div>
                  <div className="col-span-1 flex items-center justify-end gap-1.5">
                    <button onClick={() => setSelected(u)}
                      className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200 dark:border-gray-600 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-600 transition-colors">
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    {u.isBlocked ? (
                      <button onClick={() => handleUnblock(u._id)} disabled={actionLoading}
                        className="w-7 h-7 flex items-center justify-center rounded-lg bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 hover:bg-green-100 disabled:opacity-50 transition-colors border border-green-200 dark:border-green-800">
                        <UserCheck className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <button onClick={() => handleBlock(u._id)} disabled={actionLoading}
                        className="w-7 h-7 flex items-center justify-center rounded-lg bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400 hover:bg-red-100 disabled:opacity-50 transition-colors border border-red-200 dark:border-red-800">
                        <ShieldOff className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {selected && (
        <UserModal user={selected} onClose={() => setSelected(null)}
          onBlock={handleBlock} onUnblock={handleUnblock} actionLoading={actionLoading} />
      )}
    </div>
  );
};

export default UserManagement;