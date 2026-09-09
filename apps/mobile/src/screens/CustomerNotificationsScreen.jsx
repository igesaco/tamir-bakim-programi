import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  useEffect,
  useState,
} from 'react';

import {
  useAuth,
} from '../auth/AuthContext';
import {
  Card,
  Empty,
  Loading,
  ScreenTitle,
} from '../components/UI';
import {
  colors,
  spacing,
} from '../theme';

export default function CustomerNotificationsScreen() {
  const {
    customerRequest,
  } = useAuth();

  const [items, setItems] =
    useState([]);
  const [loading, setLoading] =
    useState(true);
  const [error, setError] =
    useState('');

  async function load() {
    const data =
      await customerRequest(
        '/customer-portal/notifications',
      );

    setItems(
      data || [],
    );
  }

  useEffect(() => {
    load()
      .catch((err) =>
        setError(
          err?.message ||
            'Bildirimler yüklenemedi.',
        ),
      )
      .finally(() =>
        setLoading(false),
      );
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
      await customerRequest(
        `/customer-portal/notifications/${item.id}/read`,
        {
          method: 'POST',
        },
      );

      setItems(
        (current) =>
          current.map(
            (entry) =>
              entry.id ===
              item.id
                ? {
                    ...entry,
                    status:
                      'READ',
                    readAt:
                      new Date().toISOString(),
                  }
                : entry,
          ),
      );
    } catch {
      // Okuma işareti kritik değildir.
    }
  }

  return (
    <ScrollView
      contentContainerStyle={
        styles.content
      }
    >
      <ScreenTitle
        title="Bildirimler"
        subtitle="Servis aşamaları, ödeme ve teslim bilgileri."
      />

      {loading ? (
        <Loading />
      ) : error ? (
        <Empty text={error} />
      ) : items.length ? (
        <View style={styles.list}>
          {items.map(
            (item) => {
              const unread =
                item.status !==
                'READ';

              return (
                <Pressable
                  key={item.id}
                  onPress={() =>
                    markRead(
                      item,
                    )
                  }
                >
                  <Card
                    style={[
                      styles.card,
                      unread &&
                        styles.unreadCard,
                    ]}
                  >
                    <View style={styles.topRow}>
                      <Text style={styles.title}>
                        {item.title}
                      </Text>

                      {unread ? (
                        <View style={styles.dot} />
                      ) : null}
                    </View>

                    <Text style={styles.message}>
                      {item.message}
                    </Text>

                    <Text style={styles.date}>
                      {new Date(
                        item.createdAt,
                      ).toLocaleString(
                        'tr-TR',
                      )}
                    </Text>
                  </Card>
                </Pressable>
              );
            },
          )}
        </View>
      ) : (
        <Empty text="Henüz bildiriminiz bulunmuyor." />
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
    list: {
      gap: 8,
    },
    card: {
      backgroundColor:
        colors.panel,
    },
    unreadCard: {
      borderColor:
        '#694c17',
      backgroundColor:
        '#18150f',
    },
    topRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent:
        'space-between',
      gap: 10,
    },
    title: {
      flex: 1,
      color: colors.text,
      fontSize: 12,
      fontWeight: '900',
    },
    dot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor:
        colors.accent,
    },
    message: {
      marginTop: 7,
      color: colors.muted,
      fontSize: 10,
      lineHeight: 16,
    },
    date: {
      marginTop: 9,
      color: '#697580',
      fontSize: 8,
    },
  });
