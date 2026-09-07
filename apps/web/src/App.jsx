import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from 'react-router-dom';

import { AuthProvider } from './auth/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import RoleRoute from './components/RoleRoute';
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
import DeliveryReport from './pages/DeliveryReport';

import Quotes from './pages/Quotes';
import QuoteProforma from './pages/QuoteProforma';
import Maintenance from './pages/Maintenance';
import Inventory from './pages/Inventory';
import Suppliers from './pages/Suppliers';
import Users from './pages/Users';
import Branches from './pages/Branches';
import Notifications from './pages/Notifications';
import Reports from './pages/Reports';
import Cashier from './pages/Cashier';
import Settings from './pages/Settings';

import PublicVehicle from './pages/PublicVehicle';

const SERVICE_ROLES = [
  'OWNER',
  'MANAGER',
  'SERVICE_ADVISOR',
];

const SERVICE_ORDER_ROLES = [
  ...SERVICE_ROLES,
  'TECHNICIAN',
];

const MANAGEMENT_ROLES = [
  'OWNER',
  'MANAGER',
];

function ProtectedLayout() {
  return (
    <ProtectedRoute>
      <DashboardLayout />
    </ProtectedRoute>
  );
}

function ForRoles({
  roles,
  children,
}) {
  return (
    <RoleRoute roles={roles}>
      {children}
    </RoleRoute>
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

          <Route
            path="/qr/:token"
            element={<PublicVehicle />}
          />

          <Route
            path="/service-orders/:id/delivery"
            element={
              <ProtectedRoute>
                <ForRoles
                  roles={SERVICE_ROLES}
                >
                  <DeliveryReport />
                </ForRoles>
              </ProtectedRoute>
            }
          />

          <Route
            path="/quotes/:id/proforma"
            element={
              <ProtectedRoute>
                <ForRoles
                  roles={SERVICE_ROLES}
                >
                  <QuoteProforma />
                </ForRoles>
              </ProtectedRoute>
            }
          />

          <Route element={<ProtectedLayout />}>
            <Route
              index
              element={<Dashboard />}
            />

            <Route
              path="customers"
              element={
                <ForRoles
                  roles={SERVICE_ROLES}
                >
                  <Customers />
                </ForRoles>
              }
            />

            <Route
              path="customers/:id"
              element={
                <ForRoles
                  roles={SERVICE_ROLES}
                >
                  <CustomerDetail />
                </ForRoles>
              }
            />

            <Route
              path="vehicles"
              element={
                <ForRoles
                  roles={SERVICE_ROLES}
                >
                  <Vehicles />
                </ForRoles>
              }
            />

            <Route
              path="vehicles/:id"
              element={
                <ForRoles
                  roles={SERVICE_ROLES}
                >
                  <VehicleDetail />
                </ForRoles>
              }
            />

            <Route
              path="appointments"
              element={
                <ForRoles
                  roles={SERVICE_ROLES}
                >
                  <Appointments />
                </ForRoles>
              }
            />

            <Route
              path="service-orders"
              element={
                <ForRoles
                  roles={SERVICE_ORDER_ROLES}
                >
                  <ServiceOrders />
                </ForRoles>
              }
            />

            <Route
              path="service-orders/:id"
              element={
                <ForRoles
                  roles={SERVICE_ORDER_ROLES}
                >
                  <ServiceOrderDetail />
                </ForRoles>
              }
            />

            <Route
              path="quotes"
              element={
                <ForRoles
                  roles={SERVICE_ROLES}
                >
                  <Quotes />
                </ForRoles>
              }
            />

            <Route
              path="maintenance"
              element={
                <ForRoles
                  roles={SERVICE_ROLES}
                >
                  <Maintenance />
                </ForRoles>
              }
            />

            <Route
              path="inventory"
              element={
                <ForRoles
                  roles={MANAGEMENT_ROLES}
                >
                  <Inventory />
                </ForRoles>
              }
            />

            <Route
              path="suppliers"
              element={
                <ForRoles
                  roles={MANAGEMENT_ROLES}
                >
                  <Suppliers />
                </ForRoles>
              }
            />

            <Route
              path="users"
              element={
                <ForRoles
                  roles={MANAGEMENT_ROLES}
                >
                  <Users />
                </ForRoles>
              }
            />

            <Route
              path="branches"
              element={
                <ForRoles
                  roles={MANAGEMENT_ROLES}
                >
                  <Branches />
                </ForRoles>
              }
            />

            <Route
              path="notifications"
              element={
                <ForRoles
                  roles={SERVICE_ROLES}
                >
                  <Notifications />
                </ForRoles>
              }
            />

            <Route
              path="cashier"
              element={
                <ForRoles
                  roles={MANAGEMENT_ROLES}
                >
                  <Cashier />
                </ForRoles>
              }
            />

            <Route
              path="reports"
              element={
                <ForRoles
                  roles={MANAGEMENT_ROLES}
                >
                  <Reports />
                </ForRoles>
              }
            />

            <Route
              path="settings"
              element={
                <ForRoles
                  roles={MANAGEMENT_ROLES}
                >
                  <Settings />
                </ForRoles>
              }
            />
          </Route>

          <Route
            path="*"
            element={
              <Navigate
                to="/"
                replace
              />
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
