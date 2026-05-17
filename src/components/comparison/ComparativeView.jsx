import { memo } from "react";
import { motion } from "framer-motion";
import { RadarChart } from "./RadarChart";

const APPLE_EASE = [0.16, 1, 0.3, 1];

const glass = {
  background: 'rgba(255,255,255,0.03)',
  backdropFilter: 'blur(12px)',
  border: '1px solid rgba(255,255,255,0.06)',
  borderRadius: 16,
};

// Panel de analisis comparativo entre candidatos
export const ComparativePanel = memo(function ComparativePanel({ analysis, candidates, results, t }) {
  if (!analysis) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: APPLE_EASE }}
      style={{
        marginTop: 16, padding: 18,
        ...glass,
        background: "rgba(99,102,241,0.04)", borderColor: "rgba(99,102,241,0.15)",
        borderRadius: 16,
      }}
    >
      <p style={{ margin: "0 0 14px", fontSize: 11, fontWeight: 700, color: "#818CF8", letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "'DM Mono', monospace" }}>
        {t.comparativeAnalysis} &middot; {analysis.totalAnalyzed} {t.candidates.toLowerCase()}
      </p>

      {/* Radar chart — only when 2+ candidates analyzed */}
      {candidates && results && (
        <RadarChart candidates={candidates} results={results} t={t} />
      )}

      {/* Mejor candidato */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5, ease: APPLE_EASE }}
        style={{ padding: 12, ...glass, background: "rgba(16,185,129,0.06)", borderColor: "rgba(16,185,129,0.15)", borderRadius: 12, marginBottom: 12 }}
      >
        <p style={{ margin: "0 0 4px", fontSize: 10, fontWeight: 700, color: "#10B981", letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "'DM Mono', monospace" }}>
          {t.bestCandidate}
        </p>
        <p style={{ margin: 0, fontSize: 12, color: "#D1FAE5", lineHeight: 1.5 }}>
          {analysis.bestExplanation}
        </p>
      </motion.div>

      {/* Brechas comunes */}
      {analysis.commonGaps.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5, ease: APPLE_EASE }}
          style={{ padding: 12, ...glass, background: "rgba(239,68,68,0.04)", borderColor: "rgba(239,68,68,0.12)", borderRadius: 12, marginBottom: 12 }}
        >
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
        </motion.div>
      )}

      {/* Heatmap de habilidades */}
      {analysis.heatmap.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5, ease: APPLE_EASE }}
          style={{ padding: 12, ...glass, borderRadius: 12 }}
        >
          <p style={{ margin: "0 0 10px", fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.5)", letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "'DM Mono', monospace" }}>
            {t.skillCoverage}
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {analysis.heatmap.map((h, i) => {
              const pct = h.covered / analysis.totalAnalyzed;
              const bg = pct >= 0.7 ? "rgba(16,185,129,0.12)" : pct >= 0.4 ? "rgba(245,158,11,0.12)" : "rgba(239,68,68,0.1)";
              const border2 = pct >= 0.7 ? "rgba(16,185,129,0.25)" : pct >= 0.4 ? "rgba(245,158,11,0.25)" : "rgba(239,68,68,0.2)";
              const color2 = pct >= 0.7 ? "#10B981" : pct >= 0.4 ? "#F59E0B" : "#EF4444";
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4 + i * 0.04, duration: 0.3, ease: APPLE_EASE }}
                  style={{
                    padding: "4px 10px", borderRadius: 8,
                    background: bg, border: `1px solid ${border2}`,
                    backdropFilter: "blur(8px)",
                    fontSize: 10, color: color2, fontFamily: "'DM Mono', monospace",
                    display: "flex", alignItems: "center", gap: 6,
                  }}
                  title={h.candidates.length > 0 ? `${t.coveredBy}: ${h.candidates.join(", ")}` : t.noCoverage}
                >
                  <span>{h.skill}</span>
                  <span style={{ fontWeight: 800 }}>{h.covered}/{analysis.totalAnalyzed}</span>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
});
