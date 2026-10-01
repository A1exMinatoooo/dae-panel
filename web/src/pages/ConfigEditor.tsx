import { useEffect, useState, useRef } from 'react'
import { Save, CheckCircle, RefreshCw } from 'lucide-react'
import Editor, { type EditorProps } from '@monaco-editor/react'
import { useTheme } from '../hooks/useTheme'
import { getConfig, putConfig, validateConfig } from '../api/client'
import { parseSections, replaceSectionBody } from '../utils/configSections'
import type { FormDocument } from '../utils/configSections'
import { Button, Notice, PageFrame, PageHeader, SegmentedControl } from '../components/ui'

const editorOptions: EditorProps['options'] = {
  minimap: { enabled: false },
  fontSize: 13,
  lineNumbers: 'on',
  scrollBeyondLastLine: false,
  wordWrap: 'on',
  automaticLayout: true,
  tabSize: 2,
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
    setValidationResult(null)

    try {
      // Force validate before saving
      const validateRes = await validateConfig(content)
      if (!validateRes.data.valid) {
        setValidationResult(validateRes.data)
        setSaveResult('Save cancelled: config validation failed')
        return
      }

      const res = await putConfig(content, reload)
      setOriginalContent(content)
      setSaveResult(res.data.message + (res.data.backup_path ? `\nBackup: ${res.data.backup_path}` : '') + (reload && res.data.reload_output ? '\n' + res.data.reload_output : ''))
    } catch (e: any) {
      if (e.response?.data?.output) {
        setValidationResult({ valid: false, output: e.response.data.output })
      }
      setSaveResult('Error: ' + (e.response?.data?.error || e.message))
    } finally {
      setSaving(false)
    }
  }

  const handleValidate = async () => {
    setValidating(true)
    setValidationResult(null)
    try {
      const res = await validateConfig(content)
      setValidationResult(res.data)
    } catch (e: any) {
      setValidationResult({
        valid: false,
        output: e.response?.data?.output || e.response?.data?.error || e.message,
      })
    } finally {
      setValidating(false)
    }
  }

  const hasChanges = content !== originalContent

  return (
    <PageFrame className="config-page" variant="workspace">
      <PageHeader
        actions={(
          <>
            <SegmentedControl label="Editor mode" onChange={setMode} options={[{ label: 'Raw', value: 'raw' }, { label: 'Form', value: 'form' }]} value={mode} />
            <Button icon={CheckCircle} loading={validating} onClick={handleValidate}>Validate</Button>
            <Button disabled={!hasChanges} icon={Save} loading={saving} onClick={() => handleSave(false)}>Save</Button>
            <Button icon={RefreshCw} loading={saving} onClick={() => handleSave(true)} variant="primary">Save & reload</Button>
          </>
        )}
        description="Validate changes against dae before writing the active configuration."
        eyebrow={hasChanges ? 'Unsaved changes' : 'Configuration'}
        title="Config editor"
      />

      {validationResult && (
        <Notice tone={validationResult.valid ? 'success' : 'danger'}>
          {validationResult.valid ? 'Config is valid' : 'Validation failed'}
          {validationResult.output && (
            <pre className="feedback-output">{validationResult.output}</pre>
          )}
        </Notice>
      )}

      {saveResult && (
        <Notice tone={saveResult.startsWith('Error') || saveResult.startsWith('Failed') ? 'danger' : 'neutral'}>{saveResult}</Notice>
      )}

      {mode === 'raw' ? (
        <div className="config-workspace">
          <Editor
            height="100%"
            defaultLanguage="ini"
            theme={resolvedTheme === 'dark' ? 'vs-dark' : 'vs-light'}
            value={content}
            onChange={(value) => setContent(value || '')}
            options={editorOptions}
          />
        </div>
      ) : (
        <div className="config-workspace config-workspace--form">
          <FormEditor content={content} onChange={setContent} theme={resolvedTheme === 'dark' ? 'vs-dark' : 'vs-light'} />
        </div>
      )}
    </PageFrame>
  )
}
function FormEditor({
  content,
  onChange,
  theme,
}: {
  content: string
  onChange: (value: string) => void
  theme: string
}) {
  const documentRef = useRef<FormDocument>({ content, sections: parseSections(content) })
  const [sections, setSections] = useState(() => documentRef.current.sections)

  useEffect(() => {
    if (content === documentRef.current.content) return
    const nextDocument = { content, sections: parseSections(content) }
    documentRef.current = nextDocument
    setSections(nextDocument.sections)
  }, [content])

  const handleBodyChange = (index: number, body: string) => {
    const nextDocument = replaceSectionBody(documentRef.current, index, body)
    if (nextDocument === documentRef.current) return
    documentRef.current = nextDocument
    setSections(nextDocument.sections)
    onChange(nextDocument.content)
  }

  return (
    <div className="form-editor">
      {sections.map((section, index) => (
        <section key={section.id} className="form-section">
          <h3>{section.name}</h3>
          <div className="form-section__editor">
            <Editor
              height="240px"
              defaultLanguage="ini"
              theme={theme}
              value={section.body}
              onChange={(value) => handleBodyChange(index, value ?? '')}
              options={editorOptions}
            />
          </div>
        </section>
      ))}
      {sections.length === 0 && (
        <p className="empty-state">
          No configuration sections found. Switch to Raw View to add sections.
        </p>
      )}
    </div>
  )
}

