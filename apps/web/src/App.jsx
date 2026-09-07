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
import Customers from './pages/Customers';
import CustomerDetail from './pages/CustomerDetail';
import Vehicles from './pages/Vehicles';
import VehicleDetail from './pages/VehicleDetail';
import Appointments from './pages/Appointments';
import ServiceOrders from './pages/ServiceOrders';
import ServiceOrderDetail from './pages/ServiceOrderDetail';
import Quotes from './pages/Quotes';
import Maintenance from './pages/Maintenance';
import Inventory from './pages/Inventory';
import Suppliers from './pages/Suppliers';
import Users from './pages/Users';
import Branches from './pages/Branches';
import Notifications from './pages/Notifications';
import Reports from './pages/Reports';
import Settings from './pages/Settings';

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
              path="customers/:id"
              element={<CustomerDetail />}
            />

            <Route
              path="vehicles"
              element={<Vehicles />}
            />

            <Route
              path="vehicles/:id"
              element={<VehicleDetail />}
            />

            <Route
              path="appointments"
              element={<Appointments />}
            />

            <Route
              path="service-orders"
              element={<ServiceOrders />}
            />

            <Route
              path="service-orders/:id"
              element={<ServiceOrderDetail />}
            />

            <Route
              path="quotes"
              element={<Quotes />}
            />

            <Route
              path="maintenance"
              element={<Maintenance />}
            />

            <Route
              path="inventory"
              element={<Inventory />}
            />

            <Route
              path="suppliers"
              element={<Suppliers />}
            />

            <Route
              path="users"
              element={<Users />}
            />

            <Route
              path="branches"
              element={<Branches />}
            />

            <Route
              path="notifications"
              element={<Notifications />}
            />

            <Route
              path="reports"
              element={<Reports />}
            />

            <Route
              path="settings"
              element={<Settings />}
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