import { SKILLS_DISPLAY } from "../constants/synonyms";

// Agente 1: Extractor de habilidades por categoria
export function extractSkills(text) {
  const categories = {
    programming: { keywords: ['python','javascript','java','c++','c#','ruby','go','rust','php','swift','kotlin','typescript','sql','html','css','react','vue','angular','node','django','flask','fastapi','laravel','spring'], found: [] },
    ai_ml: { keywords: ['machine learning','deep learning','nlp','natural language','computer vision','tensorflow','pytorch','keras','scikit','pandas','numpy','llm','gpt','claude','ai','artificial intelligence','neural network','rlhf','prompt engineering','rag','langchain','embeddings','vector'], found: [] },
    cloud: { keywords: ['aws','azure','gcp','docker','kubernetes','lambda','s3','ec2','terraform','ci/cd','github actions','jenkins','vercel','render','heroku'], found: [] },
    databases: { keywords: ['sql','postgresql','mysql','mongodb','redis','firebase','supabase','dynamodb','sqlite','elasticsearch'], found: [] },
    soft_skills: { keywords: ['leadership','communication','teamwork','problem solving','agile','scrum','management','mentoring','liderazgo','comunicación','trabajo en equipo','gestión'], found: [] },
  };

  const lower = text.toLowerCase();
  for (const [cat, config] of Object.entries(categories)) {
    config.found = config.keywords.filter(k => lower.includes(k));
  }

  return categories;
}

// Agente 2: Evaluador de experiencia
export function agentEvaluateExperience(cvText) {
  const lower = cvText.toLowerCase();

  // Detectar anos de experiencia
  const yearPatterns = [
    /(\d+)\+?\s*(?:years?|años?|anos?)\s*(?:of\s*)?(?:experience|experiencia)/gi,
    /(?:experience|experiencia)\s*(?:of\s*)?(\d+)\+?\s*(?:years?|años?|anos?)/gi,
    /(\d{4})\s*[-–]\s*(?:present|actual|current|(\d{4}))/gi,
  ];

  let maxYears = 0;
  yearPatterns.forEach(p => {
    const matches = [...cvText.matchAll(p)];
    matches.forEach(m => {
      const years = parseInt(m[1]);
      if (years > maxYears && years < 50) maxYears = years;
    });
  });

  // Detectar nivel de seniority
  const seniorPatterns = ['senior','lead','principal','architect','director','manager','head','chief','staff'];
  const midPatterns = ['mid','intermediate','regular','developer','engineer','analyst'];
  const juniorPatterns = ['junior','intern','trainee','entry','beginner','student','graduate'];

  const seniorScore = seniorPatterns.filter(p => lower.includes(p)).length;
  const midScore = midPatterns.filter(p => lower.includes(p)).length;
  const juniorScore = juniorPatterns.filter(p => lower.includes(p)).length;

  let level = 'mid';
  if (seniorScore > midScore && seniorScore > juniorScore) level = 'senior';
  else if (juniorScore > midScore) level = 'junior';

  // Detectar educacion
  const degrees = [];
  const degreePatterns = [
    /(?:bachelor|licenciatura|ingenier[ií]a|B\.?S\.?|B\.?A\.?)/gi,
    /(?:master|maestr[ií]a|M\.?S\.?|M\.?A\.?|MBA)/gi,
    /(?:phd|doctorado|ph\.?d\.?)/gi,
  ];
  degreePatterns.forEach((p, i) => {
    if (p.test(cvText)) degrees.push(['bachelor','master','phd'][i]);
  });

  return { maxYears, level, degrees, projectCount: (cvText.match(/(?:project|proyecto|built|developed|created|construí|desarrollé|desplegad|implementa|implemente|diseno|lidere)/gi) || []).length };
}

