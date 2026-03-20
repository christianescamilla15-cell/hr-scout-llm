import { useState } from "react";

// ─── CVs MOCK ─────────────────────────────────────────────────────────────────
const SAMPLE_CVS = [
  {
    id: 1, name: "Andrea Martínez López",
    cv: `Ingeniera en Sistemas | 5 años de experiencia
Experiencia: Desarrolladora Senior en Fintech CDMX (2021-2026). Lideré equipo de 4 personas.
Stack: React, Node.js, Python, PostgreSQL, AWS, Docker.
Logros: Reduje tiempo de deploy en 60%. Implementé CI/CD que aumentó productividad 40%.
Educación: Ingeniería en Sistemas - UNAM 2020. Certificación AWS Solutions Architect.
Idiomas: Español nativo, Inglés C1. Disponible para trabajo remoto e híbrido.`
  },
  {
    id: 2, name: "Carlos Rodríguez Vega",
    cv: `Desarrollador Full Stack Jr | 1 año de experiencia
Recién egresado bootcamp. Manejo básico de HTML, CSS, JavaScript.
Proyectos personales en React. Sin experiencia profesional formal.
Educación: Preparatoria + Bootcamp 3 meses.
Idiomas: Solo español.`
  },
  {
    id: 3, name: "Sofia Hernández Castro",
    cv: `Product Manager con enfoque en IA | 4 años de experiencia
Gestioné productos de IA en startup SaaS B2B (2022-2026). 3 lanzamientos exitosos.
Experiencia con Claude API, GPT-4, automatizaciones con Make.com y n8n.
Certificaciones: Product Management - Reforge, IA Aplicada - DeepLearning.AI.
Educación: Administración de Empresas - Tec de Monterrey.
Inglés B2, disponible inmediatamente.`
  },
  {
    id: 4, name: "Miguel Ángel Torres",
    cv: `Data Scientist | 3 años de experiencia
Análisis de datos y ML en empresa de retail. Python (Pandas, Scikit-learn, TensorFlow).
Modelos predictivos para forecasting de ventas con 87% de precisión.
Educación: Maestría en Ciencia de Datos - ITAM 2023.
Inglés C1, certificación Google Cloud Professional Data Engineer.
Disponible en 2 semanas.`
  },
  {
    id: 5, name: "Valentina Cruz Morales",
    cv: `Especialista en Marketing Digital | 6 años de experiencia
Lideré estrategia digital de marca con 2M+ seguidores. ROI promedio 340%.
Experiencia con IA generativa para contenido: Midjourney, DALL-E, ChatGPT.
Automatizaciones en Zapier y Make.com. Manejo de HubSpot CRM.
Educación: Comunicación - Iberoamericana. Certificación Google Ads, Meta Blueprint.
Inglés C2, disponible de inmediato.`
  },
  {
    id: 6, name: "Roberto Jiménez Soto",
    cv: `Contador Público | 10 años de experiencia
Contabilidad tradicional en despacho contable. Excel avanzado.
Sin experiencia en tecnología moderna ni herramientas digitales.
Educación: Contaduría - Universidad Anáhuac.
Español únicamente.`
  },
  {
    id: 7, name: "Daniela Fuentes Reyes",
    cv: `Ingeniería de IA & Automatización | 3 años de experiencia
Diseño e implementación de agentes IA y workflows automatizados en n8n y Make.com.
Integración de Claude API, GPT-4o y LangChain en productos B2B.
Prompt engineering avanzado. Python para scripting y análisis de datos.
Educación: Ingeniería en TI - IPN 2022. DeepLearning.AI certificada.
Inglés B2. Portfolio con 8 proyectos desplegados en producción.`
  },
  {
    id: 8, name: "Fernando Acosta Navarro",
    cv: `UX/UI Designer | 4 años de experiencia
Diseño de interfaces para apps móviles y web. Figma, Adobe XD.
Experiencia con IA para generación de mockups (Midjourney, Stable Diffusion).
Investigación de usuarios, pruebas de usabilidad, Design Systems.
Educación: Diseño Gráfico - Universidad Iberoamericana.
Inglés B1. Portafolio disponible.`
  },
];

