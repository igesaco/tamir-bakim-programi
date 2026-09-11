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
  useState,
} from 'react';

import api from '../api/client';
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

export default function NotificationsScreen() {
  const [items, setItems] =
    useState([]);
  const [refreshing, setRefreshing] =
    useState(false);
  const [error, setError] =
    useState('');

  useLiveRefresh(() => load());

  async function load() {
    const response =
      await api.get(
        '/notifications',
      );

    setItems(
      response.data,
    );
  }

  useEffect(() => {
    load().catch((err) => {
      setError(
        err?.response?.data?.message ||
          'Bildirimler yüklenemedi.',
      );
    });
  }, []);

  async function markRead(
    item,
  ) {
    if (
      item.status ===
      'READ'
    ) {
      return;
    }

    try {
      await api.patch(
        `/notifications/${item.id}/read`,
      );

      setItems(
        (current) =>
          current.map(
            (row) =>
              row.id === item.id
                ? {
                    ...row,
                    status: 'READ',
                    readAt:
                      new Date().toISOString(),
                  }
                : row,
          ),
      );
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          'Bildirim güncellenemedi.',
      );
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
        title="Bildirimler"
        subtitle="Servis, atama ve işletme bildirimlerinizi buradan takip edin."
      />

      <Message text={error} />

      <View style={styles.list}>
        {items.map(
          (item) => (
            <Card
              key={item.id}
              style={
                item.status !==
                'READ'
                  ? styles.unread
                  : null
              }
            >
              <Text style={styles.channel}>
                {item.channel}
              </Text>

              <Text style={styles.title}>
                {item.title}
              </Text>

              <Text style={styles.message}>
                {item.message}
              </Text>

              <View style={styles.footer}>
                <Text style={styles.date}>
                  {new Date(
                    item.createdAt,
                  ).toLocaleString(
                    'tr-TR',
                  )}
                </Text>

                {item.status !==
                'READ' ? (
                  <Text
                    onPress={() =>
                      markRead(
                        item,
                      )
                    }
                    style={styles.read}
                  >
                    Okundu yap
                  </Text>
                ) : (
                  <Text style={styles.done}>
                    Okundu
                  </Text>
                )}
              </View>
            </Card>
          ),
        )}

        {!items.length ? (
          <Empty text="Yeni bildirim yok." />
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
  list: {
    gap: 8,
  },
  unread: {
    borderColor:
      '#77551c',
    backgroundColor:
      '#18160f',
  },
  channel: {
    color: colors.accent,
    fontSize: 8,
    fontWeight: '900',
  },
  title: {
    marginTop: 5,
    color: colors.text,
    fontSize: 13,
    fontWeight: '900',
  },
  message: {
    marginTop: 6,
    color: colors.muted,
    fontSize: 10,
    lineHeight: 16,
  },
  footer: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent:
      'space-between',
  },
  date: {
    color: '#66717b',
    fontSize: 8,
  },
  read: {
    color: colors.accent,
    fontSize: 9,
    fontWeight: '900',
  },
  done: {
    color: colors.success,
    fontSize: 9,
    fontWeight: '800',
  },
});
