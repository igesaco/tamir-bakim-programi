import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
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
  QUOTE_WAITING: 'Teklif Bekleniyor',
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

  const [mileageInput, setMileageInput] =
    useState('');
  const [mileageBusy, setMileageBusy] =
    useState(false);
  const [mileageMessage, setMileageMessage] =
    useState('');

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

  const vehicle = vehicles[0];
  const mileageDue = vehicle &&
    (
      !vehicle.mileageUpdatedAt ||
      Date.now() - new Date(vehicle.mileageUpdatedAt).getTime() >=
        30 * 24 * 60 * 60 * 1000
    );

  async function updateMileage() {
    const mileage = Number(mileageInput);
    if (
      !Number.isInteger(mileage) ||
      mileage < Number(vehicle?.mileage || 0)
    ) {
      setMileageMessage(
        'Güncel kilometre mevcut kayıttan düşük olamaz.',
      );
      return;
    }

    setMileageBusy(true);
    try {
      const updated = await customerRequest(
        `/customer-portal/vehicles/${vehicle.id}/mileage`,
        { method: 'PATCH', body: { mileage } },
      );
      setVehicles(current =>
        current.map(item =>
          item.id === vehicle.id
            ? { ...item, ...updated }
            : item,
        ),
      );
      setMileageInput('');
      setMileageMessage(
        'Kilometre güncellendi. Bakım uyarıları yeniden hesaplandı.',
      );
    } catch (error) {
      setMileageMessage(
        error.message || 'Kilometre güncellenemedi.',
      );
    } finally {
      setMileageBusy(false);
    }
  }

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

          {mileageDue ? (
            <View style={styles.mileagePrompt}>
              <Text style={styles.mileagePromptTitle}>
                Aylık kilometre güncellemesi
              </Text>
              <Text style={styles.mileagePromptText}>
                Bakım zamanını doğru hesaplamak için güncel kilometreyi girin.
              </Text>
              <TextInput
                keyboardType="number-pad"
                placeholder="Güncel KM"
                placeholderTextColor={colors.muted}
                value={mileageInput}
                onChangeText={setMileageInput}
                style={styles.mileageInput}
              />
              <Text
                disabled={mileageBusy}
                onPress={updateMileage}
                style={styles.mileageButton}
              >
                {mileageBusy ? 'Kaydediliyor...' : 'Kilometreyi Kaydet'}
              </Text>
              {mileageMessage ? (
                <Text style={styles.mileagePromptText}>
                  {mileageMessage}
                </Text>
              ) : null}
            </View>
          ) : null}
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
    mileagePrompt: {
      marginTop: 14,
      paddingTop: 14,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    mileagePromptTitle: {
      color: colors.accent,
      fontWeight: '900',
    },
    mileagePromptText: {
      color: colors.muted,
      marginTop: 5,
      lineHeight: 18,
    },
    mileageInput: {
      marginTop: 10,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      color: colors.text,
      padding: 12,
    },
    mileageButton: {
      marginTop: 10,
      color: '#111',
      backgroundColor: colors.accent,
      padding: 12,
      borderRadius: 10,
      textAlign: 'center',
      fontWeight: '900',
    },
  });
