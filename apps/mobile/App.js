import {
  Linking,
  StyleSheet,
  View,
} from 'react-native';
import {
  useEffect,
  useState,
} from 'react';
import { StatusBar } from 'expo-status-bar';

import {
  AuthProvider,
  useAuth,
} from './src/auth/AuthContext';
import AppShell from './src/AppShell';
import CustomerAppShell from './src/CustomerAppShell';
import AccessModeScreen from './src/screens/AccessModeScreen';
import CustomerLoginScreen from './src/screens/CustomerLoginScreen';
import LoginScreen from './src/screens/LoginScreen';
import { Loading } from './src/components/UI';
import { colors } from './src/theme';

function qrFromUrl(url) {
  if (!url) {
    return '';
  }

  const match =
    url.match(
      /[?&]qr=([^&]+)/,
    );

  if (!match?.[1]) {
    return '';
  }

  try {
    return decodeURIComponent(
      match[1],
    );
  } catch {
    return match[1];
  }
}

function Root() {
  const {
    user,
    customer,
    sessionType,
    loading,
  } = useAuth();

  const [
    entryMode,
    setEntryMode,
  ] = useState(null);

  const [
    qrToken,
    setQrToken,
  ] = useState('');

  useEffect(() => {
    function handleUrl(url) {
      const qr =
        qrFromUrl(
          url,
        );

      if (!qr) {
        return;
      }

      setQrToken(
        qr,
      );

      if (!sessionType) {
        setEntryMode(
          'customer',
        );
      }
    }

    Linking.getInitialURL()
      .then(handleUrl);

    const subscription =
      Linking.addEventListener(
        'url',
        (event) =>
          handleUrl(
            event.url,
          ),
      );

    return () =>
      subscription.remove();
  }, [
    sessionType,
  ]);

  if (loading) {
    return (
      <View style={styles.page}>
        <Loading label="Oturum kontrol ediliyor..." />
      </View>
    );
  }

  if (
    sessionType ===
      'staff' &&
    user
  ) {
    return <AppShell />;
  }

  if (
    sessionType ===
      'customer' &&
    customer
  ) {
    return (
      <CustomerAppShell
        openInitialVehicle={
          Boolean(qrToken)
        }
      />
    );
  }

  if (
    entryMode ===
    'staff'
  ) {
    return (
      <LoginScreen
        onBack={() =>
          setEntryMode(
            null,
          )
        }
      />
    );
  }

  if (
    entryMode ===
    'customer'
  ) {
    return (
      <CustomerLoginScreen
        qrToken={qrToken}
        onBack={() => {
          setEntryMode(
            null,
          );
          setQrToken('');
        }}
      />
    );
  }

  return (
    <AccessModeScreen
      onSelect={
        setEntryMode
      }
    />
  );
}

export default function App() {
  return (
    <AuthProvider>
      <StatusBar style="light" />
      <Root />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: colors.bg,
  },
});
