// Genera preguntas de entrevista basadas en el analisis del CV
export function generateInterviewQuestions(analysisResult, jobDescription, lang = "es") {
  const isEn = lang === "en";
  const questions = {
    technical: [],
    experience: [],
    cultureFit: [],
    problemSolving: [],
  };

  if (!analysisResult) return questions;

  const {
    habilidades_clave = [],
    brechas = [],
    fortalezas = [],
    matched_keywords = [],
    unmatched_keywords = [],
    experiencia_anos = 0,
    score = 0,
  } = analysisResult;

  // --- TECHNICAL QUESTIONS ---
  // Questions about missing/unmatched skills
  for (const gap of unmatched_keywords.slice(0, 3)) {
    const skill = gap.charAt(0).toUpperCase() + gap.slice(1);
    questions.technical.push(
      isEn
        ? `Tell us about your experience with ${skill}. Have you used it in any project or training?`
        : `Cuentanos sobre tu experiencia con ${skill}. Lo has utilizado en algun proyecto o capacitacion?`
    );
  }

  // Questions about matched skills to validate depth
  if (matched_keywords.length > 0) {
    const topSkill = matched_keywords[0];
    questions.technical.push(
      isEn
        ? `What is the most complex problem you've solved using ${topSkill}? Walk us through your approach.`
        : `Cual es el problema mas complejo que has resuelto usando ${topSkill}? Explicanos tu enfoque paso a paso.`
    );
  }

  if (habilidades_clave.length >= 2) {
    const s1 = habilidades_clave[0];
    const s2 = habilidades_clave[1];
    questions.technical.push(
      isEn
        ? `How do you combine ${s1} and ${s2} in your daily work? Give us a concrete example.`
        : `Como combinas ${s1} y ${s2} en tu trabajo diario? Danos un ejemplo concreto.`
    );
  }

  // Ensure minimum 3 technical questions
  if (questions.technical.length < 3) {
    questions.technical.push(
      isEn
        ? "What technical tools or frameworks are you currently learning, and why?"
        : "Que herramientas o frameworks tecnicos estas aprendiendo actualmente y por que?"
    );
  }

  // --- EXPERIENCE QUESTIONS ---
  if (experiencia_anos < 3) {
    questions.experience.push(
      isEn
        ? "Describe a project where you had to learn a new technology quickly. How did you approach it?"
        : "Describe un proyecto donde tuviste que aprender una nueva tecnologia rapidamente. Como lo abordaste?"
    );
  }

  if (experiencia_anos >= 3) {
    questions.experience.push(
      isEn
        ? `With ${experiencia_anos} years of experience, what has been your most impactful project and why?`
        : `Con ${experiencia_anos} anos de experiencia, cual ha sido tu proyecto de mayor impacto y por que?`
    );
  }

  // Gap-based experience questions
  for (const brecha of brechas.slice(0, 2)) {
    const cleanGap = brecha
      .replace(/^Falta competencia requerida:\s*/i, "")
      .replace(/^No se evidencia experiencia en\s*/i, "")
      .replace(/^Missing required competency:\s*/i, "")
      .replace(/^No evidence of experience in\s*/i, "");
    questions.experience.push(
      isEn
        ? `Regarding ${cleanGap}: describe any related experience or how you would approach learning it.`
        : `Respecto a ${cleanGap}: describe cualquier experiencia relacionada o como abordarias aprenderlo.`
    );
  }

  // Strengths-based experience questions
  for (const fortaleza of fortalezas.slice(0, 1)) {
    questions.experience.push(
      isEn
        ? `You mentioned strengths in: "${fortaleza.substring(0, 60)}". Can you elaborate with a specific example?`
        : `Se identificaron fortalezas en: "${fortaleza.substring(0, 60)}". Puedes elaborar con un ejemplo especifico?`
    );
  }

  if (questions.experience.length < 3) {
    questions.experience.push(
      isEn
        ? "Tell us about a time you had to work under a tight deadline. What was the outcome?"
        : "Cuentanos de una vez que tuviste que trabajar bajo una fecha limite ajustada. Cual fue el resultado?"
    );
  }

  // --- CULTURE FIT QUESTIONS ---
  questions.cultureFit.push(
    isEn
      ? "How do you handle disagreements with team members about technical decisions?"
      : "Como manejas los desacuerdos con miembros del equipo sobre decisiones tecnicas?"
  );

  questions.cultureFit.push(
    isEn
      ? "What type of work environment helps you perform at your best?"
      : "Que tipo de ambiente de trabajo te ayuda a rendir al maximo?"
  );

  questions.cultureFit.push(
    isEn
      ? "How do you stay updated with new technologies and industry trends?"
      : "Como te mantienes actualizado con nuevas tecnologias y tendencias de la industria?"
  );

  if (score >= 80) {
    questions.cultureFit.push(
      isEn
        ? "As a strong candidate, what would make you decline an offer? What matters most to you?"
        : "Como candidato fuerte, que te haria rechazar una oferta? Que es lo que mas te importa?"
    );
  }

  if (score < 60) {
    questions.cultureFit.push(
      isEn
        ? "What motivates you to apply for this role given the gap between your current profile and the requirements?"
        : "Que te motiva a postularte para este rol dada la brecha entre tu perfil actual y los requisitos?"
    );
  }

  // --- PROBLEM SOLVING QUESTIONS ---
  questions.problemSolving.push(
    isEn
      ? "Describe a situation where you faced a bug or issue that took significant time to resolve. What was your debugging process?"
      : "Describe una situacion donde enfrentaste un bug o problema que tomo tiempo significativo resolver. Cual fue tu proceso de depuracion?"
  );

  questions.problemSolving.push(
    isEn
      ? "If you had to design a system from scratch for this role, what would be your first three steps?"
      : "Si tuvieras que disenar un sistema desde cero para este puesto, cuales serian tus primeros tres pasos?"
  );

  if (matched_keywords.length > 0) {
    const relevantSkill = matched_keywords[Math.min(1, matched_keywords.length - 1)];
    questions.problemSolving.push(
      isEn
        ? `Imagine a scenario where ${relevantSkill} is not performing as expected in production. How would you diagnose and fix it?`
        : `Imagina un escenario donde ${relevantSkill} no esta funcionando como se espera en produccion. Como lo diagnosticarias y solucionarias?`
    );
  }

  questions.problemSolving.push(
    isEn
      ? "Tell us about a time you had to make a technical decision with incomplete information. What was your approach?"
      : "Cuentanos de una vez que tuviste que tomar una decision tecnica con informacion incompleta. Cual fue tu enfoque?"
  );

  // Trim each category to max 5
  questions.technical = questions.technical.slice(0, 5);
  questions.experience = questions.experience.slice(0, 5);
  questions.cultureFit = questions.cultureFit.slice(0, 5);
  questions.problemSolving = questions.problemSolving.slice(0, 5);

  return questions;
}
