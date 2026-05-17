import { extractKeywords, matchKeywords } from "../utils/keywordExtraction";
import { extractExperienceYears, extractRequiredYears } from "../utils/experienceParser";
import { detectEducation } from "../utils/educationDetector";
import { detectLanguages } from "../utils/languageDetector";

// ─── FETCH WITH RETRY + TIMEOUT ────────────────────────────────────────────
export async function fetchWithRetry(url, options = {}, retries = 2, timeoutMs = 15000) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
      const response = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text().catch(() => "");
        if (attempt < retries && response.status >= 500) {
          const delay = Math.pow(2, attempt) * 500;
          await new Promise(r => setTimeout(r, delay));
          continue;
        }
        return { data: null, error: `HTTP ${response.status}: ${errorText || response.statusText}` };
      }

      const data = await response.json();
      return { data, error: null };
    } catch (err) {
      if (attempt < retries && (err.name === "AbortError" || err.name === "TypeError")) {
        const delay = Math.pow(2, attempt) * 500;
        await new Promise(r => setTimeout(r, delay));
        continue;
      }
      return { data: null, error: err.name === "AbortError" ? "Request timed out" : err.message };
    }
  }
  return { data: null, error: "Max retries exceeded" };
}

// ─── GROQ/CLAUDE API ANALYSIS ──────────────────────────────────────────────
export async function analyzeCVWithClaude(cvText, jobDescription, localResult, apiKey) {
  const groqKey = localStorage.getItem('groq_api_key') || '';
  if (!apiKey && !groqKey) return { ...localResult, analysisMode: "local" };

  const systemPrompt = "You are an expert HR analyst. Analyze this candidate's CV against the job requirements. Respond in JSON only, no markdown: {\"strengths\":[\"s1\",\"s2\",\"s3\"],\"gaps\":[\"g1\",\"g2\",\"g3\"],\"verdict\":\"2 line summary\",\"action\":\"interview|waitlist|discard\",\"question\":\"specific interview question\",\"aiScore\":0-100}";
  const userMsg = `Job:\n${jobDescription}\n\nCandidate CV:\n${cvText}\n\nLocal keyword score: ${localResult.score}/100`;

  try {
    const startTime = Date.now();

    // Try Groq first
    if (groqKey) {
      const { data: groqData, error: groqErr } = await fetchWithRetry("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${groqKey}` },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile", max_tokens: 800, temperature: 0.3,
          response_format: { type: "json_object" },
          messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userMsg }],
        }),
      }, 1, 15000);

      if (!groqErr && groqData?.choices?.[0]?.message?.content) {
        const text = groqData.choices[0].message.content;
        const aiData = JSON.parse(text);
        const elapsed = Date.now() - startTime;
        const aiScore = Math.max(0, Math.min(100, Number(aiData.aiScore) || localResult.score));
        return { ...localResult, ...aiData, aiScore, analysisMode: "groq", latencyMs: elapsed, score: Math.round((localResult.score * 0.4) + (aiScore * 0.6)) };
      }
    }

    // Fallback to Claude
    if (!apiKey) return { ...localResult, analysisMode: "local" };

    const { data, error } = await fetchWithRetry("https://api.anthropic.com/v1/messages", {
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
        system: systemPrompt,
        messages: [{ role: "user", content: userMsg }],
      }),
    }, 2, 15000);

    if (error || !data) {
      console.warn("Claude API error:", error);
      return { ...localResult, analysisMode: "local" };
    }
    const text = data.content?.[0]?.text || "";
    const aiData = JSON.parse(text);
    const elapsed = Date.now() - startTime;

    const aiScore = Math.max(0, Math.min(100, Number(aiData.aiScore) || localResult.score));
    const finalScore = Math.round(localResult.score * 0.4 + aiScore * 0.6);
    const scoreDiff = Math.abs(localResult.score - aiScore);
    const confidence = scoreDiff <= 10 ? "high" : scoreDiff <= 25 ? "medium" : "low";

    // Mapear accion a espanol
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

export async function analyzeWithToolUse(cvText, jobDescription, localResult, apiKey) {
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
      const { data, error } = await fetchWithRetry("https://api.anthropic.com/v1/messages", {
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
      }, 1, 20000);

      if (error || !data) {
        console.warn("Tool use API error:", error);
        return null;
      }

      // Si termino, extraer texto final
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

      // Si usa herramientas, ejecutarlas y continuar el loop
      if (data.stop_reason === "tool_use") {
        messages.push({ role: "assistant", content: data.content });

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

      // Stop reason desconocido
      break;
    }

    return null;
  } catch (err) {
    console.warn("Tool use error, falling back:", err.message);
    return null;
  }
}
