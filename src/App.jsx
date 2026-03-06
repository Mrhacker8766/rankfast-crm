import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import LeadsList from './pages/LeadsList';
import PipelineBoard from './pages/PipelineBoard';
import Settings from './pages/Settings';
import LoginPage from './pages/LoginPage';

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      }>
        <Route index element={<Dashboard />} />
        <Route path="leads" element={<LeadsList />} />
        <Route path="pipeline" element={<PipelineBoard />} />
        <Route path="settings" element={<Settings />} />
        {/* Fallback route */}
        <Route path="*" element={<Dashboard />} />
      </Route>
    </Routes>
  );
}
