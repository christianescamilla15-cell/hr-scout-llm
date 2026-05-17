import { describe, it, expect } from 'vitest'
import { extractKeywords, matchKeywords } from '../keywordExtraction'

describe('extractKeywords', () => {
  it('extracts known keywords from a job description', () => {
    const { keywords } = extractKeywords('Buscamos desarrollador con React y Node.js')
    expect(keywords).toContain('react')
    expect(keywords).toContain('node.js')
  })

  it('extracts multi-word skills like "machine learning"', () => {
    const { keywords } = extractKeywords('Experiencia en Machine Learning y Python')
    expect(keywords).toContain('machine learning')
  })

  it('extracts keywords case-insensitively', () => {
    const { keywords } = extractKeywords('Conocimiento de PYTHON y REACT')
    expect(keywords).toContain('python')
    expect(keywords).toContain('react')
  })

  it('returns few or no keywords for unrecognized text', () => {
    const { keywords } = extractKeywords('hola mundo buenas tardes')
    expect(keywords.length).toBe(0)
  })

  it('marks keywords in required sections', () => {
    const desc = 'Requisitos indispensable:\nReact, Python\nDeseable:\nDocker'
    const { keywords, requiredKeywords } = extractKeywords(desc)
    expect(requiredKeywords.has('react')).toBe(true)
    expect(requiredKeywords.has('python')).toBe(true)
    expect(requiredKeywords.has('docker')).toBe(false)
  })

  it('does not duplicate keywords', () => {
    const { keywords } = extractKeywords('React, react, REACT y mas React')
    const reactCount = keywords.filter(k => k === 'react').length
    expect(reactCount).toBeLessThanOrEqual(1)
  })

  it('extracts keywords from text with Spanish accents', () => {
    const { keywords } = extractKeywords('Automatización de procesos con Python')
    expect(keywords).toContain('python')
    expect(keywords).toContain('automatizacion')
  })

  it('handles empty string input', () => {
    const { keywords } = extractKeywords('')
    expect(keywords).toEqual([])
  })

  it('extracts CI/CD and similar compound terms', () => {
    const { keywords } = extractKeywords('Experiencia con CI/CD y Docker')
    expect(keywords).toContain('ci/cd')
    expect(keywords).toContain('docker')
  })

  it('extracts prompt engineering as a keyword', () => {
    const { keywords } = extractKeywords('Conocimiento en prompt engineering')
    expect(keywords).toContain('prompt engineering')
  })

  it('extracts cloud provider keywords', () => {
    const { keywords } = extractKeywords('Manejo de AWS y Azure')
    expect(keywords).toContain('aws')
    expect(keywords).toContain('azure')
  })

  it('extracts database keywords', () => {
    const { keywords } = extractKeywords('SQL y base de datos relacional')
    expect(keywords).toContain('sql')
  })
})

describe('matchKeywords', () => {
  it('matches keywords found in CV text', () => {
    const { matched } = matchKeywords(
      'Experiencia con React y Node.js durante 3 años',
      ['react', 'node.js', 'python'],
      new Set()
    )
    expect(matched).toContain('react')
    expect(matched).toContain('node.js')
  })

  it('reports unmatched keywords not found in CV', () => {
    const { unmatched } = matchKeywords(
      'Solo tengo experiencia con React',
      ['react', 'python', 'docker'],
      new Set()
    )
    expect(unmatched).toContain('python')
    expect(unmatched).toContain('docker')
  })

  it('matches via synonyms (e.g., "js" matches JavaScript)', () => {
    const { matched } = matchKeywords(
      'Dominio de JavaScript avanzado',
      ['js'],
      new Set()
    )
    expect(matched).toContain('js')
  })

  it('calculates keywordScore as ratio of matched to total', () => {
    const { keywordScore } = matchKeywords(
      'React y Python',
      ['react', 'python', 'docker', 'aws'],
      new Set()
    )
    expect(keywordScore).toBeCloseTo(0.5, 1)
  })

  it('gives required keywords double weight in scoring', () => {
    const required = new Set(['react'])
    // 2 keywords: react (weight 2, matched) + docker (weight 1, not matched)
    // matchedWeight = 2, totalWeight = 3
    const { keywordScore } = matchKeywords(
      'Experiencia en React',
      ['react', 'docker'],
      required
    )
    expect(keywordScore).toBeCloseTo(2 / 3, 1)
  })

  it('returns 0 keywordScore when no keywords provided', () => {
    const { keywordScore } = matchKeywords('Texto cualquiera', [], new Set())
    expect(keywordScore).toBe(0)
  })

  it('returns perfect score when all keywords matched', () => {
    const { keywordScore } = matchKeywords(
      'React Python Docker',
      ['react', 'python', 'docker'],
      new Set()
    )
    expect(keywordScore).toBe(1)
  })

  it('identifies missing skills correctly', () => {
    const { unmatched } = matchKeywords(
      'Solo Python',
      ['python', 'react', 'aws', 'docker'],
      new Set()
    )
    expect(unmatched).toEqual(expect.arrayContaining(['react', 'aws', 'docker']))
    expect(unmatched).not.toContain('python')
  })
})
