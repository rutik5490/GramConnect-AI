import React, { useState, useRef, useEffect } from 'react'
import { Send, Mic, CheckCircle2 } from 'lucide-react'
import Layout from '../components/Layout'
import { voiceApi } from '../api/endpoints'

export default function VoiceAssistant() {
  const [sessionId, setSessionId] = useState(null)
  const [mobile, setMobile] = useState('9812345601')
  const [started, setStarted] = useState(false)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const startCall = async () => {
    setStarted(true)
    setSending(true)
    try {
      const { data } = await voiceApi.turn({ caller_mobile: mobile, language: 'mr', citizen_text: 'नमस्कार' })
      setSessionId(data.session_id)
      setMessages([
        { role: 'citizen', text: 'नमस्कार' },
        { role: 'assistant', text: data.reply, intent: data.intent },
      ])
    } catch (err) {
      alert('Could not start voice session. Is the backend running?')
      setStarted(false)
    } finally {
      setSending(false)
    }
  }

  const sendMessage = async (e) => {
    e.preventDefault()
    if (!input.trim()) return
    const text = input.trim()
    setMessages((m) => [...m, { role: 'citizen', text }])
    setInput('')
    setSending(true)
    try {
      const { data } = await voiceApi.turn({ session_id: sessionId, citizen_text: text })
      setMessages((m) => [
        ...m,
        {
          role: 'assistant',
          text: data.reply,
          intent: data.intent,
          complaintRegistered: data.complaint_registered,
          complaintId: data.complaint_id,
        },
      ])
    } catch (err) {
      alert('Message failed to send.')
    } finally {
      setSending(false)
    }
  }

  return (
    <Layout
      title="AI Voice Assistant"
      subtitle="Text-based demo of the 24×7 inbound IVR — citizens can call this line to ask questions or register complaints"
    >
      <div className="max-w-2xl mx-auto">
        {!started ? (
          <div className="bg-white rounded-xl border border-hairline shadow-card p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-navy/10 text-navy flex items-center justify-center mx-auto mb-4">
              <Mic size={28} />
            </div>
            <h2 className="font-display text-xl text-navy-dark mb-2">Simulate an Inbound Call</h2>
            <p className="text-sm text-muted mb-6 max-w-md mx-auto">
              Enter a citizen's registered mobile number to simulate them calling the Panchayat AI line.
              The assistant replies in Marathi and can register complaints or answer scheme queries automatically.
            </p>
            <div className="flex gap-2 max-w-xs mx-auto">
              <input
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                className="flex-1 border border-hairline rounded-lg px-3 py-2 text-sm focus:border-navy outline-none"
                placeholder="Citizen mobile number"
              />
              <button
                onClick={startCall}
                disabled={sending}
                className="bg-navy text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-navy-dark transition-colors"
              >
                Call
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-hairline shadow-card flex flex-col h-[600px]">
            <div className="px-5 py-3 border-b border-hairline flex items-center gap-3 bg-navy text-white rounded-t-xl">
              <div className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center">
                <Mic size={16} />
              </div>
              <div>
                <p className="text-sm font-semibold">Panchayat AI Sahayak</p>
                <p className="text-xs text-white/60">Call connected &middot; {mobile}</p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-3">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'citizen' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${
                      m.role === 'citizen'
                        ? 'bg-navy text-white rounded-br-sm'
                        : 'bg-paper text-ink rounded-bl-sm'
                    }`}
                  >
                    <p>{m.text}</p>
                    {m.complaintRegistered && (
                      <div className="flex items-center gap-1.5 mt-2 text-xs text-green">
                        <CheckCircle2 size={13} /> Complaint auto-registered
                      </div>
                    )}
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>

            <form onSubmit={sendMessage} className="p-4 border-t border-hairline flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type what the citizen would say… (Marathi, Hindi, or English)"
                className="flex-1 border border-hairline rounded-lg px-3 py-2 text-sm focus:border-navy outline-none"
                disabled={sending}
              />
              <button
                type="submit"
                disabled={sending}
                className="bg-navy text-white px-4 py-2 rounded-lg hover:bg-navy-dark transition-colors disabled:opacity-50"
              >
                <Send size={16} />
              </button>
            </form>
          </div>
        )}
      </div>
    </Layout>
  )
}
