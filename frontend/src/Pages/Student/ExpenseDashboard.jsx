import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  BarChart2, ChevronLeft, ChevronRight,
  Wallet, ShoppingBag, TrendingUp, ArrowLeft, Download
} from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { trackingAPI } from "../../api/studentApi";
import { useAuth } from "../../context/AuthContext";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function StatSkeleton() {
  return (
    <div className="card text-center">
      <div className="skeleton w-10 h-10 rounded-xl mx-auto mb-3" />
      <div className="skeleton h-6 w-24 mx-auto mb-2" />
      <div className="skeleton h-3 w-20 mx-auto" />
    </div>
  );
}

export default function ExpenseDashboard() {
  const { user } = useAuth();
  const studentId = user?._id || user?.id;

  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [year, setYear]         = useState(new Date().getFullYear());
  const navigate = useNavigate();

  useEffect(() => { if (studentId) fetchExpenses(); }, [year, studentId]);

  const fetchExpenses = async () => {
    setLoading(true);
    const res = await trackingAPI.getExpenses(studentId, year);
    if (res.success) setExpenses(res.data);
    setLoading(false);
  };

  const totalYear   = expenses.reduce((s, m) => s + m.totalSpent, 0);
  const totalOrders = expenses.reduce((s, m) => s + m.orderCount, 0);
  const maxSpent    = Math.max(...expenses.map((m) => m.totalSpent), 1);
  const avgMonthly  = totalYear / 12;

  const generatePDF = () => {
    const doc = new jsPDF();
    doc.setFillColor(22, 163, 74);
    doc.rect(0, 0, 210, 40, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22); doc.setFont("helvetica", "bold");
    doc.text("SmartMess", 14, 16);
    doc.setFontSize(11); doc.setFont("helvetica", "normal");
    doc.text("Monthly Expense Report", 14, 25);
    doc.text(`Year: ${year}`, 14, 33);
    doc.setFontSize(9);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 196, 33, { align: "right" });
    doc.setTextColor(40, 40, 40); doc.setFontSize(10); doc.setFont("helvetica", "bold");
    doc.text("SUMMARY", 14, 52);
    doc.setDrawColor(229, 231, 235); doc.setFillColor(248, 255, 250);
    doc.roundedRect(14, 56, 182, 28, 3, 3, "FD");
    doc.setFontSize(9); doc.setFont("helvetica", "normal"); doc.setTextColor(100, 100, 100);
    doc.text("Total Spent", 30, 66); doc.text("Total Orders", 95, 66); doc.text("Monthly Average", 155, 66);
    doc.setFontSize(12); doc.setFont("helvetica", "bold");
    doc.setTextColor(22, 163, 74); doc.text(`RS ${totalYear.toFixed(2)}`, 30, 76);
    doc.setTextColor(37, 99, 235); doc.text(`${totalOrders}`, 95, 76);
    doc.setTextColor(147, 51, 234); doc.text(`RS ${avgMonthly.toFixed(2)}`, 155, 76);
    doc.setTextColor(40, 40, 40); doc.setFontSize(10); doc.setFont("helvetica", "bold");
    doc.text("MONTHLY BREAKDOWN", 14, 96);
    autoTable(doc, {
      startY: 100,
      head: [["Month", "Orders", "Amount Spent (RS)", "Avg per Order (RS)"]],
      body: expenses.map((m, i) => [
        MONTHS[i], m.orderCount || 0,
        m.totalSpent > 0 ? `RS ${m.totalSpent.toFixed(2)}` : "—",
        m.orderCount > 0 ? `RS ${(m.totalSpent / m.orderCount).toFixed(2)}` : "—",
      ]),
      headStyles: { fillColor: [22, 163, 74], textColor: 255, fontStyle: "bold", fontSize: 9 },
      bodyStyles: { fontSize: 9, textColor: [50, 50, 50] },
      alternateRowStyles: { fillColor: [248, 255, 250] },
      columnStyles: { 0: { fontStyle: "bold" }, 2: { textColor: [22, 163, 74], fontStyle: "bold" } },
      styles: { cellPadding: 4, lineColor: [229, 231, 235], lineWidth: 0.3 },
      foot: [["TOTAL", totalOrders, `RS ${totalYear.toFixed(2)}`, `RS ${avgMonthly.toFixed(2)}`]],
      footStyles: { fillColor: [240, 253, 244], textColor: [22, 163, 74], fontStyle: "bold", fontSize: 9 },
    });
    const pageHeight = doc.internal.pageSize.height;
    doc.setFontSize(8); doc.setTextColor(150, 150, 150);
    doc.text("SmartMess — Student Expense Report", 14, pageHeight - 10);
    doc.text("Page 1 of 1", 196, pageHeight - 10, { align: "right" });
    doc.save(`SmartMess_Expenses_${year}.pdf`);
  };

  const STATS = [
    { label: "Total Spent",     value: `RS ${totalYear.toFixed(2)}`,  Icon: Wallet,      color: "text-green-600 dark:text-green-400",   bg: "bg-green-50 dark:bg-green-900/20" },
    { label: "Total Orders",    value: totalOrders,                    Icon: ShoppingBag, color: "text-blue-600 dark:text-blue-400",     bg: "bg-blue-50 dark:bg-blue-900/20" },
    { label: "Monthly Average", value: `RS ${avgMonthly.toFixed(2)}`, Icon: TrendingUp,  color: "text-purple-600 dark:text-purple-400", bg: "bg-purple-50 dark:bg-purple-900/20" },
  ];

  return (
    <div className="min-h-screen px-6 py-8">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="page-header animate-fade-down flex items-start justify-between">
          <div>
            <h1 className="section-title">Expense <span className="text-gradient">Summary</span></h1>
            <p className="section-subtitle">Your monthly canteen spending overview</p>
          </div>
          <div className="flex items-center gap-2">
            {/* Export PDF button */}
            <button
              onClick={generatePDF}
              disabled={loading || totalYear === 0}
              className="btn-primary flex items-center gap-2 text-sm disabled:opacity-40 mr-2"
            >
              <Download size={15} /> Export PDF
            </button>
            {/* Previous year button */}
            <button
              onClick={() => setYear((y) => y - 1)}
              className="w-9 h-9 rounded-xl border border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-500 hover:border-green-400 hover:text-green-600 transition-all"
              aria-label="Previous year"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="font-bold text-gray-900 dark:text-white text-base px-2 min-w-[50px] text-center">
              {year}
            </span>
            {/* Next year button */}
            <button
              onClick={() => setYear((y) => y + 1)}
              disabled={year >= new Date().getFullYear()}
              className="w-9 h-9 rounded-xl border border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-500 hover:border-green-400 hover:text-green-600 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              aria-label="Next year"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Stats cards — Total Spent, Total Orders, Monthly Average */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          {loading
            ? [1, 2, 3].map((i) => <StatSkeleton key={i} />)
            : STATS.map(({ label, value, Icon, color, bg }, i) => (
              <div key={i} className={`card animate-fade-up animation-delay-${(i + 1) * 100} flex items-center gap-4`}>
                <div className={`w-12 h-12 rounded-2xl ${bg} flex items-center justify-center flex-shrink-0`}>
                  <Icon size={22} className={color} />
                </div>
                <div>
                  <p className={`text-xl font-bold ${color}`}>{value}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{label}</p>
                </div>
              </div>
            ))
          }
        </div>

        {/* Monthly Breakdown chart */}
        <div className="card animate-fade-up animation-delay-300 mb-6">
          <div className="flex items-center gap-2 mb-6">
            <BarChart2 size={16} className="text-green-600" />
            <h2 className="font-bold text-gray-900 dark:text-white">Monthly Breakdown</h2>
            <span className="ml-auto text-xs text-gray-400">{year}</span>
          </div>
          {loading ? (
            <div className="flex items-end gap-2 h-44">
              {[...Array(12)].map((_, i) => (
                <div key={i} className="flex-1 flex flex-col gap-1 items-center">
                  <div className="skeleton w-full rounded-t-lg" style={{ height: `${20 + Math.random() * 60}%` }} />
                  <div className="skeleton h-2 w-6 rounded" />
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-end gap-1.5 h-44">
              {expenses.map((month, i) => {
                const pct = (month.totalSpent / maxSpent) * 100;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div className="relative group flex flex-col items-center w-full">
                      {month.totalSpent > 0 && (
                        <span className="absolute -top-7 left-1/2 -translate-x-1/2 text-[10px] font-bold text-green-600 dark:text-green-400 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap bg-white dark:bg-gray-800 px-1.5 py-0.5 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 z-10">
                          RS{month.totalSpent.toFixed(0)}
                        </span>
                      )}
                      <div
                        className="w-full rounded-t-lg transition-all duration-700 cursor-pointer hover:opacity-80"
                        style={{
                          height: `${Math.max(pct * 1.6, 4)}px`,
                          minHeight: "4px",
                          maxHeight: "160px",
                          background: month.totalSpent > 0 ? "linear-gradient(to top, #16a34a, #4ade80)" : "#f3f4f6",
                        }}
                      />
                    </div>
                    <span className="text-[10px] text-gray-400 mt-0.5">{MONTHS[i]}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Month-by-Month Details table */}
        <div className="card animate-fade-up animation-delay-400 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <BarChart2 size={16} className="text-green-600" />
            <h2 className="font-bold text-gray-900 dark:text-white">Month-by-Month Details</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-700">
                  {["Month", "Orders", "Spent", "Avg / Order"].map((h) => (
                    <th
                      key={h}
                      className={`py-2.5 text-xs font-semibold text-gray-400 uppercase tracking-wider ${h === "Month" ? "text-left" : "text-right"}`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {expenses.map((month, i) => (
                  <tr key={i} className="border-b border-gray-50 dark:border-gray-800 hover:bg-gray-50/50 dark:hover:bg-gray-700/20 transition-colors">
                    <td className="py-3 font-medium text-gray-800 dark:text-white text-sm">{MONTHS[i]}</td>
                    <td className="py-3 text-right text-gray-500 dark:text-gray-400 text-sm">{month.orderCount || "—"}</td>
                    <td className="py-3 text-right font-bold text-sm">
                      {month.totalSpent > 0
                        ? <span className="text-green-600 dark:text-green-400">RS {month.totalSpent.toFixed(2)}</span>
                        : <span className="text-gray-300 dark:text-gray-600">—</span>}
                    </td>
                    <td className="py-3 text-right text-gray-500 dark:text-gray-400 text-sm">
                      {month.orderCount > 0 ? `RS ${(month.totalSpent / month.orderCount).toFixed(2)}` : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Back to Orders button */}
        <button
          onClick={() => navigate("/student/orders")}
          className="btn-secondary w-full flex items-center justify-center gap-2 animate-fade-up animation-delay-500"
        >
          <ArrowLeft size={14} /> Back to Orders
        </button>

      </div>
    </div>
  );
}
