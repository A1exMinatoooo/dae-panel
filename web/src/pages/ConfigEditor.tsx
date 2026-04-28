import { useEffect, useState, useRef } from 'react'
import { Save, CheckCircle, AlertCircle, RefreshCw, Code, FormInput } from 'lucide-react'
import Editor from '@monaco-editor/react'
import { getConfig, putConfig, validateConfig } from '../api/client'

export default function ConfigEditor() {
  const [content, setContent] = useState('')
  const [originalContent, setOriginalContent] = useState('')
  const [saving, setSaving] = useState(false)
  const [validating, setValidating] = useState(false)
  const [validationResult, setValidationResult] = useState<{
    valid: boolean
    output: string
  } | null>(null)
  const [saveResult, setSaveResult] = useState<string>('')
  const [mode, setMode] = useState<'raw' | 'form'>('raw')
  const editorRef = useRef<any>(null)

  useEffect(() => {
    loadConfig()
  }, [])

  const loadConfig = async () => {
    try {
      const res = await getConfig()
      setContent(res.data.content)
      setOriginalContent(res.data.content)
    } catch (e: any) {
      setSaveResult('Failed to load config: ' + (e.response?.data?.error || e.message))
    }
  }

  const handleSave = async (reload = false) => {
    setSaving(true)
    setSaveResult('')
    try {
      const res = await putConfig(content, reload)
      setOriginalContent(content)
      setSaveResult(res.data.message + (reload && res.data.reload_output ? '\n' + res.data.reload_output : ''))
    } catch (e: any) {
      setSaveResult('Error: ' + (e.response?.data?.error || e.message))
    } finally {
      setSaving(false)
    }
  }

  const handleValidate = async () => {
    setValidating(true)
    setValidationResult(null)
    try {
      const res = await validateConfig()
      setValidationResult(res.data)
    } catch (e: any) {
      setValidationResult({
        valid: false,
        output: e.response?.data?.error || e.message,
      })
    } finally {
      setValidating(false)
    }
  }

  const hasChanges = content !== originalContent

  const parseConfigSections = (text: string) => {
    const sections: Record<string, string> = {}
    const regex = /^(global|dns|group|routing|subscription|node)\s*\{/gm
    const matches = [...text.matchAll(regex)]

    matches.forEach((match, i) => {
      const name = match[1]
      const start = match.index!
      let depth = 0
      let end = start
      for (let j = start; j < text.length; j++) {
        if (text[j] === '{') depth++
        if (text[j] === '}') {
          depth--
          if (depth === 0) {
            end = j + 1
            break
          }
        }
      }
      sections[name] = text.slice(start, end)
    })

    return sections
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Config Editor</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMode(mode === 'raw' ? 'form' : 'raw')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm transition-colors"
          >
            {mode === 'raw' ? <FormInput className="w-4 h-4" /> : <Code className="w-4 h-4" />}
            {mode === 'raw' ? 'Form View' : 'Raw View'}
          </button>
          <button
            onClick={handleValidate}
            disabled={validating}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 rounded-lg text-sm transition-colors"
          >
            <CheckCircle className={`w-4 h-4 ${validating ? 'animate-spin' : ''}`} />
            Validate
          </button>
          <button
            onClick={() => handleSave(false)}
            disabled={saving || !hasChanges}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg text-sm font-medium transition-colors"
          >
            <Save className={`w-4 h-4 ${saving ? 'animate-spin' : ''}`} />
            Save
          </button>
          <button
            onClick={() => handleSave(true)}
            disabled={saving}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-green-600 hover:bg-green-700 disabled:opacity-50 rounded-lg text-sm font-medium transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${saving ? 'animate-spin' : ''}`} />
            Save & Reload
          </button>
        </div>
      </div>

      {validationResult && (
        <div
          className={`mb-3 p-3 rounded-lg text-sm ${
            validationResult.valid
              ? 'bg-green-900/50 border border-green-700 text-green-300'
              : 'bg-red-900/50 border border-red-700 text-red-300'
          }`}
        >
          {validationResult.valid ? '✓ Config is valid' : '✗ Validation failed'}
          {validationResult.output && (
            <pre className="mt-1 text-xs opacity-80">{validationResult.output}</pre>
          )}
        </div>
      )}

      {saveResult && (
        <div className="mb-3 p-3 rounded-lg text-sm bg-blue-900/50 border border-blue-700 text-blue-300">
          {saveResult}
        </div>
      )}

      {hasChanges && (
        <div className="mb-2 text-xs text-yellow-500">
          ● Unsaved changes
        </div>
      )}

      {mode === 'raw' ? (
        <div className="flex-1 rounded-lg overflow-hidden border border-gray-800">
          <Editor
            height="100%"
            defaultLanguage="ini"
            theme="vs-dark"
            value={content}
            onChange={(value) => setContent(value || '')}
            options={{
              minimap: { enabled: false },
              fontSize: 13,
              lineNumbers: 'on',
              scrollBeyondLastLine: false,
              wordWrap: 'on',
              automaticLayout: true,
              tabSize: 2,
            }}
            onMount={(editor) => {
              editorRef.current = editor
            }}
          />
        </div>
      ) : (
        <div className="flex-1 overflow-auto bg-gray-900 rounded-lg p-4 border border-gray-800">
          <FormEditor content={content} onChange={setContent} />
        </div>
      )}
    </div>
  )
}

function FormEditor({
  content,
  onChange,
}: {
  content: string
  onChange: (v: string) => void
}) {
  const sections = parseSections(content)

  const updateSection = (name: string, newBody: string) => {
    const regex = new RegExp(`(${name}\\s*\\{)[\\s\\S]*?(\\})`, 'i')
    const match = content.match(regex)
    if (match) {
      const updated = content.replace(regex, `$1\n${newBody}\n$2`)
      onChange(updated)
    }
  }

  return (
    <div className="space-y-4">
      {['global', 'dns', 'group', 'routing', 'subscription', 'node'].map((name) => {
        const section = sections[name]
        return (
          <div key={name} className="bg-gray-800 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-300 mb-2 uppercase">
              {name}
            </h3>
            {section ? (
              <textarea
                className="w-full h-40 bg-gray-900 text-gray-200 font-mono text-sm rounded p-3 border border-gray-700 focus:border-blue-500 focus:outline-none resize-y"
                value={extractBody(section)}
                onChange={(e) => updateSection(name, e.target.value)}
              />
            ) : (
              <p className="text-gray-500 text-sm">Not configured</p>
            )}
          </div>
        )
      })}
    </div>
  )
}

function parseSections(text: string): Record<string, string> {
  const sections: Record<string, string> = {}
  const regex = /^(global|dns|group|routing|subscription|node)\s*\{/gm
  const matches = [...text.matchAll(regex)]

  matches.forEach((match) => {
    const name = match[1]
    const start = match.index!
    let depth = 0
    let end = start
    for (let j = start; j < text.length; j++) {
      if (text[j] === '{') depth++
      if (text[j] === '}') {
        depth--
        if (depth === 0) {
          end = j + 1
          break
        }
      }
    }
    sections[name] = text.slice(start, end)
  })

  return sections
}

function extractBody(section: string): string {
  const firstBrace = section.indexOf('{')
  const lastBrace = section.lastIndexOf('}')
  if (firstBrace === -1 || lastBrace === -1) return section
  return section.slice(firstBrace + 1, lastBrace).trim()
}
