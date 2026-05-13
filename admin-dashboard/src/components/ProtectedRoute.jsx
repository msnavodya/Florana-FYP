// Render a reusable admin dashboard component for Protected Route.
import { Navigate, Outlet } from 'react-router-dom';
import { auth } from '../services/api';

export function ProtectedRoute() {
  if (!auth.isAdmin()) {
    auth.logout();
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
