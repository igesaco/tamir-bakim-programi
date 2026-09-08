import { Navigate } from 'react-router-dom';

import { useAuth } from '../auth/AuthContext';

export default function RoleRoute({
  roles,
  feature,
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
    roles?.length &&
    !roles.includes(user.role)
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
