import { useEffect, useRef, useState } from 'react'
import { Menu, X, Zap } from 'lucide-react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import { IconButton } from './ui'

export default function Layout() {
  const [navOpen, setNavOpen] = useState(false)
  const headerRef = useRef<HTMLElement>(null)

  useEffect(() => {
    if (!navOpen) return
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      setNavOpen(false)
      headerRef.current?.querySelector<HTMLButtonElement>('button')?.focus()
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [navOpen])

  return (
    <div className="app-shell">
      <header className="mobile-header" ref={headerRef}>
        <div className="mobile-header__brand"><Zap size={18} /> dae Panel</div>
        <IconButton
          aria-controls="primary-navigation"
          aria-expanded={navOpen}
          icon={navOpen ? X : Menu}
          label={navOpen ? 'Close navigation' : 'Open navigation'}
          onClick={() => setNavOpen((open) => !open)}
        />
      </header>
      <Sidebar onNavigate={() => setNavOpen(false)} open={navOpen} />
      {navOpen && <button aria-label="Close navigation" className="app-shell__scrim" onClick={() => setNavOpen(false)} />}
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  )
}
