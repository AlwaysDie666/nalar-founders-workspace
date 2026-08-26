import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import Layout from './components/layout/Layout';
import LoginPage from './pages/auth/LoginPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import TasksPage from './pages/tasks/TasksPage';
import ProjectsPage from './pages/projects/ProjectsPage';
import InvoicePage from './pages/invoices/InvoicePage';
import FinancePage from './pages/finance/FinancePage';
import ReportsPage from './pages/reports/ReportsPage';
import CalendarPage from './pages/calendar/CalendarPage';
import AdminPage from './pages/admin/AdminPage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isLoggedIn } = useApp();
  if (!isLoggedIn) return <Navigate to="/login" replace />;
  return <Layout>{children}</Layout>;
}

function AppRoutes() {
  const { isLoggedIn } = useApp();
  return (
    <Routes>
      <Route path="/login" element={isLoggedIn ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route path="/" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
      <Route path="/tasks" element={<ProtectedRoute><TasksPage /></ProtectedRoute>} />
      <Route path="/projects" element={<ProtectedRoute><ProjectsPage /></ProtectedRoute>} />
      <Route path="/invoices" element={<ProtectedRoute><InvoicePage /></ProtectedRoute>} />
      <Route path="/finance" element={<ProtectedRoute><FinancePage /></ProtectedRoute>} />
      <Route path="/reports" element={<ProtectedRoute><ReportsPage /></ProtectedRoute>} />
      <Route path="/calendar" element={<ProtectedRoute><CalendarPage /></ProtectedRoute>} />
      <Route path="/admin" element={<ProtectedRoute><AdminPage /></ProtectedRoute>} />
    </Routes>
  );
}

function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AppProvider>
  );
}

export default App;