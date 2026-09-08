import {
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { useAuth } from '../auth/AuthContext';
import {
  Button,
  Card,
  ScreenTitle,
} from '../components/UI';
import {
  colors,
  spacing,
} from '../theme';

const roleLabels = {
  OWNER: 'Kurucu',
  MANAGER: 'Yönetici',
  SERVICE_ADVISOR:
    'Servis Danışmanı',
  TECHNICIAN:
    'Teknik Bakım Personeli',
  WAREHOUSE:
    'Depo / Stok Personeli',
  ACCOUNTING:
    'Muhasebe / Kasa',
};

export default function AccountScreen() {
  const {
    user,
    logout,
  } = useAuth();

  return (
    <ScrollView
      contentContainerStyle={
        styles.content
      }
    >
      <ScreenTitle
        title="Hesabım"
        subtitle="Mobil oturum, rol ve paket bilgileri."
      />

      <Card>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user?.firstName
              ?.charAt(0)
              ?.toUpperCase() ||
              '?'}
          </Text>
        </View>

        <Text style={styles.name}>
          {user?.firstName}{' '}
          {user?.lastName}
        </Text>

        <Text style={styles.email}>
          {user?.email}
        </Text>

        <View style={styles.meta}>
          <Text style={styles.metaText}>
            {roleLabels[
              user?.role
            ] ||
              user?.role}
          </Text>

          <Text style={styles.metaText}>
            {user?.organization
              ?.name ||
              'İşletme'}
          </Text>

          <Text style={styles.metaText}>
            {user?.branch?.name ||
              'Şube yok'}
          </Text>
        </View>
      </Card>

      <Card style={styles.security}>
        <Text style={styles.securityTitle}>
          Güvenli Oturum
        </Text>

        <Text style={styles.securityText}>
          Oturum anahtarı cihazın
          güvenli anahtar deposunda
          saklanır.
        </Text>
      </Card>

      <Button
        title="Çıkış Yap"
        tone="danger"
        onPress={logout}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.md,
    paddingBottom: 110,
  },
  avatar: {
    width: 58,
    height: 58,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    backgroundColor:
      colors.accentSoft,
  },
  avatarText: {
    color: colors.accent,
    fontSize: 20,
    fontWeight: '900',
  },
  name: {
    marginTop: 14,
    color: colors.text,
    fontSize: 21,
    fontWeight: '900',
  },
  email: {
    marginTop: 4,
    color: colors.muted,
    fontSize: 11,
  },
  meta: {
    marginTop: 14,
    gap: 6,
  },
  metaText: {
    color: '#aab3bc',
    fontSize: 10,
  },
  security: {
    marginVertical: 10,
  },
  securityTitle: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '900',
  },
  securityText: {
    marginTop: 5,
    color: colors.muted,
    fontSize: 10,
    lineHeight: 16,
  },
});
