import { describe, it, expect } from 'vitest'
import { analyzeCV } from '../cvAnalyzer'

const strongCV = `Juan Pérez | Ingeniero de Software Senior
Ingeniero de Software con 8 años de experiencia.
Licenciatura en Ingeniería en Sistemas. Maestría en Ciencias de la Computación.
Habilidades: React, Node.js, Python, Docker, AWS, TypeScript, SQL, Git, CI/CD.
Inglés C1.
Certificación AWS Solutions Architect.
Liderazgo de equipo de 5 personas. Desplegué proyectos en producción.
Logré aumentar la eficiencia del sistema en un 40%.`

const weakCV = `Ana López
Recien egresada. Curso básico de HTML.
Solo español.`

const jobDescription = `Buscamos Desarrollador Full Stack Senior.
Requisitos indispensable:
React, Node.js, Python, Docker
5 años de experiencia
Licenciatura en Sistemas o afín
Inglés B2 o superior
Deseable:
AWS, TypeScript, CI/CD`

describe('analyzeCV', () => {
  it('returns a score between 0 and 100 (clamped to 5-98)', () => {
    const result = analyzeCV(strongCV, jobDescription)
    expect(result.score).toBeGreaterThanOrEqual(5)
    expect(result.score).toBeLessThanOrEqual(98)
  })

  it('gives a high score (>= 70) to a strong CV', () => {
    const result = analyzeCV(strongCV, jobDescription)
    expect(result.score).toBeGreaterThanOrEqual(70)
  })

  it('gives a low score (< 40) to a weak CV', () => {
    const result = analyzeCV(weakCV, jobDescription)
    expect(result.score).toBeLessThan(40)
  })

  it('returns all expected fields in the result', () => {
    const result = analyzeCV(strongCV, jobDescription)
    expect(result).toHaveProperty('score')
    expect(result).toHaveProperty('titulo')
    expect(result).toHaveProperty('experiencia_anos')
    expect(result).toHaveProperty('habilidades_clave')
    expect(result).toHaveProperty('fortalezas')
    expect(result).toHaveProperty('brechas')
    expect(result).toHaveProperty('veredicto')
    expect(result).toHaveProperty('siguiente_paso')
    expect(result).toHaveProperty('pregunta_entrevista')
    expect(result).toHaveProperty('matched_keywords')
    expect(result).toHaveProperty('unmatched_keywords')
  })

  it('extracts experience years correctly', () => {
    const result = analyzeCV(strongCV, jobDescription)
    expect(result.experiencia_anos).toBe(8)
  })

  it('populates habilidades_clave for a strong CV', () => {
    const result = analyzeCV(strongCV, jobDescription)
    expect(result.habilidades_clave.length).toBeGreaterThan(0)
    expect(result.habilidades_clave.length).toBeLessThanOrEqual(5)
  })

  it('populates fortalezas for a strong CV', () => {
    const result = analyzeCV(strongCV, jobDescription)
    expect(result.fortalezas.length).toBeGreaterThan(0)
    expect(result.fortalezas.length).toBeLessThanOrEqual(4)
  })

  it('populates brechas for a weak CV', () => {
    const result = analyzeCV(weakCV, jobDescription)
    expect(result.brechas.length).toBeGreaterThan(0)
  })

  it('provides a positive veredicto for a high-scoring CV', () => {
    const result = analyzeCV(strongCV, jobDescription)
    if (result.score >= 80) {
      expect(result.veredicto).toContain('fuerte')
    }
  })

  it('provides a rejection veredicto for a low-scoring CV', () => {
    const result = analyzeCV(weakCV, jobDescription)
    expect(result.veredicto).toContain('no se alinea')
  })

  it('suggests next steps appropriate to the score', () => {
    const weak = analyzeCV(weakCV, jobDescription)
    expect(weak.siguiente_paso).toContain('Descartar')

    const strong = analyzeCV(strongCV, jobDescription)
    if (strong.score >= 80) {
      expect(strong.siguiente_paso).toContain('entrevista')
    }
  })

  it('generates an interview question', () => {
    const result = analyzeCV(strongCV, jobDescription)
    expect(result.pregunta_entrevista.length).toBeGreaterThan(10)
  })

  it('includes matched and unmatched keywords', () => {
    const result = analyzeCV(strongCV, jobDescription)
    expect(Array.isArray(result.matched_keywords)).toBe(true)
    expect(Array.isArray(result.unmatched_keywords)).toBe(true)
  })

  it('handles empty CV text gracefully', () => {
    const result = analyzeCV('', jobDescription)
    expect(result.score).toBe(5) // minimum clamp
    expect(result.experiencia_anos).toBe(0)
  })

  it('handles empty job description gracefully', () => {
    const result = analyzeCV(strongCV, '')
    expect(result.score).toBeGreaterThanOrEqual(5)
    expect(result.score).toBeLessThanOrEqual(98)
  })

  it('extracts a display title from the first line', () => {
    const result = analyzeCV(strongCV, jobDescription)
    expect(result.titulo).toContain('Juan')
  })

  it('truncates long titles to max 45 characters', () => {
    const longTitleCV = 'A'.repeat(60) + '\n5 years of experience in React and Node.js'
    const result = analyzeCV(longTitleCV, jobDescription)
    expect(result.titulo.length).toBeLessThanOrEqual(45)
  })

  it('analyzes multiple CVs independently', () => {
    const result1 = analyzeCV(strongCV, jobDescription)
    const result2 = analyzeCV(weakCV, jobDescription)
    expect(result1.score).not.toBe(result2.score)
    expect(result1.score).toBeGreaterThan(result2.score)
  })

  it('always clamps score to at least 5', () => {
    const result = analyzeCV('nada relevante', jobDescription)
    expect(result.score).toBeGreaterThanOrEqual(5)
  })
})
