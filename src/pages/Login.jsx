import { useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";

import { GoogleSigninButton } from "../components/auth/GoogleSigninButton";
import { useAuth } from "../auth/AuthContext";
import { TOKENS } from "../constants/tokens";

export function LoginPage() {
  const { user, loading } = useAuth();
  const location = useLocation();
  const redirectTo = location.state?.from || "/dashboard";

  useEffect(() => {
    document.title = "Iniciar sesión · HRScout";
  }, []);

  if (!loading && user) {
    return <Navigate to={redirectTo} replace />;
  }

  return (
    <div
      style={{
        display: "grid",
        placeItems: "center",
        minHeight: "70vh",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 420,
          padding: TOKENS.space[7],
          background: TOKENS.color.surfaceGlass,
          backdropFilter: "blur(12px)",
          border: `1px solid ${TOKENS.color.borderSubtle}`,
          borderRadius: TOKENS.radius.lg,
          textAlign: "center",
        }}
      >
        <h1
          style={{
            fontSize: TOKENS.text.h2.size,
            lineHeight: TOKENS.text.h2.lineHeight,
            fontWeight: TOKENS.text.h2.weight,
            marginBottom: TOKENS.space[3],
            color: TOKENS.color.textPrimary,
          }}
        >
          Filtra mejor. Contrata más rápido.
        </h1>
        <p
          style={{
            fontSize: TOKENS.text.body.size,
            color: TOKENS.color.textSecondary,
            marginBottom: TOKENS.space[6],
          }}
        >
          Empezá tu prueba de 14 días sin tarjeta. Tu cuenta queda lista en segundos.
        </p>

        <div style={{ display: "flex", justifyContent: "center" }}>
          <GoogleSigninButton label="Empieza gratis 14 días" />
        </div>

        <p
          style={{
            marginTop: TOKENS.space[5],
            fontSize: TOKENS.text.caption.size,
            color: TOKENS.color.textMuted,
            lineHeight: 1.5,
          }}
        >
          Al continuar aceptás nuestros{" "}
          <a href="/terminos" style={{ color: TOKENS.color.accent }}>
            Términos
          </a>{" "}
          y{" "}
          <a href="/privacidad" style={{ color: TOKENS.color.accent }}>
            Aviso de Privacidad LFPDPPP
          </a>
          .
        </p>
      </div>
    </div>
  );
}
