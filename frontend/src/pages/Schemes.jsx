import React, { useEffect, useState } from 'react'
import { Landmark, Search } from 'lucide-react'
import Layout from '../components/Layout'
import { SecondaryButton, Select } from '../components/ui'
import { schemeApi, citizenApi } from '../api/endpoints'

export default function Schemes() {
  const [schemes, setSchemes] = useState([])
  const [citizens, setCitizens] = useState([])
  const [selectedCitizen, setSelectedCitizen] = useState('')
  const [eligible, setEligible] = useState(null)
  const [checking, setChecking] = useState(false)

  useEffect(() => {
    schemeApi.list().then(({ data }) => setSchemes(data))
    citizenApi.list({ limit: 500 }).then(({ data }) => setCitizens(data))
  }, [])

  const checkEligibility = async () => {
    if (!selectedCitizen) return
    setChecking(true)
    try {
      const { data } = await schemeApi.eligible(selectedCitizen)
      setEligible(data)
    } finally {
      setChecking(false)
    }
  }

  return (
    <Layout title="Government Scheme Assistant" subtitle="Browse schemes and check which ones a citizen is eligible for">
      <div className="bg-white rounded-xl border border-hairline shadow-card p-5 mb-6 flex items-end gap-3 flex-wrap">
        <div className="flex-1 min-w-[240px]">
          <Select label="Check eligibility for citizen" value={selectedCitizen} onChange={(e) => setSelectedCitizen(e.target.value)}>
            <option value="">Select a citizen…</option>
            {citizens.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.age || '—'} yrs, {c.occupation || '—'})</option>)}
          </Select>
        </div>
        <SecondaryButton onClick={checkEligibility} disabled={!selectedCitizen || checking}>
          <span className="flex items-center gap-1.5"><Search size={14} /> {checking ? 'Checking…' : 'Check Eligibility'}</span>
        </SecondaryButton>
      </div>

      {eligible && (
        <div className="mb-6">
          <h3 className="font-display text-lg text-navy-dark mb-3">
            {eligible.length} eligible scheme{eligible.length !== 1 ? 's' : ''} found
          </h3>
          {eligible.length === 0 ? (
            <p className="text-sm text-muted">No matching schemes for this citizen's current profile.</p>
          ) : (
            <div className="grid gap-3">
              {eligible.map((s) => <SchemeCard key={s.id} scheme={s} highlighted />)}
            </div>
          )}
        </div>
      )}

      <h3 className="font-display text-lg text-navy-dark mb-3">All Government Schemes</h3>
      <div className="grid gap-3">
        {schemes.map((s) => <SchemeCard key={s.id} scheme={s} />)}
        {schemes.length === 0 && <p className="text-muted">No schemes added yet.</p>}
      </div>
    </Layout>
  )
}

function SchemeCard({ scheme, highlighted }) {
  return (
    <div className={`bg-white rounded-xl border p-5 shadow-card ${highlighted ? 'border-green/40 bg-green/5' : 'border-hairline'}`}>
      <div className="flex items-start gap-3">
        <div className="p-2.5 rounded-lg bg-navy/10 text-navy shrink-0"><Landmark size={18} /></div>
        <div className="min-w-0">
          <h4 className="font-display text-base text-navy-dark">{scheme.name}</h4>
          {scheme.name_marathi && <p className="text-sm text-muted">{scheme.name_marathi}</p>}
          <p className="text-sm text-ink mt-2">{scheme.description}</p>
          <div className="flex flex-wrap gap-2 mt-3 text-xs text-muted">
            {scheme.department && <span className="bg-paper px-2 py-1 rounded-full">{scheme.department}</span>}
            {scheme.min_age && <span className="bg-paper px-2 py-1 rounded-full">Min age {scheme.min_age}</span>}
            {scheme.max_annual_income && <span className="bg-paper px-2 py-1 rounded-full">Income ≤ ₹{scheme.max_annual_income.toLocaleString('en-IN')}</span>}
          </div>
        </div>
      </div>
    </div>
  )
}
