import React, { useState } from 'react'
import { View, Text, StyleSheet, SafeAreaView, Alert } from 'react-native'
import { useCitizenAuth } from '../context/CitizenAuthContext'
import { Input, PrimaryButton } from '../components/ui'
import { colors, spacing } from '../theme/colors'
import TricolorStrip from '../components/TricolorStrip'

export default function OtpVerifyScreen({ route }) {
  const { mobile } = route.params
  const { verifyOtp, requestOtp } = useCitizenAuth()
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)

  const handleVerify = async () => {
    if (otp.trim().length < 4) {
      Alert.alert('Enter the OTP sent to your phone')
      return
    }
    setLoading(true)
    try {
      await verifyOtp(mobile, otp.trim())
      // Navigation switches automatically once `citizen` is set in context —
      // see AppNavigator, which renders the citizen tabs when logged in.
    } catch (err) {
      Alert.alert('Invalid OTP', err.response?.data?.detail || 'Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    setResending(true)
    try {
      await requestOtp(mobile)
      Alert.alert('OTP resent')
    } finally {
      setResending(false)
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <TricolorStrip />
      <View style={styles.content}>
        <Text style={styles.title}>Enter OTP</Text>
        <Text style={styles.subtitle}>We sent a 6-digit code to {mobile}</Text>

        <Input
          keyboardType="number-pad"
          placeholder="6-digit OTP"
          value={otp}
          onChangeText={setOtp}
          maxLength={6}
          style={{ marginTop: spacing.lg, textAlign: 'center', letterSpacing: 6, fontSize: 20 }}
        />

        <PrimaryButton title="Verify & Continue" onPress={handleVerify} loading={loading} style={{ marginTop: spacing.sm }} />

        <Text style={styles.resend} onPress={handleResend}>
          {resending ? 'Resending…' : "Didn't get it? Resend OTP"}
        </Text>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper },
  content: { padding: spacing.lg, marginTop: spacing.xl },
  title: { fontSize: 20, fontWeight: '700', color: colors.navyDark },
  subtitle: { fontSize: 13, color: colors.muted, marginTop: 6 },
  resend: { textAlign: 'center', color: colors.navy, marginTop: spacing.lg, fontSize: 13, fontWeight: '500' },
})
