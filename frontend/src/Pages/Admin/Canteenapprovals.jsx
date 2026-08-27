import React, { useEffect, useState, useCallback } from 'react';
import jsPDF from 'jspdf';
import logoSrc from '../../assets/logo.png';
import { authFetch } from '../../utils/authFetch';
import { buildImgUrl } from '../../utils/imageUrl';
import AdminHeader from './components/AdminHeader';
import {
  Store, Clock, CheckCircle, XCircle, Eye, FileText,
  X, Download, RefreshCw, User, Phone, Mail,
  Calendar, MapPin, AlertCircle, Search, Filter, FileDown
} from 'lucide-react';

const fmt = (n) => (n ?? 0).toLocaleString();
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
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

const generatePDF = async (canteens, filterStatus) => {
  const logoBase64 = await getLogoBase64();
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const now = new Date();

  doc.setFillColor(20, 83, 45);
  doc.rect(0, 0, W, 22, 'F');
  if (logoBase64) doc.addImage(logoBase64, 'PNG', 8, 3, 16, 16);
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14); doc.setFont('helvetica', 'bold');
  doc.text('SmartMess — Canteen Approvals Report', logoBase64 ? 28 : 14, 14);
  doc.setFontSize(8); doc.setFont('helvetica', 'normal');
  doc.text(`Generated: ${now.toLocaleString()}   |   Filter: ${filterStatus.toUpperCase()}   |   Total: ${canteens.length}`, W - 14, 14, { align: 'right' });

  const total    = canteens.length;
  const approved = canteens.filter(c => c.isApproved).length;
  const pending  = canteens.filter(c => !c.isApproved && !c.isRejected).length;
  const rejected = canteens.filter(c => c.isRejected).length;

  const boxes = [
    { label: 'Total',    value: total,    color: [99, 102, 241] },
    { label: 'Approved', value: approved, color: [34, 197, 94]  },
    { label: 'Pending',  value: pending,  color: [245, 158, 11] },
    { label: 'Rejected', value: rejected, color: [239, 68, 68]  },
  ];
  boxes.forEach((b, i) => {
    const x = 14 + i * 65;
    doc.setFillColor(...b.color);
    doc.roundedRect(x, 28, 60, 18, 3, 3, 'F');
    doc.setTextColor(255,255,255);
    doc.setFontSize(16); doc.setFont('helvetica', 'bold');
    doc.text(String(b.value), x + 30, 39, { align: 'center' });
    doc.setFontSize(7); doc.setFont('helvetica', 'normal');
    doc.text(b.label, x + 30, 43, { align: 'center' });
  });

  const startY = 52;
  const cols = [
    { header: '#',            width: 10 },
    { header: 'Canteen Name', width: 50 },
    { header: 'Owner',        width: 45 },
    { header: 'Phone',        width: 35 },
    { header: 'Docs',         width: 15 },
    { header: 'Registered',   width: 30 },
    { header: 'Status',       width: 25 },
  ];

  let x = 14;
  doc.setFillColor(243, 244, 246);
  doc.rect(14, startY, W - 28, 8, 'F');
  doc.setTextColor(75, 85, 99);
  doc.setFontSize(8); doc.setFont('helvetica', 'bold');
  cols.forEach(col => { doc.text(col.header, x + 2, startY + 5.5); x += col.width; });

  doc.setFont('helvetica', 'normal');
  let y = startY + 8;
  canteens.forEach((c, i) => {
    if (y > H - 20) { doc.addPage(); y = 20; }
    if (i % 2 === 0) { doc.setFillColor(249, 250, 251); doc.rect(14, y, W - 28, 8, 'F'); }
    const status = c.isApproved ? 'Approved' : c.isRejected ? 'Rejected' : 'Pending';
    const statusColor = c.isApproved ? [34,197,94] : c.isRejected ? [239,68,68] : [245,158,11];
    const row = [String(i+1), c.name||'—', c.ownerName||c.owner?.name||'—', c.phone||'—', String(c.documents?.length||0), fmtDate(c.createdAt), status];
    x = 14;
    doc.setFontSize(7.5);
    cols.forEach((col, ci) => {
      if (ci === 6) { doc.setTextColor(...statusColor); doc.setFont('helvetica', 'bold'); }
      else { doc.setTextColor(31, 41, 55); doc.setFont('helvetica', 'normal'); }
      const text = doc.splitTextToSize(row[ci], col.width - 3);
      doc.text(text[0], x + 2, y + 5.5);
      x += col.width;
    });
    doc.setDrawColor(229, 231, 235);
    doc.line(14, y + 8, W - 14, y + 8);
    y += 8;
  });

  doc.setTextColor(156, 163, 175);
  doc.setFontSize(7); doc.setFont('helvetica', 'normal');
  doc.text('SmartMess Admin System — Confidential', 14, H - 5);
  doc.text('Page 1', W - 14, H - 5, { align: 'right' });
  doc.save(`canteen_approvals_${now.toISOString().slice(0,10)}.pdf`);
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

