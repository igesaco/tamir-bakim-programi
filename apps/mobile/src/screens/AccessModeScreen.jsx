import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import BrandLogo from '../components/BrandLogo';

import {
  colors,
  radius,
  spacing,
} from '../theme';

export default function AccessModeScreen({
  onSelect,
}) {
  return (
    <View style={styles.page}>
      <BrandLogo size={66} />

      <Text style={styles.kicker}>
        TAMİR BAKIM
      </Text>

      <Text style={styles.title}>
        Nasıl devam etmek istersiniz?
      </Text>

      <Text style={styles.subtitle}>
        Müşteriler araçlarını ve bakım
        süreçlerini takip eder. Personel ise
        servis operasyonlarını yönetir.
      </Text>

      <View style={styles.cards}>
        <Pressable
          style={({ pressed }) => [
            styles.card,
            styles.customerCard,
            pressed &&
              styles.pressed,
          ]}
          onPress={() =>
            onSelect('customer')
          }
        >
          <View style={styles.cardIcon}>
            <Text style={styles.cardIconText}>
              A
            </Text>
          </View>

          <View style={styles.cardCopy}>
            <Text style={styles.cardTitle}>
              Müşteri Girişi
            </Text>

            <Text style={styles.cardText}>
              Araçlarım, bakım geçmişi,
              servis durumu ve bildirimler.
            </Text>
          </View>

          <Text style={styles.arrow}>
            →
          </Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.card,
            pressed &&
              styles.pressed,
          ]}
          onPress={() =>
            onSelect('staff')
          }
        >
          <View style={styles.cardIcon}>
            <Text style={styles.cardIconText}>
              P
            </Text>
          </View>

          <View style={styles.cardCopy}>
            <Text style={styles.cardTitle}>
              Personel Girişi
            </Text>

            <Text style={styles.cardText}>
              İş emirleri, araç kabul,
              stok, kasa ve servis yönetimi.
            </Text>
          </View>

          <Text style={styles.arrow}>
            →
          </Text>
        </Pressable>
      </View>
    </View>
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
      marginTop: 20,
      color: colors.accent,
      fontSize: 10,
      fontWeight: '900',
      letterSpacing: 1.5,
    },
    title: {
      marginTop: 7,
      maxWidth: 360,
      color: colors.text,
      fontSize: 31,
      lineHeight: 37,
      fontWeight: '950',
    },
    subtitle: {
      marginTop: 9,
      maxWidth: 390,
      color: colors.muted,
      fontSize: 13,
      lineHeight: 20,
    },
    cards: {
      marginTop: 26,
      gap: 12,
    },
    card: {
      minHeight: 104,
      padding: 16,
      flexDirection:
        'row',
      alignItems:
        'center',
      gap: 13,
      borderWidth: 1,
      borderColor:
        colors.border,
      borderRadius:
        radius.lg,
      backgroundColor:
        colors.panel,
    },
    customerCard: {
      borderColor:
        '#55411d',
      backgroundColor:
        '#17150f',
    },
    pressed: {
      opacity: .8,
    },
    cardIcon: {
      width: 48,
      height: 48,
      alignItems:
        'center',
      justifyContent:
        'center',
      borderRadius: 14,
      backgroundColor:
        colors.accentSoft,
    },
    cardIconText: {
      color:
        colors.accent,
      fontSize: 16,
      fontWeight: '950',
    },
    cardCopy: {
      flex: 1,
    },
    cardTitle: {
      color: colors.text,
      fontSize: 16,
      fontWeight: '900',
    },
    cardText: {
      marginTop: 5,
      color:
        colors.muted,
      fontSize: 11,
      lineHeight: 17,
    },
    arrow: {
      color:
        colors.accent,
      fontSize: 22,
      fontWeight: '900',
    },
  });
