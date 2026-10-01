import { NavLink } from 'react-router-dom'
import { LayoutDashboard, FileCode, Settings, Zap, FileText } from 'lucide-react'
import ThemeToggle from './ThemeToggle'

const panelVersion = import.meta.env.VITE_APP_VERSION || 'dev'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/config', icon: FileCode, label: 'Config' },
  { to: '/logs', icon: FileText, label: 'Logs' },
  { to: '/settings', icon: Settings, label: 'Settings' },
]

export default function Sidebar({ onNavigate, open = false }: { onNavigate?: () => void; open?: boolean }) {
  return (
    <aside className={`sidebar ${open ? 'is-open' : ''}`} id="primary-navigation">
      <div className="sidebar__brand">
        <div className="sidebar__mark"><Zap size={20} /></div>
        <span>dae Panel</span>
      </div>
      <nav className="sidebar__nav">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            onClick={onNavigate}
            to={to}
            className={({ isActive }) =>
              `sidebar__link ${isActive ? 'is-active' : ''}`
            }
          >
            <Icon size={18} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="sidebar__theme">
        <ThemeToggle />
      </div>
      <div className="sidebar__version">
        <span>panel build</span>
        <strong>{panelVersion}</strong>
      </div>
    </aside>
  )
}
