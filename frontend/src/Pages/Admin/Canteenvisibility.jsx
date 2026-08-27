import React, { useEffect, useState, useCallback } from 'react';
import jsPDF from 'jspdf';
import logoSrc from '../../assets/logo.png';
import { authFetch } from '../../utils/authFetch';
import { buildImgUrl } from '../../utils/imageUrl';
import AdminHeader from './components/AdminHeader';
import {
  Store, Eye, EyeOff, Star, ShoppingBag,
  AlertTriangle, RefreshCw, CheckCircle, XCircle,
  Search, Filter, FileDown
} from 'lucide-react';

const fmt  = (n) => (n ?? 0).toLocaleString();

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

const generatePDF = async (canteens, filterVis) => {
  const logoBase64 = await getLogoBase64();
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const now = new Date();

  doc.setFillColor(49, 46, 129);
  doc.rect(0, 0, W, 22, 'F');
  if (logoBase64) doc.addImage(logoBase64, 'PNG', 8, 3, 16, 16);
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14); doc.setFont('helvetica', 'bold');
  doc.text('SmartMess — Canteen Visibility Report', logoBase64 ? 28 : 14, 14);
  doc.setFontSize(8); doc.setFont('helvetica', 'normal');
  doc.text(`Generated: ${now.toLocaleString()}   |   Filter: ${filterVis.toUpperCase()}   |   Total: ${canteens.length}`, W - 14, 14, { align: 'right' });

  const operating = canteens.length;
  const visible   = canteens.filter(c => c.isActive).length;
  const hidden    = canteens.filter(c => !c.isActive).length;
  // ✅ Fixed: use averageRating (not c.rating)
  const avgRating = canteens.length
    ? (canteens.reduce((s, c) => s + (c.averageRating || 0), 0) / canteens.length).toFixed(1)
    : '0.0';

  const boxes = [
    { label: 'Operating',  value: operating, color: [99, 102, 241]  },
    { label: 'Visible',    value: visible,   color: [34, 197, 94]   },
    { label: 'Hidden',     value: hidden,    color: [107, 114, 128] },
    { label: 'Avg Rating', value: avgRating, color: [245, 158, 11]  },
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
    { header: '#',            width: 10 },
    { header: 'Canteen Name', width: 55 },
    { header: 'Owner',        width: 45 },
    { header: 'Visibility',   width: 22 },
    { header: 'Rating',       width: 20 },
    { header: 'Reviews',      width: 20 },
    { header: 'Orders',       width: 22 },
    { header: 'Complaints',   width: 22 },
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
    const visColor  = c.isActive ? [34, 197, 94] : [107, 114, 128];
    const compColor = (c.complaintCount || 0) > 0 ? [245, 158, 11] : [107, 114, 128];
    const row = [
      String(i + 1),
      c.canteenName || c.name || '—',
      c.ownerName || '—',
      c.isActive ? 'Visible' : 'Hidden',
      // ✅ Fixed: use averageRating
      (c.averageRating || 0).toFixed(1),
      fmt(c.totalRatings || 0),
      // ✅ Fixed: use totalOrders
      fmt(c.totalOrders || 0),
      String(c.complaintCount || 0),
    ];
    x = 14;
    cols.forEach((col, ci) => {
      if (ci === 3) { doc.setTextColor(...visColor); doc.setFont('helvetica', 'bold'); }
      else if (ci === 7) { doc.setTextColor(...compColor); doc.setFont('helvetica', 'bold'); }
      else { doc.setTextColor(31, 41, 55); doc.setFont('helvetica', 'normal'); }
      doc.setFontSize(7.5);
      doc.text(row[ci], x + 2, y + 5.5);
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
  doc.save(`canteen_visibility_${now.toISOString().slice(0, 10)}.pdf`);
};

const StatCard = ({ icon: Icon, label, value, color, loading }) => (
  <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700/60 p-5 flex items-center gap-4 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
    <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
      <Icon className="w-6 h-6 text-white" strokeWidth={1.8} />
    </div>
    <div>
      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-0.5">{label}</p>
      {loading
        ? <div className="h-7 w-16 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse mt-1" />
        : <p className="text-2xl font-black text-gray-800 dark:text-white tabular-nums">{fmt(value)}</p>}
    </div>
    <div className={`absolute -right-3 -top-3 w-20 h-20 rounded-full opacity-[0.07] ${color}`} />
  </div>
);

const StarRating = ({ rating = 0, totalRatings = 0 }) => (
  <div className="flex items-center gap-0.5">
    {[1, 2, 3, 4, 5].map(s => (
      <Star
        key={s}
        className={`w-3 h-3 ${s <= Math.round(rating) ? 'text-amber-400 fill-amber-400' : 'text-gray-300 dark:text-gray-600'}`}
      />
    ))}
    <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">
      {rating ? rating.toFixed(1) : '—'}
    </span>
    {totalRatings > 0 && (
      <span className="text-[10px] text-gray-400 ml-0.5">({totalRatings})</span>
    )}
  </div>
);

const CanteenVisibility = () => {
  const [canteens, setCanteens]         = useState([]);
  const [allCanteens, setAllCanteens]   = useState([]);
  const [stats, setStats]               = useState({ operating: 0, visible: 0, hidden: 0 });
  const [loading, setLoading]           = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [toggling, setToggling]         = useState(null);
  const [search, setSearch]             = useState('');
  const [filterVis, setFilterVis]       = useState('all');
  const [toast, setToast]               = useState(null);
  const [pdfLoading, setPdfLoading]     = useState(false);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const r = await authFetch('/api/admin/canteens/visibility-stats');
      const j = await r.json();
      if (j.success) setStats(j.data);
    } catch {}
    finally { setStatsLoading(false); }
  }, []);

  const fetchCanteens = useCallback(async () => {
    setLoading(true);
    try {
      // ✅ This endpoint now returns totalOrders, averageRating, totalRatings, complaintCount
      const r = await authFetch('/api/admin/canteens/approved-list');
      const j = await r.json();
      if (j.success) {
        setAllCanteens(j.data);
        setCanteens(j.data);
      }
    } catch {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchStats(); fetchCanteens(); }, []);

  // Filter + search
  useEffect(() => {
    let result = allCanteens;
    if (filterVis === 'visible') result = result.filter(c => c.isActive);
    if (filterVis === 'hidden')  result = result.filter(c => !c.isActive);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(c =>
        (c.canteenName || c.name || '').toLowerCase().includes(q) ||
        (c.ownerName || '').toLowerCase().includes(q)
      );
    }
    setCanteens(result);
  }, [search, filterVis, allCanteens]);

  const handleToggle = async (id, current) => {
    setToggling(id);
    try {
      const canteen = allCanteens.find(c => c._id?.toString() === id.toString());

      const r = await authFetch(`/api/admin/canteens/${id}/visibility`, {
        method: 'PUT',
        body: JSON.stringify({ isActive: !current }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.message);

      // Optimistic update
      setAllCanteens(prev =>
        prev.map(c => c._id?.toString() === id.toString() ? { ...c, isActive: !current } : c)
      );

      // Log activity
      await authFetch('/api/admin/dashboard/activity', {
        method: 'POST',
        body: JSON.stringify({
          type: !current ? 'CANTEEN_VISIBLE' : 'CANTEEN_HIDDEN',
          description: `Canteen "${canteen?.canteenName || canteen?.name || id}" has been ${!current ? 'made visible to students' : 'hidden from students'}`,
        }),
      }).catch(() => {});

      fetchStats();
      showToast(`Canteen ${!current ? 'is now visible to students' : 'has been hidden'}`);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setToggling(null);
    }
  };

  const handleExportPDF = async () => {
    setPdfLoading(true);
    try {
      await generatePDF(canteens, filterVis);
      showToast('PDF exported successfully!');
    } catch (err) {
      showToast('PDF export failed: ' + err.message, 'error');
    } finally {
      setPdfLoading(false);
    }
  };

  const VIS_FILTERS = [
    { key: 'all',     label: 'All',     cls: 'text-indigo-600 bg-indigo-50 border-indigo-200 dark:bg-indigo-900/20 dark:border-indigo-700 dark:text-indigo-400' },
    { key: 'visible', label: 'Visible', cls: 'text-green-600 bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400' },
    { key: 'hidden',  label: 'Hidden',  cls: 'text-gray-600 bg-gray-100 border-gray-300 dark:bg-gray-700 dark:border-gray-500 dark:text-gray-300' },
  ];

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-gray-50 dark:bg-gray-900">
      <AdminHeader title="Canteen Visibility" subtitle="Manage canteen visibility and operations" />

      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg text-sm font-semibold flex items-center gap-2 ${toast.type === 'error' ? 'bg-red-500' : 'bg-green-500'} text-white`}>
          {toast.type === 'error' ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4" style={{ scrollbarWidth: 'none' }}>
        <style>{`*::-webkit-scrollbar{display:none}`}</style>

        {/* Stat Cards */}
        <div className="grid grid-cols-3 gap-4">
          <StatCard icon={Store}  label="Operating Canteens" value={stats.operating} color="bg-indigo-500"  loading={statsLoading} />
          <StatCard icon={Eye}    label="Visible Canteens"   value={stats.visible}   color="bg-green-500"   loading={statsLoading} />
          <StatCard icon={EyeOff} label="Hidden Canteens"    value={stats.hidden}    color="bg-gray-500"    loading={statsLoading} />
        </div>

        {/* Search + Filter bar */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by canteen or owner name..."
              className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-400 transition-all"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
            {VIS_FILTERS.map(f => (
              <button
                key={f.key}
                onClick={() => setFilterVis(f.key)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${filterVis === f.key ? f.cls : 'text-gray-400 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-gray-300'}`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <button
            onClick={handleExportPDF}
            disabled={pdfLoading || canteens.length === 0}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white disabled:opacity-50 transition-colors shadow-sm"
          >
            {pdfLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <FileDown className="w-3.5 h-3.5" />}
            Export PDF
          </button>
        </div>

        {(search || filterVis !== 'all') && (
          <p className="text-xs text-gray-400 dark:text-gray-500">
            Showing <span className="font-semibold text-gray-600 dark:text-gray-300">{canteens.length}</span> canteen{canteens.length !== 1 ? 's' : ''}
            {search && <> matching "<span className="font-semibold text-gray-600 dark:text-gray-300">{search}</span>"</>}
            {filterVis !== 'all' && <> · <span className="capitalize">{filterVis}</span> only</>}
          </p>
        )}

        {/* Table */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700/60 overflow-hidden">

          {/* Table Header */}
          <div className="grid grid-cols-12 gap-4 px-5 py-3 border-b border-gray-100 dark:border-gray-700/60 bg-gray-50 dark:bg-gray-700/30">
            <div className="col-span-3 text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">Canteen</div>
            <div className="col-span-2 text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">Status</div>
            <div className="col-span-2 text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">Rating</div>
            <div className="col-span-2 text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">Orders</div>
            <div className="col-span-2 text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">Complaints</div>
            <div className="col-span-1 text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 text-right">Toggle</div>
          </div>

          {loading ? (
            <div className="divide-y divide-gray-50 dark:divide-gray-700/50">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="grid grid-cols-12 gap-4 px-5 py-4 animate-pulse">
                  <div className="col-span-3 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gray-200 dark:bg-gray-700 flex-shrink-0" />
                    <div className="space-y-1.5 flex-1">
                      <div className="h-3 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
                      <div className="h-2.5 w-16 bg-gray-100 dark:bg-gray-700 rounded" />
                    </div>
                  </div>
                  {[1, 2, 3, 4].map(j => (
                    <div key={j} className="col-span-2 h-4 bg-gray-100 dark:bg-gray-700 rounded my-auto" />
                  ))}
                  <div className="col-span-1 h-7 bg-gray-100 dark:bg-gray-700 rounded-xl my-auto" />
                </div>
              ))}
            </div>
          ) : canteens.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-300 dark:text-gray-600">
              <Store className="w-10 h-10 mb-2" />
              <p className="text-sm font-medium text-gray-400">
                {search ? `No results for "${search}"` : 'No canteens found'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50 dark:divide-gray-700/50">
              {canteens.map(c => (
                <div
                  key={c._id}
                  className="grid grid-cols-12 gap-4 px-5 py-3.5 items-center hover:bg-gray-50 dark:hover:bg-gray-700/20 transition-colors"
                >
                  {/* Canteen name + owner */}
                  <div className="col-span-3 flex items-center gap-3 min-w-0">
                    {c.image
                      ? <img src={buildImgUrl(c.image)} alt={c.canteenName || c.name} className="w-9 h-9 rounded-xl object-cover flex-shrink-0" />
                      : <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center flex-shrink-0">
                          <Store className="w-4 h-4 text-white" />
                        </div>
                    }
                    <div className="min-w-0">
                      {/* ✅ Fixed: canteenName is the correct field */}
                      <p className="text-sm font-bold text-gray-800 dark:text-white truncate">
                        {c.canteenName || c.name || '—'}
                      </p>
                      <p className="text-[10px] text-gray-400 truncate">{c.ownerName || '—'}</p>
                    </div>
                  </div>

                  {/* Visibility status badge */}
                  <div className="col-span-2">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      c.isActive
                        ? 'bg-green-50 text-green-600 ring-1 ring-green-200 dark:bg-green-900/20 dark:text-green-400 dark:ring-green-800'
                        : 'bg-gray-100 text-gray-500 ring-1 ring-gray-200 dark:bg-gray-700 dark:text-gray-400 dark:ring-gray-600'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${c.isActive ? 'bg-green-500' : 'bg-gray-400'}`} />
                      {c.isActive ? 'Visible' : 'Hidden'}
                    </span>
                  </div>

                  {/* ✅ Rating — uses averageRating + totalRatings from aggregation */}
                  <div className="col-span-2">
                    <StarRating rating={c.averageRating} totalRatings={c.totalRatings} />
                  </div>

                  {/* ✅ Orders — uses totalOrders from aggregation */}
                  <div className="col-span-2">
                    <div className="flex items-center gap-1.5">
                      <ShoppingBag className="w-3.5 h-3.5 text-gray-400" />
                      <span className="text-sm font-bold text-gray-700 dark:text-gray-300">
                        {fmt(c.totalOrders)}
                      </span>
                    </div>
                  </div>

                  {/* ✅ Complaints — uses complaintCount from aggregation */}
                  <div className="col-span-2">
                    <div className="flex items-center gap-1.5">
                      <AlertTriangle className={`w-3.5 h-3.5 ${(c.complaintCount || 0) > 0 ? 'text-amber-400' : 'text-gray-300 dark:text-gray-600'}`} />
                      <span className={`text-sm font-bold ${(c.complaintCount || 0) > 0 ? 'text-amber-500' : 'text-gray-400'}`}>
                        {fmt(c.complaintCount)}
                      </span>
                    </div>
                  </div>

                  {/* Toggle button */}
                  <div className="col-span-1 flex justify-end">
                    <button
                      onClick={() => handleToggle(c._id, c.isActive)}
                      disabled={toggling === c._id}
                      className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl transition-all disabled:opacity-50 ${
                        c.isActive
                          ? 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                          : 'bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 hover:bg-green-100'
                      }`}
                    >
                      {toggling === c._id
                        ? <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        : c.isActive
                          ? <><EyeOff className="w-3.5 h-3.5" /> Hide</>
                          : <><Eye className="w-3.5 h-3.5" /> Show</>
                      }
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CanteenVisibility;
