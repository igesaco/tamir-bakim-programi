import {
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import {
  API_URL,
  apiRequest,
} from './src/api';

const roleLabels = {
  OWNER: 'Kurucu',
  MANAGER: 'Yönetici',
  SERVICE_ADVISOR:
    'Servis Danışmanı',
  TECHNICIAN:
    'Teknik Bakım Personeli',
};

function Login({
  onLogin,
}) {
  const [email, setEmail] =
    useState('');
  const [password, setPassword] =
    useState('');
  const [busy, setBusy] =
    useState(false);
  const [error, setError] =
    useState('');

  async function submit() {
    if (!email || !password) {
      setError(
        'E-posta ve şifre gerekli.',
      );
      return;
    }

    setBusy(true);
    setError('');

    try {
      const result =
        await apiRequest(
          '/auth/login',
          {
            method: 'POST',
            body: {
              email,
              password,
            },
          },
        );

      onLogin(
        result.token,
        result.user,
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <SafeAreaView
      style={styles.screen}
    >
      <StatusBar
        barStyle="light-content"
      />

      <View
        style={
          styles.loginContainer
        }
      >
        <Text
          style={styles.eyebrow}
        >
          TAMİR BAKIM
        </Text>

        <Text
          style={styles.loginTitle}
        >
          Mobil Servis Paneli
        </Text>

        <Text
          style={styles.muted}
        >
          Mevcut personel hesabınızla
          giriş yapın.
        </Text>

        <View
          style={styles.form}
        >
          <TextInput
            style={styles.input}
            placeholder="E-posta"
            placeholderTextColor="#6f7780"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />

          <TextInput
            style={styles.input}
            placeholder="Şifre"
            placeholderTextColor="#6f7780"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          {error ? (
            <Text
              style={styles.error}
            >
              {error}
            </Text>
          ) : null}

          <Pressable
            style={styles.primaryButton}
            onPress={submit}
            disabled={busy}
          >
            {busy ? (
              <ActivityIndicator
                color="#121212"
              />
            ) : (
              <Text
                style={
                  styles.primaryButtonText
                }
              >
                Giriş Yap
              </Text>
            )}
          </Pressable>
        </View>

        <Text
          style={styles.apiText}
        >
          API: {API_URL}
        </Text>
      </View>
    </SafeAreaView>
  );
}

function StatCard({
  label,
  value,
}) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statLabel}>
        {label}
      </Text>

      <Text style={styles.statValue}>
        {value}
      </Text>
    </View>
  );
}

function CustomerCard({
  customer,
}) {
  return (
    <View
      style={styles.listCard}
    >
      <View style={styles.listMain}>
        <Text style={styles.listTitle}>
          {customer.firstName}{' '}
          {customer.lastName}
        </Text>

        <Text style={styles.muted}>
          {customer.phone ||
            'Telefon yok'}
        </Text>

        <Text
          style={styles.listMeta}
        >
          {customer.branch?.name ||
            'Şube yok'}
        </Text>
      </View>

      <View style={styles.countBadge}>
        <Text
          style={styles.countBadgeText}
        >
          {customer.vehicles?.length ||
            0}{' '}
          araç
        </Text>
      </View>
    </View>
  );
}

function OrderCard({
  order,
}) {
  return (
    <View
      style={styles.listCard}
    >
      <View style={styles.listMain}>
        <Text style={styles.listTitle}>
          {order.orderNumber}
        </Text>

        <Text style={styles.muted}>
          {order.vehicle?.plate ||
            '-'}
          {' · '}
          {order.customer?.firstName ||
            ''}
          {' '}
          {order.customer?.lastName ||
            ''}
        </Text>

        <Text
          style={styles.listMeta}
        >
          {order.complaint ||
            'Şikayet bilgisi yok'}
        </Text>
      </View>

      <View style={styles.statusBadge}>
        <Text
          style={styles.statusBadgeText}
        >
          {order.status}
        </Text>
      </View>
    </View>
  );
}

