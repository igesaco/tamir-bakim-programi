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
  Card,
  Empty,
  Message,
  ScreenTitle,
} from '../components/UI';
import {
  colors,
  spacing,
} from '../theme';

export default function InventoryScreen() {
  const { user } = useAuth();

  const [parts, setParts] =
    useState([]);

  const [stock, setStock] =
    useState([]);

  const [lowStock, setLowStock] =
    useState([]);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState('');

  async function load() {
    const requests = [
      api.get(
        '/inventory/parts',
      ),
    ];

    if (user?.branchId) {
      requests.push(
        api.get(
          '/inventory/stock',
          {
            params: {
              branchId:
                user.branchId,
            },
          },
        ),
        api.get(
          '/inventory/low-stock',
          {
            params: {
              branchId:
                user.branchId,
            },
          },
        ),
      );
    }

    const results =
      await Promise.all(
        requests,
      );

    setParts(
      results[0].data,
    );

    setStock(
      results[1]?.data || [],
    );

    setLowStock(
      results[2]?.data || [],
    );
  }

  useEffect(() => {
    load().catch((err) => {
      setError(
        err?.response?.data?.message ||
          'Stok verileri yüklenemedi.',
      );
    });
  }, [
    user?.branchId,
  ]);

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
        title="Stok"
        subtitle="Şubenizdeki parça ve kritik stok durumunu mobilde görüntüleyin."
      />

      <Message text={error} />

      <View style={styles.stats}>
        <Card style={styles.stat}>
          <Text style={styles.statLabel}>
            Parça
          </Text>
          <Text style={styles.statValue}>
            {parts.length}
          </Text>
        </Card>

        <Card style={styles.stat}>
          <Text style={styles.statLabel}>
            Stok Kalemi
          </Text>
          <Text style={styles.statValue}>
            {stock.length}
          </Text>
        </Card>

        <Card style={styles.stat}>
          <Text style={styles.statLabel}>
            Kritik
          </Text>
          <Text
            style={[
              styles.statValue,
              styles.danger,
            ]}
          >
            {lowStock.length}
          </Text>
        </Card>
      </View>

      <Text style={styles.sectionTitle}>
        Mevcut Stok
      </Text>

      <View style={styles.list}>
        {stock.map(
          (item) => (
            <Card key={item.id}>
              <View style={styles.row}>
                <View style={styles.flex}>
                  <Text style={styles.partName}>
                    {item.part?.name}
                  </Text>
                  <Text style={styles.meta}>
                    {item.part?.brand ||
                      'Marka yok'}
                  </Text>
                </View>

                <View style={styles.qtyWrap}>
                  <Text style={styles.qty}>
                    {Number(
                      item.quantity,
                    )}
                  </Text>
                  <Text style={styles.unit}>
                    {item.part?.unit ||
                      'ADET'}
                  </Text>
                </View>
              </View>
            </Card>
          ),
        )}

        {!stock.length ? (
          <Empty text="Şube stok kaydı bulunamadı." />
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
  stats: {
    flexDirection: 'row',
    gap: 8,
  },
  stat: {
    flex: 1,
    minHeight: 90,
  },
  statLabel: {
    color: colors.muted,
    fontSize: 9,
  },
  statValue: {
    marginTop: 8,
    color: colors.text,
    fontSize: 24,
    fontWeight: '900',
  },
  danger: {
    color: colors.danger,
  },
  sectionTitle: {
    marginTop: 18,
    marginBottom: 9,
    color: colors.text,
    fontSize: 14,
    fontWeight: '900',
  },
  list: {
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  flex: {
    flex: 1,
  },
  partName: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '800',
  },
  meta: {
    marginTop: 4,
    color: colors.muted,
    fontSize: 9,
  },
  qtyWrap: {
    alignItems: 'flex-end',
  },
  qty: {
    color: colors.accent,
    fontSize: 20,
    fontWeight: '900',
  },
  unit: {
    color: colors.muted,
    fontSize: 8,
  },
});
