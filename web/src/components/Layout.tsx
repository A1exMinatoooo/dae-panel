import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import ThemeToggle from './ThemeToggle'

export default function Layout() {
  return (
    <div className="flex h-screen overflow-hidden bg-[var(--bg-primary)] text-[var(--text-primary)]">
      <Sidebar />
      <main className="flex-1 overflow-auto p-6">
        <div className="absolute top-4 right-4">
          <ThemeToggle />
        </div>
        <Outlet />
      </main>
    </div>
  )
}
