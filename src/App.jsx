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

// ─── AGENTIC SCORING PIPELINE (LOCAL) ──────────────────────────────────────

// Agent 1: Skill Extractor
function extractSkills(text) {
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

// Agent 2: Experience Evaluator
function agentEvaluateExperience(cvText) {
  const lower = cvText.toLowerCase();

  // Detect years of experience
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

  // Detect seniority level
  const seniorPatterns = ['senior','lead','principal','architect','director','manager','head','chief','staff'];
  const midPatterns = ['mid','intermediate','regular','developer','engineer','analyst'];
  const juniorPatterns = ['junior','intern','trainee','entry','beginner','student','graduate'];

  const seniorScore = seniorPatterns.filter(p => lower.includes(p)).length;
  const midScore = midPatterns.filter(p => lower.includes(p)).length;
  const juniorScore = juniorPatterns.filter(p => lower.includes(p)).length;

  let level = 'mid';
  if (seniorScore > midScore && seniorScore > juniorScore) level = 'senior';
  else if (juniorScore > midScore) level = 'junior';

  // Detect education
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

// Agent 3: Job Fit Analyzer
function analyzeJobFit(jobSkills, cvSkills, jobText, cvText) {
  const fit = { matched: [], missing: [], bonus: [], score: 0 };

  const jobLower = jobText.toLowerCase();

  // Split into required vs desirable
  const reqSection = jobLower.split(/(?:deseable|nice to have|bonus|plus|desirable)/i);
  const reqText = reqSection[0] || jobLower;

  // Check each category
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

  // Check for bonus skills in CV not in job
  for (const [cat, config] of Object.entries(cvSkills)) {
    config.found.forEach(skill => {
      if (!jobSkills[cat]?.found.includes(skill)) {
        fit.bonus.push({ skill, category: cat });
      }
    });
  }

  // Calculate score
  const totalRequired = fit.matched.filter(m => m.required).length + fit.missing.length;
  const matchedRequired = fit.matched.filter(m => m.required).length;
  const requiredScore = totalRequired > 0 ? (matchedRequired / totalRequired) * 70 : 35;
  const bonusScore = Math.min(fit.bonus.length * 3, 15);
  const matchedDesirableScore = Math.min(fit.matched.filter(m => !m.required).length * 5, 15);

  fit.score = Math.round(Math.min(100, requiredScore + bonusScore + matchedDesirableScore));

  return fit;
}

// Agent 4: Recommendation Engine
function generateRecommendation(fit, experience, lang) {
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

  // Experience bonus annotation
  if (level === 'senior' && maxYears >= 5 && score >= 50) {
    verdict += lang === 'es' ? ` Nivel senior con ${maxYears}+ anos.` : ` Senior level with ${maxYears}+ years.`;
  }

  return { verdict, nextStep, interviewQuestion: interviewQ, strengths: matched.map(m => m.skill), gaps: missing.map(m => m.skill) };
}

// Orchestrator: runs the 4-agent pipeline and returns UI-compatible shape
function agenticAnalyze(jobDesc, cvText, candidateName, lang) {
  const jobSkills = extractSkills(jobDesc);
  const cvSkills = extractSkills(cvText);
  const experience = agentEvaluateExperience(cvText);
  const fit = analyzeJobFit(jobSkills, cvSkills, jobDesc, cvText);
  const recommendation = generateRecommendation(fit, experience, lang);

  // Experience bonus to score
  let finalScore = fit.score;
  if (experience.maxYears >= 5) finalScore = Math.min(100, finalScore + 5);
  if (experience.maxYears >= 3) finalScore = Math.min(100, finalScore + 3);
  if (experience.degrees.includes('master') || experience.degrees.includes('phd')) finalScore = Math.min(100, finalScore + 4);
  finalScore = Math.max(5, Math.min(98, finalScore));

  // Extract title from first line of CV
  const firstLine = cvText.split("\n")[0] || "";
  const titulo = (firstLine.split("|")[0] || firstLine).trim();
  const displayTitle = titulo.length > 45 ? titulo.substring(0, 42) + "..." : titulo;

  // Map strengths to display names
  const habilidades = recommendation.strengths
    .map(s => SKILLS_DISPLAY[s] || s.charAt(0).toUpperCase() + s.slice(1))
    .filter((v, i, arr) => arr.indexOf(v) === i)
    .slice(0, 5);
  if (habilidades.length === 0) habilidades.push("Generales");

  // Build fortalezas (strengths) in Spanish for UI
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

  // Build brechas (gaps)
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

  // Pipeline trace for UI
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

// ─── CLAUDE API ANALYSIS ──────────────────────────────────────────────────
async function analyzeCVWithClaude(cvText, jobDescription, localResult, apiKey) {
  if (!apiKey) return { ...localResult, analysisMode: "local" };

  try {
    const startTime = Date.now();
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 800,
        system: "You are an expert HR analyst. Analyze this candidate's CV against the job requirements. Respond in JSON only, no markdown: {\"strengths\":[\"s1\",\"s2\",\"s3\"],\"gaps\":[\"g1\",\"g2\",\"g3\"],\"verdict\":\"2 line summary\",\"action\":\"interview|waitlist|discard\",\"question\":\"specific interview question\",\"aiScore\":0-100}",
        messages: [{ role: "user", content: `Job:\n${jobDescription}\n\nCandidate CV:\n${cvText}\n\nLocal keyword score: ${localResult.score}/100` }],
      }),
    });

    if (!response.ok) {
      console.warn("Claude API error:", response.status);
      return { ...localResult, analysisMode: "local" };
    }

    const data = await response.json();
    const text = data.content?.[0]?.text || "";
    const aiData = JSON.parse(text);
    const elapsed = Date.now() - startTime;

    const aiScore = Math.max(0, Math.min(100, Number(aiData.aiScore) || localResult.score));
    const finalScore = Math.round(localResult.score * 0.4 + aiScore * 0.6);
    const scoreDiff = Math.abs(localResult.score - aiScore);
    const confidence = scoreDiff <= 10 ? "high" : scoreDiff <= 25 ? "medium" : "low";

    // Map action to Spanish
    const actionMap = {
      interview: "Agendar entrevista tecnica en los proximos 3 dias. Candidato prioritario.",
      waitlist: "Anadir a lista de espera. Evaluar si las brechas son capacitables en 1-2 meses.",
      discard: "Descartar para este puesto. Considerar para roles alternativos si aplica.",
    };

    return {
      ...localResult,
      score: finalScore,
      localScore: localResult.score,
      aiScore,
      confidence,
      fortalezas: aiData.strengths || localResult.fortalezas,
      brechas: aiData.gaps || localResult.brechas,
      veredicto: aiData.verdict || localResult.veredicto,
      siguiente_paso: actionMap[aiData.action] || localResult.siguiente_paso,
      pregunta_entrevista: aiData.question || localResult.pregunta_entrevista,
      analysisMode: "ai",
      analysisTime: elapsed,
    };
  } catch (err) {
    console.warn("Claude API fallback to local:", err.message);
    return { ...localResult, analysisMode: "local" };
  }
}

// ─── CLAUDE TOOL USE (AGENTIC LOOP) ──────────────────────────────────────────
const TOOLS = [
  {
    name: "extract_keywords",
    description: "Extract keywords from a job description, categorized as required vs desirable. Call this first to understand what the job needs.",
    input_schema: {
      type: "object",
      properties: { job_description: { type: "string", description: "The full job description text" } },
      required: ["job_description"],
    },
  },
  {
    name: "match_cv_keywords",
    description: "Match a CV against extracted keywords using synonym detection. Returns matched/unmatched keywords with weighted scores. Call after extract_keywords.",
    input_schema: {
      type: "object",
      properties: {
        cv_text: { type: "string", description: "The candidate's CV text" },
        keywords: { type: "array", items: { type: "string" }, description: "Keywords to match against" },
        required_keywords: { type: "array", items: { type: "string" }, description: "Which keywords are required (weight 2x)" },
      },
      required: ["cv_text", "keywords"],
    },
  },
  {
    name: "evaluate_experience",
    description: "Evaluate candidate's years of experience vs the job requirements. Returns years found and whether they meet the requirement.",
    input_schema: {
      type: "object",
      properties: {
        cv_text: { type: "string", description: "The candidate's CV text" },
        job_description: { type: "string", description: "The job description to extract required years from" },
      },
      required: ["cv_text", "job_description"],
    },
  },
  {
    name: "check_education",
    description: "Check the candidate's education level and certifications from their CV.",
    input_schema: {
      type: "object",
      properties: { cv_text: { type: "string", description: "The candidate's CV text" } },
      required: ["cv_text"],
    },
  },
  {
    name: "generate_interview_question",
    description: "Generate a specific interview question based on gaps found in the candidate's profile. Call this last after analyzing gaps.",
    input_schema: {
      type: "object",
      properties: {
        candidate_strengths: { type: "array", items: { type: "string" }, description: "List of candidate strengths" },
        gaps: { type: "array", items: { type: "string" }, description: "List of gaps or missing skills" },
        job_title: { type: "string", description: "The job title" },
      },
      required: ["gaps"],
    },
  },
];

