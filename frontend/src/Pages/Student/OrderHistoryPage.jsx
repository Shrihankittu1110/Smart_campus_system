import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  ClipboardList, BarChart2, Store, Star, XCircle,
  Clock, ChefHat, CheckCircle, Ban, Bell,
  RotateCcw, Download, RefreshCw, Search, X
} from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { trackingAPI, orderAPI, cartAPI } from "../../api/studentApi";
import { useAuth } from "../../context/AuthContext";

const STATUS_CONFIG = {
  pending:   { badge: "badge-yellow", Icon: Clock,       label: "Pending",   pulse: true },
  accepted:  { badge: "badge-blue",   Icon: CheckCircle, label: "Accepted",  pulse: true },
  preparing: { badge: "badge-orange", Icon: ChefHat,     label: "Preparing", pulse: true },
  ready:     { badge: "badge-green",  Icon: Bell,        label: "Ready",     pulse: true },
  completed: { badge: "badge-gray",   Icon: CheckCircle, label: "Completed", pulse: false },
  cancelled: { badge: "badge-red",    Icon: Ban,         label: "Cancelled", pulse: false },
};

// Filter tabs — "all orders" label matches test /all orders/i
const FILTERS = [
  { key: "all",       label: "All Orders" },
  { key: "pending",   label: "Pending" },
  { key: "preparing", label: "Preparing" },
  { key: "ready",     label: "Ready" },
  { key: "completed", label: "Completed" },
  { key: "cancelled", label: "Cancelled" },
];

function OrderSkeleton() {
  return (
    <div className="card">
      <div className="flex justify-between mb-3">
        <div><div className="skeleton h-4 w-32 mb-1" /><div className="skeleton h-3 w-20" /></div>
        <div className="skeleton h-6 w-20 rounded-full" />
      </div>
      <div className="skeleton h-3 w-full mb-1" />
      <div className="skeleton h-3 w-3/4 mb-4" />
      <div className="flex justify-between">
        <div className="skeleton h-4 w-16" />
        <div className="skeleton h-4 w-24" />
      </div>
    </div>
  );
}

