import React, { useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import Layout from '../components/Layout'
import { Badge, Modal, PrimaryButton, SecondaryButton, Select, TextArea } from '../components/ui'
import { complaintApi, citizenApi, wardApi } from '../api/endpoints'
import { useAuth } from '../context/AuthContext'

const STATUS_COLUMNS = [
  { key: 'registered', label: 'Registered' },
  { key: 'assigned', label: 'Assigned' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'resolved', label: 'Resolved' },
  { key: 'closed', label: 'Closed' },
]

export default function Complaints() {
  const { panchayat } = useAuth()
  const [complaints, setComplaints] = useState([])
  const [wards, setWards] = useState([])
  const [citizens, setCitizens] = useState([])
  const [modalOpen, setModalOpen] = useState(false)
  const [selected, setSelected] = useState(null)
  const [form, setForm] = useState({ citizen_id: '', ward_id: '', description: '' })
  const [statusForm, setStatusForm] = useState({ new_status: '', remarks: '' })
  const [saving, setSaving] = useState(false)

  const loadComplaints = () => complaintApi.list({}).then(({ data }) => setComplaints(data))

  useEffect(() => {
    loadComplaints()
    if (panchayat) {
      wardApi.list(panchayat.id).then(({ data }) => setWards(data))
    }
    citizenApi.list({ limit: 500 }).then(({ data }) => setCitizens(data))
  }, [panchayat])

  const handleCreate = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await complaintApi.create(form)
      setModalOpen(false)
      setForm({ citizen_id: '', ward_id: '', description: '' })
      loadComplaints()
    } catch (err) {
      alert(err.response?.data?.detail || 'Could not register complaint')
    } finally {
      setSaving(false)
    }
  }

  const openStatusUpdate = (complaint) => {
    setSelected(complaint)
    setStatusForm({ new_status: complaint.status, remarks: '' })
  }

  const handleStatusUpdate = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await complaintApi.updateStatus(selected.id, statusForm)
      setSelected(null)
      loadComplaints()
    } catch (err) {
      alert(err.response?.data?.detail || 'Could not update status')
    } finally {
      setSaving(false)
    }
  }

  const citizenName = (id) => citizens.find((c) => c.id === id)?.name || '—'

  return (
    <Layout
      title="Complaint Management"
      subtitle="Full complaint lifecycle: registered → assigned → in progress → resolved → closed"
      actions={
        <PrimaryButton onClick={() => setModalOpen(true)}>
          <span className="flex items-center gap-1.5"><Plus size={15} /> Register Complaint</span>
        </PrimaryButton>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-4">
        {STATUS_COLUMNS.map((col) => {
          const items = complaints.filter((c) => c.status === col.key)
          return (
            <div key={col.key} className="bg-white rounded-xl border border-hairline shadow-card flex flex-col min-h-[200px]">
              <div className="px-4 py-3 border-b border-hairline flex items-center justify-between">
                <h3 className="font-semibold text-sm text-navy-dark">{col.label}</h3>
                <span className="text-xs bg-paper text-muted px-2 py-0.5 rounded-full">{items.length}</span>
              </div>
              <div className="p-3 space-y-2 flex-1">
                {items.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => openStatusUpdate(c)}
                    className="w-full text-left bg-paper hover:bg-hairline/50 rounded-lg p-3 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-mono text-[11px] text-navy">{c.complaint_code}</span>
                      <Badge value={c.priority} />
                    </div>
                    <p className="text-xs text-ink line-clamp-2 mb-1.5">{c.description}</p>
                    <div className="flex items-center justify-between">
                      <Badge value={c.category} className="!bg-transparent !px-0 text-[11px] font-normal capitalize" />
                      <span className="text-[11px] text-muted">{citizenName(c.citizen_id)}</span>
                    </div>
                  </button>
                ))}
                {items.length === 0 && <p className="text-xs text-muted text-center py-6">No complaints</p>}
              </div>
            </div>
          )
        })}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Register New Complaint">
        <form onSubmit={handleCreate} className="space-y-4">
          <Select label="Citizen" required value={form.citizen_id} onChange={(e) => {
            const citizen = citizens.find((c) => c.id === e.target.value)
            setForm({ ...form, citizen_id: e.target.value, ward_id: citizen?.ward_id || '' })
          }}>
            <option value="">Select citizen</option>
            {citizens.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.mobile_number})</option>)}
          </Select>
          <Select label="Ward" required value={form.ward_id} onChange={(e) => setForm({ ...form, ward_id: e.target.value })}>
            <option value="">Select ward</option>
            {wards.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
          </Select>
          <TextArea
            label="Complaint Description"
            required
            rows={4}
            placeholder="Describe the issue — AI will auto-classify category and priority"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <p className="text-xs text-muted">Category and priority are detected automatically by AI on submission.</p>
          <div className="flex justify-end gap-2 pt-2">
            <SecondaryButton type="button" onClick={() => setModalOpen(false)}>Cancel</SecondaryButton>
            <PrimaryButton type="submit" disabled={saving}>{saving ? 'Registering…' : 'Register Complaint'}</PrimaryButton>
          </div>
        </form>
      </Modal>

      <Modal open={!!selected} onClose={() => setSelected(null)} title={selected ? `Update ${selected.complaint_code}` : ''}>
        {selected && (
          <form onSubmit={handleStatusUpdate} className="space-y-4">
            <div className="bg-paper rounded-lg p-3 text-sm">
              <p className="text-ink mb-2">{selected.description}</p>
              <div className="flex gap-2">
                <Badge value={selected.category} />
                <Badge value={selected.priority} />
              </div>
            </div>
            <Select label="Status" value={statusForm.new_status} onChange={(e) => setStatusForm({ ...statusForm, new_status: e.target.value })}>
              {STATUS_COLUMNS.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
              <option value="feedback_pending">Feedback Pending</option>
            </Select>
            <TextArea label="Remarks" rows={3} value={statusForm.remarks} onChange={(e) => setStatusForm({ ...statusForm, remarks: e.target.value })} />
            <div className="flex justify-end gap-2 pt-2">
              <SecondaryButton type="button" onClick={() => setSelected(null)}>Cancel</SecondaryButton>
              <PrimaryButton type="submit" disabled={saving}>{saving ? 'Updating…' : 'Update Status'}</PrimaryButton>
            </div>
          </form>
        )}
      </Modal>
    </Layout>
  )
}