function MobileApp({
  token,
  initialUser,
  onLogout,
}) {
  const [user, setUser] =
    useState(initialUser);
  const [customers, setCustomers] =
    useState([]);
  const [orders, setOrders] =
    useState([]);
  const [activeTab, setActiveTab] =
    useState('home');
  const [loading, setLoading] =
    useState(true);
  const [error, setError] =
    useState('');

  const canSeeCustomers =
    user?.role !==
    'TECHNICIAN';

  async function load() {
    setLoading(true);
    setError('');

    try {
      const me =
        await apiRequest(
          '/users/me',
          { token },
        );

      setUser(me);

      const requests = [
        apiRequest(
          '/service-orders',
          { token },
        ),
      ];

      if (me.role !==
        'TECHNICIAN') {
        requests.push(
          apiRequest(
            '/customers',
            { token },
          ),
        );
      }

      const response =
        await Promise.all(
          requests,
        );

      setOrders(
        response[0] || [],
      );

      setCustomers(
        me.role !==
          'TECHNICIAN'
          ? response[1] || []
          : [],
      );
    } catch (err) {
      if (err.status === 401) {
        onLogout();
        return;
      }

      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const openOrders =
    useMemo(
      () =>
        orders.filter(
          (order) =>
            ![
              'DELIVERED',
              'CANCELLED',
            ].includes(
              order.status,
            ),
        ),
      [orders],
    );

  return (
    <SafeAreaView
      style={styles.screen}
    >
      <StatusBar
        barStyle="light-content"
      />

      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>
            TAMİR BAKIM
          </Text>

          <Text style={styles.headerTitle}>
            {user?.firstName}{' '}
            {user?.lastName}
          </Text>

          <Text style={styles.muted}>
            {roleLabels[user?.role] ||
              user?.role}
          </Text>
        </View>

        <Pressable
          style={
            styles.secondaryButton
          }
          onPress={onLogout}
        >
          <Text
            style={
              styles.secondaryButtonText
            }
          >
            Çıkış
          </Text>
        </Pressable>
      </View>

      <View style={styles.tabs}>
        <Pressable
          style={[
            styles.tab,
            activeTab === 'home' &&
              styles.tabActive,
          ]}
          onPress={() =>
            setActiveTab('home')
          }
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'home' &&
                styles.tabTextActive,
            ]}
          >
            Özet
          </Text>
        </Pressable>

        {canSeeCustomers && (
          <Pressable
            style={[
              styles.tab,
              activeTab ===
                'customers' &&
                styles.tabActive,
            ]}
            onPress={() =>
              setActiveTab(
                'customers',
              )
            }
          >
            <Text
              style={[
                styles.tabText,
                activeTab ===
                  'customers' &&
                  styles.tabTextActive,
              ]}
            >
              Müşteriler
            </Text>
          </Pressable>
        )}

        <Pressable
          style={[
            styles.tab,
            activeTab === 'orders' &&
              styles.tabActive,
          ]}
          onPress={() =>
            setActiveTab('orders')
          }
        >
          <Text
            style={[
              styles.tabText,
              activeTab ===
                'orders' &&
                styles.tabTextActive,
            ]}
          >
            İşler
          </Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={
          styles.content
        }
      >
        {loading ? (
          <ActivityIndicator
            color="#f59e0b"
            size="large"
          />
        ) : null}

        {error ? (
          <Text style={styles.error}>
            {error}
          </Text>
        ) : null}

        {!loading &&
        activeTab === 'home' ? (
          <>
            <View style={styles.stats}>
              {canSeeCustomers && (
                <StatCard
                  label="Müşteri"
                  value={
                    customers.length
                  }
                />
              )}

              <StatCard
                label="Açık İş"
                value={
                  openOrders.length
                }
              />

              <StatCard
                label="Toplam İş"
                value={
                  orders.length
                }
              />
            </View>

            <Text
              style={styles.sectionTitle}
            >
              Son İş Emirleri
            </Text>

            {orders
              .slice(0, 8)
              .map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                />
              ))}
          </>
        ) : null}

        {!loading &&
        activeTab ===
          'customers' ? (
          <>
            <Text
              style={styles.sectionTitle}
            >
              Müşteriler
            </Text>

            {customers.map(
              (customer) => (
                <CustomerCard
                  key={customer.id}
                  customer={
                    customer
                  }
                />
              ),
            )}

            {!customers.length && (
              <Text
                style={styles.muted}
              >
                Müşteri bulunmuyor.
              </Text>
            )}
          </>
        ) : null}

        {!loading &&
        activeTab === 'orders' ? (
          <>
            <Text
              style={styles.sectionTitle}
            >
              İş Emirleri
            </Text>

            {orders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
              />
            ))}

            {!orders.length && (
              <Text
                style={styles.muted}
              >
                İş emri bulunmuyor.
              </Text>
            )}
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

