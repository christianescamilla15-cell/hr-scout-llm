import { normalize } from "./textNormalization";

// Detecta nivel educativo y certificaciones en un CV
export function detectEducation(cvText) {
  const norm = normalize(cvText);
  let level = 0;
  let label = "No detectada";

  if (/doctorado|phd|ph\.d/.test(norm)) { level = 4; label = "Doctorado"; }
  else if (/maestria|master|mba|m\.sc|m\.s\./.test(norm)) { level = 3; label = "Maestria"; }
  else if (/licenciatura|ingenieria|ingeniero|ingeniera|bachelor|b\.sc|b\.s\.|carrera|universidad/.test(norm)) { level = 2; label = "Licenciatura/Ingenieria"; }
  else if (/bootcamp|tecnico|tecnica|diplomado|curso/.test(norm)) { level = 1; label = "Tecnico/Bootcamp"; }
  else if (/preparatoria|bachillerato|high school/.test(norm)) { level = 0.5; label = "Preparatoria"; }

  const certs = [];
  const certPatterns = [
    /certificaci[oó]n\s+([^.,\n]+)/gi,
    /certificad[oa]\s+(?:en\s+)?([^.,\n]+)/gi,
    /certified\s+([^.,\n]+)/gi,
  ];
  for (const pat of certPatterns) {
    let m2;
    while ((m2 = pat.exec(cvText)) !== null) {
      certs.push(m2[1].trim().substring(0, 40));
    }
  }

  return { level, label, certifications: certs };
}

// Detecta el nivel educativo requerido de una descripcion de puesto
export function detectRequiredEducation(jobDesc) {
  const norm = normalize(jobDesc);
  if (/doctorado|phd/.test(norm)) return 4;
  if (/maestria|master|mba/.test(norm)) return 3;
  if (/licenciatura|ingenieria|bachelor/.test(norm)) return 2;
  if (/tecnico|bootcamp/.test(norm)) return 1;
  return 0;
}
