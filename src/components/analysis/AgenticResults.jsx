import { memo } from "react";
import { motion } from "framer-motion";
import { SKILLS_DISPLAY } from "../../constants/synonyms";

const APPLE_EASE = [0.16, 1, 0.3, 1];

const glass = {
  background: 'rgba(255,255,255,0.03)',
  backdropFilter: 'blur(12px)',
  border: '1px solid rgba(255,255,255,0.06)',
  borderRadius: 16,
};

// Panel de analiticas: distribucion de scores, skills faltantes, tiempo total
export const AnalyticsPanel = memo(function AnalyticsPanel({ results, candidates, t }) {
  const analyzed = candidates.filter(c => results[c.id]);
  if (analyzed.length < 2) return null;

  const scores = analyzed.map(c => results[c.id].score);
  const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);

  // Distribucion de scores
  const dist = { "0-40": 0, "40-60": 0, "60-80": 0, "80-100": 0 };
  for (const s of scores) {
    if (s < 40) dist["0-40"]++;
    else if (s < 60) dist["40-60"]++;
    else if (s < 80) dist["60-80"]++;
    else dist["80-100"]++;
  }
  const maxDist = Math.max(...Object.values(dist), 1);

  // Skills faltantes mas comunes
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

  // Tiempo total de analisis
  const totalTime = analyzed.reduce((sum, c) => sum + (results[c.id].analysisTime || 0), 0);

  const distColors = { "0-40": "#EF4444", "40-60": "#F59E0B", "60-80": "#818CF8", "80-100": "#10B981" };
  const distLabels = { "0-40": t.range0_40, "40-60": t.range40_60, "60-80": t.range60_80, "80-100": t.range80_100 };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: APPLE_EASE }}
      style={{
        marginTop: 16, padding: 18,
        ...glass,
        background: "rgba(245,158,11,0.04)", borderColor: "rgba(245,158,11,0.15)",
        borderRadius: 16,
      }}
    >
      <p style={{ margin: "0 0 14px", fontSize: 11, fontWeight: 700, color: "#F59E0B", letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "'DM Mono', monospace" }}>
        {t.analyticsTitle}
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {/* Distribucion de Scores */}
        <div style={{ padding: 12, ...glass, borderRadius: 12 }}>
          <p style={{ margin: "0 0 10px", fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.5)", letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "'DM Mono', monospace" }}>
            {t.scoreDistribution}
          </p>
          {Object.entries(dist).map(([range, count], idx) => (
            <div key={range} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <span style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", fontFamily: "'DM Mono', monospace", width: 36, textAlign: "right" }}>
                {distLabels[range]}
              </span>
              <div style={{ flex: 1, height: 14, background: "rgba(255,255,255,0.03)", borderRadius: 4, overflow: "hidden" }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(count / maxDist) * 100}%` }}
                  transition={{ delay: idx * 0.1, duration: 0.8, ease: APPLE_EASE }}
                  style={{
                    height: "100%",
                    background: distColors[range], borderRadius: 4,
                    minWidth: count > 0 ? 4 : 0,
                    boxShadow: count > 0 ? `0 0 8px ${distColors[range]}30` : "none",
                  }}
                />
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

        {/* Skills Faltantes + Tiempo */}
        <div style={{ padding: 12, ...glass, borderRadius: 12 }}>
          <p style={{ margin: "0 0 10px", fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.5)", letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "'DM Mono', monospace" }}>
            {t.commonMissingSkills}
          </p>
          {topGaps.length > 0 ? topGaps.map(([skill, count], i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08, duration: 0.3, ease: APPLE_EASE }}
              style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}
            >
              <span style={{ fontSize: 11, color: "#FEE2E2" }}>{skill}</span>
              <span style={{ fontSize: 10, color: "#EF4444", fontFamily: "'DM Mono', monospace" }}>{count}/{analyzed.length}</span>
            </motion.div>
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
    </motion.div>
  );
});
