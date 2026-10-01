import { NavLink } from 'react-router-dom'
import { LayoutDashboard, FileCode, Settings, Zap } from 'lucide-react'
import ThemeToggle from './ThemeToggle'

const panelVersion = import.meta.env.VITE_APP_VERSION || 'dev'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/config', icon: FileCode, label: 'Config' },
  { to: '/logs', icon: LayoutDashboard, label: 'Logs', customIcon: true },
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
        {navItems.map(({ to, icon: Icon, label, customIcon }) => (
          <NavLink
            key={to}
            onClick={onNavigate}
            to={to}
            className={({ isActive }) =>
              `sidebar__link ${isActive ? 'is-active' : ''}`
            }
          >
            {customIcon ? (
              <span aria-hidden="true" className="logs-glyph"><i /><i /><i /><i /><i /></span>
            ) : (
              <Icon size={17} />
            )}
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
