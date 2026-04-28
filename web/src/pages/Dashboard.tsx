import { useEffect, useState, useRef } from 'react'
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
  const [now, setNow] = useState(Date.now())
  const uptimeStartRef = useRef<number>(0)

  const fetchData = async () => {
    try {
      const [statusRes, infoRes] = await Promise.all([
        getStatus(),
        getInfo(),
      ])
      setStatus(statusRes.data)
      setInfo(infoRes.data)
      if (infoRes.data.uptime) {
        uptimeStartRef.current = Date.now()
      }
    } catch {}
  }

  useEffect(() => {
    fetchData()
    const interval = setInterval(() => {
      fetchData()
      setNow(Date.now())
    }, 5000)
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

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
          <div className="flex items-center justify-between mb-3">
            <span className="text-gray-400 text-sm">dae Status</span>
            <Activity className="w-5 h-5 text-gray-500" />
          </div>
          <div className="text-2xl font-bold mb-2">
            {status ? (
              <StatusBadge running={status.running} suspended={status.suspended} />
            ) : (
              <span className="text-gray-500">Loading...</span>
            )}
          </div>
          {status?.pid && (
            <span className="text-xs text-gray-500">PID: {status.pid}</span>
          )}
        </div>

        <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
          <div className="flex items-center justify-between mb-3">
            <span className="text-gray-400 text-sm">Uptime</span>
            <Clock className="w-5 h-5 text-gray-500" />
          </div>
          <div className="text-2xl font-bold text-gray-200">
            {info?.uptime || '-'}
          </div>
        </div>

        <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
          <div className="flex items-center justify-between mb-3">
            <span className="text-gray-400 text-sm">dae Version</span>
            <Server className="w-5 h-5 text-gray-500" />
          </div>
          <div className="text-lg font-mono text-gray-200">
            {info?.dae_version?.trim() || '-'}
          </div>
        </div>

        <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
          <div className="flex items-center justify-between mb-3">
            <span className="text-gray-400 text-sm">Platform</span>
            <Cpu className="w-5 h-5 text-gray-500" />
          </div>
          <div className="text-lg font-mono text-gray-200">
            {info ? `${info.os}/${info.arch}` : '-'}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Go {info?.go_version}
          </div>
        </div>
      </div>

      <div className="bg-gray-900 rounded-xl p-5 border border-gray-800 mb-6">
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => handleAction('reload')}
            disabled={!!loading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg text-sm font-medium transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading === 'reload' ? 'animate-spin' : ''}`} />
            Reload
          </button>
          <button
            onClick={() => handleAction('suspend')}
            disabled={!!loading}
            className="flex items-center gap-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 disabled:opacity-50 rounded-lg text-sm font-medium transition-colors"
          >
            <Pause className={`w-4 h-4 ${loading === 'suspend' ? 'animate-spin' : ''}`} />
            Suspend
          </button>
          <button
            onClick={() => handleAction('resume')}
            disabled={!!loading}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 rounded-lg text-sm font-medium transition-colors"
          >
            <Play className={`w-4 h-4 ${loading === 'resume' ? 'animate-spin' : ''}`} />
            Resume
          </button>
        </div>
        {message && (
          <div className="mt-3 p-3 bg-gray-800 rounded-lg text-sm text-gray-300">
            {message}
          </div>
        )}
      </div>

      <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
        <h2 className="text-lg font-semibold mb-4">Config Path</h2>
        <code className="text-sm text-gray-400 bg-gray-800 px-3 py-1 rounded">
          {info?.config_path || '-'}
        </code>
      </div>
    </div>
  )
}
