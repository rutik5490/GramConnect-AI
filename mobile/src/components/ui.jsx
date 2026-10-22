import React from 'react'
import { TouchableOpacity, Text, TextInput, View, StyleSheet, ActivityIndicator } from 'react-native'
import { colors, spacing, radius } from '../theme/colors'

export function PrimaryButton({ title, onPress, loading, disabled, style }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      style={[styles.primaryButton, (disabled || loading) && styles.disabled, style]}
    >
      {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>{title}</Text>}
    </TouchableOpacity>
  )
}

export function SecondaryButton({ title, onPress, style }) {
  return (
    <TouchableOpacity onPress={onPress} style={[styles.secondaryButton, style]}>
      <Text style={styles.secondaryButtonText}>{title}</Text>
    </TouchableOpacity>
  )
}

export function Input({ label, style, ...props }) {
  return (
    <View style={{ marginBottom: spacing.md }}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        style={[styles.input, style]}
        placeholderTextColor={colors.muted}
        {...props}
      />
    </View>
  )
}

export function Card({ children, style }) {
  return <View style={[styles.card, style]}>{children}</View>
}

export function Badge({ text, tone = 'navy' }) {
  const toneMap = {
    navy: { bg: '#0B3D6B1A', fg: colors.navy },
    saffron: { bg: '#FF993326', fg: colors.saffron },
    green: { bg: '#1388081A', fg: colors.green },
    gold: { bg: '#C9A2271A', fg: colors.gold },
    danger: { bg: '#B91C1C1A', fg: colors.danger },
  }
  const t = toneMap[tone] || toneMap.navy
  return (
    <View style={[styles.badge, { backgroundColor: t.bg }]}>
      <Text style={[styles.badgeText, { color: t.fg }]}>{text}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  primaryButton: {
    backgroundColor: colors.navy,
    paddingVertical: 14,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  secondaryButton: {
    borderWidth: 1,
    borderColor: colors.hairline,
    paddingVertical: 14,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: { color: colors.navyDark, fontWeight: '600', fontSize: 15 },
  disabled: { opacity: 0.5 },
  label: { fontSize: 12, color: colors.muted, marginBottom: 6, fontWeight: '500' },
  input: {
    borderWidth: 1,
    borderColor: colors.hairline,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.ink,
    backgroundColor: colors.surface,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.hairline,
    padding: spacing.md,
    shadowColor: colors.navy,
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
  },
  badgeText: { fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
})
