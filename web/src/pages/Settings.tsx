import { useEffect, useState } from 'react'
import { Eye, EyeOff, Save } from 'lucide-react'
import type { NetworkInterface, TrafficMode } from '../api/client'
import {
  getNetworkInterfaces,
  TRAFFIC_INTERFACE_KEY,
  TRAFFIC_MODE_KEY,
} from '../api/client'
import { Button, Field, IconButton, Notice, PageFrame, PageHeader, SegmentedControl, Surface } from '../components/ui'

const serviceCommands = [
  'sudo dae-panel install',
  'sudo systemctl status dae-panel',
  'sudo journalctl -u dae-panel -f',
]

export default function Settings() {
  const [username, setUsername] = useState(() => localStorage.getItem('dae_panel_user') || 'admin')
  const [password, setPassword] = useState(() => localStorage.getItem('dae_panel_pass') || 'dae-panel')
  const [interfaceName, setInterfaceName] = useState(() => localStorage.getItem(TRAFFIC_INTERFACE_KEY) || 'auto')
  const [trafficMode, setTrafficMode] = useState<TrafficMode>(() => (localStorage.getItem(TRAFFIC_MODE_KEY) || 'link') as TrafficMode)
  const [interfaces, setInterfaces] = useState<NetworkInterface[]>([])
  const [defaultInterface, setDefaultInterface] = useState('')
  const [interfaceError, setInterfaceError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    getNetworkInterfaces()
      .then(({ data }) => {
        setInterfaces(data.interfaces)
        setDefaultInterface(data.default_interface)
      })
      .catch((error) => setInterfaceError(error.response?.data?.error || error.message))
  }, [])

  const handleSave = () => {
    localStorage.setItem('dae_panel_user', username)
    localStorage.setItem('dae_panel_pass', password)
    localStorage.setItem(TRAFFIC_INTERFACE_KEY, interfaceName)
    localStorage.setItem(TRAFFIC_MODE_KEY, trafficMode)
    setSaved(true)
    window.setTimeout(() => setSaved(false), 2200)
  }

  return (
    <PageFrame className="settings-page">
      <PageHeader
        actions={<Button icon={Save} onClick={handleSave} variant="primary">Save settings</Button>}
        description="Authentication and traffic measurement preferences are stored in this browser."
        eyebrow="Control plane"
        title="Settings"
      />

      {saved && <Notice tone="success">Settings saved. Dashboard sampling will use them on the next visit.</Notice>}

      <div className="settings-layout">
        <Surface className="settings-section">
          <header><span>01</span><div><h2>Connection</h2><p>Credentials used for authenticated API requests.</p></div></header>
          <div className="settings-section__body settings-fields">
            <Field label="API username">
              <input className="ui-input" onChange={(event) => setUsername(event.target.value)} type="text" value={username} />
            </Field>
            <Field label="API password">
              <div className="password-field">
                <input className="ui-input" onChange={(event) => setPassword(event.target.value)} type={showPassword ? 'text' : 'password'} value={password} />
                <IconButton icon={showPassword ? EyeOff : Eye} label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword((visible) => !visible)} type="button" />
              </div>
            </Field>
          </div>
        </Surface>

        <Surface className="settings-section">
          <header><span>02</span><div><h2>Traffic measurement</h2><p>Select the Linux interface and the labels that match this deployment.</p></div></header>
          <div className="settings-section__body settings-fields">
            <Field hint={defaultInterface ? `Default route currently resolves to ${defaultInterface}.` : 'Auto uses the default route, then the first non-loopback interface.'} label="Network interface">
              <select className="ui-select" onChange={(event) => setInterfaceName(event.target.value)} value={interfaceName}>
                <option value="auto">Auto · default route</option>
                {interfaces.map((item) => <option key={item.name} value={item.name}>{item.name} · {item.oper_state}</option>)}
              </select>
            </Field>
            <Field hint={trafficMode === 'link' ? 'Safe for single-arm and side-router deployments where receive is not necessarily download.' : 'Use only when the selected interface is the WAN boundary.'} label="Traffic semantics">
              <SegmentedControl
                label="Traffic semantics"
                onChange={setTrafficMode}
                options={[{ label: 'Link RX / TX', value: 'link' }, { label: 'WAN Down / Up', value: 'wan' }]}
                value={trafficMode}
              />
            </Field>
            {interfaceError && <Notice tone="warning">Interface discovery unavailable: {interfaceError}</Notice>}
          </div>
        </Surface>

        <Surface className="settings-section settings-section--wide">
          <header><span>03</span><div><h2>System service</h2><p>Reference commands for installing and inspecting dae-panel.</p></div></header>
          <div className="command-list">
            {serviceCommands.map((command, index) => <code key={command}><span>0{index + 1}</span>{command}</code>)}
          </div>
        </Surface>
      </div>
    </PageFrame>
  )
}
