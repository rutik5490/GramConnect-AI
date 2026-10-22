import React from 'react'
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Alert } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useCitizenAuth } from '../context/CitizenAuthContext'
import { Card } from '../components/ui'
import { colors, spacing, radius } from '../theme/colors'
import TricolorStrip from '../components/TricolorStrip'
import AshokaChakra from '../components/AshokaChakra'

export default function ProfileScreen() {
  const { citizen, logout } = useCitizenAuth()

  const confirmLogout = () => {
    Alert.alert('Sign out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: logout },
    ])
  }

  return (
    <SafeAreaView style={styles.container}>
      <TricolorStrip />
      <View style={styles.header}>
        <AshokaChakra size={40} color={colors.navy} />
        <Text style={styles.name}>{citizen?.name}</Text>
        <Text style={styles.code}>{citizen?.citizen_code}</Text>
      </View>

      <Card style={styles.card}>
        <ProfileRow icon="call-outline" label="Mobile Number" value={citizen?.mobile_number} />
        <ProfileRow icon="calendar-outline" label="Age" value={citizen?.age ? String(citizen.age) : '—'} />
        <ProfileRow icon="briefcase-outline" label="Occupation" value={citizen?.occupation || '—'} />
        <ProfileRow icon="language-outline" label="Preferred Language" value={langLabel(citizen?.preferred_language)} last />
      </Card>

      <TouchableOpacity style={styles.logoutButton} onPress={confirmLogout}>
        <Ionicons name="log-out-outline" size={18} color={colors.danger} />
        <Text style={styles.logoutText}>Sign out</Text>
      </TouchableOpacity>

      <Text style={styles.footer}>GramConnect AI · A digital governance initiative for Gram Panchayats</Text>
    </SafeAreaView>
  )
}

function langLabel(code) {
  return { mr: 'मराठी (Marathi)', hi: 'हिंदी (Hindi)', en: 'English' }[code] || code
}

function ProfileRow({ icon, label, value, last }) {
  return (
    <View style={[styles.row, !last && styles.rowBorder]}>
      <Ionicons name={icon} size={18} color={colors.muted} style={{ marginRight: 10 }} />
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper },
  header: { alignItems: 'center', paddingVertical: spacing.xl },
  name: { fontSize: 18, fontWeight: '700', color: colors.navyDark, marginTop: spacing.sm },
  code: { fontSize: 12, color: colors.muted, fontFamily: 'monospace', marginTop: 2 },
  card: { marginHorizontal: spacing.lg },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: colors.hairline },
  rowLabel: { flex: 1, fontSize: 13, color: colors.muted },
  rowValue: { fontSize: 13, color: colors.ink, fontWeight: '500' },
  logoutButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    marginTop: spacing.xl, marginHorizontal: spacing.lg,
    borderWidth: 1, borderColor: `${colors.danger}40`, borderRadius: radius.md, paddingVertical: 12,
  },
  logoutText: { color: colors.danger, fontWeight: '600', fontSize: 14 },
  footer: { textAlign: 'center', color: colors.muted, fontSize: 11, marginTop: spacing.xl, paddingHorizontal: spacing.lg },
})
