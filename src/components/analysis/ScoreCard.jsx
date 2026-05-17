import { useState, useEffect, useRef, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { InterviewQuestions } from "./InterviewQuestions";

const APPLE_EASE = [0.16, 1, 0.3, 1];

// Glassmorphism tokens
const glass = {
  background: 'rgba(255,255,255,0.03)',
  backdropFilter: 'blur(12px)',
  border: '1px solid rgba(255,255,255,0.06)',
  borderRadius: 16,
};

// Animated count-up hook
function useCountUp(target, duration = 1200) {
  const [value, setValue] = useState(0);
  const rafRef = useRef(null);

  useEffect(() => {
    if (target === undefined || target === null) return;
    const start = performance.now();
    const from = 0;
    const animate = (now) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(from + (target - from) * eased));
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      }
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [target, duration]);

  return value;
}

// Animated circular score gauge (0-100)
function ScoreGauge({ score, t, analysisMode }) {
  const color = score >= 80 ? "#10B981" : score >= 60 ? "#F59E0B" : "#EF4444";
  const label = score >= 80 ? t.scoreSuitable : score >= 60 ? t.scoreReview : t.scoreNotSuitable;
  const modeColor = analysisMode === "tool_use" ? "#34D399" : analysisMode === "ai" ? "#818CF8" : analysisMode === "agentic" ? "#F59E0B" : "rgba(255,255,255,0.3)";
  const modeLabel = analysisMode === "tool_use" ? (t.toolUseMode || "Tool Use") : analysisMode === "ai" ? t.aiMode : analysisMode === "agentic" ? (t.agenticMode || "Agentic") : t.localMode;

  const displayScore = useCountUp(score, 1500);

  const size = 52;
  const strokeWidth = 3;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const fillPercent = score / 100;

  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ position: "relative", width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
          {/* Background ring */}
          <circle
            cx={size / 2} cy={size / 2} r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth={strokeWidth}
          />
          {/* Animated fill ring */}
          <motion.circle
            cx={size / 2} cy={size / 2} r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: circumference * (1 - fillPercent) }}
            transition={{ duration: 1.5, ease: APPLE_EASE }}
            style={{ filter: `drop-shadow(0 0 6px ${color}50)` }}
          />
        </svg>
        {/* Score number overlay */}
        <div style={{
          position: "absolute", inset: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 15, fontWeight: 800, color,
          fontFamily: "'DM Mono', monospace",
        }}>
          {displayScore}
        </div>
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

