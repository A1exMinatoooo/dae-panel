interface StatusBadgeProps {
  running: boolean
  suspended?: boolean
}

export default function StatusBadge({ running, suspended }: StatusBadgeProps) {
  const state = !running ? 'stopped' : suspended ? 'suspended' : 'running'
  return (
    <span className={`status-label status-label--${state}`}>
      <span aria-hidden="true" className="status-label__dot" />
      {state}
    </span>
  )
}
