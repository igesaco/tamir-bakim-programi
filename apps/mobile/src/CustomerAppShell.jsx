import {
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  useState,
} from 'react';

import {
  useAuth,
} from './auth/AuthContext';
import CustomerHomeScreen from './screens/CustomerHomeScreen';
import CustomerVehiclesScreen from './screens/CustomerVehiclesScreen';
import CustomerVehicleDetailScreen from './screens/CustomerVehicleDetailScreen';
import CustomerAccountScreen from './screens/CustomerAccountScreen';
import CustomerNotificationsScreen from './screens/CustomerNotificationsScreen';
import {
  colors,
} from './theme';

const tabs = [
  {
    key: 'home',
    label: 'Ana Sayfa',
    glyph: '⌂',
  },
  {
    key: 'vehicles',
    label: 'Araçlarım',
    glyph: 'A',
  },
  {
    key: 'notifications',
    label: 'Bildirimler',
    glyph: 'B',
  },
  {
    key: 'account',
    label: 'Hesabım',
    glyph: 'H',
  },
];

export default function CustomerAppShell({
  openInitialVehicle = false,
}) {
  const {
    customerData,
  } = useAuth();

  const initialVehicleId =
    openInitialVehicle
      ? customerData?.vehicle?.id
      : null;

  const [screen, setScreen] =
    useState(
      initialVehicleId
        ? 'vehicle-detail'
        : 'home',
    );

  const [
    selectedVehicleId,
    setSelectedVehicleId,
  ] = useState(
    initialVehicleId,
  );

  function openVehicle(
    vehicleId,
  ) {
    setSelectedVehicleId(
      vehicleId,
    );
    setScreen(
      'vehicle-detail',
    );
  }

  let content = (
    <CustomerHomeScreen
      onOpenVehicles={() =>
        setScreen(
          'vehicles',
        )
      }
    />
  );

  if (
    screen ===
    'vehicles'
  ) {
    content = (
      <CustomerVehiclesScreen
        onSelect={
          openVehicle
        }
      />
    );
  }

  if (
    screen ===
      'vehicle-detail' &&
    selectedVehicleId
  ) {
    content = (
      <CustomerVehicleDetailScreen
        vehicleId={
          selectedVehicleId
        }
        onBack={() =>
          setScreen(
            'vehicles',
          )
        }
      />
    );
  }

  if (
    screen ===
    'notifications'
  ) {
    content = (
      <CustomerNotificationsScreen />
    );
  }

  if (
    screen ===
    'account'
  ) {
    content = (
      <CustomerAccountScreen />
    );
  }

  return (
    <SafeAreaView style={styles.page}>
      <View style={styles.content}>
        {content}
      </View>

      <View style={styles.nav}>
        {tabs.map(
          (tab) => {
            const active =
              screen ===
                tab.key ||
              (
                tab.key ===
                  'vehicles' &&
                screen ===
                  'vehicle-detail'
              );

            return (
              <Pressable
                key={tab.key}
                onPress={() =>
                  setScreen(
                    tab.key,
                  )
                }
                style={styles.navItem}
              >
                <View
                  style={[
                    styles.glyph,
                    active &&
                      styles.glyphActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.glyphText,
                      active &&
                        styles.glyphTextActive,
                    ]}
                  >
                    {tab.glyph}
                  </Text>
                </View>

                <Text
                  style={[
                    styles.navLabel,
                    active &&
                      styles.navLabelActive,
                  ]}
                >
                  {tab.label}
                </Text>
              </Pressable>
            );
          },
        )}
      </View>
    </SafeAreaView>
  );
}

const styles =
  StyleSheet.create({
    page: {
      flex: 1,
      backgroundColor:
        colors.bg,
    },
    content: {
      flex: 1,
    },
    nav: {
      position:
        'absolute',
      left: 10,
      right: 10,
      bottom: 10,
      minHeight: 66,
      paddingHorizontal: 6,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent:
        'space-around',
      borderWidth: 1,
      borderColor:
        colors.border,
      borderRadius: 18,
      backgroundColor:
        'rgba(18,24,30,.98)',
    },
    navItem: {
      flex: 1,
      alignItems: 'center',
      justifyContent:
        'center',
      gap: 3,
    },
    glyph: {
      width: 30,
      height: 30,
      alignItems: 'center',
      justifyContent:
        'center',
      borderRadius: 9,
      backgroundColor:
        colors.panel2,
    },
    glyphActive: {
      backgroundColor:
        colors.accentSoft,
    },
    glyphText: {
      color:
        colors.muted,
      fontSize: 12,
      fontWeight: '900',
    },
    glyphTextActive: {
      color:
        colors.accent,
    },
    navLabel: {
      color:
        colors.muted,
      fontSize: 8,
      fontWeight: '700',
    },
    navLabelActive: {
      color: colors.text,
    },
  });
