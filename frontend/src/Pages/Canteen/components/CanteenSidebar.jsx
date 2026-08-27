//frontend/src/pages/Canteen/components/CanteenSidebar.jsx
import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from '../../../context/AuthContext';
import { useTheme } from "../../../context/ThemeContext";
import { buildImgUrl } from '../../../utils/imageUrl';
import logo from "../../../assets/logo.png";
import {
  LayoutDashboard, Store, Clock, UtensilsCrossed,
  ShoppingBag, DollarSign, Star, Home, LogOut,
  ChevronLeft, ChevronRight, Sun, Moon, ChevronDown,AlertCircle,
  TicketCheck,
} from "lucide-react";

const NAV = [
  {
    key: "dashboard",
    label: "Dashboard",
    href: "/canteen/dashboard",
    icon: LayoutDashboard,
  },
  {
    key: "my-canteen",
    label: "My Canteen",
    icon: Store,
    children: [
      { key: "profile", label: "Profile",        href: "/canteen/profile" },
      { key: "hours",   label: "Operating Hours", href: "/canteen/hours"   },
    ],
  },
  { key: "meals",    label: "Meals",              href: "/canteen/meals",    icon: UtensilsCrossed },
  { key: "orders",   label: "Orders",             href: "/canteen/orders",   icon: ShoppingBag     },
  { key: "queue",    label: "Queue",              href: "/canteen/queue",    icon: TicketCheck     },
  { key: "revenue",  label: "Revenue",            href: "/canteen/revenue",  icon: DollarSign      },
  { key: "feedback", label: "Reviews & Feedback", href: "/canteen/feedback", icon: Star            },
{ key: "report",   label: "Report an Issue",    href: "/canteen/report",   icon: AlertCircle     },
{ key: "home",     label: "Home",               href: "/",                 icon: Home            },
]
export default function CanteenSidebar() {
  const { theme, toggleTheme } = useTheme();
  const dark = theme === "dark";
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [openGroups, setOpenGroups] = useState({ "my-canteen": true });

  const { user, logout } = useAuth();
const canteen = { name: user?.canteenName || user?.name || 'My Canteen', image: user?.profileImage || null };

  const getActive = () => {
    const p = location.pathname;
    if (p === "/canteen/dashboard")  return "dashboard";
    if (p === "/canteen/profile")    return "profile";
    if (p === "/canteen/hours")      return "hours";
    if (p === "/canteen/meals")      return "meals";
    if (p === "/canteen/orders")     return "orders";
    if (p === "/canteen/queue")      return "queue";
    if (p === "/canteen/revenue")    return "revenue";
    if (p === "/canteen/feedback")   return "feedback";
    if (p === "/canteen/report") return "report";
    return "dashboard";
  };

  const [active, setActive] = useState(getActive());

  useEffect(() => {
    setActive(getActive());
    if (location.pathname.startsWith("/canteen/profile") || location.pathname.startsWith("/canteen/hours")) {
      setOpenGroups(g => ({ ...g, "my-canteen": true }));
    }
  }, [location.pathname]);

  const toggleGroup = (key) => setOpenGroups(g => ({ ...g, [key]: !g[key] }));
  const isGroupActive = (item) => item.children?.some(c => c.key === active);

  return (
    <aside className={`${collapsed ? "w-20" : "w-64"} h-screen flex flex-col flex-shrink-0 transition-all duration-300 ease-in-out ${
      dark ? "bg-gray-950 border-r border-gray-800/60" : "bg-white border-r border-gray-100"
    }`}>

      {/* Logo */}
      <div className={`flex items-center gap-3 px-4 py-5 border-b ${dark ? "border-gray-800/60" : "border-gray-100"}`}>
        <img src={logo} alt="SmartMess" className="w-8 h-8 object-contain flex-shrink-0" />
        {!collapsed && (
          <div>
            <p className="font-bold text-base text-green-600 leading-tight">SmartMess</p>
            <p className={`text-[10px] uppercase tracking-widest font-medium ${dark ? "text-gray-600" : "text-gray-400"}`}>
              Canteen Portal
            </p>
          </div>
        )}
      </div>

      {/* Canteen profile avatar */}
      <Link
        to="/canteen/profile"
        title="Canteen Profile"
        className={`flex items-center gap-3 px-4 py-4 border-b transition-colors ${
          dark ? "border-gray-800/60 hover:bg-gray-800/40" : "border-gray-100 hover:bg-green-50/60"
        } ${active === "profile" ? (dark ? "bg-gray-800/40" : "bg-green-50") : ""}`}
      >
        <div className="relative flex-shrink-0">
          {canteen.image ? (
            <img src={buildImgUrl(canteen.image)} alt={canteen.name}
              className="w-10 h-10 rounded-xl object-cover ring-2 ring-green-400/30" />
          ) : (
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center shadow-sm">
              <Store className="w-5 h-5 text-white" />
            </div>
          )}
          <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-400 border-2 border-white dark:border-gray-950" />
        </div>
        {!collapsed && (
          <div className="min-w-0 flex-1">
            <p className={`text-sm font-bold truncate ${dark ? "text-white" : "text-gray-800"}`}>{canteen.name}</p>
            <p className="text-[10px] font-semibold text-green-500 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" /> Open
            </p>
          </div>
        )}
      </Link>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-0.5" style={{ scrollbarWidth: "none" }}>
        {!collapsed && (
          <p className={`text-[10px] font-bold uppercase tracking-widest px-3 pb-2 ${dark ? "text-gray-600" : "text-gray-400"}`}>
            Menu
          </p>
        )}

        {NAV.map((item) => {
          const Icon = item.icon;

          // Group with children
          if (item.children) {
            const isOpen   = openGroups[item.key];
            const isActive = isGroupActive(item);
            return (
              <div key={item.key}>
                <button
                  onClick={() => collapsed ? setCollapsed(false) : toggleGroup(item.key)}
                  title={collapsed ? item.label : undefined}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                    isActive
                      ? dark ? "bg-green-500/10 text-green-400" : "bg-green-50 text-green-600"
                      : dark ? "text-gray-400 hover:bg-gray-800/50 hover:text-gray-200"
                             : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  <Icon className="w-5 h-5 flex-shrink-0 stroke-[1.8]" />
                  {!collapsed && (
                    <>
                      <span className="flex-1 text-left text-sm font-medium">{item.label}</span>
                      <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? "rotate-180" : ""} ${dark ? "text-gray-600" : "text-gray-400"}`} />
                    </>
                  )}
                </button>

                {!collapsed && (
                  <div className="overflow-hidden transition-all duration-300"
                    style={{ maxHeight: isOpen ? "200px" : "0", opacity: isOpen ? 1 : 0 }}>
                    <div className="pl-8 pr-2 py-1 space-y-0.5">
                      {item.children.map((child) => {
                        const isChildActive = active === child.key;
                        return (
                          <Link key={child.key} to={child.href}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                              isChildActive
                                ? dark ? "bg-green-500/10 text-green-400" : "bg-green-50 text-green-600"
                                : dark ? "text-gray-400 hover:bg-gray-800/50 hover:text-gray-200"
                                       : "text-gray-500 hover:bg-gray-50 hover:text-gray-800"
                            }`}>
                            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isChildActive ? "bg-green-500" : "bg-current opacity-30"}`} />
                            {child.label}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          }

          // Regular item
          const isActive = active === item.key;
          return (
            <Link key={item.key} to={item.href} title={collapsed ? item.label : undefined}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                isActive
                  ? dark ? "bg-green-500/10 text-green-400" : "bg-green-50 text-green-600"
                  : dark ? "text-gray-400 hover:bg-gray-800/50 hover:text-gray-200"
                         : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
              }`}>
              <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? "stroke-[2.5]" : "stroke-[1.8]"}`} />
              {!collapsed && <span className="flex-1 text-sm font-medium">{item.label}</span>}
              {isActive && !collapsed && <span className="w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0" />}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className={`border-t px-3 py-3 space-y-1 ${dark ? "border-gray-800/60" : "border-gray-100"}`}>
        <button onClick={toggleTheme} title={dark ? "Light Mode" : "Dark Mode"}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
            dark ? "text-gray-400 hover:bg-gray-800/50 hover:text-gray-200"
                 : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
          }`}>
          {dark ? <Sun className="w-5 h-5 flex-shrink-0" /> : <Moon className="w-5 h-5 flex-shrink-0" />}
          {!collapsed && <span className="text-sm font-medium">{dark ? "Light Mode" : "Dark Mode"}</span>}
        </button>

       <button onClick={() => { logout(); navigate("/"); }} title="Logout"
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
            dark ? "text-gray-400 hover:bg-red-500/10 hover:text-red-400"
                 : "text-gray-500 hover:bg-red-50 hover:text-red-600"
          }`}>
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span className="text-sm font-medium flex-1 text-left">Logout</span>}
        </button>

        <button onClick={() => setCollapsed(!collapsed)}
          className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl transition-all duration-200 ${
            dark ? "text-gray-600 hover:bg-gray-800/50 hover:text-gray-400"
                 : "text-gray-300 hover:bg-gray-50 hover:text-gray-500"
          }`}>
          {collapsed
            ? <ChevronRight className="w-4 h-4" />
            : <><ChevronLeft className="w-4 h-4" /><span className="text-xs font-medium">Collapse</span></>}
        </button>
      </div>
    </aside>
  );
}
