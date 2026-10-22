import React, { useEffect, useState } from 'react'
import { Plus, Search, Upload, Download } from 'lucide-react'
import Layout from '../components/Layout'
import { Modal, PrimaryButton, SecondaryButton, Input, Select } from '../components/ui'
import { citizenApi, wardApi } from '../api/endpoints'
import { useAuth } from '../context/AuthContext'
import { API_BASE_URL } from '../api/client'

const emptyForm = {
  name: '', mobile_number: '', address: '', ward_id: '', gender: 'male',
  age: '', occupation: '', annual_income: '', category: '', preferred_language: 'mr',
}

export default function Citizens() {
  const { panchayat } = useAuth()
  const [citizens, setCitizens] = useState([])
  const [wards, setWards] = useState([])
  const [search, setSearch] = useState('')
  const [wardFilter, setWardFilter] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [importFile, setImportFile] = useState(null)
  const [importWard, setImportWard] = useState('')
  const [importOpen, setImportOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  const loadWards = () => {
    if (!panchayat) return
    wardApi.list(panchayat.id).then(({ data }) => setWards(data))
  }

  const loadCitizens = () => {
    citizenApi.list({ ward_id: wardFilter || undefined, search: search || undefined }).then(({ data }) => setCitizens(data))
  }

  useEffect(loadWards, [panchayat])
  useEffect(loadCitizens, [wardFilter])

  const handleSearch = (e) => {
    e.preventDefault()
    loadCitizens()
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await citizenApi.create({
        ...form,
        age: form.age ? Number(form.age) : null,
        annual_income: form.annual_income ? Number(form.annual_income) : null,
      })
      setModalOpen(false)
      setForm(emptyForm)
      loadCitizens()
    } catch (err) {
      alert(err.response?.data?.detail || 'Could not save citizen')
    } finally {
      setSaving(false)
    }
  }

  const handleImport = async (e) => {
    e.preventDefault()
    if (!importFile || !importWard) return
    setSaving(true)
    try {
      const { data } = await citizenApi.importCsv(importWard, importFile)
      alert(`Imported ${data.created} citizens. ${data.errors.length} errors.`)
      setImportOpen(false)
      loadCitizens()
    } catch (err) {
      alert(err.response?.data?.detail || 'Import failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Layout
      title="Citizen Management"
      subtitle="Central citizen database for the Panchayat"
      actions={
        <div className="flex gap-2">
          <SecondaryButton onClick={() => setImportOpen(true)}>
            <span className="flex items-center gap-1.5"><Upload size={15} /> Import CSV</span>
          </SecondaryButton>
          <a
            href={`${API_BASE_URL}/api/citizens/export/csv${wardFilter ? `?ward_id=${wardFilter}` : ''}`}
            className="border border-hairline text-navy-dark px-4 py-2 rounded-lg text-sm font-medium hover:bg-paper transition-colors flex items-center gap-1.5"
          >
            <Download size={15} /> Export
          </a>
          <PrimaryButton onClick={() => setModalOpen(true)}>
            <span className="flex items-center gap-1.5"><Plus size={15} /> Add Citizen</span>
          </PrimaryButton>
        </div>
      }
    >
      <form onSubmit={handleSearch} className="flex gap-3 mb-5">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, mobile, or citizen code…"
            className="w-full border border-hairline rounded-lg pl-9 pr-3 py-2 text-sm focus:border-navy outline-none bg-white"
          />
        </div>
        <select
          value={wardFilter}
          onChange={(e) => setWardFilter(e.target.value)}
          className="border border-hairline rounded-lg px-3 py-2 text-sm bg-white"
        >
          <option value="">All Wards</option>
          {wards.map((w) => (
            <option key={w.id} value={w.id}>{w.name}</option>
          ))}
        </select>
        <SecondaryButton type="submit">Search</SecondaryButton>
      </form>

      <div className="bg-white rounded-xl border border-hairline shadow-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-paper text-muted text-xs uppercase tracking-wider">
            <tr>
              <th className="text-left px-5 py-3 font-medium">Citizen Code</th>
              <th className="text-left px-5 py-3 font-medium">Name</th>
              <th className="text-left px-5 py-3 font-medium">Mobile</th>
              <th className="text-left px-5 py-3 font-medium">Ward</th>
              <th className="text-left px-5 py-3 font-medium">Age</th>
              <th className="text-left px-5 py-3 font-medium">Occupation</th>
              <th className="text-left px-5 py-3 font-medium">Category</th>
            </tr>
          </thead>
          <tbody>
            {citizens.map((c) => (
              <tr key={c.id} className="border-t border-hairline hover:bg-paper/60">
                <td className="px-5 py-3 font-mono text-xs text-navy">{c.citizen_code}</td>
                <td className="px-5 py-3 font-medium text-ink">{c.name}</td>
                <td className="px-5 py-3 text-muted">{c.mobile_number}</td>
                <td className="px-5 py-3 text-muted">{wards.find((w) => w.id === c.ward_id)?.name || '—'}</td>
                <td className="px-5 py-3 text-muted">{c.age || '—'}</td>
                <td className="px-5 py-3 text-muted">{c.occupation || '—'}</td>
                <td className="px-5 py-3 text-muted">{c.category || '—'}</td>
              </tr>
            ))}
            {citizens.length === 0 && (
              <tr>
                <td colSpan={7} className="px-5 py-10 text-center text-muted">No citizens found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add Citizen" wide>
        <form onSubmit={handleSave} className="grid grid-cols-2 gap-4">
          <Input label="Full Name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input label="Mobile Number" required value={form.mobile_number} onChange={(e) => setForm({ ...form, mobile_number: e.target.value })} />
          <Select label="Ward" required value={form.ward_id} onChange={(e) => setForm({ ...form, ward_id: e.target.value })}>
            <option value="">Select ward</option>
            {wards.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
          </Select>
          <Select label="Gender" value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </Select>
          <Input label="Age" type="number" value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} />
          <Input label="Occupation" value={form.occupation} onChange={(e) => setForm({ ...form, occupation: e.target.value })} />
          <Input label="Annual Income (₹)" type="number" value={form.annual_income} onChange={(e) => setForm({ ...form, annual_income: e.target.value })} />
          <Input label="Category (General/OBC/SC/ST)" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
          <div className="col-span-2">
            <Input label="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          </div>
          <div className="col-span-2 flex justify-end gap-2 pt-2">
            <SecondaryButton type="button" onClick={() => setModalOpen(false)}>Cancel</SecondaryButton>
            <PrimaryButton type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save Citizen'}</PrimaryButton>
          </div>
        </form>
      </Modal>

      <Modal open={importOpen} onClose={() => setImportOpen(false)} title="Import Citizens via CSV">
        <form onSubmit={handleImport} className="space-y-4">
          <p className="text-sm text-muted">
            CSV columns: <span className="font-mono text-xs">name, mobile_number, address, age, occupation, annual_income, category</span>
          </p>
          <Select label="Target Ward" required value={importWard} onChange={(e) => setImportWard(e.target.value)}>
            <option value="">Select ward</option>
            {wards.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
          </Select>
          <input type="file" accept=".csv" onChange={(e) => setImportFile(e.target.files[0])} className="text-sm" />
          <div className="flex justify-end gap-2 pt-2">
            <SecondaryButton type="button" onClick={() => setImportOpen(false)}>Cancel</SecondaryButton>
            <PrimaryButton type="submit" disabled={saving}>{saving ? 'Importing…' : 'Import'}</PrimaryButton>
          </div>
        </form>
      </Modal>
    </Layout>
  )
}
