import { TOKENS } from "../../constants/tokens";

export function LegalLayout({ title, lastUpdated, children }) {
  return (
    <article
      style={{
        maxWidth: 760,
        margin: "0 auto",
        padding: `${TOKENS.space[6]} ${TOKENS.space[5]}`,
        color: TOKENS.color.textPrimary,
        fontFamily: TOKENS.font.body,
        lineHeight: 1.6,
      }}
    >
      <h1
        style={{
          fontSize: TOKENS.text.h1.size,
          fontWeight: TOKENS.text.h1.weight,
          marginBottom: TOKENS.space[2],
        }}
      >
        {title}
      </h1>
      {lastUpdated && (
        <p style={{ color: TOKENS.color.textMuted, fontSize: TOKENS.text.caption.size, marginBottom: TOKENS.space[5] }}>
          Última actualización: {lastUpdated}
        </p>
      )}
      <div
        style={{
          color: TOKENS.color.textSecondary,
        }}
      >
        {children}
      </div>
    </article>
  );
}
