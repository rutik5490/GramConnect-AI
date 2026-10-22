import React, { useEffect, useState } from 'react'
import { FileText, FileSpreadsheet, FileDown, Download } from 'lucide-react'
import Layout from '../components/Layout'
import { PrimaryButton, Select } from '../components/ui'
import { reportApi } from '../api/endpoints'
import { useAuth } from '../context/AuthContext'

const REPORT_TYPES = [
  ['complaints', 'Complaint Report'],
  ['citizens', 'Citizen Report'],
  ['campaigns', 'Campaign Report'],
  ['wards', 'Ward Report'],
]

const FORMATS = [
  ['pdf', 'PDF', FileText],
  ['excel', 'Excel', FileSpreadsheet],
  ['csv', 'CSV', FileDown],
]

export default function Reports() {
  const { panchayat } = useAuth()
  const [reportType, setReportType] = useState('complaints')
  const [format, setFormat] = useState('pdf')
  const [generating, setGenerating] = useState(false)
  const [reports, setReports] = useState([])

  const load = () => {
    if (!panchayat) return
    reportApi.list(panchayat.id).then(({ data }) => setReports(data))
  }

  useEffect(load, [panchayat])

  const generate = async () => {
    setGenerating(true)
    try {
      await reportApi.generate({ panchayat_id: panchayat.id, report_type: reportType, format })
      load()
    } catch (err) {
      alert(err.response?.data?.detail || 'Could not generate report')
    } finally {
      setGenerating(false)
    }
  }

  return (
    <Layout title="Reports" subtitle="Generate and download complaint, citizen, campaign, and ward reports">
      <div className="bg-white rounded-xl border border-hairline shadow-card p-5 mb-6 flex items-end gap-3 flex-wrap">
        <div className="min-w-[220px]">
          <Select label="Report Type" value={reportType} onChange={(e) => setReportType(e.target.value)}>
            {REPORT_TYPES.map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </Select>
        </div>
        <div className="min-w-[160px]">
          <Select label="Format" value={format} onChange={(e) => setFormat(e.target.value)}>
            {FORMATS.map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </Select>
        </div>
        <PrimaryButton onClick={generate} disabled={generating}>
          {generating ? 'Generating…' : 'Generate Report'}
        </PrimaryButton>
      </div>

      <div className="bg-white rounded-xl border border-hairline shadow-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-paper text-muted text-xs uppercase tracking-wider">
            <tr>
              <th className="text-left px-5 py-3 font-medium">Report</th>
              <th className="text-left px-5 py-3 font-medium">Format</th>
              <th className="text-left px-5 py-3 font-medium">Generated</th>
              <th className="text-right px-5 py-3 font-medium">Download</th>
            </tr>
          </thead>
          <tbody>
            {reports.map((r) => {
              const FmtIcon = FORMATS.find(([k]) => k === r.format)?.[2] || FileText
              return (
                <tr key={r.id} className="border-t border-hairline hover:bg-paper/60">
                  <td className="px-5 py-3 font-medium text-ink capitalize">{r.report_type} Report</td>
                  <td className="px-5 py-3 text-muted flex items-center gap-1.5"><FmtIcon size={14} /> {r.format.toUpperCase()}</td>
                  <td className="px-5 py-3 text-muted">{new Date(r.created_at).toLocaleString()}</td>
                  <td className="px-5 py-3 text-right">
                    <a
                      href={reportApi.downloadUrl(r.id)}
                      className="inline-flex items-center gap-1.5 text-navy hover:text-navy-dark font-medium"
                    >
                      <Download size={14} /> Download
                    </a>
                  </td>
                </tr>
              )
            })}
            {reports.length === 0 && (
              <tr><td colSpan={4} className="px-5 py-10 text-center text-muted">No reports generated yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </Layout>
  )
}
