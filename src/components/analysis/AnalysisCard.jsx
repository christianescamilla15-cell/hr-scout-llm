import { apiUrl } from "../../api/client";
import { TOKENS } from "../../constants/tokens";
import { ScorePill } from "./ScorePill";

function List({ items, color }) {
  if (!items || items.length === 0) return null;
  return (
    <ul style={{ margin: 0, paddingLeft: TOKENS.space[5], color }}>
      {items.map((item, i) => (
        <li key={i} style={{ marginBottom: TOKENS.space[1] }}>
          {item}
        </li>
      ))}
    </ul>
  );
}

export function AnalysisCard({ analysis }) {
  if (!analysis) return null;
  const {
    id,
    score,
    local_score,
    ai_score,
    confidence,
    strengths,
    gaps,
    verdict,
    action,
    interview_question,
    analysis_mode,
    latency_ms,
  } = analysis;

  const pdfHref = id ? apiUrl(`/api/analyses/${id}/report.pdf`) : null;

  return (
    <article
      style={{
        padding: TOKENS.space[5],
        background: TOKENS.color.surfaceGlass,
        backdropFilter: "blur(12px)",
        border: `1px solid ${TOKENS.color.borderSubtle}`,
        borderRadius: TOKENS.radius.lg,
        display: "flex",
        flexDirection: "column",
        gap: TOKENS.space[4],
      }}
    >
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: TOKENS.space[3],
          flexWrap: "wrap",
        }}
      >
        <ScorePill score={score} mode={analysis_mode} />
        <div style={{ fontSize: TOKENS.text.caption.size, color: TOKENS.color.textMuted }}>
          local {local_score ?? "—"} · ai {ai_score ?? "—"} · conf {confidence ?? "—"}
          {latency_ms ? ` · ${latency_ms} ms` : ""}
        </div>
      </header>

      {verdict && (
        <p
          style={{
            margin: 0,
            color: TOKENS.color.textPrimary,
            lineHeight: 1.5,
          }}
        >
          {verdict}
        </p>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: TOKENS.space[4],
        }}
      >
        <div>
          <h4
            style={{
              fontSize: TOKENS.text.overline.size,
              letterSpacing: TOKENS.text.overline.letterSpacing,
              textTransform: TOKENS.text.overline.textTransform,
              color: TOKENS.color.success,
              marginBottom: TOKENS.space[2],
            }}
          >
            Fortalezas
          </h4>
          <List items={strengths} color={TOKENS.color.textSecondary} />
        </div>
        <div>
          <h4
            style={{
              fontSize: TOKENS.text.overline.size,
              letterSpacing: TOKENS.text.overline.letterSpacing,
              textTransform: TOKENS.text.overline.textTransform,
              color: TOKENS.color.warning,
              marginBottom: TOKENS.space[2],
            }}
          >
            Brechas
          </h4>
          <List items={gaps} color={TOKENS.color.textSecondary} />
        </div>
      </div>

      {interview_question && (
        <div
          style={{
            padding: TOKENS.space[3],
            background: TOKENS.color.surfaceRaised,
            borderRadius: TOKENS.radius.md,
            borderLeft: `3px solid ${TOKENS.color.accent}`,
          }}
        >
          <div
            style={{
              fontSize: TOKENS.text.overline.size,
              letterSpacing: TOKENS.text.overline.letterSpacing,
              textTransform: TOKENS.text.overline.textTransform,
              color: TOKENS.color.textMuted,
              marginBottom: TOKENS.space[2],
            }}
          >
            Pregunta de entrevista sugerida
          </div>
          <p style={{ margin: 0, color: TOKENS.color.textPrimary, fontStyle: "italic" }}>
            “{interview_question}”
          </p>
        </div>
      )}

      <footer
        style={{
          paddingTop: TOKENS.space[3],
          borderTop: `1px solid ${TOKENS.color.borderSubtle}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: TOKENS.space[3],
          flexWrap: "wrap",
          fontSize: TOKENS.text.caption.size,
          color: TOKENS.color.textMuted,
        }}
      >
        <span>Próximo paso: {action}</span>
        <div style={{ display: "flex", alignItems: "center", gap: TOKENS.space[3] }}>
          {pdfHref && (
            <a
              href={pdfHref}
              target="_blank"
              rel="noopener"
              style={{
                padding: `${TOKENS.space[1]} ${TOKENS.space[3]}`,
                background: TOKENS.color.surfaceRaised,
                border: `1px solid ${TOKENS.color.borderSubtle}`,
                borderRadius: TOKENS.radius.sm,
                color: TOKENS.color.textSecondary,
                fontSize: TOKENS.text.caption.size,
                textDecoration: "none",
                fontWeight: 600,
              }}
            >
              ↓ Descargar PDF
            </a>
          )}
          <span style={{ fontStyle: "italic" }}>
            La decisión final de contratación es tuya.
          </span>
        </div>
      </footer>
    </article>
  );
}
