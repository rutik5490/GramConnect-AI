import React, { useEffect, useState } from 'react'
import { View, Text, StyleSheet, SafeAreaView, ScrollView, Alert, TouchableOpacity } from 'react-native'
import { useCitizenAuth } from '../context/CitizenAuthContext'
import { Input, PrimaryButton } from '../components/ui'
import { colors, spacing, radius } from '../theme/colors'
import TricolorStrip from '../components/TricolorStrip'
import { publicApi } from '../api/endpoints'
import storage from '../utils/storage'

export default function RegisterScreen({ route, navigation }) {
  const { mobile } = route.params
  const { selfRegister } = useCitizenAuth()
  const [name, setName] = useState('')
  const [age, setAge] = useState('')
  const [wards, setWards] = useState([])
  const [selectedWard, setSelectedWard] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    storage.getItem('gc_panchayat').then(async (raw) => {
      if (!raw) return
      const panchayat = JSON.parse(raw)
      const { data } = await publicApi.wards(panchayat.id)
      setWards(data)
    })
  }, [])

  const handleRegister = async () => {
    if (!name.trim() || !selectedWard) {
      Alert.alert('Please enter your name and select your ward')
      return
    }
    setLoading(true)
    try {
      await selfRegister({
        mobile_number: mobile,
        name: name.trim(),
        ward_id: selectedWard.id,
        age: age ? Number(age) : null,
      })
      navigation.navigate('OtpVerify', { mobile })
    } catch (err) {
      Alert.alert('Registration failed', err.response?.data?.detail || 'Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <TricolorStrip />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Quick Registration</Text>
        <Text style={styles.subtitle}>
          We didn't find an existing record for {mobile}. Let's set one up.
        </Text>

        <Input label="Full Name" value={name} onChangeText={setName} placeholder="Your full name" />
        <Input label="Age (optional)" value={age} onChangeText={setAge} keyboardType="number-pad" placeholder="e.g. 34" />

        <Text style={styles.label}>Your Ward</Text>
        <View style={styles.wardGrid}>
          {wards.map((w) => (
            <TouchableOpacity
              key={w.id}
              onPress={() => setSelectedWard(w)}
              style={[styles.wardChip, selectedWard?.id === w.id && styles.wardChipSelected]}
            >
              <Text style={[styles.wardChipText, selectedWard?.id === w.id && styles.wardChipTextSelected]}>
                {w.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <PrimaryButton title="Register & Send OTP" onPress={handleRegister} loading={loading} style={{ marginTop: spacing.lg }} />
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper },
  content: { padding: spacing.lg },
  title: { fontSize: 20, fontWeight: '700', color: colors.navyDark, marginTop: spacing.md },
  subtitle: { fontSize: 13, color: colors.muted, marginTop: 6, marginBottom: spacing.lg },
  label: { fontSize: 12, color: colors.muted, marginBottom: spacing.sm, fontWeight: '500' },
  wardGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  wardChip: {
    borderWidth: 1,
    borderColor: colors.hairline,
    borderRadius: radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 8,
    marginBottom: 8,
  },
  wardChipSelected: { backgroundColor: colors.navy, borderColor: colors.navy },
  wardChipText: { fontSize: 13, color: colors.navyDark },
  wardChipTextSelected: { color: '#fff', fontWeight: '600' },
})
