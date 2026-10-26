import { Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext.jsx';
import { BrandProvider } from './BrandContext.jsx';
import { ROLE_ADMIN } from './constants.js';
import Layout from './components/Layout.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Dashboard from './pages/Dashboard.jsx';
import CalendarPage from './pages/CalendarPage.jsx';
import ContentDatabase from './pages/ContentDatabase.jsx';
import Progress from './pages/Progress.jsx';
import Insight from './pages/Insight.jsx';
import Analytics from './pages/Analytics.jsx';
import AdminBrands from './pages/AdminBrands.jsx';
import AdminUsers from './pages/AdminUsers.jsx';

function Protected({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="splash">Memuat…</div>;
  if (!user) return <Navigate to="/login" replace />;
  return <BrandProvider>{children}</BrandProvider>;
}

function AdminOnly({ children }) {
  const { user } = useAuth();
  return user.role === ROLE_ADMIN ? children : <Navigate to="/dashboard" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/signup" element={<Navigate to="/register" replace />} />
        <Route element={<Protected><Layout /></Protected>}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/content" element={<ContentDatabase />} />
          <Route path="/progress" element={<Progress />} />
          <Route path="/insight" element={<Insight />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/admin/brands" element={<AdminOnly><AdminBrands /></AdminOnly>} />
          <Route path="/admin/users" element={<AdminOnly><AdminUsers /></AdminOnly>} />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AuthProvider>
  );
}
