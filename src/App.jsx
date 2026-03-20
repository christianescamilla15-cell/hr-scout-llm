import { useState, useRef, useEffect, useCallback } from "react";

// ─── CVs MOCK ─────────────────────────────────────────────────────────────────
const SAMPLE_CVS = [
  {
    id: 1, name: "Andrea Martinez Lopez",
    cv: `Ingeniera en Sistemas | 5 anos de experiencia
Experiencia: Desarrolladora Senior en Fintech CDMX (2021-2026). Lidere equipo de 4 personas.
Stack: React, Node.js, Python, PostgreSQL, AWS, Docker.
Logros: Reduje tiempo de deploy en 60%. Implemente CI/CD que aumento productividad 40%.
Educacion: Ingenieria en Sistemas - UNAM 2020. Certificacion AWS Solutions Architect.
Idiomas: Espanol nativo, Ingles C1. Disponible para trabajo remoto e hibrido.`
  },
  {
    id: 2, name: "Carlos Rodriguez Vega",
    cv: `Desarrollador Full Stack Jr | 1 ano de experiencia
Recien egresado bootcamp. Manejo basico de HTML, CSS, JavaScript.
Proyectos personales en React. Sin experiencia profesional formal.
Educacion: Preparatoria + Bootcamp 3 meses.
Idiomas: Solo espanol.`
  },
  {
    id: 3, name: "Sofia Hernandez Castro",
    cv: `Product Manager con enfoque en IA | 4 anos de experiencia
Gestione productos de IA en startup SaaS B2B (2022-2026). 3 lanzamientos exitosos.
Experiencia con Claude API, GPT-4, automatizaciones con Make.com y n8n.
Certificaciones: Product Management - Reforge, IA Aplicada - DeepLearning.AI.
Educacion: Administracion de Empresas - Tec de Monterrey.
Ingles B2, disponible inmediatamente.`
  },
  {
    id: 4, name: "Miguel Angel Torres",
    cv: `Data Scientist | 3 anos de experiencia
Analisis de datos y ML en empresa de retail. Python (Pandas, Scikit-learn, TensorFlow).
Modelos predictivos para forecasting de ventas con 87% de precision.
Educacion: Maestria en Ciencia de Datos - ITAM 2023.
Ingles C1, certificacion Google Cloud Professional Data Engineer.
Disponible en 2 semanas.`
  },
  {
    id: 5, name: "Valentina Cruz Morales",
    cv: `Especialista en Marketing Digital | 6 anos de experiencia
Lidere estrategia digital de marca con 2M+ seguidores. ROI promedio 340%.
Experiencia con IA generativa para contenido: Midjourney, DALL-E, ChatGPT.
Automatizaciones en Zapier y Make.com. Manejo de HubSpot CRM.
Educacion: Comunicacion - Iberoamericana. Certificacion Google Ads, Meta Blueprint.
Ingles C2, disponible de inmediato.`
  },
  {
    id: 6, name: "Roberto Jimenez Soto",
    cv: `Contador Publico | 10 anos de experiencia
Contabilidad tradicional en despacho contable. Excel avanzado.
Sin experiencia en tecnologia moderna ni herramientas digitales.
Educacion: Contaduria - Universidad Anahuac.
Espanol unicamente.`
  },
  {
    id: 7, name: "Daniela Fuentes Reyes",
    cv: `Ingenieria de IA & Automatizacion | 3 anos de experiencia
Diseno e implementacion de agentes IA y workflows automatizados en n8n y Make.com.
Integracion de Claude API, GPT-4o y LangChain en productos B2B.
Prompt engineering avanzado. Python para scripting y analisis de datos.
Educacion: Ingenieria en TI - IPN 2022. DeepLearning.AI certificada.
Ingles B2. Portfolio con 8 proyectos desplegados en produccion.`
  },
  {
    id: 8, name: "Fernando Acosta Navarro",
    cv: `UX/UI Designer | 4 anos de experiencia
Diseno de interfaces para apps moviles y web. Figma, Adobe XD.
Experiencia con IA para generacion de mockups (Midjourney, Stable Diffusion).
Investigacion de usuarios, pruebas de usabilidad, Design Systems.
Educacion: Diseno Grafico - Universidad Iberoamericana.
Ingles B1. Portafolio disponible.`
  },
];

// ─── PRESET JOB DESCRIPTIONS ────────────────────────────────────────────────
const PRESET_JOBS = {
  "": "",
  "Especialista en IA": `Especialista en IA & Automatizacion
Buscamos profesional con experiencia en:
- Implementacion de agentes IA y workflows automatizados (Make.com, n8n, Zapier)
- Prompt engineering avanzado con Claude, GPT-4o y Gemini
- Python basico/intermedio para scripting y automatizacion
- Integracion de APIs y Webhooks
- Ingles intermedio minimo (B2)
- Capacidad para trabajar en equipo y comunicar conceptos tecnicos a perfiles no tecnicos
Indispensable: experiencia con LLMs, automatizacion de procesos
Deseable: experiencia en startups, certificaciones en IA, portafolio de proyectos.`,
  "Desarrollador Frontend": `Desarrollador Frontend Senior
Requerimos desarrollador con experiencia en:
- React 18+, TypeScript, Next.js
- HTML5, CSS3, Responsive Design, Tailwind CSS
- Testing con Jest, React Testing Library
- Git, CI/CD, Vercel o Netlify
- Consumo de APIs REST y GraphQL
- Experiencia con Design Systems y componentes reutilizables
Indispensable: React avanzado, 3+ anos de experiencia, ingles B2
Deseable: experiencia con IA generativa, Figma, accesibilidad web.`,
  "Product Manager": `Product Manager Senior
Buscamos PM con experiencia en:
- Gestion de productos digitales B2B/SaaS
- Roadmapping, backlog management, OKRs
- Metodologias agiles (Scrum, Kanban)
- Analisis de datos y metricas de producto (retention, churn, NPS)
- Coordinacion con equipos de ingenieria y diseno
- Herramientas: Jira, Notion, Amplitude, Mixpanel
Requerido: 3+ anos como PM, ingles avanzado, experiencia con equipos remotos
Deseable: experiencia con productos de IA, certificacion en product management.`,
  "Data Scientist": `Data Scientist
Requisitos del puesto:
- Python avanzado (Pandas, NumPy, Scikit-learn, TensorFlow/PyTorch)
- SQL avanzado, experiencia con data warehouses
- Machine Learning: modelos supervisados, no supervisados, NLP
- Visualizacion de datos: Matplotlib, Seaborn, Tableau, Power BI
- Estadistica inferencial y experimental (A/B testing)
- Cloud: AWS SageMaker, Google Cloud AI Platform o Azure ML
Indispensable: maestria en area cuantitativa, Python avanzado, ingles C1
Deseable: publicaciones, experiencia con LLMs, Spark/Databricks.`,
  "Marketing Digital": `Especialista en Marketing Digital
Buscamos profesional con experiencia en:
- Estrategia de contenido y social media (Instagram, TikTok, LinkedIn)
- Campanas de ads: Google Ads, Meta Ads, TikTok Ads
- SEO/SEM y analisis web (Google Analytics, Search Console)
- Email marketing y automatizacion (HubSpot, Mailchimp, ActiveCampaign)
- IA generativa para contenido (ChatGPT, Midjourney, Canva AI)
- Analisis de metricas: ROI, CTR, CPA, LTV
Requerido: 3+ anos de experiencia, portafolio de campanas, ingles B2
Deseable: certificaciones Google/Meta, experiencia con CRM, video marketing.`,
};

