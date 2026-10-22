import React from 'react'

export default function StatCard({ label, value, icon: Icon, accent = 'navy', suffix = '' }) {
  const accentClasses = {
    navy: 'text-navy bg-navy/10',
    saffron: 'text-saffron bg-saffron/15',
    green: 'text-green bg-green/10',
    gold: 'text-gold bg-gold/15',
  }
  return (
    <div className="bg-white rounded-xl border border-hairline shadow-card p-5 flex items-start justify-between">
      <div>
        <p className="text-xs uppercase tracking-wider text-muted font-medium">{label}</p>
        <p className="font-display text-3xl text-navy-dark mt-2">
          {value}
          {suffix && <span className="text-base text-muted ml-1">{suffix}</span>}
        </p>
      </div>
      {Icon && (
        <div className={`p-2.5 rounded-lg ${accentClasses[accent]}`}>
          <Icon size={20} />
        </div>
      )}
    </div>
  )
}
