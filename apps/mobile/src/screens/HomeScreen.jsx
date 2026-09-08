import {
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
import { useAuth } from '../auth/AuthContext';
import {
  canUse,
} from '../permissions';
import {
  Card,
  Message,
  ScreenTitle,
} from '../components/UI';
import {
  colors,
  spacing,
} from '../theme';

export default function HomeScreen({
  onOpen,
}) {
  const { user } = useAuth();

  const [stats, setStats] =
    useState({
      customers: null,
      orders: null,
      payments: null,
      parts: null,
    });

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState('');

  async function load() {
    setError('');

    const tasks = [];

    if (
      canUse(user, {
        feature: 'CUSTOMERS',
        permission: 'CUSTOMER_VIEW',
      })
    ) {
      tasks.push(
        api
          .get('/customers')
          .then((r) => [
            'customers',
            r.data.length,
          ]),
      );
    }

    if (
      canUse(user, {
        feature:
          'SERVICE_ORDERS',
        permission:
          'SERVICE_ORDER_VIEW',
      })
    ) {
      tasks.push(
        api
          .get('/service-orders')
          .then((r) => [
            'orders',
            r.data.length,
          ]),
      );
    }

    if (
      canUse(user, {
        feature: 'CASHIER',
        permission: 'CASHIER_VIEW',
      })
    ) {
      tasks.push(
        api
          .get('/billing/payments')
          .then((r) => [
            'payments',
            r.data.length,
          ]),
      );
    }

    if (
      canUse(user, {
        feature: 'INVENTORY',
        permission: 'INVENTORY_VIEW',
      })
    ) {
      tasks.push(
        api
          .get('/inventory/parts')
          .then((r) => [
            'parts',
            r.data.length,
          ]),
      );
    }

    const results =
      await Promise.all(tasks);

    setStats((current) => ({
      ...current,
      ...Object.fromEntries(
        results,
      ),
    }));
  }

  useEffect(() => {
    load().catch((err) => {
      setError(
        err?.response?.data?.message ||
          'Özet veriler yüklenemedi.',
      );
    });
  }, [
    user?.id,
  ]);

  async function refresh() {
    setRefreshing(true);

    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  }

  const cards = [
    {
      key: 'customers',
      title: 'Müşteriler',
      value: stats.customers,
      screen: 'customers',
      enabled:
        canUse(user, {
          feature: 'CUSTOMERS',
          permission:
            'CUSTOMER_VIEW',
        }),
    },
    {
      key: 'orders',
      title:
        user?.role ===
        'TECHNICIAN'
          ? 'Atanan İşlerim'
          : 'İş Emirleri',
      value: stats.orders,
      screen: 'orders',
      enabled:
        canUse(user, {
          feature:
            'SERVICE_ORDERS',
          permission:
            'SERVICE_ORDER_VIEW',
        }),
    },
    {
      key: 'parts',
      title: 'Parçalar',
      value: stats.parts,
      screen: 'inventory',
      enabled:
        canUse(user, {
          feature:
            'INVENTORY',
          permission:
            'INVENTORY_VIEW',
        }),
    },
    {
      key: 'inspections',
      title: 'Araç Kabul',
      value: null,
      screen: 'inspections',
      enabled:
        canUse(user, {
          feature:
            'INSPECTIONS',
          permission:
            'INSPECTION_VIEW',
        }),
    },
    {
      key: 'notifications',
      title: 'Bildirimler',
      value: null,
      screen: 'notifications',
      enabled:
        canUse(user, {
          feature:
            'NOTIFICATIONS',
          permission:
            'NOTIFICATION_VIEW',
        }),
    },
    {
      key: 'payments',
      title: 'Tahsilatlar',
      value: stats.payments,
      screen: 'cashier',
      enabled:
        canUse(user, {
          feature: 'CASHIER',
          permission:
            'CASHIER_VIEW',
        }),
    },
  ].filter(
    (item) =>
      item.enabled,
  );

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
      <ScreenTitle
        title={
          `Merhaba ${user?.firstName || ''}`
        }
        subtitle={
          user?.branch?.name ||
          user?.organization?.name ||
          'Mobil servis çalışma alanı'
        }
      />

      <Message text={error} />

      <View style={styles.grid}>
        {cards.map(
          (item) => (
            <Card
              key={item.key}
              style={styles.statCard}
            >
              <Text style={styles.statLabel}>
                {item.title}
              </Text>

              <Text style={styles.statValue}>
                {item.value ??
                  '—'}
              </Text>

              <Text
                onPress={() =>
                  onOpen(
                    item.screen,
                  )
                }
                style={styles.link}
              >
                Aç →
              </Text>
            </Card>
          ),
        )}
      </View>

      <Card style={styles.infoCard}>
        <Text style={styles.infoTitle}>
          Yetki Senkronizasyonu
        </Text>

        <Text style={styles.infoText}>
          Mobil uygulamadaki ekranlar
          web panelindeki paket ve
          personel yetkilerinizle aynı
          kuralları kullanır.
        </Text>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.md,
    paddingBottom: 110,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  statCard: {
    width: '48.5%',
    minHeight: 132,
  },
  statLabel: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '700',
  },
  statValue: {
    marginTop: 9,
    color: colors.text,
    fontSize: 30,
    fontWeight: '950',
  },
  link: {
    marginTop: 'auto',
    color: colors.accent,
    fontSize: 11,
    fontWeight: '900',
  },
  infoCard: {
    marginTop: 12,
  },
  infoTitle: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '900',
  },
  infoText: {
    marginTop: 6,
    color: colors.muted,
    fontSize: 11,
    lineHeight: 17,
  },
});
