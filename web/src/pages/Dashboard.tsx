import { useCallback, useEffect, useRef, useState } from 'react'
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
import { Button, Notice, PageFrame, PageHeader } from '../components/ui'

type ServiceAction = 'reload' | 'suspend' | 'resume'
type ActionMessage = { text: string; tone: 'success' | 'danger' } | null
type ActionError = {
  message?: string
  response?: { data?: { error?: string } }
}

export default function Dashboard() {
  const [status, setStatus] = useState<DaeStatus | null>(null)
  const [info, setInfo] = useState<DaeInfo | null>(null)
  const [statusPending, setStatusPending] = useState(true)
  const [infoPending, setInfoPending] = useState(true)
  const [statusFailed, setStatusFailed] = useState(false)
  const [infoFailed, setInfoFailed] = useState(false)
  const [loading, setLoading] = useState<ServiceAction | ''>('')
  const [message, setMessage] = useState<ActionMessage>(null)
  const actionInFlight = useRef(false)

  const fetchSystem = useCallback(async () => {
    const loadStatus = getStatus()
      .then(({ data }) => {
        setStatus(data)
        setStatusFailed(false)
      })
      .catch(() => {
        setStatus(null)
        setStatusFailed(true)
      })
      .finally(() => setStatusPending(false))

    const loadInfo = getInfo()
      .then(({ data }) => {
        setInfo(data)
        setInfoFailed(false)
      })
      .catch(() => {
        setInfo(null)
        setInfoFailed(true)
      })
      .finally(() => setInfoPending(false))

    await Promise.allSettled([loadStatus, loadInfo])
  }, [])

  useEffect(() => {
    void fetchSystem()
    const systemTimer = window.setInterval(() => void fetchSystem(), 5000)
    return () => window.clearInterval(systemTimer)
  }, [fetchSystem])

  const handleAction = async (action: ServiceAction) => {
    if (actionInFlight.current) return
    actionInFlight.current = true
    setLoading(action)
    setMessage(null)
    try {
      const response = action === 'reload'
        ? await reloadDae()
        : action === 'suspend'
          ? await suspendDae()
          : await resumeDae()
      setMessage({ text: response.data?.message || 'Done', tone: 'success' })
    } catch (error: unknown) {
      const actionError = error as ActionError
      setMessage({
        text: actionError.response?.data?.error || actionError.message || 'Unable to complete service action.',
        tone: 'danger',
      })
    } finally {
      await fetchSystem()
      actionInFlight.current = false
      setLoading('')
    }
  }

  const operationPending = loading !== ''
  const canSuspend = status?.running === true && !status.suspended
  const canResume = status?.running === true && status.suspended
  const stopped = status?.running === false
  const processUptime = stopped
    ? '—'
    : infoPending
      ? 'Loading…'
      : info?.uptime?.trim() || 'Unavailable'
  const pid = stopped
    ? '—'
    : statusPending
      ? 'Loading…'
      : status?.pid && status.pid > 0
        ? String(status.pid)
        : 'Unavailable'

  return (
    <PageFrame className="dashboard">
      <PageHeader title="Dashboard" />

      <section aria-labelledby="service-status-heading" className="service-section">
        <h2 id="service-status-heading">Service status</h2>
        <div className="system-register">
          <div className="system-register__fact system-register__fact--status">
            {statusPending
              ? <strong>Loading…</strong>
              : status
                ? <StatusBadge running={status.running} suspended={status.suspended} />
                : <strong>Unavailable</strong>}
          </div>
          <div className="system-register__fact system-register__fact--uptime">
            <span>Process uptime</span>
            <strong>{processUptime}</strong>
          </div>
          <div className="system-register__fact system-register__fact--pid">
            <span>PID</span>
            <strong>{pid}</strong>
          </div>
          <div className="system-register__actions">
            <Button
              disabled={operationPending}
              icon={RefreshCw}
              loading={loading === 'reload'}
              onClick={() => void handleAction('reload')}
              size="sm"
            >
              Reload
            </Button>
            {canResume ? (
              <Button
                disabled={operationPending}
                icon={Play}
                loading={loading === 'resume'}
                onClick={() => void handleAction('resume')}
                size="sm"
                variant="primary"
              >
                Resume
              </Button>
            ) : (
              <Button
                disabled={!canSuspend || operationPending}
                icon={Pause}
                loading={loading === 'suspend'}
                onClick={() => void handleAction('suspend')}
                size="sm"
              >
                Suspend
              </Button>
            )}
          </div>
        </div>
        {(statusFailed || infoFailed) && (
          <Notice tone="warning">
            <div className="dashboard-load-errors">
              {statusFailed && <div>Unable to load service status.</div>}
              {infoFailed && <div>Unable to load environment information.</div>}
            </div>
          </Notice>
        )}
        {message && <Notice tone={message.tone}>{message.text}</Notice>}
      </section>

      <section aria-labelledby="environment-heading" className="runtime-section">
        <h2 id="environment-heading">Environment</h2>
        <dl className="runtime-facts">
          <div><dt>dae version</dt><dd>{infoPending ? 'Loading…' : info?.dae_version?.trim() || 'Unavailable'}</dd></div>
          <div><dt>Panel platform</dt><dd>{infoPending ? 'Loading…' : info?.os?.trim() && info?.arch?.trim() ? `${info.os.trim()}/${info.arch.trim()}` : 'Unavailable'}</dd></div>
          <div><dt>Config path</dt><dd>{infoPending ? 'Loading…' : info?.config_path?.trim() || 'Unavailable'}</dd></div>
          <div><dt>Panel Go runtime</dt><dd>{infoPending ? 'Loading…' : info?.go_version?.trim() || 'Unavailable'}</dd></div>
        </dl>
      </section>
    </PageFrame>
  )
}
