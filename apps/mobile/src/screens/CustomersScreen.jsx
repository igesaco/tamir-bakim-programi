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
import StaffCustomerDetailScreen from './StaffCustomerDetailScreen';
import { useAuth } from '../auth/AuthContext';
import {
  canUse,
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

export default function CustomersScreen({
  onStartIntake,
}) {
  const { user } = useAuth();

  const [items, setItems] =
    useState([]);

  const [search, setSearch] =
    useState('');

  const [showForm, setShowForm] =
    useState(false);

  const [form, setForm] =
    useState({
      firstName: '',
      lastName: '',
      phone: '',
      email: '',
      nationalId: '',
    });

  const [busy, setBusy] =
    useState(false);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState('');

  const [message, setMessage] =
    useState('');

  const [
    selectedCustomerId,
    setSelectedCustomerId,
  ] = useState(null);

  const canCreate =
    canUse(user, {
      feature: 'CUSTOMERS',
      permission:
        'CUSTOMER_CREATE',
    });

  async function load() {
    const response =
      await api.get(
        '/customers',
      );

    setItems(
      response.data,
    );
  }

  useEffect(() => {
    load().catch((err) => {
      setError(
        err?.response?.data?.message ||
          'Müşteriler yüklenemedi.',
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
            item.firstName,
            item.lastName,
            item.phone,
            item.email,
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
        '/customers',
        {
          firstName:
            form.firstName.trim(),
          lastName:
            form.lastName.trim() ||
            undefined,
          phone:
            form.phone.trim() ||
            undefined,
          email:
            form.email.trim() ||
            undefined,
          nationalId:
            form.nationalId.trim() ||
            undefined,
        },
      );

      setForm({
        firstName: '',
        lastName: '',
        phone: '',
        email: '',
        nationalId: '',
      });

      setShowForm(false);
      setMessage(
        'Müşteri oluşturuldu.',
      );

      await load();
    } catch (err) {
      const detail =
        err?.response?.data?.message;

      setError(
        Array.isArray(detail)
          ? detail.join(', ')
          : detail ||
              'Müşteri oluşturulamadı.',
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

  if (selectedCustomerId) {
    return (
      <StaffCustomerDetailScreen
        customerId={
          selectedCustomerId
        }
        onBack={() =>
          setSelectedCustomerId(
            null,
          )
        }
        onStartIntake={
          onStartIntake
        }
      />
    );
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
        title="Müşteriler"
        subtitle="Yetkinize göre müşteri kayıtlarını görüntüleyin ve yönetin."
      />

      <Field
        placeholder="Ad, telefon veya e-posta ara"
        value={search}
        onChangeText={setSearch}
      />

      {canCreate ? (
        <Button
          title={
            showForm
              ? 'Yeni Müşteri Formunu Kapat'
              : '+ Yeni Müşteri'
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

      <Message text={error} />
      <Message
        text={message}
        tone="success"
      />

      {showForm ? (
        <Card style={styles.formCard}>
          <Text style={styles.cardTitle}>
            Yeni Müşteri
          </Text>

          <Field
            label="Ad *"
            value={form.firstName}
            onChangeText={(value) =>
              setForm({
                ...form,
                firstName: value,
              })
            }
          />

          <Field
            label="Soyad"
            value={form.lastName}
            onChangeText={(value) =>
              setForm({
                ...form,
                lastName: value,
              })
            }
          />

          <Field
            label="Telefon"
            keyboardType="phone-pad"
            value={form.phone}
            onChangeText={(value) =>
              setForm({
                ...form,
                phone: value,
              })
            }
          />

          <Field
            label="E-posta"
            autoCapitalize="none"
            keyboardType="email-address"
            value={form.email}
            onChangeText={(value) =>
              setForm({
                ...form,
                email: value,
              })
            }
          />

          <Field
            label="T.C. Kimlik No (opsiyonel)"
            keyboardType="number-pad"
            maxLength={11}
            value={form.nationalId}
            onChangeText={(value) =>
              setForm({
                ...form,
                nationalId:
                  value.replace(
                    /\D/g,
                    '',
                  ),
              })
            }
          />

          <Button
            title={
              busy
                ? 'Kaydediliyor...'
                : 'Müşteriyi Kaydet'
            }
            disabled={
              busy ||
              form.firstName
                .trim()
                .length < 2
            }
            onPress={create}
          />
        </Card>
      ) : null}

      <View style={styles.list}>
        {filtered.map(
          (item) => (
            <Pressable
              key={item.id}
              onPress={() =>
                setSelectedCustomerId(
                  item.id,
                )
              }
              style={({ pressed }) => [
                pressed &&
                  styles.pressed,
              ]}
            >
              <Card
                style={styles.customerCard}
              >
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {item.firstName
                      ?.charAt(0)
                      ?.toUpperCase() ||
                      '?'}
                  </Text>
                </View>

                <View style={styles.customerCopy}>
                  <Text style={styles.customerName}>
                    {item.firstName}{' '}
                    {item.lastName}
                  </Text>

                  <Text style={styles.customerMeta}>
                    {item.phone ||
                      item.email ||
                      'İletişim bilgisi yok'}
                  </Text>

                  <Text style={styles.customerMeta}>
                    {item.vehicles?.length || 0}{' '}
                    araç · Detayı aç →
                  </Text>
                </View>
              </Card>
            </Pressable>
          ),
        )}

        {!filtered.length ? (
          <Empty text="Müşteri bulunamadı." />
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
  cardTitle: {
    marginBottom: 12,
    color: colors.text,
    fontSize: 14,
    fontWeight: '900',
  },
  list: {
    marginTop: 12,
    gap: 8,
  },
  pressed: {
    opacity: .78,
  },
  customerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 13,
    backgroundColor:
      colors.accentSoft,
  },
  avatarText: {
    color: colors.accent,
    fontSize: 15,
    fontWeight: '900',
  },
  customerCopy: {
    flex: 1,
  },
  customerName: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '850',
  },
  customerMeta: {
    marginTop: 3,
    color: colors.muted,
    fontSize: 10,
  },
});
