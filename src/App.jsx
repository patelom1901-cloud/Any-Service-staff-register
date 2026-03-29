import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Splash from './pages/Splash';
import Login from './pages/Login';
import { AdminRoute, WorkerRoute } from './components/ProtectedRoute';
import AdminLayout from './components/AdminLayout';
import WorkerLayout from './components/WorkerLayout';
import Dashboard from './pages/Dashboard';
import Workers from './pages/Workers';
import AdminAttendance from './pages/AdminAttendance';
import Advances from './pages/Advances';
import Reports from './pages/Reports';
import WorkerDashboard from './pages/WorkerDashboard';
import WorkerAttendance from './pages/WorkerAttendance';
import WorkerAdvances from './pages/WorkerAdvances';
import './App.css';
import InstallPWA from './components/InstallPWA';

export default function App() {
  return (
    <BrowserRouter>
      <InstallPWA />
      <Routes>
        <Route path="/" element={<Splash />} />
        <Route path="/login" element={<Login />} />

        <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
          <Route index element={<Dashboard />} />
          <Route path="workers" element={<Workers />} />
          <Route path="attendance" element={<AdminAttendance />} />
          <Route path="advances" element={<Advances />} />
          <Route path="reports" element={<Reports />} />
        </Route>

        <Route path="/worker" element={<WorkerRoute><WorkerLayout /></WorkerRoute>}>
          <Route index element={<WorkerDashboard />} />
          <Route path="attendance" element={<WorkerAttendance />} />
          <Route path="advances" element={<WorkerAdvances />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
