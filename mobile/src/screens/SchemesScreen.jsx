import React, { useCallback, useState } from 'react'
import { View, Text, StyleSheet, SafeAreaView, FlatList, RefreshControl } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import { citizenApi } from '../api/endpoints'
import { Card } from '../components/ui'
import { colors, spacing, radius } from '../theme/colors'
import TricolorStrip from '../components/TricolorStrip'

export default function SchemesScreen() {
  const [schemes, setSchemes] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(() => {
    citizenApi.myEligibleSchemes().then(({ data }) => setSchemes(data)).finally(() => setLoading(false))
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
        <Text style={styles.title}>Schemes You're Eligible For</Text>
        <Text style={styles.subtitle}>Based on your age, income, and occupation on file</Text>
      </View>

      <FlatList
        data={schemes}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: spacing.lg }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          !loading && (
            <Text style={styles.empty}>
              No matching schemes right now. Update your profile details with your Panchayat office if this seems wrong.
            </Text>
          )
        }
        renderItem={({ item }) => (
          <Card style={{ marginBottom: spacing.sm }}>
            <View style={styles.row}>
              <View style={styles.iconWrap}>
                <Ionicons name="ribbon-outline" size={18} color={colors.navy} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.schemeName}>{item.name}</Text>
                {item.name_marathi && <Text style={styles.schemeNameMr}>{item.name_marathi}</Text>}
                <Text style={styles.schemeDesc}>{item.description}</Text>
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
  subtitle: { fontSize: 12, color: colors.muted, marginTop: 4 },
  row: { flexDirection: 'row', gap: 10 },
  iconWrap: {
    width: 36, height: 36, borderRadius: radius.sm, backgroundColor: `${colors.navy}1A`,
    alignItems: 'center', justifyContent: 'center',
  },
  schemeName: { fontSize: 14, fontWeight: '700', color: colors.navyDark },
  schemeNameMr: { fontSize: 12, color: colors.muted, marginTop: 1 },
  schemeDesc: { fontSize: 13, color: colors.ink, marginTop: 6 },
  empty: { textAlign: 'center', color: colors.muted, marginTop: spacing.xl, paddingHorizontal: spacing.lg },
})
