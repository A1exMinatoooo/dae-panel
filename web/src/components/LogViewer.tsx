import { useEffect, useState, useCallback, useRef } from 'react'
import type { LogEntry } from '../api/client'
import { getLogHistory, LogStream } from '../api/client'
import { Button } from './ui'

interface LogViewerProps {
  levelFilter?: string
  searchQuery?: string
}

const getDisplayMessage = (log: LogEntry) => log.message || log.MESSAGE

export default function LogViewer({ levelFilter, searchQuery }: LogViewerProps) {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [autoScroll, setAutoScroll] = useState(true)
  const [connected, setConnected] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const streamRef = useRef<LogStream | null>(null)

  useEffect(() => {
    getLogHistory(200).then((res) => {
      setLogs(res.data.logs || [])
    })

    const stream = new LogStream((entry) => {
      setLogs((prev) => {
        const next = [...prev, entry]
        return next.length > 2000 ? next.slice(-2000) : next
      })
      setConnected(true)
    })
    stream.start()
    streamRef.current = stream

    return () => {
      stream.stop()
    }
  }, [])

  useEffect(() => {
    if (autoScroll && containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight
    }
  }, [logs, autoScroll])

  const handleScroll = useCallback(() => {
    if (!containerRef.current) return
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current
    setAutoScroll(scrollHeight - scrollTop - clientHeight < 50)
  }, [])

  const filteredLogs = logs.filter((log) => {
    if (levelFilter && levelFilter !== 'all' && log.level !== levelFilter) {
      return false
    }
    if (searchQuery) {
      return getDisplayMessage(log).toLowerCase().includes(searchQuery.toLowerCase())
    }
    return true
  })

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'error': return 'is-error'
      case 'warn': return 'is-warn'
      case 'info': return 'is-info'
      case 'debug': return 'is-debug'
      case 'trace': return 'is-trace'
      default: return 'is-unknown'
    }
  }

  const highlightText = (text: string, query: string) => {
    if (!query) return <>{text}</>
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
    const parts = text.split(regex)
    return (
      <>
        {parts.map((part, i) =>
          regex.test(part) ? (
            <mark key={i}>
              {part}
            </mark>
          ) : (
            <span key={i}>{part}</span>
          )
        )}
      </>
    )
  }

  const formatTime = (timestamp: string) => {
    if (!timestamp) return ''
    const ts = parseInt(timestamp)
    if (isNaN(ts)) return ''
    const ms = ts > 1e12 ? ts / 1000 : ts
    return new Date(ms).toLocaleTimeString()
  }

  return (
    <div className="log-viewer">
      <div className="log-toolbar">
        <button
          onClick={() => setAutoScroll(!autoScroll)}
          className={`log-toggle ${autoScroll ? 'is-active' : ''}`}
        >
          Auto-scroll: {autoScroll ? 'ON' : 'OFF'}
        </button>
        <Button onClick={() => setLogs([])} size="sm" variant="quiet">Clear</Button>
        <span className="log-count">
          {filteredLogs.length} / {logs.length} entries
        </span>
        {connected && (
          <span className="log-live">
            <span aria-hidden="true" />
            Live
          </span>
        )}
      </div>
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="log-viewport"
      >
        {filteredLogs.map((log, i) => (
          <div key={i} className="log-row">
            <span className="log-row__time">
              {formatTime(log.__REALTIME_TIMESTAMP)}
            </span>
            <span className={`log-row__level ${getLevelColor(log.level)}`}>
              {log.level}
            </span>
            <span className="log-row__message">
              {highlightText(getDisplayMessage(log), searchQuery || '')}
            </span>
          </div>
        ))}
        {filteredLogs.length === 0 && (
          <div className="empty-state">No log entries</div>
        )}
      </div>
    </div>
  )
}
