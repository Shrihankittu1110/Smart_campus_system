import { useState } from "react";
import { Link } from "react-router-dom";
import { useTheme } from '../../context/ThemeContext';
import { 
  MdPerson, 
  MdStore, 
  MdAdminPanelSettings,
  MdArrowForward 
} from 'react-icons/md';
import { FaGraduationCap, FaUniversity, FaChartLine } from 'react-icons/fa';
import { BiFoodMenu } from 'react-icons/bi';

const roles = [
  {
    key: "user",
    href: "/login/user",
    gradient: "from-primary-500 to-primary-600",
    glowColor: "rgba(34,197,94,0.3)",
    borderColor: "#22c55e",
    accentLight: "rgba(34,197,94,0.08)",
    icon: <MdPerson className="w-8 h-8" />,
    label: "User",
    tagline: "Students, Teachers & Staff",
    features: [
      "Browse approved canteens & menus",
      "Filter meals by price & category",
      "Cart management & secure checkout",
      "Real-time order status tracking",
      "Monthly expense dashboard",
      "Submit ratings & feedback",
    ],
    badge: "Most Popular",
    bgIcon: FaGraduationCap,
  },
  {
    key: "canteen",
    href: "/login/canteen",
    gradient: "from-cyan-500 to-blue-600",
    glowColor: "rgba(6,182,212,0.3)",
    borderColor: "#06b6d4",
    accentLight: "rgba(6,182,212,0.08)",
    icon: <MdStore className="w-8 h-8" />,
    label: "Canteen",
    tagline: "Food Vendors & Operators",
    features: [
      "Full canteen profile & image management",
      "Add, edit & categorize meals",
      "Accept or reject incoming orders",
      "Live order preparation status",
      "Daily & monthly revenue reports",
      "View & respond to student reviews",
    ],
    badge: "Operator",
    bgIcon: BiFoodMenu,
  },
  {
    key: "admin",
    href: "/login/admin",
    gradient: "from-purple-500 to-purple-700",
    glowColor: "rgba(139,92,246,0.3)",
    borderColor: "#a78bfa",
    accentLight: "rgba(167,139,250,0.08)",
    icon: <MdAdminPanelSettings className="w-8 h-8" />,
    label: "Admin",
    tagline: "System Administrators",
    features: [
      "Approve or reject canteen registrations",
      "Enable / disable canteen visibility",
      "Manage & resolve complaints",
      "Block or unblock user accounts",
      "System-wide analytics dashboard",
      "Audit logs & moderation tools",
    ],
    badge: "System",
    bgIcon: FaChartLine,
  },
];

