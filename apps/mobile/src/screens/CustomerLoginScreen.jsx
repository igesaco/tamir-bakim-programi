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
import {
  useAuth,
} from '../auth/AuthContext';
import BrandLogo from '../components/BrandLogo';

import {
  colors,
  radius,
  spacing,
} from '../theme';

export default function CustomerLoginScreen({
  qrToken = '',
  onBack,
}) {
  const {
    startCustomerAccess,
    verifyCustomerAccess,
  } = useAuth();

  const [step, setStep] =
    useState('phone');

  const [phone, setPhone] =
    useState('');

  const [challenge, setChallenge] =
    useState(null);

  const [code, setCode] =
    useState('');

  const [busy, setBusy] =
    useState(false);

  const [error, setError] =
    useState('');

  async function sendCode() {
    setBusy(true);
    setError('');

    try {
      const result =
        await startCustomerAccess(
          phone,
          qrToken,
        );

      setChallenge(
        result,
      );
      setStep('otp');
    } catch (err) {
      setError(
        err?.message ||
          'Doğrulama başlatılamadı.',
      );
    } finally {
      setBusy(false);
    }
  }

  async function verifyCode() {
    setBusy(true);
    setError('');

    try {
      await verifyCustomerAccess(
        challenge.challengeId,
        code,
      );
    } catch (err) {
      setError(
        err?.message ||
          'Doğrulama yapılamadı.',
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
      <BrandLogo size={66} />

      <Text style={styles.kicker}>
        MÜŞTERİ GİRİŞİ
      </Text>

      <Text style={styles.title}>
        {step === 'phone'
          ? 'Aracınıza bağlanın'
          : 'SMS kodunu girin'}
      </Text>

      <Text style={styles.subtitle}>
        {step === 'phone'
          ? qrToken
            ? 'Bakım kartındaki aracın sahibi olduğunuzu servis kaydındaki telefon numaranızla doğrulayın.'
            : 'Servis kaydında bulunan telefon numaranızı girin. Bağlı araçlarınız otomatik olarak hesabınızda görünür.'
          : `Kod ${challenge?.maskedPhone || 'telefonunuza'} gönderildi.`}
      </Text>

      <View style={styles.card}>
        {step === 'phone' ? (
          <>
            <Field
              label="Telefon Numarası"
              placeholder="05xx xxx xx xx"
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
            />

            <Message text={error} />

            <Button
              title={
                busy
                  ? 'Kod gönderiliyor...'
                  : 'SMS Kodu Gönder'
              }
              disabled={
                busy ||
                phone.replace(
                  /\D/g,
                  '',
                ).length < 10
              }
              onPress={sendCode}
            />
          </>
        ) : (
          <>
            {challenge?.developmentCode ? (
              <View style={styles.devCode}>
                <Text style={styles.devCodeLabel}>
                  Local test kodu
                </Text>

                <Text style={styles.devCodeValue}>
                  {
                    challenge.developmentCode
                  }
                </Text>
              </View>
            ) : null}

            <Field
              label="6 Haneli Kod"
              keyboardType="number-pad"
              maxLength={6}
              value={code}
              onChangeText={(value) =>
                setCode(
                  value.replace(
                    /\D/g,
                    '',
                  ),
                )
              }
            />

            <Message text={error} />

            <Button
              title={
                busy
                  ? 'Doğrulanıyor...'
                  : 'Giriş Yap'
              }
              disabled={
                busy ||
                code.length !== 6
              }
              onPress={verifyCode}
            />

            <View style={styles.gap} />

            <Button
              title="Telefonu Değiştir"
              tone="ghost"
              onPress={() => {
                setStep('phone');
                setCode('');
                setError('');
              }}
            />
          </>
        )}
      </View>

      <View style={styles.back}>
        <Button
          title="← Giriş Türüne Dön"
          tone="ghost"
          onPress={onBack}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles =
  StyleSheet.create({
    page: {
      flex: 1,
      padding:
        spacing.lg,
      justifyContent:
        'center',
      backgroundColor:
        colors.bg,
    },
    kicker: {
      marginTop: 18,
      color: colors.accent,
      fontSize: 10,
      fontWeight: '900',
      letterSpacing: 1.4,
    },
    title: {
      marginTop: 6,
      color: colors.text,
      fontSize: 31,
      fontWeight: '950',
    },
    subtitle: {
      marginTop: 8,
      marginBottom: 22,
      maxWidth: 380,
      color: colors.muted,
      fontSize: 12,
      lineHeight: 19,
    },
    card: {
      padding:
        spacing.md,
      borderWidth: 1,
      borderColor:
        colors.border,
      borderRadius:
        radius.lg,
      backgroundColor:
        colors.panel,
    },
    devCode: {
      marginBottom: 12,
      padding: 12,
      borderWidth: 1,
      borderColor:
        '#5a451e',
      borderRadius:
        radius.sm,
      backgroundColor:
        colors.accentSoft,
    },
    devCodeLabel: {
      color: colors.muted,
      fontSize: 9,
      fontWeight: '700',
    },
    devCodeValue: {
      marginTop: 4,
      color:
        colors.accent,
      fontSize: 22,
      fontWeight: '950',
      letterSpacing: 2,
    },
    gap: {
      height: 8,
    },
    back: {
      marginTop: 10,
    },
  });
