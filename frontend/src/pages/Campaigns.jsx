import React, { useEffect, useState } from 'react'
import { Plus, PhoneCall, Play } from 'lucide-react'
import Layout from '../components/Layout'
import { Badge, Modal, PrimaryButton, SecondaryButton, Select, TextArea, Input } from '../components/ui'
import { campaignApi, wardApi } from '../api/endpoints'
import { useAuth } from '../context/AuthContext'

const CAMPAIGN_TYPES = [
  ['gram_sabha_meeting', 'Gram Sabha Meeting'],
  ['water_supply_alert', 'Water Supply Alert'],
  ['vaccination_drive', 'Vaccination Drive'],
  ['tax_reminder', 'Tax Reminder'],
  ['survey', 'Survey'],
  ['election_awareness', 'Election Awareness'],
  ['other', 'Other'],
]

const emptyForm = { title: '', campaign_type: 'water_supply_alert', message_script: '', target_ward_id: '' }

export default function Campaigns() {
  const { panchayat } = useAuth()
  const [campaigns, setCampaigns] = useState([])
  const [wards, setWards] = useState([])
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [runningId, setRunningId] = useState(null)
  const [callResults, setCallResults] = useState(null)

  const load = () => {
    if (!panchayat) return
    campaignApi.list(panchayat.id).then(({ data }) => setCampaigns(data))
    wardApi.list(panchayat.id).then(({ data }) => setWards(data))
  }

  useEffect(load, [panchayat])

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await campaignApi.create({ ...form, panchayat_id: panchayat.id, target_ward_id: form.target_ward_id || null })
      setModalOpen(false)
      setForm(emptyForm)
      load()
    } catch (err) {
      alert(err.response?.data?.detail || 'Could not create campaign')
    } finally {
      setSaving(false)
    }
  }

  const handleRun = async (campaign) => {
    setRunningId(campaign.id)
    try {
      const { data } = await campaignApi.run(campaign.id)
      setCallResults({ campaign, calls: data })
      load()
    } catch (err) {
      alert(err.response?.data?.detail || 'Could not run campaign')
    } finally {
      setRunningId(null)
    }
  }

  return (
    <Layout
      title="AI Calling Campaigns"
      subtitle="Create outbound campaigns — AI calls every targeted citizen and summarizes responses"
      actions={
        <PrimaryButton onClick={() => setModalOpen(true)}>
          <span className="flex items-center gap-1.5"><Plus size={15} /> New Campaign</span>
        </PrimaryButton>
      }
    >
      <div className="space-y-4">
        {campaigns.map((c) => (
          <div key={c.id} className="bg-white rounded-xl border border-hairline shadow-card p-5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0">
              <div className="p-3 bg-navy/10 rounded-lg text-navy shrink-0"><PhoneCall size={20} /></div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-display text-lg text-navy-dark truncate">{c.title}</h3>
                  <Badge value={c.status} />
                </div>
                <p className="text-sm text-muted truncate max-w-xl">{c.message_script}</p>
                <p className="text-xs text-muted mt-1">
                  {CAMPAIGN_TYPES.find(([k]) => k === c.campaign_type)?.[1]} &middot;{' '}
                  {wards.find((w) => w.id === c.target_ward_id)?.name || 'All wards'}
                </p>
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              <PrimaryButton onClick={() => handleRun(c)} disabled={runningId === c.id || c.status === 'completed'}>
                <span className="flex items-center gap-1.5">
                  <Play size={14} /> {runningId === c.id ? 'Calling…' : c.status === 'completed' ? 'Completed' : 'Run Campaign'}
                </span>
              </PrimaryButton>
            </div>
          </div>
        ))}
        {campaigns.length === 0 && (
          <p className="text-muted text-center py-16">No campaigns yet. Create one to reach citizens with AI voice calls.</p>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="New AI Calling Campaign">
        <form onSubmit={handleSave} className="space-y-4">
          <Input label="Campaign Title" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <Select label="Campaign Type" value={form.campaign_type} onChange={(e) => setForm({ ...form, campaign_type: e.target.value })}>
            {CAMPAIGN_TYPES.map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </Select>
          <Select label="Target Ward (leave blank for all wards)" value={form.target_ward_id} onChange={(e) => setForm({ ...form, target_ward_id: e.target.value })}>
            <option value="">All wards</option>
            {wards.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
          </Select>
          <TextArea
            label="Message Script (what the AI will say — Marathi recommended)"
            required
            rows={4}
            placeholder="उद्या सकाळी 10 वाजता ग्रामसभा आयोजित करण्यात आली आहे. कृपया उपस्थित रहा."
            value={form.message_script}
            onChange={(e) => setForm({ ...form, message_script: e.target.value })}
          />
          <div className="flex justify-end gap-2 pt-2">
            <SecondaryButton type="button" onClick={() => setModalOpen(false)}>Cancel</SecondaryButton>
            <PrimaryButton type="submit" disabled={saving}>{saving ? 'Creating…' : 'Create Campaign'}</PrimaryButton>
          </div>
        </form>
      </Modal>

      <Modal open={!!callResults} onClose={() => setCallResults(null)} title="Campaign Call Results" wide>
        {callResults && (
          <div className="space-y-3">
            <p className="text-sm text-muted mb-3">
              {callResults.calls.length} calls placed for "{callResults.campaign.title}"
            </p>
            {callResults.calls.map((call) => (
              <div key={call.id} className="border border-hairline rounded-lg p-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge value={call.status} />
                    {call.sentiment && <Badge value={call.sentiment} />}
                  </div>
                  <p className="text-sm text-ink truncate">{call.ai_summary || 'No answer'}</p>
                </div>
                <span className="text-xs text-muted shrink-0">{call.duration_seconds}s</span>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </Layout>
  )
}
