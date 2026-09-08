import {
  StyleSheet,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';

import {
  AuthProvider,
  useAuth,
} from './src/auth/AuthContext';
import AppShell from './src/AppShell';
import LoginScreen from './src/screens/LoginScreen';
import { Loading } from './src/components/UI';
import { colors } from './src/theme';

function Root() {
  const {
    user,
    loading,
  } = useAuth();

  if (loading) {
    return (
      <View style={styles.page}>
        <Loading label="Oturum kontrol ediliyor..." />
      </View>
    );
  }

  return user
    ? <AppShell />
    : <LoginScreen />;
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
