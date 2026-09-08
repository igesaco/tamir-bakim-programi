import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  useState,
} from 'react';

import {
  Button,
  Field,
  Message,
} from '../components/UI';
import { useAuth } from '../auth/AuthContext';
import {
  colors,
  radius,
  spacing,
} from '../theme';

export default function LoginScreen({
  onBack,
}) {
  const {
    login,
  } = useAuth();

  const [email, setEmail] =
    useState('');

  const [password, setPassword] =
    useState('');

  const [busy, setBusy] =
    useState(false);

  const [error, setError] =
    useState('');

  async function submit() {
    setBusy(true);
    setError('');

    try {
      await login(
        email.trim(),
        password,
      );
    } catch (err) {
      const detail =
        err?.response?.data?.message;

      setError(
        Array.isArray(detail)
          ? detail.join(', ')
          : detail ||
              'Giriş yapılamadı. API bağlantısını ve bilgilerinizi kontrol edin.',
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={
        Platform.OS === 'ios'
          ? 'padding'
          : undefined
      }
      style={styles.page}
    >
      <View style={styles.logo}>
        <Text style={styles.logoText}>
          TB
        </Text>
      </View>

      <Text style={styles.kicker}>
        İGESA · TAMİR BAKIM
      </Text>

      <Text style={styles.title}>
        Mobil Servis
      </Text>

      <Text style={styles.subtitle}>
        Yetkinize göre müşteri,
        iş emri, stok ve kasa
        işlemlerine erişin.
      </Text>

      <View style={styles.card}>
        <Field
          label="E-posta"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />

        <Field
          label="Şifre"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <Message text={error} />

        <Button
          title={
            busy
              ? 'Giriş yapılıyor...'
              : 'Giriş Yap'
          }
          disabled={
            busy ||
            !email ||
            !password
          }
          onPress={submit}
        />
      </View>

      {onBack ? (
        <View style={styles.back}>
          <Button
            title="← Giriş Türüne Dön"
            tone="ghost"
            onPress={onBack}
          />
        </View>
      ) : null}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    padding: spacing.lg,
    justifyContent: 'center',
    backgroundColor: colors.bg,
  },
  logo: {
    width: 66,
    height: 66,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: colors.accent,
  },
  logoText: {
    color: '#171108',
    fontSize: 21,
    fontWeight: '950',
  },
  kicker: {
    marginTop: 20,
    color: colors.accent,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  title: {
    marginTop: 6,
    color: colors.text,
    fontSize: 34,
    fontWeight: '950',
  },
  subtitle: {
    marginTop: 8,
    marginBottom: 24,
    maxWidth: 340,
    color: colors.muted,
    fontSize: 13,
    lineHeight: 20,
  },
  card: {
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    backgroundColor: colors.panel,
  },
  back: {
    marginTop: 10,
  },
});
