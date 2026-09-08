import {
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  useMemo,
  useState,
} from 'react';

import { useAuth } from './auth/AuthContext';
import {
  canUse,
} from './permissions';
import HomeScreen from './screens/HomeScreen';
import CustomersScreen from './screens/CustomersScreen';
import WorkOrdersScreen from './screens/WorkOrdersScreen';
import InventoryScreen from './screens/InventoryScreen';
import CashierScreen from './screens/CashierScreen';
import AccountScreen from './screens/AccountScreen';
import {
  colors,
} from './theme';

const screenConfig = {
  home: {
    label: 'Ana Sayfa',
    glyph: '⌂',
  },
  customers: {
    label: 'Müşteri',
    glyph: 'M',
  },
  orders: {
    label: 'İşler',
    glyph: 'İ',
  },
  inventory: {
    label: 'Stok',
    glyph: 'S',
  },
  cashier: {
    label: 'Kasa',
    glyph: '₺',
  },
  account: {
    label: 'Hesabım',
    glyph: 'H',
  },
};

export default function AppShell() {
  const { user } = useAuth();

  const tabs =
    useMemo(() => {
      const result = [
        'home',
      ];

      if (
        canUse(user, {
          feature: 'CUSTOMERS',
          permission:
            'CUSTOMER_VIEW',
        })
      ) {
        result.push(
          'customers',
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
        result.push(
          'orders',
        );
      }

      if (
        canUse(user, {
          feature:
            'INVENTORY',
          permission:
            'INVENTORY_VIEW',
        })
      ) {
        result.push(
          'inventory',
        );
      }

      if (
        canUse(user, {
          feature: 'CASHIER',
          permission:
            'CASHIER_VIEW',
        })
      ) {
        result.push(
          'cashier',
        );
      }

      result.push(
        'account',
      );

      return result;
    }, [
      user?.id,
      user?.features,
      user?.permissions,
    ]);

  const defaultScreen =
    user?.role === 'WAREHOUSE' &&
    tabs.includes('inventory')
      ? 'inventory'
      : user?.role === 'ACCOUNTING' &&
          tabs.includes('cashier')
        ? 'cashier'
        : user?.role === 'TECHNICIAN' &&
            tabs.includes('orders')
          ? 'orders'
          : 'home';

  const [screen, setScreen] =
    useState(defaultScreen);

  function open(
    target,
  ) {
    if (
      tabs.includes(target)
    ) {
      setScreen(target);
    }
  }

  let content = (
    <HomeScreen
      onOpen={open}
    />
  );

  if (screen === 'customers') {
    content =
      <CustomersScreen />;
  }

  if (screen === 'orders') {
    content =
      <WorkOrdersScreen />;
  }

  if (screen === 'inventory') {
    content =
      <InventoryScreen />;
  }

  if (screen === 'cashier') {
    content =
      <CashierScreen />;
  }

  if (screen === 'account') {
    content =
      <AccountScreen />;
  }

  return (
    <SafeAreaView style={styles.page}>
      <View style={styles.content}>
        {content}
      </View>

      <View style={styles.nav}>
        {tabs.map(
          (key) => {
            const item =
              screenConfig[key];

            const active =
              screen === key;

            return (
              <Pressable
                key={key}
                onPress={() =>
                  setScreen(key)
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
                    {item.glyph}
                  </Text>
                </View>

                <Text
                  style={[
                    styles.navLabel,
                    active &&
                      styles.navLabelActive,
                  ]}
                >
                  {item.label}
                </Text>
              </Pressable>
            );
          },
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    flex: 1,
  },
  nav: {
    position: 'absolute',
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
    justifyContent: 'center',
    gap: 3,
  },
  glyph: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9,
    backgroundColor:
      colors.panel2,
  },
  glyphActive: {
    backgroundColor:
      colors.accentSoft,
  },
  glyphText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '900',
  },
  glyphTextActive: {
    color: colors.accent,
  },
  navLabel: {
    color: colors.muted,
    fontSize: 8,
    fontWeight: '700',
  },
  navLabelActive: {
    color: colors.text,
  },
});