// ─── SYNONYM MAP ─────────────────────────────────────────────────────────────
const SYNONYMS = {
  "javascript": ["js", "javascript", "ecmascript"],
  "js": ["js", "javascript", "ecmascript"],
  "typescript": ["ts", "typescript"],
  "ts": ["ts", "typescript"],
  "inteligencia artificial": ["ia", "inteligencia artificial", "artificial intelligence", "ai", "machine learning", "ml"],
  "ia": ["ia", "inteligencia artificial", "artificial intelligence", "ai"],
  "ai": ["ia", "inteligencia artificial", "artificial intelligence", "ai"],
  "machine learning": ["machine learning", "ml", "aprendizaje automatico", "deep learning", "dl"],
  "ml": ["machine learning", "ml", "aprendizaje automatico"],
  "python": ["python", "py"],
  "react": ["react", "reactjs", "react.js"],
  "node": ["node", "nodejs", "node.js"],
  "nodejs": ["node", "nodejs", "node.js"],
  "node.js": ["node", "nodejs", "node.js"],
  "css": ["css", "css3", "tailwind", "tailwindcss"],
  "html": ["html", "html5"],
  "automatizacion": ["automatizacion", "automation", "automatizar"],
  "api": ["api", "apis", "rest", "restful", "graphql"],
  "base de datos": ["base de datos", "sql", "postgresql", "mysql", "mongodb", "database"],
  "sql": ["sql", "postgresql", "mysql", "sqlite"],
  "aws": ["aws", "amazon web services", "cloud"],
  "gcp": ["gcp", "google cloud", "google cloud platform"],
  "azure": ["azure", "microsoft azure"],
  "docker": ["docker", "contenedores", "containers", "kubernetes", "k8s"],
  "figma": ["figma", "adobe xd", "sketch"],
  "ingles": ["ingles", "english", "idioma"],
  "liderazgo": ["liderazgo", "liderar", "lidere", "lider", "equipo", "gestion"],
  "scrum": ["scrum", "agile", "agil", "kanban", "metodologias agiles"],
  "testing": ["testing", "test", "jest", "cypress", "qa", "pruebas"],
  "git": ["git", "github", "gitlab", "version control"],
  "ci/cd": ["ci/cd", "cicd", "deploy", "deployment", "devops", "pipeline"],
  "prompt engineering": ["prompt engineering", "prompt", "prompting"],
  "make.com": ["make.com", "make", "integromat"],
  "n8n": ["n8n"],
  "zapier": ["zapier"],
  "hubspot": ["hubspot", "crm"],
  "tableau": ["tableau", "power bi", "powerbi", "visualizacion"],
  "tensorflow": ["tensorflow", "tf", "keras", "pytorch", "torch"],
  "langchain": ["langchain", "lang chain"],
  "claude": ["claude", "claude api", "anthropic"],
  "gpt": ["gpt", "gpt-4", "gpt-4o", "openai", "chatgpt"],
  "seo": ["seo", "sem", "posicionamiento", "search engine"],
  "google ads": ["google ads", "adwords", "sem", "ppc"],
  "meta ads": ["meta ads", "facebook ads", "instagram ads"],
};

// ─── NORMALIZE TEXT (remove accents, lowercase) ─────────────────────────────
function normalize(text) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s.\/\-+#]/g, " ");
}