// Agente 3: Analizador de fit con el puesto
export function analyzeJobFit(jobSkills, cvSkills, jobText, cvText) {
  const fit = { matched: [], missing: [], bonus: [], score: 0 };

  const jobLower = jobText.toLowerCase();

  // Separar requerido vs deseable
  const reqSection = jobLower.split(/(?:deseable|nice to have|bonus|plus|desirable)/i);
  const reqText = reqSection[0] || jobLower;

  // Revisar cada categoria
  for (const [cat, config] of Object.entries(jobSkills)) {
    config.found.forEach(skill => {
      const inCV = cvSkills[cat]?.found.includes(skill);
      if (inCV) {
        fit.matched.push({ skill, category: cat, required: reqText.includes(skill) });
      } else if (reqText.includes(skill)) {
        fit.missing.push({ skill, category: cat });
      }
    });
  }

  // Revisar habilidades extra en CV que no estan en el puesto
  for (const [cat, config] of Object.entries(cvSkills)) {
    config.found.forEach(skill => {
      if (!jobSkills[cat]?.found.includes(skill)) {
        fit.bonus.push({ skill, category: cat });
      }
    });
  }

  // Calcular score
  const totalRequired = fit.matched.filter(m => m.required).length + fit.missing.length;
  const matchedRequired = fit.matched.filter(m => m.required).length;
  const requiredScore = totalRequired > 0 ? (matchedRequired / totalRequired) * 70 : 35;
  const bonusScore = Math.min(fit.bonus.length * 3, 15);
  const matchedDesirableScore = Math.min(fit.matched.filter(m => !m.required).length * 5, 15);

  fit.score = Math.round(Math.min(100, requiredScore + bonusScore + matchedDesirableScore));

  return fit;
}

// Agente 4: Motor de recomendaciones
export function generateRecommendation(fit, experience, lang) {
  const { score, matched, missing, bonus } = fit;
  const { level, maxYears } = experience;

  let verdict, nextStep, interviewQ;

  if (lang === 'es') {
    if (score >= 80) {
      verdict = `Candidato fuerte (${score}/100). ${matched.length} habilidades clave coinciden${bonus.length > 0 ? `, mas ${bonus.length} habilidades adicionales` : ''}.`;
      nextStep = 'Agendar entrevista tecnica prioritaria.';
      interviewQ = missing.length > 0
        ? `Como compensarias tu falta de experiencia en ${missing[0]?.skill}?`
        : `Describe tu proyecto mas complejo usando ${matched[0]?.skill}.`;
    } else if (score >= 50) {
      verdict = `Candidato parcial (${score}/100). Cumple ${matched.length} requisitos pero faltan ${missing.length} habilidades clave.`;
      nextStep = 'Evaluar si las habilidades faltantes son entrenables.';
      interviewQ = `Tienes experiencia indirecta con ${missing.slice(0,2).map(m=>m.skill).join(' o ')}?`;
    } else {
      verdict = `No recomendado (${score}/100). Solo cumple ${matched.length} de los requisitos.`;
      nextStep = 'Considerar para otros roles o posiciones junior.';
      interviewQ = `Que te motiva a aplicar a este puesto sin experiencia en ${missing.slice(0,2).map(m=>m.skill).join(', ')}?`;
    }
  } else {
    if (score >= 80) {
      verdict = `Strong candidate (${score}/100). ${matched.length} key skills matched${bonus.length > 0 ? `, plus ${bonus.length} additional skills` : ''}.`;
      nextStep = 'Schedule priority technical interview.';
      interviewQ = missing.length > 0
        ? `How would you compensate for your lack of experience in ${missing[0]?.skill}?`
        : `Describe your most complex project using ${matched[0]?.skill}.`;
    } else if (score >= 50) {
      verdict = `Partial match (${score}/100). Meets ${matched.length} requirements but missing ${missing.length} key skills.`;
      nextStep = 'Evaluate if missing skills are trainable.';
      interviewQ = `Do you have indirect experience with ${missing.slice(0,2).map(m=>m.skill).join(' or ')}?`;
    } else {
      verdict = `Not recommended (${score}/100). Only meets ${matched.length} requirements.`;
      nextStep = 'Consider for other roles or junior positions.';
      interviewQ = `What motivates you to apply without experience in ${missing.slice(0,2).map(m=>m.skill).join(', ')}?`;
    }
  }

  // Anotacion bonus por experiencia
  if (level === 'senior' && maxYears >= 5 && score >= 50) {
    verdict += lang === 'es' ? ` Nivel senior con ${maxYears}+ anos.` : ` Senior level with ${maxYears}+ years.`;
  }

  return { verdict, nextStep, interviewQuestion: interviewQ, strengths: matched.map(m => m.skill), gaps: missing.map(m => m.skill) };
}

