//frontend/src/pages/Canteen/CanteenLayout.jsx

import { Routes, Route } from "react-router-dom";
import CanteenSidebar from "./components/CanteenSidebar";
import CanteenProfile from './Canteenprofile';
import OperatingHours from './Operatinghours';
import MealsPage from './Mealspage';
import OrdersPage from './OrdersPage';
import RevenuePage from './RevenuePage';
import ReviewsPage from './ReviewsPage';
import ReportIssuePage from './ReportIssuePage';
import CanteenDashboard from './CanteenDashboard';
import QueueStaffPage from './QueueStaffPage';
import { useAuth } from '../../context/AuthContext';
import { Navigate } from 'react-router-dom';

/*function Placeholder({ title, emoji }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 h-screen">
      <p className="text-5xl mb-4">{emoji}</p>
      <h2 className="text-xl font-bold text-gray-700 dark:text-gray-200">{title}</h2>
      <p className="text-sm text-gray-400 mt-1">Coming soon</p>
    </div>
  );
}*/
export default function CanteenLayout() {
  const { token } = useAuth();
  if (!token) return <Navigate to="/login/canteen" replace />;

  return (
    <div className="flex h-screen overflow-hidden">
      <CanteenSidebar />
      <div className="flex-1 min-w-0 overflow-hidden">
        <Routes>
        <Route index element={<CanteenDashboard />} />
          <Route path="profile" element={<CanteenProfile />} />
        <Route path="hours"   element={<OperatingHours />} />
          <Route path="meals" element={<MealsPage />} />
          <Route path="orders" element={<OrdersPage />} />
          <Route path="queue" element={<QueueStaffPage />} />
          <Route path="revenue" element={<RevenuePage />} />
          <Route path="feedback" element={<ReviewsPage />} />
          <Route path="report" element={<ReportIssuePage />} />
 <Route path="dashboard" element={<CanteenDashboard />} />        </Routes>
      </div>
    </div>
  );
}
