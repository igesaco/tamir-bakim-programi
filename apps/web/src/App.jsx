import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from 'react-router-dom';

import { AuthProvider } from './auth/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './layouts/DashboardLayout';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Placeholder from './pages/Placeholder';

import Customers from './pages/Customers';
import Vehicles from './pages/Vehicles';
import ServiceOrders from './pages/ServiceOrders';

function ProtectedLayout() {
  return (
    <ProtectedRoute>
      <DashboardLayout />
    </ProtectedRoute>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route
            path="/login"
            element={<Login />}
          />

          <Route element={<ProtectedLayout />}>
            <Route
              index
              element={<Dashboard />}
            />

            <Route
              path="customers"
              element={<Customers />}
            />

            <Route
              path="vehicles"
              element={<Vehicles />}
            />

            <Route
              path="appointments"
              element={
                <Placeholder title="Randevular" />
              }
            />

            <Route
              path="service-orders"
              element={<ServiceOrders />}
            />

            <Route
              path="quotes"
              element={
                <Placeholder title="Teklifler" />
              }
            />

            <Route
              path="maintenance"
              element={
                <Placeholder title="Bakım" />
              }
            />

            <Route
              path="inventory"
              element={
                <Placeholder title="Stok" />
              }
            />

            <Route
              path="suppliers"
              element={
                <Placeholder title="Tedarikçiler" />
              }
            />

            <Route
              path="users"
              element={
                <Placeholder title="Personel" />
              }
            />

            <Route
              path="branches"
              element={
                <Placeholder title="Şubeler" />
              }
            />

            <Route
              path="notifications"
              element={
                <Placeholder title="Bildirimler" />
              }
            />

            <Route
              path="reports"
              element={
                <Placeholder title="Raporlar" />
              }
            />

            <Route
              path="settings"
              element={
                <Placeholder title="Ayarlar" />
              }
            />
          </Route>

          <Route
            path="*"
            element={<Navigate to="/" replace />}
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}