function executeToolCall(toolName, toolInput) {
  switch (toolName) {
    case "extract_keywords": {
      const { keywords, requiredKeywords } = extractKeywords(toolInput.job_description || "");
      return {
        keywords,
        required_keywords: Array.from(requiredKeywords),
        total_keywords: keywords.length,
        total_required: requiredKeywords.size,
      };
    }
    case "match_cv_keywords": {
      const reqSet = new Set(toolInput.required_keywords || []);
      const { matched, unmatched, keywordScore } = matchKeywords(
        toolInput.cv_text || "",
        toolInput.keywords || [],
        reqSet
      );
      return {
        matched,
        unmatched,
        match_rate: toolInput.keywords?.length ? Math.round((matched.length / toolInput.keywords.length) * 100) : 0,
        weighted_score: Math.round(keywordScore * 100),
      };
    }
    case "evaluate_experience": {
      const candidateYears = extractExperienceYears(toolInput.cv_text || "");
      const requiredYears = extractRequiredYears(toolInput.job_description || "");
      return {
        candidate_years: candidateYears,
        required_years: requiredYears,
        meets_requirement: candidateYears >= requiredYears,
        gap_years: Math.max(0, requiredYears - candidateYears),
      };
    }
    case "check_education": {
      const edu = detectEducation(toolInput.cv_text || "");
      const langs = detectLanguages(toolInput.cv_text || "");
      return {
        education_level: edu.label,
        education_score: edu.level,
        certifications: edu.certifications,
        languages: langs.map(l => ({ language: l.lang, level: l.level, score: l.score })),
      };
    }
    case "generate_interview_question": {
      const gaps = toolInput.gaps || [];
      const strengths = toolInput.candidate_strengths || [];
      const title = toolInput.job_title || "the role";
      if (gaps.length === 0) {
        return { question: `Given your strong background, describe a challenging project related to ${title} where you had to learn something new quickly.` };
      }
      const mainGap = gaps[0];
      return {
        question: `Regarding ${mainGap}: can you describe any exposure or learning you've done in this area? How would you approach ramping up on it for ${title}?`,
        focus_area: mainGap,
        context: strengths.length > 0 ? `Candidate is strong in: ${strengths.slice(0, 3).join(", ")}` : "No specific strengths identified",
      };
    }
    default:
      return { error: `Unknown tool: ${toolName}` };
  }
}

async function analyzeWithToolUse(cvText, jobDescription, localResult, apiKey) {
  if (!apiKey) return null;

  try {
    const startTime = Date.now();
    const systemPrompt = `You are an expert HR analyst. You have tools to analyze a candidate's CV against a job description.

Call the tools in this order:
1. extract_keywords — to understand what the job requires
2. match_cv_keywords — to see how the CV matches
3. evaluate_experience — to check experience years
4. check_education — to check education and certifications
5. generate_interview_question — based on any gaps found

After all tool calls, provide your final evaluation as JSON (no markdown):
{"strengths":["s1","s2","s3"],"gaps":["g1","g2","g3"],"verdict":"2 line summary","action":"interview|waitlist|discard","question":"specific interview question","aiScore":0-100,"toolsUsed":true}`;

    let messages = [
      { role: "user", content: `Analyze this candidate:\n\nJob Description:\n${jobDescription}\n\nCandidate CV:\n${cvText}\n\nLocal keyword score for reference: ${localResult.score}/100\n\nPlease use the tools to perform a thorough analysis, then synthesize into a final evaluation.` },
    ];

    let toolCallCount = 0;
    const maxIterations = 8;

    for (let i = 0; i < maxIterations; i++) {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1024,
          system: systemPrompt,
          tools: TOOLS,
          messages,
        }),
      });

      if (!response.ok) {
        console.warn("Tool use API error:", response.status);
        return null;
      }

      const data = await response.json();

      // If end_turn, extract final text
      if (data.stop_reason === "end_turn") {
        const textBlock = data.content?.find(b => b.type === "text");
        if (textBlock) {
          try {
            const jsonMatch = textBlock.text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              const aiData = JSON.parse(jsonMatch[0]);
              const elapsed = Date.now() - startTime;
              const aiScore = Math.max(0, Math.min(100, Number(aiData.aiScore) || localResult.score));
              const finalScore = Math.round(localResult.score * 0.35 + aiScore * 0.65);
              const scoreDiff = Math.abs(localResult.score - aiScore);
              const confidence = scoreDiff <= 10 ? "high" : scoreDiff <= 25 ? "medium" : "low";

              const actionMap = {
                interview: "Agendar entrevista tecnica en los proximos 3 dias. Candidato prioritario.",
                waitlist: "Anadir a lista de espera. Evaluar si las brechas son capacitables en 1-2 meses.",
                discard: "Descartar para este puesto. Considerar para roles alternativos si aplica.",
              };

              return {
                ...localResult,
                score: finalScore,
                localScore: localResult.score,
                aiScore,
                confidence,
                fortalezas: aiData.strengths || localResult.fortalezas,
                brechas: aiData.gaps || localResult.brechas,
                veredicto: aiData.verdict || localResult.veredicto,
                siguiente_paso: actionMap[aiData.action] || localResult.siguiente_paso,
                pregunta_entrevista: aiData.question || localResult.pregunta_entrevista,
                analysisMode: "tool_use",
                analysisTime: elapsed,
                toolCallCount,
              };
            }
          } catch (parseErr) {
            console.warn("Tool use parse error:", parseErr.message);
          }
        }
        break;
      }

      // If tool_use, execute tools and continue the loop
      if (data.stop_reason === "tool_use") {
        // Add assistant message with all content blocks
        messages.push({ role: "assistant", content: data.content });

        // Execute each tool call and build tool results
        const toolResults = [];
        for (const block of data.content) {
          if (block.type === "tool_use") {
            toolCallCount++;
            const result = executeToolCall(block.name, block.input);
            toolResults.push({
              type: "tool_result",
              tool_use_id: block.id,
              content: JSON.stringify(result),
            });
          }
        }
        messages.push({ role: "user", content: toolResults });
        continue;
      }

      // Unknown stop reason
      break;
    }

    return null;
  } catch (err) {
    console.warn("Tool use error, falling back:", err.message);
    return null;
  }
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

