import React, { useCallback, useState } from 'react'
import { View, Text, StyleSheet, SafeAreaView, FlatList, RefreshControl } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import { citizenApi } from '../api/endpoints'
import { Card } from '../components/ui'
import { colors, spacing, radius } from '../theme/colors'
import TricolorStrip from '../components/TricolorStrip'

export default function AnnouncementsScreen() {
  const [announcements, setAnnouncements] = useState([])
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(() => {
    citizenApi.myAnnouncements().then(({ data }) => setAnnouncements(data))
  }, [])

  useFocusEffect(
    useCallback(() => {
      load()
    }, [load])
  )

  const onRefresh = async () => {
    setRefreshing(true)
    await load()
    setRefreshing(false)
  }

  return (
    <SafeAreaView style={styles.container}>
      <TricolorStrip />
      <View style={styles.header}>
        <Text style={styles.title}>Announcements</Text>
      </View>

      <FlatList
        data={announcements}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: spacing.lg }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={<Text style={styles.empty}>Nothing published yet.</Text>}
        renderItem={({ item }) => (
          <Card style={{ marginBottom: spacing.sm }}>
            <View style={styles.row}>
              <View style={styles.iconWrap}>
                <Ionicons name="megaphone-outline" size={18} color={colors.saffron} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.itemTitle}>{item.title}</Text>
                <Text style={styles.itemBody}>{item.body}</Text>
                <Text style={styles.itemDate}>{new Date(item.published_at).toLocaleString()}</Text>
              </View>
            </View>
          </Card>
        )}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper },
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  title: { fontSize: 20, fontWeight: '700', color: colors.navyDark },
  row: { flexDirection: 'row', gap: 10 },
  iconWrap: {
    width: 36, height: 36, borderRadius: radius.sm, backgroundColor: `${colors.saffron}26`,
    alignItems: 'center', justifyContent: 'center',
  },
  itemTitle: { fontSize: 14, fontWeight: '700', color: colors.navyDark },
  itemBody: { fontSize: 13, color: colors.ink, marginTop: 4 },
  itemDate: { fontSize: 11, color: colors.muted, marginTop: 6 },
  empty: { textAlign: 'center', color: colors.muted, marginTop: spacing.xl },
})
