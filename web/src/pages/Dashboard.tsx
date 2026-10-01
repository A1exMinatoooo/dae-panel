import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ChevronDown, Pause, Play, RefreshCw } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { DaeInfo, DaeStatus, TrafficSnapshot } from '../api/client'
import {
  getInfo,
  getNetworkTraffic,
  getStatus,
  getTrafficPreference,
  reloadDae,
  resumeDae,
  suspendDae,
} from '../api/client'
import StatusBadge from '../components/StatusBadge'
import { Button, Notice, PageFrame } from '../components/ui'

interface TrafficPoint { rx: number; tx: number }

const MAX_POINTS = 60

function formatBytes(value?: number | null, suffix = '') {
  if (value == null || !Number.isFinite(value)) return 'Unavailable'
  const units = ['B', 'KiB', 'MiB', 'GiB', 'TiB']
  let amount = Math.max(0, value)
  let unit = 0
  while (amount >= 1024 && unit < units.length - 1) {
    amount /= 1024
    unit += 1
  }
  const precision = amount >= 100 || unit === 0 ? 0 : amount >= 10 ? 1 : 2
  return `${amount.toFixed(precision)} ${units[unit]}${suffix}`
}

function MetricValue({ value, suffix = '' }: { value?: number | null; suffix?: string }) {
  const formatted = formatBytes(value, suffix)
  if (formatted === 'Unavailable') return <strong>Unavailable</strong>
  const [amount, ...unit] = formatted.split(' ')
  return <strong><span>{amount}</span><small>{unit.join(' ')}</small></strong>
}

function MiniBars({ points, stream }: { points: TrafficPoint[]; stream: 'rx' | 'tx' }) {
  const values = points.slice(-24).map((point) => point[stream])
  const padded = [...Array(Math.max(0, 24 - values.length)).fill(0), ...values]
  const max = Math.max(1, ...padded)
  return (
    <span aria-hidden="true" className={`metric-bars metric-bars--${stream}`}>
      {padded.map((value, index) => <i key={index} style={{ height: `${Math.max(5, value / max * 100)}%` }} />)}
    </span>
  )
}

function linePath(values: number[], max: number, width: number, height: number) {
  return values.map((value, index) => {
    const x = (index / (MAX_POINTS - 1)) * width
    const y = height - (value / max) * height
    return `${index === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`
  }).join(' ')
}

