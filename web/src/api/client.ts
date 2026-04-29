import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
})

api.interceptors.request.use((config) => {
  const { username, password } = getCredentials()
  const token = btoa(`${username}:${password}`)
  config.headers.Authorization = `Basic ${token}`
  return config
})

export function getCredentials() {
  return {
    username: localStorage.getItem('dae_panel_user') || 'admin',
    password: localStorage.getItem('dae_panel_pass') || 'dae-panel',
  }
}

export interface DaeStatus {
  running: boolean
  suspended: boolean
  pid?: number
}

export interface DaeInfo {
  panel_version: string
  dae_version: string
  go_version: string
  os: string
  arch: string
  uptime: string
  config_path: string
}

export interface LogEntry {
  __REALTIME_TIMESTAMP: string
  MESSAGE: string
  level: string
}

export interface ConfigResponse {
  path: string
  content: string
}

export const getStatus = () => api.get<DaeStatus>('/status')
export const getInfo = () => api.get<DaeInfo>('/info')
export const getConfig = () => api.get<ConfigResponse>('/config')
export const putConfig = (content: string, reload = false) =>
  api.put('/config', { content, reload })
export const validateConfig = (content?: string) =>
  api.post<{ valid: boolean; output: string; error?: string }>('/config/validate', content ? { content } : undefined)
export const reloadDae = () => api.post('/reload')
export const suspendDae = () => api.post('/suspend')
export const resumeDae = () => api.post('/resume')
export const getLogHistory = (n = 100) =>
  api.get<{ logs: LogEntry[] }>(`/logs/history?n=${n}`)

export class LogStream {
  private eventSource: EventSource | null = null
  private onMessage: (entry: LogEntry) => void
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null
  private stopped = false

  constructor(onMessage: (entry: LogEntry) => void) {
    this.onMessage = onMessage
  }

  start() {
    this.stopped = false
    this.connect()
  }

  stop() {
    this.stopped = true
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
    if (this.eventSource) {
      this.eventSource.close()
      this.eventSource = null
    }
  }

  private connect() {
    if (this.stopped) return

    const { username, password } = getCredentials()
    const token = btoa(`${username}:${password}`)
    const url = `/api/logs/stream?auth=${encodeURIComponent(token)}`

    this.eventSource = new EventSource(url)

    this.eventSource.onmessage = (event) => {
      try {
        const entry = JSON.parse(event.data) as LogEntry
        this.onMessage(entry)
      } catch {}
    }

    this.eventSource.onerror = () => {
      this.eventSource?.close()
      this.eventSource = null
      if (!this.stopped) {
        this.reconnectTimer = setTimeout(() => this.connect(), 3000)
      }
    }
  }
}

export default api
