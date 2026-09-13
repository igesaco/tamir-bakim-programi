import { lazy, Suspense } from 'react';
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
const PlatformAdmin = lazy(() => import('./pages/PlatformAdmin'));
const Dashboard = lazy(() => import('./pages/Dashboard'));

const Customers = lazy(() => import('./pages/Customers'));
const CustomerDetail = lazy(() => import('./pages/CustomerDetail'));

const Vehicles = lazy(() => import('./pages/Vehicles'));
const VehicleDetail = lazy(() => import('./pages/VehicleDetail'));
const VehicleQrPrint = lazy(() => import('./pages/VehicleQrPrint'));

const Appointments = lazy(() => import('./pages/Appointments'));

const ServiceOrders = lazy(() => import('./pages/ServiceOrders'));
const ServiceOrderDetail = lazy(() => import('./pages/ServiceOrderDetail'));
const DeliveryReport = lazy(() => import('./pages/DeliveryReport'));

const Quotes = lazy(() => import('./pages/Quotes'));
const QuoteProforma = lazy(() => import('./pages/QuoteProforma'));
const Maintenance = lazy(() => import('./pages/Maintenance'));
const Inventory = lazy(() => import('./pages/Inventory'));
const Suppliers = lazy(() => import('./pages/Suppliers'));
const Users = lazy(() => import('./pages/Users'));
const Branches = lazy(() => import('./pages/Branches'));
const Notifications = lazy(() => import('./pages/Notifications'));
const Reports = lazy(() => import('./pages/Reports'));
const Cashier = lazy(() => import('./pages/Cashier'));
const Settings = lazy(() => import('./pages/Settings'));
const Account = lazy(() => import('./pages/Account'));

const PublicVehicle = lazy(() => import('./pages/PublicVehicle'));
const CustomerPortal = lazy(() => import('./pages/CustomerPortal'));
const CustomerAppRedirect = lazy(() => import('./pages/CustomerAppRedirect'));

const SERVICE_ROLES = [
  'OWNER',
  'MANAGER',
  'SERVICE_ADVISOR',
];

const SERVICE_ORDER_ROLES = [
  ...SERVICE_ROLES,
  'TECHNICIAN',
  'ACCOUNTING',
];

const PRICING_ROLES = [
  'OWNER',
  'MANAGER',
  'SERVICE_ADVISOR',
  'ACCOUNTING',
];

const NOTIFICATION_ROLES = [
  'OWNER',
  'MANAGER',
  'SERVICE_ADVISOR',
  'TECHNICIAN',
  'WAREHOUSE',
  'ACCOUNTING',
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
        <Suspense fallback={<div className="loading-screen">Ekran yükleniyor...</div>}>
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
                  roles={PRICING_ROLES}
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
              path="pricing"
              element={<Navigate to="/quotes" replace />}
            />

            <Route
              path="quotes"
              element={
                <ForRoles
                  roles={PRICING_ROLES}
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
                  roles={NOTIFICATION_ROLES}
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
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  );
}
