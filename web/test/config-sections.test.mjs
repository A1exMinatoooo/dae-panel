import assert from 'node:assert/strict'
import test from 'node:test'
import { parseSections, replaceSectionBody } from '../src/utils/configSections.ts'

const document = (content) => ({ content, sections: parseSections(content) })

test('preserves section body whitespace and changes only edited source bytes', () => {
  const source = '# before\nglobal {\n    first: 1\n        nested: 2\n\n}\n# between\ndns {\n    server: 1.1.1.1\n}\n# after'
  const sections = parseSections(source)
  assert.deepEqual(sections.map(({ name }) => name), ['global', 'dns'])
  assert.equal(sections[0].body, '\n    first: 1\n        nested: 2\n\n')
  assert.equal(source.slice(sections[0].bodyStart, sections[0].bodyEnd), sections[0].body)

  const before = document(source)
  const changed = replaceSectionBody(before, 0, sections[0].body.replace('first: 1', 'first: 9'))
  assert.equal(changed.content, source.replace('first: 1', 'first: 9'))
  assert.equal(changed.content.slice(0, sections[0].bodyStart), source.slice(0, sections[0].bodyStart))
  assert.equal(changed.content.slice(changed.sections[0].bodyEnd), source.slice(sections[0].bodyEnd))
  assert.equal(changed.sections[1].body, sections[1].body)
})

test('round-trips CRLF, tabs, no final newline, and empty section bodies', () => {
  const source = 'global {\r\n\tvalue: one\r\n\t\tchild: two\r\n}\r\ndns {}'
  const parsed = document(source)
  assert.equal(parsed.sections[0].eol, '\r\n')
  assert.equal(parsed.sections[0].body, '\r\n\tvalue: one\r\n\t\tchild: two\r\n')
  assert.equal(parsed.sections[1].body, '')
  assert.equal(replaceSectionBody(parsed, 0, parsed.sections[0].body), parsed)
  assert.equal(replaceSectionBody(parsed, 1, ''), parsed)

  const inserted = replaceSectionBody(parsed, 0, parsed.sections[0].body + '\tadded: three\n')
  assert.equal(inserted.content, source.replace('\r\n}\r\n', '\r\n\tadded: three\r\n}\r\n'))
  const edited = replaceSectionBody(parsed, 0, parsed.sections[0].body.replace('child: two', 'child: three'))
  assert.equal(edited.content, source.replace('child: two', 'child: three'))
  assert.ok(edited.content.includes('\r\n\t\tchild: three\r\n'))
  const noFinalNewline = document('global {\n\tvalue: one\n}')
  assert.equal(noFinalNewline.content, 'global {\n\tvalue: one\n}')
  assert.equal(noFinalNewline.sections[0].body, '\n\tvalue: one\n')
})

test('ignores braces in strings and comments and preserves duplicate top-level sections', () => {
  const source = [
    'global {',
    '  quoted: "a } and \\" quote"',
    '  bare: abc# still a bare token',
    '  # { comment close }',
    '  /* } comment { */',
    '  nested { value: { inner: 1 } }',
    '}',
    'global { value: second }',
  ].join('\n')
  const sections = parseSections(source)
  assert.deepEqual(sections.map(({ id, name }) => [id, name]), [
    ['section-1', 'global'],
    ['section-2', 'global'],
  ])
  assert.equal(sections[0].body, '\n  quoted: "a } and \\" quote"\n  bare: abc# still a bare token\n  # { comment close }\n  /* } comment { */\n  nested { value: { inner: 1 } }\n')
  const edited = replaceSectionBody(document(source), 1, ' value: changed ')
  assert.equal(edited.content, source.replace('value: second', 'value: changed'))
  assert.equal(edited.sections[0].body, sections[0].body)
})

test('moves later body ranges after an earlier section grows', () => {
  const source = 'global { a: 1 }\n# untouched middle\ndns { b: 2 }'
  const parsed = document(source)
  const grown = replaceSectionBody(parsed, 0, ' a: a much longer value ')
  const editedLater = replaceSectionBody(grown, 1, ' b: 3 ')
  assert.equal(editedLater.content, 'global { a: a much longer value }\n# untouched middle\ndns { b: 3 }')
  assert.equal(editedLater.content.slice(grown.sections[1].bodyStart, editedLater.sections[1].bodyEnd), ' b: 3 ')
  assert.equal(editedLater.sections[0].body, ' a: a much longer value ')
})

test('keeps the section session editable through temporarily invalid body text', () => {
  const source = 'global {\n  nested { value: 1 }\n}\ndns { server: one }'
  const parsed = document(source)
  const invalidBody = parsed.sections[0].body.replace(' }', '')
  const invalid = replaceSectionBody(parsed, 0, invalidBody)
  assert.equal(invalid.sections[0].id, parsed.sections[0].id)
  assert.equal(invalid.sections[1].id, parsed.sections[1].id)
  assert.equal(invalid.sections.length, 2)

  const restored = replaceSectionBody(invalid, 0, parsed.sections[0].body)
  const editedLater = replaceSectionBody(restored, 1, ' server: two ')
  assert.equal(editedLater.content, source.replace('server: one', 'server: two'))
  assert.deepEqual(parseSections('global { nested { value: 1 }'), [])
  assert.doesNotThrow(() => parseSections(''))
})

test('throws a stable range error for an unknown section index', () => {
  assert.throws(() => replaceSectionBody(document('global {}'), -1, ''), {
    name: 'RangeError',
    message: 'Unknown configuration section',
  })
  assert.throws(() => replaceSectionBody(document('global {}'), 1, ''), {
    name: 'RangeError',
    message: 'Unknown configuration section',
  })
})
