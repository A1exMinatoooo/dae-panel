import { useCallback, useEffect, useState } from 'react'
import { Pause, Play, RefreshCw } from 'lucide-react'
import type { DaeInfo, DaeStatus } from '../api/client'
import {
  getInfo,
  getStatus,
  reloadDae,
  resumeDae,
  suspendDae,
} from '../api/client'
import StatusBadge from '../components/StatusBadge'
import { Button, Notice, PageFrame } from '../components/ui'


export default function Dashboard() {
  const [status, setStatus] = useState<DaeStatus | null>(null)
  const [info, setInfo] = useState<DaeInfo | null>(null)
  const [loading, setLoading] = useState('')
  const [message, setMessage] = useState('')

  const fetchSystem = useCallback(async () => {
    try {
      const [statusRes, infoRes] = await Promise.all([getStatus(), getInfo()])
      setStatus(statusRes.data)
      setInfo(infoRes.data)
    } catch {
      setStatus(null)
    }
  }, [])

  useEffect(() => {
    fetchSystem()
    const systemTimer = window.setInterval(fetchSystem, 5000)
    return () => window.clearInterval(systemTimer)
  }, [fetchSystem])

  const handleAction = async (action: 'reload' | 'suspend' | 'resume') => {
    setLoading(action)
    setMessage('')
    try {
      const response = action === 'reload' ? await reloadDae() : action === 'suspend' ? await suspendDae() : await resumeDae()
      setMessage(response.data?.message || 'Done')
      await fetchSystem()
    } catch (error: any) {
      setMessage(error.response?.data?.error || error.message)
    } finally {
      setLoading('')
    }
  }


  return (
    <PageFrame className="dashboard" variant="workspace">
      <header className="system-register">
        <div aria-hidden="true" className="system-register__spacer" />
        <div className="system-register__fact system-register__fact--status">{status ? <StatusBadge running={status.running} suspended={status.suspended} /> : <strong>Unavailable</strong>}</div>
        <div className="system-register__fact"><span>Uptime</span><strong>{info?.uptime || 'Unavailable'}</strong></div>
        <div className="system-register__actions">
          <Button icon={RefreshCw} loading={loading === 'reload'} onClick={() => handleAction('reload')} size="sm">Reload</Button>
          {status?.suspended ? (
            <Button disabled={Boolean(loading)} icon={Play} loading={loading === 'resume'} onClick={() => handleAction('resume')} size="sm" variant="primary">Resume</Button>
          ) : (
            <Button disabled={!status?.running || Boolean(loading)} icon={Pause} loading={loading === 'suspend'} onClick={() => handleAction('suspend')} size="sm">Suspend</Button>
          )}
        </div>
      </header>

      {message && <Notice tone={message.toLowerCase().includes('error') ? 'danger' : 'success'}>{message}</Notice>}


      <section className="runtime-section">
        <div className="runtime-section__heading"><span className="section-kicker">Runtime appendix</span><h2>Environment</h2></div>
        <dl className="runtime-facts">
          <div><dt>dae version</dt><dd>{info?.dae_version?.trim() || 'Unavailable'}</dd></div>
          <div><dt>OS</dt><dd>{info ? `${info.os}/${info.arch}` : 'Unavailable'}</dd></div>
          <div><dt>Config path</dt><dd>{info?.config_path || 'Unavailable'}</dd></div>
          <div><dt>Go runtime</dt><dd>{info?.go_version || 'Unavailable'}</dd></div>
        </dl>
      </section>
    </PageFrame>
  )
}
