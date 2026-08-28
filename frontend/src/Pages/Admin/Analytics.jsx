import React, { useEffect, useState, useCallback } from 'react';
import jsPDF from 'jspdf';
import logoSrc from '../../assets/logo.png';
import AdminHeader from './components/AdminHeader';
import { useTheme } from '../../context/ThemeContext';
import { buildImgUrl } from '../../utils/imageUrl';
import { authFetch } from '../../utils/authFetch';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import {
  TrendingUp, ShoppingBag, DollarSign, Award,
  Search, FileDown, RefreshCw, ChevronUp, ChevronDown,
  Star, Download, Trophy,
} from 'lucide-react';

const fmt    = (n) => (n ?? 0).toLocaleString();
const fmtCur = (n) => `Rs. ${(n ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const MONTHS      = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const LINE_COLORS = ['#22c55e','#6366f1','#f59e0b','#ec4899','#06b6d4','#f97316','#8b5cf6','#14b8a6'];

// ── Logo loader ───────────────────────────────────────────────────────────────
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

// ── PDF Generator ─────────────────────────────────────────────────────────────
const generatePDF = async (canteens, month, year) => {
  const logoBase64 = await getLogoBase64();
  const doc        = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const W          = doc.internal.pageSize.getWidth();
  const H          = doc.internal.pageSize.getHeight();
  const now        = new Date();
  const monthLabel = `${MONTHS[month - 1]} ${year}`;

  doc.setFillColor(20, 83, 45);
  doc.rect(0, 0, W, 22, 'F');
  if (logoBase64) doc.addImage(logoBase64, 'PNG', 8, 3, 16, 16);
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14); doc.setFont('helvetica', 'bold');
  doc.text('SmartMess — Canteen Analytics Report', logoBase64 ? 28 : 14, 14);
  doc.setFontSize(8); doc.setFont('helvetica', 'normal');
  doc.text(`Generated: ${now.toLocaleString()}   |   Period: ${monthLabel}   |   Canteens: ${canteens.length}`, W - 14, 14, { align: 'right' });

  const totalRevenue = canteens.reduce((s, c) => s + (c.monthlyRevenue || 0), 0);
  const totalOrders  = canteens.reduce((s, c) => s + (c.monthlyOrders  || 0), 0);
  const topCanteen   = [...canteens].sort((a,b) => (b.monthlyOrders||0)-(a.monthlyOrders||0))[0]?.name || '—';
  const boxes = [
    { label: 'Total Revenue', value: `Rs.${(totalRevenue/1000).toFixed(1)}k`, color: [34,197,94]  },
    { label: 'Total Orders',  value: String(totalOrders),                      color: [99,102,241] },
    { label: 'Top Canteen',   value: topCanteen.slice(0,14),                   color: [245,158,11] },
    { label: 'Period',        value: monthLabel,                               color: [20,83,45]   },
  ];
  boxes.forEach((b, i) => {
    const x = 14 + i * 65;
    doc.setFillColor(...b.color);
    doc.roundedRect(x, 28, 60, 18, 3, 3, 'F');
    doc.setTextColor(255,255,255);
    doc.setFontSize(12); doc.setFont('helvetica','bold');
    doc.text(String(b.value), x+30, 39, { align:'center' });
    doc.setFontSize(7); doc.setFont('helvetica','normal');
    doc.text(b.label, x+30, 43, { align:'center' });
  });

  const startY = 52;
  const cols = [
    { header: 'Rank',            width: 14 },
    { header: 'Canteen Name',    width: 58 },
    { header: 'Monthly Orders',  width: 38 },
    { header: 'Monthly Revenue', width: 45 },
    { header: 'Total Revenue',   width: 45 },
    { header: 'Total Orders',    width: 35 },
    { header: 'Avg Order Value', width: 38 },
  ];
  let x = 14;
  doc.setFillColor(243,244,246); doc.rect(14, startY, W-28, 8, 'F');
  doc.setTextColor(75,85,99); doc.setFontSize(8); doc.setFont('helvetica','bold');
  cols.forEach(col => { doc.text(col.header, x+2, startY+5.5); x += col.width; });

  doc.setFont('helvetica','normal');
  let y = startY + 8;
  canteens.forEach((c, i) => {
    if (y > H-20) { doc.addPage(); y = 20; }
    if (i%2===0) { doc.setFillColor(249,250,251); doc.rect(14,y,W-28,8,'F'); }
    const avg       = c.monthlyOrders ? ((c.monthlyRevenue||0)/c.monthlyOrders).toFixed(2) : '0.00';
    const rankColor = i===0 ? [180,120,0] : i===1 ? [107,114,128] : i===2 ? [150,70,0] : [31,41,55];
    const row = [
      `#${i+1}`, c.name||'—', fmt(c.monthlyOrders||0),
      `Rs.${(c.monthlyRevenue||0).toLocaleString()}`,
      `Rs.${(c.totalRevenue||0).toLocaleString()}`,
      fmt(c.totalOrders||0), `Rs.${avg}`,
    ];
    x = 14; doc.setFontSize(7.5);
    cols.forEach((col, ci) => {
      if (ci===0) { doc.setTextColor(...rankColor); doc.setFont('helvetica','bold'); }
      else        { doc.setTextColor(31,41,55);     doc.setFont('helvetica','normal'); }
      doc.text(doc.splitTextToSize(row[ci], col.width-3)[0], x+2, y+5.5);
      x += col.width;
    });
    doc.setDrawColor(229,231,235); doc.line(14,y+8,W-14,y+8);
    y += 8;
  });
  doc.setTextColor(156,163,175); doc.setFontSize(7); doc.setFont('helvetica','normal');
  doc.text('SmartMess Admin System — Confidential', 14, H-5);
  doc.text(`Page 1  |  ${monthLabel}`, W-14, H-5, { align:'right' });
  doc.save(`analytics_${MONTHS[month-1].toLowerCase()}_${year}.pdf`);
};

