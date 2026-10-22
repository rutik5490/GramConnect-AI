import React, { useState, useRef, useEffect } from 'react'
import {
  View, Text, StyleSheet, SafeAreaView, FlatList, TextInput,
  TouchableOpacity, KeyboardAvoidingView, Platform, Alert,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { citizenApi } from '../api/endpoints'
import { colors, spacing, radius } from '../theme/colors'
import TricolorStrip from '../components/TricolorStrip'

export default function VoiceAssistantScreen() {
  const [sessionId, setSessionId] = useState(null)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [started, setStarted] = useState(false)
  const listRef = useRef(null)

  useEffect(() => {
    if (!started) startConversation()
  }, [])

  const startConversation = async () => {
    setStarted(true)
    setSending(true)
    try {
      const { data } = await citizenApi.voiceTurn({ language: 'mr', citizen_text: 'नमस्कार' })
      setSessionId(data.session_id)
      setMessages([
        { role: 'citizen', text: 'नमस्कार' },
        { role: 'assistant', text: data.reply },
      ])
    } catch (err) {
      Alert.alert('Could not connect', 'Please check your connection and try again.')
    } finally {
      setSending(false)
    }
  }

  const sendMessage = async () => {
    if (!input.trim()) return
    const text = input.trim()
    setMessages((m) => [...m, { role: 'citizen', text }])
    setInput('')
    setSending(true)
    try {
      const { data } = await citizenApi.voiceTurn({ session_id: sessionId, citizen_text: text })
      setMessages((m) => [
        ...m,
        { role: 'assistant', text: data.reply, complaintRegistered: data.complaint_registered },
      ])
    } catch (err) {
      Alert.alert('Message failed to send')
    } finally {
      setSending(false)
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100)
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <TricolorStrip />
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Ionicons name="mic" size={16} color="#fff" />
        </View>
        <View>
          <Text style={styles.headerTitle}>Panchayat AI Sahayak</Text>
          <Text style={styles.headerSubtitle}>Ask about water, schemes, or report an issue</Text>
        </View>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }} keyboardVerticalOffset={90}>
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(_, i) => String(i)}
          contentContainerStyle={{ padding: spacing.lg }}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
          renderItem={({ item }) => (
            <View style={[styles.bubbleRow, item.role === 'citizen' && styles.bubbleRowRight]}>
              <View style={[styles.bubble, item.role === 'citizen' ? styles.bubbleCitizen : styles.bubbleAssistant]}>
                <Text style={item.role === 'citizen' ? styles.bubbleTextCitizen : styles.bubbleTextAssistant}>
                  {item.text}
                </Text>
                {item.complaintRegistered && (
                  <View style={styles.confirmRow}>
                    <Ionicons name="checkmark-circle" size={13} color={colors.green} />
                    <Text style={styles.confirmText}>Complaint auto-registered</Text>
                  </View>
                )}
              </View>
            </View>
          )}
        />

        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="Type your message…"
            placeholderTextColor={colors.muted}
            value={input}
            onChangeText={setInput}
            editable={!sending}
          />
          <TouchableOpacity style={styles.sendButton} onPress={sendMessage} disabled={sending}>
            <Ionicons name="send" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: colors.navy, paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
  },
  avatar: {
    width: 34, height: 34, borderRadius: 17, backgroundColor: '#ffffff26',
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { color: '#fff', fontWeight: '700', fontSize: 14 },
  headerSubtitle: { color: '#ffffff99', fontSize: 11, marginTop: 1 },
  bubbleRow: { flexDirection: 'row', marginBottom: spacing.sm },
  bubbleRowRight: { justifyContent: 'flex-end' },
  bubble: { maxWidth: '78%', borderRadius: radius.lg, paddingHorizontal: 14, paddingVertical: 10 },
  bubbleCitizen: { backgroundColor: colors.navy, borderBottomRightRadius: 4 },
  bubbleAssistant: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.hairline, borderBottomLeftRadius: 4 },
  bubbleTextCitizen: { color: '#fff', fontSize: 14 },
  bubbleTextAssistant: { color: colors.ink, fontSize: 14 },
  confirmRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  confirmText: { fontSize: 11, color: colors.green },
  inputRow: {
    flexDirection: 'row', padding: spacing.md, gap: 8,
    borderTopWidth: 1, borderTopColor: colors.hairline, backgroundColor: colors.surface,
  },
  input: {
    flex: 1, borderWidth: 1, borderColor: colors.hairline, borderRadius: radius.md,
    paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: colors.ink,
  },
  sendButton: {
    width: 42, height: 42, borderRadius: radius.md, backgroundColor: colors.navy,
    alignItems: 'center', justifyContent: 'center',
  },
})
