import { useEffect, useState } from 'react'
import {
  Activity,
  RefreshCw,
  Pause,
  Play,
  Server,
  Clock,
  Cpu,
} from 'lucide-react'
import StatusBadge from '../components/StatusBadge'
import type { DaeStatus, DaeInfo } from '../api/client'
import { getStatus, getInfo, reloadDae, suspendDae, resumeDae } from '../api/client'

export default function Dashboard() {
  const [status, setStatus] = useState<DaeStatus | null>(null)
  const [info, setInfo] = useState<DaeInfo | null>(null)
  const [loading, setLoading] = useState('')
  const [message, setMessage] = useState('')

  const fetchData = async () => {
    try {
      const [statusRes, infoRes] = await Promise.all([
        getStatus(),
        getInfo(),
      ])
      setStatus(statusRes.data)
      setInfo(infoRes.data)
    } catch {}
  }

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 5000)
    return () => clearInterval(interval)
  }, [])

  const handleAction = async (action: string) => {
    setLoading(action)
    setMessage('')
    try {
      let res
      switch (action) {
        case 'reload':
          res = await reloadDae()
          break
        case 'suspend':
          res = await suspendDae()
          break
        case 'resume':
          res = await resumeDae()
          break
      }
      setMessage(res?.data?.message || 'Done')
      await fetchData()
    } catch (e: any) {
      setMessage(e.response?.data?.error || e.message)
    } finally {
      setLoading('')
    }
  }

  const cardClass = 'rounded-xl p-5 border border-[var(--border)] bg-[var(--bg-secondary)]'

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className={cardClass}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-[var(--text-secondary)] text-sm">dae Status</span>
            <Activity className="w-5 h-5 text-[var(--text-tertiary)]" />
          </div>
          <div className="text-2xl font-bold mb-2">
            {status ? (
              <StatusBadge running={status.running} suspended={status.suspended} />
            ) : (
              <span className="text-[var(--text-tertiary)]">Loading...</span>
            )}
          </div>
          {status?.pid && (
            <span className="text-xs text-[var(--text-tertiary)]">PID: {status.pid}</span>
          )}
        </div>

        <div className={cardClass}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-[var(--text-secondary)] text-sm">Uptime</span>
            <Clock className="w-5 h-5 text-[var(--text-tertiary)]" />
          </div>
          <div className="text-2xl font-bold">
            {info?.uptime || '-'}
          </div>
        </div>

        <div className={cardClass}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-[var(--text-secondary)] text-sm">dae-panel</span>
            <Server className="w-5 h-5 text-[var(--text-tertiary)]" />
          </div>
          <div className="text-lg font-mono">
            {info?.panel_version || '-'}
          </div>
        </div>

        <div className={cardClass}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-[var(--text-secondary)] text-sm">dae Version</span>
            <Server className="w-5 h-5 text-[var(--text-tertiary)]" />
          </div>
          <div className="text-sm font-mono break-all max-h-20 overflow-y-auto">
            {info?.dae_version?.trim() || '-'}
          </div>
        </div>

        <div className={cardClass}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-[var(--text-secondary)] text-sm">Platform</span>
            <Cpu className="w-5 h-5 text-[var(--text-tertiary)]" />
          </div>
          <div className="text-lg font-mono">
            {info ? `${info.os}/${info.arch}` : '-'}
          </div>
          <div className="text-xs text-[var(--text-tertiary)] mt-1">
            Go {info?.go_version}
          </div>
        </div>
      </div>

      <div className={`${cardClass} mb-6`}>
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => handleAction('reload')}
            disabled={!!loading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg text-sm font-medium text-white transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading === 'reload' ? 'animate-spin' : ''}`} />
            Reload
          </button>
          <button
            onClick={() => handleAction('suspend')}
            disabled={!!loading}
            className="flex items-center gap-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 disabled:opacity-50 rounded-lg text-sm font-medium text-white transition-colors"
          >
            <Pause className={`w-4 h-4 ${loading === 'suspend' ? 'animate-spin' : ''}`} />
            Suspend
          </button>
          <button
            onClick={() => handleAction('resume')}
            disabled={!!loading}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 rounded-lg text-sm font-medium text-white transition-colors"
          >
            <Play className={`w-4 h-4 ${loading === 'resume' ? 'animate-spin' : ''}`} />
            Resume
          </button>
        </div>
        {message && (
          <div className="mt-3 p-3 bg-[var(--bg-tertiary)] rounded-lg text-sm">
            {message}
          </div>
        )}
      </div>

      <div className={cardClass}>
        <h2 className="text-lg font-semibold mb-4">Config Path</h2>
        <code className="text-sm bg-[var(--bg-tertiary)] px-3 py-1 rounded">
          {info?.config_path || '-'}
        </code>
      </div>
    </div>
  )
}