// ── CSV Export ────────────────────────────────────────────────────────────────
const exportCSV = (canteens, month, year) => {
  if (!canteens.length) return;
  const monthLabel = `${MONTHS[month-1]} ${year}`;
  const headers    = [
    'Rank', 'Canteen Name',
    `Orders (${monthLabel})`, `Revenue Rs (${monthLabel})`,
    'Total Revenue Rs', 'Total Orders', 'Avg Order Value Rs',
  ];
  const rows = canteens.map((c, i) => {
    const avg = c.monthlyOrders ? ((c.monthlyRevenue||0)/c.monthlyOrders).toFixed(2) : '0.00';
    return [
      `#${i+1}`,
      `"${(c.name||'').replace(/"/g,'""')}"`,
      c.monthlyOrders  || 0,
      (c.monthlyRevenue || 0).toFixed(2),
      (c.totalRevenue   || 0).toFixed(2),
      c.totalOrders    || 0,
      avg,
    ].join(',');
  });
  const csv  = [`SmartMess Canteen Analytics — ${monthLabel}`, headers.join(','), ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const a    = Object.assign(document.createElement('a'), {
    href: URL.createObjectURL(blob),
    download: `analytics_${MONTHS[month-1].toLowerCase()}_${year}.csv`,
  });
  a.click();
  URL.revokeObjectURL(a.href);
};

// ── Stat Card ─────────────────────────────────────────────────────────────────
const StatCard = ({ icon: Icon, label, value, sub, color, loading }) => (
  <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700/60 p-5 flex items-center gap-4 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
    <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
      <Icon className="w-6 h-6 text-white" strokeWidth={1.8} />
    </div>
    <div className="min-w-0 flex-1">
      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-0.5">{label}</p>
      {loading
        ? <div className="h-7 w-24 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse mt-1" />
        : <>
            <p className="text-xl font-black text-gray-800 dark:text-white tabular-nums truncate">{value}</p>
            {sub && <p className="text-[10px] text-gray-400 truncate mt-0.5">{sub}</p>}
          </>}
    </div>
    <div className={`absolute -right-3 -top-3 w-20 h-20 rounded-full opacity-[0.07] ${color}`} />
  </div>
);

// ── Rank Badge ────────────────────────────────────────────────────────────────
const RankBadge = ({ rank }) => {
  if (rank === 1) return (
    <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 shadow-sm">
      <Trophy className="w-3.5 h-3.5 text-white" />
    </span>
  );
  if (rank === 2) return <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-gradient-to-br from-gray-300 to-gray-500 text-white text-xs font-black shadow-sm">2</span>;
  if (rank === 3) return <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 text-white text-xs font-black shadow-sm">3</span>;
  return <span className="text-xs font-bold text-gray-400 dark:text-gray-500 w-7 text-center">#{rank}</span>;
};

// ── Sort Icon ─────────────────────────────────────────────────────────────────
const SortIcon = ({ col, sortCol, sortDir }) => {
  if (sortCol !== col) return <ChevronUp className="w-3 h-3 text-gray-300 dark:text-gray-600" />;
  return sortDir === 'asc'
    ? <ChevronUp   className="w-3 h-3 text-primary-500" />
    : <ChevronDown className="w-3 h-3 text-primary-500" />;
};

// ── Chart Tooltip ─────────────────────────────────────────────────────────────
const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl shadow-xl px-3 py-2.5 text-xs min-w-36">
      <p className="font-bold text-gray-700 dark:text-gray-200 mb-2">{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center justify-between gap-4 mb-0.5">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: p.color }} />
            <span className="text-gray-500 dark:text-gray-400 truncate max-w-24">{p.name}</span>
          </div>
          <span className="font-bold text-gray-800 dark:text-white">{fmt(p.value)}</span>
        </div>
      ))}
    </div>
  );
};

