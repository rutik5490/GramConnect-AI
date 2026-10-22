import React from 'react'

const COLOR_MAP = {
  // complaint status
  registered: 'bg-navy/10 text-navy',
  assigned: 'bg-gold/15 text-gold',
  in_progress: 'bg-saffron/15 text-saffron',
  resolved: 'bg-green/10 text-green',
  feedback_pending: 'bg-gold/15 text-gold',
  closed: 'bg-hairline text-muted',
  // priority
  low: 'bg-hairline text-muted',
  medium: 'bg-navy/10 text-navy',
  high: 'bg-saffron/20 text-saffron',
  critical: 'bg-red-100 text-red-700',
  // campaign / generic
  draft: 'bg-hairline text-muted',
  scheduled: 'bg-navy/10 text-navy',
  running: 'bg-saffron/20 text-saffron',
  completed: 'bg-green/10 text-green',
  cancelled: 'bg-red-100 text-red-700',
}

export function Badge({ value, className = '' }) {
  const key = String(value).toLowerCase()
  const classes = COLOR_MAP[key] || 'bg-hairline text-muted'
  return (
    <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium capitalize ${classes} ${className}`}>
      {key.replace(/_/g, ' ')}
    </span>
  )
}

export function Modal({ open, onClose, title, children, wide = false }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className={`bg-white rounded-xl shadow-xl w-full ${wide ? 'max-w-2xl' : 'max-w-md'} max-h-[90vh] overflow-y-auto`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-hairline flex items-center justify-between sticky top-0 bg-white">
          <h3 className="font-display text-lg text-navy-dark">{title}</h3>
          <button onClick={onClose} className="text-muted hover:text-ink text-xl leading-none">&times;</button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}

export function PrimaryButton({ children, className = '', ...props }) {
  return (
    <button
      className={`bg-navy text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-navy-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

export function SecondaryButton({ children, className = '', ...props }) {
  return (
    <button
      className={`border border-hairline text-navy-dark px-4 py-2 rounded-lg text-sm font-medium hover:bg-paper transition-colors disabled:opacity-50 ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

export function Input({ label, className = '', ...props }) {
  return (
    <label className="block">
      {label && <span className="block text-xs font-medium text-muted mb-1">{label}</span>}
      <input
        className={`w-full border border-hairline rounded-lg px-3 py-2 text-sm focus:border-navy outline-none ${className}`}
        {...props}
      />
    </label>
  )
}

export function Select({ label, children, className = '', ...props }) {
  return (
    <label className="block">
      {label && <span className="block text-xs font-medium text-muted mb-1">{label}</span>}
      <select
        className={`w-full border border-hairline rounded-lg px-3 py-2 text-sm focus:border-navy outline-none bg-white ${className}`}
        {...props}
      >
        {children}
      </select>
    </label>
  )
}

export function TextArea({ label, className = '', ...props }) {
  return (
    <label className="block">
      {label && <span className="block text-xs font-medium text-muted mb-1">{label}</span>}
      <textarea
        className={`w-full border border-hairline rounded-lg px-3 py-2 text-sm focus:border-navy outline-none ${className}`}
        {...props}
      />
    </label>
  )
}
