import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ── Mini Demo: Animated Score Gauge (0 → target) ──
function MiniGaugeDemo({ target = 85 }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let frame; let start; const dur = 1200;
    const animate = (ts) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / dur, 1);
      setVal(Math.round(p * target));
      if (p < 1) frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [target]);

  const r = 36, c = 2 * Math.PI * r, off = c - (val / 100) * c;
  const color = val >= 80 ? "#10B981" : val >= 60 ? "#F59E0B" : "#EF4444";
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", margin: "12px 0" }}>
      <svg width="90" height="90" viewBox="0 0 90 90">
        <circle cx="45" cy="45" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
        <circle cx="45" cy="45" r={r} fill="none" stroke={color} strokeWidth="6"
          strokeLinecap="round" strokeDasharray={c} strokeDashoffset={off}
          transform="rotate(-90 45 45)" style={{ transition: "stroke-dashoffset 0.08s linear, stroke 0.3s" }} />
        <text x="45" y="45" textAnchor="middle" dominantBaseline="central"
          fill={color} fontSize="20" fontWeight="800" fontFamily="'DM Mono', monospace">{val}</text>
      </svg>
    </div>
  );
}

// ── Mini Demo: Radar Chart SVG ──
function MiniRadarDemo() {
  const axes = [
    { label: "Skills", value: 0.9 },
    { label: "Exp", value: 0.7 },
    { label: "Edu", value: 0.8 },
    { label: "Lang", value: 0.65 },
    { label: "Overall", value: 0.85 },
  ];
  const cx = 70, cy = 70, maxR = 55, n = axes.length;
  const angle = (i) => (Math.PI * 2 * i) / n - Math.PI / 2;
  const gridLevels = [0.33, 0.66, 1];

  const dataPoints = axes.map((a, i) => {
    const ang = angle(i);
    return `${cx + Math.cos(ang) * maxR * a.value},${cy + Math.sin(ang) * maxR * a.value}`;
  }).join(" ");

  return (
    <div style={{ display: "flex", justifyContent: "center", margin: "12px 0" }}>
      <svg width="140" height="140" viewBox="0 0 140 140">
        {gridLevels.map((lv, li) => (
          <polygon key={li}
            points={axes.map((_, i) => `${cx + Math.cos(angle(i)) * maxR * lv},${cy + Math.sin(angle(i)) * maxR * lv}`).join(" ")}
            fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
        ))}
        {axes.map((_, i) => (
          <line key={i} x1={cx} y1={cy}
            x2={cx + Math.cos(angle(i)) * maxR} y2={cy + Math.sin(angle(i)) * maxR}
            stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
        ))}
        <polygon points={dataPoints} fill="rgba(99,102,241,0.2)" stroke="#6366F1" strokeWidth="2" />
        {axes.map((a, i) => {
          const ang = angle(i);
          const lx = cx + Math.cos(ang) * (maxR + 14);
          const ly = cy + Math.sin(ang) * (maxR + 14);
          return <text key={i} x={lx} y={ly} textAnchor="middle" dominantBaseline="central"
            fill="rgba(255,255,255,0.45)" fontSize="8" fontFamily="'DM Mono', monospace">{a.label}</text>;
        })}
      </svg>
    </div>
  );
}

