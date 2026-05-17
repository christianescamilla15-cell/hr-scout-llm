import { TOKENS } from "../../constants/tokens";

export function PricingCard({
  name,
  tagline,
  priceUsd,
  priceMxn,
  pricePeriod,
  features,
  ctaLabel,
  onCta,
  highlight = false,
  badge,
  disabled = false,
}) {
  return (
    <article
      style={{
        display: "flex",
        flexDirection: "column",
        gap: TOKENS.space[4],
        padding: TOKENS.space[6],
        background: TOKENS.color.surfaceGlass,
        backdropFilter: "blur(12px)",
        border: highlight
          ? `2px solid ${TOKENS.color.accent}`
          : `1px solid ${TOKENS.color.borderSubtle}`,
        borderRadius: TOKENS.radius.lg,
        position: "relative",
        boxShadow: highlight ? TOKENS.shadow.glowAccent : "none",
      }}
    >
      {badge && (
        <div
          style={{
            position: "absolute",
            top: -12,
            left: TOKENS.space[5],
            padding: `${TOKENS.space[1]} ${TOKENS.space[3]}`,
            background: TOKENS.color.accent,
            color: TOKENS.color.textPrimary,
            borderRadius: TOKENS.radius.full,
            fontSize: TOKENS.text.caption.size,
            fontWeight: 600,
            textTransform: TOKENS.text.overline.textTransform,
            letterSpacing: TOKENS.text.overline.letterSpacing,
          }}
        >
          {badge}
        </div>
      )}

      <header>
        <h3
          style={{
            fontSize: TOKENS.text.h3.size,
            fontWeight: 700,
            color: TOKENS.color.textPrimary,
            margin: 0,
          }}
        >
          {name}
        </h3>
        {tagline && (
          <p
            style={{
              fontSize: TOKENS.text.bodySm.size,
              color: TOKENS.color.textSecondary,
              margin: `${TOKENS.space[2]} 0 0`,
            }}
          >
            {tagline}
          </p>
        )}
      </header>

      <div>
        <div
          style={{
            fontSize: TOKENS.text.display.size,
            fontWeight: 700,
            color: TOKENS.color.textPrimary,
            fontVariantNumeric: "tabular-nums",
            lineHeight: 1,
          }}
        >
          {priceUsd}
        </div>
        {priceMxn && (
          <div
            style={{
              fontSize: TOKENS.text.bodySm.size,
              color: TOKENS.color.textMuted,
              marginTop: TOKENS.space[1],
            }}
          >
            {priceMxn} {pricePeriod && `· ${pricePeriod}`}
          </div>
        )}
        {!priceMxn && pricePeriod && (
          <div
            style={{
              fontSize: TOKENS.text.bodySm.size,
              color: TOKENS.color.textMuted,
              marginTop: TOKENS.space[1],
            }}
          >
            {pricePeriod}
          </div>
        )}
      </div>

      <ul
        style={{
          listStyle: "none",
          padding: 0,
          margin: 0,
          display: "flex",
          flexDirection: "column",
          gap: TOKENS.space[2],
        }}
      >
        {features.map((feature, i) => (
          <li
            key={i}
            style={{
              display: "flex",
              gap: TOKENS.space[2],
              fontSize: TOKENS.text.bodySm.size,
              color: TOKENS.color.textSecondary,
              lineHeight: 1.5,
            }}
          >
            <span aria-hidden="true" style={{ color: TOKENS.color.success, flexShrink: 0 }}>
              ✓
            </span>
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={onCta}
        disabled={disabled}
        style={{
          marginTop: "auto",
          padding: `${TOKENS.space[3]} ${TOKENS.space[5]}`,
          background: highlight ? TOKENS.color.accent : TOKENS.color.surfaceRaised,
          color: TOKENS.color.textPrimary,
          border: highlight ? "none" : `1px solid ${TOKENS.color.borderSubtle}`,
          borderRadius: TOKENS.radius.md,
          fontWeight: 600,
          fontSize: TOKENS.text.body.size,
          cursor: disabled ? "not-allowed" : "pointer",
          opacity: disabled ? 0.6 : 1,
          fontFamily: TOKENS.font.body,
        }}
      >
        {ctaLabel}
      </button>
    </article>
  );
}
