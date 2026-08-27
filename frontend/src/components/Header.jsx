import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import logo from "../assets/logo.png";
import { useAuth } from "../context/AuthContext";
import { MdPerson, MdLogout, MdDashboard } from "react-icons/md";
 
const navLinks = ["Home", "About", "Services", "Browse Canteens"];
 
const getDashboardPath = (role) => {
  switch (role) {
    case "admin":
      return "/admin/dashboard";
    case "canteen":
      return "/canteen/dashboard";
    case "student":
    default:
      return "/student/canteens";
  }
};
 
const getDashboardLabel = (role) => {
  switch (role) {
    case "admin":
      return "Admin Dashboard";
    case "canteen":
      return "My Canteen";
    case "student":
    default:
      return "Dashboard";
  }
};
 
export default function Header({ dark, setDark, scrolled }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("Home");
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
 
  const handleLogout = () => {
    logout();
    navigate("/");
  };
 
  // Track active section based on scroll position
  useEffect(() => {
    const handleScroll = () => {
      const sections = navLinks.map((link) =>
        document.getElementById(link.toLowerCase().replace(" ", "-"))
      );
 
      const scrollPosition = window.scrollY + 100;
 
      for (let i = sections.length - 1; i >= 0; i--) {
        const section = sections[i];
        if (section) {
          const sectionTop = section.offsetTop;
          const sectionBottom = sectionTop + section.offsetHeight;
 
          if (scrollPosition >= sectionTop && scrollPosition < sectionBottom) {
            setActiveSection(navLinks[i]);
            break;
          }
        }
      }
    };
 
    window.addEventListener("scroll", handleScroll);
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
 
  const dashboardPath = getDashboardPath(user?.role);
  const dashboardLabel = getDashboardLabel(user?.role);
  const browsePath = isAuthenticated && user?.role === 'student' ? '/student/canteens' : '/canteens';
 
  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/70 dark:bg-gray-900/70 shadow-lg shadow-primary-500/20 backdrop-blur-sm"
          : "bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <img src={logo} alt="SmartMess Logo" className="h-10 w-auto md:h-12" />
            <span className="font-playfair text-xl font-black text-primary-600 dark:text-primary-400">
              SmartMess
            </span>
          </Link>
 
          {/* Desktop Navigation */}
          <ul className="hidden md:flex items-center gap-1 flex-1 justify-center">
            {navLinks.map((link) => {
              const sectionId = link.toLowerCase().replace(" ", "-");
              const isActive = activeSection === link;
 
              return (
                <li key={link}>
                  {link === "Browse Canteens" ? (
                    <Link
                      to={browsePath}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        isActive
                          ? "text-primary-600 bg-primary-100/80 dark:bg-primary-900/30 dark:text-primary-400"
                          : "text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50/80 dark:hover:bg-primary-900/20"
                      }`}
                    >
                      {link}
                    </Link>
                  ) : (
                    <a
                      href={`#${sectionId}`}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        isActive
                          ? "text-primary-600 bg-primary-100/80 dark:bg-primary-900/30 dark:text-primary-400"
                          : "text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50/80 dark:hover:bg-primary-900/20"
                      }`}
                    >
                      {link}
                    </a>
                  )}
                </li>
              );
            })}
          </ul>
 
          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-4">
            {/* Dark mode toggle */}
            <button
              onClick={() => setDark(!dark)}
              className="relative w-11 h-5 rounded-full bg-gray-200/80 dark:bg-gradient-to-r dark:from-primary-600/80 dark:to-primary-700/80 transition-colors backdrop-blur-sm"
            >
              <div
                className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-md transition-all duration-300 flex items-center justify-center text-[8px] ${
                  dark ? "left-[22px]" : "left-0.5"
                }`}
              >
                {dark ? "🌙" : "☀️"}
              </div>
            </button>
 
            {isAuthenticated ? (
              <>
                {/* Dashboard Link — only shown when logged in */}
                <Link
                  to={dashboardPath}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 shadow-md shadow-primary-500/30 hover:shadow-lg hover:shadow-primary-500/40 transition-all duration-200"
                >
                  <MdDashboard className="w-4 h-4" />
                  {dashboardLabel}
                </Link>
 
                {/* Profile Link */}
                <Link
                  to="/profile"
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 hover:border-primary-400 hover:text-primary-600 dark:hover:text-primary-400 transition-all duration-200 backdrop-blur-sm bg-white/50 dark:bg-gray-800/50"
                >
                  <div className="w-6 h-6 rounded-full bg-primary-500 flex items-center justify-center text-white text-xs font-bold">
                    {user?.name?.charAt(0)?.toUpperCase() || <MdPerson className="w-4 h-4" />}
                  </div>
                  <span className="max-w-[100px] truncate">{user?.name?.split(" ")[0]}</span>
                </Link>
 
                {/* Logout */}
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 rounded-lg text-sm font-semibold text-red-500 border border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200 backdrop-blur-sm flex items-center gap-1.5"
                >
                  <MdLogout className="w-4 h-4" />
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-5 py-2 rounded-lg text-sm font-semibold text-primary-600 dark:text-primary-400 border-2 border-primary-600/30 dark:border-primary-400/30 hover:border-primary-600 dark:hover:border-primary-400 hover:bg-primary-50/50 dark:hover:bg-primary-900/20 transition-all duration-200 backdrop-blur-sm"
                >
                  Log In
                </Link>
                <Link
                  to="/register/student"
                  className="px-5 py-2 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 shadow-md shadow-primary-500/30 hover:shadow-lg hover:shadow-primary-500/40 transition-all duration-200 backdrop-blur-sm"
                >
                  Register
                </Link>
              </>
            )}
          </div>
 
          {/* Mobile Hamburger */}
          <button
            className="md:hidden flex flex-col gap-1 p-2"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Menu"
          >
            <span
              className={`w-6 h-0.5 bg-gray-800 dark:bg-white transition-transform duration-300 ${
                menuOpen ? "rotate-45 translate-y-1.5" : ""
              }`}
            />
            <span
              className={`w-6 h-0.5 bg-gray-800 dark:bg-white transition-opacity duration-300 ${
                menuOpen ? "opacity-0" : ""
              }`}
            />
            <span
              className={`w-6 h-0.5 bg-gray-800 dark:bg-white transition-transform duration-300 ${
                menuOpen ? "-rotate-45 -translate-y-1.5" : ""
              }`}
            />
          </button>
        </div>
      </div>
 
      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-gray-200/50 dark:border-gray-800/50">
          <div className="px-4 py-4 space-y-2">
            {navLinks.map((link) => {
              const sectionId = link.toLowerCase().replace(" ", "-");
              const isActive = activeSection === link;
 
              return link === "Browse Canteens" ? (
                <Link
                  key={link}
                  to={browsePath}
                  className={`block px-4 py-2 rounded-lg text-gray-600 dark:text-gray-300 ${
                    isActive
                      ? "text-primary-600 dark:text-primary-400 bg-primary-50/80 dark:bg-primary-900/30"
                      : "hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50/80 dark:hover:bg-primary-900/20"
                  }`}
                  onClick={() => setMenuOpen(false)}
                >
                  {link}
                </Link>
              ) : (
                <a
                  key={link}
                  href={`#${sectionId}`}
                  className={`block px-4 py-2 rounded-lg text-gray-600 dark:text-gray-300 ${
                    isActive
                      ? "text-primary-600 dark:text-primary-400 bg-primary-50/80 dark:bg-primary-900/30"
                      : "hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50/80 dark:hover:bg-primary-900/20"
                  }`}
                  onClick={() => setMenuOpen(false)}
                >
                  {link}
                </a>
              );
            })}
 
            <div className="flex flex-col gap-2 pt-4 mt-2 border-t border-gray-200/50 dark:border-gray-800/50">
              {isAuthenticated ? (
                <>
                  {/* Dashboard — mobile */}
                  <Link
                    to={dashboardPath}
                    className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-primary-500 to-primary-600"
                    onClick={() => setMenuOpen(false)}
                  >
                    <MdDashboard className="w-4 h-4" />
                    {dashboardLabel}
                  </Link>
 
                  <div className="flex gap-3">
                    <Link
                      to="/profile"
                      className="flex-1 px-4 py-2 text-center rounded-lg text-sm font-semibold text-primary-600 dark:text-primary-400 border-2 border-primary-600/30 dark:border-primary-400/30"
                      onClick={() => setMenuOpen(false)}
                    >
                      Profile
                    </Link>
                    <button
                      onClick={() => {
                        handleLogout();
                        setMenuOpen(false);
                      }}
                      className="flex-1 px-4 py-2 text-center rounded-lg text-sm font-semibold text-red-500 border border-red-200 dark:border-red-800"
                    >
                      Logout
                    </button>
                    <button
                      onClick={() => setDark(!dark)}
                      className="px-3 py-2 rounded-lg bg-gray-200/80 dark:bg-gray-700/80 backdrop-blur-sm"
                    >
                      {dark ? "☀️" : "🌙"}
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex gap-3">
                  <Link
                    to="/login"
                    className="flex-1 px-4 py-2 text-center rounded-lg text-sm font-semibold text-primary-600 dark:text-primary-400 border-2 border-primary-600/30 dark:border-primary-400/30 hover:border-primary-600 dark:hover:border-primary-400 hover:bg-primary-50/50 dark:hover:bg-primary-900/20 transition-all duration-200"
                    onClick={() => setMenuOpen(false)}
                  >
                    Log In
                  </Link>
                  <Link
                    to="/register/student"
                    className="flex-1 px-4 py-2 text-center rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 shadow-md shadow-primary-500/30 transition-all duration-200"
                    onClick={() => setMenuOpen(false)}
                  >
                    Register
                  </Link>
                  <button
                    onClick={() => setDark(!dark)}
                    className="px-3 py-2 rounded-lg bg-gray-200/80 dark:bg-gray-700/80 backdrop-blur-sm"
                  >
                    {dark ? "☀️" : "🌙"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