// ─── ANÁLISIS MOCK RÁPIDO (sin API) ──────────────────────────────────────────
const quickScore = (cv, jobDesc) => {
  const text = (cv + " " + jobDesc).toLowerCase();
  const keywords = ["ia", "automatización", "python", "claude", "gpt", "make.com", "n8n", "liderazgo", "inglés", "certificación"];
  let hits = keywords.filter(k => cv.toLowerCase().includes(k)).length;
  return Math.min(98, 40 + hits * 6 + Math.floor(Math.random() * 10));
};

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
function CandidateCard({ candidate, rank, onAnalyze, analyzing, result }) {
  const [expanded, setExpanded] = useState(false);
  const rankColors = ["#F59E0B", "#94A3B8", "#CD7F32"];

  return (
    <div style={{
      background: result ? "rgba(16,185,129,0.04)" : "rgba(255,255,255,0.03)",
      border: `1px solid ${result ? "rgba(16,185,129,0.2)" : "rgba(255,255,255,0.07)"}`,
      borderRadius: 12, marginBottom: 10, overflow: "hidden",
      animation: "fadeUp 0.4s ease",
      transition: "border-color 0.3s",
    }}>
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
            {analyzing ? "⏳" : "?"}
          </div>
        )}

        {/* Info */}
        <div>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "#F1F5F9" }}>{candidate.name}</p>
          {result && (
            <p style={{ margin: "3px 0 0", fontSize: 11, color: "rgba(255,255,255,0.4)" }}>
              {result.titulo} · {result.experiencia_años} años exp.
            </p>
          )}
          {!result && (
            <p style={{ margin: "3px 0 0", fontSize: 11, color: "rgba(255,255,255,0.3)", fontStyle: "italic" }}>
              Sin analizar
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
            }}>
              {expanded ? "Cerrar" : "Ver análisis"}
            </button>
          )}
          <button
            onClick={() => onAnalyze(candidate)}
            disabled={analyzing}
            style={{
              background: analyzing ? "rgba(255,255,255,0.04)" : "rgba(99,102,241,0.12)",
              border: `1px solid ${analyzing ? "rgba(255,255,255,0.08)" : "rgba(99,102,241,0.3)"}`,
              borderRadius: 6, padding: "5px 12px", cursor: analyzing ? "default" : "pointer",
              fontSize: 11, color: analyzing ? "rgba(255,255,255,0.3)" : "#A5B4FC",
              fontFamily: "'DM Sans', sans-serif", transition: "all 0.15s",
            }}
          >
            {analyzing ? "Analizando..." : result ? "Re-analizar" : "Analizar IA"}
          </button>
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
              <p style={{ margin: "0 0 8px", fontSize: 10, fontWeight: 700, color: "#10B981", letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "'DM Mono', monospace" }}>✓ Fortalezas</p>
              {result.fortalezas?.map((f, i) => (
                <p key={i} style={{ margin: "0 0 4px", fontSize: 11, color: "#D1FAE5", lineHeight: 1.5 }}>• {f}</p>
              ))}
            </div>
            {/* Debilidades */}
            <div style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)", borderRadius: 8, padding: 12 }}>
              <p style={{ margin: "0 0 8px", fontSize: 10, fontWeight: 700, color: "#EF4444", letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "'DM Mono', monospace" }}>✗ Brechas</p>
              {result.brechas?.map((b, i) => (
                <p key={i} style={{ margin: "0 0 4px", fontSize: 11, color: "#FEE2E2", lineHeight: 1.5 }}>• {b}</p>
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
              <span style={{ fontSize: 10, color: "#F59E0B", fontWeight: 700, fontFamily: "'DM Mono', monospace" }}>💬 PREGUNTA CLAVE PARA ENTREVISTA: </span>
              <span style={{ fontSize: 11, color: "#FEF3C7" }}>{result.pregunta_entrevista}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── APP ──────────────────────────────────────────────────────────────────────
export default function CVScreener() {
  const [jobDesc, setJobDesc] = useState(`Especialista en IA & Automatización
Buscamos profesional con experiencia en:
- Implementación de agentes IA y workflows automatizados (Make.com, n8n, Zapier)
- Prompt engineering avanzado con Claude, GPT-4o y Gemini
- Python básico/intermedio para scripting y automatización
- Integración de APIs y Webhooks
- Inglés intermedio mínimo (B2)
- Capacidad para trabajar en equipo y comunicar conceptos técnicos a perfiles no técnicos
Deseable: experiencia en startups, certificaciones en IA, portafolio de proyectos.`);

  const [candidates] = useState(SAMPLE_CVS);
  const [results, setResults] = useState({});
  const [analyzingId, setAnalyzingId] = useState(null);
  const [analyzingAll, setAnalyzingAll] = useState(false);
  const [ranked, setRanked] = useState([]);

  const analyzeCandidate = async (candidate) => {
    setAnalyzingId(candidate.id);
    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: `Eres un reclutador experto en RRHH y tecnología. Evalúa CVs contra descripciones de puesto.
Responde ÚNICAMENTE con JSON válido sin markdown:
{
  "score": número del 0 al 100,
  "titulo": "título/rol actual del candidato (máx 5 palabras)",
  "experiencia_años": número,
  "habilidades_clave": ["habilidad1", "habilidad2", "habilidad3"],
  "fortalezas": ["fortaleza1", "fortaleza2", "fortaleza3"],
  "brechas": ["brecha1", "brecha2"],
  "veredicto": "1-2 oraciones de evaluación directa",
  "siguiente_paso": "Acción concreta recomendada (entrevista/descartar/lista de espera)",
  "pregunta_entrevista": "Una pregunta específica y relevante para validar su experiencia"
}`,
          messages: [{
            role: "user",
            content: `DESCRIPCIÓN DEL PUESTO:\n${jobDesc}\n\nCV DEL CANDIDATO (${candidate.name}):\n${candidate.cv}`
          }],
        }),
      });
      const data = await response.json();
      const text = data.content?.[0]?.text || "{}";
      const clean = text.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);
      setResults(prev => {
        const updated = { ...prev, [candidate.id]: parsed };
        // Re-rank
        const ranked = candidates
          .filter(c => updated[c.id])
          .sort((a, b) => (updated[b.id]?.score || 0) - (updated[a.id]?.score || 0));
        setRanked(ranked.map(c => c.id));
        return updated;
      });
    } catch {
      setResults(prev => ({ ...prev, [candidate.id]: { score: quickScore(candidate.cv, jobDesc), error: true, titulo: "Error al analizar", habilidades_clave: [], fortalezas: ["No disponible"], brechas: ["Error de análisis"], veredicto: "Error al conectar con la IA. Revisa tu conexión.", siguiente_paso: "Reintentar", pregunta_entrevista: "N/A" } }));
    } finally {
      setAnalyzingId(null);
    }
  };

  const analyzeAll = async () => {
    setAnalyzingAll(true);
    for (const c of candidates) {
      await analyzeCandidate(c);
      await new Promise(r => setTimeout(r, 500));
    }
    setAnalyzingAll(false);
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

  const analyzed = Object.keys(results).length;
  const aptos = Object.values(results).filter(r => r.score >= 80).length;
  const avgScore = analyzed > 0
    ? Math.round(Object.values(results).reduce((s, r) => s + r.score, 0) / analyzed)
    : 0;

  return (
    <div style={{ minHeight: "100vh", background: "#0A0B0F", fontFamily: "'DM Sans', sans-serif", padding: "20px 16px" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@400;500&family=Cabinet+Grotesk:wght@700;800&display=swap');
        @keyframes fadeUp { from { opacity:0; transform:translateY(10px) } to { opacity:1; transform:translateY(0) } }
        @keyframes spin { to { transform:rotate(360deg) } }
        * { box-sizing: border-box; }
        textarea:focus { outline: none; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 2px; }
      `}</style>

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
              Filtrado y ranking de CVs con IA · Claude API · RRHH automatizado
            </p>
          </div>

          {/* Stats */}
          <div style={{ display: "flex", gap: 10 }}>
            {[
              { label: "Analizados", value: `${analyzed}/${candidates.length}` },
              { label: "Aptos", value: aptos, color: "#10B981" },
              { label: "Score Prom.", value: analyzed > 0 ? avgScore : "—", color: "#818CF8" },
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

          {/* PANEL IZQUIERDO — JOB DESC */}
          <div>
            <div style={{ marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)", fontFamily: "'DM Mono', monospace" }}>
                Descripción del Puesto
              </label>
            </div>
            <textarea
              value={jobDesc}
              onChange={e => setJobDesc(e.target.value)}
              rows={14}
              style={{
                width: "100%", background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.09)",
                borderRadius: 10, padding: "12px 14px",
                color: "#D1D5DB", fontSize: 12, lineHeight: 1.7,
                fontFamily: "'DM Sans', sans-serif", resize: "none",
              }}
            />

            <button
              onClick={analyzeAll}
              disabled={analyzingAll || analyzingId !== null}
              style={{
                width: "100%", marginTop: 10, padding: "13px",
                background: analyzingAll ? "rgba(255,255,255,0.05)" : "linear-gradient(135deg, #6366F1, #4F46E5)",
                border: "none", borderRadius: 10,
                fontSize: 13, fontWeight: 700, color: analyzingAll ? "#6B7280" : "#fff",
                cursor: analyzingAll ? "default" : "pointer",
                fontFamily: "'DM Sans', sans-serif",
                boxShadow: analyzingAll ? "none" : "0 0 24px rgba(99,102,241,0.4)",
                transition: "all 0.2s", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              }}
            >
              {analyzingAll ? (
                <>
                  <div style={{ width: 14, height: 14, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.2)", borderTop: "2px solid #6366F1", animation: "spin 1s linear infinite" }} />
                  Analizando {analyzed + 1}/{candidates.length}...
                </>
              ) : "⚡ Analizar todos los CVs"}
            </button>

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
                    { label: "Aptos (≥80)", value: aptos, color: "#10B981" },
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

          {/* PANEL DERECHO — CANDIDATOS */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)", fontFamily: "'DM Mono', monospace" }}>
                Candidatos · {ranked.length > 0 ? "Ordenados por compatibilidad" : "Sin analizar"}
              </label>
              {ranked.length > 0 && (
                <span style={{ fontSize: 10, color: "#818CF8", fontFamily: "'DM Mono', monospace" }}>
                  🏆 Top: {sortedCandidates[0]?.name}
                </span>
              )}
            </div>

            <div style={{ maxHeight: "calc(100vh - 200px)", overflowY: "auto", paddingRight: 4 }}>
              {sortedCandidates.map((c, i) => (
                <CandidateCard
                  key={c.id}
                  candidate={c}
                  rank={i + 1}
                  onAnalyze={analyzeCandidate}
                  analyzing={analyzingId === c.id}
                  result={results[c.id]}
                />
              ))}
            </div>
          </div>
        </div>

        <p style={{ textAlign: "center", marginTop: 20, fontSize: 10, color: "rgba(255,255,255,0.1)", fontFamily: "'DM Mono', monospace", letterSpacing: "0.1em" }}>
          HRSCOUT · CLAUDE API · FILTRADO AUTOMÁTICO DE CVs · RANKING POR COMPATIBILIDAD
        </p>
      </div>
    </div>
  );
}
