import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { LoadingBlock } from '../../components/Spinner';
import { AuthProvider } from '../../context/AuthContext';
import { useAuth } from '../../hooks/useAuth';
import AdminLayout from '../../layouts/AdminLayout';
import AdminNotFound from './AdminNotFound';
import FaqAdmin from './FaqAdmin';
import ForgotPassword from './ForgotPassword';
import LeadDetail from './LeadDetail';
import Leads from './Leads';
import Login from './Login';
import Overview from './Overview';
import PortfolioAdmin from './PortfolioAdmin';
import ServicesAdmin from './ServicesAdmin';
import SetPassword from './SetPassword';
import SettingsAdmin from './SettingsAdmin';
import TeamAdmin from './TeamAdmin';
import UsersAdmin from './UsersAdmin';

/** Sends signed-out visitors to the sign-in page and back afterwards. */
function RequireAuth({ children }) {
  const { status } = useAuth();
  const location = useLocation();
  if (status === 'loading') return <LoadingBlock label="Checking your session…" />;
  if (status !== 'authenticated') {
    return <Navigate to="/admin/login" replace state={{ from: location.pathname + location.search }} />;
  }
  return children;
}

export default function AdminApp() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="login" element={<Login />} />
        <Route path="forgot-password" element={<ForgotPassword />} />
        <Route path="set-password" element={<SetPassword />} />
        <Route
          element={
            <RequireAuth>
              <AdminLayout />
            </RequireAuth>
          }
        >
          <Route index element={<Overview />} />
          <Route path="leads" element={<Leads />} />
          <Route path="leads/:id" element={<LeadDetail />} />
          <Route path="services" element={<ServicesAdmin />} />
          <Route path="team" element={<TeamAdmin />} />
          <Route path="portfolio" element={<PortfolioAdmin />} />
          <Route path="faq" element={<FaqAdmin />} />
          <Route path="settings" element={<SettingsAdmin />} />
          <Route path="users" element={<UsersAdmin />} />
          <Route path="*" element={<AdminNotFound />} />
        </Route>
      </Routes>
    </AuthProvider>
  );
}
