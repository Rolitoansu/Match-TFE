import { describe, expect, test } from 'vitest'
import { normalizeCSVText, splitCSVLine, validateCSVFile } from './adminHelpers'

describe('splitCSVLine', () => {
  test('splits a comma-separated line into trimmed values', () => {
    expect(splitCSVLine('name,email,role')).toEqual(['name', 'email', 'role'])
  })

  test('trims surrounding whitespace from each field', () => {
    expect(splitCSVLine('  Alice , alice@example.com , student  ')).toEqual([
      'Alice',
      'alice@example.com',
      'student',
    ])
  })

  test('returns a single-element array for a line with no commas', () => {
    expect(splitCSVLine('singlevalue')).toEqual(['singlevalue'])
  })

  test('returns an array with an empty string for an empty line', () => {
    expect(splitCSVLine('')).toEqual([''])
  })

  test('preserves empty fields between consecutive commas', () => {
    expect(splitCSVLine('a,,c')).toEqual(['a', '', 'c'])
  })
})

describe('normalizeCSVText', () => {
  test('removes the UTF-8 BOM character from the beginning of the string', () => {
    const withBom = '\uFEFFname,email'
    expect(normalizeCSVText(withBom)).toBe('name,email')
  })

  test('leaves text unchanged when no BOM is present', () => {
    expect(normalizeCSVText('name,email')).toBe('name,email')
  })

  test('only removes the BOM at the very start, not from other positions', () => {
    const text = 'hello\uFEFFworld'
    expect(normalizeCSVText(text)).toBe('hello\uFEFFworld')
  })

  test('handles an empty string without error', () => {
    expect(normalizeCSVText('')).toBe('')
  })
})

describe('validateCSVFile', () => {
  function makeFile(name: string, size: number, type: string): File {
    const content = 'x'.repeat(size)
    const file = new File([content], name, { type })
    return file
  }

  test('returns null for a valid CSV file within size limits', () => {
    const file = makeFile('data.csv', 100, 'text/csv')
    expect(validateCSVFile(file)).toBeNull()
  })

  test('accepts files identified by the ms-excel MIME type', () => {
    const file = makeFile('data.csv', 100, 'application/vnd.ms-excel')
    expect(validateCSVFile(file)).toBeNull()
  })

  test('accepts files with an empty MIME type when the extension is .csv', () => {
    const file = makeFile('data.csv', 100, '')
    expect(validateCSVFile(file)).toBeNull()
  })

  test('rejects a file whose extension is not .csv', () => {
    const file = makeFile('report.xlsx', 100, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    expect(validateCSVFile(file)).toBeTruthy()
  })

  test('rejects a file with zero bytes', () => {
    const file = makeFile('empty.csv', 0, 'text/csv')
    expect(validateCSVFile(file)).toBeTruthy()
  })

  test('rejects a file that exceeds the default 2 MB limit', () => {
    const tooBig = 2 * 1024 * 1024 + 1
    const file = makeFile('big.csv', tooBig, 'text/csv')
    expect(validateCSVFile(file)).toBeTruthy()
  })

  test('accepts a file exactly at the default size limit', () => {
    const maxSize = 2 * 1024 * 1024
    const file = makeFile('exact.csv', maxSize, 'text/csv')
    expect(validateCSVFile(file)).toBeNull()
  })

  test('respects a custom maximum size passed as argument', () => {
    const file = makeFile('data.csv', 500, 'text/csv')
    expect(validateCSVFile(file, 499)).toBeTruthy()
    expect(validateCSVFile(file, 500)).toBeNull()
  })
})
