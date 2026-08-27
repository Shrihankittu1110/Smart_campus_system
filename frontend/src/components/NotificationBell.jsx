import { useState, useEffect, useRef } from "react";
import { Bell, X, Clock, ChefHat, CheckCircle, Bell as BellIcon, Package } from "lucide-react";
import { trackingAPI } from "../api/studentApi";

const TEMP_STUDENT_ID = "64f1a2b3c4d5e6f7a8b9c0d1";

const STATUS_CONFIG = {
  pending:   { color: "text-yellow-500", bg: "bg-yellow-50 dark:bg-yellow-900/20", Icon: Clock,        msg: "Order received — waiting for canteen" },
  accepted:  { color: "text-blue-500",   bg: "bg-blue-50 dark:bg-blue-900/20",     Icon: CheckCircle,  msg: "Your order has been accepted!" },
  preparing: { color: "text-orange-500", bg: "bg-orange-50 dark:bg-orange-900/20", Icon: ChefHat,      msg: "Your order is being prepared" },
  ready:     { color: "text-green-500",  bg: "bg-green-50 dark:bg-green-900/20",   Icon: BellIcon,     msg: "Your order is READY for pickup!" },
  completed: { color: "text-gray-500",   bg: "bg-gray-50 dark:bg-gray-700",        Icon: CheckCircle,  msg: "Order completed. Enjoy your meal!" },
  cancelled: { color: "text-red-500",    bg: "bg-red-50 dark:bg-red-900/20",       Icon: X,            msg: "Order was cancelled" },
};

export default function NotificationBell() {
  const [orders, setOrders] = useState([]);
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [prevStatuses, setPrevStatuses] = useState({});
  const [alerts, setAlerts] = useState([]);
  const dropdownRef = useRef(null);
  const pollRef = useRef(null);

  // Fetch orders and detect status changes
  const fetchOrders = async () => {
    const res = await trackingAPI.getHistory(TEMP_STUDENT_ID);
    if (!res.success) return;

    const active = res.data.filter((o) =>
      ["pending", "accepted", "preparing", "ready"].includes(o.status)
    );

    // Detect status changes → create alert
    active.forEach((order) => {
      const prev = prevStatuses[order._id];
      if (prev && prev !== order.status) {
        const cfg = STATUS_CONFIG[order.status];
        const newAlert = {
          id: `${order._id}-${order.status}`,
          orderId: order._id,
          canteen: order.canteen?.name || "Canteen",
          status: order.status,
          message: cfg?.msg || `Status: ${order.status}`,
          time: new Date(),
          read: false,
        };
        setAlerts((prev) => [newAlert, ...prev].slice(0, 20));
        setUnread((n) => n + 1);
      }
    });

    // Update prev statuses
    const newStatuses = {};
    active.forEach((o) => { newStatuses[o._id] = o.status; });
    setPrevStatuses(newStatuses);
    setOrders(active);
  };

  useEffect(() => {
    fetchOrders();
    // Poll every 30 seconds
    pollRef.current = setInterval(fetchOrders, 30000);
    return () => clearInterval(pollRef.current);
  }, []);

  // Close on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const markAllRead = () => {
    setAlerts((prev) => prev.map((a) => ({ ...a, read: true })));
    setUnread(0);
  };

  const removeAlert = (id) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  };

  const formatTime = (date) => {
    const diff = Math.floor((new Date() - new Date(date)) / 1000);
    if (diff < 60) return "just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return `${Math.floor(diff / 3600)}h ago`;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => { setOpen(!open); if (unread > 0) markAllRead(); }}
        className="relative w-9 h-9 rounded-xl flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-all duration-200"
      >
        <Bell size={18} strokeWidth={2} />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full text-[10px] font-bold text-white flex items-center justify-center animate-scale-up"
            style={{ background: "linear-gradient(135deg, #ef4444, #dc2626)" }}>
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-12 w-80 rounded-2xl shadow-2xl border z-50 overflow-hidden animate-fade-down"
          style={{
            background: "rgba(15, 23, 42, 0.97)",
            borderColor: "rgba(255,255,255,0.08)",
            backdropFilter: "blur(20px)",
          }}>

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b"
            style={{ borderColor: "rgba(255,255,255,0.06)" }}>
            <div className="flex items-center gap-2">
              <Bell size={15} className="text-green-400" />
              <p className="text-white font-semibold text-sm">Notifications</p>
              {alerts.length > 0 && (
                <span className="badge badge-green text-[10px]">{alerts.length}</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {alerts.length > 0 && (
                <button onClick={markAllRead} className="text-[11px] text-gray-400 hover:text-green-400 transition-colors">
                  Mark all read
                </button>
              )}
              <button onClick={() => setOpen(false)} className="text-gray-500 hover:text-white transition-colors">
                <X size={15} />
              </button>
            </div>
          </div>

          {/* Active Orders */}
          {orders.length > 0 && (
            <div className="px-4 py-3 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
              <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest mb-2">Live Orders</p>
              <div className="space-y-2">
                {orders.map((order) => {
                  const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
                  const Icon = cfg.Icon;
                  return (
                    <div key={order._id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/5">
                      <Icon size={14} className={cfg.color} />
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-xs font-medium truncate">{order.canteen?.name || "Canteen"}</p>
                        <p className="text-gray-400 text-[11px]">{cfg.msg}</p>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.color}`}>
                        {order.status}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Alerts history */}
          <div className="max-h-64 overflow-y-auto">
            {alerts.length === 0 && orders.length === 0 && (
              <div className="text-center py-10">
                <Package size={28} className="text-gray-600 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">No notifications yet</p>
                <p className="text-gray-600 text-xs mt-1">Order updates will appear here</p>
              </div>
            )}
            {alerts.map((alert) => {
              const cfg = STATUS_CONFIG[alert.status] || STATUS_CONFIG.pending;
              const Icon = cfg.Icon;
              return (
                <div key={alert.id}
                  className={`flex items-start gap-3 px-4 py-3 border-b transition-colors ${
                    !alert.read ? "bg-white/5" : ""
                  }`}
                  style={{ borderColor: "rgba(255,255,255,0.04)" }}>
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${cfg.bg}`}>
                    <Icon size={13} className={cfg.color} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-xs font-semibold">{alert.canteen}</p>
                    <p className="text-gray-400 text-[11px] mt-0.5">{alert.message}</p>
                    <p className="text-gray-600 text-[10px] mt-1">{formatTime(alert.time)}</p>
                  </div>
                  <button onClick={() => removeAlert(alert.id)} className="text-gray-600 hover:text-gray-400 flex-shrink-0 mt-0.5">
                    <X size={12} />
                  </button>
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div className="px-4 py-2.5 border-t" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
            <p className="text-[10px] text-gray-600 text-center">
              Auto-refreshes every 30 seconds
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
