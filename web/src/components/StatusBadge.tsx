interface StatusBadgeProps {
  running: boolean
  suspended?: boolean
}

export default function StatusBadge({ running, suspended }: StatusBadgeProps) {
  if (!running) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-500/20 text-red-400">
        <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
        Stopped
      </span>
    )
  }
  if (suspended) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-500/20 text-yellow-400">
        <span className="w-1.5 h-1.5 rounded-full bg-yellow-500" />
        Suspended
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400">
      <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
      Running
    </span>
  )
}
