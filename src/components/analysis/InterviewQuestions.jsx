import { useState, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { generateInterviewQuestions } from "../../utils/interviewGenerator";

const APPLE_EASE = [0.16, 1, 0.3, 1];

const glass = {
  background: 'rgba(255,255,255,0.03)',
  backdropFilter: 'blur(12px)',
  border: '1px solid rgba(255,255,255,0.06)',
  borderRadius: 16,
};

// Collapsible interview questions panel based on CV analysis
export const InterviewQuestions = memo(function InterviewQuestions({ result, jobDescription, lang, t }) {
  const [expanded, setExpanded] = useState(false);
  const [copiedAll, setCopiedAll] = useState(false);
  const [openSections, setOpenSections] = useState({
    technical: true,
    experience: true,
    cultureFit: false,
    problemSolving: false,
  });

  if (!result) return null;

  const questions = generateInterviewQuestions(result, jobDescription, lang);

  const categories = [
    { key: "technical", label: t.technicalQuestions || "Technical", color: "#6366F1", icon: "\u2699" },
    { key: "experience", label: t.experienceQuestions || "Experience", color: "#10B981", icon: "\u2605" },
    { key: "cultureFit", label: t.cultureFitQuestions || "Culture Fit", color: "#F59E0B", icon: "\u2665" },
    { key: "problemSolving", label: t.problemSolvingQuestions || "Problem Solving", color: "#EC4899", icon: "\u26A1" },
  ];

  const toggleSection = (key) => {
    setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const copyAllQuestions = () => {
    const allText = categories
      .map(cat => {
        const qs = questions[cat.key];
        if (!qs || qs.length === 0) return null;
        return `${cat.label.toUpperCase()}\n${qs.map((q, i) => `  ${i + 1}. ${q}`).join("\n")}`;
      })
      .filter(Boolean)
      .join("\n\n");

    navigator.clipboard.writeText(allText).then(() => {
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 2000);
    });
  };

  const totalQuestions = Object.values(questions).reduce((sum, arr) => sum + arr.length, 0);

  if (totalQuestions === 0) return null;

  return (
    <div style={{
      marginTop: 10,
      ...glass,
      background: "rgba(99,102,241,0.04)",
      borderColor: "rgba(99,102,241,0.12)",
      borderRadius: 12,
      overflow: "hidden",
    }}>
      {/* Toggle header */}
      <button
        onClick={() => setExpanded(v => !v)}
        aria-expanded={expanded}
        aria-label={t.interviewQuestions || "Preguntas de entrevista"}
        style={{
          width: "100%",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "10px 14px",
          background: "transparent",
          border: "none",
          cursor: "pointer",
          transition: "background 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
        onMouseEnter={e => { e.currentTarget.style.background = "rgba(99,102,241,0.08)"; }}
        onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
      >
        <span style={{
          fontSize: 10,
          fontWeight: 700,
          color: "#818CF8",
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          fontFamily: "'DM Mono', monospace",
        }}>
          {t.interviewQuestions || "Preguntas de Entrevista"} ({totalQuestions})
        </span>
        <motion.span
          animate={{ rotate: expanded ? 180 : 0 }}
          transition={{ duration: 0.3, ease: APPLE_EASE }}
          style={{
            fontSize: 12,
            color: "#818CF8",
            display: "inline-block",
          }}
        >
          &#9660;
        </motion.span>
      </button>

      {/* Expanded content with AnimatePresence */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: APPLE_EASE }}
            style={{ overflow: "hidden" }}
          >
            <div style={{ padding: "0 14px 14px" }}>
              {/* Copy all button */}
              <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 10 }}>
                <button
                  onClick={copyAllQuestions}
                  aria-label={t.copyQuestions || "Copiar preguntas"}
                  style={{
                    padding: "4px 12px",
                    borderRadius: 8,
                    fontSize: 10,
                    fontWeight: 600,
                    cursor: "pointer",
                    ...glass,
                    background: copiedAll ? "rgba(16,185,129,0.15)" : "rgba(255,255,255,0.05)",
                    borderColor: copiedAll ? "rgba(16,185,129,0.3)" : "rgba(255,255,255,0.1)",
                    color: copiedAll ? "#10B981" : "rgba(255,255,255,0.4)",
                    fontFamily: "'DM Mono', monospace",
                    transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
                  }}
                >
                  {copiedAll ? (t.questionsCopied || "Copiado!") : (t.copyQuestions || "Copiar todo")}
                </button>
              </div>

              {/* Category sections */}
              {categories.map(cat => {
                const qs = questions[cat.key];
                if (!qs || qs.length === 0) return null;
                const isOpen = openSections[cat.key];

                return (
                  <div key={cat.key} style={{
                    marginBottom: 8,
                    ...glass,
                    background: "rgba(255,255,255,0.02)",
                    borderRadius: 10,
                    overflow: "hidden",
                  }}>
                    <button
                      onClick={() => toggleSection(cat.key)}
                      aria-expanded={isOpen}
                      aria-label={cat.label}
                      style={{
                        width: "100%",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "8px 12px",
                        background: "transparent",
                        border: "none",
                        cursor: "pointer",
                      }}
                    >
                      <span style={{
                        fontSize: 10,
                        fontWeight: 700,
                        color: cat.color,
                        fontFamily: "'DM Mono', monospace",
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                      }}>
                        <span>{cat.icon}</span>
                        {cat.label}
                        <span style={{
                          fontSize: 9,
                          padding: "1px 5px",
                          borderRadius: 4,
                          background: `${cat.color}15`,
                          color: cat.color,
                        }}>
                          {qs.length}
                        </span>
                      </span>
                      <motion.span
                        animate={{ rotate: isOpen ? 180 : 0 }}
                        transition={{ duration: 0.3, ease: APPLE_EASE }}
                        style={{
                          fontSize: 10,
                          color: cat.color,
                          display: "inline-block",
                        }}
                      >
                        &#9660;
                      </motion.span>
                    </button>

                    <AnimatePresence>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3, ease: APPLE_EASE }}
                          style={{ overflow: "hidden" }}
                        >
                          <div style={{ padding: "0 12px 10px" }}>
                            {qs.map((question, qi) => (
                              <motion.div
                                key={qi}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: qi * 0.05, duration: 0.3, ease: APPLE_EASE }}
                                style={{
                                  display: "flex",
                                  gap: 8,
                                  padding: "6px 0",
                                  borderTop: qi > 0 ? "1px solid rgba(255,255,255,0.04)" : "none",
                                }}
                              >
                                <span style={{
                                  fontSize: 10,
                                  fontWeight: 700,
                                  color: `${cat.color}80`,
                                  fontFamily: "'DM Mono', monospace",
                                  flexShrink: 0,
                                  marginTop: 1,
                                }}>
                                  {qi + 1}.
                                </span>
                                <p style={{
                                  margin: 0,
                                  fontSize: 11,
                                  color: "rgba(255,255,255,0.6)",
                                  lineHeight: 1.5,
                                }}>
                                  {question}
                                </p>
                              </motion.div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});