// ─── TRANSLATIONS ─────────────────────────────────────────────────────────────
const TRANSLATIONS = {
  es: {
    subtitle: "Filtrado y ranking de CVs con IA \u00b7 Analisis real de competencias \u00b7 RRHH automatizado",
    analyzed: "Analizados",
    suitable: "Aptos",
    avgScore: "Score Prom.",
    jobDesc: "Descripcion del Puesto",
    selectPreset: "-- Seleccionar preset --",
    minChars: (n) => `Minimo 20 caracteres para iniciar el analisis (${n}/20)`,
    analyzeAll: "Analizar todos los CVs",
    reAnalyzeAll: "Re-analizar todos",
    analyzing: "Analizando...",
    analyzingWith: "Analizando con IA...",
    analyzingName: (i, total, name) => `Analizando ${i}/${total} -- ${name}...`,
    notAnalyzed: "Sin analizar",
    downloadReport: "Descargar reporte",
    processSummary: "Resumen del Proceso",
    totalCandidates: "Total candidatos",
    suitableGte80: "Aptos (>=80)",
    reviewRange: "Revisar (60-79)",
    notSuitableLt60: "No aptos (<60)",
    candidates: "Candidatos",
    sortedByFit: "Ordenados por compatibilidad",
    unsorted: "Sin analizar",
    addCandidate: "+ Agregar candidato",
    filterAll: "Todos",
    filterSuitable: "Aptos",
    filterReview: "Revisar",
    filterNotSuitable: "No aptos",
    noCandidatesInCategory: "No hay candidatos en esta categoria",
    footer: "HRSCOUT \u00b7 ANALISIS REAL DE CVs \u00b7 FILTRADO AUTOMATICO \u00b7 RANKING POR COMPATIBILIDAD",
    close: "Cerrar",
    viewAnalysis: "Ver analisis",
    analyzeAI: "Analizar IA",
    reAnalyze: "Re-analizar",
    yrsExp: "anos exp.",
    strengths: "Fortalezas",
    gaps: "Brechas",
    verdict: "Veredicto",
    interviewQuestion: "PREGUNTA CLAVE PARA ENTREVISTA: ",
    scoreSuitable: "Apto",
    scoreReview: "Revisar",
    scoreNotSuitable: "No apto",
    addCandidateTitle: "Agregar Candidato",
    addCandidateDesc: "Agrega un CV personalizado para analizar contra la descripcion del puesto",
    candidateName: "Nombre del candidato",
    candidateNamePlaceholder: "Ej: Maria Garcia Lopez",
    pasteText: "Pegar texto",
    uploadFile: "Subir archivo .txt",
    cvText: "Texto del CV",
    cvPlaceholder: "Pega aqui el contenido del CV...\n\nEj:\nIngeniero en Software | 5 anos de experiencia\nStack: React, Python, AWS...\nEducacion: Licenciatura en...\nIdiomas: Ingles C1...",
    fileLoaded: (n) => `Archivo cargado (${n} caracteres)`,
    clickToSelect: "Haz clic para seleccionar un archivo .txt",
    preview: "Vista previa",
    minCharsCV: (n) => `${n}/50 caracteres minimo`,
    cancel: "Cancelar",
    addCandidateBtn: "Agregar candidato",
    comparativeAnalysis: "Analisis Comparativo",
    bestCandidate: "Mejor Candidato",
    commonGaps: "Brechas Comunes",
    uncovered: (count, total, pct) => `${count}/${total} sin cubrir (${pct}%)`,
    skillCoverage: "Cobertura de Habilidades",
    coveredBy: "Cubierto por",
    noCoverage: "Sin cobertura",
    reportTitle: "=== REPORTE DE ANALISIS DE CVs -- HRScout AI ===",
    reportDate: "Fecha",
    reportJobDesc: "DESCRIPCION DEL PUESTO:",
    reportSuitable: "APTO",
    reportReview: "REVISAR",
    reportNotSuitable: "NO APTO",
    reportSummary: (total, aptos, revisar, noAptos) => `RESUMEN: ${total} analizados | ${aptos} aptos | ${revisar} revisar | ${noAptos} no aptos`,
    ctaText: "Esto es una demo gratuita de Impulso IA. Quieres algo asi para tu negocio?",
    ctaButton: "Platiquemos",
    removeCandidateTitle: "Eliminar candidato",
    top: "Top",
    apiKeyLabel: "Claude API Key (opcional)",
    apiKeyPlaceholder: "sk-ant-... (para analisis con IA real)",
    apiKeySet: "API Key configurada",
    apiKeyRemove: "Quitar",
    localMode: "Local",
    aiMode: "IA",
    confidenceHigh: "Confianza alta",
    confidenceMedium: "Confianza media",
    confidenceLow: "Confianza baja",
    keywordScore: "Score Keywords",
    aiScoreLabel: "Score IA",
    clearResults: "Limpiar resultados",
    clearConfirm: "Se eliminaran todos los resultados. Continuar?",
    copyToClipboard: "Copiar",
    copied: "Copiado!",
    exportJSON: "Exportar JSON",
    uploadFilePdf: "Subir .txt / .pdf",
    pdfNote: "Para mejores resultados, pega el texto directamente o sube archivos .txt",
    analyticsTitle: "Analiticas",
    scoreDistribution: "Distribucion de Scores",
    avgScoreLabel: "Score Promedio",
    commonMissingSkills: "Skills Faltantes Comunes",
    totalAnalysisTime: "Tiempo total de analisis",
    range0_40: "0-40",
    range40_60: "40-60",
    range60_80: "60-80",
    range80_100: "80-100",
    toolUseMode: "Tool Use",
    toolCalls: "llamadas",
    agenticMode: "Agentic",
    pipelineTitle: "Pipeline de Analisis",
  },
  en: {
    subtitle: "AI-powered CV screening \u00b7 Real competency analysis \u00b7 Automated HR",
    analyzed: "Analyzed",
    suitable: "Suitable",
    avgScore: "Avg. Score",
    jobDesc: "Job Description",
    selectPreset: "-- Select preset --",
    minChars: (n) => `Minimum 20 characters to start analysis (${n}/20)`,
    analyzeAll: "Analyze all CVs",
    reAnalyzeAll: "Re-analyze all",
    analyzing: "Analyzing...",
    analyzingWith: "Analyzing with AI...",
    analyzingName: (i, total, name) => `Analyzing ${i}/${total} -- ${name}...`,
    notAnalyzed: "Not analyzed",
    downloadReport: "Download report",
    processSummary: "Process Summary",
    totalCandidates: "Total candidates",
    suitableGte80: "Suitable (>=80)",
    reviewRange: "Review (60-79)",
    notSuitableLt60: "Not suitable (<60)",
    candidates: "Candidates",
    sortedByFit: "Sorted by compatibility",
    unsorted: "Not analyzed",
    addCandidate: "+ Add candidate",
    filterAll: "All",
    filterSuitable: "Suitable",
    filterReview: "Review",
    filterNotSuitable: "Not suitable",
    noCandidatesInCategory: "No candidates in this category",
    footer: "HRSCOUT \u00b7 REAL CV ANALYSIS \u00b7 AUTOMATED SCREENING \u00b7 COMPATIBILITY RANKING",
    close: "Close",
    viewAnalysis: "View analysis",
    analyzeAI: "Analyze AI",
    reAnalyze: "Re-analyze",
    yrsExp: "yrs exp.",
    strengths: "Strengths",
    gaps: "Gaps",
    verdict: "Verdict",
    interviewQuestion: "KEY INTERVIEW QUESTION: ",
    scoreSuitable: "Suitable",
    scoreReview: "Review",
    scoreNotSuitable: "Not suitable",
    addCandidateTitle: "Add Candidate",
    addCandidateDesc: "Add a custom CV to analyze against the job description",
    candidateName: "Candidate name",
    candidateNamePlaceholder: "E.g.: Maria Garcia Lopez",
    pasteText: "Paste text",
    uploadFile: "Upload .txt file",
    cvText: "CV Text",
    cvPlaceholder: "Paste the CV content here...\n\nE.g.:\nSoftware Engineer | 5 years of experience\nStack: React, Python, AWS...\nEducation: Bachelor's in...\nLanguages: English C1...",
    fileLoaded: (n) => `File loaded (${n} characters)`,
    clickToSelect: "Click to select a .txt file",
    preview: "Preview",
    minCharsCV: (n) => `${n}/50 characters minimum`,
    cancel: "Cancel",
    addCandidateBtn: "Add candidate",
    comparativeAnalysis: "Comparative Analysis",
    bestCandidate: "Best Candidate",
    commonGaps: "Common Gaps",
    uncovered: (count, total, pct) => `${count}/${total} uncovered (${pct}%)`,
    skillCoverage: "Skill Coverage",
    coveredBy: "Covered by",
    noCoverage: "No coverage",
    reportTitle: "=== CV ANALYSIS REPORT -- HRScout AI ===",
    reportDate: "Date",
    reportJobDesc: "JOB DESCRIPTION:",
    reportSuitable: "SUITABLE",
    reportReview: "REVIEW",
    reportNotSuitable: "NOT SUITABLE",
    reportSummary: (total, aptos, revisar, noAptos) => `SUMMARY: ${total} analyzed | ${aptos} suitable | ${revisar} review | ${noAptos} not suitable`,
    ctaText: "This is a free demo by Impulso IA. Want something like this for your business?",
    ctaButton: "Let's talk",
    removeCandidateTitle: "Remove candidate",
    top: "Top",
    apiKeyLabel: "Claude API Key (optional)",
    apiKeyPlaceholder: "sk-ant-... (for real AI analysis)",
    apiKeySet: "API Key configured",
    apiKeyRemove: "Remove",
    localMode: "Local",
    aiMode: "AI",
    confidenceHigh: "High confidence",
    confidenceMedium: "Medium confidence",
    confidenceLow: "Low confidence",
    keywordScore: "Keyword Score",
    aiScoreLabel: "AI Score",
    clearResults: "Clear results",
    clearConfirm: "All results will be deleted. Continue?",
    copyToClipboard: "Copy",
    copied: "Copied!",
    exportJSON: "Export JSON",
    uploadFilePdf: "Upload .txt / .pdf",
    pdfNote: "For best results, paste CV text directly or upload .txt files",
    analyticsTitle: "Analytics",
    scoreDistribution: "Score Distribution",
    avgScoreLabel: "Average Score",
    commonMissingSkills: "Common Missing Skills",
    totalAnalysisTime: "Total analysis time",
    range0_40: "0-40",
    range40_60: "40-60",
    range60_80: "60-80",
    range80_100: "80-100",
    toolUseMode: "Tool Use",
    toolCalls: "calls",
    agenticMode: "Agentic",
    pipelineTitle: "Analysis Pipeline",
  },
};

// ─── TOUR STEPS CONFIG ───────────────────────────────────────────────────────
const TOUR_STEPS = [
  {
    id: "welcome",
    target: null,
    title: { en: "HRScout — AI Resume Screening", es: "HRScout — Filtrado de CVs con IA" },
    text: {
      en: "This tool analyzes resumes against job descriptions using AI. It extracts keywords, matches skills with synonyms, and ranks candidates by fit score (0-100). Paste a job description and let AI screen your candidates instantly.\n\nLet me show you how it works!",
      es: "Esta herramienta analiza CVs contra descripciones de puesto usando IA. Extrae palabras clave, matchea habilidades con sin\u00f3nimos, y rankea candidatos por puntaje de ajuste (0-100). Pega una descripci\u00f3n de puesto y deja que la IA filtre tus candidatos al instante.\n\n\u00a1D\u00e9jame mostrarte c\u00f3mo funciona!"
    },
    btn: { en: "Start Tour \u2192", es: "Iniciar Tour \u2192" },
  },
  {
    id: "job-desc",
    target: "[data-tour='job-desc']",
    title: { en: "Job Description", es: "Descripci\u00f3n del Puesto" },
    text: {
      en: "This is where you paste or type the job description. The AI will extract keywords and required skills from this text to match against candidate resumes.",
      es: "Aqu\u00ed pegas o escribes la descripci\u00f3n del puesto. La IA extraer\u00e1 palabras clave y habilidades requeridas de este texto para compararlas con los CVs de los candidatos."
    },
    btn: { en: "Next \u2192", es: "Siguiente \u2192" },
  },
  {
    id: "preset",
    target: "[data-tour='preset-select']",
    title: { en: "Select a Preset", es: "Selecciona un Preset" },
    text: {
      en: "Choose from pre-built job descriptions to quickly get started. We have presets for AI Specialist, Frontend Developer, Product Manager, Data Scientist, and Digital Marketing.",
      es: "Elige entre descripciones de puesto predefinidas para empezar r\u00e1pido. Tenemos presets para Especialista en IA, Desarrollador Frontend, Product Manager, Data Scientist y Marketing Digital."
    },
    btn: { en: "Try it \u2192", es: "Probar \u2192" },
    action: "selectPreset",
  },
  {
    id: "candidates",
    target: "[data-tour='candidates']",
    title: { en: "Candidate List", es: "Lista de Candidatos" },
    text: {
      en: "These are the candidates to evaluate. Each has a resume that will be scored from 0-100 based on keyword matching, synonym detection, experience, education, and language skills.",
      es: "Estos son los candidatos a evaluar. Cada uno tiene un CV que ser\u00e1 puntuado de 0-100 basado en coincidencia de palabras clave, detecci\u00f3n de sin\u00f3nimos, experiencia, educaci\u00f3n e idiomas."
    },
    btn: { en: "Analyze \u2192", es: "Analizar \u2192" },
    action: "analyzeAll",
  },
  {
    id: "top-candidate",
    target: "[data-tour='candidate-0']",
    title: { en: "Top Candidate", es: "Mejor Candidato" },
    text: {
      en: "After analysis, candidates are ranked by compatibility score. The top candidate shows the highest match. Click 'View analysis' to see strengths, gaps, verdict, and a suggested interview question.",
      es: "Despu\u00e9s del an\u00e1lisis, los candidatos se ordenan por puntaje de compatibilidad. El mejor candidato muestra el mayor match. Haz clic en 'Ver an\u00e1lisis' para ver fortalezas, brechas, veredicto y una pregunta sugerida para entrevista."
    },
    btn: { en: "Next \u2192", es: "Siguiente \u2192" },
  },
  {
    id: "export",
    target: "[data-tour='export-area']",
    title: { en: "Export & Download", es: "Exportar y Descargar" },
    text: {
      en: "Download a full text report or export results as JSON. You can also copy individual candidate analyses to your clipboard from their expanded view. That's it — you're ready to screen candidates!",
      es: "Descarga un reporte completo en texto o exporta los resultados como JSON. Tambi\u00e9n puedes copiar el an\u00e1lisis individual de cada candidato desde su vista expandida. \u00a1Eso es todo, ya est\u00e1s listo para filtrar candidatos!"
    },
    btn: { en: "Finish \u2713", es: "Finalizar \u2713" },
  },
];

