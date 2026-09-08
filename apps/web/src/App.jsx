import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from 'react-router-dom';

import { AuthProvider } from './auth/AuthContext';
import PlatformRoute from './components/PlatformRoute';
import ProtectedRoute from './components/ProtectedRoute';
import RoleRoute from './components/RoleRoute';
import DashboardLayout from './layouts/DashboardLayout';

import Login from './pages/Login';
import PlatformLogin from './pages/PlatformLogin';
import PlatformAdmin from './pages/PlatformAdmin';
import Dashboard from './pages/Dashboard';

import Customers from './pages/Customers';
import CustomerDetail from './pages/CustomerDetail';

import Vehicles from './pages/Vehicles';
import VehicleDetail from './pages/VehicleDetail';
import VehicleQrPrint from './pages/VehicleQrPrint';

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
import Account from './pages/Account';

import PublicVehicle from './pages/PublicVehicle';
import CustomerPortal from './pages/CustomerPortal';
import CustomerAppRedirect from './pages/CustomerAppRedirect';

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

const INVENTORY_ROLES = [
  ...MANAGEMENT_ROLES,
  'WAREHOUSE',
];

const FINANCE_ROLES = [
  ...MANAGEMENT_ROLES,
  'ACCOUNTING',
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
  feature,
  permission,
  children,
}) {
  return (
    <RoleRoute
      roles={roles}
      feature={feature}
      permission={permission}
    >
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
            path="/platform-login"
            element={<PlatformLogin />}
          />

          <Route
            path="/platform"
            element={
              <PlatformRoute>
                <PlatformAdmin />
              </PlatformRoute>
            }
          />

          <Route
            path="/musteri"
            element={<CustomerPortal />}
          />

          <Route
            path="/uygulama"
            element={<CustomerAppRedirect />}
          />

          <Route
            path="/qr/:token"
            element={<PublicVehicle />}
          />

          <Route
            path="/vehicles/:id/qr-print"
            element={
              <ProtectedRoute>
                <ForRoles
                  roles={SERVICE_ROLES}
                  feature="VEHICLES_QR"
                  permission="VEHICLE_QR"
                >
                  <VehicleQrPrint />
                </ForRoles>
              </ProtectedRoute>
            }
          />

          <Route
            path="/service-orders/:id/delivery"
            element={
              <ProtectedRoute>
                <ForRoles
                  roles={SERVICE_ROLES}
                  feature="SERVICE_ORDERS"
                  permission="SERVICE_ORDER_VIEW"
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
                  feature="QUOTES"
                  permission="QUOTE_VIEW"
                >
                  <QuoteProforma />
                </ForRoles>
              </ProtectedRoute>
            }
          />

          <Route element={<ProtectedLayout />}>
            <Route
              index
              element={
                <ForRoles
                  roles={SERVICE_ORDER_ROLES}
                  feature="DASHBOARD"
                >
                  <Dashboard />
                </ForRoles>
              }
            />

            <Route
              path="customers"
              element={
                <ForRoles
                  roles={SERVICE_ROLES}
                  feature="CUSTOMERS"
                  permission="CUSTOMER_VIEW"
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
                  feature="CUSTOMERS"
                  permission="CUSTOMER_VIEW"
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
                  feature="VEHICLES_QR"
                  permission="VEHICLE_VIEW"
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
                  feature="VEHICLES_QR"
                  permission="VEHICLE_VIEW"
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
                  feature="APPOINTMENTS"
                  permission="APPOINTMENT_VIEW"
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
                  feature="SERVICE_ORDERS"
                  permission="SERVICE_ORDER_VIEW"
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
                  feature="SERVICE_ORDERS"
                  permission="SERVICE_ORDER_VIEW"
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
                  feature="QUOTES"
                  permission="QUOTE_VIEW"
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
                  feature="MAINTENANCE"
                  permission="MAINTENANCE_VIEW"
                >
                  <Maintenance />
                </ForRoles>
              }
            />

            <Route
              path="inventory"
              element={
                <ForRoles
                  roles={INVENTORY_ROLES}
                  feature="INVENTORY"
                  permission="INVENTORY_VIEW"
                >
                  <Inventory />
                </ForRoles>
              }
            />

            <Route
              path="suppliers"
              element={
                <ForRoles
                  roles={INVENTORY_ROLES}
                  feature="SUPPLIERS"
                  permission="SUPPLIER_VIEW"
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
                  feature="STAFF"
                  permission="STAFF_VIEW"
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
                  feature="BRANCHES"
                  permission="BRANCH_VIEW"
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
                  feature="NOTIFICATIONS"
                  permission="NOTIFICATION_VIEW"
                >
                  <Notifications />
                </ForRoles>
              }
            />

            <Route
              path="cashier"
              element={
                <ForRoles
                  roles={FINANCE_ROLES}
                  feature="CASHIER"
                  permission="CASHIER_VIEW"
                >
                  <Cashier />
                </ForRoles>
              }
            />

            <Route
              path="reports"
              element={
                <ForRoles
                  roles={FINANCE_ROLES}
                  feature="REPORTS"
                  permission="REPORTS_VIEW"
                >
                  <Reports />
                </ForRoles>
              }
            />

            <Route
              path="account"
              element={<Account />}
            />

            <Route
              path="settings"
              element={
                <ForRoles
                  roles={MANAGEMENT_ROLES}
                  feature="SETTINGS"
                  permission="SETTINGS_VIEW"
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
