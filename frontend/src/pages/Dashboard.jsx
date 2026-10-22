import React, { useEffect, useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts'
import { Users, MapPinned, PhoneCall, ClipboardList } from 'lucide-react'
import Layout from '../components/Layout'
import StatCard from '../components/StatCard'
import { analyticsApi } from '../api/endpoints'
import { useAuth } from '../context/AuthContext'

const CATEGORY_COLORS = ['#0B3D6B', '#FF9933', '#138808', '#C9A227', '#12518C', '#FFB05C', '#0D6606', '#8a8a8a']
const SENTIMENT_COLORS = { positive: '#138808', neutral: '#C9A227', negative: '#B91C1C' }

export default function Dashboard() {
  const { panchayat } = useAuth()
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!panchayat) return
    analyticsApi.dashboard(panchayat.id).then(({ data }) => setSummary(data)).finally(() => setLoading(false))
  }, [panchayat])

  if (loading || !summary) {
    return (
      <Layout title="Dashboard" subtitle="Governance overview">
        <p className="text-muted">Loading dashboard…</p>
      </Layout>
    )
  }

  const categoryData = Object.entries(summary.complaints_by_category).map(([name, value]) => ({ name, value }))
  const wardData = Object.entries(summary.complaints_by_ward).map(([name, value]) => ({ name, value }))
  const sentimentData = Object.entries(summary.sentiment_breakdown)
    .filter(([, v]) => v > 0)
    .map(([name, value]) => ({ name, value }))

  return (
    <Layout title="Dashboard" subtitle={panchayat ? `${panchayat.name}, ${panchayat.district}` : 'Governance overview'}>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Citizens" value={summary.total_citizens} icon={Users} accent="navy" />
        <StatCard label="Total Wards" value={summary.total_wards} icon={MapPinned} accent="green" />
        <StatCard
          label="AI Call Completion"
          value={summary.call_completion_rate}
          suffix="%"
          icon={PhoneCall}
          accent="saffron"
        />
        <StatCard label="Open Complaints" value={summary.open_complaints} icon={ClipboardList} accent="gold" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-xl border border-hairline shadow-card p-6">
          <h3 className="font-display text-lg text-navy-dark mb-4">Complaints by Category</h3>
          {categoryData.length === 0 ? (
            <p className="text-sm text-muted">No complaints logged yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={categoryData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E3E0D5" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-20} textAnchor="end" height={60} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {categoryData.map((_, i) => (
                    <Cell key={i} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-white rounded-xl border border-hairline shadow-card p-6">
          <h3 className="font-display text-lg text-navy-dark mb-4">Complaints by Ward</h3>
          {wardData.length === 0 ? (
            <p className="text-sm text-muted">No complaints logged yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={wardData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#E3E0D5" />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={140} />
                <Tooltip />
                <Bar dataKey="value" fill="#0B3D6B" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl border border-hairline shadow-card p-6 lg:col-span-1">
          <h3 className="font-display text-lg text-navy-dark mb-4">AI Call Sentiment</h3>
          {sentimentData.length === 0 ? (
            <p className="text-sm text-muted">Run a calling campaign to see sentiment data.</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={sentimentData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80}>
                  {sentimentData.map((entry, i) => (
                    <Cell key={i} fill={SENTIMENT_COLORS[entry.name] || '#8a8a8a'} />
                  ))}
                </Pie>
                <Legend />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-white rounded-xl border border-hairline shadow-card p-6 lg:col-span-2">
          <h3 className="font-display text-lg text-navy-dark mb-4">Complaint Resolution</h3>
          <div className="space-y-4">
            <MetricRow label="Total Complaints" value={summary.total_complaints} />
            <MetricRow label="Resolved" value={summary.resolved_complaints} accent="green" />
            <MetricRow label="Open" value={summary.open_complaints} accent="saffron" />
            <MetricRow
              label="Citizen Satisfaction (avg / 5)"
              value={summary.citizen_satisfaction_avg ?? 'No feedback yet'}
              accent="gold"
            />
          </div>
        </div>
      </div>
    </Layout>
  )
}

function MetricRow({ label, value, accent = 'navy' }) {
  const colorMap = { navy: 'text-navy', green: 'text-green', saffron: 'text-saffron', gold: 'text-gold' }
  return (
    <div className="flex items-center justify-between border-b border-hairline last:border-0 pb-3 last:pb-0">
      <span className="text-sm text-muted">{label}</span>
      <span className={`font-display text-lg ${colorMap[accent]}`}>{value}</span>
    </div>
  )
}