const StatusBadge = ({ status }) => {
  const map = {
    pending:  'bg-yellow-50 text-yellow-600 ring-1 ring-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:ring-yellow-800',
    approved: 'bg-green-50 text-green-600 ring-1 ring-green-200 dark:bg-green-900/20 dark:text-green-400 dark:ring-green-800',
    rejected: 'bg-red-50 text-red-600 ring-1 ring-red-200 dark:bg-red-900/20 dark:text-red-400 dark:ring-red-800',
  };
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${map[status] || map.pending}`}>{status}</span>;
};

// ✅ FIXED: Replaced Google Docs viewer with native browser <object> tag
const DocModal = ({ doc, onClose }) => {
  if (!doc) return null;

  const src = doc.url?.startsWith('data:') || doc.url?.startsWith('http')
    ? doc.url
    : `${import.meta.env.VITE_API_URL || ''}${doc.url}`;

  const isPdf = doc.url?.startsWith('data:application/pdf') ||
                doc.type === 'application/pdf' ||
                doc.url?.toLowerCase().includes('.pdf');

  const openInTab = () => {
    if (src.startsWith('data:')) {
      const byteString = atob(src.split(',')[1]);
      const mimeType   = src.split(',')[0].split(':')[1].split(';')[0];
      const byteArray  = new Uint8Array(byteString.length);
      for (let i = 0; i < byteString.length; i++) byteArray[i] = byteString.charCodeAt(i);
      const blobUrl = URL.createObjectURL(new Blob([byteArray], { type: mimeType }));
      window.open(blobUrl, '_blank');
    } else {
      window.open(src, '_blank');
    }
  };

  const download = () => {
    if (src.startsWith('data:')) {
      const a = document.createElement('a');
      a.href = src;
      a.download = doc.name || 'document';
      a.click();
    } else {
      window.open(src, '_blank');
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 dark:border-gray-700 flex-shrink-0">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-red-500" />
            <span className="text-sm font-bold text-gray-800 dark:text-white">{doc.name || 'Document'}</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={openInTab}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 transition-colors">
              <Eye className="w-3.5 h-3.5" /> Open in Tab
            </button>
            <button onClick={download}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 hover:bg-primary-100 transition-colors">
              <Download className="w-3.5 h-3.5" /> Download
            </button>
            <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-auto" style={{ scrollbarWidth: 'none' }}>
          {isPdf ? (
            <iframe
              src={src}
              className="w-full"
              style={{ height: '70vh', border: 'none' }}
              title="Document Preview"
            />
          ) : (
            <img src={src} alt={doc.name} className="w-full h-auto object-contain p-4" />
          )}
        </div>
      </div>
    </div>
  );
};
const DetailModal = ({ canteen, onClose, onApprove, onReject, actionLoading }) => {
  const [activeDoc, setActiveDoc] = useState(null);
  if (!canteen) return null;
  const status = canteen.isApproved ? 'approved' : canteen.isRejected ? 'rejected' : 'pending';
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex-shrink-0">
          <div>
            <h2 className="text-base font-bold text-gray-900 dark:text-white">{canteen.name}</h2>
            <p className="text-xs text-gray-400">Registration details</p>
          </div>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400"><X className="w-4 h-4" /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4" style={{ scrollbarWidth: 'none' }}>
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: User,        label: 'Owner',      value: canteen.ownerName || canteen.owner?.name || '—' },
              { icon: Mail,        label: 'Email',      value: canteen.ownerEmail || canteen.owner?.email || '—' },
              { icon: Phone,       label: 'Phone',      value: canteen.phone || '—' },
              { icon: MapPin,      label: 'Location',   value: canteen.location || canteen.address || '—' },
              { icon: Calendar,    label: 'Registered', value: fmtDate(canteen.createdAt) },
              { icon: AlertCircle, label: 'Status',     value: <StatusBadge status={status} /> },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3">
                <div className="flex items-center gap-2 mb-1"><Icon className="w-3.5 h-3.5 text-gray-400" /><span className="text-[10px] font-bold uppercase tracking-wide text-gray-400">{label}</span></div>
                <div className="text-sm font-semibold text-gray-800 dark:text-white">{value}</div>
              </div>
            ))}
          </div>
          {canteen.description && <div><p className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-2">Description</p><p className="text-sm text-gray-600 dark:text-gray-400">{canteen.description}</p></div>}
          {canteen.images?.length > 0 && (
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-2">Images</p>
              <div className="grid grid-cols-3 gap-2">
                {canteen.images.map((img, i) => <img key={i} src={buildImgUrl(img)} alt={`img-${i}`} className="w-full h-24 object-cover rounded-xl cursor-pointer hover:opacity-90" onClick={() => setActiveDoc({ url: img, name: `Image ${i+1}` })} />)}
              </div>
            </div>
          )}
          {canteen.documents?.length > 0 && (
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-2">Submitted Documents</p>
              <div className="space-y-2">
                {canteen.documents.map((doc, i) => (
                  <button key={i} onClick={() => setActiveDoc(typeof doc === 'string' ? { url: doc, name: `Document ${i+1}`, type: 'application/pdf' } : doc)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl border border-gray-200 dark:border-gray-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:border-primary-200 transition-all group">
                    <div className="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0"><FileText className="w-4 h-4 text-red-500" /></div>
                    <div className="flex-1 text-left"><p className="text-xs font-bold text-gray-700 dark:text-gray-300">{typeof doc === 'string' ? `Document ${i+1}` : doc.name || `Document ${i+1}`}</p><p className="text-[10px] text-gray-400">Click to view</p></div>
                    <Eye className="w-4 h-4 text-gray-400 group-hover:text-primary-500 transition-colors" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        {status === 'pending' && (
          <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-700 flex gap-3 flex-shrink-0">
            <button onClick={() => onReject(canteen._id)} disabled={actionLoading}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold rounded-xl border-2 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50 transition-colors">
              <XCircle className="w-4 h-4" /> Reject
            </button>
            <button onClick={() => onApprove(canteen._id)} disabled={actionLoading}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold rounded-xl bg-primary-500 hover:bg-primary-600 text-white disabled:opacity-50 transition-colors">
              {actionLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />} Approve
            </button>
          </div>
        )}
      </div>
      {activeDoc && <DocModal doc={activeDoc} onClose={() => setActiveDoc(null)} />}
    </div>
  );
};

const CanteenApprovals = () => {
  const [canteens, setCanteens]           = useState([]);
  const [allCanteens, setAllCanteens]     = useState([]);
  const [stats, setStats]                 = useState({ approved: 0, pending: 0, rejected: 0 });
  const [loading, setLoading]             = useState(true);
  const [statsLoading, setStatsLoading]   = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [selected, setSelected]           = useState(null);
  const [filterStatus, setFilterStatus]   = useState('pending');
  const [search, setSearch]               = useState('');
  const [rejectModal, setRejectModal]     = useState(null);
  const [rejectReason, setRejectReason]   = useState('');
  const [toast, setToast]                 = useState(null);
  const [pdfLoading, setPdfLoading]       = useState(false);

  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const r = await authFetch('/api/admin/canteens/stats');
      const j = await r.json();
      if (j.success) setStats(j.data);
    } catch {}
    finally { setStatsLoading(false); }
  }, []);

  const fetchCanteens = useCallback(async (status = 'pending') => {
    setLoading(true);
    try {
      const r = await authFetch(`/api/admin/canteens?status=${status}`);
      const j = await r.json();
      if (j.success) { setAllCanteens(j.data); setCanteens(j.data); }
    } catch {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchStats(); fetchCanteens('pending'); }, []);

  useEffect(() => {
    if (!search.trim()) { setCanteens(allCanteens); return; }
    const q = search.toLowerCase();
    setCanteens(allCanteens.filter(c =>
      c.name?.toLowerCase().includes(q) ||
      (c.ownerName || c.owner?.name || '').toLowerCase().includes(q)
    ));
  }, [search, allCanteens]);

  const handleFilter = (status) => { setFilterStatus(status); setSearch(''); fetchCanteens(status); };

  const handleApprove = async (id) => {
    setActionLoading(true);
    try {
      const r = await authFetch(`/api/admin/canteens/${id}/approve`, { method: 'PUT' });
      const j = await r.json();
      if (!r.ok) throw new Error(j.message);
      showToast('Canteen approved!'); setSelected(null); fetchCanteens(filterStatus); fetchStats();
    } catch (err) { showToast(err.message, 'error'); }
    finally { setActionLoading(false); }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) return;
    setActionLoading(true);
    try {
      const r = await authFetch(`/api/admin/canteens/${rejectModal}/reject`, {
        method: 'PUT',
        body: JSON.stringify({ reason: rejectReason }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.message);
      showToast('Canteen rejected'); setRejectModal(null); setRejectReason(''); setSelected(null); fetchCanteens(filterStatus); fetchStats();
    } catch (err) { showToast(err.message, 'error'); }
    finally { setActionLoading(false); }
  };

  const handleExportPDF = async () => {
    setPdfLoading(true);
    try { await generatePDF(canteens, filterStatus); }
    catch (err) { showToast('PDF export failed', 'error'); console.error(err); }
    finally { setPdfLoading(false); }
  };

  const FILTERS = [
    { key: 'pending',  label: 'Pending',  cls: 'text-yellow-600 bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-400' },
    { key: 'approved', label: 'Approved', cls: 'text-green-600 bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400' },
    { key: 'rejected', label: 'Rejected', cls: 'text-red-600 bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400' },
    { key: 'all',      label: 'All',      cls: 'text-gray-600 bg-gray-50 border-gray-200 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300' },
  ];

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-gray-50 dark:bg-gray-900">
      <AdminHeader title="Canteen Approvals" subtitle="Review and approve canteen registrations" />
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg text-sm font-semibold flex items-center gap-2 ${toast.type === 'error' ? 'bg-red-500' : 'bg-green-500'} text-white`}>
          {toast.type === 'error' ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}{toast.msg}
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4" style={{ scrollbarWidth: 'none' }}>
        <style>{`*::-webkit-scrollbar{display:none}`}</style>

        <div className="grid grid-cols-3 gap-4">
          <StatCard icon={CheckCircle} label="Approved Canteens" value={stats.approved} color="bg-primary-500" loading={statsLoading} />
          <StatCard icon={Clock}       label="Pending Approval"  value={stats.pending}  color="bg-amber-500"   loading={statsLoading} />
          <StatCard icon={XCircle}     label="Rejected"          value={stats.rejected} color="bg-red-500"     loading={statsLoading} />
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by canteen or owner name..."
              className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-400 transition-all" />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
            {FILTERS.map(f => (
              <button key={f.key} onClick={() => handleFilter(f.key)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${filterStatus === f.key ? f.cls : 'text-gray-400 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-gray-300'}`}>
                {f.label}
              </button>
            ))}
          </div>
          <button onClick={handleExportPDF} disabled={pdfLoading || canteens.length === 0}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white disabled:opacity-50 transition-colors shadow-sm">
            {pdfLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <FileDown className="w-3.5 h-3.5" />}
            Export PDF
          </button>
        </div>

        {search && <p className="text-xs text-gray-400 dark:text-gray-500">{canteens.length} result{canteens.length !== 1 ? 's' : ''} for "<span className="font-semibold text-gray-600 dark:text-gray-300">{search}</span>"</p>}

        {loading ? (
          <div className="grid grid-cols-2 gap-4">
            {[1,2,3,4].map(i => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl p-5 animate-pulse border border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-3 mb-4"><div className="w-12 h-12 rounded-xl bg-gray-200 dark:bg-gray-700" /><div className="flex-1 space-y-2"><div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded" /><div className="h-3 w-24 bg-gray-100 dark:bg-gray-700 rounded" /></div></div>
              </div>
            ))}
          </div>
        ) : canteens.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-300 dark:text-gray-600">
            <Store className="w-12 h-12 mb-3" />
            <p className="font-semibold text-gray-400">{search ? `No results for "${search}"` : `No ${filterStatus === 'all' ? '' : filterStatus} canteens`}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {canteens.map(c => {
              const status = c.isApproved ? 'approved' : c.isRejected ? 'rejected' : 'pending';
              return (
                <div key={c._id} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700/60 p-5 hover:shadow-md transition-all flex flex-col gap-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {c.images?.[0] ? <img src={buildImgUrl(c.images[0])} alt={c.name} className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />
                        : <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center flex-shrink-0"><Store className="w-6 h-6 text-white" /></div>}
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-gray-800 dark:text-white truncate">{c.name}</p>
                        <p className="text-xs text-gray-400 truncate">{c.ownerName || c.owner?.name || 'Unknown'}</p>
                      </div>
                    </div>
                    <StatusBadge status={status} />
                  </div>
                  <div className="space-y-1.5 text-xs text-gray-500 dark:text-gray-400">
                    <div className="flex items-center gap-2"><Calendar className="w-3.5 h-3.5" /><span>Registered {fmtDate(c.createdAt)}</span></div>
                    <div className="flex items-center gap-2"><FileText className="w-3.5 h-3.5" /><span>{c.documents?.length || 0} document(s) submitted</span></div>
                    {c.phone && <div className="flex items-center gap-2"><Phone className="w-3.5 h-3.5" /><span>{c.phone}</span></div>}
                  </div>
                  <div className="flex gap-2 pt-1 mt-auto">
                    <button onClick={() => setSelected(c)} className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-xl border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <Eye className="w-3.5 h-3.5" /> View Details
                    </button>
                    {status === 'pending' && (
                      <>
                        <button onClick={() => { setRejectModal(c._id); setSelected(null); }} className="py-2 px-3 text-xs font-bold rounded-xl border-2 border-red-200 dark:border-red-800 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"><XCircle className="w-3.5 h-3.5" /></button>
                        <button onClick={() => handleApprove(c._id)} disabled={actionLoading} className="py-2 px-3 text-xs font-bold rounded-xl bg-primary-500 hover:bg-primary-600 text-white disabled:opacity-50 transition-colors"><CheckCircle className="w-3.5 h-3.5" /></button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {selected && <DetailModal canteen={selected} onClose={() => setSelected(null)} onApprove={handleApprove} onReject={(id) => { setRejectModal(id); setSelected(null); }} actionLoading={actionLoading} />}

      {rejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setRejectModal(null)} />
          <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-1">Reject Canteen</h3>
            <p className="text-xs text-gray-400 mb-4">Provide a reason for rejection.</p>
            <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder="e.g. Incomplete documents..." rows={3}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-400 resize-none" />
            <div className="flex gap-3 mt-4">
              <button onClick={() => { setRejectModal(null); setRejectReason(''); }} className="flex-1 py-2.5 text-sm font-semibold rounded-xl border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">Cancel</button>
              <button onClick={handleReject} disabled={!rejectReason.trim() || actionLoading} className="flex-1 py-2.5 text-sm font-bold rounded-xl bg-red-500 hover:bg-red-600 text-white disabled:opacity-50 flex items-center justify-center gap-2">
                {actionLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />} Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CanteenApprovals;
