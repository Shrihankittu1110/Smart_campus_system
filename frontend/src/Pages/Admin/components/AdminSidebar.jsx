import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from '../../../context/AuthContext';
import { useTheme } from '../../../context/ThemeContext';
import logo from "../../../assets/logo.png";
import { 
  FiGrid, 
  FiUsers, 
  FiBarChart2, 
  FiAlertCircle, 
  FiHome,
  FiChevronRight,
  FiChevronLeft,
  FiSun,
  FiMoon,
  FiLogOut,
  FiSettings
} from 'react-icons/fi';
import { MdOutlineRestaurantMenu } from 'react-icons/md';

const NAV = [
  {
    key: "dashboard",
    label: "Dashboard",
    href: "/admin/dashboard",
    icon: FiGrid,
  },
  {
    key: "users",
    label: "Users",
    href: "/admin/users",
    icon: FiUsers,
  },
  {
    key: "analytics",
    label: "Analytics",
    href: "/admin/analytics",
    icon: FiBarChart2,
  },
  {
    key: "complaints",
    label: "Complaints",
    href: "/admin/complaints",
    icon: FiAlertCircle,
  },
  {
    key: "canteens",
    label: "Canteens",
    href: null,
    icon: MdOutlineRestaurantMenu,
    children: [
      {
        key: "approvals",
        label: "Approvals",
        href: "/admin/canteens/approvals",
      },
      {
        key: "manage",
        label: "Manage Canteens",
        href: "/admin/canteens/manage",
      },
    ],
  },
  {
    key: "home",
    label: "Home",
    href: "/",
    icon: FiHome,
  },
];

// Placeholder component for admin pages
function AdminPlaceholder({ page }) {
  return (
    <div className="flex-1 flex items-center justify-center flex-col gap-4 bg-gray-50 dark:bg-gray-900">
      <div className="text-center max-w-md px-6">
        <div className="text-7xl mb-6 text-primary-500/30">⚙️</div>
        <h2 className="font-playfair text-3xl font-bold text-gray-900 dark:text-white mb-3">
          {page} Page
        </h2>
        <p className="text-gray-500 dark:text-gray-400 text-lg mb-2">
          This page is under construction.
        </p>
        <p className="text-sm text-gray-400 dark:text-gray-500">
          Being developed by Member 4
        </p>
      </div>
    </div>
  );
}

