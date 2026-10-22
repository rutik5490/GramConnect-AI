import React, { useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import Layout from '../components/Layout'
import { Modal, PrimaryButton, SecondaryButton, Input } from '../components/ui'
import { wardApi } from '../api/endpoints'
import { useAuth } from '../context/AuthContext'

const emptyForm = { name: '', ward_number: '', population: '', households: '', local_issues: '' }

export default function Wards() {
  const { panchayat } = useAuth()
  const [stats, setStats] = useState([])
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  const load = () => {
    if (!panchayat) return
    wardApi.stats(panchayat.id).then(({ data }) => setStats(data))
  }

  useEffect(load, [panchayat])

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await wardApi.create({
        panchayat_id: panchayat.id,
        name: form.name,
        ward_number: Number(form.ward_number),
        population: Number(form.population) || 0,
        households: Number(form.households) || 0,
        local_issues: form.local_issues,
      })
      setModalOpen(false)
      setForm(emptyForm)
      load()
    } catch (err) {
      alert(err.response?.data?.detail || 'Could not save ward')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Layout
      title="Ward Management"
      subtitle="Wards, population, and local issue tracking"
      actions={
        <PrimaryButton onClick={() => setModalOpen(true)}>
          <span className="flex items-center gap-1.5"><Plus size={15} /> Add Ward</span>
        </PrimaryButton>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {stats.map((w) => (
          <div key={w.ward_id} className="bg-white rounded-xl border border-hairline shadow-card p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-navy bg-navy/10 px-2 py-1 rounded-md">Ward {w.ward_number}</span>
              {w.open_complaints > 0 && (
                <span className="text-xs font-semibold text-saffron bg-saffron/15 px-2 py-1 rounded-md">
                  {w.open_complaints} open
                </span>
              )}
            </div>
            <h3 className="font-display text-lg text-navy-dark mb-3">{w.ward_name}</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-muted text-xs">Citizens registered</p>
                <p className="font-semibold text-ink">{w.total_citizens}</p>
              </div>
              <div>
                <p className="text-muted text-xs">Total complaints</p>
                <p className="font-semibold text-ink">{w.total_complaints}</p>
              </div>
            </div>
          </div>
        ))}
        {stats.length === 0 && (
          <p className="text-muted col-span-full text-center py-12">No wards yet. Add your first ward to get started.</p>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add Ward">
        <form onSubmit={handleSave} className="space-y-4">
          <Input label="Ward Name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input label="Ward Number" type="number" required value={form.ward_number} onChange={(e) => setForm({ ...form, ward_number: e.target.value })} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Population" type="number" value={form.population} onChange={(e) => setForm({ ...form, population: e.target.value })} />
            <Input label="Households" type="number" value={form.households} onChange={(e) => setForm({ ...form, households: e.target.value })} />
          </div>
          <Input label="Known Local Issues" value={form.local_issues} onChange={(e) => setForm({ ...form, local_issues: e.target.value })} />
          <div className="flex justify-end gap-2 pt-2">
            <SecondaryButton type="button" onClick={() => setModalOpen(false)}>Cancel</SecondaryButton>
            <PrimaryButton type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save Ward'}</PrimaryButton>
          </div>
        </form>
      </Modal>
    </Layout>
  )
}
