import React, { useEffect, useState } from 'react'
import { View, Text, StyleSheet, SafeAreaView, KeyboardAvoidingView, Platform, Alert } from 'react-native'
import { useCitizenAuth } from '../context/CitizenAuthContext'
import { Input, PrimaryButton } from '../components/ui'
import { colors, spacing } from '../theme/colors'
import TricolorStrip from '../components/TricolorStrip'
import AshokaChakra from '../components/AshokaChakra'
import storage from '../utils/storage'

export default function LoginScreen({ navigation }) {
  const { requestOtp } = useCitizenAuth()
  const [mobile, setMobile] = useState('')
  const [panchayat, setPanchayat] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    storage.getItem('gc_panchayat').then((raw) => {
      if (raw) setPanchayat(JSON.parse(raw))
    })
  }, [])

  const handleContinue = async () => {
    if (mobile.trim().length < 10) {
      Alert.alert('Enter a valid mobile number')
      return
    }
    setLoading(true)
    try {
      const { data } = await requestOtp(mobile.trim())
      if (data.citizen_exists) {
        navigation.navigate('OtpVerify', { mobile: mobile.trim() })
      } else {
        navigation.navigate('Register', { mobile: mobile.trim() })
      }
    } catch (err) {
      Alert.alert('Something went wrong', 'Please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <TricolorStrip />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <View style={styles.header}>
          <AshokaChakra size={48} color={colors.saffron} />
          <Text style={styles.title}>GramConnect AI</Text>
          {panchayat && <Text style={styles.subtitle}>{panchayat.name}, {panchayat.district}</Text>}
        </View>

        <View style={styles.form}>
          <Text style={styles.formTitle}>Enter your mobile number</Text>
          <Text style={styles.formSubtitle}>We'll send you a one-time password (OTP) to verify.</Text>
          <Input
            keyboardType="phone-pad"
            placeholder="10-digit mobile number"
            value={mobile}
            onChangeText={setMobile}
            maxLength={10}
            style={{ marginTop: spacing.md }}
          />
          <PrimaryButton title="Continue" onPress={handleContinue} loading={loading} style={{ marginTop: spacing.sm }} />

          {panchayat && (
            <Text style={styles.changeLink} onPress={() => navigation.replace('SelectPanchayat')}>
              Not your Panchayat? Change
            </Text>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper },
  header: { alignItems: 'center', paddingVertical: spacing.xl, backgroundColor: colors.navyDark },
  title: { color: '#fff', fontSize: 20, fontWeight: '700', marginTop: spacing.sm },
  subtitle: { color: '#ffffff99', fontSize: 13, marginTop: 4 },
  form: { padding: spacing.lg, marginTop: spacing.lg },
  formTitle: { fontSize: 18, fontWeight: '700', color: colors.navyDark },
  formSubtitle: { fontSize: 13, color: colors.muted, marginTop: 4 },
  changeLink: { textAlign: 'center', color: colors.navy, marginTop: spacing.lg, fontSize: 13, fontWeight: '500' },
})