// Tarjeta completa de candidato con score, info y analisis expandible
export const CandidateCard = memo(function CandidateCard({ candidate, rank, onAnalyze, analyzing, result, globalAnalyzing, cardRef, onRemove, isCustom, t, jobDescription, lang }) {
  const [expanded, setExpanded] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [justFinished, setJustFinished] = useState(false);
  const [copied, setCopied] = useState(false);
  const prevResult = useRef(null);
  const rankColors = ["#F59E0B", "#94A3B8", "#CD7F32"];

  useEffect(() => {
    if (result && !prevResult.current) {
      setJustFinished(true);
      const timer = setTimeout(() => setJustFinished(false), 1500);
      return () => clearTimeout(timer);
    }
    prevResult.current = result;
  }, [result]);

  return (
    <div
      ref={cardRef}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        ...glass,
        background: result ? "rgba(16,185,129,0.04)" : "rgba(255,255,255,0.03)",
        border: `1px solid ${analyzing ? "rgba(99,102,241,0.4)" : result ? "rgba(16,185,129,0.15)" : "rgba(255,255,255,0.06)"}`,
        borderRadius: 16, marginBottom: 10, overflow: "hidden",
        transition: "all 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
        transform: hovered ? "translateY(-2px)" : "translateY(0)",
        boxShadow: hovered ? "0 8px 32px rgba(0,0,0,0.3)" : analyzing ? "0 0 20px rgba(99,102,241,0.15)" : "none",
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
          transition: "all 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
        }}>
          {rank}
        </div>

        {/* Score */}
        {result ? <ScoreGauge score={result.score} t={t} analysisMode={result.analysisMode} /> : (
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
                fontSize: 10, padding: "2px 7px", borderRadius: 6,
                background: "rgba(99,102,241,0.08)",
                border: "1px solid rgba(99,102,241,0.15)",
                backdropFilter: "blur(8px)",
                color: "#A5B4FC", fontFamily: "'DM Mono', monospace",
              }}>{h}</span>
            ))}
          </div>
        )}

        {/* Actions */}
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {result && (
            <button onClick={() => setExpanded(v => !v)} aria-expanded={expanded} aria-label={`${expanded ? t.close : t.viewAnalysis} - ${candidate.name}`} style={{
              ...glass, background: "rgba(255,255,255,0.05)", borderRadius: 8, padding: "5px 10px", cursor: "pointer",
              fontSize: 11, color: "rgba(255,255,255,0.5)",
              fontFamily: "'DM Sans', sans-serif",
              transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
            }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.1)"; e.currentTarget.style.boxShadow = "0 0 12px rgba(255,255,255,0.05)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.boxShadow = "none"; }}
            >
              {expanded ? t.close : t.viewAnalysis}
            </button>
          )}
          <button
            onClick={() => onAnalyze(candidate)}
            disabled={analyzing || globalAnalyzing}
            aria-label={`${analyzing ? t.analyzing : result ? t.reAnalyze : t.analyzeAI} - ${candidate.name}`}
            aria-busy={analyzing}
            style={{
              ...glass,
              background: (analyzing || globalAnalyzing) ? "rgba(255,255,255,0.04)" : "rgba(99,102,241,0.12)",
              border: `1px solid ${(analyzing || globalAnalyzing) ? "rgba(255,255,255,0.08)" : "rgba(99,102,241,0.3)"}`,
              borderRadius: 8, padding: "5px 12px", cursor: (analyzing || globalAnalyzing) ? "default" : "pointer",
              fontSize: 11, color: (analyzing || globalAnalyzing) ? "rgba(255,255,255,0.3)" : "#A5B4FC",
              fontFamily: "'DM Sans', sans-serif", transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
            }}
            onMouseEnter={e => { if (!analyzing && !globalAnalyzing) { e.currentTarget.style.background = "rgba(99,102,241,0.22)"; e.currentTarget.style.boxShadow = "0 0 16px rgba(99,102,241,0.2)"; } }}
            onMouseLeave={e => { if (!analyzing && !globalAnalyzing) { e.currentTarget.style.background = "rgba(99,102,241,0.12)"; e.currentTarget.style.boxShadow = "none"; } }}
          >
            {analyzing ? t.analyzing : result ? t.reAnalyze : t.analyzeAI}
          </button>
          {isCustom && (
            <button
              onClick={() => onRemove(candidate.id)}
              title={t.removeCandidateTitle}
              aria-label={`${t.removeCandidateTitle} - ${candidate.name}`}
              style={{
                background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)",
                borderRadius: 8, padding: "5px 8px", cursor: "pointer",
                fontSize: 12, color: "#EF4444", fontFamily: "'DM Sans', sans-serif",
                transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)", lineHeight: 1,
              }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(239,68,68,0.2)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "rgba(239,68,68,0.08)"; }}
            >
              &#10005;
            </button>
          )}
        </div>
      </div>

      {/* Expanded Analysis with AnimatePresence */}
      <AnimatePresence>
        {expanded && result && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: APPLE_EASE }}
            style={{ overflow: "hidden" }}
          >
            <div style={{
              padding: "0 18px 18px",
              borderTop: "1px solid rgba(255,255,255,0.06)",
            }}>
              {/* Dual score display cuando se uso AI o Tool Use */}
              {(result.analysisMode === "ai" || result.analysisMode === "tool_use") && (
                <div style={{ display: "flex", gap: 10, marginTop: 14, marginBottom: 4, flexWrap: "wrap" }}>
                  <div style={{ padding: "6px 12px", borderRadius: 8, ...glass, background: result.analysisMode === "tool_use" ? "rgba(52,211,153,0.08)" : "rgba(99,102,241,0.08)", borderColor: result.analysisMode === "tool_use" ? "rgba(52,211,153,0.2)" : "rgba(99,102,241,0.2)", fontSize: 11, color: result.analysisMode === "tool_use" ? "#6EE7B7" : "#A5B4FC", fontFamily: "'DM Mono', monospace" }}>
                    {t.aiScoreLabel}: <b>{result.aiScore}</b>
                  </div>
                  <div style={{ padding: "6px 12px", borderRadius: 8, ...glass, fontSize: 11, color: "rgba(255,255,255,0.5)", fontFamily: "'DM Mono', monospace" }}>
                    {t.keywordScore}: <b>{result.localScore}</b>
                  </div>
                  <div style={{
                    padding: "6px 12px", borderRadius: 8, fontSize: 11, fontFamily: "'DM Mono', monospace",
                    ...glass,
                    background: result.confidence === "high" ? "rgba(16,185,129,0.08)" : result.confidence === "medium" ? "rgba(245,158,11,0.08)" : "rgba(239,68,68,0.08)",
                    borderColor: result.confidence === "high" ? "rgba(16,185,129,0.2)" : result.confidence === "medium" ? "rgba(245,158,11,0.2)" : "rgba(239,68,68,0.2)",
                    color: result.confidence === "high" ? "#10B981" : result.confidence === "medium" ? "#F59E0B" : "#EF4444",
                  }}>
                    {result.confidence === "high" ? t.confidenceHigh : result.confidence === "medium" ? t.confidenceMedium : t.confidenceLow}
                  </div>
                  {result.analysisMode === "tool_use" && (
                    <div style={{ padding: "6px 12px", borderRadius: 8, ...glass, background: "rgba(52,211,153,0.08)", borderColor: "rgba(52,211,153,0.2)", fontSize: 11, color: "#34D399", fontFamily: "'DM Mono', monospace", fontWeight: 700 }}>
                      {t.toolUseMode || "Tool Use"} ({result.toolCallCount || 0} {t.toolCalls || "calls"})
                    </div>
                  )}
                </div>
              )}

              {/* Traza del pipeline agentic */}
              {result.analysisMode === "agentic" && result.pipeline && (
                <div style={{ display: "flex", gap: 6, marginTop: 14, marginBottom: 4, flexWrap: "wrap", alignItems: "center" }}>
                  <span style={{ fontSize: 9, fontWeight: 700, color: "#F59E0B", fontFamily: "'DM Mono', monospace", letterSpacing: "0.08em", textTransform: "uppercase", marginRight: 4 }}>
                    {t.pipelineTitle || "Pipeline"}:
                  </span>
                  {result.pipeline.map((step, i) => (
                    <motion.span
                      key={i}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.08, duration: 0.3, ease: APPLE_EASE }}
                      style={{
                        fontSize: 9, padding: "3px 8px", borderRadius: 6,
                        background: "rgba(245,158,11,0.08)",
                        border: "1px solid rgba(245,158,11,0.2)",
                        backdropFilter: "blur(8px)",
                        color: "#FCD34D", fontFamily: "'DM Mono', monospace",
                        display: "inline-flex", alignItems: "center", gap: 4,
                      }}
                    >
                      <span style={{ fontWeight: 700 }}>{step.agent}</span>
                      <span style={{ color: "rgba(255,255,255,0.35)" }}>
                        {step.skills ? step.skills : step.level ? `${step.level} / ${step.years}y` : step.matched !== undefined ? `${step.matched}ok ${step.missing}gap ${step.bonus}+` : `${step.score}pts`}
                      </span>
                      {i < result.pipeline.length - 1 && <span style={{ color: "rgba(245,158,11,0.4)", marginLeft: 2 }}>&rarr;</span>}
                    </motion.span>
                  ))}
                </div>
              )}

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginTop: (result.analysisMode === "ai" || result.analysisMode === "tool_use" || result.analysisMode === "agentic") ? 4 : 14 }}>
                {/* Fortalezas */}
                <div style={{ ...glass, background: "rgba(16,185,129,0.06)", borderColor: "rgba(16,185,129,0.15)", borderRadius: 12, padding: 12 }}>
                  <p style={{ margin: "0 0 8px", fontSize: 10, fontWeight: 700, color: "#10B981", letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "'DM Mono', monospace" }}>&#10003; {t.strengths}</p>
                  {result.fortalezas?.map((f, i) => (
                    <p key={i} style={{ margin: "0 0 4px", fontSize: 11, color: "#D1FAE5", lineHeight: 1.5 }}>&#8226; {f}</p>
                  ))}
                </div>
                {/* Debilidades */}
                <div style={{ ...glass, background: "rgba(239,68,68,0.06)", borderColor: "rgba(239,68,68,0.15)", borderRadius: 12, padding: 12 }}>
                  <p style={{ margin: "0 0 8px", fontSize: 10, fontWeight: 700, color: "#EF4444", letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "'DM Mono', monospace" }}>&#10007; {t.gaps}</p>
                  {result.brechas?.map((b, i) => (
                    <p key={i} style={{ margin: "0 0 4px", fontSize: 11, color: "#FEE2E2", lineHeight: 1.5 }}>&#8226; {b}</p>
                  ))}
                </div>
                {/* Veredicto */}
                <div style={{ ...glass, background: "rgba(99,102,241,0.06)", borderColor: "rgba(99,102,241,0.15)", borderRadius: 12, padding: 12 }}>
                  <p style={{ margin: "0 0 8px", fontSize: 10, fontWeight: 700, color: "#818CF8", letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "'DM Mono', monospace" }}>{t.verdict}</p>
                  <p style={{ margin: "0 0 6px", fontSize: 11, color: "#E0E7FF", lineHeight: 1.5 }}>{result.veredicto}</p>
                  <p style={{ margin: 0, fontSize: 10, color: "rgba(255,255,255,0.4)", fontStyle: "italic" }}>
                    {result.siguiente_paso}
                  </p>
                </div>
              </div>

              {/* Pregunta de entrevista */}
              {result.pregunta_entrevista && (
                <div style={{ marginTop: 10, padding: "10px 14px", ...glass, background: "rgba(245,158,11,0.06)", borderColor: "rgba(245,158,11,0.15)", borderRadius: 12 }}>
                  <span style={{ fontSize: 10, color: "#F59E0B", fontWeight: 700, fontFamily: "'DM Mono', monospace" }}>{t.interviewQuestion}</span>
                  <span style={{ fontSize: 11, color: "#FEF3C7" }}>{result.pregunta_entrevista}</span>
                </div>
              )}

              {/* Interview questions generator */}
              <InterviewQuestions result={result} jobDescription={jobDescription} lang={lang} t={t} />

              {/* Copiar al clipboard */}
              <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
                <button
                  onClick={() => {
                    const text = `${candidate.name} - Score: ${result.score}/100${(result.analysisMode === "ai" || result.analysisMode === "tool_use") ? ` (AI: ${result.aiScore}, Keywords: ${result.localScore}${result.analysisMode === "tool_use" ? ", Mode: Tool Use" : ""})` : ""}\n\nStrengths:\n${result.fortalezas?.map(f => `- ${f}`).join("\n")}\n\nGaps:\n${result.brechas?.map(b => `- ${b}`).join("\n")}\n\nVerdict: ${result.veredicto}\nNext step: ${result.siguiente_paso}\nInterview question: ${result.pregunta_entrevista}`;
                    navigator.clipboard.writeText(text).then(() => {
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    });
                  }}
                  aria-label={`${copied ? t.copied : t.copyToClipboard} - ${candidate.name}`}
                  style={{
                    padding: "5px 12px", borderRadius: 8, fontSize: 10, fontWeight: 600, cursor: "pointer",
                    ...glass,
                    background: copied ? "rgba(16,185,129,0.15)" : "rgba(255,255,255,0.05)",
                    borderColor: copied ? "rgba(16,185,129,0.3)" : "rgba(255,255,255,0.1)",
                    color: copied ? "#10B981" : "rgba(255,255,255,0.4)",
                    fontFamily: "'DM Mono', monospace", transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
                  }}
                >
                  {copied ? t.copied : t.copyToClipboard}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});
