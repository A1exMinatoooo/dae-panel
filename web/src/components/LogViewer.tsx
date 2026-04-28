import { useEffect, useState, useCallback, useRef } from 'react'
import type { LogEntry } from '../api/client'
import { getLogHistory, createLogStream } from '../api/client'

interface LogViewerProps {
  levelFilter?: string
  searchQuery?: string
}

export default function LogViewer({ levelFilter, searchQuery }: LogViewerProps) {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [autoScroll, setAutoScroll] = useState(true)
  const containerRef = useRef<HTMLDivElement>(null)
  const eventSourceRef = useRef<EventSource | null>(null)

  useEffect(() => {
    getLogHistory(200).then((res) => {
      setLogs(res.data.logs || [])
    })

    const es = createLogStream((entry) => {
      setLogs((prev) => {
        const next = [...prev, entry]
        return next.length > 2000 ? next.slice(-2000) : next
      })
    })
    eventSourceRef.current = es

    return () => {
      es.close()
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
    if (levelFilter && levelFilter !== 'all' && log.LEVEL !== levelFilter) {
      return false
    }
    if (searchQuery) {
      return log.MESSAGE.toLowerCase().includes(searchQuery.toLowerCase())
    }
    return true
  })

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'error': return 'text-red-400'
      case 'warning': return 'text-yellow-400'
      case 'info': return 'text-blue-400'
      case 'debug': return 'text-gray-500'
      default: return 'text-gray-400'
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 mb-2">
        <button
          onClick={() => setAutoScroll(!autoScroll)}
          className={`px-3 py-1 rounded text-xs ${
            autoScroll
              ? 'bg-blue-600 text-white'
              : 'bg-gray-700 text-gray-300'
          }`}
        >
          Auto-scroll: {autoScroll ? 'ON' : 'OFF'}
        </button>
        <button
          onClick={() => setLogs([])}
          className="px-3 py-1 rounded text-xs bg-gray-700 text-gray-300 hover:bg-gray-600"
        >
          Clear
        </button>
        <span className="text-xs text-gray-500">
          {filteredLogs.length} / {logs.length} entries
        </span>
      </div>
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-auto bg-gray-900 rounded-lg p-3 font-mono text-sm"
      >
        {filteredLogs.map((log, i) => (
          <div key={i} className="flex gap-2 py-0.5">
            <span className="text-gray-600 shrink-0 w-24">
              {log.__REALTIME_TIMESTAMP
                ? new Date(parseInt(log.__REALTIME_TIMESTAMP) / 1000).toLocaleTimeString()
                : ''}
            </span>
            <span className={`shrink-0 w-16 ${getLevelColor(log.LEVEL)}`}>
              [{log.LEVEL}]
            </span>
            <span className="text-gray-300 break-all">{log.MESSAGE}</span>
          </div>
        ))}
        {filteredLogs.length === 0 && (
          <div className="text-gray-500 text-center py-8">No log entries</div>
        )}
      </div>
    </div>
  )
}
