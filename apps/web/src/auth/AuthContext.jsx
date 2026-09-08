import {
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react';

import api from '../api/client';

const AuthContext =
  createContext(null);

export function AuthProvider({
  children,
}) {
  const [user, setUser] =
    useState(null);
  const [loading, setLoading] =
    useState(true);

  async function loadCurrentUser() {
    const token =
      localStorage.getItem(
        'token',
      );

    if (!token) {
      setUser(null);
      return null;
    }

    const kind =
      localStorage.getItem(
        'auth_kind',
      ) || 'tenant';

    const endpoint =
      kind === 'platform'
        ? '/platform/me'
        : '/users/me';

    const response =
      await api.get(endpoint);

    setUser(
      response.data,
    );

    return response.data;
  }

  useEffect(() => {
    loadCurrentUser()
      .catch(() => {
        localStorage.removeItem(
          'token',
        );
        localStorage.removeItem(
          'auth_kind',
        );
        setUser(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  async function login(
    email,
    password,
  ) {
    const response =
      await api.post(
        '/auth/login',
        {
          email,
          password,
        },
      );

    localStorage.setItem(
      'token',
      response.data.token,
    );
    localStorage.setItem(
      'auth_kind',
      'tenant',
    );

    const me =
      await api.get(
        '/users/me',
      );

    setUser(me.data);

    return me.data;
  }

  async function platformLogin(
    email,
    password,
  ) {
    const response =
      await api.post(
        '/platform/login',
        {
          email,
          password,
        },
      );

    localStorage.setItem(
      'token',
      response.data.token,
    );
    localStorage.setItem(
      'auth_kind',
      'platform',
    );

    localStorage.removeItem(
      'platform_return_token',
    );

    const me =
      await api.get(
        '/platform/me',
      );

    setUser(me.data);

    return me.data;
  }

  async function enterOrganization(
    organizationId,
  ) {
    const platformToken =
      localStorage.getItem(
        'token',
      );

    const response =
      await api.post(
        `/platform/organizations/${organizationId}/impersonate`,
      );

    if (platformToken) {
      localStorage.setItem(
        'platform_return_token',
        platformToken,
      );
    }

    localStorage.setItem(
      'token',
      response.data.token,
    );
    localStorage.setItem(
      'auth_kind',
      'tenant',
    );

    const me =
      await api.get(
        '/users/me',
      );

    setUser(me.data);

    return me.data;
  }

  async function returnToPlatform() {
    const platformToken =
      localStorage.getItem(
        'platform_return_token',
      );

    if (!platformToken) {
      return false;
    }

    localStorage.setItem(
      'token',
      platformToken,
    );
    localStorage.setItem(
      'auth_kind',
      'platform',
    );
    localStorage.removeItem(
      'platform_return_token',
    );

    const me =
      await api.get(
        '/platform/me',
      );

    setUser(me.data);

    return true;
  }

  function logout() {
    localStorage.removeItem(
      'token',
    );
    localStorage.removeItem(
      'auth_kind',
    );
    localStorage.removeItem(
      'platform_return_token',
    );

    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        platformLogin,
        enterOrganization,
        returnToPlatform,
        refreshUser:
          loadCurrentUser,
        isImpersonating:
          user?.actorType ===
          'TENANT_IMPERSONATION',
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(
    AuthContext,
  );
}
