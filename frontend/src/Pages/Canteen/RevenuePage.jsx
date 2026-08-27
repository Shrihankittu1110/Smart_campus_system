//frontend/src/pages/Canteen/RevenuePage.jsx

import { useState, useEffect } from 'react';
import {
  TrendingUp, DollarSign, ShoppingBag, Star,
  FileText, Download, Loader2, CheckCircle, XCircle,
  ChevronDown, Calendar
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const API = '/api/canteen/revenue';

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

const CustomTooltip = ({ active, payload, label, prefix = 'Rs.' }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl px-3 py-2 shadow-lg text-xs">
      <p className="font-bold text-gray-600 dark:text-gray-300 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="font-semibold">
          {p.name}: {prefix}{p.value?.toLocaleString()}
        </p>
      ))}
    </div>
  );
};

export default function RevenuePage() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast]     = useState(null);
  const [chartTab, setChartTab] = useState('daily'); // 'daily' | 'monthly'
  const [year, setYear]       = useState(new Date().getFullYear());
  const [month, setMonth]     = useState(new Date().getMonth() + 1);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchRevenue = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const r = await fetch(`${API}?year=${year}&month=${month}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const j = await r.json();
      if (j.success) setData(j.data);
    } catch { showToast('Failed to load revenue data', 'error'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchRevenue(); }, [year, month]);

  // ── PDF Export ──────────────────────────────────────────────────────────────
  const exportPDF = () => {
    if (!data) return;
    const doc = new jsPDF();

    // Header
    doc.setFillColor(22, 163, 74);
    doc.rect(0, 0, 210, 30, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('SmartMess — Revenue Report', 14, 20);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated: ${new Date().toLocaleString()}`, 196, 20, { align: 'right' });

    // Summary
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Summary', 14, 42);

    autoTable(doc, {
      startY: 46,
      head: [['Metric', 'Value']],
      body: [
        ['Total Revenue',        `Rs. ${data.summary.totalRevenue.toLocaleString()}`],
        ['Total Orders',         data.summary.totalOrders],
        ['Average Order Value',  `Rs. ${data.summary.avgOrderValue.toLocaleString()}`],
        ['Period',               `${MONTHS[month - 1]} ${year}`],
      ],
      headStyles: { fillColor: [22, 163, 74], textColor: 255 },
      styles: { fontSize: 9 },
    });

    // Popular meals
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Popular Meals', 14, doc.lastAutoTable.finalY + 12);

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 16,
      head: [['Rank', 'Meal Name', 'Orders', 'Revenue (Rs.)']],
      body: data.popularMeals.map((m, i) => [
        `#${i + 1}`, m.name, m.totalOrders, m.totalRevenue.toLocaleString()
      ]),
      headStyles: { fillColor: [22, 163, 74], textColor: 255 },
      alternateRowStyles: { fillColor: [240, 253, 244] },
      styles: { fontSize: 9 },
    });

    // Daily breakdown
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Daily Breakdown', 14, doc.lastAutoTable.finalY + 12);

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 16,
      head: [['Date', 'Orders', 'Revenue (Rs.)']],
      body: data.daily.map(d => [d.date, d.orders, d.revenue.toLocaleString()]),
      headStyles: { fillColor: [22, 163, 74], textColor: 255 },
      alternateRowStyles: { fillColor: [240, 253, 244] },
      styles: { fontSize: 9 },
    });

    doc.save(`revenue-report-${MONTHS[month - 1]}-${year}.pdf`);
    showToast('PDF exported!');
  };

  // ── CSV Export ──────────────────────────────────────────────────────────────
  const exportCSV = () => {
    if (!data) return;
    const rows = [
      ['Date', 'Orders', 'Revenue (Rs.)'],
      ...data.daily.map(d => [d.date, d.orders, d.revenue]),
      [],
      ['Popular Meals'],
      ['Rank', 'Meal', 'Orders', 'Revenue'],
      ...data.popularMeals.map((m, i) => [`#${i + 1}`, m.name, m.totalOrders, m.totalRevenue]),
      [],
      ['Summary'],
      ['Total Revenue', data.summary.totalRevenue],
      ['Total Orders',  data.summary.totalOrders],
      ['Avg Order Value', data.summary.avgOrderValue],
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `revenue-${MONTHS[month - 1]}-${year}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('CSV exported!');
  };

  const MONTHS = ['January','February','March','April','May','June',
                  'July','August','September','October','November','December'];
  const YEARS  = [2024, 2025, 2026];

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-gray-50 dark:bg-gray-900">
      <Toast toast={toast} />

      {/* Header */}
      <div className="flex-shrink-0 px-6 py-4 bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700/60 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-900 dark:text-white">Revenue</h1>
          <p className="text-xs text-gray-400">From completed orders only</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Month selector */}
          <div className="relative">
            <select value={month} onChange={e => setMonth(Number(e.target.value))}
              className="appearance-none pl-3 pr-8 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-green-400 cursor-pointer">
              {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
          </div>
          {/* Year selector */}
          <div className="relative">
            <select value={year} onChange={e => setYear(Number(e.target.value))}
              className="appearance-none pl-3 pr-8 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-green-400 cursor-pointer">
              {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
          </div>
          <button onClick={exportCSV}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            <Download className="w-4 h-4" /> CSV
          </button>
          <button onClick={exportPDF}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl bg-green-500 hover:bg-green-600 text-white transition-colors">
            <FileText className="w-4 h-4" /> PDF Report
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5" style={{ scrollbarWidth: 'none' }}>

        {loading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="w-7 h-7 animate-spin text-green-500" />
          </div>
        ) : !data ? (
          <div className="flex flex-col items-center justify-center h-48 text-gray-400">
            <p className="text-4xl mb-3">📊</p>
            <p className="font-semibold">No revenue data found</p>
          </div>
        ) : (
          <>
            {/* ── 3 Summary Cards ── */}
            <div className="grid grid-cols-3 gap-4">
              {[
                {
                  label: 'Total Revenue',
                  value: `Rs. ${data.summary.totalRevenue.toLocaleString()}`,
                  sub:   `${MONTHS[month - 1]} ${year}`,
                  icon:  DollarSign,
                  color: 'bg-green-500',
                  bg:    'bg-green-50 dark:bg-green-900/10',
                },
                {
                  label: 'Total Orders',
                  value: data.summary.totalOrders,
                  sub:   'Completed orders',
                  icon:  ShoppingBag,
                  color: 'bg-blue-500',
                  bg:    'bg-blue-50 dark:bg-blue-900/10',
                },
                {
                  label: 'Avg Order Value',
                  value: `Rs. ${data.summary.avgOrderValue.toLocaleString()}`,
                  sub:   'Per completed order',
                  icon:  TrendingUp,
                  color: 'bg-purple-500',
                  bg:    'bg-purple-50 dark:bg-purple-900/10',
                },
              ].map(({ label, value, sub, icon: Icon, color, bg }) => (
                <div key={label} className={`${bg} rounded-2xl border border-gray-100 dark:border-gray-700/60 p-5 flex items-center gap-4`}>
                  <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center flex-shrink-0`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-2xl font-black text-gray-800 dark:text-white">{value}</p>
                    <p className="text-xs font-bold text-gray-500 dark:text-gray-400">{label}</p>
                    <p className="text-[10px] text-gray-400">{sub}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* ── Charts ── */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700/60 p-5">
              {/* Tab switcher */}
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-bold text-gray-800 dark:text-white">Revenue Overview</h2>
                <div className="flex bg-gray-100 dark:bg-gray-700 rounded-xl p-1 gap-1">
                  {['daily', 'monthly'].map(tab => (
                    <button key={tab} onClick={() => setChartTab(tab)}
                      className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
                        chartTab === tab
                          ? 'bg-white dark:bg-gray-600 text-green-600 dark:text-green-400 shadow-sm'
                          : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'
                      }`}>
                      {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Daily chart */}
              {chartTab === 'daily' && (
                <ResponsiveContainer width="100%" height={260}>
                  <AreaChart data={data.daily} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                    <defs>
                      <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#16a34a" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#16a34a" stopOpacity={0}   />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} />
                    <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="revenue" name="Revenue"
                      stroke="#16a34a" strokeWidth={2.5} fill="url(#revGrad)" />
                    <Area type="monotone" dataKey="orders" name="Orders"
                      stroke="#3b82f6" strokeWidth={2} fill="none" strokeDasharray="4 2" />
                  </AreaChart>
                </ResponsiveContainer>
              )}

              {/* Monthly chart */}
              {chartTab === 'monthly' && (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={data.monthly} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="month" tick={{ fontSize: 10 }} tickLine={false} />
                    <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar dataKey="revenue" name="Revenue" fill="#16a34a" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="orders"  name="Orders"  fill="#3b82f6" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* ── Popular Meals ── */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700/60 p-5">
              <div className="flex items-center gap-2 mb-4">
                <Star className="w-4 h-4 text-yellow-500" />
                <h2 className="font-bold text-gray-800 dark:text-white">Popular Meals</h2>
                <span className="text-xs text-gray-400 ml-1">by completed orders</span>
              </div>

              {data.popularMeals.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">No meal data yet</p>
              ) : (
                <div className="space-y-3">
                  {data.popularMeals.map((meal, i) => {
                    const maxOrders = data.popularMeals[0].totalOrders;
                    const pct = Math.round((meal.totalOrders / maxOrders) * 100);
                    const rankColors = ['text-yellow-500', 'text-gray-400', 'text-orange-400'];
                    return (
                      <div key={meal.name} className="flex items-center gap-3">
                        <span className={`text-sm font-black w-6 text-center ${rankColors[i] || 'text-gray-300'}`}>
                          #{i + 1}
                        </span>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-sm font-semibold text-gray-800 dark:text-white">{meal.name}</p>
                            <div className="text-right">
                              <span className="text-xs font-bold text-green-600 dark:text-green-400">
                                Rs. {meal.totalRevenue.toLocaleString()}
                              </span>
                              <span className="text-[10px] text-gray-400 ml-2">{meal.totalOrders} orders</span>
                            </div>
                          </div>
                          <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-1.5">
                            <div className="bg-green-500 h-1.5 rounded-full transition-all duration-500"
                              style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}