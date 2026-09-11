import { useLiveRefresh } from '../hooks/useLiveRefresh';
import {
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

function money(value) {
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

export default function CashierScreen() {
  const { user } = useAuth();

  const [payments, setPayments] =
    useState([]);

  const [customers, setCustomers] =
    useState([]);

  const [refreshing, setRefreshing] =
    useState(false);

  const [showForm, setShowForm] =
    useState(false);

  const [form, setForm] =
    useState({
      customerId: '',
      amount: '',
      method: 'CASH',
      reference: '',
    });

  const [error, setError] =
    useState('');

  const [message, setMessage] =
    useState('');

  const [busy, setBusy] =
    useState(false);

  const canCollect =
    hasPermission(
      user,
      'CASHIER_COLLECT',
    );

  useLiveRefresh(() => load());

  async function load() {
    const requests = [
      api.get(
        '/billing/payments',
      ),
    ];

    if (canCollect) {
      requests.push(
        api.get(
          '/customers',
        ),
      );
    }

    const result =
      await Promise.all(
        requests,
      );

    setPayments(
      result[0].data,
    );

    setCustomers(
      result[1]?.data || [],
    );
  }

  useEffect(() => {
    load().catch((err) => {
      setError(
        err?.response?.data?.message ||
          'Kasa verileri yüklenemedi.',
      );
    });
  }, []);

  const todayTotal =
    useMemo(() => {
      const today =
        new Date().toDateString();

      return payments
        .filter(
          (payment) =>
            payment.status ===
              'PAID' &&
            new Date(
              payment.paidAt ||
                payment.createdAt,
            ).toDateString() ===
              today,
        )
        .reduce(
          (sum, payment) =>
            sum +
            Number(
              payment.amount ||
                0,
            ),
          0,
        );
    }, [
      payments,
    ]);

  async function collect() {
    setBusy(true);
    setError('');
    setMessage('');

    try {
      await api.post(
        '/billing/payments',
        {
          customerId:
            form.customerId,
          branchId:
            user?.branchId ||
            undefined,
          amount:
            Number(
              form.amount,
            ),
          method:
            form.method,
          status: 'PAID',
          reference:
            form.reference.trim() ||
            undefined,
        },
      );

      setForm({
        customerId: '',
        amount: '',
        method: 'CASH',
        reference: '',
      });

      setShowForm(false);
      setMessage(
        'Tahsilat kaydedildi.',
      );

      await load();
    } catch (err) {
      const detail =
        err?.response?.data?.message;

      setError(
        Array.isArray(detail)
          ? detail.join(', ')
          : detail ||
              'Tahsilat kaydedilemedi.',
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
        title="Kasa / Tahsilat"
        subtitle="Yetkiniz dahilinde ödeme hareketlerini görüntüleyin ve tahsilat kaydedin."
      />

      <Card style={styles.totalCard}>
        <Text style={styles.totalLabel}>
          Bugün Toplam
        </Text>
        <Text style={styles.total}>
          {money(todayTotal)} ₺
        </Text>
      </Card>

      {canCollect ? (
        <Button
          title={
            showForm
              ? 'Tahsilat Formunu Kapat'
              : '+ Yeni Tahsilat'
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
          <Text style={styles.formTitle}>
            Hızlı Tahsilat
          </Text>

          <View style={styles.customerOptions}>
            {customers
              .slice(0, 12)
              .map(
                (customer) => (
                  <Text
                    key={customer.id}
                    onPress={() =>
                      setForm({
                        ...form,
                        customerId:
                          customer.id,
                      })
                    }
                    style={[
                      styles.customerOption,
                      form.customerId ===
                        customer.id &&
                        styles.customerOptionActive,
                    ]}
                  >
                    {customer.firstName}{' '}
                    {customer.lastName}
                  </Text>
                ),
              )}
          </View>

          <Field
            label="Müşteri ID"
            value={form.customerId}
            onChangeText={(value) =>
              setForm({
                ...form,
                customerId: value,
              })
            }
          />

          <Field
            label="Tutar"
            keyboardType="decimal-pad"
            value={form.amount}
            onChangeText={(value) =>
              setForm({
                ...form,
                amount: value,
              })
            }
          />

          <View style={styles.methods}>
            {[
              ['CASH', 'Nakit'],
              ['CARD', 'Kart'],
              ['TRANSFER', 'Havale'],
              ['OTHER', 'Diğer'],
            ].map(
              ([value, label]) => (
                <Text
                  key={value}
                  onPress={() =>
                    setForm({
                      ...form,
                      method: value,
                    })
                  }
                  style={[
                    styles.method,
                    form.method ===
                      value &&
                      styles.methodActive,
                  ]}
                >
                  {label}
                </Text>
              ),
            )}
          </View>

          <Field
            label="Referans / açıklama"
            value={form.reference}
            onChangeText={(value) =>
              setForm({
                ...form,
                reference: value,
              })
            }
          />

          <Button
            title={
              busy
                ? 'Kaydediliyor...'
                : 'Tahsilatı Kaydet'
            }
            disabled={
              busy ||
              !form.customerId ||
              Number(
                form.amount,
              ) <= 0
            }
            onPress={collect}
          />
        </Card>
      ) : null}

      <Text style={styles.sectionTitle}>
        Son Ödemeler
      </Text>

      <View style={styles.list}>
        {payments
          .slice(0, 30)
          .map(
            (payment) => (
              <Card
                key={payment.id}
              >
                <View style={styles.paymentTop}>
                  <View style={styles.flex}>
                    <Text style={styles.paymentCustomer}>
                      {payment.customer?.firstName}{' '}
                      {payment.customer?.lastName}
                    </Text>

                    <Text style={styles.paymentMeta}>
                      {new Date(
                        payment.paidAt ||
                          payment.createdAt,
                      ).toLocaleString(
                        'tr-TR',
                      )}
                    </Text>
                  </View>

                  <Text style={styles.amount}>
                    {money(
                      payment.amount,
                    )}{' '}
                    ₺
                  </Text>
                </View>

                <Text style={styles.paymentMeta}>
                  {payment.method} ·{' '}
                  {payment.status}
                </Text>
              </Card>
            ),
          )}

        {!payments.length ? (
          <Empty text="Henüz ödeme kaydı yok." />
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
  totalCard: {
    marginBottom: 10,
  },
  totalLabel: {
    color: colors.muted,
    fontSize: 10,
  },
  total: {
    marginTop: 6,
    color: colors.text,
    fontSize: 28,
    fontWeight: '900',
  },
  formCard: {
    marginTop: 12,
  },
  formTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '900',
  },
  customerOptions: {
    marginVertical: 10,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  customerOption: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    color: colors.muted,
    fontSize: 9,
  },
  customerOptionActive: {
    borderColor: '#7b581c',
    backgroundColor:
      colors.accentSoft,
    color: colors.accent,
  },
  methods: {
    marginBottom: 12,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  method: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 9,
    color: colors.muted,
    fontSize: 9,
    fontWeight: '800',
  },
  methodActive: {
    borderColor: '#7b581c',
    backgroundColor:
      colors.accentSoft,
    color: colors.accent,
  },
  sectionTitle: {
    marginTop: 18,
    marginBottom: 8,
    color: colors.text,
    fontSize: 14,
    fontWeight: '900',
  },
  list: {
    gap: 8,
  },
  paymentTop: {
    flexDirection: 'row',
    gap: 12,
  },
  flex: {
    flex: 1,
  },
  paymentCustomer: {
    color: colors.text,
    fontSize: 11,
    fontWeight: '800',
  },
  paymentMeta: {
    marginTop: 4,
    color: colors.muted,
    fontSize: 9,
  },
  amount: {
    color: colors.accent,
    fontSize: 15,
    fontWeight: '900',
  },
});
