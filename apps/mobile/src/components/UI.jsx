import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import {
  colors,
  radius,
  spacing,
} from '../theme';

export function ScreenTitle({
  title,
  subtitle,
}) {
  return (
    <View style={styles.titleWrap}>
      <Text style={styles.title}>
        {title}
      </Text>

      {subtitle ? (
        <Text style={styles.subtitle}>
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}

export function Card({
  children,
  style,
}) {
  return (
    <View
      style={[
        styles.card,
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function Field({
  label,
  style,
  ...props
}) {
  return (
    <View style={styles.fieldWrap}>
      {label ? (
        <Text style={styles.fieldLabel}>
          {label}
        </Text>
      ) : null}

      <TextInput
        placeholderTextColor="#66717c"
        style={[
          styles.input,
          style,
        ]}
        {...props}
      />
    </View>
  );
}

export function Button({
  title,
  onPress,
  disabled,
  tone = 'accent',
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        tone === 'ghost' &&
          styles.buttonGhost,
        tone === 'danger' &&
          styles.buttonDanger,
        disabled &&
          styles.buttonDisabled,
        pressed &&
          styles.buttonPressed,
      ]}
    >
      <Text
        style={[
          styles.buttonText,
          tone === 'ghost' &&
            styles.buttonGhostText,
        ]}
      >
        {title}
      </Text>
    </Pressable>
  );
}

export function Loading({
  label = 'Yükleniyor...',
}) {
  return (
    <View style={styles.loading}>
      <ActivityIndicator
        color={colors.accent}
      />
      <Text style={styles.loadingText}>
        {label}
      </Text>
    </View>
  );
}

export function Message({
  text,
  tone = 'error',
}) {
  if (!text) {
    return null;
  }

  return (
    <View
      style={[
        styles.message,
        tone === 'success' &&
          styles.messageSuccess,
      ]}
    >
      <Text style={styles.messageText}>
        {text}
      </Text>
    </View>
  );
}

export function Empty({
  text,
}) {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyText}>
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  titleWrap: {
    marginBottom:
      spacing.md,
  },
  title: {
    color: colors.text,
    fontSize: 26,
    fontWeight: '900',
  },
  subtitle: {
    marginTop: 5,
    color: colors.muted,
    fontSize: 12,
    lineHeight: 18,
  },
  card: {
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.panel,
  },
  fieldWrap: {
    marginBottom: 12,
  },
  fieldLabel: {
    marginBottom: 6,
    color: '#aab4bd',
    fontSize: 11,
    fontWeight: '700',
  },
  input: {
    minHeight: 46,
    paddingHorizontal: 13,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    backgroundColor: '#0e1419',
    color: colors.text,
    fontSize: 14,
  },
  button: {
    minHeight: 46,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.sm,
    backgroundColor: colors.accent,
  },
  buttonGhost: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.panel2,
  },
  buttonDanger: {
    backgroundColor: '#8b3434',
  },
  buttonDisabled: {
    opacity: 0.48,
  },
  buttonPressed: {
    opacity: 0.82,
  },
  buttonText: {
    color: '#171108',
    fontSize: 13,
    fontWeight: '900',
  },
  buttonGhostText: {
    color: colors.text,
  },
  loading: {
    minHeight: 160,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  loadingText: {
    color: colors.muted,
    fontSize: 12,
  },
  message: {
    marginBottom: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#6a3434',
    borderRadius: radius.sm,
    backgroundColor: '#281616',
  },
  messageSuccess: {
    borderColor: '#2e6243',
    backgroundColor: '#13251b',
  },
  messageText: {
    color: colors.text,
    fontSize: 11,
    lineHeight: 17,
  },
  empty: {
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
    borderRadius: radius.md,
  },
  emptyText: {
    color: colors.muted,
    fontSize: 12,
  },
});
