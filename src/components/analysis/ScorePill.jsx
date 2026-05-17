import { TOKENS } from "../../constants/tokens";

export function ScorePill({ score, mode }) {
  const color =
    score >= 80
      ? TOKENS.color.success
      : score >= 60
      ? TOKENS.color.warning
      : TOKENS.color.danger;
  const soft =
    score >= 80
      ? TOKENS.color.successSoft
      : score >= 60
      ? TOKENS.color.warningSoft
      : TOKENS.color.dangerSoft;

  return (
    <span
      aria-label={`Puntuación ${score} de 100, modo ${mode}`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: TOKENS.space[2],
        padding: `${TOKENS.space[2]} ${TOKENS.space[3]}`,
        background: soft,
        border: `1px solid ${color}`,
        borderRadius: TOKENS.radius.full,
        fontSize: TOKENS.text.bodySm.size,
        fontWeight: 600,
        color: TOKENS.color.textPrimary,
      }}
    >
      <span style={{ fontVariantNumeric: "tabular-nums" }}>{score}</span>
      <span style={{ color: TOKENS.color.textMuted, fontWeight: 400, fontSize: TOKENS.text.caption.size }}>
        / 100 · {mode}
      </span>
    </span>
  );
}
