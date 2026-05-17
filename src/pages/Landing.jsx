import { useEffect } from "react";
import { Link } from "react-router-dom";

import { useAuth } from "../auth/AuthContext";
import { GoogleSigninButton } from "../components/auth/GoogleSigninButton";
import { TOKENS } from "../constants/tokens";

const APPLE_EASE = `cubic-bezier(${TOKENS.motion.ease.apple.join(",")})`;

function Section({ children, style, ...rest }) {
  return (
    <section
      style={{
        maxWidth: 1100,
        margin: "0 auto",
        padding: `${TOKENS.space[9]} ${TOKENS.space[5]}`,
        ...style,
      }}
      {...rest}
    >
      {children}
    </section>
  );
}

function Card({ children, ...rest }) {
  return (
    <div
      {...rest}
      style={{
        padding: TOKENS.space[5],
        background: TOKENS.color.surfaceGlass,
        backdropFilter: "blur(12px)",
        border: `1px solid ${TOKENS.color.borderSubtle}`,
        borderRadius: TOKENS.radius.lg,
        ...rest.style,
      }}
    >
      {children}
    </div>
  );
}

export function LandingPage() {
  const { user } = useAuth();

  useEffect(() => {
    document.title = "HRScout · Filtra mejor, contrata más rápido";
  }, []);

  return (
    <div
      style={{
        background: TOKENS.color.canvas,
        color: TOKENS.color.textPrimary,
        fontFamily: TOKENS.font.body,
        minHeight: "100vh",
      }}
    >
      {/* Top nav */}
      <header
        style={{
          display: "flex",
          alignItems: "center",
          padding: `${TOKENS.space[3]} ${TOKENS.space[5]}`,
          borderBottom: `1px solid ${TOKENS.color.borderSubtle}`,
          background: TOKENS.color.surfaceGlass,
          backdropFilter: "blur(12px)",
          position: "sticky",
          top: 0,
          zIndex: 10,
        }}
      >
        <Link
          to="/"
          style={{
            fontSize: TOKENS.text.h4.size,
            fontWeight: 700,
            color: TOKENS.color.textPrimary,
            textDecoration: "none",
            letterSpacing: "-0.02em",
          }}
        >
          HRScout
        </Link>
        <nav
          style={{
            display: "flex",
            gap: TOKENS.space[4],
            marginLeft: "auto",
            alignItems: "center",
          }}
        >
          <Link to="/demo" style={navLinkInline()}>Demo</Link>
          <Link to="/precios" style={navLinkInline()}>Precios</Link>
          {user ? (
            <Link to="/dashboard" style={primaryButtonInline()}>
              Ir al dashboard
            </Link>
          ) : (
            <>
              <Link to="/login" style={navLinkInline()}>Iniciar sesión</Link>
              <Link to="/login" style={primaryButtonInline()}>
                Empieza gratis
              </Link>
            </>
          )}
        </nav>
      </header>

      {/* Hero */}
      <Section style={{ paddingTop: TOKENS.space[9], paddingBottom: TOKENS.space[8] }}>
        <div style={{ textAlign: "center", maxWidth: 780, margin: "0 auto" }}>
          <h1
            style={{
              fontSize: TOKENS.text.display.size,
              lineHeight: TOKENS.text.display.lineHeight,
              fontWeight: TOKENS.text.display.weight,
              letterSpacing: "-0.03em",
              margin: 0,
            }}
          >
            Filtra 100 CVs en 5 minutos.
            <br />
            <span style={{ color: TOKENS.color.accent }}>Sin sesgos. Sin maratón.</span>
          </h1>
          <p
            style={{
              fontSize: "1.25rem",
              lineHeight: 1.5,
              color: TOKENS.color.textSecondary,
              marginTop: TOKENS.space[5],
            }}
          >
            4 expertos de IA leen, puntúan y rankean a tus candidatos contra tu vacante.
            Tú decides a quién entrevistar —con evidencia, no con corazonada.
          </p>

          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: TOKENS.space[3],
              marginTop: TOKENS.space[6],
              flexWrap: "wrap",
            }}
          >
            {user ? (
              <Link to="/dashboard" style={ctaPrimaryInline()}>
                Ir al dashboard →
              </Link>
            ) : (
              <GoogleSigninButton label="Empieza gratis 14 días" />
            )}
            <Link to="/demo" style={ctaSecondaryInline()}>
              Ver demo en vivo
            </Link>
          </div>

          <p
            style={{
              marginTop: TOKENS.space[5],
              fontSize: TOKENS.text.caption.size,
              color: TOKENS.color.textMuted,
            }}
          >
            Hecho en México · Cumple LFPDPPP · Sin tarjeta para probar · Datos cifrados en reposo
          </p>
        </div>
      </Section>

      {/* Problem agitation */}
      <Section style={{ paddingTop: TOKENS.space[7], paddingBottom: TOKENS.space[7] }}>
        <h2
          style={{
            textAlign: "center",
            fontSize: TOKENS.text.h2.size,
            fontWeight: TOKENS.text.h2.weight,
            marginBottom: TOKENS.space[6],
          }}
        >
          Si reclutas, ya conoces este día.
        </h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: TOKENS.space[4],
          }}
        >
          {[
            {
              title: "8 horas leyendo CVs",
              body: "Lees el #1 con foco, el #50 en piloto automático, y el #95 ya solo buscas la palabra clave.",
            },
            {
              title: "Sesgos que no ves",
              body: "Nombre, foto, escuela, edad. Sabes que no deberían pesar — pero pesan cuando estás cansada.",
            },
            {
              title: "Y el cliente espera ayer",
              body: "Cada hora extra es una hora sin facturar otro proceso. O peor: el cliente llama a otra reclutadora.",
            },
          ].map((item) => (
            <Card key={item.title}>
              <h3
                style={{
                  fontSize: TOKENS.text.h4.size,
                  fontWeight: 600,
                  margin: `0 0 ${TOKENS.space[2]}`,
                  color: TOKENS.color.textPrimary,
                }}
              >
                {item.title}
              </h3>
              <p style={{ color: TOKENS.color.textSecondary, margin: 0, lineHeight: 1.5 }}>
                {item.body}
              </p>
            </Card>
          ))}
        </div>
      </Section>

      {/* Solution demo teaser */}
      <Section>
        <div
          style={{
            textAlign: "center",
            padding: TOKENS.space[7],
            background: TOKENS.color.surfaceGlass,
            backdropFilter: "blur(12px)",
            border: `1px solid ${TOKENS.color.borderSubtle}`,
            borderRadius: TOKENS.radius.xl,
          }}
        >
          <h2
            style={{
              fontSize: TOKENS.text.h1.size,
              fontWeight: TOKENS.text.h1.weight,
              margin: `0 0 ${TOKENS.space[3]}`,
            }}
          >
            Pega un job. Sube 3 CVs. Ve qué pasa.
          </h2>
          <p style={{ fontSize: "1.1rem", color: TOKENS.color.textSecondary, marginBottom: TOKENS.space[5] }}>
            No necesitas registrarte para probarlo. Carga el ejemplo o usa los tuyos.
          </p>
          <Link to="/demo" style={ctaPrimaryInline()}>
            Probar demo en vivo →
          </Link>
          <p style={{ marginTop: TOKENS.space[4], fontSize: TOKENS.text.caption.size, color: TOKENS.color.textMuted }}>
            Resultado en ~5 segundos. Tus datos no se guardan si no inicias sesión.
          </p>
        </div>
      </Section>

      {/* How it works */}
      <Section>
        <h2
          style={{
            textAlign: "center",
            fontSize: TOKENS.text.h2.size,
            fontWeight: TOKENS.text.h2.weight,
            marginBottom: TOKENS.space[6],
          }}
        >
          Cómo funciona
        </h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: TOKENS.space[4],
          }}
        >
          {[
            ["1", "Sube tu vacante", "Pega el job description o elige una plantilla MX."],
            ["2", "Carga los CVs", "PDF, DOCX o texto. Hasta 100 candidatos por vacante."],
            ["3", "Analiza", "4 expertos de IA revisan habilidades, experiencia y fit."],
            ["4", "Decide", "Score 0-100, fortalezas, brechas y 3 preguntas de entrevista."],
          ].map(([num, title, body]) => (
            <div
              key={num}
              style={{
                padding: TOKENS.space[4],
                textAlign: "center",
              }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  margin: "0 auto",
                  background: TOKENS.color.accent,
                  borderRadius: TOKENS.radius.full,
                  display: "grid",
                  placeItems: "center",
                  fontSize: TOKENS.text.h3.size,
                  fontWeight: 700,
                  marginBottom: TOKENS.space[3],
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {num}
              </div>
              <h3 style={{ fontSize: TOKENS.text.h4.size, margin: `0 0 ${TOKENS.space[2]}` }}>
                {title}
              </h3>
              <p style={{ color: TOKENS.color.textSecondary, margin: 0, fontSize: TOKENS.text.bodySm.size, lineHeight: 1.5 }}>
                {body}
              </p>
            </div>
          ))}
        </div>
      </Section>

      {/* Features */}
      <Section>
        <h2
          style={{
            textAlign: "center",
            fontSize: TOKENS.text.h2.size,
            fontWeight: TOKENS.text.h2.weight,
            marginBottom: TOKENS.space[6],
          }}
        >
          Lo que recibes en cada análisis
        </h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: TOKENS.space[4],
          }}
        >
          {[
            ["Score 0-100 explicado", "Cada punto tiene un porqué: keyword match, experiencia, educación, idioma."],
            ["Matching con sinónimos", "\"React\" matchea con \"ReactJS\", \"Node\" con \"node.js\" — sin que pierdas candidatos válidos."],
            ["3 preguntas de entrevista", "Generadas para el perfil específico. Técnicas, de experiencia y de fit."],
            ["Comparativa lado a lado", "Visualiza fortalezas y brechas entre tus top candidatos en una sola pantalla."],
            ["Reporte PDF con tu marca", "(Plan Agency) Exporta el shortlist con tu logo para enviar al cliente."],
            ["Plantillas MX listas", "Vacantes pre-cargadas con jerga real: STPS, IMSS, CONTPAQi, Aspel."],
          ].map(([title, body]) => (
            <Card key={title}>
              <h3
                style={{
                  fontSize: TOKENS.text.h4.size,
                  fontWeight: 600,
                  margin: `0 0 ${TOKENS.space[2]}`,
                }}
              >
                {title}
              </h3>
              <p style={{ color: TOKENS.color.textSecondary, margin: 0, lineHeight: 1.5 }}>
                {body}
              </p>
            </Card>
          ))}
        </div>
      </Section>

      {/* Pricing teaser */}
      <Section>
        <div
          style={{
            textAlign: "center",
            padding: TOKENS.space[6],
            background: TOKENS.color.surfaceGlass,
            border: `1px solid ${TOKENS.color.borderSubtle}`,
            borderRadius: TOKENS.radius.lg,
          }}
        >
          <h2 style={{ fontSize: TOKENS.text.h2.size, margin: `0 0 ${TOKENS.space[3]}` }}>
            Precios honestos. Sin sorpresas.
          </h2>
          <p
            style={{
              color: TOKENS.color.textSecondary,
              maxWidth: 520,
              margin: `0 auto ${TOKENS.space[5]}`,
            }}
          >
            Empezá gratis 14 días sin tarjeta. Después: $97 USD/mo individual o $297 USD/mo agencia.
          </p>
          <Link to="/precios" style={ctaPrimaryInline()}>
            Ver planes →
          </Link>
        </div>
      </Section>

      {/* Social proof / honesty */}
      <Section>
        <Card style={{ textAlign: "center" }}>
          <h2 style={{ fontSize: TOKENS.text.h3.size, margin: `0 0 ${TOKENS.space[3]}` }}>
            Próximamente — primeros 20 usuarios
          </h2>
          <p style={{ color: TOKENS.color.textSecondary, margin: 0, maxWidth: 600, marginInline: "auto", lineHeight: 1.5 }}>
            Estamos seleccionando las primeras 20 reclutadoras y agencias para probar HRScout con
            feedback directo a Christian (fundador). Si te interesa entrar a este grupo,
            escribinos por WhatsApp.
          </p>
        </Card>
      </Section>

      {/* FAQ */}
      <Section>
        <h2
          style={{
            textAlign: "center",
            fontSize: TOKENS.text.h2.size,
            fontWeight: TOKENS.text.h2.weight,
            marginBottom: TOKENS.space[5],
          }}
        >
          Preguntas frecuentes
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: TOKENS.space[3] }}>
          {[
            {
              q: "¿Es legal usar IA para filtrar candidatos en México?",
              a: "Sí. Cumplimos con la LFPDPPP. Cada análisis incluye un disclaimer: el score es apoyo; la decisión final de contratación es responsabilidad del reclutador humano.",
            },
            {
              q: "¿Qué hacen con los CVs que subo?",
              a: "Extraemos el texto y lo guardamos cifrado (AES-128 + HMAC). Nombre y email del candidato se cifran en reposo. Nunca almacenamos el PDF original. Puedes eliminar cualquier candidato en 1 clic.",
            },
            {
              q: "¿Qué pasa cuando se acaba el trial?",
              a: "Tu cuenta pasa a modo lectura: ves todo tu historial y comparativas, pero no puedes correr nuevos análisis hasta que elijas un plan. No te cobramos nada sin tu autorización.",
            },
            {
              q: "¿Puedo cancelar cuando quiera?",
              a: "Sí, desde tu portal de Stripe en 2 clics. Sin llamadas, sin email de retención, sin penalización.",
            },
            {
              q: "¿Aceptan PDF y Word?",
              a: "Sí. Sube PDF, DOCX o pega texto directo. Hasta 10 MB por archivo.",
            },
            {
              q: "¿Se integra con LinkedIn o mi ATS?",
              a: "Aún no. Es nuestra siguiente prioridad post-lanzamiento. Mientras tanto, copias el job y subes los CVs — el flujo toma <2 minutos.",
            },
            {
              q: "¿Emiten factura CFDI?",
              a: "Por ahora la emitimos manualmente bajo solicitud. Estamos integrando facturación automática para Q3 2026.",
            },
          ].map((item, i) => (
            <details
              key={i}
              style={{
                padding: TOKENS.space[4],
                background: TOKENS.color.surfaceGlass,
                border: `1px solid ${TOKENS.color.borderSubtle}`,
                borderRadius: TOKENS.radius.md,
              }}
            >
              <summary
                style={{
                  cursor: "pointer",
                  fontWeight: 600,
                  fontSize: TOKENS.text.body.size,
                  color: TOKENS.color.textPrimary,
                }}
              >
                {item.q}
              </summary>
              <p
                style={{
                  marginTop: TOKENS.space[3],
                  color: TOKENS.color.textSecondary,
                  lineHeight: 1.6,
                  margin: `${TOKENS.space[3]} 0 0`,
                }}
              >
                {item.a}
              </p>
            </details>
          ))}
        </div>
      </Section>

      {/* Footer */}
      <footer
        style={{
          borderTop: `1px solid ${TOKENS.color.borderSubtle}`,
          padding: TOKENS.space[6],
          background: TOKENS.color.surfaceGlass,
          backdropFilter: "blur(12px)",
        }}
      >
        <div
          style={{
            maxWidth: 1100,
            margin: "0 auto",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: TOKENS.space[5],
          }}
        >
          <div>
            <h4 style={footerHeading()}>Producto</h4>
            <ul style={footerList()}>
              <li><Link to="/demo" style={footerLink()}>Demo en vivo</Link></li>
              <li><Link to="/precios" style={footerLink()}>Precios</Link></li>
              {user ? (
                <li><Link to="/dashboard" style={footerLink()}>Dashboard</Link></li>
              ) : (
                <li><Link to="/login" style={footerLink()}>Iniciar sesión</Link></li>
              )}
            </ul>
          </div>
          <div>
            <h4 style={footerHeading()}>Legal</h4>
            <ul style={footerList()}>
              <li><Link to="/terminos" style={footerLink()}>Términos</Link></li>
              <li><Link to="/privacidad" style={footerLink()}>Privacidad (LFPDPPP)</Link></li>
              <li><Link to="/cookies" style={footerLink()}>Cookies</Link></li>
            </ul>
          </div>
          <div>
            <h4 style={footerHeading()}>Contacto</h4>
            <ul style={footerList()}>
              <li style={{ color: TOKENS.color.textSecondary }}>hola@hrscout.mx</li>
              <li style={{ color: TOKENS.color.textSecondary }}>Hablar con Christian</li>
            </ul>
          </div>
        </div>
        <div
          style={{
            marginTop: TOKENS.space[6],
            paddingTop: TOKENS.space[4],
            borderTop: `1px solid ${TOKENS.color.borderSubtle}`,
            textAlign: "center",
            color: TOKENS.color.textMuted,
            fontSize: TOKENS.text.caption.size,
          }}
        >
          © 2026 HRScout · Hecho en México con cuidado para reclutadoras profesionales
        </div>
      </footer>
    </div>
  );
}

