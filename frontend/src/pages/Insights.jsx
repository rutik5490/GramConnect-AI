import React, { useEffect, useState } from 'react'
import { Sparkles, RefreshCw, AlertTriangle, Eye, Info } from 'lucide-react'
import Layout from '../components/Layout'
import { PrimaryButton } from '../components/ui'
import { analyticsApi } from '../api/endpoints'
import { useAuth } from '../context/AuthContext'

const SEVERITY_CONFIG = {
  alert: { icon: AlertTriangle, classes: 'bg-red-50 text-red-700 border-red-200' },
  watch: { icon: Eye, classes: 'bg-saffron/10 text-saffron border-saffron/30' },
  info: { icon: Info, classes: 'bg-navy/5 text-navy border-navy/20' },
}

export default function Insights() {
  const { panchayat } = useAuth()
  const [insights, setInsights] = useState([])
  const [generating, setGenerating] = useState(false)

  const load = () => {
    if (!panchayat) return
    analyticsApi.insights(panchayat.id).then(({ data }) => setInsights(data))
  }

  useEffect(load, [panchayat])

  const generate = async () => {
    setGenerating(true)
    try {
      await analyticsApi.generateInsights(panchayat.id)
      load()
    } finally {
      setGenerating(false)
    }
  }

  return (
    <Layout
      title="AI Insights"
      subtitle="Automatically generated governance insights from complaint and campaign data"
      actions={
        <PrimaryButton onClick={generate} disabled={generating}>
          <span className="flex items-center gap-1.5">
            <RefreshCw size={14} className={generating ? 'animate-spin' : ''} /> {generating ? 'Analyzing…' : 'Generate Insights'}
          </span>
        </PrimaryButton>
      }
    >
      <div className="space-y-3">
        {insights.map((insight) => {
          const cfg = SEVERITY_CONFIG[insight.severity] || SEVERITY_CONFIG.info
          const Icon = cfg.icon
          return (
            <div key={insight.id} className={`rounded-xl border p-5 flex gap-4 ${cfg.classes}`}>
              <Icon size={20} className="shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-ink">{insight.headline}</p>
                {insight.detail && <p className="text-sm mt-1 opacity-80">{insight.detail}</p>}
                <p className="text-xs mt-2 opacity-60">{new Date(insight.generated_at).toLocaleString()}</p>
              </div>
            </div>
          )
        })}
        {insights.length === 0 && (
          <div className="text-center py-16">
            <Sparkles size={32} className="mx-auto text-muted mb-3" />
            <p className="text-muted">No insights generated yet. Click "Generate Insights" to analyze current data.</p>
          </div>
        )}
      </div>
    </Layout>
  )
}
