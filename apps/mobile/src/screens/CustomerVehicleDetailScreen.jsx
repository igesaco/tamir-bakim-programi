import {
  Image,
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
  mediaUrl,
  photoLabel,
} from '../media';
import {
  Button,
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
  ACCEPTED: 'Bakıma Alındı',
  INSPECTION: 'Kontrol Ediliyor',
  QUOTE_WAITING: 'Teklif Bekleniyor',
  APPROVED: 'Onaylandı',
  IN_PROGRESS: 'Bakım Devam Ediyor',
  PART_WAITING: 'Parça Bekleniyor',
  QUALITY_CONTROL: 'Kalite Kontrol',
  READY: 'Teslimata Hazır',
  PAYMENT_WAITING: 'Ödeme Bekleniyor',
  DELIVERED: 'Teslim Edildi',
};

export default function CustomerVehicleDetailScreen({
  vehicleId,
  onBack,
}) {
  const {
    customerRequest,
  } = useAuth();

  const [data, setData] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState('');

  useEffect(() => {
    customerRequest(
      `/customer-portal/vehicles/${vehicleId}`,
    )
      .then(setData)
      .catch((err) =>
        setError(
          err?.message ||
            'Araç bilgisi yüklenemedi.',
        ),
      )
      .finally(() =>
        setLoading(false),
      );
  }, [
    vehicleId,
  ]);

  if (loading) {
    return (
      <View style={styles.loadingPage}>
        <Loading label="Araç bilgileri yükleniyor..." />
      </View>
    );
  }

  if (
    error ||
    !data
  ) {
    return (
      <ScrollView
        contentContainerStyle={
          styles.content
        }
      >
        <Button
          title="← Araçlarıma Dön"
          tone="ghost"
          onPress={onBack}
        />

        <View style={styles.gap} />

        <Empty
          text={
            error ||
            'Araç bulunamadı.'
          }
        />
      </ScrollView>
    );
  }

  const {
    vehicle,
    currentServiceOrder,
    maintenancePlans = [],
    maintenanceHistory = [],
  } = data;

  return (
    <ScrollView
      contentContainerStyle={
        styles.content
      }
    >
      <Button
        title="← Araçlarıma Dön"
        tone="ghost"
        onPress={onBack}
      />

      <View style={styles.gap} />

      <ScreenTitle
        title={vehicle.plate}
        subtitle={`${vehicle.brand} ${vehicle.model}`}
      />

      <Card>
        <Text style={styles.label}>
          SON KAYITLI KM
        </Text>

        <Text style={styles.bigValue}>
          {Number(
            vehicle.mileage ||
              0,
          ).toLocaleString(
            'tr-TR',
          )}
        </Text>

        <Text style={styles.note}>
          Bu değer son servis kaydı veya
          sizin son kilometre
          bildiriminiz üzerinden
          güncellenecektir.
        </Text>
      </Card>

      {vehicle.media?.length ? (
        <>
          <Text style={styles.sectionTitle}>
            Araç Fotoğrafları
          </Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={
              styles.photoRow
            }
          >
            {vehicle.media.map(
              (media) => (
                <View
                  key={media.id}
                  style={styles.photoCard}
                >
                  <Image
                    source={{
                      uri:
                        mediaUrl(
                          media,
                        ),
                    }}
                    style={styles.photo}
                  />

                  <Text
                    numberOfLines={1}
                    style={styles.photoLabel}
                  >
                    {photoLabel(
                      media.type,
                    )}
                  </Text>
                </View>
              ),
            )}
          </ScrollView>
        </>
      ) : null}

      {currentServiceOrder ? (
        <Card style={styles.section}>
          <Text style={styles.label}>
            SERVİS DURUMU
          </Text>

          <Text style={styles.status}>
            {statusLabels[
              currentServiceOrder.status
            ] ||
              currentServiceOrder.status}
          </Text>

          <Text style={styles.note}>
            İş Emri:{' '}
            {
              currentServiceOrder.orderNumber
            }
          </Text>
        </Card>
      ) : null}

      <Text style={styles.sectionTitle}>
        Yaklaşan Bakımlar
      </Text>

      {maintenancePlans.length ? (
        <View style={styles.list}>
          {maintenancePlans.map(
            (plan) => (
              <Card key={plan.id}>
                <Text style={styles.itemTitle}>
                  {plan.title}
                </Text>

                <Text style={styles.itemText}>
                  {plan.nextDueDate
                    ? new Date(
                        plan.nextDueDate,
                      ).toLocaleDateString(
                        'tr-TR',
                      )
                    : 'Tarih yok'}
                  {' · '}
                  {plan.nextDueKm
                    ? `${Number(
                        plan.nextDueKm,
                      ).toLocaleString(
                        'tr-TR',
                      )} KM`
                    : 'KM yok'}
                </Text>
              </Card>
            ),
          )}
        </View>
      ) : (
        <Empty text="Aktif bakım planı bulunmuyor." />
      )}

      <Text style={styles.sectionTitle}>
        Bakım Geçmişi
      </Text>

      {maintenanceHistory.length ? (
        <View style={styles.list}>
          {maintenanceHistory.map(
            (record) => (
              <Card key={record.id}>
                <Text style={styles.itemTitle}>
                  {record.items
                    ?.map(
                      (item) =>
                        item.name,
                    )
                    .join(', ') ||
                    'Bakım Kaydı'}
                </Text>

                <Text style={styles.itemText}>
                  {new Date(
                    record.performedAt,
                  ).toLocaleDateString(
                    'tr-TR',
                  )}
                  {' · '}
                  {Number(
                    record.mileage ||
                      0,
                  ).toLocaleString(
                    'tr-TR',
                  )}{' '}
                  KM
                </Text>
              </Card>
            ),
          )}
        </View>
      ) : (
        <Empty text="Bakım geçmişi bulunmuyor." />
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
    loadingPage: {
      flex: 1,
      justifyContent:
        'center',
      backgroundColor:
        colors.bg,
    },
    gap: {
      height: 12,
    },
    section: {
      marginTop: 10,
    },
    label: {
      color: colors.muted,
      fontSize: 9,
      fontWeight: '800',
      letterSpacing: .8,
    },
    bigValue: {
      marginTop: 6,
      color:
        colors.accent,
      fontSize: 30,
      fontWeight: '950',
    },
    status: {
      marginTop: 6,
      color:
        colors.accent,
      fontSize: 18,
      fontWeight: '950',
    },
    note: {
      marginTop: 7,
      color: colors.muted,
      fontSize: 10,
      lineHeight: 16,
    },
    photoRow: {
      gap: 9,
      paddingRight: 4,
    },
    photoCard: {
      width: 164,
    },
    photo: {
      width: 164,
      height: 116,
      borderRadius: 12,
      backgroundColor:
        colors.panel2,
    },
    photoLabel: {
      marginTop: 5,
      color:
        colors.muted,
      fontSize: 9,
      fontWeight: '700',
    },
    sectionTitle: {
      marginTop: 20,
      marginBottom: 8,
      color: colors.text,
      fontSize: 12,
      fontWeight: '900',
    },
    list: {
      gap: 8,
    },
    itemTitle: {
      color: colors.text,
      fontSize: 12,
      fontWeight: '900',
    },
    itemText: {
      marginTop: 5,
      color: colors.muted,
      fontSize: 10,
      lineHeight: 16,
    },
  });
