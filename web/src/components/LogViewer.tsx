import { useEffect, useState, useCallback, useRef } from 'react'
import type { LogEntry } from '../api/client'
import { getLogHistory, LogStream } from '../api/client'

interface LogViewerProps {
  levelFilter?: string
  searchQuery?: string
}

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
      return log.MESSAGE.toLowerCase().includes(searchQuery.toLowerCase())
    }
    return true
  })

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'error': return 'text-red-500'
      case 'warning': return 'text-yellow-500'
      case 'info': return 'text-blue-500'
      case 'debug': return 'text-[var(--text-tertiary)]'
      default: return 'text-[var(--text-secondary)]'
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
            <mark key={i} className="bg-yellow-500/30 text-yellow-700 dark:text-yellow-200 px-0.5 rounded">
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
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 mb-2">
        <button
          onClick={() => setAutoScroll(!autoScroll)}
          className={`px-3 py-1 rounded text-xs ${
            autoScroll
              ? 'bg-blue-600 text-white'
              : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)]'
          }`}
        >
          Auto-scroll: {autoScroll ? 'ON' : 'OFF'}
        </button>
        <button
          onClick={() => setLogs([])}
          className="px-3 py-1 rounded text-xs bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--border)]"
        >
          Clear
        </button>
        <span className="text-xs text-[var(--text-tertiary)]">
          {filteredLogs.length} / {logs.length} entries
        </span>
        {connected && (
          <span className="inline-flex items-center gap-1 text-xs text-green-500">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            Live
          </span>
        )}
      </div>
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-auto bg-[var(--bg-secondary)] rounded-lg p-3 font-mono text-sm border border-[var(--border)]"
      >
        {filteredLogs.map((log, i) => (
          <div key={i} className="flex gap-2 py-0.5">
            <span className="text-[var(--text-tertiary)] shrink-0 w-24">
              {formatTime(log.__REALTIME_TIMESTAMP)}
            </span>
            <span className={`shrink-0 w-16 ${getLevelColor(log.level)}`}>
              [{log.level}]
            </span>
            <span className="break-all">
              {highlightText(log.MESSAGE, searchQuery || '')}
            </span>
          </div>
        ))}
        {filteredLogs.length === 0 && (
          <div className="text-[var(--text-tertiary)] text-center py-8">No log entries</div>
        )}
      </div>
    </div>
  )
}
