import { useState } from 'react'
import { Filter, Search } from 'lucide-react'
import LogViewer from '../components/LogViewer'

const LOG_LEVELS = [
  { value: 'all', label: 'All' },
  { value: 'error', label: 'Error' },
  { value: 'warning', label: 'Warning' },
  { value: 'info', label: 'Info' },
  { value: 'debug', label: 'Debug' },
]

export default function Logs() {
  const [levelFilter, setLevelFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Logs</h1>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search logs..."
              className="pl-9 pr-3 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-blue-500 w-64"
            />
          </div>
          <div className="flex items-center gap-1 bg-gray-800 rounded-lg p-0.5">
            {LOG_LEVELS.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setLevelFilter(value)}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                  levelFilter === value
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="flex-1 min-h-0">
        <LogViewer levelFilter={levelFilter} searchQuery={searchQuery} />
      </div>
    </div>
  )
}
