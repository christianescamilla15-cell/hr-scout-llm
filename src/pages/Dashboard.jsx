import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { ApiError, api } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { TOKENS } from "../constants/tokens";

function planLabel(plan) {
  return {
    trial: "Prueba 14 días",
    individual: "Individual",
    agency: "Agency",
    trial_expired: "Prueba expirada",
  }[plan] || plan;
}

function StatCard({ label, value, hint }) {
  return (
    <div
      style={{
        padding: TOKENS.space[5],
        background: TOKENS.color.surfaceGlass,
        backdropFilter: "blur(12px)",
        border: `1px solid ${TOKENS.color.borderSubtle}`,
        borderRadius: TOKENS.radius.lg,
      }}
    >
      <div
        style={{
          fontSize: TOKENS.text.caption.size,
          color: TOKENS.color.textMuted,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          marginBottom: TOKENS.space[2],
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: TOKENS.text.h2.size,
          fontWeight: 700,
          color: TOKENS.color.textPrimary,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {value}
      </div>
      {hint && (
        <div
          style={{
            marginTop: TOKENS.space[2],
            fontSize: TOKENS.text.caption.size,
            color: TOKENS.color.textMuted,
          }}
        >
          {hint}
        </div>
      )}
    </div>
  );
}

export function DashboardPage() {
  const { user } = useAuth();
  const [usage, setUsage] = useState(null);
  const [jobsCount, setJobsCount] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    document.title = "Dashboard · HRScout";
  }, []);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      api.get("/api/analyses/usage").catch((e) => ({ _error: e })),
      api.get("/api/jobs").catch((e) => ({ _error: e })),
    ]).then(([u, j]) => {
      if (cancelled) return;
      if (u && !u._error) setUsage(u);
      else if (u?._error instanceof ApiError) setError(u._error);
      if (j && !j._error) setJobsCount(j.total);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto" }}>
      <div style={{ marginBottom: TOKENS.space[6] }}>
        <h1
          style={{
            fontSize: TOKENS.text.h1.size,
            fontWeight: TOKENS.text.h1.weight,
            marginBottom: TOKENS.space[2],
            color: TOKENS.color.textPrimary,
          }}
        >
          Hola, {user.name.split(" ")[0]}
        </h1>
        <p style={{ color: TOKENS.color.textSecondary }}>
          Plan actual: {planLabel(user.plan)}
          {user.trial_ends_at && user.plan === "trial" && (
            <>
              {" · "}Tu prueba termina el{" "}
              {new Date(user.trial_ends_at).toLocaleDateString("es-MX", {
                day: "numeric",
                month: "long",
              })}
            </>
          )}
        </p>
      </div>

      {error && (
        <div
          role="alert"
          style={{
            padding: TOKENS.space[4],
            background: TOKENS.color.dangerSoft,
            border: `1px solid ${TOKENS.color.danger}`,
            borderRadius: TOKENS.radius.md,
            marginBottom: TOKENS.space[5],
            color: TOKENS.color.textPrimary,
          }}
        >
          {error.detail || "No pudimos cargar la información de tu cuenta."}
        </div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: TOKENS.space[4],
          marginBottom: TOKENS.space[6],
        }}
      >
        <StatCard
          label="Análisis"
          value={usage ? `${usage.used_this_period}${usage.limit ? ` / ${usage.limit}` : ""}` : "—"}
          hint={
            usage
              ? usage.period === "trial"
                ? "Total de tu prueba"
                : "Este mes"
              : "Cargando…"
          }
        />
        <StatCard
          label="Vacantes activas"
          value={jobsCount ?? "—"}
        />
        <StatCard label="Plan" value={planLabel(user.plan)} />
      </div>

      <div
        style={{
          display: "flex",
          gap: TOKENS.space[3],
          flexWrap: "wrap",
        }}
      >
        <Link
          to="/jobs"
          style={{
            padding: `${TOKENS.space[3]} ${TOKENS.space[5]}`,
            background: TOKENS.color.accent,
            color: TOKENS.color.textPrimary,
            borderRadius: TOKENS.radius.md,
            textDecoration: "none",
            fontWeight: 600,
          }}
        >
          Ver mis vacantes
        </Link>
        <Link
          to="/demo"
          style={{
            padding: `${TOKENS.space[3]} ${TOKENS.space[5]}`,
            background: TOKENS.color.surfaceGlass,
            border: `1px solid ${TOKENS.color.borderSubtle}`,
            color: TOKENS.color.textSecondary,
            borderRadius: TOKENS.radius.md,
            textDecoration: "none",
          }}
        >
          Abrir demo de análisis
        </Link>
      </div>
    </div>
  );
}
