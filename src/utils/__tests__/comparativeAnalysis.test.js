import { describe, it, expect } from 'vitest'
import { generateComparativeAnalysis } from '../comparativeAnalysis'

const jobDesc = 'Buscamos desarrollador con React, Node.js y Python. 3 años de experiencia.'

const candidates = [
  { id: 'c1', name: 'Carlos García' },
  { id: 'c2', name: 'María López' },
  { id: 'c3', name: 'Pedro Ramírez' },
]

const results = {
  c1: {
    score: 85,
    habilidades_clave: ['React', 'Node.js', 'Python'],
    experiencia_anos: 5,
    matched_keywords: ['react', 'node.js', 'python'],
    unmatched_keywords: [],
  },
  c2: {
    score: 60,
    habilidades_clave: ['React'],
    experiencia_anos: 2,
    matched_keywords: ['react'],
    unmatched_keywords: ['node.js', 'python'],
  },
  c3: {
    score: 40,
    habilidades_clave: ['Python'],
    experiencia_anos: 1,
    matched_keywords: ['python'],
    unmatched_keywords: ['react', 'node.js'],
  },
}

describe('generateComparativeAnalysis', () => {
  it('returns null when fewer than 2 candidates have results', () => {
    const result = generateComparativeAnalysis([candidates[0]], { c1: results.c1 }, jobDesc)
    expect(result).toBeNull()
  })

  it('returns null when no candidates have results', () => {
    const result = generateComparativeAnalysis(candidates, {}, jobDesc)
    expect(result).toBeNull()
  })

  it('identifies the best candidate (highest score)', () => {
    const result = generateComparativeAnalysis(candidates, results, jobDesc)
    expect(result.best.id).toBe('c1')
    expect(result.best.name).toBe('Carlos García')
  })

  it('includes a bestExplanation with the top candidate name and score', () => {
    const result = generateComparativeAnalysis(candidates, results, jobDesc)
    expect(result.bestExplanation).toContain('Carlos')
    expect(result.bestExplanation).toContain('85')
  })

  it('identifies common skill gaps across candidates', () => {
    const result = generateComparativeAnalysis(candidates, results, jobDesc)
    expect(Array.isArray(result.commonGaps)).toBe(true)
  })

  it('provides a heatmap of skill coverage', () => {
    const result = generateComparativeAnalysis(candidates, results, jobDesc)
    expect(Array.isArray(result.heatmap)).toBe(true)
  })

  it('reports totalAnalyzed count', () => {
    const result = generateComparativeAnalysis(candidates, results, jobDesc)
    expect(result.totalAnalyzed).toBe(3)
  })

  it('handles two candidates with equal scores', () => {
    const equalResults = {
      c1: { ...results.c1, score: 70 },
      c2: { ...results.c2, score: 70 },
    }
    const result = generateComparativeAnalysis(
      [candidates[0], candidates[1]],
      equalResults,
      jobDesc
    )
    expect(result).not.toBeNull()
    expect(result.totalAnalyzed).toBe(2)
  })
})
