import React from 'react'
import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Users, MapPinned, ClipboardList, PhoneCall,
  Mic, Landmark, Megaphone, FileBarChart, Sparkles, LogOut,
} from 'lucide-react'
import AshokaChakra from './AshokaChakra'
import { useAuth } from '../context/AuthContext'

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/citizens', label: 'Citizens', icon: Users },
  { to: '/wards', label: 'Wards', icon: MapPinned },
  { to: '/complaints', label: 'Complaints', icon: ClipboardList },
  { to: '/campaigns', label: 'AI Calling Campaigns', icon: PhoneCall },
  { to: '/voice-assistant', label: 'AI Voice Assistant', icon: Mic },
  { to: '/schemes', label: 'Government Schemes', icon: Landmark },
  { to: '/announcements', label: 'Announcements', icon: Megaphone },
  { to: '/insights', label: 'AI Insights', icon: Sparkles },
  { to: '/reports', label: 'Reports', icon: FileBarChart },
]

export default function Sidebar() {
  const { user, panchayat, logout } = useAuth()

  return (
    <aside className="w-64 shrink-0 bg-navy text-white flex flex-col h-screen sticky top-0">
      <div className="tricolor-strip" />
      <div className="px-5 py-5 border-b border-white/10 flex items-center gap-3">
        <AshokaChakra size={38} color="#FF9933" />
        <div>
          <p className="font-display text-lg leading-tight">GramConnect AI</p>
          <p className="text-[11px] text-white/60 tracking-wide">Gram Panchayat Governance</p>
        </div>
      </div>

      {panchayat && (
        <div className="px-5 py-3 border-b border-white/10">
          <p className="text-[11px] uppercase tracking-wider text-white/50">Panchayat</p>
          <p className="text-sm font-medium truncate">{panchayat.name}</p>
          <p className="text-xs text-white/60">{panchayat.district}, {panchayat.state}</p>
        </div>
      )}

      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-1">
        {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors ${
                isActive
                  ? 'bg-saffron text-navy-dark font-semibold'
                  : 'text-white/80 hover:bg-white/10 hover:text-white'
              }`
            }
          >
            <Icon size={17} strokeWidth={2} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="px-4 py-4 border-t border-white/10">
        <p className="text-sm font-medium truncate">{user?.full_name}</p>
        <p className="text-xs text-white/50 capitalize mb-3">{user?.role?.replace(/_/g, ' ')}</p>
        <button
          onClick={logout}
          className="flex items-center gap-2 text-xs text-white/70 hover:text-white transition-colors"
        >
          <LogOut size={14} /> Sign out
        </button>
      </div>
      <div className="tricolor-strip" />
    </aside>
  )
}
