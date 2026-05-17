import { useEffect } from "react";

import { LegalLayout } from "./LegalLayout";

export function CookiesPage() {
  useEffect(() => {
    document.title = "Política de Cookies · HRScout";
  }, []);

  return (
    <LegalLayout title="Política de Cookies" lastUpdated="2026-05-17">
      <p>
        HRScout usa el mínimo de cookies necesarias para que el Servicio
        funcione. No usamos cookies de tracking publicitario ni compartimos
        datos de tu navegación con terceros.
      </p>

      <h2>Cookies que usamos</h2>
      <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "1rem" }}>
        <thead>
          <tr style={{ textAlign: "left" }}>
            <th style={{ padding: "0.5rem", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>Cookie</th>
            <th style={{ padding: "0.5rem", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>Propósito</th>
            <th style={{ padding: "0.5rem", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>Duración</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={{ padding: "0.5rem", verticalAlign: "top" }}><code>hrscout_session</code></td>
            <td style={{ padding: "0.5rem", verticalAlign: "top" }}>
              Mantiene tu sesión iniciada después de hacer login.
              HttpOnly + SameSite=Lax (no accesible desde JavaScript).
            </td>
            <td style={{ padding: "0.5rem", verticalAlign: "top" }}>7 días</td>
          </tr>
          <tr>
            <td style={{ padding: "0.5rem", verticalAlign: "top" }}><code>hrscout_oauth_state</code></td>
            <td style={{ padding: "0.5rem", verticalAlign: "top" }}>
              Protege el flujo de Google OAuth contra ataques CSRF durante el login.
            </td>
            <td style={{ padding: "0.5rem", verticalAlign: "top" }}>10 minutos</td>
          </tr>
        </tbody>
      </table>

      <h2>Cookies de terceros</h2>
      <p>
        Cuando hacés checkout, Stripe puede setear sus propias cookies en
        <code> checkout.stripe.com</code>. Esto está fuera de nuestro control
        y se rige por la
        <a href="https://stripe.com/cookie-settings"> política de cookies de Stripe</a>.
      </p>

      <h2>Cómo borrar cookies</h2>
      <p>
        Podés borrar las cookies de tu navegador en cualquier momento desde su
        configuración. Si borrás <code>hrscout_session</code>, tendrás que
        iniciar sesión nuevamente.
      </p>
    </LegalLayout>
  );
}
