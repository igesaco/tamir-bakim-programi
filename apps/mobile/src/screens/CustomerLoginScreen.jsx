import {
  KeyboardAvoidingView,
  Linking,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  useEffect,
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
    checkWhatsappAccess,
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

  const [deliveryChannel, setDeliveryChannel] =
    useState('WHATSAPP');

  const [busy, setBusy] =
    useState(false);

  const [error, setError] =
    useState('');

  async function sendCode(
    channel,
  ) {
    setBusy(true);
    setError('');
    setDeliveryChannel(channel);

    try {
      const result =
        await startCustomerAccess(
          phone,
          qrToken,
          channel,
        );

      setChallenge(
        result,
      );
      if (
        result.deliveryChannel ===
          'WHATSAPP' &&
        !result.developmentCode
      ) {
        setStep('whatsapp');
        await Linking.openURL(
          result.whatsappUrl,
        );
      } else {
        setStep('otp');
      }
    } catch (err) {
      setError(
        err?.message ||
          'Doğrulama başlatılamadı.',
      );
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    if (
      step !== 'whatsapp' ||
      !challenge?.challengeId
    ) {
      return undefined;
    }

    let stopped = false;
    let checking = false;
    let completed = false;

    const check = async () => {
      if (
        stopped ||
        checking ||
        completed
      ) {
        return;
      }

      checking = true;
      try {
        const result =
          await checkWhatsappAccess(
            challenge.challengeId,
          );

        if (
          !stopped &&
          result.confirmed
        ) {
          completed = true;
          setStep('complete');
        }
      } catch (err) {
        if (!stopped) {
          setError(
            err?.message ||
              'WhatsApp doğrulaması kontrol edilemedi.',
          );
        }
      } finally {
        checking = false;
      }
    };

    check();
    const timer = setInterval(
      check,
      challenge.pollingIntervalMs ||
        2000,
    );

    return () => {
      stopped = true;
      clearInterval(timer);
    };
  }, [
    step,
    challenge,
    checkWhatsappAccess,
  ]);

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
          : step === 'whatsapp'
            ? 'Mesajı gönderin'
            : 'Doğrulama kodunu girin'}
      </Text>

      <Text style={styles.subtitle}>
        {step === 'phone'
          ? qrToken
            ? 'Bakım kartındaki aracın sahibi olduğunuzu servis kaydındaki telefon numaranızla doğrulayın.'
            : 'Servis kaydında bulunan telefon numaranızı girin. Bağlı araçlarınız otomatik olarak hesabınızda görünür.'
          : step === 'whatsapp'
            ? 'Açılan WhatsApp ekranındaki hazır mesajı değiştirmeden gönderin. Uygulama doğrulamayı otomatik algılar.'
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
                  ? 'Hazırlanıyor...'
                  : 'WhatsApp ile Ücretsiz Doğrula'
              }
              disabled={
                busy ||
                phone.replace(
                  /\D/g,
                  '',
                ).length < 10
              }
              onPress={() =>
                sendCode('WHATSAPP')
              }
            />

            <View style={styles.gap} />

            <Button
              title="SMS Kodu Gönder"
              tone="ghost"
              disabled={
                busy ||
                phone.replace(
                  /\D/g,
                  '',
                ).length < 10
              }
              onPress={() =>
                sendCode('SMS')
              }
            />
          </>
        ) : step === 'whatsapp' ? (
          <>
            <Button
              title="WhatsApp'ı Aç"
              onPress={() =>
                Linking.openURL(
                  challenge.whatsappUrl,
                )
              }
            />

            <View style={styles.gap} />

            <Message text={error} />

            <Text style={styles.waitingText}>
              Mesajınız bekleniyor…
            </Text>
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
    waitingText: {
      marginTop: 12,
      color: colors.muted,
      fontSize: 12,
      textAlign: 'center',
    },
    back: {
      marginTop: 10,
    },
  });