// ─── TOUR OVERLAY COMPONENT ─────────────────────────────────────────────────
function TourOverlay({ tourStep, tourActive, lang, setLang, onNext, onSkip, totalSteps }) {
  const step = TOUR_STEPS[tourStep];
  if (!tourActive || !step) return null;

  const isWelcome = tourStep === 0;

  // Auto-scroll to target
  useEffect(() => {
    if (step.target) {
      const el = document.querySelector(step.target);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }, [tourStep, step.target]);

  // Get target rect for spotlight
  const [targetRect, setTargetRect] = useState(null);
  useEffect(() => {
    if (!step.target) { setTargetRect(null); return; }
    const updateRect = () => {
      const el = document.querySelector(step.target);
      if (el) {
        const r = el.getBoundingClientRect();
        setTargetRect({ top: r.top - 8, left: r.left - 8, width: r.width + 16, height: r.height + 16 });
      }
    };
    // Delay to let scroll settle
    const timer = setTimeout(updateRect, 350);
    window.addEventListener("resize", updateRect);
    window.addEventListener("scroll", updateRect, true);
    return () => { clearTimeout(timer); window.removeEventListener("resize", updateRect); window.removeEventListener("scroll", updateRect, true); };
  }, [tourStep, step.target]);

  // Welcome modal (step 0)
  if (isWelcome) {
    return (
      <div style={{
        position: "fixed", inset: 0, zIndex: 10000,
        background: "rgba(0,0,0,0.82)", backdropFilter: "blur(6px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        animation: "fadeUp 0.3s ease",
        fontFamily: "'DM Sans', sans-serif",
      }}>
        <div style={{
          background: "#14151F", border: "1px solid rgba(99,102,241,0.3)",
          borderRadius: 16, padding: "36px 32px", width: "92%", maxWidth: 480,
          boxShadow: "0 24px 64px rgba(0,0,0,0.6), 0 0 40px rgba(99,102,241,0.15)",
          textAlign: "center",
        }}>
          <h2 style={{ margin: "0 0 6px", fontSize: 24, fontWeight: 800, color: "#F8FAFC", letterSpacing: "-0.02em" }}>
            {step.title[lang]}
          </h2>
          <div style={{ margin: "16px 0 20px", fontSize: 14, color: "rgba(255,255,255,0.65)", lineHeight: 1.7, whiteSpace: "pre-line", textAlign: "left" }}>
            {step.text[lang]}
          </div>

          {/* Language selector */}
          <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 20 }}>
            {["es", "en"].map(code => (
              <button
                key={code}
                onClick={() => setLang(code)}
                style={{
                  padding: "8px 20px", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer",
                  background: lang === code ? "rgba(99,102,241,0.2)" : "rgba(255,255,255,0.04)",
                  border: `1px solid ${lang === code ? "rgba(99,102,241,0.5)" : "rgba(255,255,255,0.1)"}`,
                  color: lang === code ? "#A5B4FC" : "rgba(255,255,255,0.4)",
                  fontFamily: "'DM Mono', monospace", letterSpacing: "0.08em",
                  transition: "all 0.15s",
                }}
              >
                {code.toUpperCase()}
              </button>
            ))}
          </div>

          <div style={{ display: "flex", justifyContent: "center", gap: 12 }}>
            <button
              onClick={onSkip}
              style={{
                padding: "10px 22px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer",
                background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
                color: "rgba(255,255,255,0.4)", fontFamily: "'DM Sans', sans-serif",
                transition: "all 0.15s",
              }}
            >
              Skip
            </button>
            <button
              onClick={onNext}
              style={{
                padding: "10px 28px", borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: "pointer",
                background: "linear-gradient(135deg, #6366F1, #4F46E5)", border: "none",
                color: "#fff", fontFamily: "'DM Sans', sans-serif",
                boxShadow: "0 0 20px rgba(99,102,241,0.4)",
                transition: "all 0.15s",
              }}
            >
              {step.btn[lang]}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Tooltip steps with spotlight
  const tooltipStyle = (() => {
    if (!targetRect) return { top: "50%", left: "50%", transform: "translate(-50%, -50%)" };
    const viewH = window.innerHeight;
    const below = targetRect.top + targetRect.height + 16;
    const above = targetRect.top - 16;
    if (below + 200 < viewH) {
      return { top: below, left: Math.max(16, Math.min(targetRect.left, window.innerWidth - 360)), transform: "none" };
    }
    return { top: Math.max(16, above - 200), left: Math.max(16, Math.min(targetRect.left, window.innerWidth - 360)), transform: "none" };
  })();

  return (
    <>
      {/* Dark overlay with spotlight cutout */}
      <div style={{ position: "fixed", inset: 0, zIndex: 9998, pointerEvents: "none" }}>
        <svg width="100%" height="100%" style={{ position: "absolute", inset: 0 }}>
          <defs>
            <mask id="tour-spotlight-mask">
              <rect width="100%" height="100%" fill="white" />
              {targetRect && (
                <rect
                  x={targetRect.left} y={targetRect.top}
                  width={targetRect.width} height={targetRect.height}
                  rx="12" fill="black"
                />
              )}
            </mask>
          </defs>
          <rect width="100%" height="100%" fill="rgba(0,0,0,0.72)" mask="url(#tour-spotlight-mask)" />
        </svg>
      </div>

      {/* Spotlight glow border */}
      {targetRect && (
        <div style={{
          position: "fixed", zIndex: 9999,
          top: targetRect.top, left: targetRect.left,
          width: targetRect.width, height: targetRect.height,
          borderRadius: 12, border: "2px solid rgba(99,102,241,0.5)",
          boxShadow: "0 0 24px rgba(99,102,241,0.25)",
          pointerEvents: "none",
        }} />
      )}

      {/* Click blocker */}
      <div style={{ position: "fixed", inset: 0, zIndex: 9999, cursor: "default" }} onClick={e => e.stopPropagation()} />

      {/* Tooltip */}
      <div style={{
        position: "fixed", zIndex: 10001,
        ...tooltipStyle,
        background: "#14151F", border: "1px solid rgba(99,102,241,0.35)",
        borderRadius: 12, padding: "18px 20px", width: 340, maxWidth: "90vw",
        boxShadow: "0 16px 48px rgba(0,0,0,0.5), 0 0 20px rgba(99,102,241,0.1)",
        animation: "fadeUp 0.25s ease",
        fontFamily: "'DM Sans', sans-serif",
      }}>
        {/* Step counter */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <span style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", fontFamily: "'DM Mono', monospace", letterSpacing: "0.08em" }}>
            {lang === "es" ? `Paso ${tourStep} de ${totalSteps - 1}` : `Step ${tourStep} of ${totalSteps - 1}`}
          </span>
          <button
            onClick={onSkip}
            style={{
              background: "none", border: "none", cursor: "pointer",
              fontSize: 10, color: "rgba(255,255,255,0.3)",
              fontFamily: "'DM Mono', monospace", textDecoration: "underline",
              padding: 0,
            }}
          >
            {lang === "es" ? "Saltar tour" : "Skip Tour"}
          </button>
        </div>

        <h3 style={{ margin: "0 0 6px", fontSize: 15, fontWeight: 700, color: "#F8FAFC" }}>
          {step.title[lang]}
        </h3>
        <p style={{ margin: "0 0 16px", fontSize: 13, color: "rgba(255,255,255,0.6)", lineHeight: 1.6 }}>
          {step.text[lang]}
        </p>

        <button
          onClick={onNext}
          style={{
            padding: "9px 22px", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer",
            background: "linear-gradient(135deg, #6366F1, #4F46E5)", border: "none",
            color: "#fff", fontFamily: "'DM Sans', sans-serif",
            boxShadow: "0 0 16px rgba(99,102,241,0.35)",
            transition: "all 0.15s",
          }}
        >
          {step.btn[lang]}
        </button>
      </div>
    </>
  );
}

// ─── BADGE DE SCORE ───────────────────────────────────────────────────────────
function ScoreBadge({ score, t, analysisMode }) {
  const color = score >= 80 ? "#10B981" : score >= 60 ? "#F59E0B" : "#EF4444";
  const label = score >= 80 ? t.scoreSuitable : score >= 60 ? t.scoreReview : t.scoreNotSuitable;
  const modeColor = analysisMode === "tool_use" ? "#34D399" : analysisMode === "ai" ? "#818CF8" : analysisMode === "agentic" ? "#F59E0B" : "rgba(255,255,255,0.3)";
  const modeLabel = analysisMode === "tool_use" ? (t.toolUseMode || "Tool Use") : analysisMode === "ai" ? t.aiMode : analysisMode === "agentic" ? (t.agenticMode || "Agentic") : t.localMode;
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
        position: "relative",
      }}>
        {score}
        {analysisMode && (
          <span style={{
            position: "absolute", top: -6, right: -6,
            fontSize: 7, padding: "1px 4px", borderRadius: 3,
            background: analysisMode === "tool_use" ? "rgba(52,211,153,0.25)" : analysisMode === "ai" ? "rgba(99,102,241,0.25)" : analysisMode === "agentic" ? "rgba(245,158,11,0.25)" : "rgba(255,255,255,0.08)",
            border: `1px solid ${modeColor}`,
            color: modeColor, fontWeight: 700,
            fontFamily: "'DM Mono', monospace",
          }}>{modeLabel}</span>
        )}
      </div>
      <span style={{ fontSize: 9, color, fontFamily: "'DM Mono', monospace", letterSpacing: "0.08em", display: "block", marginTop: 3 }}>
        {label}
      </span>
    </div>
  );
}

