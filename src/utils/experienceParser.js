// Extrae anos de experiencia del texto de un CV
export function extractExperienceYears(cvText) {
  const patterns = [
    /(\d+)\s*a[nñ]os?\s*de\s*experiencia/i,
    /(\d+)\s*years?\s*(?:of\s*)?experience/i,
    /experiencia[:\s]*(\d+)\s*a[nñ]os?/i,
  ];
  for (const pat of patterns) {
    const m = cvText.match(pat);
    if (m) return parseInt(m[1]);
  }
  // Fallback: contar rangos de fechas
  const ranges = cvText.match(/\(?\d{4}\s*[-–]\s*\d{4}\)?/g);
  if (ranges && ranges.length > 0) {
    let total = 0;
    for (const r of ranges) {
      const years = r.match(/(\d{4})\s*[-–]\s*(\d{4})/);
      if (years) total += parseInt(years[2]) - parseInt(years[1]);
    }
    if (total > 0) return total;
  }
  return 0;
}

// Extrae anos requeridos de una descripcion de puesto
export function extractRequiredYears(jobDesc) {
  const m = jobDesc.match(/(\d+)\+?\s*a[nñ]os?\s*(?:de\s*)?experiencia/i)
    || jobDesc.match(/(\d+)\+?\s*years/i);
  return m ? parseInt(m[1]) : 2;
}
