export interface Section {
  id: string
  name: string
  bodyStart: number
  bodyEnd: number
  body: string
  eol: '\n' | '\r\n'
}

export interface FormDocument {
  content: string
  sections: Section[]
}
const sectionNames: Record<string, true> = {
  global: true,
  dns: true,
  group: true,
  routing: true,
  subscription: true,
  node: true,
}
const bareTokenCharacter = /[A-Za-z0-9_\/\\^*.+\-=@$!#%]/

export function parseSections(text: string): Section[] {
  const sections: Section[] = []
  const documentEol = text.match(/\r\n|\n/)?.[0] as '\n' | '\r\n' | undefined
  let depth = 0
  let quote: '"' | "'" | null = null
  let inLineComment = false
  let inBlockComment = false
  let active: { name: string; bodyStart: number } | null = null

  for (let i = 0; i < text.length; i++) {
    const char = text[i]

    if (inLineComment) {
      if (char === '\n' || char === '\r') inLineComment = false
      continue
    }
    if (inBlockComment) {
      if (char === '*' && text[i + 1] === '/') {
        inBlockComment = false
        i++
      }
      continue
    }
    if (quote) {
      if (char === '\\') {
        i++
      } else if (char === quote) {
        quote = null
      }
      continue
    }

    if (char === '"' || char === "'") {
      quote = char
      continue
    }
    if (char === '/' && text[i + 1] === '*') {
      inBlockComment = true
      i++
      continue
    }
    if (char === '#' && (i === 0 || !bareTokenCharacter.test(text[i - 1]))) {
      inLineComment = true
      continue
    }

    if (depth === 0 && /[A-Za-z_]/.test(char) && (i === 0 || !bareTokenCharacter.test(text[i - 1]))) {
      let nameEnd = i + 1
      while (nameEnd < text.length && /[A-Za-z_]/.test(text[nameEnd])) nameEnd++
      const name = text.slice(i, nameEnd)
      if (sectionNames[name] && (nameEnd === text.length || !bareTokenCharacter.test(text[nameEnd]))) {
        let brace = nameEnd
        while (/\s/.test(text[brace] ?? '') && brace < text.length) brace++
        if (text[brace] === '{') active = { name, bodyStart: brace + 1 }
      }
    }

    if (char === '{') {
      depth++
    } else if (char === '}') {
      if (depth > 0) {
        depth--
        if (depth === 0 && active) {
          const bodyEnd = i
          const body = text.slice(active.bodyStart, bodyEnd)
          const blockEol = body.match(/\r\n|\n/)?.[0] as '\n' | '\r\n' | undefined
          sections.push({
            id: `section-${sections.length + 1}`,
            name: active.name,
            bodyStart: active.bodyStart,
            bodyEnd,
            body,
            eol: blockEol ?? documentEol ?? '\n',
          })
          active = null
        }
      }
    }
  }

  return sections
}

export function replaceSectionBody(document: FormDocument, index: number, body: string): FormDocument {
  const section = document.sections[index]
  if (!section) throw new RangeError('Unknown configuration section')

  const normalizedBody = body.replace(/\r\n|\n/g, section.eol)
  if (normalizedBody === section.body) return document

  const content = document.content.slice(0, section.bodyStart)
    + normalizedBody
    + document.content.slice(section.bodyEnd)
  const delta = normalizedBody.length - section.body.length
  const sections = document.sections.map((current, currentIndex) => {
    if (currentIndex < index) return current
    if (currentIndex === index) {
      return { ...current, body: normalizedBody, bodyEnd: current.bodyStart + normalizedBody.length }
    }
    return {
      ...current,
      bodyStart: current.bodyStart + delta,
      bodyEnd: current.bodyEnd + delta,
    }
  })

  return { content, sections }
}
