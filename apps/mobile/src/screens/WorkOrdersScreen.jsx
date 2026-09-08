import {
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

import api from '../api/client';
import { useAuth } from '../auth/AuthContext';
import {
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

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState('');

  const [message, setMessage] =
    useState('');

  async function load() {
    const response =
      await api.get(
        '/service-orders',
      );

    setOrders(
      response.data,
    );

    if (selected) {
      const refreshed =
        response.data.find(
          (item) =>
            item.id ===
            selected.id,
        );

      if (refreshed) {
        setSelected(
          refreshed,
        );
      }
    }
  }

  useEffect(() => {
    load().catch((err) => {
      setError(
        err?.response?.data?.message ||
          'İş emirleri yüklenemedi.',
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

  const canChangeStatus =
    hasPermission(
      user,
      'SERVICE_ORDER_STATUS',
    );

  const allowedStatuses =
    user?.role ===
    'TECHNICIAN'
      ? technicianStatuses
      : managerStatuses;

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
      const response =
        await api.patch(
          `/service-orders/${selected.id}/status`,
          {
            status,
          },
        );

      setSelected(
        response.data,
      );

      setMessage(
        `Durum: ${serviceStatusLabels[status] || status}`,
      );

      await load();
    } catch (err) {
      const detail =
        err?.response?.data?.message;

      setError(
        Array.isArray(detail)
          ? detail.join(', ')
          : detail ||
              'Durum güncellenemedi.',
      );
    } finally {
      setBusy(false);
    }
  }

  async function refresh() {
    setRefreshing(true);

    try {
      await load();
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
          subtitle="Plaka veya müşteri ile arayın, iş detayını açın ve yetkiniz varsa durumunu güncelleyin."
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
                  setSelected(
                    order,
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

              {canChangeStatus ? (
                <View style={styles.statusSection}>
                  <Text style={styles.statusTitle}>
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
    fontWeight: '950',
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
    maxHeight: '88%',
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
    fontWeight: '950',
  },
  close: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: '900',
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
  statusSection: {
    marginVertical: 14,
  },
  statusTitle: {
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
});