// Barra de contacto CTA en la parte inferior
export function ContactBar({ t }) {
  const [show, setShow] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem('cta-dismissed')) return;
    const timer = setTimeout(() => setShow(true), 10000);
    return () => clearTimeout(timer);
  }, []);

  // Auto-dismiss after 5 seconds of being visible
  useEffect(() => {
    if (!show || dismissed) return;
    const timer = setTimeout(() => {
      setFading(true);
      setTimeout(() => { setDismissed(true); sessionStorage.setItem('cta-dismissed', '1'); }, 500);
    }, 5000);
    return () => clearTimeout(timer);
  }, [show, dismissed]);

  if (dismissed || !show) return null;
  const dismiss = () => { setFading(true); setTimeout(() => { setDismissed(true); sessionStorage.setItem('cta-dismissed', '1'); }, 300); };
  return (
    <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 9999, background: 'rgba(10,11,15,0.95)', backdropFilter: 'blur(12px)', borderTop: '1px solid rgba(99,102,241,0.2)', padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', animation: fading ? 'none' : 'slideUpCTA 0.4s ease', fontFamily: "'DM Sans', sans-serif", opacity: fading ? 0 : 1, transition: 'opacity 0.5s ease' }}>
      <style>{`@keyframes slideUpCTA { from { transform: translateY(100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }`}</style>
      <span style={{ color: '#E2E8F0', fontSize: 14, fontWeight: 500 }}>{t.ctaText}</span>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <a href="https://impulso-ia-navy.vercel.app/#contacto" target="_blank" rel="noopener noreferrer" style={{ padding: '8px 18px', borderRadius: 8, background: 'linear-gradient(135deg, #6366F1, #4F46E5)', color: '#fff', fontSize: 13, fontWeight: 600, textDecoration: 'none', transition: 'transform 0.2s' }}>{t.ctaButton}</a>
        <a href="https://wa.me/525579605324?text=Hola%20Christian%2C%20me%20interesa%20saber%20m%C3%A1s%20sobre%20tus%20servicios%20de%20IA" target="_blank" rel="noopener noreferrer" style={{ padding: '8px 18px', borderRadius: 8, background: 'rgba(37,211,102,0.15)', border: '1px solid rgba(37,211,102,0.3)', color: '#25D366', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>WhatsApp</a>
        <button onClick={dismiss} aria-label="Cerrar / Dismiss" style={{ background: 'none', border: 'none', color: '#64748B', fontSize: 18, cursor: 'pointer', padding: '4px 8px' }}>&#10005;</button>
      </div>
    </div>
  );
}

// Overlay del tour interactivo — 7 steps with mini demos
const TOUR_STEPS = [
  {
    id: "welcome",
    target: null,
    title: { en: "HRScout \u2014 AI-Powered CV Screening", es: "HRScout \u2014 Filtrado de CVs con IA" },
    text: {
      en: "Screen candidates in seconds, not hours. Paste a job description, upload CVs, and let AI rank everyone 0-100 with strengths, gaps, and interview questions.\n\nLet me show you how it works!",
      es: "Filtra candidatos en segundos, no en horas. Pega una descripci\u00f3n de puesto, sube CVs, y deja que la IA rankee a todos 0-100 con fortalezas, brechas y preguntas de entrevista.\n\n\u00a1D\u00e9jame mostrarte c\u00f3mo funciona!"
    },
    btn: { en: "Start Tour \u2192", es: "Iniciar Tour \u2192" },
    demo: null,
  },
  {
    id: "job-desc",
    target: "[data-tour='job-desc']",
    title: { en: "Step 1 \u2014 Job Description", es: "Paso 1 \u2014 Descripci\u00f3n del Puesto" },
    text: {
      en: "Paste a job description here. The AI will use it to score candidates \u2014 extracting required skills, experience levels, and keywords automatically.",
      es: "Pega una descripci\u00f3n del puesto aqu\u00ed. La IA la usar\u00e1 para puntuar candidatos \u2014 extrayendo habilidades requeridas, niveles de experiencia y palabras clave autom\u00e1ticamente."
    },
    btn: { en: "Next \u2192", es: "Siguiente \u2192" },
    demo: null,
  },
  {
    id: "add-candidates",
    target: "[data-tour='candidates']",
    title: { en: "Step 2 \u2014 Add Candidates", es: "Paso 2 \u2014 Agregar Candidatos" },
    text: {
      en: "Upload CVs individually or in batch (up to 10 files). The AI extracts skills, experience, education, and languages automatically from each resume.",
      es: "Sube CVs individualmente o en lote (hasta 10 archivos). La IA extrae habilidades, experiencia, educaci\u00f3n e idiomas autom\u00e1ticamente de cada CV."
    },
    btn: { en: "Analyze \u2192", es: "Analizar \u2192" },
    action: "analyzeAll",
    demo: null,
  },
  {
    id: "analysis-score",
    target: "[data-tour='candidate-0']",
    title: { en: "Step 3 \u2014 Analysis", es: "Paso 3 \u2014 An\u00e1lisis" },
    text: {
      en: "Click 'Analyze All' to score every candidate 0-100. The score gauge animates in real-time as each CV is processed.",
      es: "Haz clic en 'Analizar Todos' para puntuar cada candidato 0-100. El medidor de puntaje se anima en tiempo real mientras se procesa cada CV."
    },
    btn: { en: "Next \u2192", es: "Siguiente \u2192" },
    demo: "gauge",
  },
  {
    id: "radar-chart",
    target: "[data-tour='candidate-0']",
    title: { en: "Step 4 \u2014 Radar Chart", es: "Paso 4 \u2014 Gr\u00e1fico Radar" },
    text: {
      en: "Compare candidates visually with the radar chart. 5 axes: Skills, Experience, Education, Languages, Overall.",
      es: "Compara candidatos visualmente con el gr\u00e1fico radar. 5 ejes: Habilidades, Experiencia, Educaci\u00f3n, Idiomas, General."
    },
    btn: { en: "Next \u2192", es: "Siguiente \u2192" },
    demo: "radar",
  },
  {
    id: "interview-questions",
    target: "[data-tour='candidate-0']",
    title: { en: "Step 5 \u2014 Interview Questions", es: "Paso 5 \u2014 Preguntas de Entrevista" },
    text: {
      en: "Auto-generated interview questions based on CV gaps. 4 categories: Technical, Experience, Culture Fit, Problem Solving.",
      es: "Preguntas de entrevista auto-generadas basadas en brechas del CV. 4 categor\u00edas: T\u00e9cnicas, Experiencia, Cultura, Resoluci\u00f3n de Problemas."
    },
    btn: { en: "Next \u2192", es: "Siguiente \u2192" },
    demo: null,
  },
  {
    id: "final",
    target: null,
    title: { en: "You're Ready!", es: "\u00a1Listo para empezar!" },
    text: {
      en: "Paste a job description and start screening. The AI will handle keyword extraction, scoring, ranking, and interview prep for you.",
      es: "Pega una descripci\u00f3n de puesto y comienza a filtrar. La IA se encargar\u00e1 de la extracci\u00f3n de keywords, puntuaci\u00f3n, ranking y preparaci\u00f3n de entrevistas por ti."
    },
    btn: { en: "Get Started \u2713", es: "Comenzar \u2713" },
    demo: null,
  },
];

export { TOUR_STEPS };

// ── Progress Dots ──
function ProgressDots({ current, total }) {
  return (
    <div style={{ display: "flex", justifyContent: "center", gap: 6, margin: "16px 0 4px" }}>
      {Array.from({ length: total }, (_, i) => (
        <div key={i} style={{
          width: i === current ? 18 : 6, height: 6, borderRadius: 3,
          background: i === current ? "#6366F1" : i < current ? "rgba(99,102,241,0.4)" : "rgba(255,255,255,0.1)",
          transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
        }} />
      ))}
    </div>
  );
}

export function TourOverlay({ tourStep, tourActive, lang, setLang, onNext, onSkip, totalSteps, onRestart }) {
  const step = TOUR_STEPS[tourStep];
  const [showCompletion, setShowCompletion] = useState(false);
  const [targetRect, setTargetRect] = useState(null);

  const isWelcome = tourStep === 0;
  const isFinal = tourStep === TOUR_STEPS.length - 1;

  // Auto-scroll al target (hooks MUST be before any return)
  useEffect(() => {
    if (!tourActive || !step?.target) return;
    const el = document.querySelector(step.target);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [tourStep, tourActive, step]);

  // Obtener rect del target para spotlight
  useEffect(() => {
    if (!tourActive || !step?.target) { setTargetRect(null); return; }
    const updateRect = () => {
      const el = document.querySelector(step.target);
      if (el) {
        const r = el.getBoundingClientRect();
        setTargetRect({ top: r.top - 8, left: r.left - 8, width: r.width + 16, height: r.height + 16 });
      }
    };
    const timer = setTimeout(updateRect, 350);
    window.addEventListener("resize", updateRect);
    window.addEventListener("scroll", updateRect, true);
    return () => { clearTimeout(timer); window.removeEventListener("resize", updateRect); window.removeEventListener("scroll", updateRect, true); };
  }, [tourStep, tourActive, step]);

  // Early return AFTER all hooks
  if (!tourActive || !step) return null;

  // Render mini demo
  const renderDemo = () => {
    if (step.demo === "gauge") return <MiniGaugeDemo target={85} />;
    if (step.demo === "radar") return <MiniRadarDemo />;
    return null;
  };

  // Modal centrado (welcome + final)
  if (isWelcome || isFinal) {
    return (
      <AnimatePresence mode="wait">
        <motion.div
          key={`tour-${tourStep}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          style={{
            position: "fixed", inset: 0, zIndex: 10000,
            background: "rgba(0,0,0,0.82)", backdropFilter: "blur(6px)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: "'DM Sans', sans-serif",
            cursor: "pointer",
          }}
          onClick={(e) => {
            if (e.target.closest('[data-tour-tooltip]') || e.target.closest('button')) return;
            onNext();
          }}>
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            data-tour-tooltip
            style={{
              background: "#14151F", border: "1px solid rgba(99,102,241,0.3)",
              borderRadius: 16, padding: "36px 32px", width: "92%", maxWidth: 480,
              boxShadow: "0 24px 64px rgba(0,0,0,0.6), 0 0 40px rgba(99,102,241,0.15)",
              textAlign: "center",
            }}>
            <h2 style={{ margin: "0 0 6px", fontSize: 24, fontWeight: 800, color: "#F8FAFC", letterSpacing: "-0.02em" }}>
              {step.title[lang]}
            </h2>
            <div style={{ margin: "16px 0 12px", fontSize: 14, color: "rgba(255,255,255,0.65)", lineHeight: 1.7, whiteSpace: "pre-line", textAlign: "left" }}>
              {step.text[lang]}
            </div>

            <ProgressDots current={tourStep} total={TOUR_STEPS.length} />

            {/* Selector de idioma en welcome */}
            {isWelcome && (
              <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 16, marginTop: 8 }}>
                {["es", "en"].map(code => (
                  <button
                    key={code}
                    onClick={() => setLang(code)}
                    style={{
                      padding: "8px 20px", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer",
                      background: lang === code ? "rgba(99,102,241,0.2)" : "rgba(255,255,255,0.04)",
                      border: `1px solid ${lang === code ? "rgba(99,102,241,0.5)" : "rgba(255,255,255,0.1)"}`,
                      color: lang === code ? "#A5B4FC" : "rgba(255,255,255,0.4)",
                      fontFamily: "'DM Mono', monospace", letterSpacing: "0.08em",
                      transition: "all 0.15s",
                    }}
                  >
                    {code.toUpperCase()}
                  </button>
                ))}
              </div>
            )}

            {!isFinal && (
              <div style={{ display: "flex", justifyContent: "center", gap: 12, marginTop: 8 }}>
                <button
                  onClick={onSkip}
                  aria-label="Skip tour"
                  style={{
                    padding: "10px 22px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer",
                    background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
                    color: "rgba(255,255,255,0.4)", fontFamily: "'DM Sans', sans-serif",
                    transition: "all 0.15s",
                  }}
                >
                  Skip
                </button>
                <button
                  onClick={onNext}
                  aria-label={step.btn[lang]}
                  style={{
                    padding: "10px 28px", borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: "pointer",
                    background: "linear-gradient(135deg, #6366F1, #4F46E5)", border: "none",
                    color: "#fff", fontFamily: "'DM Sans', sans-serif",
                    boxShadow: "0 0 20px rgba(99,102,241,0.4)",
                    transition: "all 0.15s",
                  }}
                >
                  {step.btn[lang]}
                </button>
              </div>
            )}

            {isFinal && !showCompletion && (
              <div style={{ display: "flex", justifyContent: "center", gap: 12, marginTop: 8 }}>
                <button
                  onClick={onSkip}
                  aria-label="Skip"
                  style={{
                    padding: "10px 22px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer",
                    background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
                    color: "rgba(255,255,255,0.4)", fontFamily: "'DM Sans', sans-serif",
                    transition: "all 0.15s",
                  }}
                >
                  Skip
                </button>
                <button
                  onClick={() => { setShowCompletion(true); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  aria-label={step.btn[lang]}
                  style={{
                    padding: "10px 28px", borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: "pointer",
                    background: "linear-gradient(135deg, #6366F1, #4F46E5)", border: "none",
                    color: "#fff", fontFamily: "'DM Sans', sans-serif",
                    boxShadow: "0 0 20px rgba(99,102,241,0.4)",
                    transition: "all 0.15s",
                  }}
                >
                  {step.btn[lang]}
                </button>
              </div>
            )}

            {isFinal && showCompletion && (
              <>
                <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 8, margin: "16px 0 24px" }}>
                  {["103 Tests", "100+ Synonyms", "Radar Chart", "Interview Generator"].map(tag => (
                    <span key={tag} style={{
                      padding: "5px 14px", borderRadius: 20, fontSize: 12, fontWeight: 600,
                      background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.3)",
                      color: "#A5B4FC", fontFamily: "'DM Mono', monospace",
                    }}>{tag}</span>
                  ))}
                </div>
                <div style={{ display: "flex", justifyContent: "center", gap: 12, marginTop: 8 }}>
                  <button
                    onClick={() => { setShowCompletion(false); if (onRestart) onRestart(); }}
                    style={{
                      padding: "10px 22px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer",
                      background: "rgba(255,255,255,0.05)", border: "1px solid rgba(99,102,241,0.3)",
                      color: "#A5B4FC", fontFamily: "'DM Sans', sans-serif",
                      transition: "all 0.15s",
                    }}
                  >
                    {lang === "en" ? "Restart Tour" : "Reiniciar Tour"}
                  </button>
                  <button
                    onClick={() => { setShowCompletion(false); onSkip(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                    style={{
                      padding: "10px 28px", borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: "pointer",
                      background: "linear-gradient(135deg, #6366F1, #4F46E5)", border: "none",
                      color: "#fff", fontFamily: "'DM Sans', sans-serif",
                      boxShadow: "0 0 20px rgba(99,102,241,0.4)",
                      transition: "all 0.15s",
                    }}
                  >
                    {lang === "en" ? "Explore" : "Explorar"}
                  </button>
                </div>
              </>
            )}
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  }

  // Steps con tooltip y spotlight
  const tooltipStyle = (() => {
    if (!targetRect) return { top: "50%", left: "50%", transform: "translate(-50%, -50%)" };
    const viewH = window.innerHeight;
    const below = targetRect.top + targetRect.height + 16;
    const above = targetRect.top - 16;
    if (below + 260 < viewH) {
      return { top: below, left: Math.max(16, Math.min(targetRect.left, window.innerWidth - 380)), transform: "none" };
    }
    return { top: Math.max(16, above - 260), left: Math.max(16, Math.min(targetRect.left, window.innerWidth - 380)), transform: "none" };
  })();

  return (
    <AnimatePresence mode="wait">
      <motion.div key={`tour-step-${tourStep}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
        {/* Overlay oscuro con recorte de spotlight */}
        <div style={{ position: "fixed", inset: 0, zIndex: 9998, pointerEvents: "none" }}>
          <svg width="100%" height="100%" style={{ position: "absolute", inset: 0 }}>
            <defs>
              <mask id="tour-spotlight-mask">
                <rect width="100%" height="100%" fill="white" />
                {targetRect && (
                  <rect
                    x={targetRect.left} y={targetRect.top}
                    width={targetRect.width} height={targetRect.height}
                    rx="12" fill="black"
                  />
                )}
              </mask>
            </defs>
            <rect width="100%" height="100%" fill="rgba(0,0,0,0.72)" mask="url(#tour-spotlight-mask)" />
          </svg>
        </div>

        {/* Borde glow del spotlight */}
        {targetRect && (
          <div style={{
            position: "fixed", zIndex: 9999,
            top: targetRect.top, left: targetRect.left,
            width: targetRect.width, height: targetRect.height,
            borderRadius: 12, border: "2px solid rgba(99,102,241,0.5)",
            boxShadow: "0 0 24px rgba(99,102,241,0.25)",
            pointerEvents: "none",
          }} />
        )}

        {/* Tap anywhere to advance */}
        <div style={{ position: "fixed", inset: 0, zIndex: 9999, cursor: "pointer" }} onClick={(e) => {
          if (e.target.closest('[data-tour-tooltip]') || e.target.closest('button')) return;
          onNext();
        }} />

        {/* Tooltip */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}

          data-tour-tooltip
          style={{
            position: "fixed", zIndex: 10001,
            ...tooltipStyle,
            background: "#14151F", border: "1px solid rgba(99,102,241,0.35)",
            borderRadius: 12, padding: "18px 20px", width: 360, maxWidth: "90vw",
            boxShadow: "0 16px 48px rgba(0,0,0,0.5), 0 0 20px rgba(99,102,241,0.1)",
            fontFamily: "'DM Sans', sans-serif",
          }}>
          {/* Contador de steps + progress dots */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", fontFamily: "'DM Mono', monospace", letterSpacing: "0.08em" }}>
              {lang === "es" ? `Paso ${tourStep} de ${TOUR_STEPS.length - 1}` : `Step ${tourStep} of ${TOUR_STEPS.length - 1}`}
            </span>
            <button
              onClick={onSkip}
              style={{
                background: "none", border: "none", cursor: "pointer",
                fontSize: 10, color: "rgba(255,255,255,0.3)",
                fontFamily: "'DM Mono', monospace", textDecoration: "underline",
                padding: 0,
              }}
            >
              {lang === "es" ? "Saltar tour" : "Skip Tour"}
            </button>
          </div>

          <h3 style={{ margin: "0 0 6px", fontSize: 15, fontWeight: 700, color: "#F8FAFC" }}>
            {step.title[lang]}
          </h3>
          <p style={{ margin: "0 0 8px", fontSize: 13, color: "rgba(255,255,255,0.6)", lineHeight: 1.6 }}>
            {step.text[lang]}
          </p>

          {/* Mini demo */}
          {renderDemo()}

          <ProgressDots current={tourStep} total={TOUR_STEPS.length} />

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
            <button
              onClick={onSkip}
              style={{
                padding: "7px 16px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer",
                background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
                color: "rgba(255,255,255,0.35)", fontFamily: "'DM Sans', sans-serif",
                transition: "all 0.15s",
              }}
            >
              Skip
            </button>
            <button
              onClick={onNext}
              style={{
                padding: "9px 22px", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer",
                background: "linear-gradient(135deg, #6366F1, #4F46E5)", border: "none",
                color: "#fff", fontFamily: "'DM Sans', sans-serif",
                boxShadow: "0 0 16px rgba(99,102,241,0.35)",
                transition: "all 0.15s",
              }}
            >
              {step.btn[lang]}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
