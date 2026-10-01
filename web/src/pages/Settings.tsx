import { useState } from 'react'
import { Eye, EyeOff, Save } from 'lucide-react'
import { Button, Field, IconButton, Notice, PageFrame, PageHeader, Surface } from '../components/ui'

const serviceCommands = [
  'sudo dae-panel install',
  'sudo systemctl status dae-panel',
  'sudo journalctl -u dae-panel -f',
]

export default function Settings() {
  const [username, setUsername] = useState(() => localStorage.getItem('dae_panel_user') || 'admin')
  const [password, setPassword] = useState(() => localStorage.getItem('dae_panel_pass') || 'dae-panel')
  const [showPassword, setShowPassword] = useState(false)
  const [saved, setSaved] = useState(false)


  const handleSave = () => {
    localStorage.setItem('dae_panel_user', username)
    localStorage.setItem('dae_panel_pass', password)
    setSaved(true)
    window.setTimeout(() => setSaved(false), 2200)
  }

  return (
    <PageFrame className="settings-page">
      <PageHeader
        actions={<Button icon={Save} onClick={handleSave} variant="primary">Save settings</Button>}
        description="Authentication preferences are stored in this browser."
        title="Settings"
      />

      {saved && <Notice tone="success">Settings saved.</Notice>}

      <div className="settings-layout">
        <Surface className="settings-section">
          <header><div><h2>Connection</h2><p>Credentials used for authenticated API requests.</p></div></header>
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
          <header><div><h2>System service</h2><p>Reference commands for installing and inspecting dae-panel.</p></div></header>
          <div className="command-list">
            {serviceCommands.map((command) => <code key={command}>{command}</code>)}
          </div>
        </Surface>
      </div>
    </PageFrame>
  )
}
