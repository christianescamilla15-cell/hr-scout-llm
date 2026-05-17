import { describe, it, expect } from 'vitest'
import { detectEducation, detectRequiredEducation } from '../educationDetector'

describe('detectEducation', () => {
  it('detects "Licenciatura" (Bachelor)', () => {
    const result = detectEducation('Licenciatura en Sistemas Computacionales')
    expect(result.level).toBe(2)
    expect(result.label).toContain('Licenciatura')
  })

  it('detects "Bachelor" degree in English', () => {
    const result = detectEducation('Bachelor of Science in Computer Science')
    expect(result.level).toBe(2)
  })

  it('detects "Ingeniería" as bachelor-level', () => {
    const result = detectEducation('Ingeniería en Software')
    expect(result.level).toBe(2)
    expect(result.label).toContain('Ingenieria')
  })

  it('detects "Master" degree', () => {
    const result = detectEducation('Master in Data Science')
    expect(result.level).toBe(3)
    expect(result.label).toBe('Maestria')
  })

  it('detects "Maestría"', () => {
    const result = detectEducation('Maestría en Administración')
    expect(result.level).toBe(3)
  })

  it('detects "PhD" / "Doctorado"', () => {
    expect(detectEducation('PhD in Machine Learning').level).toBe(4)
    expect(detectEducation('Doctorado en Ciencias').level).toBe(4)
    expect(detectEducation('Doctorado en Ciencias').label).toBe('Doctorado')
  })

  it('detects "Bootcamp"', () => {
    const result = detectEducation('Graduado de Bootcamp de Desarrollo Web')
    expect(result.level).toBe(1)
    expect(result.label).toContain('Bootcamp')
  })

  it('returns "No detectada" when no education found', () => {
    const result = detectEducation('Solo tengo experiencia laboral')
    expect(result.level).toBe(0)
    expect(result.label).toBe('No detectada')
  })

  it('detects highest education level (PhD > Master > Bachelor)', () => {
    // The function checks PhD first so it picks the highest
    const result = detectEducation('Tengo un PhD y una Licenciatura')
    expect(result.level).toBe(4)
  })

  it('extracts certifications from CV text', () => {
    const result = detectEducation('Certificación AWS Solutions Architect. Certified Scrum Master.')
    expect(result.certifications.length).toBeGreaterThanOrEqual(1)
  })

  it('returns empty certifications when none found', () => {
    const result = detectEducation('Sin certificaciones')
    expect(result.certifications).toEqual([])
  })

  it('detects "universidad" as bachelor-level', () => {
    const result = detectEducation('Egresado de la universidad de tecnología')
    expect(result.level).toBe(2)
  })
})

describe('detectRequiredEducation', () => {
  it('returns 4 for PhD requirement', () => {
    expect(detectRequiredEducation('Se requiere Doctorado o PhD')).toBe(4)
  })

  it('returns 3 for Master requirement', () => {
    expect(detectRequiredEducation('Maestría en áreas afines')).toBe(3)
  })

  it('returns 2 for Licenciatura requirement', () => {
    expect(detectRequiredEducation('Licenciatura en Sistemas')).toBe(2)
  })

  it('returns 1 for Bootcamp/Técnico requirement', () => {
    expect(detectRequiredEducation('Bootcamp o técnico en programación')).toBe(1)
  })

  it('returns 0 when no education requirement specified', () => {
    expect(detectRequiredEducation('Solo buscamos experiencia')).toBe(0)
  })
})