// ── Main ──────────────────────────────────────────────────────────────────────
const Analytics = () => {
  const { theme } = useTheme();
  const now       = new Date();

  const [month, setMonth]               = useState(now.getMonth() + 1);
  const [year,  setYear]                = useState(now.getFullYear());
  const [canteens, setCanteens]         = useState([]);
  const [allCanteens, setAllCanteens]   = useState([]);
  const [chartData, setChartData]       = useState([]);
  const [summary, setSummary]           = useState({ totalRevenue: 0, totalOrders: 0, topCanteen: '—' });
  const [loading, setLoading]           = useState(true);
  const [chartLoading, setChartLoading] = useState(true);
  const [search, setSearch]             = useState('');
  const [sortCol, setSortCol]           = useState('monthlyRevenue');
  const [sortDir, setSortDir]           = useState('desc');
  const [pdfLoading, setPdfLoading]     = useState(false);
  const [csvLoading, setCsvLoading]     = useState(false);

  // ── Auth helper ─────────────────────────────────────────────────────────────
  // ── Fetch canteen analytics ─────────────────────────────────────────────────
  const fetchAnalytics = useCallback(async (m, y) => {
    setLoading(true);
    try {
      const r = await authFetch(`/api/admin/analytics/canteens?month=${m}&year=${y}`);
      const j = await r.json();
      if (j.success) {
        setAllCanteens(j.data);
        setCanteens(j.data);
        setSummary(j.summary || { totalRevenue: 0, totalOrders: 0, topCanteen: '—' });
      }
    } catch {}
    finally { setLoading(false); }
  }, []);

  // ── Fetch monthly trend ─────────────────────────────────────────────────────
  const fetchChart = useCallback(async (y) => {
    setChartLoading(true);
    try {
      const r = await authFetch(`/api/admin/analytics/monthly-trend?year=${y}`);
      const j = await r.json();
      if (j.success) setChartData(j.data);
    } catch {}
    finally { setChartLoading(false); }
  }, []);

  useEffect(() => { fetchAnalytics(month, year); }, [month, year]);
  useEffect(() => { fetchChart(year); }, [year]);

  useEffect(() => {
    if (!search.trim()) { setCanteens(allCanteens); return; }
    const q = search.toLowerCase();
    setCanteens(allCanteens.filter(c => c.name?.toLowerCase().includes(q)));
  }, [search, allCanteens]);

  const handleSort = (col) => {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir('desc'); }
  };

  // sorted display (search results)
  const sortFn = (a, b) => {
  const va = a[sortCol] ?? 0, vb = b[sortCol] ?? 0;
  if (va !== vb) return sortDir === 'asc' ? va - vb : vb - va;
  // fallback: if monthly values are equal, rank by totalRevenue desc
  if (sortCol === 'monthlyRevenue' || sortCol === 'monthlyOrders') {
    return (b.totalRevenue ?? 0) - (a.totalRevenue ?? 0);
  }
  return 0;
};

