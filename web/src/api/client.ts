import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
})

api.interceptors.request.use((config) => {
  const username = localStorage.getItem('dae_panel_user') || 'admin'
  const password = localStorage.getItem('dae_panel_pass') || 'dae-panel'
  const token = btoa(`${username}:${password}`)
  config.headers.Authorization = `Basic ${token}`
  return config
})

export interface DaeStatus {
  running: boolean
  suspended: boolean
  pid?: number
}

export interface DaeInfo {
  version: string
  go_version: string
  os: string
  arch: string
  uptime: string
  config_path: string
  dae_version: string
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
export const validateConfig = () => api.post('/config/validate')
export const reloadDae = () => api.post('/reload')
export const suspendDae = () => api.post('/suspend')
export const resumeDae = () => api.post('/resume')
export const getLogHistory = (n = 100) =>
  api.get<{ logs: LogEntry[] }>(`/logs/history?n=${n}`)

export const createLogStream = (onMessage: (entry: LogEntry) => void): EventSource => {
  const username = localStorage.getItem('dae_panel_user') || 'admin'
  const password = localStorage.getItem('dae_panel_pass') || 'dae-panel'
  const token = btoa(`${username}:${password}`)

  const eventSource = new EventSource(`/api/logs/stream?auth=${encodeURIComponent(token)}`)

  eventSource.onmessage = (event) => {
    try {
      const entry = JSON.parse(event.data) as LogEntry
      onMessage(entry)
    } catch {}
  }

  eventSource.onerror = () => {
    eventSource.close()
    setTimeout(() => {
      createLogStream(onMessage)
    }, 5000)
  }

  return eventSource
}

export default api
