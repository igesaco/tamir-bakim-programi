import {
  Image,
  Modal,
  Pressable,
  RefreshControl,
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
import * as ImagePicker from 'expo-image-picker';

import api from '../api/client';
import {
  mediaUrl,
  photoLabel,
} from '../media';
import { useAuth } from '../auth/AuthContext';
import {
  canUse,
  hasPermission,
} from '../permissions';
import {
  managerStatuses,
  serviceStatusLabels,
  technicianStatuses,
} from '../status';
import {
  Button,
  Card,
  Empty,
  Field,
  Message,
  ScreenTitle,
} from '../components/UI';
import {
  colors,
  radius,
  spacing,
} from '../theme';

const photoTypes = [
  ['BEFORE', 'Öncesi'],
  ['AFTER', 'Sonrası'],
  ['DAMAGE', 'Hasar'],
  ['PART', 'Parça'],
  ['ENGINE', 'Motor'],
  ['ODOMETER', 'Kilometre'],
];

function apiMessage(
  err,
  fallback,
) {
  const detail =
    err?.response?.data?.message;

  return Array.isArray(detail)
    ? detail.join(', ')
    : detail || fallback;
}

export default function WorkOrdersScreen() {
  const { user } = useAuth();

  const [orders, setOrders] =
    useState([]);
  const [search, setSearch] =
    useState('');
  const [selected, setSelected] =
    useState(null);
  const [busy, setBusy] =
    useState(false);
  const [detailBusy, setDetailBusy] =
    useState(false);
  const [refreshing, setRefreshing] =
    useState(false);
  const [error, setError] =
    useState('');
  const [message, setMessage] =
    useState('');

  const [workMode, setWorkMode] =
    useState('NOTE');
  const [workNote, setWorkNote] =
    useState('');
  const [partName, setPartName] =
    useState('');
  const [partQuantity, setPartQuantity] =
    useState('1');
  const [photoType, setPhotoType] =
    useState('AFTER');
  const [
    customerVisiblePhoto,
    setCustomerVisiblePhoto,
  ] = useState(true);

  const canChangeStatus =
    hasPermission(
      user,
      'SERVICE_ORDER_STATUS',
    );

  const canWriteWorkLog =
    hasPermission(
      user,
      'SERVICE_ORDER_WORKLOG',
    );

  const canUploadMedia =
    canUse(user, {
      feature: 'MEDIA',
      permission: 'MEDIA_UPLOAD',
    });

  const allowedStatuses =
    user?.role ===
    'TECHNICIAN'
      ? technicianStatuses
      : managerStatuses;

  async function load() {
    const response =
      await api.get(
        '/service-orders',
      );

    setOrders(
      response.data,
    );
  }

  useEffect(() => {
    load().catch((err) => {
      setError(
        apiMessage(
          err,
          'İş emirleri yüklenemedi.',
        ),
      );
    });
  }, []);

  const filtered =
    useMemo(() => {
      const term =
        search
          .trim()
          .toLocaleLowerCase(
            'tr-TR',
          );

      if (!term) {
        return orders;
      }

      return orders.filter(
        (order) =>
          [
            order.orderNumber,
            order.vehicle?.plate,
            order.vehicle?.brand,
            order.vehicle?.model,
            order.customer?.firstName,
            order.customer?.lastName,
            order.complaint,
          ]
            .filter(Boolean)
            .join(' ')
            .toLocaleLowerCase(
              'tr-TR',
            )
            .includes(term),
      );
    }, [
      orders,
      search,
    ]);

  async function openOrder(
    id,
  ) {
    setDetailBusy(true);
    setError('');
    setMessage('');

    try {
      const response =
        await api.get(
          `/service-orders/${id}`,
        );

      setSelected(
        response.data,
      );
    } catch (err) {
      setError(
        apiMessage(
          err,
          'İş emri detayı yüklenemedi.',
        ),
      );
    } finally {
      setDetailBusy(false);
    }
  }

  async function refreshSelected() {
    if (!selected?.id) {
      return;
    }

    const response =
      await api.get(
        `/service-orders/${selected.id}`,
      );

    setSelected(
      response.data,
    );
  }

  async function setStatus(
    status,
  ) {
    if (!selected) {
      return;
    }

    setBusy(true);
    setError('');
    setMessage('');

    try {
      await api.patch(
        `/service-orders/${selected.id}/status`,
        {
          status,
        },
      );

      setMessage(
        `Durum: ${serviceStatusLabels[status] || status}`,
      );

      await Promise.all([
        load(),
        refreshSelected(),
      ]);
    } catch (err) {
      setError(
        apiMessage(
          err,
          'Durum güncellenemedi.',
        ),
      );
    } finally {
      setBusy(false);
    }
  }

  async function addWorkLog() {
    if (!selected) {
      return;
    }

    setBusy(true);
    setError('');
    setMessage('');

    try {
      const payload =
        workMode ===
        'PART_USED'
          ? {
              type: 'PART_USED',
              partName:
                partName.trim(),
              quantity:
                Number(
                  partQuantity,
                ),
              note:
                workNote.trim() ||
                undefined,
            }
          : {
              type: 'NOTE',
              note:
                workNote.trim(),
            };

      await api.post(
        `/service-orders/${selected.id}/work-logs`,
        payload,
      );

      setWorkNote('');
      setPartName('');
      setPartQuantity('1');

      setMessage(
        workMode ===
        'PART_USED'
          ? 'Kullanılan parça kaydedildi.'
          : 'Teknik işlem notu kaydedildi.',
      );

      await refreshSelected();
    } catch (err) {
      setError(
        apiMessage(
          err,
          'Teknik kayıt eklenemedi.',
        ),
      );
    } finally {
      setBusy(false);
    }
  }

  async function toggleTask(
    item,
  ) {
    if (!selected) {
      return;
    }

    setBusy(true);
    setError('');
    setMessage('');

    try {
      await api.patch(
        `/service-orders/${selected.id}/items/${item.id}/complete`,
        {
          completed:
            !item.completed,
        },
      );

      setMessage(
        item.completed
          ? 'İşlem yeniden açıldı.'
          : 'İşlem tamamlandı.',
      );

      await Promise.all([
        load(),
        refreshSelected(),
      ]);
    } catch (err) {
      setError(
        apiMessage(
          err,
          'İşlem durumu güncellenemedi.',
        ),
      );
    } finally {
      setBusy(false);
    }
  }

  async function uploadPhotoAsset(
    asset,
  ) {
    if (
      !selected ||
      !asset?.uri
    ) {
      return;
    }

    setBusy(true);
    setError('');
    setMessage('');

    try {
      const formData =
        new FormData();

      const fileName =
        asset.fileName ||
        `servis-${Date.now()}.jpg`;

      const mimeType =
        asset.mimeType ||
        'image/jpeg';

      formData.append(
        'file',
        {
          uri: asset.uri,
          name: fileName,
          type: mimeType,
        },
      );

      formData.append(
        'type',
        photoType,
      );

      formData.append(
        'vehicleId',
        selected.vehicle?.id ||
          selected.vehicleId,
      );

      formData.append(
        'serviceOrderId',
        selected.id,
      );

      formData.append(
        'description',
        `${photoTypes.find(([value]) => value === photoType)?.[1] || 'Servis'} fotoğrafı - mobil`,
      );

      formData.append(
        'customerVisible',
        customerVisiblePhoto
          ? 'true'
          : 'false',
      );

      await api.post(
        '/media/upload',
        formData,
        {
          headers: {
            'Content-Type':
              'multipart/form-data',
          },
        },
      );

      setMessage(
        'Fotoğraf iş emrine ve araca eklendi.',
      );

      await refreshSelected();
    } catch (err) {
      setError(
        apiMessage(
          err,
          'Fotoğraf yüklenemedi.',
        ),
      );
    } finally {
      setBusy(false);
    }
  }

  async function takePhoto() {
    if (!selected) {
      return;
    }

    setError('');
    setMessage('');

    const permission =
      await ImagePicker.requestCameraPermissionsAsync();

    if (!permission.granted) {
      setError(
        'Fotoğraf çekmek için kamera izni gerekli.',
      );
      return;
    }

    const result =
      await ImagePicker.launchCameraAsync({
        quality: 0.72,
        allowsEditing: false,
      });

    if (result.canceled) {
      return;
    }

    const asset =
      result.assets?.[0];

    if (!asset?.uri) {
      setError(
        'Fotoğraf alınamadı.',
      );
      return;
    }

    await uploadPhotoAsset(
      asset,
    );
  }

  async function pickPhoto() {
    if (!selected) {
      return;
    }

    setError('');
    setMessage('');

    const permission =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      setError(
        'Galeriden fotoğraf seçmek için izin gerekli.',
      );
      return;
    }

    const result =
      await ImagePicker.launchImageLibraryAsync({
        quality: 0.72,
        allowsEditing: false,
      });

    if (result.canceled) {
      return;
    }

    const asset =
      result.assets?.[0];

    if (!asset?.uri) {
      setError(
        'Fotoğraf seçilemedi.',
      );
      return;
    }

    await uploadPhotoAsset(
      asset,
    );
  }

  async function refresh() {
    setRefreshing(true);

    try {
      await load();

      if (selected) {
        await refreshSelected();
      }
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <>
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            tintColor={colors.accent}
          />
        }
        contentContainerStyle={
          styles.content
        }
      >
        <ScreenTitle
          title={
            user?.role ===
            'TECHNICIAN'
              ? 'Atanan İşlerim'
              : 'İş Emirleri'
          }
          subtitle="İş emrini açın; servis durumunu, yapılan işlemleri, kullanılan parçaları ve fotoğrafları yönetin."
        />

        <Field
          placeholder="Plaka, müşteri, iş emri ara"
          value={search}
          onChangeText={setSearch}
        />

        <Message text={error} />
        <Message
          text={message}
          tone="success"
        />

        <View style={styles.list}>
          {filtered.map(
            (order) => (
              <Pressable
                key={order.id}
                onPress={() =>
                  openOrder(
                    order.id,
                  )
                }
              >
                <Card>
                  <View style={styles.orderTop}>
                    <View>
                      <Text style={styles.orderNumber}>
                        {order.orderNumber}
                      </Text>

                      <Text style={styles.plate}>
                        {order.vehicle?.plate ||
                          '-'}
                      </Text>
                    </View>

                    <View style={styles.statusBadge}>
                      <Text style={styles.statusText}>
                        {serviceStatusLabels[
                          order.status
                        ] ||
                          order.status}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.customer}>
                    {order.customer?.firstName}{' '}
                    {order.customer?.lastName}
                  </Text>

                  <Text
                    numberOfLines={2}
                    style={styles.complaint}
                  >
                    {order.complaint ||
                      'Açıklama yok'}
                  </Text>

                  <Text style={styles.technician}>
                    Teknisyen:{' '}
                    {order.assignedTechnician
                      ? `${order.assignedTechnician.firstName} ${order.assignedTechnician.lastName}`
                      : 'Atanmadı'}
                  </Text>
                </Card>
              </Pressable>
            ),
          )}

          {!filtered.length ? (
            <Empty text="İş emri bulunamadı." />
          ) : null}
        </View>
      </ScrollView>

      <Modal
        animationType="slide"
        transparent
        visible={Boolean(selected)}
        onRequestClose={() =>
          setSelected(null)
        }
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />

            <ScrollView
              contentContainerStyle={
                styles.sheetContent
              }
            >
              <View style={styles.sheetHead}>
                <View>
                  <Text style={styles.sheetTitle}>
                    {selected?.orderNumber}
                  </Text>

                  <Text style={styles.sheetPlate}>
                    {selected?.vehicle?.plate}
                  </Text>
                </View>

                <Pressable
                  onPress={() =>
                    setSelected(null)
                  }
                >
                  <Text style={styles.close}>
                    Kapat
                  </Text>
                </Pressable>
              </View>

              {detailBusy ? (
                <Text style={styles.loadingText}>
                  Detay yükleniyor...
                </Text>
              ) : null}

              <Card>
                <Text style={styles.detailLabel}>
                  Müşteri
                </Text>
                <Text style={styles.detailValue}>
                  {selected?.customer?.firstName}{' '}
                  {selected?.customer?.lastName}
                </Text>

                <Text style={styles.detailLabel}>
                  Araç
                </Text>
                <Text style={styles.detailValue}>
                  {selected?.vehicle?.brand}{' '}
                  {selected?.vehicle?.model}
                </Text>

                <Text style={styles.detailLabel}>
                  KM
                </Text>
                <Text style={styles.detailValue}>
                  {Number(
                    selected?.mileage ||
                      0,
                  ).toLocaleString(
                    'tr-TR',
                  )}
                </Text>

                <Text style={styles.detailLabel}>
                  Açıklama
                </Text>
                <Text style={styles.detailValue}>
                  {selected?.complaint ||
                    '-'}
                </Text>
              </Card>

              {selected?.items?.length ? (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>
                    Yapılacak İşlemler
                  </Text>

                  <Text style={styles.sectionHint}>
                    Her işlemi tamamlandıkça işaretleyin. Son işlem tamamlandığında araç otomatik olarak kalite kontrol aşamasına geçer.
                  </Text>

                  <View style={styles.taskList}>
                    {selected.items.map(
                      (item) => (
                        <Pressable
                          key={item.id}
                          disabled={busy}
                          onPress={() =>
                            toggleTask(
                              item,
                            )
                          }
                          style={[
                            styles.taskRow,
                            item.completed &&
                              styles.taskRowDone,
                          ]}
                        >
                          <View
                            style={[
                              styles.taskCheck,
                              item.completed &&
                                styles.taskCheckDone,
                            ]}
                          >
                            <Text style={styles.taskCheckText}>
                              {item.completed
                                ? '✓'
                                : ''}
                            </Text>
                          </View>

                          <View style={styles.flex}>
                            <Text
                              style={[
                                styles.taskTitle,
                                item.completed &&
                                  styles.taskTitleDone,
                              ]}
                            >
                              {item.name}
                            </Text>

                            {item.description ? (
                              <Text style={styles.taskDescription}>
                                {item.description}
                              </Text>
                            ) : null}
                          </View>
                        </Pressable>
                      ),
                    )}
                  </View>
                </View>
              ) : null}

              {canChangeStatus ? (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>
                    Servis Durumu
                  </Text>

                  <View style={styles.statusGrid}>
                    {allowedStatuses.map(
                      (status) => (
                        <Pressable
                          key={status}
                          disabled={busy}
                          onPress={() =>
                            setStatus(
                              status,
                            )
                          }
                          style={[
                            styles.statusOption,
                            selected?.status ===
                              status &&
                              styles.statusOptionActive,
                          ]}
                        >
                          <Text
                            style={[
                              styles.statusOptionText,
                              selected?.status ===
                                status &&
                                styles.statusOptionTextActive,
                            ]}
                          >
                            {serviceStatusLabels[
                              status
                            ]}
                          </Text>
                        </Pressable>
                      ),
                    )}
                  </View>
                </View>
              ) : null}

              {canWriteWorkLog ? (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>
                    Teknik Kayıt
                  </Text>

                  <View style={styles.segment}>
                    {[
                      ['NOTE', 'İşlem Notu'],
                      ['PART_USED', 'Kullanılan Parça'],
                    ].map(
                      ([value, label]) => (
                        <Pressable
                          key={value}
                          onPress={() =>
                            setWorkMode(
                              value,
                            )
                          }
                          style={[
                            styles.segmentItem,
                            workMode ===
                              value &&
                              styles.segmentItemActive,
                          ]}
                        >
                          <Text
                            style={[
                              styles.segmentText,
                              workMode ===
                                value &&
                                styles.segmentTextActive,
                            ]}
                          >
                            {label}
                          </Text>
                        </Pressable>
                      ),
                    )}
                  </View>

                  {workMode ===
                  'PART_USED' ? (
                    <>
                      <Field
                        label="Parça adı *"
                        placeholder="Örn. Yağ filtresi"
                        value={partName}
                        onChangeText={setPartName}
                      />

                      <Field
                        label="Miktar *"
                        keyboardType="decimal-pad"
                        value={partQuantity}
                        onChangeText={setPartQuantity}
                      />
                    </>
                  ) : null}

                  <Field
                    label={
                      workMode ===
                      'PART_USED'
                        ? 'Açıklama'
                        : 'Yapılan işlem *'
                    }
                    multiline
                    placeholder={
                      workMode ===
                      'PART_USED'
                        ? 'Parça kullanım notu'
                        : 'Yapılan teknik işlemi yazın'
                    }
                    value={workNote}
                    onChangeText={setWorkNote}
                  />

                  <Button
                    title={
                      busy
                        ? 'Kaydediliyor...'
                        : 'Teknik Kaydı Ekle'
                    }
                    disabled={
                      busy ||
                      (
                        workMode ===
                          'NOTE' &&
                        !workNote.trim()
                      ) ||
                      (
                        workMode ===
                          'PART_USED' &&
                        (
                          !partName.trim() ||
                          Number(
                            partQuantity,
                          ) <= 0
                        )
                      )
                    }
                    onPress={addWorkLog}
                  />
                </View>
              ) : null}

              {canUploadMedia ? (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>
                    Servis Fotoğrafı
                  </Text>

                  <View style={styles.statusGrid}>
                    {photoTypes.map(
                      ([value, label]) => (
                        <Pressable
                          key={value}
                          onPress={() =>
                            setPhotoType(
                              value,
                            )
                          }
                          style={[
                            styles.statusOption,
                            photoType ===
                              value &&
                              styles.statusOptionActive,
                          ]}
                        >
                          <Text
                            style={[
                              styles.statusOptionText,
                              photoType ===
                                value &&
                                styles.statusOptionTextActive,
                            ]}
                          >
                            {label}
                          </Text>
                        </Pressable>
                      ),
                    )}
                  </View>

                  <Pressable
                    onPress={() =>
                      setCustomerVisiblePhoto(
                        (value) =>
                          !value,
                      )
                    }
                    style={[
                      styles.visibilityToggle,
                      customerVisiblePhoto &&
                        styles.visibilityToggleActive,
                    ]}
                  >
                    <Text style={styles.visibilityTitle}>
                      {customerVisiblePhoto
                        ? '✓ Müşteri uygulamasında göster'
                        : 'Müşteriye gösterme'}
                    </Text>

                    <Text style={styles.visibilityHint}>
                      Teknik iç kullanım fotoğraflarında bu seçeneği kapatabilirsiniz.
                    </Text>
                  </Pressable>

                  <View style={styles.photoActionRow}>
                    <View style={styles.photoAction}>
                      <Button
                        title={
                          busy
                            ? 'Yükleniyor...'
                            : 'Kamera'
                        }
                        disabled={busy}
                        onPress={takePhoto}
                      />
                    </View>

                    <View style={styles.photoAction}>
                      <Button
                        title="Galeriden Ekle"
                        tone="ghost"
                        disabled={busy}
                        onPress={pickPhoto}
                      />
                    </View>
                  </View>

                  {selected?.media?.length ? (
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={
                        styles.mediaRow
                      }
                    >
                      {selected.media.map(
                        (media) => (
                          <View
                            key={media.id}
                            style={styles.mediaItem}
                          >
                            <Image
                              source={{
                                uri:
                                  mediaUrl(
                                    media,
                                  ),
                              }}
                              style={styles.mediaImage}
                            />

                            <Text
                              numberOfLines={1}
                              style={styles.mediaLabel}
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
                    <Text style={styles.mediaCount}>
                      Bu iş emrinde henüz fotoğraf yok.
                    </Text>
                  )}
                </View>
              ) : null}

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  İşlem Geçmişi
                </Text>

                <View style={styles.timeline}>
                  {(selected?.workLogs || []).map(
                    (log) => (
                      <Card
                        key={log.id}
                        style={styles.logCard}
                      >
                        <View style={styles.logTop}>
                          <Text style={styles.logType}>
                            {log.type ===
                            'PART_USED'
                              ? 'KULLANILAN PARÇA'
                              : 'İŞLEM NOTU'}
                          </Text>

                          <Text style={styles.logDate}>
                            {new Date(
                              log.createdAt,
                            ).toLocaleString(
                              'tr-TR',
                            )}
                          </Text>
                        </View>

                        {log.type ===
                        'PART_USED' ? (
                          <Text style={styles.logTitle}>
                            {log.part?.name ||
                              log.partName ||
                              'Parça'}{' '}
                            ×{' '}
                            {Number(
                              log.quantity ||
                                0,
                            )}
                          </Text>
                        ) : null}

                        {log.note ? (
                          <Text style={styles.logNote}>
                            {log.note}
                          </Text>
                        ) : null}

                        <Text style={styles.logUser}>
                          {log.user?.firstName}{' '}
                          {log.user?.lastName}
                        </Text>
                      </Card>
                    ),
                  )}

                  {!selected?.workLogs?.length ? (
                    <Empty text="Henüz teknik işlem kaydı yok." />
                  ) : null}
                </View>
              </View>

              <Button
                title="Kapat"
                tone="ghost"
                onPress={() =>
                  setSelected(null)
                }
              />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.md,
    paddingBottom: 110,
  },
  list: {
    gap: 8,
  },
  orderTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  orderNumber: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: '700',
  },
  plate: {
    marginTop: 3,
    color: colors.text,
    fontSize: 18,
    fontWeight: '900',
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor:
      colors.accentSoft,
  },
  statusText: {
    color: colors.accent,
    fontSize: 9,
    fontWeight: '900',
  },
  customer: {
    marginTop: 12,
    color: colors.text,
    fontSize: 12,
    fontWeight: '800',
  },
  complaint: {
    marginTop: 5,
    color: colors.muted,
    fontSize: 10,
    lineHeight: 16,
  },
  technician: {
    marginTop: 9,
    color: '#77838e',
    fontSize: 9,
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor:
      'rgba(0,0,0,.62)',
  },
  sheet: {
    maxHeight: '92%',
    borderTopLeftRadius:
      radius.lg,
    borderTopRightRadius:
      radius.lg,
    backgroundColor: colors.bg,
  },
  sheetHandle: {
    width: 48,
    height: 4,
    alignSelf: 'center',
    marginTop: 9,
    borderRadius: 999,
    backgroundColor: '#3a444e',
  },
  sheetContent: {
    padding: spacing.md,
    paddingBottom: 34,
  },
  sheetHead: {
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sheetTitle: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '700',
  },
  sheetPlate: {
    marginTop: 3,
    color: colors.text,
    fontSize: 24,
    fontWeight: '900',
  },
  close: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: '900',
  },
  loadingText: {
    marginBottom: 10,
    color: colors.muted,
    fontSize: 10,
  },
  detailLabel: {
    marginTop: 12,
    color: colors.muted,
    fontSize: 9,
    textTransform: 'uppercase',
  },
  detailValue: {
    marginTop: 3,
    color: colors.text,
    fontSize: 12,
    lineHeight: 18,
  },
  section: {
    marginVertical: 14,
  },
  sectionTitle: {
    marginBottom: 8,
    color: colors.text,
    fontSize: 13,
    fontWeight: '900',
  },
  statusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
  },
  statusOption: {
    paddingHorizontal: 10,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 9,
    backgroundColor: colors.panel,
  },
  statusOptionActive: {
    borderColor:
      '#7a551a',
    backgroundColor:
      colors.accentSoft,
  },
  statusOptionText: {
    color: colors.muted,
    fontSize: 9,
    fontWeight: '800',
  },
  statusOptionTextActive: {
    color: colors.accent,
  },
  segment: {
    marginBottom: 10,
    flexDirection: 'row',
    gap: 7,
  },
  segmentItem: {
    flex: 1,
    padding: 10,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 9,
    backgroundColor: colors.panel,
  },
  segmentItemActive: {
    borderColor: '#7a551a',
    backgroundColor:
      colors.accentSoft,
  },
  segmentText: {
    color: colors.muted,
    textAlign: 'center',
    fontSize: 9,
    fontWeight: '800',
  },
  segmentTextActive: {
    color: colors.accent,
  },
  photoActionRow: {
    marginTop: 10,
    flexDirection: 'row',
    gap: 8,
  },
  photoAction: {
    flex: 1,
  },
  mediaRow: {
    marginTop: 10,
    gap: 8,
  },
  mediaItem: {
    width: 126,
  },
  mediaImage: {
    width: 126,
    height: 92,
    borderRadius: 10,
    backgroundColor:
      colors.panel2,
  },
  mediaLabel: {
    marginTop: 4,
    color:
      colors.muted,
    fontSize: 8,
    fontWeight: '700',
  },
  mediaCount: {
    marginTop: 8,
    color: colors.muted,
    fontSize: 9,
  },
  timeline: {
    gap: 7,
  },
  logCard: {
    padding: 12,
  },
  logTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent:
      'space-between',
    gap: 8,
  },
  logType: {
    color: colors.accent,
    fontSize: 8,
    fontWeight: '900',
  },
  logDate: {
    color: '#67727c',
    fontSize: 7,
  },
  logTitle: {
    marginTop: 7,
    color: colors.text,
    fontSize: 11,
    fontWeight: '900',
  },
  logNote: {
    marginTop: 5,
    color: colors.muted,
    fontSize: 10,
    lineHeight: 15,
  },
  logUser: {
    marginTop: 7,
    color: '#69747e',
    fontSize: 8,
  },
});
