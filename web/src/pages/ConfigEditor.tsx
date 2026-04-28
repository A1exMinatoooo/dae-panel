import { useEffect, useState, useRef, useCallback } from 'react'
import { Save, CheckCircle, RefreshCw, Code, FormInput } from 'lucide-react'
import Editor from '@monaco-editor/react'
import { useTheme } from '../hooks/useTheme'
import { getConfig, putConfig, validateConfig } from '../api/client'

interface Section {
  name: string
  start: number
  end: number
  body: string
}

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
  const { resolvedTheme } = useTheme()

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

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Config Editor</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMode(mode === 'raw' ? 'form' : 'raw')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--bg-tertiary)] hover:bg-[var(--border)] rounded-lg text-sm transition-colors"
          >
            {mode === 'raw' ? <FormInput className="w-4 h-4" /> : <Code className="w-4 h-4" />}
            {mode === 'raw' ? 'Form View' : 'Raw View'}
          </button>
          <button
            onClick={handleValidate}
            disabled={validating}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--bg-tertiary)] hover:bg-[var(--border)] disabled:opacity-50 rounded-lg text-sm transition-colors"
          >
            <CheckCircle className={`w-4 h-4 ${validating ? 'animate-spin' : ''}`} />
            Validate
          </button>
          <button
            onClick={() => handleSave(false)}
            disabled={saving || !hasChanges}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg text-sm font-medium text-white transition-colors"
          >
            <Save className={`w-4 h-4 ${saving ? 'animate-spin' : ''}`} />
            Save
          </button>
          <button
            onClick={() => handleSave(true)}
            disabled={saving}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-green-600 hover:bg-green-700 disabled:opacity-50 rounded-lg text-sm font-medium text-white transition-colors"
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
              ? 'bg-green-100 dark:bg-green-900/50 border border-green-300 dark:border-green-700 text-green-700 dark:text-green-300'
              : 'bg-red-100 dark:bg-red-900/50 border border-red-300 dark:border-red-700 text-red-700 dark:text-red-300'
          }`}
        >
          {validationResult.valid ? '✓ Config is valid' : '✗ Validation failed'}
          {validationResult.output && (
            <pre className="mt-1 text-xs opacity-80">{validationResult.output}</pre>
          )}
        </div>
      )}

      {saveResult && (
        <div className="mb-3 p-3 rounded-lg text-sm bg-blue-100 dark:bg-blue-900/50 border border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300">
          {saveResult}
        </div>
      )}

      {hasChanges && (
        <div className="mb-2 text-xs text-yellow-600 dark:text-yellow-500">
          ● Unsaved changes
        </div>
      )}

      {mode === 'raw' ? (
        <div className="flex-1 rounded-lg overflow-hidden border border-[var(--border)]">
          <Editor
            height="100%"
            defaultLanguage="ini"
            theme={resolvedTheme === 'dark' ? 'vs-dark' : 'vs-light'}
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
        <div className="flex-1 overflow-auto bg-[var(--bg-secondary)] rounded-lg p-4 border border-[var(--border)]">
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
  const [localBodies, setLocalBodies] = useState<Record<number, string>>({})
  const sections = parseSections(content)

  useEffect(() => {
    setLocalBodies({})
  }, [content])

  const getBody = (index: number, section: Section) => {
    return localBodies[index] ?? section.body
  }

  const handleBodyChange = (index: number, newBody: string) => {
    setLocalBodies(prev => ({ ...prev, [index]: newBody }))
  }

  const handleBodyBlur = (index: number) => {
    const section = sections[index]
    if (!section) return

    const localBody = localBodies[index]
    if (localBody === undefined) return

    const lines = content.split('\n')
    const sectionStartLine = content.substring(0, section.start).split('\n').length - 1
    const sectionEndLine = content.substring(0, section.end).split('\n').length - 1

    const headerLine = lines[sectionStartLine]
    const indent = headerLine.match(/^(\s*)/)?.[1] || ''

    const newBodyLines = localBody.split('\n').map(line => {
      const trimmed = line.trim()
      return trimmed ? indent + '    ' + trimmed : ''
    })

    const newLines = [
      ...lines.slice(0, sectionStartLine + 1),
      ...newBodyLines,
      ...lines.slice(sectionEndLine),
    ]

    onChange(newLines.join('\n'))
  }

  return (
    <div className="space-y-4">
      {sections.map((section, index) => (
        <div key={section.name + index} className="bg-[var(--bg-tertiary)] rounded-lg p-4">
          <h3 className="text-sm font-semibold text-[var(--text-secondary)] mb-2 uppercase">
            {section.name}
          </h3>
          <textarea
            className="w-full h-40 bg-[var(--bg-primary)] text-[var(--text-primary)] font-mono text-sm rounded p-3 border border-[var(--border)] focus:border-blue-500 focus:outline-none resize-y"
            value={getBody(index, section)}
            onChange={(e) => handleBodyChange(index, e.target.value)}
            onBlur={() => handleBodyBlur(index)}
          />
        </div>
      ))}
      {sections.length === 0 && (
        <p className="text-[var(--text-tertiary)] text-center py-8">
          No configuration sections found. Switch to Raw View to add sections.
        </p>
      )}
    </div>
  )
}

function parseSections(text: string): Section[] {
  const sections: Section[] = []
  const sectionNames = ['global', 'dns', 'group', 'routing', 'subscription', 'node']
  const regex = new RegExp(`^(${sectionNames.join('|')})\\s*\\{`, 'gm')
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
    const fullSection = text.slice(start, end)
    const firstBrace = fullSection.indexOf('{')
    const lastBrace = fullSection.lastIndexOf('}')
    const body = firstBrace !== -1 && lastBrace !== -1
      ? fullSection.slice(firstBrace + 1, lastBrace).trim()
      : ''

    sections.push({ name, start, end, body })
  })

  return sections
}
