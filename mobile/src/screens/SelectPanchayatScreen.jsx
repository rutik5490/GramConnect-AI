import React, { useEffect, useState } from 'react'
import { View, Text, FlatList, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native'
import AsyncStorageFallback from '../utils/storage'
import { publicApi } from '../api/endpoints'
import { colors, spacing, radius } from '../theme/colors'
import TricolorStrip from '../components/TricolorStrip'
import AshokaChakra from '../components/AshokaChakra'

export default function SelectPanchayatScreen({ navigation }) {
  const [panchayats, setPanchayats] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    publicApi
      .panchayats()
      .then(({ data }) => setPanchayats(data))
      .finally(() => setLoading(false))
  }, [])

  const choose = async (panchayat) => {
    await AsyncStorageFallback.setItem('gc_panchayat', JSON.stringify(panchayat))
    navigation.replace('Login')
  }

  return (
    <SafeAreaView style={styles.container}>
      <TricolorStrip />
      <View style={styles.header}>
        <AshokaChakra size={48} color={colors.saffron} />
        <Text style={styles.title}>GramConnect AI</Text>
        <Text style={styles.subtitle}>Select your Gram Panchayat to get started</Text>
      </View>

      <FlatList
        data={panchayats}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: spacing.lg }}
        ListEmptyComponent={
          !loading && <Text style={styles.empty}>No Panchayats found. Check your connection.</Text>
        }
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => choose(item)}>
            <Text style={styles.cardTitle}>{item.name}</Text>
            <Text style={styles.cardSubtitle}>{item.district}, {item.state}</Text>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.navyDark },
  header: { alignItems: 'center', paddingVertical: spacing.xl },
  title: { color: '#fff', fontSize: 22, fontWeight: '700', marginTop: spacing.sm },
  subtitle: { color: '#ffffff99', fontSize: 13, marginTop: 4, textAlign: 'center', paddingHorizontal: spacing.lg },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  cardTitle: { fontSize: 16, fontWeight: '600', color: colors.navyDark },
  cardSubtitle: { fontSize: 13, color: colors.muted, marginTop: 2 },
  empty: { color: '#ffffff99', textAlign: 'center', marginTop: spacing.xl },
})
