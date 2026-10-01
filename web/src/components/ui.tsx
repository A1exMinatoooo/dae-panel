import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  icon?: LucideIcon
  loading?: boolean
  size?: 'sm' | 'md'
  variant?: 'primary' | 'secondary' | 'danger' | 'quiet'
}

export function Button({
  children,
  className = '',
  disabled,
  icon: Icon,
  loading,
  size = 'md',
  variant = 'secondary',
  ...props
}: ButtonProps) {
  return (
    <button
      className={`ui-button ui-button--${variant} ui-button--${size} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {Icon && <Icon aria-hidden="true" className={loading ? 'is-spinning' : ''} size={15} />}
      <span>{children}</span>
    </button>
  )
}

type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  active?: boolean
  icon: LucideIcon
  label: string
}

export function IconButton({ active, className = '', icon: Icon, label, ...props }: IconButtonProps) {
  return (
    <button
      aria-label={label}
      className={`ui-icon-button ${active ? 'is-active' : ''} ${className}`}
      title={label}
      {...props}
    >
      <Icon aria-hidden="true" size={16} />
    </button>
  )
}

export function PageFrame({
  children,
  className = '',
  variant = 'constrained',
}: {
  children: ReactNode
  className?: string
  variant?: 'constrained' | 'workspace'
}) {
  return <div className={`page-frame page-frame--${variant} ${className}`}>{children}</div>
}

export function PageHeader({
  actions,
  description,
  eyebrow,
  title,
}: {
  actions?: ReactNode
  description?: ReactNode
  eyebrow?: string
  title: string
}) {
  return (
    <header className="page-header">
      <div className="page-header__copy">
        <h1>{title}</h1>
        {eyebrow && <span className="page-header__eyebrow">{eyebrow}</span>}
        {description && <p>{description}</p>}
      </div>
      {actions && <div className="page-header__actions">{actions}</div>}
    </header>
  )
}

export function Surface({ className = '', ...props }: HTMLAttributes<HTMLElement>) {
  return <section className={`ui-surface ${className}`} {...props} />
}

export function SegmentedControl<T extends string>({
  label,
  onChange,
  options,
  value,
}: {
  label: string
  onChange: (value: T) => void
  options: Array<{ label: string; value: T }>
  value: T
}) {
  return (
    <div aria-label={label} className="ui-segmented" role="group">
      {options.map((option) => (
        <button
          aria-pressed={option.value === value}
          className={option.value === value ? 'is-active' : ''}
          key={option.value}
          onClick={() => onChange(option.value)}
          type="button"
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

export function Notice({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'neutral' | 'success' | 'warning' | 'danger' }) {
  return <div aria-atomic="true" aria-live={tone === 'danger' ? 'assertive' : 'polite'} className={`ui-notice ui-notice--${tone}`} role={tone === 'danger' ? 'alert' : 'status'}>{children}</div>
}

export function Field({ children, hint, label }: { children: ReactNode; hint?: ReactNode; label: string }) {
  return (
    <label className="ui-field">
      <span className="ui-field__label">{label}</span>
      {children}
      {hint && <span className="ui-field__hint">{hint}</span>}
    </label>
  )
}
