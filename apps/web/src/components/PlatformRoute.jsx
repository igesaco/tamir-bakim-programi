import {
  Navigate,
} from 'react-router-dom';

import { useAuth } from '../auth/AuthContext';

export default function PlatformRoute({
  children,
}) {
  const {
    user,
    loading,
  } = useAuth();

  if (loading) {
    return (
      <div className="loading-screen">
        Yükleniyor...
      </div>
    );
  }

  if (
    !user ||
    user.actorType !==
      'PLATFORM'
  ) {
    return (
      <Navigate
        to="/platform-login"
        replace
      />
    );
  }

  return children;
}
