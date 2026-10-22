import React, { useEffect, useState } from 'react'
import { Bell } from 'lucide-react'
import { notificationApi } from '../api/endpoints'

export default function TopBar({ title, subtitle, actions }) {
  const [notifications, setNotifications] = useState([])
  const [open, setOpen] = useState(false)

  useEffect(() => {
    notificationApi.list(true).then(({ data }) => setNotifications(data)).catch(() => {})
  }, [])

  return (
    <header className="bg-white border-b border-hairline px-8 py-5 flex items-center justify-between">
      <div>
        <h1 className="font-display text-2xl text-navy-dark">{title}</h1>
        {subtitle && <p className="text-sm text-muted mt-0.5">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-4">
        {actions}
        <div className="relative">
          <button
            onClick={() => setOpen((o) => !o)}
            className="relative p-2 rounded-full hover:bg-paper transition-colors"
            aria-label="Notifications"
          >
            <Bell size={20} className="text-navy" />
            {notifications.length > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-saffron" />
            )}
          </button>
          {open && (
            <div className="absolute right-0 mt-2 w-80 bg-white border border-hairline rounded-lg shadow-card z-20 max-h-96 overflow-y-auto">
              <div className="px-4 py-3 border-b border-hairline font-semibold text-sm text-navy-dark">
                Notifications
              </div>
              {notifications.length === 0 ? (
                <p className="px-4 py-6 text-sm text-muted text-center">No new notifications</p>
              ) : (
                notifications.map((n) => (
                  <div key={n.id} className="px-4 py-3 border-b border-hairline last:border-0 text-sm">
                    <p className="text-ink">{n.message}</p>
                    <p className="text-xs text-muted mt-1">{new Date(n.created_at).toLocaleString()}</p>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
