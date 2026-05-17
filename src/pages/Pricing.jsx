import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { ApiError, api } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { PricingCard } from "../components/pricing/PricingCard";
import { TOKENS } from "../constants/tokens";

const PLANS = {
  individual: {
    monthly: { usd: "$97", mxn: "~$1,700 MXN" },
    yearly: { usd: "$970", mxn: "~$17,000 MXN" },
  },
  agency: {
    monthly: { usd: "$297", mxn: "~$5,200 MXN" },
    yearly: { usd: "$2,970", mxn: "~$52,000 MXN" },
  },
};

export function PricingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [interval, setInterval] = useState("monthly");
  const [loading, setLoading] = useState(null); // 'individual' | 'agency' | null
  const [error, setError] = useState(null);

  useEffect(() => {
    document.title = "Precios · HRScout";
  }, []);

  const handleCheckout = async (plan) => {
    if (!user) {
      navigate("/login", { state: { from: "/precios" } });
      return;
    }
    setLoading(plan);
    setError(null);
    try {
      const { url } = await api.post("/api/billing/checkout", { plan, interval });
      window.location.assign(url);
    } catch (err) {
      setError(err);
      setLoading(null);
    }
  };

  const handleFreeTrial = () => {
    if (user) {
      navigate("/dashboard");
    } else {
      navigate("/login");
    }
  };

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: TOKENS.space[6] }}>
      <header style={{ textAlign: "center", marginBottom: TOKENS.space[7] }}>
        <h1
          style={{
            fontSize: TOKENS.text.h1.size,
            fontWeight: TOKENS.text.h1.weight,
            margin: `0 0 ${TOKENS.space[3]}`,
          }}
        >
          Precios honestos. Sin sorpresas.
        </h1>
        <p
          style={{
            color: TOKENS.color.textSecondary,
            maxWidth: 580,
            margin: "0 auto",
            lineHeight: 1.6,
          }}
        >
          Empezá gratis 14 días sin tarjeta. Cancelás cuando quieras desde tu portal.
        </p>

        <div
          role="tablist"
          aria-label="Frecuencia de pago"
          style={{
            display: "inline-flex",
            gap: TOKENS.space[1],
            padding: TOKENS.space[1],
            background: TOKENS.color.surfaceGlass,
            border: `1px solid ${TOKENS.color.borderSubtle}`,
            borderRadius: TOKENS.radius.full,
            marginTop: TOKENS.space[5],
          }}
        >
          <IntervalButton active={interval === "monthly"} onClick={() => setInterval("monthly")}>
            Mensual
          </IntervalButton>
          <IntervalButton active={interval === "yearly"} onClick={() => setInterval("yearly")}>
            Anual · 2 meses gratis
          </IntervalButton>
        </div>
      </header>

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
          {error.detail || error.message}
        </div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: TOKENS.space[5],
          alignItems: "stretch",
        }}
      >
        <PricingCard
          name="Free trial"
          tagline="Para probarnos sin compromiso"
          priceUsd="$0"
          pricePeriod="14 días · sin tarjeta"
          features={[
            "5 análisis totales",
            "1 vacante guardada",
            "Acceso a plantillas MX",
            "Soporte por email",
          ]}
          ctaLabel={user ? "Ir al dashboard" : "Empezar prueba gratis"}
          onCta={handleFreeTrial}
        />

        <PricingCard
          name="Individual"
          tagline="Para reclutadoras independientes"
          priceUsd={`${PLANS.individual[interval].usd} USD`}
          priceMxn={PLANS.individual[interval].mxn}
          pricePeriod={interval === "monthly" ? "por mes" : "por año"}
          features={[
            "100 análisis al mes (suficiente para 5-10 vacantes simultáneas)",
            "5 vacantes guardadas",
            "Export PDF de reportes",
            "Historial completo + comparativas",
            "Soporte por WhatsApp",
          ]}
          ctaLabel={
            loading === "individual"
              ? "Redirigiendo…"
              : user
              ? "Empezar 14 días gratis"
              : "Iniciar prueba"
          }
          onCta={() => handleCheckout("individual")}
          disabled={loading !== null}
        />

        <PricingCard
          name="Agency"
          tagline="Para equipos de 2 a 10 personas"
          priceUsd={`${PLANS.agency[interval].usd} USD`}
          priceMxn={PLANS.agency[interval].mxn}
          pricePeriod={interval === "monthly" ? "por mes" : "por año"}
          features={[
            "500 análisis al mes",
            "Vacantes ilimitadas",
            "Hasta 3 usuarios incluidos",
            "PDF con tu marca (logo + colores)",
            "Mismo criterio en todo tu equipo",
            "Soporte prioritario WhatsApp + email",
          ]}
          ctaLabel={
            loading === "agency"
              ? "Redirigiendo…"
              : user
              ? "Empezar 14 días gratis"
              : "Iniciar prueba"
          }
          onCta={() => handleCheckout("agency")}
          highlight
          badge="Más popular"
          disabled={loading !== null}
        />
      </div>

      <p
        style={{
          textAlign: "center",
          marginTop: TOKENS.space[6],
          fontSize: TOKENS.text.bodySm.size,
          color: TOKENS.color.textMuted,
          maxWidth: 600,
          marginInline: "auto",
        }}
      >
        Precios en USD. Tipo de cambio Stripe — el cargo en MXN puede variar ±2%.
        Cancelás desde tu portal en 2 clics.
      </p>
    </div>
  );
}

function IntervalButton({ active, onClick, children }) {
  return (
    <button
      role="tab"
      aria-selected={active}
      type="button"
      onClick={onClick}
      style={{
        padding: `${TOKENS.space[2]} ${TOKENS.space[4]}`,
        background: active ? TOKENS.color.accent : "transparent",
        color: active ? TOKENS.color.textPrimary : TOKENS.color.textSecondary,
        border: "none",
        borderRadius: TOKENS.radius.full,
        cursor: "pointer",
        fontSize: TOKENS.text.bodySm.size,
        fontWeight: active ? 600 : 400,
        fontFamily: TOKENS.font.body,
      }}
    >
      {children}
    </button>
  );
}

// Surface the ApiError type as referenced (helps lint warnings only)
export { ApiError };
