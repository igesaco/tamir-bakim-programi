import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import * as SecureStore from 'expo-secure-store';

import api from '../api/client';
import {
  apiRequest,
} from '../api';

const AuthContext =
  createContext(null);

const STAFF_TOKEN_KEY =
  'tb_token';

const CUSTOMER_TOKEN_KEY =
  'tb_customer_token';

const SESSION_TYPE_KEY =
  'tb_session_type';

export function AuthProvider({
  children,
}) {
  const [user, setUser] =
    useState(null);

  const [customer, setCustomer] =
    useState(null);

  const [
    customerData,
    setCustomerData,
  ] = useState(null);

  const [
    customerToken,
    setCustomerToken,
  ] = useState('');

  const [
    sessionType,
    setSessionType,
  ] = useState(null);

  const [loading, setLoading] =
    useState(true);

  async function refreshUser() {
    const token =
      await SecureStore.getItemAsync(
        STAFF_TOKEN_KEY,
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

  async function loadCustomerSession(
    token,
  ) {
    const portalData =
      await apiRequest(
        '/customer-portal/me',
        {
          token,
        },
      );

    setCustomer(
      portalData.customer,
    );
    setCustomerData(
      portalData,
    );
    setCustomerToken(
      token,
    );

    return portalData;
  }

  async function refreshCustomer() {
    const token =
      customerToken ||
      await SecureStore.getItemAsync(
        CUSTOMER_TOKEN_KEY,
      );

    if (!token) {
      setCustomer(null);
      setCustomerData(null);
      return null;
    }

    return loadCustomerSession(
      token,
    );
  }

  useEffect(() => {
    async function restore() {
      const [
        preferred,
        staffToken,
        savedCustomerToken,
      ] = await Promise.all([
        SecureStore.getItemAsync(
          SESSION_TYPE_KEY,
        ),
        SecureStore.getItemAsync(
          STAFF_TOKEN_KEY,
        ),
        SecureStore.getItemAsync(
          CUSTOMER_TOKEN_KEY,
        ),
      ]);

      const tryStaff =
        async () => {
          if (!staffToken) {
            return false;
          }

          try {
            await refreshUser();
            setSessionType(
              'staff',
            );
            return true;
          } catch {
            await SecureStore.deleteItemAsync(
              STAFF_TOKEN_KEY,
            );
            setUser(null);
            return false;
          }
        };

      const tryCustomer =
        async () => {
          if (
            !savedCustomerToken
          ) {
            return false;
          }

          try {
            await loadCustomerSession(
              savedCustomerToken,
            );
            setSessionType(
              'customer',
            );
            return true;
          } catch {
            await SecureStore.deleteItemAsync(
              CUSTOMER_TOKEN_KEY,
            );
            setCustomer(null);
            setCustomerData(null);
            setCustomerToken('');
            return false;
          }
        };

      let restored = false;

      if (
        preferred ===
        'customer'
      ) {
        restored =
          await tryCustomer();

        if (!restored) {
          restored =
            await tryStaff();
        }
      } else {
        restored =
          await tryStaff();

        if (!restored) {
          restored =
            await tryCustomer();
        }
      }

      if (!restored) {
        setSessionType(
          null,
        );

        await SecureStore.deleteItemAsync(
          SESSION_TYPE_KEY,
        );
      }
    }

    restore()
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
      STAFF_TOKEN_KEY,
      response.data.token,
    );

    await SecureStore.setItemAsync(
      SESSION_TYPE_KEY,
      'staff',
    );

    const current =
      await refreshUser();

    setSessionType(
      'staff',
    );

    return current;
  }

  async function startCustomerAccess(
    phone,
    qrToken = '',
    channel = 'WHATSAPP',
  ) {
    return apiRequest(
      qrToken
        ? '/customer-portal/access/qr/start'
        : '/customer-portal/access/phone/start',
      {
        method: 'POST',
        body: qrToken
          ? {
              phone,
              qrToken,
              channel,
            }
          : {
              phone,
              channel,
            },
      },
    );
  }

  async function checkWhatsappAccess(
    challengeId,
  ) {
    const result =
      await apiRequest(
        '/customer-portal/access/whatsapp/status',
        {
          method: 'POST',
          body: {
            challengeId,
            client: 'MOBILE',
          },
        },
      );

    if (!result.confirmed) {
      return result;
    }

    await SecureStore.setItemAsync(
      CUSTOMER_TOKEN_KEY,
      result.token,
    );
    await SecureStore.setItemAsync(
      SESSION_TYPE_KEY,
      'customer',
    );

    const portalData =
      await loadCustomerSession(
        result.token,
      );

    setSessionType('customer');

    return {
      ...result,
      portalData,
    };
  }

  async function verifyCustomerAccess(
    challengeId,
    code,
  ) {
    const result =
      await apiRequest(
        '/customer-portal/access/verify',
        {
          method: 'POST',
          body: {
            challengeId,
            code,
            client: 'MOBILE',
          },
        },
      );

    await SecureStore.setItemAsync(
      CUSTOMER_TOKEN_KEY,
      result.token,
    );

    await SecureStore.setItemAsync(
      SESSION_TYPE_KEY,
      'customer',
    );

    const portalData =
      await loadCustomerSession(
        result.token,
      );

    setSessionType(
      'customer',
    );

    return portalData;
  }

  async function customerRequest(
    path,
    options = {},
  ) {
    const token =
      customerToken ||
      await SecureStore.getItemAsync(
        CUSTOMER_TOKEN_KEY,
      );

    if (!token) {
      throw new Error(
        'Müşteri oturumu bulunamadı.',
      );
    }

    return apiRequest(
      path,
      {
        ...options,
        token,
      },
    );
  }

  async function logout() {
    if (
      sessionType ===
      'customer'
    ) {
      await SecureStore.deleteItemAsync(
        CUSTOMER_TOKEN_KEY,
      );

      setCustomer(null);
      setCustomerData(null);
      setCustomerToken('');
    } else {
      await SecureStore.deleteItemAsync(
        STAFF_TOKEN_KEY,
      );

      setUser(null);
    }

    await SecureStore.deleteItemAsync(
      SESSION_TYPE_KEY,
    );

    setSessionType(null);
  }

  const value = useMemo(
    () => ({
      user,
      customer,
      customerData,
      customerToken,
      sessionType,
      loading,
      login,
      logout,
      refreshUser,
      refreshCustomer,
      startCustomerAccess,
      checkWhatsappAccess,
      verifyCustomerAccess,
      customerRequest,
    }),
    [
      user,
      customer,
      customerData,
      customerToken,
      sessionType,
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
