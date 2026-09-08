import {
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
  Button,
  Card,
  Empty,
  Field,
  Message,
  ScreenTitle,
} from '../components/UI';
import {
  colors,
  spacing,
} from '../theme';

export default function InspectionsScreen() {
  const { user } = useAuth();

  const [items, setItems] =
    useState([]);
  const [vehicles, setVehicles] =
    useState([]);
  const [showForm, setShowForm] =
    useState(false);
  const [search, setSearch] =
    useState('');
  const [busy, setBusy] =
    useState(false);
  const [refreshing, setRefreshing] =
    useState(false);
  const [error, setError] =
    useState('');
  const [message, setMessage] =
    useState('');

  const [form, setForm] =
    useState({
      vehicleId: '',
      mileage: '',
      fuelLevel: '',
      customerComplaint: '',
      existingDamage: '',
      valuablesNote: '',
    });

  const canManage =
    hasPermission(
      user,
      'INSPECTION_MANAGE',
    );

  async function load() {
    const requests = [
      api.get('/inspections'),
    ];

    if (canManage) {
      requests.push(
        api.get('/vehicles'),
      );
    }

    const result =
      await Promise.all(
        requests,
      );

    setItems(
      result[0].data,
    );

    setVehicles(
      result[1]?.data || [],
    );
  }

  useEffect(() => {
    load().catch((err) => {
      setError(
        err?.response?.data?.message ||
          'Araç kabul kayıtları yüklenemedi.',
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
        return items;
      }

      return items.filter(
        (item) =>
          [
            item.vehicle?.plate,
            item.vehicle?.brand,
            item.vehicle?.model,
            item.customerComplaint,
          ]
            .filter(Boolean)
            .join(' ')
            .toLocaleLowerCase(
              'tr-TR',
            )
            .includes(term),
      );
    }, [
      items,
      search,
    ]);

  async function create() {
    setBusy(true);
    setError('');
    setMessage('');

    try {
      await api.post(
        '/inspections',
        {
          vehicleId:
            form.vehicleId,
          mileage:
            Number(
              form.mileage,
            ),
          fuelLevel:
            form.fuelLevel ||
            undefined,
          customerComplaint:
            form.customerComplaint ||
            undefined,
          existingDamage:
            form.existingDamage ||
            undefined,
          valuablesNote:
            form.valuablesNote ||
            undefined,
        },
      );

      setForm({
        vehicleId: '',
        mileage: '',
        fuelLevel: '',
        customerComplaint: '',
        existingDamage: '',
        valuablesNote: '',
      });

      setShowForm(false);
      setMessage(
        'Araç kabul kaydı oluşturuldu.',
      );

      await load();
    } catch (err) {
      const detail =
        err?.response?.data?.message;

      setError(
        Array.isArray(detail)
          ? detail.join(', ')
          : detail ||
              'Araç kabul kaydı oluşturulamadı.',
      );
    } finally {
      setBusy(false);
    }
  }

  async function complete(
    id,
  ) {
    setBusy(true);
    setError('');

    try {
      await api.patch(
        `/inspections/${id}/complete`,
      );

      setMessage(
        'Araç kabul kaydı tamamlandı.',
      );

      await load();
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          'Kayıt tamamlanamadı.',
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
        title="Araç Kabul"
        subtitle="Araç teslim alınırken kilometre, yakıt, hasar ve müşteri şikayetini kayıt altına alın."
      />

      <Field
        placeholder="Plaka veya araç ara"
        value={search}
        onChangeText={setSearch}
      />

      {canManage &&
      user?.branchId ? (
        <Button
          title={
            showForm
              ? 'Kabul Formunu Kapat'
              : '+ Yeni Araç Kabul'
          }
          tone="ghost"
          onPress={() =>
            setShowForm(
              (value) =>
                !value,
            )
          }
        />
      ) : null}

      {canManage &&
      !user?.branchId ? (
        <Message
          text="Araç kabul oluşturmak için hesabınızda şube atanmış olmalı."
        />
      ) : null}

      <Message text={error} />
      <Message
        text={message}
        tone="success"
      />

      {showForm ? (
        <Card style={styles.formCard}>
          <Text style={styles.formTitle}>
            Araç Seç
          </Text>

          <View style={styles.vehicleGrid}>
            {vehicles
              .slice(0, 30)
              .map(
                (vehicle) => (
                  <Pressable
                    key={
                      vehicle.id
                    }
                    onPress={() =>
                      setForm({
                        ...form,
                        vehicleId:
                          vehicle.id,
                        mileage:
                          String(
                            vehicle.mileage ||
                              '',
                          ),
                      })
                    }
                    style={[
                      styles.vehicle,
                      form.vehicleId ===
                        vehicle.id &&
                        styles.vehicleActive,
                    ]}
                  >
                    <Text style={styles.vehiclePlate}>
                      {vehicle.plate}
                    </Text>

                    <Text style={styles.vehicleName}>
                      {vehicle.brand}{' '}
                      {vehicle.model}
                    </Text>
                  </Pressable>
                ),
              )}
          </View>

          <Field
            label="Kilometre *"
            keyboardType="number-pad"
            value={form.mileage}
            onChangeText={(value) =>
              setForm({
                ...form,
                mileage:
                  value.replace(
                    /\D/g,
                    '',
                  ),
              })
            }
          />

          <Field
            label="Yakıt Seviyesi"
            placeholder="Örn. %50"
            value={form.fuelLevel}
            onChangeText={(value) =>
              setForm({
                ...form,
                fuelLevel: value,
              })
            }
          />

          <Field
            label="Müşteri Şikayeti"
            multiline
            value={
              form.customerComplaint
            }
            onChangeText={(value) =>
              setForm({
                ...form,
                customerComplaint:
                  value,
              })
            }
          />

          <Field
            label="Mevcut Hasar"
            multiline
            value={
              form.existingDamage
            }
            onChangeText={(value) =>
              setForm({
                ...form,
                existingDamage:
                  value,
              })
            }
          />

          <Field
            label="Araçtaki Değerli Eşyalar"
            multiline
            value={
              form.valuablesNote
            }
            onChangeText={(value) =>
              setForm({
                ...form,
                valuablesNote:
                  value,
              })
            }
          />

          <Button
            title={
              busy
                ? 'Kaydediliyor...'
                : 'Araç Kabulü Kaydet'
            }
            disabled={
              busy ||
              !form.vehicleId ||
              !form.mileage
            }
            onPress={create}
          />
        </Card>
      ) : null}

      <View style={styles.list}>
        {filtered.map(
          (item) => (
            <Card key={item.id}>
              <View style={styles.row}>
                <View style={styles.flex}>
                  <Text style={styles.plate}>
                    {item.vehicle?.plate}
                  </Text>

                  <Text style={styles.vehicleText}>
                    {item.vehicle?.brand}{' '}
                    {item.vehicle?.model}
                  </Text>
                </View>

                <Text
                  style={
                    item.status ===
                    'COMPLETED'
                      ? styles.completed
                      : styles.draft
                  }
                >
                  {item.status ===
                  'COMPLETED'
                    ? 'Tamamlandı'
                    : 'Taslak'}
                </Text>
              </View>

              <Text style={styles.meta}>
                KM:{' '}
                {Number(
                  item.mileage ||
                    0,
                ).toLocaleString(
                  'tr-TR',
                )}
                {' · '}
                Yakıt:{' '}
                {item.fuelLevel ||
                  '-'}
              </Text>

              {item.customerComplaint ? (
                <Text style={styles.note}>
                  {item.customerComplaint}
                </Text>
              ) : null}

              {canManage &&
              item.status !==
                'COMPLETED' ? (
                <Text
                  onPress={() =>
                    complete(
                      item.id,
                    )
                  }
                  style={styles.complete}
                >
                  Kabulü Tamamla
                </Text>
              ) : null}
            </Card>
          ),
        )}

        {!filtered.length ? (
          <Empty text="Araç kabul kaydı bulunamadı." />
        ) : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.md,
    paddingBottom: 110,
  },
  formCard: {
    marginTop: 12,
  },
  formTitle: {
    marginBottom: 9,
    color: colors.text,
    fontSize: 13,
    fontWeight: '900',
  },
  vehicleGrid: {
    marginBottom: 12,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  vehicle: {
    padding: 8,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 9,
    backgroundColor:
      '#0e1419',
  },
  vehicleActive: {
    borderColor:
      '#7b571c',
    backgroundColor:
      colors.accentSoft,
  },
  vehiclePlate: {
    color: colors.text,
    fontSize: 10,
    fontWeight: '900',
  },
  vehicleName: {
    marginTop: 2,
    color: colors.muted,
    fontSize: 8,
  },
  list: {
    marginTop: 12,
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  flex: {
    flex: 1,
  },
  plate: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '900',
  },
  vehicleText: {
    marginTop: 3,
    color: colors.muted,
    fontSize: 9,
  },
  draft: {
    color: colors.warning,
    fontSize: 9,
    fontWeight: '800',
  },
  completed: {
    color: colors.success,
    fontSize: 9,
    fontWeight: '800',
  },
  meta: {
    marginTop: 9,
    color: '#77828c',
    fontSize: 9,
  },
  note: {
    marginTop: 7,
    color: colors.muted,
    fontSize: 10,
    lineHeight: 15,
  },
  complete: {
    marginTop: 10,
    color: colors.accent,
    fontSize: 10,
    fontWeight: '900',
  },
});