// Inline style helpers
function navLinkInline() {
  return {
    color: TOKENS.color.textSecondary,
    textDecoration: "none",
    fontSize: TOKENS.text.bodySm.size,
    fontWeight: 500,
  };
}
function primaryButtonInline() {
  return {
    padding: `${TOKENS.space[2]} ${TOKENS.space[4]}`,
    background: TOKENS.color.accent,
    color: TOKENS.color.textPrimary,
    borderRadius: TOKENS.radius.md,
    textDecoration: "none",
    fontSize: TOKENS.text.bodySm.size,
    fontWeight: 600,
    transition: `background ${TOKENS.motion.duration.fast}ms ${APPLE_EASE}`,
  };
}
function ctaPrimaryInline() {
  return {
    padding: `${TOKENS.space[3]} ${TOKENS.space[5]}`,
    background: TOKENS.color.accent,
    color: TOKENS.color.textPrimary,
    borderRadius: TOKENS.radius.md,
    textDecoration: "none",
    fontWeight: 600,
    fontSize: TOKENS.text.body.size,
  };
}
function ctaSecondaryInline() {
  return {
    padding: `${TOKENS.space[3]} ${TOKENS.space[5]}`,
    background: TOKENS.color.surfaceGlass,
    border: `1px solid ${TOKENS.color.borderSubtle}`,
    color: TOKENS.color.textSecondary,
    borderRadius: TOKENS.radius.md,
    textDecoration: "none",
    fontSize: TOKENS.text.body.size,
  };
}
function footerHeading() {
  return {
    fontSize: TOKENS.text.overline.size,
    letterSpacing: TOKENS.text.overline.letterSpacing,
    textTransform: TOKENS.text.overline.textTransform,
    color: TOKENS.color.textMuted,
    margin: `0 0 ${TOKENS.space[3]}`,
  };
}
function footerList() {
  return {
    listStyle: "none",
    padding: 0,
    margin: 0,
    display: "flex",
    flexDirection: "column",
    gap: TOKENS.space[2],
    fontSize: TOKENS.text.bodySm.size,
  };
}
function footerLink() {
  return {
    color: TOKENS.color.textSecondary,
    textDecoration: "none",
  };
}
