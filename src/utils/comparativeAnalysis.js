import { extractKeywords } from "./keywordExtraction";
import { SKILLS_DISPLAY } from "../constants/synonyms";

// Genera analisis comparativo entre candidatos analizados
export function generateComparativeAnalysis(candidates, results, jobDesc) {
  const analyzed = candidates.filter(c => results[c.id]);
  if (analyzed.length < 2) return null;

  const sorted = [...analyzed].sort((a, b) => (results[b.id]?.score || 0) - (results[a.id]?.score || 0));
  const best = sorted[0];
  const bestResult = results[best.id];

  // Explicacion del mejor candidato
  const bestExplanation = `${best.name} obtiene el mayor puntaje (${bestResult.score}/100) con ${bestResult.habilidades_clave.length} habilidades clave detectadas y ${bestResult.experiencia_anos} anos de experiencia.`;

  // Brechas comunes
  const gapCounts = {};
  for (const c of analyzed) {
    const r = results[c.id];
    if (r.unmatched_keywords) {
      for (const gap of r.unmatched_keywords) {
        const display = SKILLS_DISPLAY[gap] || gap;
        gapCounts[display] = (gapCounts[display] || 0) + 1;
      }
    }
  }
  const commonGaps = Object.entries(gapCounts)
    .filter(([, count]) => count >= Math.ceil(analyzed.length * 0.5))
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([skill, count]) => ({ skill, count, pct: Math.round(count / analyzed.length * 100) }));

  // Heatmap de habilidades
  const skillCoverage = {};
  const { keywords } = extractKeywords(jobDesc);
  for (const kw of keywords) {
    const display = SKILLS_DISPLAY[kw] || kw;
    if (!skillCoverage[display]) {
      skillCoverage[display] = { skill: display, covered: 0, candidates: [] };
    }
  }
  for (const c of analyzed) {
    const r = results[c.id];
    if (r.matched_keywords) {
      for (const mk of r.matched_keywords) {
        const display = SKILLS_DISPLAY[mk] || mk;
        if (skillCoverage[display]) {
          skillCoverage[display].covered++;
          skillCoverage[display].candidates.push(c.name.split(" ")[0]);
        }
      }
    }
  }
  const heatmap = Object.values(skillCoverage)
    .sort((a, b) => b.covered - a.covered)
    .filter((v, i, arr) => arr.findIndex(x => x.skill === v.skill) === i);

  return { best, bestExplanation, commonGaps, heatmap, totalAnalyzed: analyzed.length };
}
