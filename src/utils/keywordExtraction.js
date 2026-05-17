import { normalize } from "./textNormalization";
import { SYNONYMS } from "../constants/synonyms";

// Extrae keywords de una descripcion de puesto, separando requeridas vs deseables
export function extractKeywords(jobDesc) {
  const norm = normalize(jobDesc);
  const lines = norm.split(/[\n,;]+/).map(l => l.trim()).filter(Boolean);

  const keywords = [];
  const requiredKeywords = new Set();
  let inRequiredSection = false;

  for (const line of lines) {
    // Detectar secciones de requisitos obligatorios
    if (/indispensable|requerido|requisito|obligatorio|necesario/.test(line)) {
      inRequiredSection = true;
    }
    if (/deseable|plus|valorable|preferible|opcional/.test(line)) {
      inRequiredSection = false;
    }

    // Extraer terminos multi-palabra conocidos
    const knownTerms = Object.keys(SYNONYMS);
    for (const term of knownTerms) {
      if (line.includes(term) && !keywords.includes(term)) {
        keywords.push(term);
        if (inRequiredSection) requiredKeywords.add(term);
      }
    }

    // Extraer palabras sueltas que parezcan skills
    const words = line.replace(/^[-*\d.)\s]+/, "").split(/[\s,;/()]+/);
    for (const w of words) {
      const clean = w.replace(/[^a-z0-9.#+]/g, "");
      if (clean.length >= 2 && !["de", "en", "con", "para", "del", "las", "los", "una", "uno", "que", "por", "mas", "sin", "como", "ser", "anos", "ano", "experiencia", "buscamos", "profesional", "capacidad", "conocimiento", "minimo", "avanzado", "basico", "intermedio", "senior", "junior", "trabajar"].includes(clean)) {
        if (SYNONYMS[clean] && !keywords.includes(clean)) {
          keywords.push(clean);
          if (inRequiredSection) requiredKeywords.add(clean);
        }
      }
    }
  }

  // Fallback: si no se extrajo nada, buscar terminos conocidos en todo el texto
  if (keywords.length === 0) {
    const knownTerms = Object.keys(SYNONYMS);
    for (const term of knownTerms) {
      if (norm.includes(term) && !keywords.includes(term)) {
        keywords.push(term);
      }
    }
  }

  return { keywords, requiredKeywords };
}

// Matchea keywords contra un CV usando sinonimos y scoring ponderado
export function matchKeywords(cvText, keywords, requiredKeywords) {
  const normCv = normalize(cvText);
  const matched = [];
  const unmatched = [];

  for (const kw of keywords) {
    const synonyms = SYNONYMS[kw] || [kw];
    const found = synonyms.some(syn => normCv.includes(normalize(syn)));
    if (found) {
      matched.push(kw);
    } else {
      unmatched.push(kw);
    }
  }

  // Score ponderado: keywords requeridas cuentan 2x
  let totalWeight = 0;
  let matchedWeight = 0;
  for (const kw of keywords) {
    const w = requiredKeywords.has(kw) ? 2 : 1;
    totalWeight += w;
    if (matched.includes(kw)) matchedWeight += w;
  }

  const keywordScore = totalWeight > 0 ? (matchedWeight / totalWeight) : 0;
  return { matched, unmatched, keywordScore };
}
