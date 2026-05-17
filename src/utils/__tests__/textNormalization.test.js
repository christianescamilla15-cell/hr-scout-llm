import { describe, it, expect } from 'vitest'
import { normalize } from '../textNormalization'

describe('normalize', () => {
  it('converts text to lowercase', () => {
    expect(normalize('HELLO WORLD')).toBe('hello world')
  })

  it('removes accents from Spanish characters', () => {
    expect(normalize('programación')).toContain('programacion')
    expect(normalize('diseño')).toBe('diseno')
    expect(normalize('línea')).toBe('linea')
    expect(normalize('útil')).toBe('util')
  })

  it('removes all common accent types (á, é, í, ó, ú, ñ)', () => {
    const input = 'María José tenía más café'
    const result = normalize(input)
    expect(result).not.toMatch(/[áéíóúñ]/)
    expect(result).toContain('maria jose tenia mas cafe')
  })

  it('replaces special characters with spaces', () => {
    const result = normalize('react@18 & vue$3')
    // @ & $ replaced with space
    expect(result).not.toContain('@')
    expect(result).not.toContain('&')
    expect(result).not.toContain('$')
  })

  it('preserves dots, slashes, hyphens, plus, and hash', () => {
    expect(normalize('C#')).toContain('#')
    expect(normalize('C++')).toContain('+')
    expect(normalize('Node.js')).toContain('node.js')
    expect(normalize('CI/CD')).toContain('ci/cd')
    expect(normalize('full-stack')).toContain('full-stack')
  })

  it('handles empty string', () => {
    expect(normalize('')).toBe('')
  })

  it('handles string with only whitespace', () => {
    expect(normalize('   ')).toBe('   ')
  })

  it('handles unicode characters beyond basic accents', () => {
    const result = normalize('über naïve résumé')
    expect(result).toBe('uber naive resume')
  })
})
