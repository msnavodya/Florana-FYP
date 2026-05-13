// Compose the main application shell and routes for the admin dashboard.
import { Suspense, lazy } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AdminLayout } from './layouts/AdminLayout';
import { ProtectedRoute } from './components/ProtectedRoute';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const Feedback = lazy(() => import('./pages/Feedback'));
const Login = lazy(() => import('./pages/Login'));
const Orders = lazy(() => import('./pages/Orders'));
const Plants = lazy(() => import('./pages/Plants'));
const Users = lazy(() => import('./pages/Users'));

function withSuspense(element) {
  return (
    <Suspense
      fallback={
        <div className="rounded-2xl border border-[#ead8f1] bg-white p-6 text-sm text-slate-600 shadow-sm">
          Loading page...
        </div>
      }
    >
      {element}
    </Suspense>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={withSuspense(<Login />)} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AdminLayout />}>
          <Route index element={withSuspense(<Dashboard />)} />
          <Route path="plants" element={withSuspense(<Plants />)} />
          <Route path="feedback" element={withSuspense(<Feedback />)} />
          <Route path="payments" element={withSuspense(<Orders />)} />
          <Route path="users" element={withSuspense(<Users />)} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
