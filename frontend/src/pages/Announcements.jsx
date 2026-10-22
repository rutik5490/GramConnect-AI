import React, { useEffect, useState } from 'react'
import { Plus, Megaphone } from 'lucide-react'
import Layout from '../components/Layout'
import { Modal, PrimaryButton, SecondaryButton, Input, TextArea, Select } from '../components/ui'
import { announcementApi } from '../api/endpoints'
import { useAuth } from '../context/AuthContext'

const CHANNELS = [
  ['app', 'Mobile App'],
  ['ai_voice_call', 'AI Voice Call'],
  ['sms', 'SMS'],
  ['whatsapp', 'WhatsApp'],
]

const emptyForm = { title: '', body: '', channel: 'app' }

export default function Announcements() {
  const { panchayat } = useAuth()
  const [items, setItems] = useState([])
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  const load = () => {
    if (!panchayat) return
    announcementApi.list(panchayat.id).then(({ data }) => setItems(data))
  }

  useEffect(load, [panchayat])

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await announcementApi.create({ ...form, panchayat_id: panchayat.id })
      setModalOpen(false)
      setForm(emptyForm)
      load()
    } catch (err) {
      alert(err.response?.data?.detail || 'Could not publish announcement')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Layout
      title="Announcements"
      subtitle="Publish notices for Gram Sabha meetings, water supply, health camps, and more"
      actions={
        <PrimaryButton onClick={() => setModalOpen(true)}>
          <span className="flex items-center gap-1.5"><Plus size={15} /> New Announcement</span>
        </PrimaryButton>
      }
    >
      <div className="space-y-3">
        {items.map((a) => (
          <div key={a.id} className="bg-white rounded-xl border border-hairline shadow-card p-5 flex gap-4">
            <div className="p-2.5 rounded-lg bg-saffron/15 text-saffron shrink-0 h-fit"><Megaphone size={18} /></div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-display text-base text-navy-dark">{a.title}</h4>
                <span className="text-xs bg-paper text-muted px-2 py-0.5 rounded-full capitalize">
                  {CHANNELS.find(([k]) => k === a.channel)?.[1]}
                </span>
              </div>
              <p className="text-sm text-ink">{a.body}</p>
              <p className="text-xs text-muted mt-2">{new Date(a.published_at).toLocaleString()}</p>
            </div>
          </div>
        ))}
        {items.length === 0 && <p className="text-muted text-center py-16">No announcements published yet.</p>}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="New Announcement">
        <form onSubmit={handleSave} className="space-y-4">
          <Input label="Title" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <TextArea label="Message" required rows={4} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} />
          <Select label="Delivery Channel" value={form.channel} onChange={(e) => setForm({ ...form, channel: e.target.value })}>
            {CHANNELS.map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </Select>
          <div className="flex justify-end gap-2 pt-2">
            <SecondaryButton type="button" onClick={() => setModalOpen(false)}>Cancel</SecondaryButton>
            <PrimaryButton type="submit" disabled={saving}>{saving ? 'Publishing…' : 'Publish'}</PrimaryButton>
          </div>
        </form>
      </Modal>
    </Layout>
  )
}
