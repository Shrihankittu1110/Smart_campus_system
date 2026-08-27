import { Outlet, useLocation, useNavigate } from "react-router-dom";
import StudentSidebar from "../components/StudentSidebar";
import NotificationBell from "../components/NotificationBell";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";

const PAGE_TITLES = {
  "/student/canteens": "Canteens",
  "/student/search":   "Search Meals",
  "/student/cart":     "Cart",
  "/student/checkout": "Checkout",
  "/student/orders":   "My Orders",
  "/student/queue":    "Queue Tokens",
  "/student/expenses": "Expenses",
  "/student/rating":   "Rate Order",
};

export default function StudentLayout() {
  const location = useLocation();
  const navigate  = useNavigate();
  const { theme } = useTheme();
  const { user } = useAuth();
  const dark = theme === "dark";

  const title = Object.entries(PAGE_TITLES).find(([path]) =>
    location.pathname.startsWith(path)
  )?.[1] || "SmartMess";

  const userName    = user?.name || "Student";
  const userInitial = userName.charAt(0).toUpperCase();

  return (
    <div className={`flex min-h-screen ${dark ? "bg-gray-900" : "bg-gray-50"}`}>
      <StudentSidebar />
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        <header
          className="sticky top-0 z-10 flex items-center justify-between px-6 py-3"
          style={{
            background: dark ? "rgb(3, 7, 18)" : "#ffffff",
            borderBottom: dark ? "1px solid rgba(255,255,255,0.06)" : "1px solid rgba(0,0,0,0.06)",
          }}
        >
          {/* Breadcrumb */}
          <div className="flex items-center gap-2">
            <span className={`text-xs font-medium ${dark ? "text-gray-600" : "text-gray-400"}`}>SmartMess</span>
            <span className={`text-xs ${dark ? "text-gray-700" : "text-gray-300"}`}>/</span>
            <span className="text-green-500 text-xs font-semibold">{title}</span>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            <NotificationBell />
            <div
              className="flex items-center gap-2 pl-3 cursor-pointer"
              style={{ borderLeft: dark ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(0,0,0,0.08)" }}
              onClick={() => navigate("/student/canteens")}
            >
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0"
                style={{ background: "linear-gradient(135deg, #16a34a, #4ade80)" }}
              >
                {userInitial}
              </div>
              <div className="hidden sm:block">
                <p className={`text-xs font-semibold leading-none ${dark ? "text-white" : "text-gray-900"}`}>
                  {userName}
                </p>
                <p className={`text-[10px] mt-0.5 ${dark ? "text-gray-500" : "text-gray-400"}`}>Student</p>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