// ─── CANDIDATE CARD ───────────────────────────────────────────────────────────
function CandidateCard({ candidate, rank, onAnalyze, analyzing, result, globalAnalyzing, cardRef, onRemove, isCustom, t }) {
  const [expanded, setExpanded] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [justFinished, setJustFinished] = useState(false);
  const [copied, setCopied] = useState(false);
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
        {result ? <ScoreBadge score={result.score} t={t} analysisMode={result.analysisMode} /> : (
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
              {result.titulo} &middot; {result.experiencia_anos} {t.yrsExp}
            </p>
          )}
          {!result && (
            <p style={{ margin: "3px 0 0", fontSize: 11, color: analyzing ? "#818CF8" : "rgba(255,255,255,0.3)", fontStyle: "italic" }}>
              {analyzing ? t.analyzingWith : t.notAnalyzed}
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
              {expanded ? t.close : t.viewAnalysis}
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
            {analyzing ? t.analyzing : result ? t.reAnalyze : t.analyzeAI}
          </button>
          {isCustom && (
            <button
              onClick={() => onRemove(candidate.id)}
              title={t.removeCandidateTitle}
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
          {/* Dual score display when AI or Tool Use was used */}
          {(result.analysisMode === "ai" || result.analysisMode === "tool_use") && (
            <div style={{ display: "flex", gap: 10, marginTop: 14, marginBottom: 4, flexWrap: "wrap" }}>
              <div style={{ padding: "6px 12px", borderRadius: 6, background: result.analysisMode === "tool_use" ? "rgba(52,211,153,0.08)" : "rgba(99,102,241,0.08)", border: `1px solid ${result.analysisMode === "tool_use" ? "rgba(52,211,153,0.2)" : "rgba(99,102,241,0.2)"}`, fontSize: 11, color: result.analysisMode === "tool_use" ? "#6EE7B7" : "#A5B4FC", fontFamily: "'DM Mono', monospace" }}>
                {t.aiScoreLabel}: <b>{result.aiScore}</b>
              </div>
              <div style={{ padding: "6px 12px", borderRadius: 6, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", fontSize: 11, color: "rgba(255,255,255,0.5)", fontFamily: "'DM Mono', monospace" }}>
                {t.keywordScore}: <b>{result.localScore}</b>
              </div>
              <div style={{
                padding: "6px 12px", borderRadius: 6, fontSize: 11, fontFamily: "'DM Mono', monospace",
                background: result.confidence === "high" ? "rgba(16,185,129,0.08)" : result.confidence === "medium" ? "rgba(245,158,11,0.08)" : "rgba(239,68,68,0.08)",
                border: `1px solid ${result.confidence === "high" ? "rgba(16,185,129,0.2)" : result.confidence === "medium" ? "rgba(245,158,11,0.2)" : "rgba(239,68,68,0.2)"}`,
                color: result.confidence === "high" ? "#10B981" : result.confidence === "medium" ? "#F59E0B" : "#EF4444",
              }}>
                {result.confidence === "high" ? t.confidenceHigh : result.confidence === "medium" ? t.confidenceMedium : t.confidenceLow}
              </div>
              {result.analysisMode === "tool_use" && (
                <div style={{ padding: "6px 12px", borderRadius: 6, background: "rgba(52,211,153,0.08)", border: "1px solid rgba(52,211,153,0.2)", fontSize: 11, color: "#34D399", fontFamily: "'DM Mono', monospace", fontWeight: 700 }}>
                  {t.toolUseMode || "Tool Use"} ({result.toolCallCount || 0} {t.toolCalls || "calls"})
                </div>
              )}
            </div>
          )}

          {/* Agentic Pipeline Trace */}
          {result.analysisMode === "agentic" && result.pipeline && (
            <div style={{ display: "flex", gap: 6, marginTop: 14, marginBottom: 4, flexWrap: "wrap", alignItems: "center" }}>
              <span style={{ fontSize: 9, fontWeight: 700, color: "#F59E0B", fontFamily: "'DM Mono', monospace", letterSpacing: "0.08em", textTransform: "uppercase", marginRight: 4 }}>
                {t.pipelineTitle || "Pipeline"}:
              </span>
              {result.pipeline.map((step, i) => (
                <span key={i} style={{
                  fontSize: 9, padding: "3px 8px", borderRadius: 4,
                  background: "rgba(245,158,11,0.08)",
                  border: "1px solid rgba(245,158,11,0.2)",
                  color: "#FCD34D", fontFamily: "'DM Mono', monospace",
                  display: "inline-flex", alignItems: "center", gap: 4,
                }}>
                  <span style={{ fontWeight: 700 }}>{step.agent}</span>
                  <span style={{ color: "rgba(255,255,255,0.35)" }}>
                    {step.skills ? step.skills : step.level ? `${step.level} / ${step.years}y` : step.matched !== undefined ? `${step.matched}ok ${step.missing}gap ${step.bonus}+` : `${step.score}pts`}
                  </span>
                  {i < result.pipeline.length - 1 && <span style={{ color: "rgba(245,158,11,0.4)", marginLeft: 2 }}>&rarr;</span>}
                </span>
              ))}
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginTop: (result.analysisMode === "ai" || result.analysisMode === "tool_use" || result.analysisMode === "agentic") ? 4 : 14 }}>
            {/* Fortalezas */}
            <div style={{ background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.15)", borderRadius: 8, padding: 12 }}>
              <p style={{ margin: "0 0 8px", fontSize: 10, fontWeight: 700, color: "#10B981", letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "'DM Mono', monospace" }}>&#10003; {t.strengths}</p>
              {result.fortalezas?.map((f, i) => (
                <p key={i} style={{ margin: "0 0 4px", fontSize: 11, color: "#D1FAE5", lineHeight: 1.5 }}>&#8226; {f}</p>
              ))}
            </div>
            {/* Debilidades */}
            <div style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)", borderRadius: 8, padding: 12 }}>
              <p style={{ margin: "0 0 8px", fontSize: 10, fontWeight: 700, color: "#EF4444", letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "'DM Mono', monospace" }}>&#10007; {t.gaps}</p>
              {result.brechas?.map((b, i) => (
                <p key={i} style={{ margin: "0 0 4px", fontSize: 11, color: "#FEE2E2", lineHeight: 1.5 }}>&#8226; {b}</p>
              ))}
            </div>
            {/* Veredicto */}
            <div style={{ background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.15)", borderRadius: 8, padding: 12 }}>
              <p style={{ margin: "0 0 8px", fontSize: 10, fontWeight: 700, color: "#818CF8", letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "'DM Mono', monospace" }}>{t.verdict}</p>
              <p style={{ margin: "0 0 6px", fontSize: 11, color: "#E0E7FF", lineHeight: 1.5 }}>{result.veredicto}</p>
              <p style={{ margin: 0, fontSize: 10, color: "rgba(255,255,255,0.4)", fontStyle: "italic" }}>
                {result.siguiente_paso}
              </p>
            </div>
          </div>

          {/* Pregunta de entrevista */}
          {result.pregunta_entrevista && (
            <div style={{ marginTop: 10, padding: "10px 14px", background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.15)", borderRadius: 8 }}>
              <span style={{ fontSize: 10, color: "#F59E0B", fontWeight: 700, fontFamily: "'DM Mono', monospace" }}>{t.interviewQuestion}</span>
              <span style={{ fontSize: 11, color: "#FEF3C7" }}>{result.pregunta_entrevista}</span>
            </div>
          )}

          {/* Copy to Clipboard */}
          <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
            <button
              onClick={() => {
                const text = `${candidate.name} - Score: ${result.score}/100${(result.analysisMode === "ai" || result.analysisMode === "tool_use") ? ` (AI: ${result.aiScore}, Keywords: ${result.localScore}${result.analysisMode === "tool_use" ? ", Mode: Tool Use" : ""})` : ""}\n\nStrengths:\n${result.fortalezas?.map(f => `- ${f}`).join("\n")}\n\nGaps:\n${result.brechas?.map(b => `- ${b}`).join("\n")}\n\nVerdict: ${result.veredicto}\nNext step: ${result.siguiente_paso}\nInterview question: ${result.pregunta_entrevista}`;
                navigator.clipboard.writeText(text).then(() => {
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                });
              }}
              style={{
                padding: "5px 12px", borderRadius: 6, fontSize: 10, fontWeight: 600, cursor: "pointer",
                background: copied ? "rgba(16,185,129,0.15)" : "rgba(255,255,255,0.05)",
                border: `1px solid ${copied ? "rgba(16,185,129,0.3)" : "rgba(255,255,255,0.1)"}`,
                color: copied ? "#10B981" : "rgba(255,255,255,0.4)",
                fontFamily: "'DM Mono', monospace", transition: "all 0.15s",
              }}
            >
              {copied ? t.copied : t.copyToClipboard}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── ADD CANDIDATE MODAL ────────────────────────────────────────────────────
function AddCandidateModal({ onAdd, onClose, t }) {
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
      let text = ev.target?.result || "";
      // For PDF files read as text, clean up garbled binary content
      if (file.name.toLowerCase().endsWith(".pdf")) {
        // Try to extract readable text from PDF binary
        const readable = text.replace(/[^\x20-\x7E\n\r\t]/g, " ").replace(/\s{3,}/g, "\n").trim();
        setCvText(readable.length > 50 ? readable : "");
      } else {
        setCvText(text);
      }
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
          {t.addCandidateTitle}
        </h3>
        <p style={{ margin: "0 0 18px", fontSize: 12, color: "rgba(255,255,255,0.4)" }}>
          {t.addCandidateDesc}
        </p>

        {/* Name */}
        <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)", fontFamily: "'DM Mono', monospace" }}>
          {t.candidateName}
        </label>
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder={t.candidateNamePlaceholder}
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
            {t.pasteText}
          </button>
          <button onClick={() => setMode("file")} style={{
            padding: "5px 14px", borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: "pointer",
            background: mode === "file" ? "rgba(99,102,241,0.2)" : "rgba(255,255,255,0.04)",
            border: `1px solid ${mode === "file" ? "rgba(99,102,241,0.4)" : "rgba(255,255,255,0.08)"}`,
            color: mode === "file" ? "#A5B4FC" : "rgba(255,255,255,0.4)",
            fontFamily: "'DM Sans', sans-serif",
          }}>
            {t.uploadFilePdf}
          </button>
        </div>

        {mode === "paste" ? (
          <>
            <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)", fontFamily: "'DM Mono', monospace" }}>
              {t.cvText}
            </label>
            <textarea
              value={cvText}
              onChange={e => setCvText(e.target.value)}
              placeholder={t.cvPlaceholder}
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
            <input ref={fileRef} type="file" accept=".txt,.text,.pdf" onChange={handleFileUpload} style={{ display: "none" }} />
            <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.4)" }}>
              {cvText ? t.fileLoaded(cvText.length) : t.clickToSelect}
            </p>
            <p style={{ margin: "6px 0 0", fontSize: 10, color: "rgba(255,255,255,0.25)", fontStyle: "italic" }}>
              {t.pdfNote}
            </p>
            {cvText && (
              <p style={{ margin: "6px 0 0", fontSize: 11, color: "#818CF8" }}>
                {t.preview}: {cvText.substring(0, 80)}...
              </p>
            )}
          </div>
        )}

        <p style={{ margin: "6px 0 0", fontSize: 10, color: cvText.trim().length >= 50 ? "rgba(255,255,255,0.3)" : "#EF4444", fontFamily: "'DM Mono', monospace" }}>
          {t.minCharsCV(cvText.trim().length)}
        </p>

        {/* Buttons */}
        <div style={{ display: "flex", gap: 10, marginTop: 18, justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{
            padding: "10px 20px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer",
            background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
            color: "rgba(255,255,255,0.5)", fontFamily: "'DM Sans', sans-serif",
          }}>
            {t.cancel}
          </button>
          <button onClick={handleSubmit} disabled={!isValid} style={{
            padding: "10px 20px", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: isValid ? "pointer" : "default",
            background: isValid ? "linear-gradient(135deg, #6366F1, #4F46E5)" : "rgba(255,255,255,0.05)",
            border: "none",
            color: isValid ? "#fff" : "#6B7280", fontFamily: "'DM Sans', sans-serif",
            boxShadow: isValid ? "0 0 16px rgba(99,102,241,0.4)" : "none",
          }}>
            {t.addCandidateBtn}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── COMPARATIVE ANALYSIS PANEL ─────────────────────────────────────────────
function ComparativePanel({ analysis, t }) {
  if (!analysis) return null;

  return (
    <div style={{
      marginTop: 16, padding: 18,
      background: "rgba(99,102,241,0.04)", border: "1px solid rgba(99,102,241,0.15)",
      borderRadius: 12, animation: "fadeUp 0.4s ease",
    }}>
      <p style={{ margin: "0 0 14px", fontSize: 11, fontWeight: 700, color: "#818CF8", letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "'DM Mono', monospace" }}>
        {t.comparativeAnalysis} &middot; {analysis.totalAnalyzed} {t.candidates.toLowerCase()}
      </p>

      {/* Best candidate */}
      <div style={{ padding: 12, background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.15)", borderRadius: 8, marginBottom: 12 }}>
        <p style={{ margin: "0 0 4px", fontSize: 10, fontWeight: 700, color: "#10B981", letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "'DM Mono', monospace" }}>
          {t.bestCandidate}
        </p>
        <p style={{ margin: 0, fontSize: 12, color: "#D1FAE5", lineHeight: 1.5 }}>
          {analysis.bestExplanation}
        </p>
      </div>

      {/* Common gaps */}
      {analysis.commonGaps.length > 0 && (
        <div style={{ padding: 12, background: "rgba(239,68,68,0.04)", border: "1px solid rgba(239,68,68,0.12)", borderRadius: 8, marginBottom: 12 }}>
          <p style={{ margin: "0 0 8px", fontSize: 10, fontWeight: 700, color: "#EF4444", letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "'DM Mono', monospace" }}>
            {t.commonGaps}
          </p>
          {analysis.commonGaps.map((g, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
              <span style={{ fontSize: 11, color: "#FEE2E2" }}>{g.skill}</span>
              <span style={{ fontSize: 10, color: "#EF4444", fontFamily: "'DM Mono', monospace" }}>
                {t.uncovered(g.count, analysis.totalAnalyzed, g.pct)}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Skills heatmap */}
      {analysis.heatmap.length > 0 && (
        <div style={{ padding: 12, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 8 }}>
          <p style={{ margin: "0 0 10px", fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.5)", letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "'DM Mono', monospace" }}>
            {t.skillCoverage}
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
                }} title={h.candidates.length > 0 ? `${t.coveredBy}: ${h.candidates.join(", ")}` : t.noCoverage}>
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

// ─── ANALYTICS PANEL ──────────────────────────────────────────────────────────
function AnalyticsPanel({ results, candidates, t }) {
  const analyzed = candidates.filter(c => results[c.id]);
  if (analyzed.length < 2) return null;

  const scores = analyzed.map(c => results[c.id].score);
  const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);

  // Score distribution
  const dist = { "0-40": 0, "40-60": 0, "60-80": 0, "80-100": 0 };
  for (const s of scores) {
    if (s < 40) dist["0-40"]++;
    else if (s < 60) dist["40-60"]++;
    else if (s < 80) dist["60-80"]++;
    else dist["80-100"]++;
  }
  const maxDist = Math.max(...Object.values(dist), 1);

  // Common missing skills
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
  const topGaps = Object.entries(gapCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);

  // Total analysis time
  const totalTime = analyzed.reduce((sum, c) => sum + (results[c.id].analysisTime || 0), 0);

  const distColors = { "0-40": "#EF4444", "40-60": "#F59E0B", "60-80": "#818CF8", "80-100": "#10B981" };
  const distLabels = { "0-40": t.range0_40, "40-60": t.range40_60, "60-80": t.range60_80, "80-100": t.range80_100 };

  return (
    <div style={{
      marginTop: 16, padding: 18,
      background: "rgba(245,158,11,0.04)", border: "1px solid rgba(245,158,11,0.15)",
      borderRadius: 12, animation: "fadeUp 0.4s ease",
    }}>
      <p style={{ margin: "0 0 14px", fontSize: 11, fontWeight: 700, color: "#F59E0B", letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "'DM Mono', monospace" }}>
        {t.analyticsTitle}
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {/* Score Distribution */}
        <div style={{ padding: 12, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 8 }}>
          <p style={{ margin: "0 0 10px", fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.5)", letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "'DM Mono', monospace" }}>
            {t.scoreDistribution}
          </p>
          {Object.entries(dist).map(([range, count]) => (
            <div key={range} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <span style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", fontFamily: "'DM Mono', monospace", width: 36, textAlign: "right" }}>
                {distLabels[range]}
              </span>
              <div style={{ flex: 1, height: 14, background: "rgba(255,255,255,0.03)", borderRadius: 3, overflow: "hidden" }}>
                <div style={{
                  width: `${(count / maxDist) * 100}%`, height: "100%",
                  background: distColors[range], borderRadius: 3,
                  transition: "width 0.6s ease",
                  minWidth: count > 0 ? 4 : 0,
                }} />
              </div>
              <span style={{ fontSize: 10, color: distColors[range], fontFamily: "'DM Mono', monospace", width: 16, fontWeight: 700 }}>
                {count}
              </span>
            </div>
          ))}
          <div style={{ marginTop: 8, textAlign: "center" }}>
            <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", fontFamily: "'DM Mono', monospace" }}>{t.avgScoreLabel}: </span>
            <span style={{ fontSize: 14, fontWeight: 800, color: avg >= 80 ? "#10B981" : avg >= 60 ? "#F59E0B" : "#EF4444", fontFamily: "'DM Mono', monospace" }}>{avg}</span>
          </div>
        </div>

        {/* Missing Skills + Time */}
        <div style={{ padding: 12, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 8 }}>
          <p style={{ margin: "0 0 10px", fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.5)", letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "'DM Mono', monospace" }}>
            {t.commonMissingSkills}
          </p>
          {topGaps.length > 0 ? topGaps.map(([skill, count], i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ fontSize: 11, color: "#FEE2E2" }}>{skill}</span>
              <span style={{ fontSize: 10, color: "#EF4444", fontFamily: "'DM Mono', monospace" }}>{count}/{analyzed.length}</span>
            </div>
          )) : (
            <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.3)", fontStyle: "italic" }}>--</p>
          )}
          {totalTime > 0 && (
            <div style={{ marginTop: 10, paddingTop: 8, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
              <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", fontFamily: "'DM Mono', monospace" }}>{t.totalAnalysisTime}: </span>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#818CF8", fontFamily: "'DM Mono', monospace" }}>{(totalTime / 1000).toFixed(1)}s</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── GENERATE TEXT REPORT ─────────────────────────────────────────────────────
function generateReport(candidates, results, jobDesc, t) {
  const lines = [];
  lines.push(t.reportTitle);
  lines.push(`${t.reportDate}: ${new Date().toLocaleDateString("es-MX")}`);
  lines.push("");
  lines.push(t.reportJobDesc);
  lines.push(jobDesc);
  lines.push("");
  lines.push("-".repeat(60));

  const sorted = [...candidates]
    .filter(c => results[c.id])
    .sort((a, b) => (results[b.id]?.score || 0) - (results[a.id]?.score || 0));

  sorted.forEach((c, i) => {
    const r = results[c.id];
    const label = r.score >= 80 ? t.reportSuitable : r.score >= 60 ? t.reportReview : t.reportNotSuitable;
    lines.push("");
    lines.push(`#${i + 1} -- ${c.name} [Score: ${r.score}/100 -- ${label}]`);
    lines.push(`   Titulo: ${r.titulo} | Experiencia: ${r.experiencia_anos} anos`);
    lines.push(`   Modo de analisis: ${r.analysisMode === "tool_use" ? "Claude Tool Use (Agentic)" : r.analysisMode === "ai" ? "Claude AI" : "Local (keywords)"}`);
    if (r.analysisMode === "ai" || r.analysisMode === "tool_use") {
      lines.push(`   AI Score: ${r.aiScore} | Keyword Score: ${r.localScore} | Final: ${r.score}`);
      lines.push(`   Confianza: ${r.confidence}${r.analysisMode === "tool_use" ? ` | Tool calls: ${r.toolCallCount || 0}` : ""}`);
    }
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
  lines.push(t.reportSummary(sorted.length, aptos, revisar, noAptos));

  return lines.join("\n");
}

// ─── APP ──────────────────────────────────────────────────────────────────────
function ContactBar({ t }) {
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
      <span style={{ color: '#E2E8F0', fontSize: 14, fontWeight: 500 }}>{t.ctaText}</span>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <a href="https://impulso-ia-navy.vercel.app/#contacto" target="_blank" rel="noopener noreferrer" style={{ padding: '8px 18px', borderRadius: 8, background: 'linear-gradient(135deg, #6366F1, #4F46E5)', color: '#fff', fontSize: 13, fontWeight: 600, textDecoration: 'none', transition: 'transform 0.2s' }}>{t.ctaButton}</a>
        <a href="https://wa.me/525579605324?text=Hola%20Christian%2C%20me%20interesa%20saber%20m%C3%A1s%20sobre%20tus%20servicios%20de%20IA" target="_blank" rel="noopener noreferrer" style={{ padding: '8px 18px', borderRadius: 8, background: 'rgba(37,211,102,0.15)', border: '1px solid rgba(37,211,102,0.3)', color: '#25D366', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>WhatsApp</a>
        <button onClick={dismiss} style={{ background: 'none', border: 'none', color: '#64748B', fontSize: 18, cursor: 'pointer', padding: '4px 8px' }}>✕</button>
      </div>
    </div>
  );
}

export default function CVScreener() {
  const [lang, setLang] = useState("es");
  const t = TRANSLATIONS[lang];

  // Load saved state from localStorage
  const savedJobDesc = (() => { try { return localStorage.getItem("hrscout_jobDesc"); } catch { return null; } })();
  const savedResults = (() => { try { const r = localStorage.getItem("hrscout_results"); return r ? JSON.parse(r) : null; } catch { return null; } })();

  const [jobDesc, setJobDesc] = useState(savedJobDesc || `Especialista en IA & Automatizacion
Buscamos profesional con experiencia en:
- Implementacion de agentes IA y workflows automatizados (Make.com, n8n, Zapier)
- Prompt engineering avanzado con Claude, GPT-4o y Gemini
- Python basico/intermedio para scripting y automatizacion
- Integracion de APIs y Webhooks
- Ingles intermedio minimo (B2)
- Capacidad para trabajar en equipo y comunicar conceptos tecnicos a perfiles no tecnicos
Indispensable: experiencia con LLMs, automatizacion de procesos
Deseable: experiencia en startups, certificaciones en IA, portafolio de proyectos.`);

  const [presetKey, setPresetKey] = useState(savedJobDesc ? "" : "Especialista en IA");
  const [candidates, setCandidates] = useState(SAMPLE_CVS);
  const [results, setResults] = useState(savedResults || {});
  const [analyzingId, setAnalyzingId] = useState(null);
  const [analyzingAll, setAnalyzingAll] = useState(false);
  const [ranked, setRanked] = useState([]);
  const [filter, setFilter] = useState("all");
  const [progressText, setProgressText] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [nextId, setNextId] = useState(100);
  const [comparativeAnalysis, setComparativeAnalysis] = useState(null);
  const [apiKey, setApiKey] = useState(() => { try { return localStorage.getItem("hrscout_apiKey") || ""; } catch { return ""; } });
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const [tourStep, setTourStep] = useState(0);
  const [tourActive, setTourActive] = useState(true);
  const cardRefs = useRef({});

  const isJobDescValid = jobDesc.trim().length >= 20;
  const customIds = useRef(new Set());

  // Persist results to localStorage
  useEffect(() => {
    try { localStorage.setItem("hrscout_results", JSON.stringify(results)); } catch {}
  }, [results]);

  // Persist jobDesc to localStorage
  useEffect(() => {
    try { localStorage.setItem("hrscout_jobDesc", jobDesc); } catch {}
  }, [jobDesc]);

  // Persist API key
  useEffect(() => {
    try { if (apiKey) localStorage.setItem("hrscout_apiKey", apiKey); else localStorage.removeItem("hrscout_apiKey"); } catch {}
  }, [apiKey]);

  // Restore rankings from saved results on mount
  useEffect(() => {
    if (savedResults && Object.keys(savedResults).length > 0) {
      const comp = generateComparativeAnalysis(candidates, savedResults, jobDesc);
      setComparativeAnalysis(comp);
      const newRanked = candidates
        .filter(c => savedResults[c.id])
        .sort((a, b) => (savedResults[b.id]?.score || 0) - (savedResults[a.id]?.score || 0));
      setRanked(newRanked.map(c => c.id));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const clearResults = () => {
    if (!window.confirm(t.clearConfirm)) return;
    setResults({});
    setRanked([]);
    setComparativeAnalysis(null);
    try { localStorage.removeItem("hrscout_results"); } catch {}
  };

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

    const localResult = agenticAnalyze(jobDesc, candidate.cv, candidate.name, lang);

    // Try tool use first (Claude agentic), fall back to simple Claude, then local agentic
    let parsed = await analyzeWithToolUse(candidate.cv, jobDesc, localResult, apiKey);
    if (!parsed) {
      parsed = await analyzeCVWithClaude(candidate.cv, jobDesc, localResult, apiKey);
    }

    setResults(prev => {
      const updated = { ...prev, [candidate.id]: parsed };
      updateRankings(updated, candidates);
      return updated;
    });
    setAnalyzingId(null);
  }, [analyzingId, candidates, jobDesc, updateRankings, apiKey, lang]);

  const analyzeAll = async () => {
    if (!isJobDescValid) return;
    setAnalyzingAll(true);
    const allResults = { ...results };

    for (let i = 0; i < candidates.length; i++) {
      const c = candidates[i];
      setProgressText(t.analyzingName(i + 1, candidates.length, c.name));
      setAnalyzingId(c.id);

      const ref = cardRefs.current[c.id];
      if (ref) {
        ref.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }

      const localResult = agenticAnalyze(jobDesc, c.cv, c.name, lang);
      let parsed = await analyzeWithToolUse(c.cv, jobDesc, localResult, apiKey);
      if (!parsed) {
        parsed = await analyzeCVWithClaude(c.cv, jobDesc, localResult, apiKey);
      }
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
    const text = generateReport(candidates, results, jobDesc, t);
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `reporte-hrscout-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleTourNext = useCallback(async () => {
    const nextStep = tourStep + 1;
    const currentStep = TOUR_STEPS[tourStep];

    if (currentStep?.action === "selectPreset") {
      // Auto-select "Especialista en IA" preset
      setPresetKey("Especialista en IA");
      setJobDesc(PRESET_JOBS["Especialista en IA"]);
    }

    if (currentStep?.action === "analyzeAll") {
      // Auto-trigger analysis
      const currentJobDesc = PRESET_JOBS["Especialista en IA"] || jobDesc;
      if (currentJobDesc.trim().length >= 20) {
        setTourStep(nextStep);
        setAnalyzingAll(true);
        const allRes = {};
        for (let i = 0; i < candidates.length; i++) {
          const c = candidates[i];
          setProgressText(t.analyzingName(i + 1, candidates.length, c.name));
          setAnalyzingId(c.id);
          const ref = cardRefs.current[c.id];
          if (ref) ref.scrollIntoView({ behavior: "smooth", block: "nearest" });
          const localResult = agenticAnalyze(currentJobDesc, c.cv, c.name, lang);
          allRes[c.id] = localResult;
          setResults(prev => {
            const updated = { ...prev, [c.id]: allRes[c.id] };
            updateRankings(updated, candidates);
            return updated;
          });
          await new Promise(r => setTimeout(r, 150));
        }
        setAnalyzingId(null);
        setAnalyzingAll(false);
        setProgressText("");
        return; // Already advanced step
      }
    }

    if (nextStep >= TOUR_STEPS.length) {
      setTourActive(false);
      return;
    }
    setTourStep(nextStep);
  }, [tourStep, candidates, jobDesc, t, updateRankings]);

  const handleTourSkip = useCallback(() => {
    setTourActive(false);
  }, []);

  return (
    <>
    {/* Tour Overlay */}
    <TourOverlay
      tourStep={tourStep}
      tourActive={tourActive}
      lang={lang}
      setLang={setLang}
      onNext={handleTourNext}
      onSkip={handleTourSkip}
      totalSteps={TOUR_STEPS.length}
    />

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
          t={t}
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
              {t.subtitle}
            </p>
          </div>

          {/* Lang toggle + Stats */}
          <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
            <div style={{
              display: "flex",
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 8,
              overflow: "hidden",
              height: 34,
              alignSelf: "center",
            }}>
              {["ES", "EN"].map((code) => {
                const isActive = lang === code.toLowerCase();
                return (
                  <button
                    key={code}
                    onClick={() => setLang(code.toLowerCase())}
                    style={{
                      padding: "0 12px",
                      background: isActive ? "rgba(99,102,241,0.18)" : "transparent",
                      border: "none",
                      cursor: "pointer",
                      fontSize: 12,
                      fontWeight: isActive ? 700 : 400,
                      color: isActive ? "#818CF8" : "rgba(255,255,255,0.35)",
                      fontFamily: "'DM Mono', monospace",
                      letterSpacing: "0.05em",
                      transition: "all 0.15s",
                      borderRight: code === "ES" ? "1px solid rgba(255,255,255,0.08)" : "none",
                    }}
                  >
                    {code}
                  </button>
                );
              })}
            </div>
            {[
              { label: t.analyzed, value: `${analyzed}/${candidates.length}` },
              { label: t.suitable, value: aptos, color: "#10B981" },
              { label: t.avgScore, value: analyzed > 0 ? avgScore : "--", color: "#818CF8" },
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
          <div data-tour="job-desc">
            <div style={{ marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)", fontFamily: "'DM Mono', monospace" }}>
                {t.jobDesc}
              </label>
            </div>

            {/* Preset dropdown */}
            <select
              data-tour="preset-select"
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
              <option value="" style={{ background: "#1a1b26", color: "#A5B4FC" }}>{t.selectPreset}</option>
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
                {t.minChars(jobDesc.trim().length)}
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
                  {progressText || t.analyzing}
                </>
              ) : allAnalyzed ? t.reAnalyzeAll : t.analyzeAll}
            </button>

            {/* API Key Input */}
            <div style={{ marginTop: 10, padding: 10, background: "rgba(99,102,241,0.04)", border: "1px solid rgba(99,102,241,0.12)", borderRadius: 8 }}>
              {!showApiKeyInput && !apiKey ? (
                <button onClick={() => setShowApiKeyInput(true)} style={{
                  width: "100%", padding: "8px", borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: "pointer",
                  background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.25)", color: "#A5B4FC",
                  fontFamily: "'DM Mono', monospace",
                }}>
                  {t.apiKeyLabel}
                </button>
              ) : apiKey ? (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 10, color: "#10B981", fontFamily: "'DM Mono', monospace" }}>
                    &#10003; {t.apiKeySet}
                  </span>
                  <button onClick={() => { setApiKey(""); setShowApiKeyInput(false); }} style={{
                    padding: "3px 8px", borderRadius: 4, fontSize: 10, cursor: "pointer",
                    background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#EF4444",
                    fontFamily: "'DM Mono', monospace",
                  }}>
                    {t.apiKeyRemove}
                  </button>
                </div>
              ) : (
                <div>
                  <input
                    type="password"
                    placeholder={t.apiKeyPlaceholder}
                    value={apiKey}
                    onChange={e => setApiKey(e.target.value)}
                    style={{
                      width: "100%", padding: "8px 10px", borderRadius: 6, fontSize: 11,
                      background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
                      color: "#D1D5DB", fontFamily: "'DM Mono', monospace", outline: "none",
                    }}
                    onKeyDown={e => { if (e.key === "Escape") setShowApiKeyInput(false); }}
                  />
                  <p style={{ margin: "4px 0 0", fontSize: 9, color: "rgba(255,255,255,0.25)", fontStyle: "italic" }}>
                    {t.apiKeyLabel}
                  </p>
                </div>
              )}
            </div>

            {/* Download report button */}
            {analyzed > 0 && (
              <div data-tour="export-area" style={{ display: "flex", gap: 6, marginTop: 8 }}>
                <button
                  onClick={downloadReport}
                  style={{
                    flex: 1, padding: "11px",
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
                  {t.downloadReport}
                </button>
                <button
                  onClick={() => {
                    const sorted = [...candidates].filter(c => results[c.id]).sort((a, b) => (results[b.id]?.score || 0) - (results[a.id]?.score || 0));
                    const data = sorted.map(c => ({ name: c.name, ...results[c.id] }));
                    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `hrscout-${new Date().toISOString().slice(0, 10)}.json`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  style={{
                    padding: "11px 14px",
                    background: "rgba(99,102,241,0.1)",
                    border: "1px solid rgba(99,102,241,0.25)",
                    borderRadius: 10,
                    fontSize: 12, fontWeight: 700, color: "#818CF8",
                    cursor: "pointer",
                    fontFamily: "'DM Sans', sans-serif",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = "rgba(99,102,241,0.18)"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "rgba(99,102,241,0.1)"; }}
                >
                  {t.exportJSON}
                </button>
              </div>
            )}

            {/* Clear results */}
            {analyzed > 0 && (
              <button
                onClick={clearResults}
                style={{
                  width: "100%", marginTop: 6, padding: "9px",
                  background: "rgba(239,68,68,0.06)",
                  border: "1px solid rgba(239,68,68,0.15)",
                  borderRadius: 10,
                  fontSize: 11, fontWeight: 600, color: "#EF4444",
                  cursor: "pointer",
                  fontFamily: "'DM Sans', sans-serif",
                  transition: "all 0.2s",
                }}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(239,68,68,0.12)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "rgba(239,68,68,0.06)"; }}
              >
                {t.clearResults}
              </button>
            )}

            {analyzed > 0 && (
              <div style={{
                marginTop: 12, padding: 12,
                background: "rgba(99,102,241,0.06)",
                border: "1px solid rgba(99,102,241,0.15)",
                borderRadius: 8, animation: "fadeUp 0.3s ease",
              }}>
                <p style={{ margin: "0 0 8px", fontSize: 10, fontWeight: 700, color: "#818CF8", letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "'DM Mono', monospace" }}>{t.processSummary}</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {[
                    { label: t.totalCandidates, value: candidates.length },
                    { label: t.suitableGte80, value: aptos, color: "#10B981" },
                    { label: t.reviewRange, value: Object.values(results).filter(r => r.score >= 60 && r.score < 80).length, color: "#F59E0B" },
                    { label: t.notSuitableLt60, value: Object.values(results).filter(r => r.score < 60).length, color: "#EF4444" },
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
          <div data-tour="candidates">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)", fontFamily: "'DM Mono', monospace" }}>
                {t.candidates} &middot; {ranked.length > 0 ? t.sortedByFit : t.unsorted}
              </label>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                {ranked.length > 0 && (
                  <span style={{ fontSize: 10, color: "#818CF8", fontFamily: "'DM Mono', monospace" }}>
                    {t.top}: {sortedCandidates[0]?.name}
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
                  {t.addCandidate}
                </button>
              </div>
            </div>

            {/* Filter bar */}
            {analyzed > 0 && (
              <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
                {[
                  { id: "all", label: t.filterAll, color: "#818CF8" },
                  { id: "apto", label: t.filterSuitable, color: "#10B981" },
                  { id: "revisar", label: t.filterReview, color: "#F59E0B" },
                  { id: "no_apto", label: t.filterNotSuitable, color: "#EF4444" },
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
                <div key={c.id} data-tour={i === 0 ? "candidate-0" : undefined}>
                  <CandidateCard
                    candidate={c}
                    rank={i + 1}
                    onAnalyze={analyzeCandidate}
                    analyzing={analyzingId === c.id}
                    globalAnalyzing={analyzingAll}
                    result={results[c.id]}
                    cardRef={el => { cardRefs.current[c.id] = el; }}
                    onRemove={handleRemoveCandidate}
                    isCustom={customIds.current.has(c.id)}
                    t={t}
                  />
                </div>
              ))}
              {filteredCandidates.length === 0 && analyzed > 0 && (
                <div style={{ textAlign: "center", padding: 40, color: "rgba(255,255,255,0.3)", fontSize: 13 }}>
                  {t.noCandidatesInCategory}
                </div>
              )}
            </div>

            {/* Comparative Analysis */}
            <ComparativePanel analysis={comparativeAnalysis} t={t} />

            {/* Analytics Panel */}
            <AnalyticsPanel results={results} candidates={candidates} t={t} />
          </div>
        </div>

        <p style={{ textAlign: "center", marginTop: 20, fontSize: 10, color: "rgba(255,255,255,0.1)", fontFamily: "'DM Mono', monospace", letterSpacing: "0.1em" }}>
          {t.footer}
        </p>
      </div>
    </div>
    <ContactBar t={t} />
    </>
  );
}