export default function AdminSidebar() {
  const { theme, toggleTheme } = useTheme();
  const dark = theme === 'dark';
  const location = useLocation();
  const navigate = useNavigate();
  
  const [collapsed, setCollapsed] = useState(false);
  const [canteensOpen, setCanteensOpen] = useState(true);
  
  // Get current active page from URL
  const getActiveFromPath = () => {
    const path = location.pathname;
    if (path === '/admin/dashboard') return 'dashboard';
    if (path === '/admin/users') return 'users';
    if (path === '/admin/analytics') return 'analytics';
    if (path === '/admin/complaints') return 'complaints';
    if (path === '/admin/canteens/approvals') return 'approvals';
    if (path === '/admin/canteens/manage') return 'manage';
    if (path.startsWith('/admin/canteens')) return 'canteens';
    return 'dashboard';
  };
  
  const [active, setActive] = useState(getActiveFromPath());

  // Update active when URL changes
  useEffect(() => {
    setActive(getActiveFromPath());
    // Auto-open canteens section if on a canteen subpage
    if (location.pathname.startsWith('/admin/canteens')) {
      setCanteensOpen(true);
    }
  }, [location.pathname]);

  const sidebarWidth = collapsed ? 'w-20' : 'w-64';
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/');
};

  return (
    <div className="flex h-screen font-sans">
      {/* Sidebar */}
      <aside className={`${sidebarWidth} h-screen flex flex-col relative transition-all duration-300 ease-in-out ${
        dark 
          ? 'bg-gray-950 border-r border-gray-800' 
          : 'bg-white border-r border-gray-100'
      }`}>
        {/* Logo Section */}
        <div className={`flex items-center gap-3 px-4 py-6 min-h-[72px] border-b ${
          dark ? 'border-gray-800' : 'border-gray-100'
        }`}>
          <img 
            src={logo} 
            alt="SmartMess Logo" 
            className="w-8 h-8 object-contain"
          />
          {!collapsed && (
            <div className="overflow-hidden transition-all duration-300">
              <div className="font-playfair text-lg font-black text-primary-600 dark:text-primary-400 leading-tight">
                SmartMess
              </div>
              <div className={`text-[10px] font-medium tracking-wider uppercase ${
                dark ? 'text-gray-600' : 'text-gray-400'
              }`}>
                Admin Console
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto scrollbar-hide py-4 px-3">
          {!collapsed && (
            <div className={`text-xs font-medium px-3 pb-2 ${
              dark ? 'text-gray-600' : 'text-gray-400'
            }`}>
              MENU
            </div>
          )}

          <div className="space-y-1">
            {NAV.map((item) => {
              const Icon = item.icon;
              
              if (item.key === "canteens") {
                const isActive = active === 'canteens' || active === 'approvals' || active === 'manage';
                
                return (
                  <div key="canteens">
                    <button
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                        isActive
                          ? dark
                            ? 'bg-primary-500/10 text-primary-400'
                            : 'bg-primary-500/10 text-primary-600'
                          : dark
                            ? 'text-gray-400 hover:bg-gray-800/50 hover:text-gray-200'
                            : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
                      }`}
                      onClick={() => {
                        if (collapsed) {
                          setCollapsed(false);
                          setCanteensOpen(true);
                        } else {
                          setCanteensOpen(!canteensOpen);
                        }
                      }}
                      title={item.label}
                    >
                      <Icon className="w-5 h-5 flex-shrink-0" />
                      {!collapsed && (
                        <>
                          <span className="flex-1 text-left text-sm font-medium">{item.label}</span>
                          <FiChevronRight
                            className={`w-4 h-4 transition-transform duration-300 ${
                              canteensOpen ? 'rotate-90' : ''
                            } ${dark ? 'text-gray-600' : 'text-gray-400'}`}
                          />
                        </>
                      )}
                    </button>

                    {/* Submenu */}
                    {!collapsed && (
                      <div
                        className="overflow-hidden transition-all duration-300"
                        style={{
                          maxHeight: canteensOpen ? '200px' : '0',
                          opacity: canteensOpen ? 1 : 0,
                        }}
                      >
                        <div className="pl-9 pr-2 py-1 space-y-0.5">
                          {item.children.map((child) => {
                            const isChildActive = active === child.key;
                            
                            return (
                              <Link
                                key={child.key}
                                to={child.href}
                                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
                                  isChildActive
                                    ? dark
                                      ? 'bg-primary-500/10 text-primary-400'
                                      : 'bg-primary-500/10 text-primary-600'
                                    : dark
                                      ? 'text-gray-400 hover:bg-gray-800/50 hover:text-gray-200'
                                      : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
                                }`}
                              >
                                <span className="w-1 h-1 rounded-full bg-current opacity-40" />
                                <span className="text-xs font-medium">{child.label}</span>
                              </Link>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              }

              // Regular menu items
              return (
                <Link
                  key={item.key}
                  to={item.href}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                    active === item.key
                      ? dark
                        ? 'bg-primary-500/10 text-primary-400'
                        : 'bg-primary-500/10 text-primary-600'
                      : dark
                        ? 'text-gray-400 hover:bg-gray-800/50 hover:text-gray-200'
                        : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                  title={item.label}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {!collapsed && (
                    <span className="flex-1 text-left text-sm font-medium">{item.label}</span>
                  )}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Footer Section */}
        <div className={`border-t p-3 ${
          dark ? 'border-gray-800' : 'border-gray-100'
        }`}>
          {/* Theme Toggle */}
          {!collapsed && (
            <button
              onClick={toggleTheme}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 mb-2 ${
                dark
                  ? 'text-gray-400 hover:bg-gray-800/50 hover:text-gray-200'
                  : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              {dark ? <FiSun className="w-5 h-5" /> : <FiMoon className="w-5 h-5" />}
              <span className="text-sm font-medium">
                {dark ? 'Light Mode' : 'Dark Mode'}
              </span>
            </button>
          )}

          {/* Professional Logout Button */}
          <button
            onClick={handleLogout}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
              dark
                ? 'text-gray-400 hover:bg-red-500/10 hover:text-red-400'
                : 'text-gray-500 hover:bg-red-500/10 hover:text-red-600'
            }`}
          >
            <FiLogOut className="w-5 h-5 flex-shrink-0" />
            {!collapsed && (
              <>
                <span className="flex-1 text-left text-sm font-medium">Logout</span>
                <span className={`text-xs ${
                  dark ? 'text-gray-600' : 'text-gray-400'
                }`}>
                  Exit
                </span>
              </>
            )}
          </button>

          {/* Collapse Button */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className={`w-full flex items-center justify-center gap-2 px-3 py-2 mt-2 rounded-xl transition-all duration-200 ${
              dark
                ? 'text-gray-500 hover:bg-gray-800/50 hover:text-gray-400'
                : 'text-gray-400 hover:bg-gray-100 hover:text-gray-500'
            }`}
          >
            {collapsed ? (
              <FiChevronRight className="w-5 h-5" />
            ) : (
              <FiChevronLeft className="w-5 h-5" />
            )}
            {!collapsed && <span className="text-xs font-medium">Collapse</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
     <div className="flex-1" />
    </div>
  );
}