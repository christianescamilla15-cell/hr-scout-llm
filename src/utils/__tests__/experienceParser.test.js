import { describe, it, expect } from 'vitest'
import { extractExperienceYears, extractRequiredYears } from '../experienceParser'

describe('extractExperienceYears', () => {
  it('parses "5 years of experience"', () => {
    expect(extractExperienceYears('I have 5 years of experience in development')).toBe(5)
  })

  it('parses "3 años de experiencia" (Spanish)', () => {
    expect(extractExperienceYears('Tengo 3 años de experiencia')).toBe(3)
  })

  it('parses "experiencia: 7 años"', () => {
    expect(extractExperienceYears('Experiencia: 7 años en el sector')).toBe(7)
  })

  it('parses "10 years experience" without "of"', () => {
    expect(extractExperienceYears('10 years experience building apps')).toBe(10)
  })

  it('returns 0 when no experience is mentioned', () => {
    expect(extractExperienceYears('Recien egresado de la universidad')).toBe(0)
  })

  it('returns 0 for empty string', () => {
    expect(extractExperienceYears('')).toBe(0)
  })

  it('extracts years from date ranges as fallback', () => {
    const cv = 'Empresa A (2018-2022)\nEmpresa B (2022-2024)'
    expect(extractExperienceYears(cv)).toBe(6)
  })

  it('extracts years from a single date range', () => {
    expect(extractExperienceYears('Trabajé en Acme Corp 2015-2020')).toBe(5)
  })

  it('prefers explicit statement over date ranges', () => {
    const cv = '8 años de experiencia\nEmpresa (2020-2022)'
    expect(extractExperienceYears(cv)).toBe(8)
  })

  it('handles "año" (singular) correctly', () => {
    expect(extractExperienceYears('1 año de experiencia')).toBe(1)
  })
})

describe('extractRequiredYears', () => {
  it('parses "3 años de experiencia" from job description', () => {
    expect(extractRequiredYears('Se requieren 3 años de experiencia')).toBe(3)
  })

  it('parses "5+ años experiencia"', () => {
    expect(extractRequiredYears('Minimo 5+ años experiencia')).toBe(5)
  })

  it('parses "3 years" in English', () => {
    expect(extractRequiredYears('At least 3 years in the field')).toBe(3)
  })

  it('defaults to 2 when no years mentioned', () => {
    expect(extractRequiredYears('Buscamos un desarrollador')).toBe(2)
  })

  it('defaults to 2 for empty string', () => {
    expect(extractRequiredYears('')).toBe(2)
  })
})
