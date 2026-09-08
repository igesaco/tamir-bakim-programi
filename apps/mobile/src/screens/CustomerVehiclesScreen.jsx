import {
  Image,
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
  mediaUrl,
} from '../media';
import {
  Empty,
  Loading,
  ScreenTitle,
} from '../components/UI';
import {
  colors,
  radius,
  spacing,
} from '../theme';

export default function CustomerVehiclesScreen({
  onSelect,
}) {
  const {
    customerRequest,
  } = useAuth();

  const [vehicles, setVehicles] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState('');

  useEffect(() => {
    customerRequest(
      '/customer-portal/vehicles',
    )
      .then(setVehicles)
      .catch((err) =>
        setError(
          err?.message ||
            'Araçlar yüklenemedi.',
        ),
      )
      .finally(() =>
        setLoading(false),
      );
  }, []);

  return (
    <ScrollView
      contentContainerStyle={
        styles.content
      }
    >
      <ScreenTitle
        title="Araçlarım"
        subtitle="Servis kayıtlarınızdaki araçlar otomatik olarak burada görünür."
      />

      {error ? (
        <Empty text={error} />
      ) : loading ? (
        <Loading />
      ) : vehicles.length ? (
        <View style={styles.list}>
          {vehicles.map(
            (vehicle) => (
              <Pressable
                key={vehicle.id}
                onPress={() =>
                  onSelect(
                    vehicle.id,
                  )
                }
                style={({ pressed }) => [
                  styles.card,
                  pressed &&
                    styles.pressed,
                ]}
              >
                {vehicle.media?.[0] ? (
                  <Image
                    source={{
                      uri:
                        mediaUrl(
                          vehicle.media[0],
                        ),
                    }}
                    style={styles.thumb}
                  />
                ) : (
                  <View style={styles.thumbPlaceholder}>
                    <Text style={styles.thumbPlaceholderText}>
                      TB
                    </Text>
                  </View>
                )}

                <View style={styles.flex}>
                  <Text style={styles.plate}>
                    {vehicle.plate}
                  </Text>

                  <Text style={styles.vehicle}>
                    {vehicle.brand}{' '}
                    {vehicle.model}
                    {vehicle.modelYear
                      ? ` · ${vehicle.modelYear}`
                      : ''}
                  </Text>

                  <Text style={styles.km}>
                    Son kayıtlı KM:{' '}
                    {Number(
                      vehicle.mileage ||
                        0,
                    ).toLocaleString(
                      'tr-TR',
                    )}
                  </Text>
                </View>

                <Text style={styles.arrow}>
                  →
                </Text>
              </Pressable>
            ),
          )}
        </View>
      ) : (
        <Empty text="Hesabınıza bağlı araç bulunmuyor." />
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
      gap: 10,
    },
    card: {
      minHeight: 104,
      padding: 16,
      flexDirection: 'row',
      alignItems:
        'center',
      justifyContent:
        'space-between',
      gap: 14,
      borderWidth: 1,
      borderColor:
        colors.border,
      borderRadius:
        radius.md,
      backgroundColor:
        colors.panel,
    },
    pressed: {
      opacity: .8,
    },
    thumb: {
      width: 68,
      height: 68,
      borderRadius: 11,
      backgroundColor:
        colors.panel2,
    },
    thumbPlaceholder: {
      width: 68,
      height: 68,
      alignItems: 'center',
      justifyContent:
        'center',
      borderRadius: 11,
      backgroundColor:
        colors.accentSoft,
    },
    thumbPlaceholderText: {
      color:
        colors.accent,
      fontSize: 13,
      fontWeight: '900',
    },
    flex: {
      flex: 1,
    },
    plate: {
      color: colors.text,
      fontSize: 20,
      fontWeight: '950',
    },
    vehicle: {
      marginTop: 4,
      color: colors.muted,
      fontSize: 11,
    },
    km: {
      marginTop: 10,
      color:
        colors.accent,
      fontSize: 10,
      fontWeight: '800',
    },
    arrow: {
      color:
        colors.accent,
      fontSize: 22,
      fontWeight: '900',
    },
  });
