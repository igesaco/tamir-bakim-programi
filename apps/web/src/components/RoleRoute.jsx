import { Navigate } from 'react-router-dom';

import { useAuth } from '../auth/AuthContext';

export default function RoleRoute({
  roles,
  feature,
  permission,
  children,
}) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-screen">
        Yükleniyor...
      </div>
    );
  }

  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  if (
    feature &&
    !user.features?.includes(
      feature,
    )
  ) {
    return (
      <Navigate
        to="/account"
        replace
      />
    );
  }

  if (
    permission &&
    !user.permissions?.includes(
      permission,
    )
  ) {
    return (
      <Navigate
        to="/account"
        replace
      />
    );
  }

  const accountingCustomerWorkspace =
    user.role === 'ACCOUNTING' &&
    feature === 'CUSTOMERS' &&
    permission === 'CUSTOMER_VIEW';

  if (
    roles?.length &&
    !roles.includes(user.role) &&
    !accountingCustomerWorkspace
  ) {
    return (
      <Navigate
        to="/account"
        replace
      />
    );
  }

  return children;
}
