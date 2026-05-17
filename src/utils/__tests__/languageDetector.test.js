import { describe, it, expect } from 'vitest'
import { detectLanguages } from '../languageDetector'

describe('detectLanguages', () => {
  it('detects "Inglés C1" proficiency', () => {
    const result = detectLanguages('Inglés C1')
    expect(result.length).toBe(1)
    expect(result[0].lang).toBe('Ingles')
    expect(result[0].level).toBe('C1')
    expect(result[0].score).toBe(5)
  })

  it('detects "English native"', () => {
    const result = detectLanguages('English native')
    expect(result.length).toBe(1)
    expect(result[0].lang).toBe('Ingles')
    expect(result[0].score).toBe(6)
  })

  it('detects "Inglés B2" level', () => {
    const result = detectLanguages('Inglés B2')
    expect(result[0].score).toBe(4)
    expect(result[0].level).toBe('B2')
  })

  it('detects "Inglés avanzado"', () => {
    const result = detectLanguages('Inglés avanzado')
    expect(result[0].score).toBe(5)
  })

  it('detects "Inglés nativo"', () => {
    const result = detectLanguages('Inglés nativo')
    expect(result[0].score).toBe(6)
  })

  it('detects "Inglés intermedio"', () => {
    const result = detectLanguages('Inglés intermedio')
    expect(result[0].score).toBe(3)
  })

  it('returns empty array when no language info found', () => {
    const result = detectLanguages('Experiencia en React y Python')
    expect(result).toEqual([])
  })

  it('detects "solo español" as no English', () => {
    const result = detectLanguages('Solo español')
    expect(result.length).toBe(1)
    expect(result[0].lang).toBe('Ingles')
    expect(result[0].score).toBe(0)
  })

  it('handles empty string', () => {
    const result = detectLanguages('')
    expect(result).toEqual([])
  })
})
