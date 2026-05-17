import { normalize } from "./textNormalization";
import { extractKeywords, matchKeywords } from "./keywordExtraction";
import { extractExperienceYears, extractRequiredYears } from "./experienceParser";
import { detectEducation } from "./educationDetector";
import { detectLanguages } from "./languageDetector";
import { SKILLS_DISPLAY } from "../constants/synonyms";

// Motor principal de scoring de CVs (0-100)
export function analyzeCV(cvText, jobDescription) {
  const { keywords, requiredKeywords } = extractKeywords(jobDescription);
  const { matched, unmatched, keywordScore } = matchKeywords(cvText, keywords, requiredKeywords);
  const experienceYears = extractExperienceYears(cvText);
  const requiredYears = extractRequiredYears(jobDescription);
  const education = detectEducation(cvText);
  const languages = detectLanguages(cvText);

  // --- Calculo de score ---
  // Match de keywords: 70%
  let score = keywordScore * 70;

  // Bonus experiencia: hasta 12 pts
  if (experienceYears >= requiredYears) {
    score += 12;
  } else if (experienceYears > 0) {
    score += Math.round((experienceYears / requiredYears) * 12);
  }

  // Bonus educacion: hasta 8 pts
  if (education.level >= 3) score += 8;
  else if (education.level >= 2) score += 6;
  else if (education.level >= 1) score += 3;
  // Extra por certificaciones
  score += Math.min(4, education.certifications.length * 2);

  // Bonus idiomas: hasta 6 pts
  const engLang = languages.find(l => l.lang === "Ingles");
  if (engLang) {
    if (engLang.score >= 5) score += 6;
    else if (engLang.score >= 4) score += 4;
    else if (engLang.score >= 3) score += 2;
  }

  score = Math.min(98, Math.max(5, Math.round(score)));

  // --- Extraer titulo ---
  const firstLine = cvText.split("\n")[0] || "";
  const titulo = (firstLine.split("|")[0] || firstLine).trim();
  const displayTitle = titulo.length > 45 ? titulo.substring(0, 42) + "..." : titulo;

  // --- Display de habilidades ---
  const habilidades = matched
    .map(k => SKILLS_DISPLAY[k] || k)
    .filter((v, i, arr) => arr.indexOf(v) === i)
    .slice(0, 5);
  if (habilidades.length === 0) habilidades.push("Generales");

  // --- Fortalezas (con referencias al CV) ---
  const fortalezas = [];
  const normCv = normalize(cvText);

  if (experienceYears >= requiredYears) {
    fortalezas.push(`${experienceYears} anos de experiencia, cumple o supera el requerimiento de ${requiredYears}+ anos`);
  }
  if (matched.length >= keywords.length * 0.7 && keywords.length > 0) {
    fortalezas.push(`Cubre ${matched.length} de ${keywords.length} competencias clave del puesto`);
  }
  if (education.level >= 3) {
    fortalezas.push(`Formacion academica solida: ${education.label}`);
  }
  if (education.certifications.length > 0) {
    fortalezas.push(`Certificaciones relevantes: ${education.certifications.slice(0, 2).join(", ")}`);
  }
  if (engLang && engLang.score >= 5) {
    fortalezas.push(`Nivel de ingles avanzado (${engLang.level}), ideal para entornos internacionales`);
  }
  if (/lider|equipo|gestio|coordin|dirigi/.test(normCv)) {
    fortalezas.push("Experiencia en liderazgo y gestion de equipos");
  }
  if (/produccion|deploy|portafolio|portfolio|proyecto/.test(normCv)) {
    fortalezas.push("Proyectos concretos y experiencia practica demostrada");
  }
  if (/roi|metrica|kpi|resultado|logro|aument|reduj|mejor/.test(normCv)) {
    fortalezas.push("Orientacion a resultados con metricas cuantificables");
  }
  if (fortalezas.length < 2) {
    fortalezas.push("Perfil con potencial de desarrollo en el area requerida");
  }

  // --- Brechas (habilidades requeridas no encontradas) ---
  const brechas = [];
  const requiredUnmatched = unmatched.filter(k => requiredKeywords.has(k));
  const otherUnmatched = unmatched.filter(k => !requiredKeywords.has(k));

  for (const gap of requiredUnmatched) {
    const display = SKILLS_DISPLAY[gap] || gap;
    brechas.push(`Falta competencia requerida: ${display}`);
  }
  for (const gap of otherUnmatched.slice(0, 3 - brechas.length)) {
    const display = SKILLS_DISPLAY[gap] || gap;
    brechas.push(`No se evidencia experiencia en ${display}`);
  }
  if (experienceYears < requiredYears && experienceYears > 0) {
    brechas.push(`Solo ${experienceYears} anos de experiencia (requeridos ${requiredYears}+)`);
  }
  if (experienceYears === 0) {
    brechas.push("No se detecta experiencia profesional especifica");
  }
  if (engLang && engLang.score < 4 && /ingles|english|b2|c1/.test(normalize(jobDescription))) {
    brechas.push(`Nivel de ingles ${engLang.level || "no especificado"} por debajo del requerimiento`);
  }
  if (brechas.length === 0) {
    brechas.push("Podria requerir onboarding en procesos internos especificos");
  }

  // --- Veredicto ---
  let veredicto, siguiente_paso, pregunta_entrevista;

  if (score >= 80) {
    veredicto = `Candidato fuerte con ${matched.length} de ${keywords.length} competencias cubiertas. Perfil altamente alineado con los requerimientos del puesto.`;
    siguiente_paso = "Agendar entrevista tecnica en los proximos 3 dias. Candidato prioritario.";
    const topSkill = habilidades[0] || "su area";
    pregunta_entrevista = experienceYears >= 3
      ? `Describe un proyecto donde hayas implementado ${topSkill} de principio a fin. Cual fue el mayor desafio tecnico y como lo resolviste?`
      : `Cual ha sido tu proyecto mas complejo con ${topSkill} y que metricas de exito definiste?`;
  } else if (score >= 60) {
    veredicto = `Perfil parcialmente compatible. Tiene fortalezas relevantes pero existen brechas que requeririan capacitacion o periodo de adaptacion.`;
    siguiente_paso = "Anadir a lista de espera. Evaluar si las brechas son capacitables en 1-2 meses.";
    const mainGap = brechas[0] || "areas pendientes";
    pregunta_entrevista = `Respecto a ${mainGap.toLowerCase().replace("falta competencia requerida: ", "").replace("no se evidencia experiencia en ", "")}: tienes experiencia o interes? Como abordarias la curva de aprendizaje?`;
  } else {
    veredicto = `El perfil no se alinea con los requerimientos criticos del puesto. Las brechas identificadas son significativas.`;
    siguiente_paso = "Descartar para este puesto. Considerar para roles alternativos si aplica.";
    pregunta_entrevista = `Que te motiva a postularte para este rol dado tu background actual? Como planeas cerrar las brechas identificadas?`;
  }

  return {
    score,
    titulo: displayTitle,
    experiencia_anos: experienceYears,
    habilidades_clave: habilidades,
    fortalezas: fortalezas.slice(0, 4),
    brechas: brechas.slice(0, 3),
    veredicto,
    siguiente_paso,
    pregunta_entrevista,
    matched_keywords: matched,
    unmatched_keywords: unmatched,
  };
}
