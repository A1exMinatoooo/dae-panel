import { useState } from 'react'
import { Search } from 'lucide-react'
import LogViewer from '../components/LogViewer'
import { PageFrame, PageHeader, SegmentedControl } from '../components/ui'

const LOG_LEVELS = [
  { value: 'all', label: 'All' },
  { value: 'error', label: 'Error' },
  { value: 'warn', label: 'Warn' },
  { value: 'info', label: 'Info' },
  { value: 'debug', label: 'Debug' },
  { value: 'trace', label: 'Trace' },
  { value: 'unknown', label: 'Unknown' },
]

export default function Logs() {
  const [levelFilter, setLevelFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  return (
    <PageFrame className="logs-page" variant="workspace">
      <PageHeader
        actions={(
          <div className="logs-filters">
          <div className="search-field">
            <Search aria-hidden="true" size={15} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search logs..."
              className="ui-input"
            />
          </div>
          <div className="logs-levels"><SegmentedControl label="Log level" onChange={setLevelFilter} options={LOG_LEVELS} value={levelFilter} /></div>
        </div>
        )}
        description="Live journal stream with local filtering across the retained buffer."
        eyebrow="Journal"
        title="Logs"
      />
      <div className="logs-workspace">
        <LogViewer levelFilter={levelFilter} searchQuery={searchQuery} />
      </div>
    </PageFrame>
  )
}
