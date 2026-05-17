import { memo, useMemo, useState, useEffect } from "react";
import { motion } from "framer-motion";

const APPLE_EASE = [0.16, 1, 0.3, 1];

const glass = {
  background: 'rgba(255,255,255,0.03)',
  backdropFilter: 'blur(12px)',
  border: '1px solid rgba(255,255,255,0.06)',
  borderRadius: 16,
};

const CANDIDATE_COLORS = [
  "#6366F1", // indigo
  "#10B981", // green
  "#F59E0B", // amber
  "#EF4444", // red
  "#8B5CF6", // violet
  "#EC4899", // pink
  "#14B8A6", // teal
  "#F97316", // orange
  "#06B6D4", // cyan
  "#84CC16", // lime
];

// Pure SVG radar chart for candidate comparison
export const RadarChart = memo(function RadarChart({ candidates, results, t }) {
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setAnimated(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const axes = useMemo(() => [
    { key: "skillsMatch", label: t.radarSkillsMatch || "Skills Match" },
    { key: "experience", label: t.radarExperience || "Experience" },
    { key: "education", label: t.radarEducation || "Education" },
    { key: "languages", label: t.radarLanguages || "Languages" },
    { key: "overall", label: t.radarOverall || "Overall" },
  ], [t]);

  const analyzedCandidates = useMemo(() => {
    return candidates
      .filter(c => results[c.id])
      .map(c => {
        const r = results[c.id];
        // Derive sub-scores from the analysis result
        const matchedCount = r.matched_keywords?.length || 0;
        const totalKeywords = matchedCount + (r.unmatched_keywords?.length || 0);
        const skillsMatch = totalKeywords > 0 ? Math.round((matchedCount / totalKeywords) * 100) : 50;

        // Experience score: normalize years (0-10+ -> 0-100)
        const expYears = r.experiencia_anos || 0;
        const experienceScore = Math.min(100, Math.round((expYears / 10) * 100));

        // Education score: derive from fortalezas/brechas patterns
        let educationScore = 50;
        const fortalezasText = (r.fortalezas || []).join(" ").toLowerCase();
        const brechasText = (r.brechas || []).join(" ").toLowerCase();
        if (/formacion.*solida|maestria|doctorado|phd|master/i.test(fortalezasText)) educationScore = 90;
        else if (/certificacion|licenciatura|bachelor|grado/i.test(fortalezasText)) educationScore = 70;
        if (/formacion|educacion|grado/i.test(brechasText)) educationScore = Math.max(20, educationScore - 30);

        // Language score
        let langScore = 40;
        if (/ingles avanzado|english.*advanced|c1|c2|nativo|native/i.test(fortalezasText)) langScore = 95;
        else if (/ingles|english|b2/i.test(fortalezasText)) langScore = 70;
        if (/ingles|english|idioma|language/i.test(brechasText)) langScore = Math.max(15, langScore - 30);

        return {
          id: c.id,
          name: c.name,
          scores: {
            skillsMatch,
            experience: experienceScore,
            education: educationScore,
            languages: langScore,
            overall: r.score,
          },
        };
      });
  }, [candidates, results]);

  if (analyzedCandidates.length < 2) return null;

  const numAxes = axes.length;
  const centerX = 150;
  const centerY = 150;
  const maxRadius = 110;
  const angleStep = (2 * Math.PI) / numAxes;
  const startAngle = -Math.PI / 2; // Start from top

  // Calculate point position for a given axis index and value (0-100)
  const getPoint = (axisIndex, value) => {
    const angle = startAngle + axisIndex * angleStep;
    const radius = (value / 100) * maxRadius;
    return {
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle),
    };
  };

  // Generate polygon path for a candidate (optionally zero for animation start)
  const getPolygonPath = (scores, useZero = false) => {
    const points = axes.map((axis, i) => getPoint(i, useZero ? 0 : (scores[axis.key] || 0)));
    return points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ") + " Z";
  };

  // Grid rings at 25%, 50%, 75%, 100%
  const gridLevels = [25, 50, 75, 100];

  return (
    <div style={{
      padding: 16,
      ...glass,
      background: "rgba(99,102,241,0.04)",
      borderColor: "rgba(99,102,241,0.15)",
      borderRadius: 16,
      marginBottom: 14,
    }}>
      <p style={{
        margin: "0 0 12px",
        fontSize: 11,
        fontWeight: 700,
        color: "#818CF8",
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        fontFamily: "'DM Mono', monospace",
      }}>
        {t.radarChart || "Radar de Competencias"}
      </p>

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
        <svg
          viewBox="0 0 300 300"
          width="100%"
          style={{ maxWidth: 360, aspectRatio: "1/1" }}
          role="img"
          aria-label={t.radarChart || "Radar de Competencias"}
        >
          {/* Grid rings */}
          {gridLevels.map((level) => {
            const points = Array.from({ length: numAxes }, (_, i) => getPoint(i, level));
            const path = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ") + " Z";
            return (
              <path
                key={`grid-${level}`}
                d={path}
                fill="none"
                stroke="rgba(255,255,255,0.08)"
                strokeWidth={level === 100 ? 1.5 : 0.8}
              />
            );
          })}

          {/* Axis lines */}
          {axes.map((_, i) => {
            const endpoint = getPoint(i, 100);
            return (
              <line
                key={`axis-${i}`}
                x1={centerX}
                y1={centerY}
                x2={endpoint.x}
                y2={endpoint.y}
                stroke="rgba(255,255,255,0.1)"
                strokeWidth={0.8}
              />
            );
          })}

          {/* Candidate polygons — animated from center */}
          {analyzedCandidates.map((candidate, ci) => {
            const color = CANDIDATE_COLORS[ci % CANDIDATE_COLORS.length];
            const zeroPath = getPolygonPath(candidate.scores, true);
            const fullPath = getPolygonPath(candidate.scores, false);
            return (
              <g key={candidate.id}>
                <motion.path
                  d={animated ? fullPath : zeroPath}
                  fill={`${color}20`}
                  stroke={color}
                  strokeWidth={2}
                  strokeLinejoin="round"
                  initial={false}
                  style={{ transition: `all 1.5s cubic-bezier(0.16, 1, 0.3, 1)` }}
                />
                {/* Data points */}
                {axes.map((axis, ai) => {
                  const point = animated ? getPoint(ai, candidate.scores[axis.key] || 0) : { x: centerX, y: centerY };
                  return (
                    <circle
                      key={`${candidate.id}-${ai}`}
                      cx={point.x}
                      cy={point.y}
                      r={3}
                      fill={color}
                      stroke="#09090B"
                      strokeWidth={1}
                      style={{ transition: `all 1.5s cubic-bezier(0.16, 1, 0.3, 1)` }}
                    />
                  );
                })}
              </g>
            );
          })}

          {/* Axis labels */}
          {axes.map((axis, i) => {
            const labelPoint = getPoint(i, 125);
            const angle = startAngle + i * angleStep;
            const isTop = angle < -Math.PI / 4 && angle > -3 * Math.PI / 4;
            const isBottom = angle > Math.PI / 4 && angle < 3 * Math.PI / 4;
            const textAnchor = Math.abs(Math.cos(angle)) < 0.1 ? "middle" : Math.cos(angle) > 0 ? "start" : "end";
            const dy = isTop ? -2 : isBottom ? 8 : 3;

            return (
              <text
                key={`label-${i}`}
                x={labelPoint.x}
                y={labelPoint.y + dy}
                fill="rgba(255,255,255,0.6)"
                fontSize={9}
                fontFamily="'DM Mono', monospace"
                textAnchor={textAnchor}
                dominantBaseline="middle"
              >
                {axis.label}
              </text>
            );
          })}

          {/* Grid level labels */}
          {gridLevels.map((level) => {
            const point = getPoint(0, level);
            return (
              <text
                key={`level-${level}`}
                x={point.x + 3}
                y={point.y - 3}
                fill="rgba(255,255,255,0.2)"
                fontSize={7}
                fontFamily="'DM Mono', monospace"
              >
                {level}
              </text>
            );
          })}
        </svg>

        {/* Legend */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "center" }}>
          {analyzedCandidates.map((candidate, ci) => {
            const color = CANDIDATE_COLORS[ci % CANDIDATE_COLORS.length];
            return (
              <motion.div
                key={candidate.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: ci * 0.1, duration: 0.4, ease: APPLE_EASE }}
                style={{ display: "flex", alignItems: "center", gap: 5 }}
              >
                <div style={{
                  width: 10,
                  height: 10,
                  borderRadius: 3,
                  background: color,
                  border: `1px solid ${color}`,
                  flexShrink: 0,
                  boxShadow: `0 0 6px ${color}40`,
                }} />
                <span style={{
                  fontSize: 10,
                  color: "rgba(255,255,255,0.6)",
                  fontFamily: "'DM Mono', monospace",
                  whiteSpace: "nowrap",
                }}>
                  {candidate.name} ({candidate.scores.overall})
                </span>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
});
