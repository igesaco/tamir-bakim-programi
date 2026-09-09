import {
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  useEffect,
  useState,
} from 'react';

import {
  useAuth,
} from '../auth/AuthContext';
import {
  Card,
  Empty,
  Loading,
  ScreenTitle,
} from '../components/UI';
import {
  colors,
  spacing,
} from '../theme';

const statusLabels = {
  APPOINTMENT: 'Randevu',
  ARRIVED: 'Araç Geldi',
  ACCEPTED: 'Araç Kabul Edildi',
  INSPECTION: 'Teknik İnceleme',
  QUOTE_WAITING: 'Fiyatlandırma Bekleniyor',
  APPROVED: 'İş Emri Onaylandı',
  IN_PROGRESS: 'Servis İşlemi Başladı',
  PART_WAITING: 'Parça Bekleniyor',
  QUALITY_CONTROL: 'Kalite Kontrol / Son Kontrol',
  READY: 'Teslimata Hazır',
  PAYMENT_WAITING: 'Ödeme Bekleniyor',
};

export default function CustomerHomeScreen({
  onOpenVehicles,
}) {
  const {
    customer,
    customerData,
    customerRequest,
  } = useAuth();

  const [vehicles, setVehicles] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    customerRequest(
      '/customer-portal/vehicles',
    )
      .then(setVehicles)
      .finally(() =>
        setLoading(false),
      );
  }, []);

  const serviceOrder =
    customerData
      ?.currentServiceOrder;

  return (
    <ScrollView
      contentContainerStyle={
        styles.content
      }
    >
      <ScreenTitle
        title={`Merhaba ${customer?.firstName || ''}`}
        subtitle="Araçlarınız ve bakım süreciniz tek ekranda."
      />

      <View style={styles.summaryRow}>
        <Card style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>
            Araçlarım
          </Text>

          <Text style={styles.summaryValue}>
            {vehicles.length}
          </Text>
        </Card>

        <Card style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>
            Servis Durumu
          </Text>

          <Text style={styles.summarySmall}>
            {serviceOrder
              ? statusLabels[
                  serviceOrder.status
                ] ||
                serviceOrder.status
              : 'Aktif servis yok'}
          </Text>
        </Card>
      </View>

      <Card style={styles.hero}>
        <Text style={styles.heroKicker}>
          DİJİTAL BAKIM TAKİBİ
        </Text>

        <Text style={styles.heroTitle}>
          Aracınızın geçmişi hep yanınızda
        </Text>

        <Text style={styles.heroText}>
          Bakım kayıtlarını, yaklaşan
          bakım tarihlerini ve servis
          durumunu uygulamadan takip edin.
        </Text>

        <Text
          style={styles.heroLink}
          onPress={
            onOpenVehicles
          }
        >
          Araçlarımı Gör →
        </Text>
      </Card>

      <Text style={styles.sectionTitle}>
        Son kayıtlı araç
      </Text>

      {loading ? (
        <Loading />
      ) : vehicles.length ? (
        <Card>
          <Text style={styles.plate}>
            {vehicles[0].plate}
          </Text>

          <Text style={styles.vehicle}>
            {vehicles[0].brand}{' '}
            {vehicles[0].model}
          </Text>

          <Text style={styles.km}>
            Son kayıtlı KM:{' '}
            {Number(
              vehicles[0].mileage ||
                0,
            ).toLocaleString(
              'tr-TR',
            )}
          </Text>
        </Card>
      ) : (
        <Empty text="Hesabınıza bağlı araç bulunmuyor." />
      )}
    </ScrollView>
  );
}

const styles =
  StyleSheet.create({
    content: {
      padding:
        spacing.md,
      paddingBottom: 110,
    },
    summaryRow: {
      flexDirection: 'row',
      gap: 10,
    },
    summaryCard: {
      flex: 1,
      minHeight: 104,
      justifyContent:
        'space-between',
    },
    summaryLabel: {
      color: colors.muted,
      fontSize: 10,
    },
    summaryValue: {
      color: colors.text,
      fontSize: 30,
      fontWeight: '950',
    },
    summarySmall: {
      color:
        colors.accent,
      fontSize: 13,
      lineHeight: 18,
      fontWeight: '900',
    },
    hero: {
      marginTop: 12,
      borderColor:
        '#55411d',
      backgroundColor:
        '#17150f',
    },
    heroKicker: {
      color:
        colors.accent,
      fontSize: 9,
      fontWeight: '900',
      letterSpacing: 1,
    },
    heroTitle: {
      marginTop: 7,
      color: colors.text,
      fontSize: 21,
      lineHeight: 26,
      fontWeight: '950',
    },
    heroText: {
      marginTop: 7,
      color: colors.muted,
      fontSize: 11,
      lineHeight: 18,
    },
    heroLink: {
      marginTop: 16,
      color:
        colors.accent,
      fontSize: 12,
      fontWeight: '900',
    },
    sectionTitle: {
      marginTop: 20,
      marginBottom: 8,
      color: colors.text,
      fontSize: 12,
      fontWeight: '900',
    },
    plate: {
      color: colors.text,
      fontSize: 22,
      fontWeight: '950',
    },
    vehicle: {
      marginTop: 3,
      color:
        colors.muted,
      fontSize: 11,
    },
    km: {
      marginTop: 12,
      color:
        colors.accent,
      fontSize: 11,
      fontWeight: '800',
    },
  });
