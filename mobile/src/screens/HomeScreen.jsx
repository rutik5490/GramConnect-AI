import React, { useEffect, useState, useCallback } from 'react'
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, RefreshControl } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useCitizenAuth } from '../context/CitizenAuthContext'
import { citizenApi } from '../api/endpoints'
import { Card } from '../components/ui'
import { colors, spacing, radius } from '../theme/colors'
import TricolorStrip from '../components/TricolorStrip'

const QUICK_ACTIONS = [
  { key: 'NewComplaint', label: 'Report Issue', icon: 'megaphone-outline', tone: colors.saffron },
  { key: 'VoiceAssistant', label: 'Ask AI Assistant', icon: 'mic-outline', tone: colors.navy },
  { key: 'Schemes', label: 'My Schemes', icon: 'ribbon-outline', tone: colors.green },
  { key: 'Complaints', label: 'My Complaints', icon: 'list-outline', tone: colors.gold },
]

export default function HomeScreen({ navigation }) {
  const { citizen } = useCitizenAuth()
  const [announcements, setAnnouncements] = useState([])
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(() => {
    citizenApi.myAnnouncements().then(({ data }) => setAnnouncements(data.slice(0, 5)))
  }, [])

  useEffect(load, [load])

  const onRefresh = async () => {
    setRefreshing(true)
    await load()
    setRefreshing(false)
  }

  return (
    <SafeAreaView style={styles.container}>
      <TricolorStrip />
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <Text style={styles.greeting}>Namaste, {citizen?.name?.split(' ')[0]} 👋</Text>
        <Text style={styles.citizenCode}>{citizen?.citizen_code}</Text>

        <View style={styles.grid}>
          {QUICK_ACTIONS.map((action) => (
            <TouchableOpacity
              key={action.key}
              style={styles.actionCard}
              onPress={() => navigation.navigate(action.key)}
            >
              <View style={[styles.iconWrap, { backgroundColor: `${action.tone}1A` }]}>
                <Ionicons name={action.icon} size={22} color={action.tone} />
              </View>
              <Text style={styles.actionLabel}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Recent Announcements</Text>
        {announcements.length === 0 ? (
          <Card><Text style={styles.emptyText}>No announcements yet.</Text></Card>
        ) : (
          announcements.map((a) => (
            <Card key={a.id} style={{ marginBottom: spacing.sm }}>
              <Text style={styles.announcementTitle}>{a.title}</Text>
              <Text style={styles.announcementBody} numberOfLines={2}>{a.body}</Text>
            </Card>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper },
  content: { padding: spacing.lg },
  greeting: { fontSize: 22, fontWeight: '700', color: colors.navyDark },
  citizenCode: { fontSize: 12, color: colors.muted, marginTop: 2, fontFamily: 'monospace' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginTop: spacing.lg, marginHorizontal: -spacing.xs },
  actionCard: {
    width: '50%',
    paddingHorizontal: spacing.xs,
    marginBottom: spacing.sm,
  },
  iconWrap: {
    width: 44, height: 44, borderRadius: radius.md,
    alignItems: 'center', justifyContent: 'center', marginBottom: 8,
  },
  actionLabel: { fontSize: 13, fontWeight: '600', color: colors.navyDark },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.navyDark, marginTop: spacing.lg, marginBottom: spacing.sm },
  announcementTitle: { fontSize: 14, fontWeight: '600', color: colors.navyDark },
  announcementBody: { fontSize: 13, color: colors.muted, marginTop: 4 },
  emptyText: { color: colors.muted, fontSize: 13, textAlign: 'center' },
})
