import { Routes, Route } from "react-router-dom";
import AdminSidebar from "./components/AdminSidebar";
import AdminDashboard from "./AdminDashboard";
import AdminProfile from "./Adminprofile";
import AdminHeader from "./components/AdminHeader";
import CanteenApprovals from './Canteenapprovals';
import CanteenVisibility from './Canteenvisibility';
import UserManagement from './Usermanagement';
import Analytics from './Analytics';
import ComplaintManagement from './Complaintmanagement';



/*function AnalyticsPlaceholder() {
  return (
    <div className="flex flex-col h-screen overflow-hidden bg-gray-50 dark:bg-gray-900">
      <AdminHeader title="Analytics" subtitle="System performance & insights" />
      <div className="flex-1 flex items-center justify-center text-gray-400 dark:text-gray-600">
        <div className="text-center">
          <p className="text-4xl mb-3">📊</p>
          <p className="font-semibold text-gray-500 dark:text-gray-400">Analytics</p>
          <p className="text-sm text-gray-400 dark:text-gray-600 mt-1">Coming soon</p>
        </div>
      </div>
    </div>
  );
}*/

/*function ComplaintsPlaceholder() {
  return (
    <div className="flex flex-col h-screen overflow-hidden bg-gray-50 dark:bg-gray-900">
      <AdminHeader title="Complaint Management" subtitle="Review and resolve complaints" />
      <div className="flex-1 flex items-center justify-center text-gray-400 dark:text-gray-600">
        <div className="text-center">
          <p className="text-4xl mb-3">🚨</p>
          <p className="font-semibold text-gray-500 dark:text-gray-400">Complaint Management</p>
          <p className="text-sm text-gray-400 dark:text-gray-600 mt-1">Coming soon</p>
        </div>
      </div>
    </div>
  );
}*/



// ── Layout ────────────────────────────────────────────────────────────────────
export default function AdminLayout() {
  return (
    <div className="flex h-screen overflow-hidden">
      <AdminSidebar />
      <div className="flex-1 min-w-0 overflow-hidden">
        <Routes>
          <Route path="dashboard"          element={<AdminDashboard />} />
          <Route path="users"              element={<UserManagement />} />
          <Route path="analytics"          element={<Analytics />} />
          <Route path="complaints" element={<ComplaintManagement />} />
          <Route path="canteens/approvals" element={<CanteenApprovals />} />
          <Route path="canteens/manage"    element={<CanteenVisibility />} />
          <Route path="profile"            element={<AdminProfile />} />
          <Route path="*"                  element={<AdminDashboard />} />
        </Routes>
      </div>
    </div>
  );
}
