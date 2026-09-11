import { useLiveRefresh } from '../hooks/useLiveRefresh';
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  useEffect,
  useMemo,
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
  radius,
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
  DELIVERED: 'Teslim Edildi',
};

const progressStatuses = [
  'ACCEPTED',
  'QUOTE_WAITING',
  'APPROVED',
  'IN_PROGRESS',
  'QUALITY_CONTROL',
  'READY',
];

function money(
  value,
) {
  return Number(
    value || 0,
  ).toLocaleString(
    'tr-TR',
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    },
  );
}

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
  const [quoteBusy, setQuoteBusy] =
    useState(false);

  useLiveRefresh(() => load(), !quoteBusy);

  async function load() {
    const result =
      await customerRequest(
        `/customer-portal/vehicles/${vehicleId}`,
      );

    setData(result);
  }

  async function approveQuote(
    quoteId,
  ) {
    setQuoteBusy(true);
    setError('');

    try {
      await customerRequest(
        `/customer-portal/quotes/${quoteId}/approve`,
        {
          method: 'POST',
        },
      );

      await load();
    } catch (err) {
      setError(
        err?.message ||
          'Teklif onaylanamadı.',
      );
    } finally {
      setQuoteBusy(false);
    }
  }

  useEffect(() => {
    load()
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

  const currentStatusIndex =
    useMemo(() => {
      const status =
        data?.currentServiceOrder
          ?.status;

      if (
        status ===
        'PART_WAITING'
      ) {
        return 3;
      }

      if (
        status ===
        'PAYMENT_WAITING'
      ) {
        return 5;
      }

      return progressStatuses.indexOf(
        status,
      );
    }, [
      data?.currentServiceOrder
        ?.status,
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
    payments = [],
    currentAccount,
  } = data;

  const currentQuote =
    currentServiceOrder
      ?.quotes?.[0];

  const serviceMedia =
    currentServiceOrder
      ?.media || [];

  const pendingPayments =
    payments.filter(
      (payment) =>
        [
          'PENDING',
          'PARTIAL',
        ].includes(
          payment.status,
        ),
    );

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
          Bu değer son kayıtlı servis
          kilometre bilgisidir.
        </Text>
      </Card>

      {currentServiceOrder ? (
        <>
          <Text style={styles.sectionTitle}>
            Canlı Servis Takibi
          </Text>

          <Card style={styles.serviceCard}>
            <View style={styles.statusTop}>
              <View style={styles.flex}>
                <Text style={styles.label}>
                  GÜNCEL DURUM
                </Text>

                <Text style={styles.status}>
                  {statusLabels[
                    currentServiceOrder.status
                  ] ||
                    currentServiceOrder.status}
                </Text>
              </View>

              <Text style={styles.orderNo}>
                {currentServiceOrder.orderNumber}
              </Text>
            </View>

            {currentServiceOrder.complaint ? (
              <Text style={styles.note}>
                Talebiniz: {' '}
                {currentServiceOrder.complaint}
              </Text>
            ) : null}

            <View style={styles.progressList}>
              {progressStatuses.map(
                (
                  status,
                  index,
                ) => {
                  const done =
                    index <=
                    currentStatusIndex;

                  return (
                    <View
                      key={status}
                      style={styles.progressRow}
                    >
                      <View
                        style={[
                          styles.progressDot,
                          done &&
                            styles.progressDotDone,
                        ]}
                      >
                        <Text style={styles.progressCheck}>
                          {done
                            ? '✓'
                            : ''}
                        </Text>
                      </View>

                      <Text
                        style={[
                          styles.progressText,
                          done &&
                            styles.progressTextDone,
                        ]}
                      >
                        {statusLabels[
                          status
                        ]}
                      </Text>
                    </View>
                  );
                },
              )}
            </View>

            {currentServiceOrder.status ===
            'PART_WAITING' ? (
              <View style={styles.warningBox}>
                <Text style={styles.warningTitle}>
                  Parça tedariki bekleniyor
                </Text>

                <Text style={styles.warningText}>
                  Servis işlemi gerekli
                  parça veya malzeme
                  tedarik edildiğinde
                  devam edecektir.
                </Text>
              </View>
            ) : null}
          </Card>

          <Text style={styles.sectionTitle}>
            Yapılan / Planlanan İşlemler
          </Text>

          {currentServiceOrder.items
            ?.length ? (
            <View style={styles.list}>
              {currentServiceOrder.items.map(
                (item) => (
                  <Card key={item.id}>
                    <View style={styles.taskRow}>
                      <View
                        style={[
                          styles.taskDot,
                          item.completed &&
                            styles.taskDotDone,
                        ]}
                      >
                        <Text style={styles.progressCheck}>
                          {item.completed
                            ? '✓'
                            : ''}
                        </Text>
                      </View>

                      <View style={styles.flex}>
                        <Text style={styles.itemTitle}>
                          {item.name}
                        </Text>

                        <Text style={styles.itemText}>
                          {item.completed
                            ? 'Tamamlandı'
                            : 'Bekliyor / işlemde'}
                        </Text>
                      </View>
                    </View>
                  </Card>
                ),
              )}
            </View>
          ) : (
            <Empty text="İşlem listesi henüz oluşturulmadı." />
          )}

          {currentQuote ? (
            <>
              <Text style={styles.sectionTitle}>
                Teklif / Proforma
              </Text>

              <Card>
                <View style={styles.statusTop}>
                  <View>
                    <Text style={styles.itemTitle}>
                      {currentQuote.quoteNumber}
                    </Text>

                    <Text style={styles.itemText}>
                      {currentQuote.status ===
                      'APPROVED'
                        ? 'Onaylandı'
                        : 'Teklif hazır'}
                    </Text>
                  </View>

                  <Text style={styles.quoteTotal}>
                    {money(
                      currentQuote.total,
                    )}{' '}
                    ₺
                  </Text>
                </View>

                {currentQuote.status ===
                'SENT' ? (
                  <View style={styles.quoteApproval}>
                    <Text style={styles.note}>
                      Bu teklif servis tarafından onayınıza sunuldu. Onay verdiğinizde iş emri işleme hazır hale gelir ve bekleyen ödeme kaydı oluşturulur.
                    </Text>

                    <Button
                      title={
                        quoteBusy
                          ? 'Onaylanıyor...'
                          : 'Teklifi Onayla'
                      }
                      disabled={
                        quoteBusy
                      }
                      onPress={() =>
                        approveQuote(
                          currentQuote.id,
                        )
                      }
                    />
                  </View>
                ) : null}

                {currentQuote.items?.map(
                  (item) => (
                    <View
                      key={item.id}
                      style={styles.quoteRow}
                    >
                      <Text style={styles.quoteName}>
                        {item.name}
                      </Text>

                      <Text style={styles.quotePrice}>
                        {money(
                          item.grossTotal,
                        )}{' '}
                        ₺
                      </Text>
                    </View>
                  ),
                )}
              </Card>
            </>
          ) : null}

          {serviceMedia.length ? (
            <>
              <Text style={styles.sectionTitle}>
                Servis Fotoğrafları
              </Text>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={
                  styles.photoRow
                }
              >
                {serviceMedia.map(
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
        </>
      ) : null}

      {pendingPayments.length ||
      Number(
        currentAccount?.openBalance ||
          0,
      ) > 0 ? (
        <>
          <Text style={styles.sectionTitle}>
            Ödeme Durumu
          </Text>

          <Card style={styles.paymentCard}>
            <Text style={styles.label}>
              BEKLEYEN TUTAR
            </Text>

            <Text style={styles.paymentValue}>
              {money(
                currentAccount?.openBalance,
              )}{' '}
              ₺
            </Text>

            <Text style={styles.note}>
              Ödeme bilgisi servis
              tarafından oluşturulan
              cari/tahsilat kaydına
              göre gösterilir.
            </Text>
          </Card>
        </>
      ) : null}

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
    flex: {
      flex: 1,
    },
    gap: {
      height: 12,
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
      fontSize: 17,
      fontWeight: '950',
    },
    note: {
      marginTop: 7,
      color: colors.muted,
      fontSize: 10,
      lineHeight: 16,
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
      marginTop: 4,
      color: colors.muted,
      fontSize: 9,
      lineHeight: 14,
    },
    serviceCard: {
      borderColor:
        '#5f471a',
    },
    statusTop: {
      flexDirection: 'row',
      justifyContent:
        'space-between',
      gap: 12,
    },
    orderNo: {
      color: colors.muted,
      fontSize: 8,
      fontWeight: '800',
    },
    progressList: {
      marginTop: 18,
      gap: 9,
    },
    progressRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 9,
    },
    progressDot: {
      width: 24,
      height: 24,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor:
        colors.panel2,
    },
    progressDotDone: {
      borderColor:
        colors.success,
      backgroundColor:
        '#173323',
    },
    progressCheck: {
      color: colors.success,
      fontSize: 12,
      fontWeight: '950',
    },
    progressText: {
      color: colors.muted,
      fontSize: 10,
      fontWeight: '700',
    },
    progressTextDone: {
      color: colors.text,
    },
    warningBox: {
      marginTop: 14,
      padding: 11,
      borderWidth: 1,
      borderColor:
        '#6c5221',
      borderRadius:
        radius.sm,
      backgroundColor:
        '#1d180d',
    },
    warningTitle: {
      color:
        colors.warning,
      fontSize: 10,
      fontWeight: '900',
    },
    warningText: {
      marginTop: 4,
      color: colors.muted,
      fontSize: 9,
      lineHeight: 14,
    },
    taskRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    taskDot: {
      width: 25,
      height: 25,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 7,
      alignItems: 'center',
      justifyContent: 'center',
    },
    taskDotDone: {
      borderColor:
        colors.success,
      backgroundColor:
        '#173323',
    },
    quoteTotal: {
      color:
        colors.accent,
      fontSize: 18,
      fontWeight: '950',
    },
    quoteApproval: {
      marginTop: 14,
      gap: 10,
    },
    quoteRow: {
      marginTop: 10,
      paddingTop: 10,
      flexDirection: 'row',
      justifyContent:
        'space-between',
      gap: 10,
      borderTopWidth: 1,
      borderTopColor:
        colors.border,
    },
    quoteName: {
      flex: 1,
      color: colors.text,
      fontSize: 9,
    },
    quotePrice: {
      color: colors.text,
      fontSize: 9,
      fontWeight: '800',
    },
    paymentCard: {
      borderColor:
        '#664d18',
      backgroundColor:
        '#19150d',
    },
    paymentValue: {
      marginTop: 6,
      color:
        colors.accent,
      fontSize: 26,
      fontWeight: '950',
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
  });