export default function App() {
  const [token, setToken] =
    useState(null);
  const [user, setUser] =
    useState(null);

  function login(
    nextToken,
    nextUser,
  ) {
    setToken(nextToken);
    setUser(nextUser);
  }

  function logout() {
    setToken(null);
    setUser(null);
  }

  if (!token) {
    return (
      <Login onLogin={login} />
    );
  }

  return (
    <MobileApp
      token={token}
      initialUser={user}
      onLogout={logout}
    />
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#0b0e11',
  },
  loginContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  eyebrow: {
    color: '#f59e0b',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.8,
  },
  loginTitle: {
    marginTop: 8,
    color: '#fff',
    fontSize: 30,
    fontWeight: '900',
  },
  muted: {
    marginTop: 5,
    color: '#7f8790',
    fontSize: 12,
  },
  form: {
    marginTop: 28,
    gap: 10,
  },
  input: {
    paddingHorizontal: 15,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#2c333a',
    borderRadius: 11,
    backgroundColor: '#11151a',
    color: '#fff',
  },
  primaryButton: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 5,
    borderRadius: 11,
    backgroundColor: '#f59e0b',
  },
  primaryButtonText: {
    color: '#111',
    fontWeight: '900',
  },
  secondaryButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#30373e',
    borderRadius: 10,
  },
  secondaryButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  error: {
    padding: 12,
    borderRadius: 9,
    backgroundColor: '#321a1a',
    color: '#f3a1a1',
    fontSize: 12,
  },
  apiText: {
    marginTop: 20,
    color: '#454c53',
    fontSize: 9,
  },
  header: {
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent:
      'space-between',
    borderBottomWidth: 1,
    borderBottomColor:
      '#20262c',
  },
  headerTitle: {
    marginTop: 4,
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
  },
  tabs: {
    flexDirection: 'row',
    gap: 7,
    padding: 10,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 9,
    backgroundColor: '#11151a',
  },
  tabActive: {
    backgroundColor: '#f59e0b',
  },
  tabText: {
    color: '#858e97',
    fontSize: 11,
    fontWeight: '800',
  },
  tabTextActive: {
    color: '#111',
  },
  content: {
    padding: 14,
    paddingBottom: 40,
  },
  stats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 9,
  },
  statCard: {
    minWidth: 100,
    flexGrow: 1,
    padding: 15,
    borderWidth: 1,
    borderColor: '#242b32',
    borderRadius: 12,
    backgroundColor: '#11151a',
  },
  statLabel: {
    color: '#747d86',
    fontSize: 10,
    textTransform: 'uppercase',
  },
  statValue: {
    marginTop: 8,
    color: '#fff',
    fontSize: 23,
    fontWeight: '900',
  },
  sectionTitle: {
    marginTop: 22,
    marginBottom: 10,
    color: '#fff',
    fontSize: 16,
    fontWeight: '900',
  },
  listCard: {
    marginBottom: 9,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent:
      'space-between',
    gap: 12,
    borderWidth: 1,
    borderColor: '#242b32',
    borderRadius: 12,
    backgroundColor: '#11151a',
  },
  listMain: {
    flex: 1,
  },
  listTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
  },
  listMeta: {
    marginTop: 6,
    color: '#59616a',
    fontSize: 10,
  },
  countBadge: {
    paddingHorizontal: 9,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#201b12',
  },
  countBadgeText: {
    color: '#f59e0b',
    fontSize: 10,
    fontWeight: '800',
  },
  statusBadge: {
    maxWidth: 110,
    paddingHorizontal: 9,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#1b2127',
  },
  statusBadgeText: {
    color: '#d0d5da',
    fontSize: 9,
    fontWeight: '800',
    textAlign: 'center',
  },
});