// ─── EXTRACT KEYWORDS FROM JOB DESCRIPTION ──────────────────────────────────
function extractKeywords(jobDesc) {
  const norm = normalize(jobDesc);
  const lines = norm.split(/[\n,;]+/).map(l => l.trim()).filter(Boolean);

  const keywords = [];
  const requiredKeywords = new Set();
  let inRequiredSection = false;

  for (const line of lines) {
    // Detect required sections
    if (/indispensable|requerido|requisito|obligatorio|necesario/.test(line)) {
      inRequiredSection = true;
    }
    if (/deseable|plus|valorable|preferible|opcional/.test(line)) {
      inRequiredSection = false;
    }

    // Extract multi-word terms we know about
    const knownTerms = Object.keys(SYNONYMS);
    for (const term of knownTerms) {
      if (line.includes(term) && !keywords.includes(term)) {
        keywords.push(term);
        if (inRequiredSection) requiredKeywords.add(term);
      }
    }

    // Also extract standalone words that look like skills
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

  // If no keywords extracted, fallback: grab known terms from the whole text
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

// ─── MATCH KEYWORDS AGAINST CV ──────────────────────────────────────────────
function matchKeywords(cvText, keywords, requiredKeywords) {
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

  // Weighted score: required keywords count 2x
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

// ─── EXTRACT EXPERIENCE YEARS ───────────────────────────────────────────────
function extractExperienceYears(cvText) {
  const patterns = [
    /(\d+)\s*a[nñ]os?\s*de\s*experiencia/i,
    /(\d+)\s*years?\s*(?:of\s*)?experience/i,
    /experiencia[:\s]*(\d+)\s*a[nñ]os?/i,
  ];
  for (const pat of patterns) {
    const m = cvText.match(pat);
    if (m) return parseInt(m[1]);
  }
  // Fallback: count date ranges
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

// ─── EXTRACT REQUIRED YEARS FROM JOB ────────────────────────────────────────
function extractRequiredYears(jobDesc) {
  const m = jobDesc.match(/(\d+)\+?\s*a[nñ]os?\s*(?:de\s*)?experiencia/i)
    || jobDesc.match(/(\d+)\+?\s*years/i);
  return m ? parseInt(m[1]) : 2;
}

// ─── DETECT EDUCATION ───────────────────────────────────────────────────────
function detectEducation(cvText) {
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

// ─── DETECT LANGUAGES ───────────────────────────────────────────────────────
function detectLanguages(cvText) {
  const norm = normalize(cvText);
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

// ─── SKILLS MAP FOR DISPLAY ─────────────────────────────────────────────────
const SKILLS_DISPLAY = {
  "react": "React", "node": "Node.js", "nodejs": "Node.js", "node.js": "Node.js",
  "python": "Python", "claude": "Claude API", "gpt": "GPT-4",
  "make.com": "Make.com", "n8n": "n8n", "zapier": "Zapier",
  "aws": "AWS", "docker": "Docker", "figma": "Figma", "langchain": "LangChain",
  "tensorflow": "TensorFlow", "hubspot": "HubSpot", "typescript": "TypeScript",
  "ts": "TypeScript", "javascript": "JavaScript", "js": "JavaScript",
  "sql": "SQL", "html": "HTML", "css": "CSS", "git": "Git",
  "ci/cd": "CI/CD", "testing": "Testing", "scrum": "Scrum/Agile",
  "seo": "SEO", "google ads": "Google Ads", "meta ads": "Meta Ads",
  "tableau": "Tableau/BI", "machine learning": "Machine Learning",
  "ml": "Machine Learning", "ia": "IA", "inteligencia artificial": "IA",
  "automatizacion": "Automatizacion", "api": "APIs", "liderazgo": "Liderazgo",
  "ingles": "Ingles", "prompt engineering": "Prompt Engineering",
  "base de datos": "Bases de datos", "azure": "Azure", "gcp": "GCP",
};

// ─── REAL CV ANALYSIS ENGINE ────────────────────────────────────────────────
function analyzeCV(cvText, jobDescription) {
  const { keywords, requiredKeywords } = extractKeywords(jobDescription);
  const { matched, unmatched, keywordScore } = matchKeywords(cvText, keywords, requiredKeywords);
  const experienceYears = extractExperienceYears(cvText);
  const requiredYears = extractRequiredYears(jobDescription);
  const education = detectEducation(cvText);
  const languages = detectLanguages(cvText);

  // --- Score calculation ---
  // Keyword match: 70%
  let score = keywordScore * 70;

  // Experience bonus: up to 12 pts
  if (experienceYears >= requiredYears) {
    score += 12;
  } else if (experienceYears > 0) {
    score += Math.round((experienceYears / requiredYears) * 12);
  }

  // Education bonus: up to 8 pts
  if (education.level >= 3) score += 8;
  else if (education.level >= 2) score += 6;
  else if (education.level >= 1) score += 3;
  // Extra for certs
  score += Math.min(4, education.certifications.length * 2);

  // Language bonus: up to 6 pts
  const engLang = languages.find(l => l.lang === "Ingles");
  if (engLang) {
    if (engLang.score >= 5) score += 6;
    else if (engLang.score >= 4) score += 4;
    else if (engLang.score >= 3) score += 2;
  }

  score = Math.min(98, Math.max(5, Math.round(score)));

  // --- Extract title ---
  const firstLine = cvText.split("\n")[0] || "";
  const titulo = (firstLine.split("|")[0] || firstLine).trim();
  const displayTitle = titulo.length > 45 ? titulo.substring(0, 42) + "..." : titulo;

  // --- Skills display ---
  const habilidades = matched
    .map(k => SKILLS_DISPLAY[k] || k)
    .filter((v, i, arr) => arr.indexOf(v) === i)
    .slice(0, 5);
  if (habilidades.length === 0) habilidades.push("Generales");

  // --- Strengths (with references to CV text) ---
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

  // --- Gaps (required skills not found) ---
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

  // --- Verdict ---
  let veredicto, siguiente_paso, pregunta_entrevista;
  const firstName = (cvText.match(/^([A-Z][a-z]+)/m) || ["", "El candidato"])[1] || "Candidato";

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

// ─── COMPARATIVE ANALYSIS ───────────────────────────────────────────────────
function generateComparativeAnalysis(candidates, results, jobDesc) {
  const analyzed = candidates.filter(c => results[c.id]);
  if (analyzed.length < 2) return null;

  const sorted = [...analyzed].sort((a, b) => (results[b.id]?.score || 0) - (results[a.id]?.score || 0));
  const best = sorted[0];
  const bestResult = results[best.id];

  // Best candidate explanation
  const bestExplanation = `${best.name} obtiene el mayor puntaje (${bestResult.score}/100) con ${bestResult.habilidades_clave.length} habilidades clave detectadas y ${bestResult.experiencia_anos} anos de experiencia.`;

  // Common gaps
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

  // Skills heatmap
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

// ─── BADGE DE SCORE ───────────────────────────────────────────────────────────
function ScoreBadge({ score }) {
  const color = score >= 80 ? "#10B981" : score >= 60 ? "#F59E0B" : "#EF4444";
  const label = score >= 80 ? "Apto" : score >= 60 ? "Revisar" : "No apto";
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{
        width: 52, height: 52, borderRadius: "50%",
        border: `3px solid ${color}`,
        display: "flex", alignItems: "center", justifyContent: "center",
        background: `${color}12`,
        fontSize: 15, fontWeight: 800, color,
        fontFamily: "'DM Mono', monospace",
        boxShadow: `0 0 12px ${color}30`,
      }}>
        {score}
      </div>
      <span style={{ fontSize: 9, color, fontFamily: "'DM Mono', monospace", letterSpacing: "0.08em", display: "block", marginTop: 3 }}>
        {label}
      </span>
    </div>
  );
}

// ─── CANDIDATE CARD ───────────────────────────────────────────────────────────
function CandidateCard({ candidate, rank, onAnalyze, analyzing, result, globalAnalyzing, cardRef, onRemove, isCustom }) {
  const [expanded, setExpanded] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [justFinished, setJustFinished] = useState(false);
  const prevResult = useRef(null);
  const rankColors = ["#F59E0B", "#94A3B8", "#CD7F32"];

  useEffect(() => {
    if (result && !prevResult.current) {
      setJustFinished(true);
      const t = setTimeout(() => setJustFinished(false), 1500);
      return () => clearTimeout(t);
    }
    prevResult.current = result;
  }, [result]);

  return (
    <div
      ref={cardRef}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: result ? "rgba(16,185,129,0.04)" : "rgba(255,255,255,0.03)",
        border: `1px solid ${analyzing ? "rgba(99,102,241,0.4)" : result ? "rgba(16,185,129,0.2)" : "rgba(255,255,255,0.07)"}`,
        borderRadius: 12, marginBottom: 10, overflow: "hidden",
        animation: "fadeUp 0.4s ease",
        transition: "all 0.4s cubic-bezier(0.4,0,0.2,1)",
        transform: hovered ? "translateY(-2px)" : "translateY(0)",
        boxShadow: hovered ? "0 8px 24px rgba(0,0,0,0.2)" : analyzing ? "0 0 20px rgba(99,102,241,0.15)" : "none",
      }}
    >
      {/* Header */}
      <div style={{ display: "grid", gridTemplateColumns: "32px 52px 1fr auto auto", alignItems: "center", gap: 14, padding: "14px 18px" }}>
        {/* Rank */}
        <div style={{
          width: 28, height: 28, borderRadius: "50%",
          background: rank <= 3 ? `${rankColors[rank - 1]}20` : "rgba(255,255,255,0.05)",
          border: `1px solid ${rank <= 3 ? rankColors[rank - 1] : "rgba(255,255,255,0.1)"}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 11, fontWeight: 800, color: rank <= 3 ? rankColors[rank - 1] : "rgba(255,255,255,0.3)",
          fontFamily: "'DM Mono', monospace",
          transition: "all 0.4s ease",
        }}>
          {rank}
        </div>

        {/* Score */}
        {result ? <ScoreBadge score={result.score} /> : (
          <div style={{
            width: 52, height: 52, borderRadius: "50%",
            border: "2px dashed rgba(255,255,255,0.1)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 18,
          }}>
            {analyzing ? (
              <div style={{ width: 20, height: 20, borderRadius: "50%", border: "2px solid rgba(99,102,241,0.3)", borderTop: "2px solid #6366F1", animation: "spin 1s linear infinite" }} />
            ) : "?"}
          </div>
        )}

        {/* Info */}
        <div>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "#F1F5F9", display: "flex", alignItems: "center", gap: 8 }}>
            {candidate.name}
            {isCustom && (
              <span style={{ fontSize: 9, padding: "1px 5px", borderRadius: 3, background: "rgba(245,158,11,0.15)", border: "1px solid rgba(245,158,11,0.3)", color: "#F59E0B", fontFamily: "'DM Mono', monospace" }}>CUSTOM</span>
            )}
            {justFinished && (
              <span style={{ fontSize: 16, animation: "checkPop 0.5s ease" }}>
                &#10003;
              </span>
            )}
          </p>
          {result && (
            <p style={{ margin: "3px 0 0", fontSize: 11, color: "rgba(255,255,255,0.4)" }}>
              {result.titulo} &middot; {result.experiencia_anos} anos exp.
            </p>
          )}
          {!result && (
            <p style={{ margin: "3px 0 0", fontSize: 11, color: analyzing ? "#818CF8" : "rgba(255,255,255,0.3)", fontStyle: "italic" }}>
              {analyzing ? "Analizando con IA..." : "Sin analizar"}
            </p>
          )}
        </div>

        {/* Tags */}
        {result && (
          <div style={{ display: "flex", gap: 5, flexWrap: "wrap", maxWidth: 200 }}>
            {result.habilidades_clave?.slice(0, 3).map((h, i) => (
              <span key={i} style={{
                fontSize: 10, padding: "2px 7px", borderRadius: 4,
                background: "rgba(99,102,241,0.12)",
                border: "1px solid rgba(99,102,241,0.2)",
                color: "#A5B4FC", fontFamily: "'DM Mono', monospace",
              }}>{h}</span>
            ))}
          </div>
        )}

        {/* Actions */}
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {result && (
            <button onClick={() => setExpanded(v => !v)} style={{
              background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 6, padding: "5px 10px", cursor: "pointer",
              fontSize: 11, color: "rgba(255,255,255,0.5)",
              fontFamily: "'DM Sans', sans-serif",
              transition: "all 0.15s",
            }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.1)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
            >
              {expanded ? "Cerrar" : "Ver analisis"}
            </button>
          )}
          <button
            onClick={() => onAnalyze(candidate)}
            disabled={analyzing || globalAnalyzing}
            style={{
              background: (analyzing || globalAnalyzing) ? "rgba(255,255,255,0.04)" : "rgba(99,102,241,0.12)",
              border: `1px solid ${(analyzing || globalAnalyzing) ? "rgba(255,255,255,0.08)" : "rgba(99,102,241,0.3)"}`,
              borderRadius: 6, padding: "5px 12px", cursor: (analyzing || globalAnalyzing) ? "default" : "pointer",
              fontSize: 11, color: (analyzing || globalAnalyzing) ? "rgba(255,255,255,0.3)" : "#A5B4FC",
              fontFamily: "'DM Sans', sans-serif", transition: "all 0.15s",
            }}
            onMouseEnter={e => { if (!analyzing && !globalAnalyzing) e.currentTarget.style.background = "rgba(99,102,241,0.22)"; }}
            onMouseLeave={e => { if (!analyzing && !globalAnalyzing) e.currentTarget.style.background = "rgba(99,102,241,0.12)"; }}
          >
            {analyzing ? "Analizando..." : result ? "Re-analizar" : "Analizar IA"}
          </button>
          {isCustom && (
            <button
              onClick={() => onRemove(candidate.id)}
              title="Eliminar candidato"
              style={{
                background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)",
                borderRadius: 6, padding: "5px 8px", cursor: "pointer",
                fontSize: 12, color: "#EF4444", fontFamily: "'DM Sans', sans-serif",
                transition: "all 0.15s", lineHeight: 1,
              }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(239,68,68,0.2)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "rgba(239,68,68,0.08)"; }}
            >
              &#10005;
            </button>
          )}
        </div>
      </div>

      {/* Expanded Analysis */}
      {expanded && result && (
        <div style={{
          padding: "0 18px 18px",
          borderTop: "1px solid rgba(255,255,255,0.06)",
          animation: "fadeUp 0.3s ease",
        }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginTop: 14 }}>
            {/* Fortalezas */}
            <div style={{ background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.15)", borderRadius: 8, padding: 12 }}>
              <p style={{ margin: "0 0 8px", fontSize: 10, fontWeight: 700, color: "#10B981", letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "'DM Mono', monospace" }}>&#10003; Fortalezas</p>
              {result.fortalezas?.map((f, i) => (
                <p key={i} style={{ margin: "0 0 4px", fontSize: 11, color: "#D1FAE5", lineHeight: 1.5 }}>&#8226; {f}</p>
              ))}
            </div>
            {/* Debilidades */}
            <div style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)", borderRadius: 8, padding: 12 }}>
              <p style={{ margin: "0 0 8px", fontSize: 10, fontWeight: 700, color: "#EF4444", letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "'DM Mono', monospace" }}>&#10007; Brechas</p>
              {result.brechas?.map((b, i) => (
                <p key={i} style={{ margin: "0 0 4px", fontSize: 11, color: "#FEE2E2", lineHeight: 1.5 }}>&#8226; {b}</p>
              ))}
            </div>
            {/* Veredicto */}
            <div style={{ background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.15)", borderRadius: 8, padding: 12 }}>
              <p style={{ margin: "0 0 8px", fontSize: 10, fontWeight: 700, color: "#818CF8", letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "'DM Mono', monospace" }}>Veredicto</p>
              <p style={{ margin: "0 0 6px", fontSize: 11, color: "#E0E7FF", lineHeight: 1.5 }}>{result.veredicto}</p>
              <p style={{ margin: 0, fontSize: 10, color: "rgba(255,255,255,0.4)", fontStyle: "italic" }}>
                {result.siguiente_paso}
              </p>
            </div>
          </div>

          {/* Pregunta de entrevista */}
          {result.pregunta_entrevista && (
            <div style={{ marginTop: 10, padding: "10px 14px", background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.15)", borderRadius: 8 }}>
              <span style={{ fontSize: 10, color: "#F59E0B", fontWeight: 700, fontFamily: "'DM Mono', monospace" }}>PREGUNTA CLAVE PARA ENTREVISTA: </span>
              <span style={{ fontSize: 11, color: "#FEF3C7" }}>{result.pregunta_entrevista}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── ADD CANDIDATE MODAL ────────────────────────────────────────────────────
function AddCandidateModal({ onAdd, onClose }) {
  const [name, setName] = useState("");
  const [cvText, setCvText] = useState("");
  const [mode, setMode] = useState("paste"); // "paste" | "file"
  const fileRef = useRef(null);

  const isValid = name.trim().length >= 2 && cvText.trim().length >= 50;

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setCvText(ev.target?.result || "");
    };
    reader.readAsText(file);
  };

  const handleSubmit = () => {
    if (!isValid) return;
    onAdd({ name: name.trim(), cv: cvText.trim() });
    onClose();
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 1000,
      background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      animation: "fadeUp 0.2s ease",
    }} onClick={onClose}>
      <div style={{
        background: "#12131A", border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 16, padding: 28, width: "90%", maxWidth: 520,
        boxShadow: "0 24px 48px rgba(0,0,0,0.5)",
      }} onClick={e => e.stopPropagation()}>
        <h3 style={{ margin: "0 0 4px", fontSize: 18, fontWeight: 700, color: "#F8FAFC" }}>
          Agregar Candidato
        </h3>
        <p style={{ margin: "0 0 18px", fontSize: 12, color: "rgba(255,255,255,0.4)" }}>
          Agrega un CV personalizado para analizar contra la descripcion del puesto
        </p>

        {/* Name */}
        <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)", fontFamily: "'DM Mono', monospace" }}>
          Nombre del candidato
        </label>
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Ej: Maria Garcia Lopez"
          style={{
            width: "100%", marginTop: 4, marginBottom: 14, padding: "10px 12px",
            background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 8, color: "#D1D5DB", fontSize: 13,
            fontFamily: "'DM Sans', sans-serif", outline: "none",
          }}
        />

        {/* Mode toggle */}
        <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
          <button onClick={() => setMode("paste")} style={{
            padding: "5px 14px", borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: "pointer",
            background: mode === "paste" ? "rgba(99,102,241,0.2)" : "rgba(255,255,255,0.04)",
            border: `1px solid ${mode === "paste" ? "rgba(99,102,241,0.4)" : "rgba(255,255,255,0.08)"}`,
            color: mode === "paste" ? "#A5B4FC" : "rgba(255,255,255,0.4)",
            fontFamily: "'DM Sans', sans-serif",
          }}>
            Pegar texto
          </button>
          <button onClick={() => setMode("file")} style={{
            padding: "5px 14px", borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: "pointer",
            background: mode === "file" ? "rgba(99,102,241,0.2)" : "rgba(255,255,255,0.04)",
            border: `1px solid ${mode === "file" ? "rgba(99,102,241,0.4)" : "rgba(255,255,255,0.08)"}`,
            color: mode === "file" ? "#A5B4FC" : "rgba(255,255,255,0.4)",
            fontFamily: "'DM Sans', sans-serif",
          }}>
            Subir archivo .txt
          </button>
        </div>

        {mode === "paste" ? (
          <>
            <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)", fontFamily: "'DM Mono', monospace" }}>
              Texto del CV
            </label>
            <textarea
              value={cvText}
              onChange={e => setCvText(e.target.value)}
              placeholder={"Pega aqui el contenido del CV...\n\nEj:\nIngeniero en Software | 5 anos de experiencia\nStack: React, Python, AWS...\nEducacion: Licenciatura en...\nIdiomas: Ingles C1..."}
              rows={10}
              style={{
                width: "100%", marginTop: 4, padding: "10px 12px",
                background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 8, color: "#D1D5DB", fontSize: 12, lineHeight: 1.6,
                fontFamily: "'DM Sans', sans-serif", resize: "vertical", outline: "none",
              }}
            />
          </>
        ) : (
          <div style={{
            marginTop: 4, padding: 20, textAlign: "center",
            background: "rgba(255,255,255,0.03)", border: "2px dashed rgba(255,255,255,0.1)",
            borderRadius: 8, cursor: "pointer",
          }} onClick={() => fileRef.current?.click()}>
            <input ref={fileRef} type="file" accept=".txt,.text" onChange={handleFileUpload} style={{ display: "none" }} />
            <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.4)" }}>
              {cvText ? `Archivo cargado (${cvText.length} caracteres)` : "Haz clic para seleccionar un archivo .txt"}
            </p>
            {cvText && (
              <p style={{ margin: "6px 0 0", fontSize: 11, color: "#818CF8" }}>
                Vista previa: {cvText.substring(0, 80)}...
              </p>
            )}
          </div>
        )}

        <p style={{ margin: "6px 0 0", fontSize: 10, color: cvText.trim().length >= 50 ? "rgba(255,255,255,0.3)" : "#EF4444", fontFamily: "'DM Mono', monospace" }}>
          {cvText.trim().length}/50 caracteres minimo
        </p>

        {/* Buttons */}
        <div style={{ display: "flex", gap: 10, marginTop: 18, justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{
            padding: "10px 20px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer",
            background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
            color: "rgba(255,255,255,0.5)", fontFamily: "'DM Sans', sans-serif",
          }}>
            Cancelar
          </button>
          <button onClick={handleSubmit} disabled={!isValid} style={{
            padding: "10px 20px", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: isValid ? "pointer" : "default",
            background: isValid ? "linear-gradient(135deg, #6366F1, #4F46E5)" : "rgba(255,255,255,0.05)",
            border: "none",
            color: isValid ? "#fff" : "#6B7280", fontFamily: "'DM Sans', sans-serif",
            boxShadow: isValid ? "0 0 16px rgba(99,102,241,0.4)" : "none",
          }}>
            Agregar candidato
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── COMPARATIVE ANALYSIS PANEL ─────────────────────────────────────────────
function ComparativePanel({ analysis }) {
  if (!analysis) return null;

  return (
    <div style={{
      marginTop: 16, padding: 18,
      background: "rgba(99,102,241,0.04)", border: "1px solid rgba(99,102,241,0.15)",
      borderRadius: 12, animation: "fadeUp 0.4s ease",
    }}>
      <p style={{ margin: "0 0 14px", fontSize: 11, fontWeight: 700, color: "#818CF8", letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "'DM Mono', monospace" }}>
        Analisis Comparativo &middot; {analysis.totalAnalyzed} candidatos
      </p>

      {/* Best candidate */}
      <div style={{ padding: 12, background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.15)", borderRadius: 8, marginBottom: 12 }}>
        <p style={{ margin: "0 0 4px", fontSize: 10, fontWeight: 700, color: "#10B981", letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "'DM Mono', monospace" }}>
          Mejor Candidato
        </p>
        <p style={{ margin: 0, fontSize: 12, color: "#D1FAE5", lineHeight: 1.5 }}>
          {analysis.bestExplanation}
        </p>
      </div>

      {/* Common gaps */}
      {analysis.commonGaps.length > 0 && (
        <div style={{ padding: 12, background: "rgba(239,68,68,0.04)", border: "1px solid rgba(239,68,68,0.12)", borderRadius: 8, marginBottom: 12 }}>
          <p style={{ margin: "0 0 8px", fontSize: 10, fontWeight: 700, color: "#EF4444", letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "'DM Mono', monospace" }}>
            Brechas Comunes
          </p>
          {analysis.commonGaps.map((g, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
              <span style={{ fontSize: 11, color: "#FEE2E2" }}>{g.skill}</span>
              <span style={{ fontSize: 10, color: "#EF4444", fontFamily: "'DM Mono', monospace" }}>
                {g.count}/{analysis.totalAnalyzed} sin cubrir ({g.pct}%)
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Skills heatmap */}
      {analysis.heatmap.length > 0 && (
        <div style={{ padding: 12, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 8 }}>
          <p style={{ margin: "0 0 10px", fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.5)", letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "'DM Mono', monospace" }}>
            Cobertura de Habilidades
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {analysis.heatmap.map((h, i) => {
              const pct = h.covered / analysis.totalAnalyzed;
              const bg = pct >= 0.7 ? "rgba(16,185,129,0.15)" : pct >= 0.4 ? "rgba(245,158,11,0.15)" : "rgba(239,68,68,0.12)";
              const border2 = pct >= 0.7 ? "rgba(16,185,129,0.3)" : pct >= 0.4 ? "rgba(245,158,11,0.3)" : "rgba(239,68,68,0.25)";
              const color2 = pct >= 0.7 ? "#10B981" : pct >= 0.4 ? "#F59E0B" : "#EF4444";
              return (
                <div key={i} style={{
                  padding: "4px 10px", borderRadius: 6,
                  background: bg, border: `1px solid ${border2}`,
                  fontSize: 10, color: color2, fontFamily: "'DM Mono', monospace",
                  display: "flex", alignItems: "center", gap: 6,
                }} title={h.candidates.length > 0 ? `Cubierto por: ${h.candidates.join(", ")}` : "Sin cobertura"}>
                  <span>{h.skill}</span>
                  <span style={{ fontWeight: 800 }}>{h.covered}/{analysis.totalAnalyzed}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── GENERATE TEXT REPORT ─────────────────────────────────────────────────────
function generateReport(candidates, results, jobDesc) {
  const lines = [];
  lines.push("=== REPORTE DE ANALISIS DE CVs -- HRScout AI ===");
  lines.push(`Fecha: ${new Date().toLocaleDateString("es-MX")}`);
  lines.push("");
  lines.push("DESCRIPCION DEL PUESTO:");
  lines.push(jobDesc);
  lines.push("");
  lines.push("-".repeat(60));

  const sorted = [...candidates]
    .filter(c => results[c.id])
    .sort((a, b) => (results[b.id]?.score || 0) - (results[a.id]?.score || 0));

  sorted.forEach((c, i) => {
    const r = results[c.id];
    const label = r.score >= 80 ? "APTO" : r.score >= 60 ? "REVISAR" : "NO APTO";
    lines.push("");
    lines.push(`#${i + 1} -- ${c.name} [Score: ${r.score}/100 -- ${label}]`);
    lines.push(`   Titulo: ${r.titulo} | Experiencia: ${r.experiencia_anos} anos`);
    lines.push(`   Habilidades: ${r.habilidades_clave?.join(", ")}`);
    lines.push(`   Fortalezas: ${r.fortalezas?.join("; ")}`);
    lines.push(`   Brechas: ${r.brechas?.join("; ")}`);
    lines.push(`   Veredicto: ${r.veredicto}`);
    lines.push(`   Siguiente paso: ${r.siguiente_paso}`);
    lines.push(`   Pregunta entrevista: ${r.pregunta_entrevista}`);
  });

  lines.push("");
  lines.push("-".repeat(60));
  const aptos = sorted.filter(c => results[c.id].score >= 80).length;
  const revisar = sorted.filter(c => results[c.id].score >= 60 && results[c.id].score < 80).length;
  const noAptos = sorted.filter(c => results[c.id].score < 60).length;
  lines.push(`RESUMEN: ${sorted.length} analizados | ${aptos} aptos | ${revisar} revisar | ${noAptos} no aptos`);

  return lines.join("\n");
}

// ─── APP ──────────────────────────────────────────────────────────────────────
function ContactBar() {
  const [show, setShow] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  useEffect(() => {
    if (sessionStorage.getItem('cta-dismissed')) return;
    const timer = setTimeout(() => setShow(true), 10000);
    return () => clearTimeout(timer);
  }, []);
  if (dismissed || !show) return null;
  const dismiss = () => { setDismissed(true); sessionStorage.setItem('cta-dismissed', '1'); };
  return (
    <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 9999, background: 'rgba(10,11,15,0.95)', backdropFilter: 'blur(12px)', borderTop: '1px solid rgba(99,102,241,0.2)', padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', animation: 'slideUpCTA 0.4s ease', fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`@keyframes slideUpCTA { from { transform: translateY(100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }`}</style>
      <span style={{ color: '#E2E8F0', fontSize: 14, fontWeight: 500 }}>Esto es una demo gratuita de Impulso IA 👋 ¿Quieres algo así para tu negocio?</span>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <a href="https://impulso-ia-navy.vercel.app/#contacto" target="_blank" rel="noopener noreferrer" style={{ padding: '8px 18px', borderRadius: 8, background: 'linear-gradient(135deg, #6366F1, #4F46E5)', color: '#fff', fontSize: 13, fontWeight: 600, textDecoration: 'none', transition: 'transform 0.2s' }}>Platiquemos</a>
        <a href="https://wa.me/525579605324?text=Hola%20Christian%2C%20me%20interesa%20saber%20m%C3%A1s%20sobre%20tus%20servicios%20de%20IA" target="_blank" rel="noopener noreferrer" style={{ padding: '8px 18px', borderRadius: 8, background: 'rgba(37,211,102,0.15)', border: '1px solid rgba(37,211,102,0.3)', color: '#25D366', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>WhatsApp</a>
        <button onClick={dismiss} style={{ background: 'none', border: 'none', color: '#64748B', fontSize: 18, cursor: 'pointer', padding: '4px 8px' }}>✕</button>
      </div>
    </div>
  );
}

export default function CVScreener() {
  const [jobDesc, setJobDesc] = useState(`Especialista en IA & Automatizacion
Buscamos profesional con experiencia en:
- Implementacion de agentes IA y workflows automatizados (Make.com, n8n, Zapier)
- Prompt engineering avanzado con Claude, GPT-4o y Gemini
- Python basico/intermedio para scripting y automatizacion
- Integracion de APIs y Webhooks
- Ingles intermedio minimo (B2)
- Capacidad para trabajar en equipo y comunicar conceptos tecnicos a perfiles no tecnicos
Indispensable: experiencia con LLMs, automatizacion de procesos
Deseable: experiencia en startups, certificaciones en IA, portafolio de proyectos.`);

  const [presetKey, setPresetKey] = useState("Especialista en IA");
  const [candidates, setCandidates] = useState(SAMPLE_CVS);
  const [results, setResults] = useState({});
  const [analyzingId, setAnalyzingId] = useState(null);
  const [analyzingAll, setAnalyzingAll] = useState(false);
  const [ranked, setRanked] = useState([]);
  const [filter, setFilter] = useState("all");
  const [progressText, setProgressText] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [nextId, setNextId] = useState(100);
  const [comparativeAnalysis, setComparativeAnalysis] = useState(null);
  const cardRefs = useRef({});

  const isJobDescValid = jobDesc.trim().length >= 20;
  const customIds = useRef(new Set());

  const handlePresetChange = (key) => {
    setPresetKey(key);
    if (PRESET_JOBS[key]) {
      setJobDesc(PRESET_JOBS[key]);
    }
  };

  const handleAddCandidate = ({ name, cv }) => {
    const id = nextId;
    setNextId(prev => prev + 1);
    customIds.current.add(id);
    setCandidates(prev => [...prev, { id, name, cv }]);
  };

  const handleRemoveCandidate = (id) => {
    customIds.current.delete(id);
    setCandidates(prev => prev.filter(c => c.id !== id));
    setResults(prev => {
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });
    setRanked(prev => prev.filter(rid => rid !== id));
  };

  const updateRankings = useCallback((updatedResults, currentCandidates) => {
    const newRanked = currentCandidates
      .filter(c => updatedResults[c.id])
      .sort((a, b) => (updatedResults[b.id]?.score || 0) - (updatedResults[a.id]?.score || 0));
    setRanked(newRanked.map(c => c.id));

    // Update comparative analysis
    const comp = generateComparativeAnalysis(currentCandidates, updatedResults, jobDesc);
    setComparativeAnalysis(comp);
  }, [jobDesc]);

  const analyzeCandidate = useCallback(async (candidate) => {
    if (analyzingId !== null) return;
    setAnalyzingId(candidate.id);

    const ref = cardRefs.current[candidate.id];
    if (ref) {
      ref.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }

    // Simulate brief processing delay for UX
    await new Promise(r => setTimeout(r, 800 + Math.random() * 600));

    const parsed = analyzeCV(candidate.cv, jobDesc);

    setResults(prev => {
      const updated = { ...prev, [candidate.id]: parsed };
      updateRankings(updated, candidates);
      return updated;
    });
    setAnalyzingId(null);
  }, [analyzingId, candidates, jobDesc, updateRankings]);

  const analyzeAll = async () => {
    if (!isJobDescValid) return;
    setAnalyzingAll(true);
    const allResults = { ...results };

    for (let i = 0; i < candidates.length; i++) {
      const c = candidates[i];
      setProgressText(`Analizando ${i + 1}/${candidates.length} -- ${c.name}...`);
      setAnalyzingId(c.id);

      const ref = cardRefs.current[c.id];
      if (ref) {
        ref.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }

      await new Promise(r => setTimeout(r, 800 + Math.random() * 600));

      const parsed = analyzeCV(c.cv, jobDesc);
      allResults[c.id] = parsed;

      setResults(prev => {
        const updated = { ...prev, [c.id]: parsed };
        updateRankings(updated, candidates);
        return updated;
      });

      await new Promise(r => setTimeout(r, 200));
    }
    setAnalyzingId(null);
    setAnalyzingAll(false);
    setProgressText("");
  };

  const sortedCandidates = ranked.length > 0
    ? [...candidates].sort((a, b) => {
        const ra = ranked.indexOf(a.id);
        const rb = ranked.indexOf(b.id);
        if (ra === -1 && rb === -1) return 0;
        if (ra === -1) return 1;
        if (rb === -1) return -1;
        return ra - rb;
      })
    : candidates;

  const filteredCandidates = sortedCandidates.filter(c => {
    if (filter === "all") return true;
    const r = results[c.id];
    if (!r) return filter === "all";
    if (filter === "apto") return r.score >= 80;
    if (filter === "revisar") return r.score >= 60 && r.score < 80;
    if (filter === "no_apto") return r.score < 60;
    return true;
  });

  const analyzed = Object.keys(results).length;
  const allAnalyzed = analyzed === candidates.length;
  const aptos = Object.values(results).filter(r => r.score >= 80).length;
  const avgScore = analyzed > 0
    ? Math.round(Object.values(results).reduce((s, r) => s + r.score, 0) / analyzed)
    : 0;

  const downloadReport = () => {
    const text = generateReport(candidates, results, jobDesc);
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `reporte-hrscout-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
    <div style={{ minHeight: "100vh", background: "#0A0B0F", fontFamily: "'DM Sans', sans-serif", padding: "20px 16px" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@400;500&family=Cabinet+Grotesk:wght@700;800&display=swap');
        @keyframes fadeUp { from { opacity:0; transform:translateY(10px) } to { opacity:1; transform:translateY(0) } }
        @keyframes spin { to { transform:rotate(360deg) } }
        @keyframes checkPop { 0% { transform:scale(0); opacity:0 } 50% { transform:scale(1.3) } 100% { transform:scale(1); opacity:1 } }
        * { box-sizing: border-box; }
        textarea:focus, input:focus, select:focus { outline: none; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 2px; }
      `}</style>

      {showAddModal && (
        <AddCandidateModal
          onAdd={handleAddCandidate}
          onClose={() => setShowAddModal(false)}
        />
      )}

      <div style={{ maxWidth: 1000, margin: "0 auto" }}>

        {/* HEADER */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
          <div>
            <h1 style={{
              margin: "0 0 4px",
              fontSize: "clamp(24px, 4vw, 36px)", fontWeight: 800,
              color: "#F8FAFC", letterSpacing: "-0.03em",
              fontFamily: "'DM Sans', sans-serif",
            }}>
              HR<span style={{ color: "#818CF8" }}>Scout</span>
              <span style={{ fontSize: 13, fontWeight: 500, color: "#6366F1", marginLeft: 10, verticalAlign: "middle", border: "1px solid #4F46E5", borderRadius: 5, padding: "2px 8px" }}>AI</span>
            </h1>
            <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.3)", fontFamily: "'DM Mono', monospace" }}>
              Filtrado y ranking de CVs con IA &middot; Analisis real de competencias &middot; RRHH automatizado
            </p>
          </div>

          {/* Stats */}
          <div style={{ display: "flex", gap: 10 }}>
            {[
              { label: "Analizados", value: `${analyzed}/${candidates.length}` },
              { label: "Aptos", value: aptos, color: "#10B981" },
              { label: "Score Prom.", value: analyzed > 0 ? avgScore : "--", color: "#818CF8" },
            ].map((s, i) => (
              <div key={i} style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: 8, padding: "8px 14px", textAlign: "center",
              }}>
                <p style={{ margin: 0, fontSize: 18, fontWeight: 800, color: s.color || "#F8FAFC", fontFamily: "'DM Mono', monospace" }}>{s.value}</p>
                <p style={{ margin: 0, fontSize: 9, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.1em" }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 20 }}>

          {/* PANEL IZQUIERDO -- JOB DESC */}
          <div>
            <div style={{ marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)", fontFamily: "'DM Mono', monospace" }}>
                Descripcion del Puesto
              </label>
            </div>

            {/* Preset dropdown */}
            <select
              value={presetKey}
              onChange={e => handlePresetChange(e.target.value)}
              style={{
                width: "100%", marginBottom: 8, padding: "8px 10px",
                background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 8, color: "#A5B4FC", fontSize: 11,
                fontFamily: "'DM Mono', monospace", cursor: "pointer",
                appearance: "auto",
              }}
            >
              <option value="" style={{ background: "#1a1b26", color: "#A5B4FC" }}>-- Seleccionar preset --</option>
              {Object.keys(PRESET_JOBS).filter(k => k !== "").map(key => (
                <option key={key} value={key} style={{ background: "#1a1b26", color: "#D1D5DB" }}>{key}</option>
              ))}
            </select>

            <textarea
              value={jobDesc}
              onChange={e => { setJobDesc(e.target.value); setPresetKey(""); }}
              rows={14}
              style={{
                width: "100%", background: "rgba(255,255,255,0.03)",
                border: `1px solid ${isJobDescValid ? "rgba(255,255,255,0.09)" : "rgba(239,68,68,0.3)"}`,
                borderRadius: 10, padding: "12px 14px",
                color: "#D1D5DB", fontSize: 12, lineHeight: 1.7,
                fontFamily: "'DM Sans', sans-serif", resize: "none",
                transition: "border-color 0.2s",
              }}
            />
            {!isJobDescValid && (
              <p style={{ margin: "6px 0 0", fontSize: 11, color: "#EF4444", fontFamily: "'DM Mono', monospace" }}>
                Minimo 20 caracteres para iniciar el analisis ({jobDesc.trim().length}/20)
              </p>
            )}

            <button
              onClick={analyzeAll}
              disabled={analyzingAll || analyzingId !== null || !isJobDescValid}
              style={{
                width: "100%", marginTop: 10, padding: "13px",
                background: (analyzingAll || !isJobDescValid) ? "rgba(255,255,255,0.05)" : "linear-gradient(135deg, #6366F1, #4F46E5)",
                border: "none", borderRadius: 10,
                fontSize: 13, fontWeight: 700, color: (analyzingAll || !isJobDescValid) ? "#6B7280" : "#fff",
                cursor: (analyzingAll || !isJobDescValid) ? "default" : "pointer",
                fontFamily: "'DM Sans', sans-serif",
                boxShadow: (analyzingAll || !isJobDescValid) ? "none" : "0 0 24px rgba(99,102,241,0.4)",
                transition: "all 0.2s", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              }}
            >
              {analyzingAll ? (
                <>
                  <div style={{ width: 14, height: 14, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.2)", borderTop: "2px solid #6366F1", animation: "spin 1s linear infinite" }} />
                  {progressText || `Analizando...`}
                </>
              ) : allAnalyzed ? "Re-analizar todos" : "Analizar todos los CVs"}
            </button>

            {/* Download report button */}
            {analyzed > 0 && (
              <button
                onClick={downloadReport}
                style={{
                  width: "100%", marginTop: 8, padding: "11px",
                  background: "rgba(16,185,129,0.1)",
                  border: "1px solid rgba(16,185,129,0.25)",
                  borderRadius: 10,
                  fontSize: 12, fontWeight: 700, color: "#10B981",
                  cursor: "pointer",
                  fontFamily: "'DM Sans', sans-serif",
                  transition: "all 0.2s",
                }}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(16,185,129,0.18)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "rgba(16,185,129,0.1)"; }}
              >
                Descargar reporte
              </button>
            )}

            {analyzed > 0 && (
              <div style={{
                marginTop: 12, padding: 12,
                background: "rgba(99,102,241,0.06)",
                border: "1px solid rgba(99,102,241,0.15)",
                borderRadius: 8, animation: "fadeUp 0.3s ease",
              }}>
                <p style={{ margin: "0 0 8px", fontSize: 10, fontWeight: 700, color: "#818CF8", letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "'DM Mono', monospace" }}>Resumen del Proceso</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {[
                    { label: "Total candidatos", value: candidates.length },
                    { label: "Aptos (>=80)", value: aptos, color: "#10B981" },
                    { label: "Revisar (60-79)", value: Object.values(results).filter(r => r.score >= 60 && r.score < 80).length, color: "#F59E0B" },
                    { label: "No aptos (<60)", value: Object.values(results).filter(r => r.score < 60).length, color: "#EF4444" },
                  ].map((item, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{item.label}</span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: item.color || "#F8FAFC", fontFamily: "'DM Mono', monospace" }}>{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* PANEL DERECHO -- CANDIDATOS */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)", fontFamily: "'DM Mono', monospace" }}>
                Candidatos &middot; {ranked.length > 0 ? "Ordenados por compatibilidad" : "Sin analizar"}
              </label>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                {ranked.length > 0 && (
                  <span style={{ fontSize: 10, color: "#818CF8", fontFamily: "'DM Mono', monospace" }}>
                    Top: {sortedCandidates[0]?.name}
                  </span>
                )}
                <button
                  onClick={() => setShowAddModal(true)}
                  style={{
                    padding: "5px 12px", borderRadius: 6,
                    fontSize: 11, fontWeight: 700, cursor: "pointer",
                    background: "rgba(245,158,11,0.12)",
                    border: "1px solid rgba(245,158,11,0.3)",
                    color: "#F59E0B",
                    fontFamily: "'DM Sans', sans-serif",
                    transition: "all 0.15s",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = "rgba(245,158,11,0.22)"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "rgba(245,158,11,0.12)"; }}
                >
                  + Agregar candidato
                </button>
              </div>
            </div>

            {/* Filter bar */}
            {analyzed > 0 && (
              <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
                {[
                  { id: "all", label: "Todos", color: "#818CF8" },
                  { id: "apto", label: "Aptos", color: "#10B981" },
                  { id: "revisar", label: "Revisar", color: "#F59E0B" },
                  { id: "no_apto", label: "No aptos", color: "#EF4444" },
                ].map(f => (
                  <button
                    key={f.id}
                    onClick={() => setFilter(f.id)}
                    style={{
                      padding: "5px 12px", borderRadius: 6,
                      fontSize: 11, fontWeight: 600,
                      background: filter === f.id ? `${f.color}20` : "rgba(255,255,255,0.03)",
                      border: `1px solid ${filter === f.id ? `${f.color}50` : "rgba(255,255,255,0.07)"}`,
                      color: filter === f.id ? f.color : "rgba(255,255,255,0.4)",
                      cursor: "pointer",
                      fontFamily: "'DM Sans', sans-serif",
                      transition: "all 0.15s",
                    }}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            )}

            <div style={{ maxHeight: "calc(100vh - 200px)", overflowY: "auto", paddingRight: 4 }}>
              {filteredCandidates.map((c, i) => (
                <CandidateCard
                  key={c.id}
                  candidate={c}
                  rank={i + 1}
                  onAnalyze={analyzeCandidate}
                  analyzing={analyzingId === c.id}
                  globalAnalyzing={analyzingAll}
                  result={results[c.id]}
                  cardRef={el => { cardRefs.current[c.id] = el; }}
                  onRemove={handleRemoveCandidate}
                  isCustom={customIds.current.has(c.id)}
                />
              ))}
              {filteredCandidates.length === 0 && analyzed > 0 && (
                <div style={{ textAlign: "center", padding: 40, color: "rgba(255,255,255,0.3)", fontSize: 13 }}>
                  No hay candidatos en esta categoria
                </div>
              )}
            </div>

            {/* Comparative Analysis */}
            <ComparativePanel analysis={comparativeAnalysis} />
          </div>
        </div>

        <p style={{ textAlign: "center", marginTop: 20, fontSize: 10, color: "rgba(255,255,255,0.1)", fontFamily: "'DM Mono', monospace", letterSpacing: "0.1em" }}>
          HRSCOUT &middot; ANALISIS REAL DE CVs &middot; FILTRADO AUTOMATICO &middot; RANKING POR COMPATIBILIDAD
        </p>
      </div>
    </div>
    <ContactBar />
    </>
  );
}
