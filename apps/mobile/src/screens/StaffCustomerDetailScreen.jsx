import {
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  useEffect,
  useState,
} from 'react';

import api from '../api/client';
import {
  mediaUrl,
  photoLabel,
} from '../media';
import {
  Button,
  Card,
  Empty,
  Loading,
  Message,
  ScreenTitle,
} from '../components/UI';
import {
  colors,
  radius,
  spacing,
} from '../theme';

const statusLabels = {
  APPOINTMENT: 'Randevu',
  ARRIVED: 'Araç Geldi',
  ACCEPTED: 'Kabul Edildi',
  INSPECTION: 'Kontrol',
  QUOTE_WAITING: 'Teklif Bekleniyor',
  APPROVED: 'Onaylandı',
  IN_PROGRESS: 'İşlemde',
  PART_WAITING: 'Parça Bekleniyor',
  QUALITY_CONTROL: 'Kalite Kontrol',
  READY: 'Hazır',
  PAYMENT_WAITING: 'Ödeme Bekleniyor',
  DELIVERED: 'Teslim Edildi',
  CANCELLED: 'İptal',
};

function apiMessage(
  err,
  fallback,
) {
  const detail =
    err?.response?.data?.message;

  return Array.isArray(
    detail,
  )
    ? detail.join(', ')
    : detail || fallback;
}

