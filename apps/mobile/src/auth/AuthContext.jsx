import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import * as SecureStore from 'expo-secure-store';

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

  async function refreshUser() {
    const token =
      await SecureStore.getItemAsync(
        'tb_token',
      );

    if (!token) {
      setUser(null);
      return null;
    }

    const response =
      await api.get('/users/me');

    setUser(response.data);

    return response.data;
  }

  useEffect(() => {
    refreshUser()
      .catch(async () => {
        await SecureStore.deleteItemAsync(
          'tb_token',
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

    await SecureStore.setItemAsync(
      'tb_token',
      response.data.token,
    );

    const current =
      await refreshUser();

    return current;
  }

  async function logout() {
    await SecureStore.deleteItemAsync(
      'tb_token',
    );
    setUser(null);
  }

  const value = useMemo(
    () => ({
      user,
      loading,
      login,
      logout,
      refreshUser,
    }),
    [
      user,
      loading,
    ],
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(
    AuthContext,
  );
}
