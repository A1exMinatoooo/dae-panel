import { useState, useEffect } from 'react'
import { Save, Eye, EyeOff } from 'lucide-react'

export default function Settings() {
  const [port, setPort] = useState(() => localStorage.getItem('dae_panel_port') || '8080')
  const [username, setUsername] = useState(() => localStorage.getItem('dae_panel_user') || 'admin')
  const [password, setPassword] = useState(() => localStorage.getItem('dae_panel_pass') || 'dae-panel')
  const [showPassword, setShowPassword] = useState(false)
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    localStorage.setItem('dae_panel_port', port)
    localStorage.setItem('dae_panel_user', username)
    localStorage.setItem('dae_panel_pass', password)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>

      <div className="bg-gray-900 rounded-xl p-5 border border-gray-800 mb-4">
        <h2 className="text-lg font-semibold mb-4">Connection</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">API Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-200 focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">API Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 pr-10 bg-gray-800 border border-gray-700 rounded-lg text-gray-200 focus:outline-none focus:border-blue-500"
              />
              <button
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gray-900 rounded-xl p-5 border border-gray-800 mb-4">
        <h2 className="text-lg font-semibold mb-4">Systemd Service</h2>
        <p className="text-sm text-gray-400 mb-3">
          To install dae-panel as a system service, run:
        </p>
        <code className="block bg-gray-800 p-3 rounded text-sm text-gray-300 font-mono">
          sudo dae-panel install
        </code>
        <p className="text-sm text-gray-400 mt-3 mb-2">Useful commands:</p>
        <div className="space-y-1">
          <code className="block bg-gray-800 p-2 rounded text-xs text-gray-400 font-mono">
            sudo systemctl start dae-panel
          </code>
          <code className="block bg-gray-800 p-2 rounded text-xs text-gray-400 font-mono">
            sudo systemctl status dae-panel
          </code>
          <code className="block bg-gray-800 p-2 rounded text-xs text-gray-400 font-mono">
            sudo journalctl -u dae-panel -f
          </code>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium transition-colors"
        >
          <Save className="w-4 h-4" />
          Save Settings
        </button>
        {saved && (
          <span className="text-sm text-green-400">Settings saved!</span>
        )}
      </div>
    </div>
  )
}
