import { apiUrl } from "../../api/client";
import { TOKENS } from "../../constants/tokens";

export function GoogleSigninButton({ label = "Continuar con Google" }) {
  const onClick = () => {
    // Redirect to the backend OAuth start; the backend redirects to Google,
    // which redirects back to /api/auth/google/callback, which sets the
    // session cookie and redirects to FRONTEND_POST_LOGIN_URL (/dashboard).
    window.location.assign(apiUrl("/api/auth/google/start"));
  };

  return (
    <button
      onClick={onClick}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: TOKENS.space[3],
        padding: `${TOKENS.space[3]} ${TOKENS.space[5]}`,
        background: TOKENS.color.surfaceGlass,
        border: `1px solid ${TOKENS.color.borderSubtle}`,
        borderRadius: TOKENS.radius.md,
        color: TOKENS.color.textPrimary,
        fontFamily: TOKENS.font.body,
        fontSize: TOKENS.text.body.size,
        fontWeight: TOKENS.text.body.weight,
        cursor: "pointer",
        backdropFilter: "blur(12px)",
        transition: `background ${TOKENS.motion.duration.fast}ms ease`,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = TOKENS.color.surfaceRaised;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = TOKENS.color.surfaceGlass;
      }}
    >
      <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
        <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.49h4.84a4.14 4.14 0 0 1-1.79 2.71v2.26h2.9c1.7-1.57 2.69-3.88 2.69-6.62z"/>
        <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.8.54-1.83.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.94v2.34A8.99 8.99 0 0 0 9 18z"/>
        <path fill="#FBBC05" d="M3.95 10.7A5.41 5.41 0 0 1 3.66 9c0-.59.1-1.16.29-1.7V4.96H.94A8.99 8.99 0 0 0 0 9c0 1.45.35 2.82.94 4.04l3.01-2.34z"/>
        <path fill="#EA4335" d="M9 3.58c1.32 0 2.51.46 3.44 1.35l2.58-2.58A8.99 8.99 0 0 0 9 0 8.99 8.99 0 0 0 .94 4.96L3.95 7.3C4.66 5.17 6.65 3.58 9 3.58z"/>
      </svg>
      {label}
    </button>
  );
}
