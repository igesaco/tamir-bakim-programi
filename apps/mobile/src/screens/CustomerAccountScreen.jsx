import {
  ScrollView,
  StyleSheet,
  Text,
} from 'react-native';

import {
  useAuth,
} from '../auth/AuthContext';
import {
  Button,
  Card,
  ScreenTitle,
} from '../components/UI';
import {
  colors,
  spacing,
} from '../theme';

export default function CustomerAccountScreen() {
  const {
    customer,
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
        subtitle="Müşteri hesabı ve mobil oturum."
      />

      <Card>
        <Text style={styles.name}>
          {customer?.firstName}{' '}
          {customer?.lastName}
        </Text>

        <Text style={styles.label}>
          KAYITLI TELEFON
        </Text>

        <Text style={styles.value}>
          {customer?.phone || '-'}
        </Text>

        <Text style={styles.info}>
          Servis kaydınıza bağlı araçlar
          otomatik olarak Araçlarım
          ekranında görünür.
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

const styles =
  StyleSheet.create({
    content: {
      padding:
        spacing.md,
      paddingBottom: 110,
      gap: 10,
    },
    name: {
      color: colors.text,
      fontSize: 21,
      fontWeight: '950',
    },
    label: {
      marginTop: 16,
      color: colors.muted,
      fontSize: 9,
      fontWeight: '800',
      letterSpacing: .8,
    },
    value: {
      marginTop: 4,
      color: colors.text,
      fontSize: 13,
      fontWeight: '800',
    },
    info: {
      marginTop: 12,
      color: colors.muted,
      fontSize: 10,
      lineHeight: 17,
    },
  });