export default function StaffCustomerDetailScreen({
  customerId,
  onBack,
  onStartIntake,
}) {
  const [customer, setCustomer] =
    useState(null);
  const [loading, setLoading] =
    useState(true);
  const [refreshing, setRefreshing] =
    useState(false);
  const [error, setError] =
    useState('');

  async function load() {
    setError('');

    const response =
      await api.get(
        `/customers/${customerId}`,
      );

    setCustomer(
      response.data,
    );
  }

  useEffect(() => {
    load()
      .catch((err) =>
        setError(
          apiMessage(
            err,
            'Müşteri bilgileri yüklenemedi.',
          ),
        ),
      )
      .finally(() =>
        setLoading(false),
      );
  }, [
    customerId,
  ]);

  async function refresh() {
    setRefreshing(true);

    try {
      await load();
    } catch (err) {
      setError(
        apiMessage(
          err,
          'Müşteri bilgileri yenilenemedi.',
        ),
      );
    } finally {
      setRefreshing(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.loadingPage}>
        <Loading label="Müşteri paneli yükleniyor..." />
      </View>
    );
  }

  return (
    <ScrollView
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={refresh}
          tintColor={
            colors.accent
          }
        />
      }
      contentContainerStyle={
        styles.content
      }
    >
      <Button
        title="← Müşterilere Dön"
        tone="ghost"
        onPress={onBack}
      />

      <View style={styles.gap} />

      <Message text={error} />

      {!customer ? (
        <Empty text="Müşteri bulunamadı." />
      ) : (
        <>
          <ScreenTitle
            title={
              `${customer.firstName || ''} ${customer.lastName || ''}`.trim()
            }
            subtitle="Müşteri, araç, fotoğraf ve son servis kayıtları"
          />

          <Card style={styles.contactCard}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {customer.firstName
                  ?.charAt(0)
                  ?.toLocaleUpperCase(
                    'tr-TR',
                  ) ||
                  '?'}
              </Text>
            </View>

            <View style={styles.contactCopy}>
              <Text style={styles.contactPrimary}>
                {customer.phone ||
                  'Telefon yok'}
              </Text>

              <Text style={styles.contactSecondary}>
                {customer.email ||
                  'E-posta yok'}
              </Text>

              <Text style={styles.contactSecondary}>
                {customer.branch?.name ||
                  'Şube bilgisi yok'}
              </Text>
            </View>
          </Card>

          <View style={styles.intakeButton}>
            <Button
              title="+ Yeni Araç / Ön Kabul Başlat"
              onPress={() =>
                onStartIntake?.({
                  customerId:
                    customer.id,
                })
              }
            />
          </View>

          <Text style={styles.sectionTitle}>
            Araçlar
          </Text>

          {customer.vehicles?.length ? (
            <View style={styles.list}>
              {customer.vehicles.map(
                (vehicle) => (
                  <Card
                    key={vehicle.id}
                    style={styles.vehicleCard}
                  >
                    <View style={styles.vehicleHead}>
                      <View style={styles.flex}>
                        <Text style={styles.plate}>
                          {vehicle.plate}
                        </Text>

                        <Text style={styles.vehicleName}>
                          {vehicle.brand}{' '}
                          {vehicle.model}
                          {vehicle.modelYear
                            ? ` · ${vehicle.modelYear}`
                            : ''}
                        </Text>
                      </View>

                      <View style={styles.kmBox}>
                        <Text style={styles.kmLabel}>
                          SON KM
                        </Text>

                        <Text style={styles.kmValue}>
                          {Number(
                            vehicle.mileage ||
                              0,
                          ).toLocaleString(
                            'tr-TR',
                          )}
                        </Text>
                      </View>
                    </View>

                    {vehicle.media?.length ? (
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
                              style={styles.photoWrap}
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
                    ) : (
                      <Text style={styles.noPhoto}>
                        Bu araç için henüz fotoğraf yok.
                      </Text>
                    )}

                    {vehicle.serviceOrders?.length ? (
                      <View style={styles.orders}>
                        <Text style={styles.ordersTitle}>
                          Son servis kayıtları
                        </Text>

                        {vehicle.serviceOrders
                          .slice(
                            0,
                            3,
                          )
                          .map(
                            (order) => (
                              <View
                                key={
                                  order.id
                                }
                                style={styles.orderRow}
                              >
                                <View style={styles.flex}>
                                  <Text style={styles.orderNumber}>
                                    {order.orderNumber}
                                  </Text>

                                  <Text
                                    numberOfLines={1}
                                    style={styles.orderComplaint}
                                  >
                                    {order.complaint ||
                                      'Açıklama yok'}
                                  </Text>
                                </View>

                                <Text style={styles.orderStatus}>
                                  {statusLabels[
                                    order.status
                                  ] ||
                                    order.status}
                                </Text>
                              </View>
                            ),
                          )}
                      </View>
                    ) : null}

                    <Pressable
                      onPress={() =>
                        onStartIntake?.({
                          customerId:
                            customer.id,
                          vehicleId:
                            vehicle.id,
                        })
                      }
                      style={styles.quickIntake}
                    >
                      <Text style={styles.quickIntakeText}>
                        Bu Araçla Kabul Başlat →
                      </Text>
                    </Pressable>
                  </Card>
                ),
              )}
            </View>
          ) : (
            <Empty text="Bu müşteriye bağlı araç yok. Ön kabul ekranından yeni araç ekleyebilirsiniz." />
          )}
        </>
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
    contactCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    avatar: {
      width: 52,
      height: 52,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius:
        radius.md,
      backgroundColor:
        colors.accentSoft,
    },
    avatarText: {
      color:
        colors.accent,
      fontSize: 20,
      fontWeight: '950',
    },
    contactCopy: {
      flex: 1,
    },
    contactPrimary: {
      color:
        colors.text,
      fontSize: 13,
      fontWeight: '900',
    },
    contactSecondary: {
      marginTop: 4,
      color:
        colors.muted,
      fontSize: 10,
    },
    intakeButton: {
      marginTop: 10,
    },
    sectionTitle: {
      marginTop: 20,
      marginBottom: 8,
      color:
        colors.text,
      fontSize: 13,
      fontWeight: '900',
    },
    list: {
      gap: 10,
    },
    vehicleCard: {
      gap: 10,
    },
    vehicleHead: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 10,
    },
    flex: {
      flex: 1,
    },
    plate: {
      color:
        colors.text,
      fontSize: 19,
      fontWeight: '950',
    },
    vehicleName: {
      marginTop: 4,
      color:
        colors.muted,
      fontSize: 10,
    },
    kmBox: {
      alignItems: 'flex-end',
    },
    kmLabel: {
      color:
        colors.muted,
      fontSize: 7,
      fontWeight: '800',
    },
    kmValue: {
      marginTop: 3,
      color:
        colors.accent,
      fontSize: 13,
      fontWeight: '900',
    },
    photoRow: {
      gap: 8,
    },
    photoWrap: {
      width: 112,
    },
    photo: {
      width: 112,
      height: 82,
      borderRadius: 10,
      backgroundColor:
        colors.panel2,
    },
    photoLabel: {
      marginTop: 4,
      color:
        colors.muted,
      fontSize: 8,
    },
    noPhoto: {
      paddingVertical: 8,
      color:
        colors.muted,
      fontSize: 9,
    },
    orders: {
      gap: 6,
    },
    ordersTitle: {
      color:
        colors.text,
      fontSize: 9,
      fontWeight: '900',
    },
    orderRow: {
      paddingTop: 7,
      flexDirection: 'row',
      gap: 8,
      borderTopWidth: 1,
      borderTopColor:
        colors.border,
    },
    orderNumber: {
      color:
        colors.text,
      fontSize: 9,
      fontWeight: '800',
    },
    orderComplaint: {
      marginTop: 2,
      color:
        colors.muted,
      fontSize: 8,
    },
    orderStatus: {
      color:
        colors.accent,
      fontSize: 8,
      fontWeight: '800',
    },
    quickIntake: {
      marginTop: 2,
      paddingVertical: 10,
      alignItems: 'center',
      borderWidth: 1,
      borderColor:
        '#644815',
      borderRadius: 10,
      backgroundColor:
        colors.accentSoft,
    },
    quickIntakeText: {
      color:
        colors.accent,
      fontSize: 10,
      fontWeight: '900',
    },
  });