export default function LoginPortal() {
  const { theme } = useTheme();
  const dark = theme === 'dark';
  const [hovered, setHovered] = useState(null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-white dark:from-gray-900 dark:to-gray-800 font-sans transition-colors duration-400">
      {/* Mesh Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className={`absolute inset-0 ${
          dark
            ? "bg-[radial-gradient(ellipse_80%_60%_at_20%_10%,rgba(22,163,74,0.08)_0%,transparent_60%),radial-gradient(ellipse_60%_50%_at_80%_80%,rgba(124,58,237,0.06)_0%,transparent_60%),radial-gradient(ellipse_70%_40%_at_60%_20%,rgba(14,116,144,0.05)_0%,transparent_60%)]"
            : "bg-[radial-gradient(ellipse_80%_60%_at_20%_10%,rgba(22,163,74,0.12)_0%,transparent_60%),radial-gradient(ellipse_60%_50%_at_80%_80%,rgba(124,58,237,0.07)_0%,transparent_60%),radial-gradient(ellipse_70%_40%_at_60%_20%,rgba(14,116,144,0.08)_0%,transparent_60%)]"
        }`} />
      </div>

      <div className="relative z-10 min-h-screen flex flex-col items-center px-6 py-16 md:py-20">
        {/* Header - Smaller title */}
        <div className="text-center max-w-3xl mb-12 animate-fade-down">
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 text-gray-500 dark:text-gray-400 text-sm font-medium mb-6 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm hover:text-primary-600 dark:hover:text-primary-400 hover:border-primary-400 transition-all duration-200"
          >
            ← Back to Home
          </Link>
          
          <div className="inline-flex items-center gap-2 bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 px-4 py-2 rounded-full text-xs font-semibold tracking-wide mb-4">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary-500"></span>
            </span>
            SmartMess Portal
          </div>
          
          <h1 className="font-playfair text-3xl md:text-4xl lg:text-5xl font-black text-gray-900 dark:text-white leading-tight mb-3">
            Who are you <span className="text-primary-600 dark:text-primary-400">logging in</span> as?
          </h1>
          
          <p className="text-gray-600 dark:text-gray-300 text-base max-w-2xl mx-auto">
            Select your role to access your personalised dashboard and tools.
          </p>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl w-full animate-fade-up animation-delay-100">
          {roles.map((role, index) => {
            const BgIcon = role.bgIcon;
            return (
              <Link
                key={role.key}
                to={role.href}
                className="group relative bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm border-2 border-gray-200 dark:border-gray-700 rounded-2xl p-8 hover:-translate-y-2 transition-all duration-300 overflow-hidden"
                style={{
                  animationDelay: `${0.1 + index * 0.1}s`,
                  borderColor: hovered === role.key ? role.borderColor : undefined,
                  boxShadow: hovered === role.key
                    ? `0 24px 60px ${role.glowColor}, 0 0 0 1px ${role.borderColor}22`
                    : '0 4px 24px rgba(0,0,0,0.07)',
                }}
                onMouseEnter={() => setHovered(role.key)}
                onMouseLeave={() => setHovered(null)}
              >
                {/* Background Icon */}
                <BgIcon className="absolute -right-8 -bottom-8 w-32 h-32 opacity-5 dark:opacity-10 transform rotate-12 group-hover:rotate-6 transition-transform duration-500" />
                
                {/* Animated background gradient */}
                <div 
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{ background: role.accentLight }}
                />
                
                {/* Corner accent */}
                <div 
                  className="absolute top-0 right-0 w-20 h-20 rounded-bl-full transform translate-x-10 -translate-y-10 group-hover:translate-x-0 group-hover:translate-y-0 transition-transform duration-500"
                  style={{ background: role.accentLight }}
                />

                {/* Badge */}
                <span
                  className="absolute top-5 right-5 text-[10px] font-extrabold tracking-wider uppercase px-2.5 py-1 rounded-full border z-10"
                  style={{
                    color: role.borderColor,
                    borderColor: role.borderColor + '55',
                    background: role.accentLight,
                  }}
                >
                  {role.badge}
                </span>

                {/* Icon */}
                <div className="relative z-10 mb-6">
                  <div 
                    className="w-16 h-16 rounded-xl flex items-center justify-center bg-gradient-to-br text-white shadow-lg group-hover:scale-110 group-hover:-rotate-3 transition-all duration-300"
                    style={{
                      background: `linear-gradient(135deg, ${role.borderColor}80, ${role.borderColor})`,
                      boxShadow: hovered === role.key ? `0 8px 20px ${role.glowColor}` : '0 4px 12px rgba(0,0,0,0.1)',
                    }}
                  >
                    {role.icon}
                  </div>
                </div>

                {/* Content */}
                <div className="relative z-10">
                  <h2 className="font-playfair text-2xl font-black text-gray-900 dark:text-white mb-1">
                    {role.label}
                  </h2>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-6">
                    {role.tagline}
                  </p>

                  <div className="h-px bg-gray-200 dark:bg-gray-700 mb-6" />

                  {/* Features */}
                  <ul className="space-y-2.5 mb-8">
                    {role.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2 text-xs text-gray-600 dark:text-gray-300">
                        <span 
                          className="w-4 h-4 rounded flex items-center justify-center text-[8px] flex-shrink-0 mt-0.5"
                          style={{ background: role.accentLight, color: role.borderColor }}
                        >
                          ✓
                        </span>
                        {feature}
                      </li>
                    ))}
                  </ul>

                  {/* Improved CTA Button */}
                  <div className="relative z-10">
                    <div 
                      className="flex items-center justify-between p-3 rounded-xl transition-all duration-300 group-hover:shadow-md"
                      style={{
                        background: hovered === role.key ? role.accentLight : 'transparent',
                      }}
                    >
                      <span 
                        className="text-sm font-semibold flex items-center gap-2"
                        style={{ color: role.borderColor }}
                      >
                        Login as {role.label}
                      </span>
                      <div 
                        className="w-8 h-8 rounded-lg flex items-center justify-center transform group-hover:translate-x-1 group-hover:scale-110 transition-all duration-300"
                        style={{
                          background: role.accentLight,
                          color: role.borderColor,
                        }}
                      >
                        <MdArrowForward className="w-4 h-4" />
                      </div>
                    </div>
                    
                    {/* Animated underline */}
                    <div 
                      className="absolute bottom-0 left-0 w-0 h-0.5 group-hover:w-full transition-all duration-300"
                      style={{ background: role.borderColor }}
                    />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}