import { describe, it, expect } from 'vitest'
import { generateReport } from '../reportGenerator'

const t = {
  reportTitle: '=== REPORTE DE ANALISIS DE CVs ===',
  reportDate: 'Fecha',
  reportJobDesc: 'Descripcion del puesto:',
  reportSuitable: 'APTO',
  reportReview: 'EN REVISION',
  reportNotSuitable: 'NO APTO',
  reportSummary: (total, aptos, revisar, noAptos) =>
    `Total: ${total} | Aptos: ${aptos} | En revision: ${revisar} | No aptos: ${noAptos}`,
}

const candidates = [
  { id: 'c1', name: 'Carlos García' },
  { id: 'c2', name: 'Ana López' },
]

const results = {
  c1: {
    score: 85,
    titulo: 'Ingeniero Senior',
    experiencia_anos: 5,
    analysisMode: 'local',
    habilidades_clave: ['React', 'Node.js'],
    fortalezas: ['Experiencia solida', 'Liderazgo'],
    brechas: ['Falta Docker'],
    veredicto: 'Candidato fuerte',
    siguiente_paso: 'Agendar entrevista',
    pregunta_entrevista: 'Describe tu proyecto mas complejo',
  },
  c2: {
    score: 45,
    titulo: 'Junior Developer',
    experiencia_anos: 1,
    analysisMode: 'local',
    habilidades_clave: ['HTML'],
    fortalezas: ['Entusiasmo'],
    brechas: ['Falta experiencia', 'Falta React'],
    veredicto: 'No alineado',
    siguiente_paso: 'Descartar',
    pregunta_entrevista: 'Como planeas cerrar brechas?',
  },
}

const jobDesc = 'Desarrollador Full Stack con React y Node.js'

describe('generateReport', () => {
  it('generates a report string for candidates', () => {
    const report = generateReport(candidates, results, jobDesc, t)
    expect(typeof report).toBe('string')
    expect(report.length).toBeGreaterThan(0)
  })

  it('includes report title and job description', () => {
    const report = generateReport(candidates, results, jobDesc, t)
    expect(report).toContain('REPORTE DE ANALISIS')
    expect(report).toContain(jobDesc)
  })

  it('includes candidate names sorted by score (highest first)', () => {
    const report = generateReport(candidates, results, jobDesc, t)
    const carlosIdx = report.indexOf('Carlos')
    const anaIdx = report.indexOf('Ana')
    expect(carlosIdx).toBeLessThan(anaIdx)
  })

  it('includes score, strengths, weaknesses, and verdict', () => {
    const report = generateReport(candidates, results, jobDesc, t)
    expect(report).toContain('85/100')
    expect(report).toContain('APTO')
    expect(report).toContain('45/100')
    expect(report).toContain('NO APTO')
    expect(report).toContain('Candidato fuerte')
    expect(report).toContain('No alineado')
  })

  it('includes summary line with counts', () => {
    const report = generateReport(candidates, results, jobDesc, t)
    expect(report).toContain('Total: 2')
    expect(report).toContain('Aptos: 1')
    expect(report).toContain('No aptos: 1')
  })

  it('handles candidates with no results gracefully', () => {
    const extraCandidates = [...candidates, { id: 'c3', name: 'Ghost' }]
    const report = generateReport(extraCandidates, results, jobDesc, t)
    expect(report).not.toContain('Ghost')
  })

  it('handles single candidate', () => {
    const report = generateReport([candidates[0]], { c1: results.c1 }, jobDesc, t)
    expect(report).toContain('Carlos')
    expect(report).toContain('Total: 1')
  })
})
