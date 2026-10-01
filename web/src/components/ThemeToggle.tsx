import { Sun, Moon, Monitor } from 'lucide-react'
import { useTheme } from '../hooks/useTheme'
import { IconButton } from './ui'

const options = [
  { value: 'light' as const, icon: Sun, label: 'Light' },
  { value: 'dark' as const, icon: Moon, label: 'Dark' },
  { value: 'system' as const, icon: Monitor, label: 'System' },
]

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <div className="theme-toggle">
      {options.map(({ value, icon: Icon, label }) => (
        <IconButton
          active={theme === value}
          icon={Icon}
          key={value}
          label={label}
          onClick={() => setTheme(value)}
        />
      ))}
    </div>
  )
}
