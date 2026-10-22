import React, { useCallback, useState } from 'react'
import { View, Text, StyleSheet, SafeAreaView, FlatList, TouchableOpacity, RefreshControl } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import { citizenApi } from '../api/endpoints'
import { Card, Badge } from '../components/ui'
import { colors, spacing } from '../theme/colors'
import TricolorStrip from '../components/TricolorStrip'

const STATUS_TONE = {
  registered: 'navy',
  assigned: 'gold',
  in_progress: 'saffron',
  resolved: 'green',
  feedback_pending: 'gold',
  closed: 'navy',
}

export default function ComplaintsScreen({ navigation }) {
  const [complaints, setComplaints] = useState([])
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(() => {
    citizenApi.myComplaints().then(({ data }) => setComplaints(data))
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
        <Text style={styles.title}>My Complaints</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => navigation.navigate('NewComplaint')}>
          <Ionicons name="add" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={complaints}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: spacing.lg }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={<Text style={styles.empty}>You haven't reported any issues yet.</Text>}
        renderItem={({ item }) => (
          <Card style={{ marginBottom: spacing.sm }}>
            <View style={styles.rowBetween}>
              <Text style={styles.code}>{item.complaint_code}</Text>
              <Badge text={item.status.replace('_', ' ')} tone={STATUS_TONE[item.status] || 'navy'} />
            </View>
            <Text style={styles.description}>{item.description}</Text>
            <View style={styles.rowBetween}>
              <Badge text={item.category.replace('_', ' ')} tone="navy" />
              <Text style={styles.date}>{new Date(item.created_at).toLocaleDateString()}</Text>
            </View>
          </Card>
        )}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: spacing.lg, paddingTop: spacing.md,
  },
  title: { fontSize: 20, fontWeight: '700', color: colors.navyDark },
  addButton: {
    backgroundColor: colors.navy, width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
  },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  code: { fontFamily: 'monospace', fontSize: 12, color: colors.navy },
  description: { fontSize: 14, color: colors.ink, marginBottom: 8 },
  date: { fontSize: 11, color: colors.muted },
  empty: { textAlign: 'center', color: colors.muted, marginTop: spacing.xl },
})