// Orquestador: ejecuta el pipeline de 4 agentes y devuelve forma compatible con UI
export function agenticAnalyze(jobDesc, cvText, candidateName, lang) {
  const jobSkills = extractSkills(jobDesc);
  const cvSkills = extractSkills(cvText);
  const experience = agentEvaluateExperience(cvText);
  const fit = analyzeJobFit(jobSkills, cvSkills, jobDesc, cvText);
  const recommendation = generateRecommendation(fit, experience, lang);

  // Bonus de experiencia al score
  let finalScore = fit.score;
  if (experience.maxYears >= 5) finalScore = Math.min(100, finalScore + 5);
  if (experience.maxYears >= 3) finalScore = Math.min(100, finalScore + 3);
  if (experience.degrees.includes('master') || experience.degrees.includes('phd')) finalScore = Math.min(100, finalScore + 4);
  finalScore = Math.max(5, Math.min(98, finalScore));

  // Extraer titulo de la primera linea del CV
  const firstLine = cvText.split("\n")[0] || "";
  const titulo = (firstLine.split("|")[0] || firstLine).trim();
  const displayTitle = titulo.length > 45 ? titulo.substring(0, 42) + "..." : titulo;

  // Mapear fortalezas a nombres de display
  const habilidades = recommendation.strengths
    .map(s => SKILLS_DISPLAY[s] || s.charAt(0).toUpperCase() + s.slice(1))
    .filter((v, i, arr) => arr.indexOf(v) === i)
    .slice(0, 5);
  if (habilidades.length === 0) habilidades.push("Generales");

  // Construir fortalezas en espanol para UI
  const fortalezas = [];
  if (recommendation.strengths.length > 0) {
    fortalezas.push(`${recommendation.strengths.length} habilidades clave coinciden con el puesto: ${habilidades.slice(0, 3).join(', ')}`);
  }
  if (experience.maxYears > 0) {
    fortalezas.push(`${experience.maxYears} anos de experiencia detectados, nivel ${experience.level}`);
  }
  if (experience.degrees.length > 0) {
    fortalezas.push(`Formacion academica: ${experience.degrees.join(', ')}`);
  }
  if (experience.projectCount > 0) {
    fortalezas.push(`${experience.projectCount} proyectos/logros mencionados en el CV`);
  }
  if (fit.bonus.length > 0) {
    fortalezas.push(`${fit.bonus.length} habilidades adicionales relevantes fuera del requerimiento`);
  }
  if (fortalezas.length < 2) {
    fortalezas.push("Perfil con potencial de desarrollo en el area requerida");
  }

  // Construir brechas
  const brechas = [];
  for (const gap of recommendation.gaps.slice(0, 3)) {
    const display = SKILLS_DISPLAY[gap] || gap.charAt(0).toUpperCase() + gap.slice(1);
    brechas.push(`Falta competencia requerida: ${display}`);
  }
  if (experience.maxYears === 0) {
    brechas.push("No se detecta experiencia profesional especifica");
  }
  if (brechas.length === 0) {
    brechas.push("Podria requerir onboarding en procesos internos especificos");
  }

  // Traza del pipeline para UI
  const pipeline = [
    { agent: 'Skill Extractor', skills: Object.entries(cvSkills).map(([k,v]) => `${k}: ${v.found.length}`).join(', ') },
    { agent: 'Experience Evaluator', level: experience.level, years: experience.maxYears },
    { agent: 'Job Fit Analyzer', matched: fit.matched.length, missing: fit.missing.length, bonus: fit.bonus.length },
    { agent: 'Recommendation Engine', score: finalScore },
  ];

  return {
    score: finalScore,
    titulo: displayTitle,
    experiencia_anos: experience.maxYears,
    habilidades_clave: habilidades,
    fortalezas: fortalezas.slice(0, 4),
    brechas: brechas.slice(0, 3),
    veredicto: recommendation.verdict,
    siguiente_paso: recommendation.nextStep,
    pregunta_entrevista: recommendation.interviewQuestion,
    matched_keywords: recommendation.strengths,
    unmatched_keywords: recommendation.gaps,
    analysisMode: 'agentic',
    pipeline,
  };
}
