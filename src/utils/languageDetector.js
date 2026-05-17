import { normalize } from "./textNormalization";

// Detecta idiomas y niveles en un CV
export function detectLanguages(cvText) {
  const languages = [];
  const langLevelMap = { "c2": 6, "c1": 5, "b2": 4, "b1": 3, "a2": 2, "a1": 1, "nativo": 6, "native": 6, "avanzado": 5, "intermedio": 3, "basico": 1 };

  const langPatterns = [
    /ingl[eé]s\s+(c2|c1|b2|b1|a2|a1|nativo|native|avanzado|intermedio|basico)/i,
    /english\s+(c2|c1|b2|b1|a2|a1|native|advanced|intermediate|basic)/i,
  ];
  for (const pat of langPatterns) {
    const m = cvText.match(pat);
    if (m) {
      const lvl = normalize(m[1]);
      languages.push({ lang: "Ingles", level: m[1], score: langLevelMap[lvl] || 0 });
    }
  }
  if (languages.length === 0) {
    if (/solo\s+espa[nñ]ol|espa[nñ]ol\s+[uú]nicamente|unicamente/i.test(cvText)) {
      languages.push({ lang: "Ingles", level: "No", score: 0 });
    }
  }

  return languages;
}