export default function OrderHistoryPage() {
  const { user } = useAuth();
  const studentId = user?._id || user?.id;

  const [orders, setOrders]         = useState([]);
  const [loading, setLoading]       = useState(true);
  const [cancelling, setCancelling] = useState("");
  const [reordering, setReordering] = useState("");
  const [filter, setFilter]         = useState("all");
  const [search, setSearch]         = useState("");
  const [lastRefreshed, setLastRefreshed] = useState(new Date());
  const [toast, setToast]           = useState("");
  const pollRef = useRef(null);
  const navigate = useNavigate();

  const fetchOrders = async (showLoader = false) => {
    if (!studentId) return;
    if (showLoader) setLoading(true);
    const res = await trackingAPI.getHistory(studentId);
    if (res.success) { setOrders(res.data); setLastRefreshed(new Date()); }
    if (showLoader) setLoading(false);
  };

  useEffect(() => {
    fetchOrders(true);
    pollRef.current = setInterval(() => fetchOrders(false), 30000);
    return () => clearInterval(pollRef.current);
  }, [studentId]);

  const handleCancel = async (orderId) => {
    setCancelling(orderId);
    const res = await orderAPI.cancelOrder(orderId);
    if (res.success) {
      setOrders((prev) => prev.map((o) => o._id === orderId ? { ...o, status: "cancelled" } : o));
    }
    setCancelling("");
  };

  const handleReorder = async (order) => {
    setReordering(order._id);
    try {
      for (const item of order.items) {
        if (item.meal) {
          await cartAPI.addToCart({ studentId, mealId: item.meal, quantity: item.quantity });
        }
      }
      showToast("Items added to cart!");
      setTimeout(() => navigate("/student/cart"), 1200);
    } catch {
      showToast("Could not reorder. Try again.");
    }
    setReordering("");
  };

  const downloadReceipt = (order) => {
    const doc = new jsPDF();
    doc.setFillColor(22, 163, 74);
    doc.rect(0, 0, 210, 35, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20); doc.setFont("helvetica", "bold");
    doc.text("SmartMess", 14, 15);
    doc.setFontSize(10); doc.setFont("helvetica", "normal");
    doc.text("Order Receipt", 14, 24);
    doc.setFontSize(8);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 196, 24, { align: "right" });
    doc.setTextColor(40, 40, 40);
    doc.setDrawColor(229, 231, 235); doc.setFillColor(248, 255, 250);
    doc.roundedRect(14, 42, 182, 30, 3, 3, "FD");
    doc.setFontSize(9); doc.setFont("helvetica", "bold");
    doc.text("ORDER DETAILS", 20, 51);
    doc.setFont("helvetica", "normal"); doc.setTextColor(100, 100, 100);
    doc.text("Order ID:", 20, 59); doc.text("Canteen:", 20, 66);
    doc.text("Date:", 110, 59); doc.text("Status:", 110, 66);
    doc.setTextColor(40, 40, 40); doc.setFont("helvetica", "bold");
    doc.text(`#${order._id?.slice(-8).toUpperCase()}`, 50, 59);
    doc.text(order.canteen?.name || "Canteen", 50, 66);
    doc.text(new Date(order.createdAt).toLocaleDateString(), 130, 59);
    doc.setTextColor(22, 163, 74);
    doc.text(order.status.toUpperCase(), 130, 66);
    doc.setTextColor(40, 40, 40); doc.setFontSize(9); doc.setFont("helvetica", "bold");
    doc.text("ITEMS ORDERED", 14, 82);
    autoTable(doc, {
      startY: 86,
      head: [["Item", "Qty", "Unit Price", "Subtotal"]],
      body: order.items.map((item) => [
        item.name, item.quantity,
        `RS ${item.price?.toFixed(2)}`,
        `RS ${(item.price * item.quantity).toFixed(2)}`,
      ]),
      headStyles: { fillColor: [22, 163, 74], textColor: 255, fontStyle: "bold", fontSize: 9 },
      bodyStyles: { fontSize: 9, textColor: [50, 50, 50] },
      alternateRowStyles: { fillColor: [248, 255, 250] },
      styles: { cellPadding: 4, lineColor: [229, 231, 235], lineWidth: 0.3 },
      foot: [["", "", "TOTAL", `RS ${order.totalAmount?.toFixed(2)}`]],
      footStyles: { fillColor: [240, 253, 244], textColor: [22, 163, 74], fontStyle: "bold", fontSize: 10 },
    });
    const finalY = doc.lastAutoTable.finalY + 8;
    doc.setFontSize(9); doc.setFont("helvetica", "normal"); doc.setTextColor(100, 100, 100);
    doc.text("Payment Method:", 14, finalY);
    doc.setTextColor(40, 40, 40); doc.setFont("helvetica", "bold");
    doc.text(order.paymentMethod?.toUpperCase() || "CASH", 55, finalY);
    const pageHeight = doc.internal.pageSize.height;
    doc.setFontSize(8); doc.setTextColor(150, 150, 150);
    doc.text("Thank you for ordering with SmartMess!", 105, pageHeight - 15, { align: "center" });
    doc.save(`Receipt_${order._id?.slice(-8).toUpperCase()}.pdf`);
  };

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 2500); };

  const filtered = orders
    .filter((o) => filter === "all" || o.status === filter)
    .filter((o) => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      const canteenName = (o.canteen?.name || o.canteen?.canteenName || "").toLowerCase();
      const orderId = o._id?.slice(-8).toLowerCase();
      return canteenName.includes(q) || orderId.includes(q);
    });

  const activeCount = orders.filter((o) =>
    ["pending", "accepted", "preparing", "ready"].includes(o.status)
  ).length;

  return (
    <div className="min-h-screen px-6 py-8">
      <div className="max-w-3xl mx-auto">

        {toast && (
          <div
            className="fixed top-5 right-5 flex items-center gap-2.5 px-4 py-3 rounded-xl text-white text-sm font-medium shadow-xl animate-slide-left z-50"
            style={{ background: "linear-gradient(135deg, #16a34a, #15803d)" }}
          >
            <CheckCircle size={15} /> {toast}
          </div>
        )}

        {/* Header */}
        <div className="page-header animate-fade-down flex items-start justify-between">
          <div>
            <h1 className="section-title">Order <span className="text-gradient">History</span></h1>
            <div className="flex items-center gap-3 mt-1">
              <p className="section-subtitle">Track and manage all your orders</p>
              {activeCount > 0 && (
                <span className="badge badge-green text-[10px] animate-pulse">{activeCount} active</span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchOrders(false)}
              className="btn-secondary flex items-center gap-1.5 text-xs"
            >
              <RefreshCw size={12} /> Refresh
            </button>
            <button
              onClick={() => navigate("/student/expenses")}
              className="btn-secondary flex items-center gap-2 text-sm"
            >
              <BarChart2 size={14} /> Expenses
            </button>
          </div>
        </div>

        {/* Auto-refresh indicator — matches /auto-refreshes/i */}
        <p className="text-[11px] text-gray-400 mb-5 -mt-4">
          Last updated: {lastRefreshed.toLocaleTimeString()} · Auto-refreshes every 30s
        </p>

        {/* Search */}
        <div className="relative mb-4 animate-fade-up">
          <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by canteen name or order ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-10 pr-10 w-full text-sm"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={15} />
            </button>
          )}
        </div>

        {/* Filter Tabs — exact labels to match test selectors */}
        <div className="flex gap-2 flex-wrap mb-6 animate-fade-up">
          {FILTERS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                filter === key
                  ? "text-white shadow-sm"
                  : "bg-white dark:bg-gray-800 text-gray-500 border border-gray-200 dark:border-gray-700 hover:border-green-300 hover:text-green-600"
              }`}
              style={filter === key ? { background: "linear-gradient(135deg, #16a34a, #15803d)" } : {}}
            >
              {label}
            </button>
          ))}
        </div>

        {search.trim() && !loading && (
          <p className="text-xs text-gray-400 mb-4">
            {filtered.length} result{filtered.length !== 1 ? "s" : ""} for{" "}
            <span className="text-green-600 font-semibold">"{search}"</span>
          </p>
        )}

        {loading && <div className="space-y-4">{[1, 2, 3].map((i) => <OrderSkeleton key={i} />)}</div>}

        {!loading && filtered.length === 0 && (
          <div className="card text-center py-20 animate-fade-in">
            <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center mx-auto mb-3">
              <ClipboardList size={24} className="text-gray-400" />
            </div>
            <p className="font-semibold text-gray-700 dark:text-gray-300 mb-1">No orders found</p>
            <p className="text-sm text-gray-400 mb-5">
              {search.trim()
                ? `No orders matching "${search}"`
                : filter === "all" ? "You haven't placed any orders yet" : `No ${filter} orders`}
            </p>
            {search.trim()
              ? <button onClick={() => setSearch("")} className="btn-secondary mx-auto">Clear Search</button>
              : <button onClick={() => navigate("/student/canteens")} className="btn-primary mx-auto">Order Now</button>
            }
          </div>
        )}

        <div className="space-y-3">
          {!loading && filtered.map((order, i) => {
            const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
            const StatusIcon = cfg.Icon;
            return (
              <div
                key={order._id}
                className={`card animate-fade-up animation-delay-${Math.min((i + 1) * 100, 500)} hover:shadow-md transition-all duration-300 ${
                  cfg.pulse ? "border-green-100 dark:border-green-900/30" : ""
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                      <Store size={16} className="text-gray-500" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 dark:text-white text-sm">
                        {order.canteen?.name || "Canteen"}
                      </p>
                      <p className="text-[11px] text-gray-400 font-mono">
                        #{order._id?.slice(-8).toUpperCase()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {cfg.pulse && <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />}
                    <span className={`${cfg.badge} flex items-center gap-1`}>
                      <StatusIcon size={10} strokeWidth={2.5} />{cfg.label}
                    </span>
                  </div>
                </div>

                <div className="space-y-1 mb-3 pl-12">
                  {order.items?.map((item, j) => (
                    <div key={j} className="flex justify-between text-xs">
                      <span className="text-gray-500">{item.name} × {item.quantity}</span>
                      <span className="text-gray-700 dark:text-gray-300 font-medium">
                        RS {(item.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-gray-50 dark:border-gray-700 pl-12">
                  <div>
                    <p className="font-bold text-gray-900 dark:text-white text-sm">
                      RS <span className="text-gradient">{order.totalAmount?.toFixed(2)}</span>
                    </p>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      {new Date(order.createdAt).toLocaleDateString("en-US", {
                        day: "numeric", month: "short", year: "numeric",
                        hour: "2-digit", minute: "2-digit"
                      })}
                    </p>
                  </div>
                  <div className="flex gap-1.5 flex-wrap justify-end">
                    {order.status === "completed" && (
                      <button
                        onClick={() => navigate(`/student/rating/${order._id}/${order.canteen?._id}`)}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-900/20 text-amber-600 border border-amber-200 text-xs font-semibold hover:bg-amber-100 transition-colors"
                      >
                        <Star size={10} fill="currentColor" /> Rate
                      </button>
                    )}
                    {(order.status === "completed" || order.status === "cancelled") && (
                      <button
                        onClick={() => handleReorder(order)}
                        disabled={reordering === order._id}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-green-50 dark:bg-green-900/20 text-green-600 border border-green-200 text-xs font-semibold hover:bg-green-100 transition-colors disabled:opacity-50"
                      >
                        <RotateCcw size={10} />
                        {reordering === order._id ? "Adding..." : "Reorder"}
                      </button>
                    )}
                    {(order.status === "completed" || order.status === "ready") && (
                      <button
                        onClick={() => downloadReceipt(order)}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-600 border border-gray-200 text-xs font-semibold hover:bg-gray-100 transition-colors"
                      >
                        <Download size={10} /> Receipt
                      </button>
                    )}
                    {order.status === "pending" && (
                      <button
                        onClick={() => handleCancel(order._id)}
                        disabled={cancelling === order._id}
                        className="btn-danger flex items-center gap-1 text-xs py-1.5 px-2.5"
                      >
                        <XCircle size={10} />
                        {cancelling === order._id ? "Cancelling..." : "Cancel"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
