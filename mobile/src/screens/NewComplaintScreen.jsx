import React, { useState } from 'react'
import { View, Text, StyleSheet, SafeAreaView, TextInput, Alert, KeyboardAvoidingView, Platform } from 'react-native'
import { citizenApi } from '../api/endpoints'
import { PrimaryButton } from '../components/ui'
import { colors, spacing, radius } from '../theme/colors'
import TricolorStrip from '../components/TricolorStrip'

export default function NewComplaintScreen({ navigation }) {
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (description.trim().length < 5) {
      Alert.alert('Please describe your issue in a bit more detail')
      return
    }
    setSubmitting(true)
    try {
      const { data } = await citizenApi.fileComplaint(description.trim())
      Alert.alert(
        'Complaint Registered',
        `Your complaint ${data.complaint_code} has been registered and classified as ${data.category.replace('_', ' ')} (${data.priority} priority). You can track it under My Complaints.`,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      )
    } catch (err) {
      Alert.alert('Could not submit', err.response?.data?.detail || 'Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <TricolorStrip />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <View style={styles.content}>
          <Text style={styles.title}>Report an Issue</Text>
          <Text style={styles.subtitle}>
            Describe the problem in your own words (Marathi, Hindi, or English) — our AI will automatically
            categorize it and route it to the right department.
          </Text>
          <TextInput
            style={styles.textArea}
            multiline
            numberOfLines={6}
            placeholder="e.g. आमच्या वस्तीत ३ दिवसांपासून पाणी आलेले नाही…"
            placeholderTextColor={colors.muted}
            value={description}
            onChangeText={setDescription}
            textAlignVertical="top"
          />
          <PrimaryButton
            title={submitting ? 'Submitting…' : 'Submit Complaint'}
            onPress={handleSubmit}
            loading={submitting}
            style={{ marginTop: spacing.md }}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper },
  content: { padding: spacing.lg },
  title: { fontSize: 20, fontWeight: '700', color: colors.navyDark, marginTop: spacing.md },
  subtitle: { fontSize: 13, color: colors.muted, marginTop: 6, marginBottom: spacing.lg, lineHeight: 18 },
  textArea: {
    borderWidth: 1,
    borderColor: colors.hairline,
    borderRadius: radius.md,
    padding: spacing.md,
    fontSize: 15,
    color: colors.ink,
    backgroundColor: colors.surface,
    minHeight: 140,
  },
})