const sorted    = [...canteens].sort(sortFn);
const allSorted = [...allCanteens].sort(sortFn);
  const canteenNames = [...new Set(chartData.flatMap(d => Object.keys(d).filter(k => k !== 'month')))];

  const handleExportPDF = async () => {
    setPdfLoading(true);
    try { await generatePDF(allSorted, month, year); }
    catch (err) { console.error('PDF error:', err); }
    finally { setPdfLoading(false); }
  };

  const handleExportCSV = () => {
    setCsvLoading(true);
    try { exportCSV(allSorted, month, year); }
    catch (err) { console.error('CSV error:', err); }
    finally { setTimeout(() => setCsvLoading(false), 500); }
  };

  const SORT_COLS = [
    { key: 'monthlyOrders',  label: 'Monthly Orders'  },
    { key: 'monthlyRevenue', label: 'Monthly Revenue' },
    { key: 'totalRevenue',   label: 'Total Revenue'   },
    { key: 'totalOrders',    label: 'Total Orders'    },
  ];
  const years = [now.getFullYear(), now.getFullYear()-1, now.getFullYear()-2];

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-gray-50 dark:bg-gray-900">
      <AdminHeader title="Analytics" subtitle="Canteen performance and revenue insights" />

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4" style={{ scrollbarWidth: 'none' }}>
        <style>{`*::-webkit-scrollbar{display:none}`}</style>

        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-4">
          <StatCard icon={DollarSign}  label="Total Revenue" value={fmtCur(summary.totalRevenue)} sub={`${MONTHS[month-1]} ${year}`} color="bg-emerald-500" loading={loading} />
          <StatCard icon={ShoppingBag} label="Total Orders"  value={fmt(summary.totalOrders)}      sub={`${MONTHS[month-1]} ${year}`} color="bg-indigo-500" loading={loading} />
          <StatCard icon={Award}       label="Most Popular"  value={summary.topCanteen || '—'}      sub="Highest monthly orders"      color="bg-amber-500"  loading={loading} />
        </div>

        {/* Line Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700/60 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-primary-500" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-800 dark:text-white">Monthly Orders Trend</h3>
                <p className="text-[11px] text-gray-400">Orders per canteen throughout {year}</p>
              </div>
            </div>
            <select value={year} onChange={e => setYear(Number(e.target.value))}
              className="text-xs font-semibold px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-400">
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <div style={{ height: 220 }}>
            {chartLoading ? (
              <div className="flex items-end gap-2 h-full px-2 pb-6 animate-pulse">
                {[40,70,55,80,60,90,50,75,65,85,45,70].map((h,i) => (
                  <div key={i} className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-t-lg" style={{ height:`${h}%` }} />
                ))}
              </div>
            ) : chartData.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-300 dark:text-gray-600">
                <TrendingUp className="w-8 h-8 mb-2" /><p className="text-sm">No data for {year}</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top:5, right:20, left:-10, bottom:5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={theme==='dark'?'#1f2937':'#f3f4f6'} />
                  <XAxis dataKey="month" tick={{ fontSize:11, fill:theme==='dark'?'#6b7280':'#9ca3af' }} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize:11, fill:theme==='dark'?'#6b7280':'#9ca3af' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<ChartTooltip />} />
                  <Legend wrapperStyle={{ fontSize:11, paddingTop:8 }} />
                  {canteenNames.map((name,i) => (
                    <Line key={name} type="monotone" dataKey={name} stroke={LINE_COLORS[i%LINE_COLORS.length]} strokeWidth={2} dot={{ r:3 }} activeDot={{ r:5 }} />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Rankings Table */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700/60 overflow-hidden">

          {/* Toolbar */}
          <div className="px-5 pt-3.5 pb-3 border-b border-gray-100 dark:border-gray-700/60 space-y-2.5">
            {/* Row 1: title + pickers + period badge + export buttons */}
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2 flex-shrink-0">
                <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                <h3 className="text-sm font-bold text-gray-800 dark:text-white">Canteen Rankings</h3>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <select value={month} onChange={e => { setMonth(Number(e.target.value)); setSearch(''); }}
                  className="text-xs font-semibold px-2.5 py-1.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-400">
                  {MONTHS.map((m,i) => <option key={i} value={i+1}>{m}</option>)}
                </select>
                <select value={year} onChange={e => { setYear(Number(e.target.value)); setSearch(''); }}
                  className="text-xs font-semibold px-2.5 py-1.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-400">
                  {years.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
              <span className="text-[10px] font-bold px-2.5 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800 whitespace-nowrap flex-shrink-0">
                {MONTHS[month-1]} {year}
              </span>
              <div className="flex items-center gap-2 ml-auto flex-shrink-0">
                <button onClick={handleExportCSV} disabled={csvLoading || !allSorted.length}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-40 transition-colors">
                  {csvLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />} CSV
                </button>
                <button onClick={handleExportPDF} disabled={pdfLoading || !allSorted.length}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white disabled:opacity-50 transition-colors shadow-sm">
                  {pdfLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <FileDown className="w-3.5 h-3.5" />} PDF
                </button>
              </div>
            </div>
            {/* Row 2: search — full width */}
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search canteen by name..."
                className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-400 transition-all" />
            </div>
          </div>

          {/* Search hint */}
          {search && (
            <div className="px-5 py-2 bg-blue-50 dark:bg-blue-900/10 border-b border-blue-100 dark:border-blue-800/30 flex items-center justify-between">
              <p className="text-xs text-blue-600 dark:text-blue-400">
                <span className="font-bold">{sorted.length}</span> of <span className="font-bold">{allCanteens.length}</span> canteens match "<span className="font-bold">{search}</span>"
              </p>
              <button onClick={() => setSearch('')} className="text-xs text-blue-500 underline hover:no-underline">Clear</button>
            </div>
          )}

          {/* Table Header */}
          <div className="grid grid-cols-12 gap-2 px-5 py-2.5 bg-gray-50 dark:bg-gray-700/30 border-b border-gray-100 dark:border-gray-700/60">
            <div className="col-span-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">Rank</div>
            <div className="col-span-3 text-[10px] font-bold uppercase tracking-widest text-gray-400">Canteen</div>
            {SORT_COLS.map(({ key, label }) => (
              <div key={key} onClick={() => handleSort(key)}
                className="col-span-2 flex items-center gap-1 cursor-pointer group select-none">
                <span className={`text-[10px] font-bold uppercase tracking-widest transition-colors ${sortCol===key ? 'text-primary-500' : 'text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300'}`}>{label}</span>
                <SortIcon col={key} sortCol={sortCol} sortDir={sortDir} />
              </div>
            ))}
            <div className="col-span-2 text-[10px] font-bold uppercase tracking-widest text-gray-400">Avg / Order</div>
          </div>

          {/* Rows */}
          {loading ? (
            <div className="divide-y divide-gray-50 dark:divide-gray-700/50">
              {[1,2,3,4,5].map(i => (
                <div key={i} className="grid grid-cols-12 gap-2 px-5 py-4 animate-pulse items-center">
                  <div className="col-span-1 h-7 w-7 bg-gray-200 dark:bg-gray-700 rounded-full" />
                  <div className="col-span-3 flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-gray-200 dark:bg-gray-700 flex-shrink-0" />
                    <div className="h-3 w-28 bg-gray-200 dark:bg-gray-700 rounded" />
                  </div>
                  {[1,2,3,4,5].map(j => <div key={j} className="col-span-2 h-3 bg-gray-100 dark:bg-gray-700 rounded" />)}
                </div>
              ))}
            </div>
          ) : sorted.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-300 dark:text-gray-600">
              <TrendingUp className="w-10 h-10 mb-2" />
              <p className="text-sm font-medium text-gray-400">
                {search ? `No canteens matching "${search}"` : `No data for ${MONTHS[month-1]} ${year}`}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50 dark:divide-gray-700/50">
              {sorted.map((c, i) => {
                const avg   = c.monthlyOrders ? ((c.monthlyRevenue||0)/c.monthlyOrders) : 0;
                const isTop = i === 0 && !search;
                return (
                  <div key={c._id}
                    className={`grid grid-cols-12 gap-2 px-5 py-3.5 items-center transition-colors ${isTop ? 'bg-amber-50/50 dark:bg-amber-900/10 hover:bg-amber-50 dark:hover:bg-amber-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-700/20'}`}>
                    <div className="col-span-1"><RankBadge rank={i+1} /></div>
                    <div className="col-span-3 flex items-center gap-2.5 min-w-0">
                      {c.images?.[0]
                        ? <img src={buildImgUrl(c.images[0])} alt={c.name} className="w-9 h-9 rounded-xl object-cover flex-shrink-0 ring-1 ring-gray-100 dark:ring-gray-700" />
                        : <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center flex-shrink-0 text-white font-black text-sm shadow-sm">
                            {c.name?.[0]?.toUpperCase()||'?'}
                          </div>}
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-gray-800 dark:text-white truncate">{c.name}</p>
                        {isTop && <span className="text-[9px] font-bold text-amber-500 uppercase tracking-wide">⭐ Top Performer</span>}
                      </div>
                    </div>
                    <div className="col-span-2">
                      <p className="text-sm font-black text-indigo-600 dark:text-indigo-400">{fmt(c.monthlyOrders||0)}</p>
                      <p className="text-[10px] text-gray-400">orders</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-sm font-black text-emerald-600 dark:text-emerald-400">{fmtCur(c.monthlyRevenue||0)}</p>
                      <p className="text-[10px] text-gray-400">this month</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-xs font-bold text-gray-700 dark:text-gray-300">{fmtCur(c.totalRevenue||0)}</p>
                      <p className="text-[10px] text-gray-400">all time</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-xs font-bold text-gray-700 dark:text-gray-300">{fmt(c.totalOrders||0)}</p>
                      <p className="text-[10px] text-gray-400">all time</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">{fmtCur(avg)}</p>
                      <p className="text-[10px] text-gray-400">avg value</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Footer totals */}
          {sorted.length > 0 && !loading && (
            <div className="px-5 py-3 border-t border-gray-100 dark:border-gray-700/60 bg-gray-50 dark:bg-gray-800 flex items-center gap-4 flex-wrap">
              <p className="text-[11px] text-gray-400">
                {sorted.length} canteen{sorted.length!==1?'s':''} {search ? `matching "${search}"` : `in ${MONTHS[month-1]} ${year}`}
              </p>
              <div className="ml-auto flex items-center gap-4">
                <p className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
                  {fmt(sorted.reduce((s,c) => s+(c.monthlyOrders||0),0))} total orders
                </p>
                <p className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                  {fmtCur(sorted.reduce((s,c) => s+(c.monthlyRevenue||0),0))} total revenue
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Analytics;