function TrafficChart({ labels, points }: { labels: { rx: string; tx: string }; points: TrafficPoint[] }) {
  const width = 1000
  const height = 300
  const padded = useMemo(() => {
    const empty = Array.from({ length: Math.max(0, MAX_POINTS - points.length) }, () => ({ rx: 0, tx: 0 }))
    return [...empty, ...points]
  }, [points])
  const rawMax = Math.max(1, ...padded.flatMap((point) => [point.rx, point.tx]))
  const magnitude = 1024 ** Math.max(0, Math.floor(Math.log(rawMax) / Math.log(1024)))
  const chartMax = Math.max(magnitude, Math.ceil(rawMax / magnitude / 2) * 2 * magnitude)

  return (
    <div className="traffic-chart">
      <div className="traffic-chart__scale" aria-hidden="true">
        <span>{formatBytes(chartMax, '/s')}</span>
        <span>{formatBytes(chartMax / 2, '/s')}</span>
        <span>0 B/s</span>
      </div>
      <div className="traffic-chart__plot">
        <svg aria-label={`${labels.rx} and ${labels.tx} speed over the last 60 seconds`} preserveAspectRatio="none" role="img" viewBox={`0 0 ${width} ${height}`}>
          <g className="traffic-chart__grid">
            {[0, 1, 2, 3, 4].map((line) => <line key={`h-${line}`} x1="0" x2={width} y1={line * 75} y2={line * 75} />)}
            {[0, 1, 2, 3, 4, 5, 6].map((line) => <line key={`v-${line}`} x1={line * (width / 6)} x2={line * (width / 6)} y1="0" y2={height} />)}
          </g>
          <path className="traffic-chart__line traffic-chart__line--rx" d={linePath(padded.map((point) => point.rx), chartMax, width, height)} vectorEffect="non-scaling-stroke" />
          <path className="traffic-chart__line traffic-chart__line--tx" d={linePath(padded.map((point) => point.tx), chartMax, width, height)} vectorEffect="non-scaling-stroke" />
        </svg>
        <div className="traffic-chart__time" aria-hidden="true"><span>-60s</span><span>-30s</span><span>now</span></div>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const [status, setStatus] = useState<DaeStatus | null>(null)
  const [info, setInfo] = useState<DaeInfo | null>(null)
  const [snapshot, setSnapshot] = useState<TrafficSnapshot | null>(null)
  const [points, setPoints] = useState<TrafficPoint[]>([])
  const [loading, setLoading] = useState('')
  const [message, setMessage] = useState('')
  const [trafficError, setTrafficError] = useState('')
  const previous = useRef<TrafficSnapshot | null>(null)
  const preference = useMemo(getTrafficPreference, [])
  const labels = preference.mode === 'wan'
    ? { rx: 'Download', tx: 'Upload', rxTotal: 'Total downloaded', txTotal: 'Total uploaded' }
    : { rx: 'Receive', tx: 'Transmit', rxTotal: 'Total received', txTotal: 'Total transmitted' }

  const fetchSystem = useCallback(async () => {
    try {
      const [statusRes, infoRes] = await Promise.all([getStatus(), getInfo()])
      setStatus(statusRes.data)
      setInfo(infoRes.data)
    } catch {
      setStatus(null)
    }
  }, [])

  const sampleTraffic = useCallback(async () => {
    if (document.hidden) return
    try {
      const next = (await getNetworkTraffic(preference.interfaceName)).data
      setSnapshot(next)
      setTrafficError('')
      const last = previous.current
      if (last && last.interface === next.interface && next.timestamp > last.timestamp && next.rx_bytes >= last.rx_bytes && next.tx_bytes >= last.tx_bytes) {
        const elapsed = (next.timestamp - last.timestamp) / 1000
        setPoints((current) => [...current, {
          rx: (next.rx_bytes - last.rx_bytes) / elapsed,
          tx: (next.tx_bytes - last.tx_bytes) / elapsed,
        }].slice(-MAX_POINTS))
      } else if (last && (last.interface !== next.interface || next.rx_bytes < last.rx_bytes || next.tx_bytes < last.tx_bytes)) {
        setPoints([])
      }
      previous.current = next
    } catch (error: any) {
      setTrafficError(error.response?.data?.error || error.message || 'Traffic data unavailable')
    }
  }, [preference.interfaceName])

  useEffect(() => {
    fetchSystem()
    sampleTraffic()
    const systemTimer = window.setInterval(fetchSystem, 5000)
    const trafficTimer = window.setInterval(sampleTraffic, 1000)
    const resume = () => { if (!document.hidden) sampleTraffic() }
    document.addEventListener('visibilitychange', resume)
    return () => {
      window.clearInterval(systemTimer)
      window.clearInterval(trafficTimer)
      document.removeEventListener('visibilitychange', resume)
    }
  }, [fetchSystem, sampleTraffic])

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

  const current = points[points.length - 1] || { rx: 0, tx: 0 }
  const interfaceName = snapshot?.interface || (preference.interfaceName === 'auto' ? 'Auto' : preference.interfaceName)

  return (
    <PageFrame className="dashboard" variant="workspace">
      <header className="system-register">
        <div aria-hidden="true" className="system-register__spacer" />
        <div className="system-register__fact system-register__fact--status">{status ? <StatusBadge running={status.running} suspended={status.suspended} /> : <strong>Unavailable</strong>}</div>
        <div className="system-register__fact"><span>Uptime</span><strong>{info?.uptime || 'Unavailable'}</strong></div>
        <div className="system-register__fact"><span>Interface</span><Link className="system-interface" to="/settings"><strong>{interfaceName}</strong><ChevronDown size={15} /></Link></div>
        <div className="system-register__actions">
          <Button icon={RefreshCw} loading={loading === 'reload'} onClick={() => handleAction('reload')} size="sm">Reload</Button>
          {status?.suspended ? (
            <Button icon={Play} loading={loading === 'resume'} onClick={() => handleAction('resume')} size="sm" variant="primary">Resume</Button>
          ) : (
            <Button icon={Pause} loading={loading === 'suspend'} onClick={() => handleAction('suspend')} size="sm">Suspend</Button>
          )}
        </div>
      </header>

      {message && <Notice tone={message.toLowerCase().includes('error') ? 'danger' : 'success'}>{message}</Notice>}

      <section className="traffic-section">
        <div className="traffic-section__heading">
          <div><h1>Network traffic <small>· 60 seconds</small></h1></div>
          <div className="traffic-legend"><span className="traffic-legend__rx">{labels.rx}</span><span className="traffic-legend__tx">{labels.tx}</span></div>
        </div>
        {trafficError && <Notice tone="warning">{trafficError}</Notice>}
        <TrafficChart labels={labels} points={points} />
      </section>

      <section aria-label="Current network metrics" className="metric-ledger">
        <div className="metric-cell metric-cell--signal"><span>{labels.rx}</span><MiniBars points={points} stream="rx" /><MetricValue suffix="/s" value={current.rx} /></div>
        <div className="metric-cell"><span>{labels.tx}</span><MiniBars points={points} stream="tx" /><MetricValue suffix="/s" value={current.tx} /></div>
        <div className="metric-cell metric-cell--lead"><span>Active connections</span><strong>{snapshot?.active_connections ?? 'Unavailable'}</strong></div>
        <div className="metric-cell"><span>{labels.rxTotal}</span><MetricValue value={snapshot?.rx_bytes} /></div>
        <div className="metric-cell"><span>{labels.txTotal}</span><MetricValue value={snapshot?.tx_bytes} /></div>
      </section>

      <section className="runtime-section">
        <div className="runtime-section__heading"><span className="section-kicker">Runtime appendix</span><h2>Environment</h2><span>{snapshot ? 'live / 1s' : 'awaiting source'}</span></div>
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
