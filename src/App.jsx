import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";

// Constants
import { SAMPLE_CVS } from "./constants/sampleCvs";
import { PRESET_JOBS } from "./constants/presetJobs";
import { TRANSLATIONS } from "./constants/translations";

// Utils
import { agenticAnalyze } from "./utils/agenticPipeline";
import { generateComparativeAnalysis } from "./utils/comparativeAnalysis";
import { generateReport } from "./utils/reportGenerator";

// Services
import { analyzeCVWithClaude, analyzeWithToolUse } from "./services/api";

// Components
import { CandidateCard } from "./components/analysis/ScoreCard";
import { AnalyticsPanel } from "./components/analysis/AgenticResults";
import { ComparativePanel } from "./components/comparison/ComparativeView";
import { AddCandidateModal } from "./components/upload/CVUploader";
import { ContactBar, TourOverlay, TOUR_STEPS } from "./components/layout/Header";
import { ErrorBoundary } from "./components/common/ErrorBoundary";

// Apple easing
const APPLE_EASE = [0.16, 1, 0.3, 1];

// Glassmorphism style tokens
const glass = {
  background: 'rgba(255,255,255,0.03)',
  backdropFilter: 'blur(12px)',
  border: '1px solid rgba(255,255,255,0.06)',
  borderRadius: 16,
};

export default function CVScreener() {
  const [lang, setLang] = useState("es");
  const t = TRANSLATIONS[lang];

  // Scroll progress
  const [scrollProgress, setScrollProgress] = useState(0);

  // Lenis smooth scroll
  useEffect(() => {
    let lenis;
    let raf;
    const initLenis = async () => {
      try {
        const Lenis = (await import("lenis")).default;
        lenis = new Lenis({
          duration: 1.2,
          easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
          smoothWheel: true,
        });
        const animate = (time) => {
          lenis.raf(time);
          raf = requestAnimationFrame(animate);
        };
        raf = requestAnimationFrame(animate);

        lenis.on("scroll", ({ progress }) => {
          setScrollProgress(progress);
        });
      } catch {
        // Lenis not available, use fallback scroll listener
        const handleScroll = () => {
          const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
          const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
          setScrollProgress(scrollHeight > 0 ? scrollTop / scrollHeight : 0);
        };
        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => window.removeEventListener("scroll", handleScroll);
      }
    };
    initLenis();
    return () => {
      if (lenis) lenis.destroy();
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  // Cargar estado guardado de localStorage
  const savedJobDesc = (() => { try { return localStorage.getItem("hrscout_jobDesc"); } catch { return null; } })();
  const savedResults = (() => { try { const r = localStorage.getItem("hrscout_results"); return r ? JSON.parse(r) : null; } catch { return null; } })();

  const [jobDesc, setJobDesc] = useState(savedJobDesc || PRESET_JOBS["Especialista en IA"]);
  const [presetKey, setPresetKey] = useState(savedJobDesc ? "" : "Especialista en IA");
  const [candidates, setCandidates] = useState(SAMPLE_CVS);
  const [results, setResults] = useState(savedResults || {});
  const [analyzingId, setAnalyzingId] = useState(null);
  const [analyzingAll, setAnalyzingAll] = useState(false);
  const [ranked, setRanked] = useState([]);
  const [filter, setFilter] = useState("all");
  const [progressText, setProgressText] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [nextId, setNextId] = useState(100);
  const [comparativeAnalysis, setComparativeAnalysis] = useState(null);
  const [apiKey, setApiKey] = useState(() => { try { return localStorage.getItem("hrscout_apiKey") || ""; } catch { return ""; } });
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const [tourStep, setTourStep] = useState(0);
  const [tourActive, setTourActive] = useState(true);
  const cardRefs = useRef({});

  const isJobDescValid = jobDesc.trim().length >= 20;
  const customIds = useRef(new Set());

  // Persistir en localStorage
  useEffect(() => { try { localStorage.setItem("hrscout_results", JSON.stringify(results)); } catch {} }, [results]);
  useEffect(() => { try { localStorage.setItem("hrscout_jobDesc", jobDesc); } catch {} }, [jobDesc]);
  useEffect(() => { try { if (apiKey) localStorage.setItem("hrscout_apiKey", apiKey); else localStorage.removeItem("hrscout_apiKey"); } catch {} }, [apiKey]);

  // Restaurar rankings al montar
  useEffect(() => {
    if (savedResults && Object.keys(savedResults).length > 0) {
      const comp = generateComparativeAnalysis(candidates, savedResults, jobDesc);
      setComparativeAnalysis(comp);
      const newRanked = candidates
        .filter(c => savedResults[c.id])
        .sort((a, b) => (savedResults[b.id]?.score || 0) - (savedResults[a.id]?.score || 0));
      setRanked(newRanked.map(c => c.id));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const clearResults = () => {
    if (!window.confirm(t.clearConfirm)) return;
    setResults({}); setRanked([]); setComparativeAnalysis(null);
    try { localStorage.removeItem("hrscout_results"); } catch {}
  };

  const handlePresetChange = (key) => { setPresetKey(key); if (PRESET_JOBS[key]) setJobDesc(PRESET_JOBS[key]); };

  const handleAddCandidate = ({ name, cv }) => {
    const id = nextId; setNextId(prev => prev + 1);
    customIds.current.add(id);
    setCandidates(prev => [...prev, { id, name, cv }]);
  };

  const handleRemoveCandidate = (id) => {
    customIds.current.delete(id);
    setCandidates(prev => prev.filter(c => c.id !== id));
    setResults(prev => { const copy = { ...prev }; delete copy[id]; return copy; });
    setRanked(prev => prev.filter(rid => rid !== id));
  };

  const updateRankings = useCallback((updatedResults, currentCandidates) => {
    const newRanked = currentCandidates
      .filter(c => updatedResults[c.id])
      .sort((a, b) => (updatedResults[b.id]?.score || 0) - (updatedResults[a.id]?.score || 0));
    setRanked(newRanked.map(c => c.id));
    setComparativeAnalysis(generateComparativeAnalysis(currentCandidates, updatedResults, jobDesc));
  }, [jobDesc]);

  const analyzeCandidate = useCallback(async (candidate) => {
    if (analyzingId !== null) return;
    setAnalyzingId(candidate.id);
    const ref = cardRefs.current[candidate.id];
    if (ref) ref.scrollIntoView({ behavior: "smooth", block: "nearest" });

    const localResult = agenticAnalyze(jobDesc, candidate.cv, candidate.name, lang);
    let parsed = await analyzeWithToolUse(candidate.cv, jobDesc, localResult, apiKey);
    if (!parsed) parsed = await analyzeCVWithClaude(candidate.cv, jobDesc, localResult, apiKey);

    setResults(prev => { const updated = { ...prev, [candidate.id]: parsed }; updateRankings(updated, candidates); return updated; });
    setAnalyzingId(null);
  }, [analyzingId, candidates, jobDesc, updateRankings, apiKey, lang]);

  const analyzeAll = async () => {
    if (!isJobDescValid) return;
    setAnalyzingAll(true);
    for (let i = 0; i < candidates.length; i++) {
      const c = candidates[i];
      setProgressText(t.analyzingName(i + 1, candidates.length, c.name));
      setAnalyzingId(c.id);
      const ref = cardRefs.current[c.id];
      if (ref) ref.scrollIntoView({ behavior: "smooth", block: "nearest" });

      const localResult = agenticAnalyze(jobDesc, c.cv, c.name, lang);
      let parsed = await analyzeWithToolUse(c.cv, jobDesc, localResult, apiKey);
      if (!parsed) parsed = await analyzeCVWithClaude(c.cv, jobDesc, localResult, apiKey);

      setResults(prev => { const updated = { ...prev, [c.id]: parsed }; updateRankings(updated, candidates); return updated; });
      await new Promise(r => setTimeout(r, 200));
    }
    setAnalyzingId(null); setAnalyzingAll(false); setProgressText("");
  };

  // Ordenar y filtrar candidatos (memoized)
  const sortedCandidates = useMemo(() => ranked.length > 0
    ? [...candidates].sort((a, b) => {
        const ra = ranked.indexOf(a.id); const rb = ranked.indexOf(b.id);
        if (ra === -1 && rb === -1) return 0; if (ra === -1) return 1; if (rb === -1) return -1; return ra - rb;
      })
    : candidates, [candidates, ranked]);

  const filteredCandidates = useMemo(() => sortedCandidates.filter(c => {
    if (filter === "all") return true;
    const r = results[c.id]; if (!r) return false;
    if (filter === "apto") return r.score >= 80;
    if (filter === "revisar") return r.score >= 60 && r.score < 80;
    if (filter === "no_apto") return r.score < 60;
    return true;
  }), [sortedCandidates, filter, results]);

  const analyzed = Object.keys(results).length;
  const allAnalyzed = analyzed === candidates.length;
  const { aptos, avgScore } = useMemo(() => {
    const a = Object.values(results).filter(r => r.score >= 80).length;
    const avg = analyzed > 0 ? Math.round(Object.values(results).reduce((s, r) => s + r.score, 0) / analyzed) : 0;
    return { aptos: a, avgScore: avg };
  }, [results, analyzed]);

  const downloadReport = () => {
    const text = generateReport(candidates, results, jobDesc, t);
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob); const a = document.createElement("a");
    a.href = url; a.download = `reporte-hrscout-${new Date().toISOString().slice(0, 10)}.txt`; a.click(); URL.revokeObjectURL(url);
  };

  const handleTourNext = useCallback(async () => {
    const nextStep = tourStep + 1;
    const currentStep = TOUR_STEPS[tourStep];
    if (currentStep?.action === "analyzeAll") {
      setPresetKey("Especialista en IA"); setJobDesc(PRESET_JOBS["Especialista en IA"]);
      const currentJobDesc = PRESET_JOBS["Especialista en IA"] || jobDesc;
      if (currentJobDesc.trim().length >= 20) {
        setTourStep(nextStep); setAnalyzingAll(true);
        const allRes = {};
        for (let i = 0; i < candidates.length; i++) {
          const c = candidates[i];
          setProgressText(t.analyzingName(i + 1, candidates.length, c.name));
          setAnalyzingId(c.id);
          const ref = cardRefs.current[c.id]; if (ref) ref.scrollIntoView({ behavior: "smooth", block: "nearest" });
          allRes[c.id] = agenticAnalyze(currentJobDesc, c.cv, c.name, lang);
          setResults(prev => { const updated = { ...prev, [c.id]: allRes[c.id] }; updateRankings(updated, candidates); return updated; });
          await new Promise(r => setTimeout(r, 150));
        }
        setAnalyzingId(null); setAnalyzingAll(false); setProgressText(""); return;
      }
    }
    if (nextStep >= TOUR_STEPS.length) { setTourActive(false); return; }
    setTourStep(nextStep);
  }, [tourStep, candidates, jobDesc, t, updateRankings, lang]);

  const handleTourSkip = useCallback(() => { setTourActive(false); }, []);
  const handleTourRestart = useCallback(() => { setTourStep(0); }, []);

  return (
    <>
    {/* Scroll progress bar */}
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, height: 2, zIndex: 9990,
      background: "transparent",
    }}>
      <motion.div
        style={{
          height: "100%",
          background: "linear-gradient(90deg, #6366F1, #818CF8, #A78BFA)",
          transformOrigin: "left",
          scaleX: scrollProgress,
        }}
      />
    </div>

    <TourOverlay tourStep={tourStep} tourActive={tourActive} lang={lang} setLang={setLang} onNext={handleTourNext} onSkip={handleTourSkip} onRestart={handleTourRestart} totalSteps={TOUR_STEPS.length} />

    <div style={{ minHeight: "100vh", background: "#09090B", fontFamily: "'DM Sans', sans-serif", padding: "20px 16px", position: "relative" }} role="main" lang={lang}>
      {/* Film grain overlay */}
      <svg style={{ position: "fixed", inset: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 9989, opacity: 0.03 }}>
        <filter id="hrscout-grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#hrscout-grain)" />
      </svg>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@400;500&family=Cabinet+Grotesk:wght@700;800&display=swap');
        @keyframes fadeUp { from { opacity:0; transform:translateY(10px) } to { opacity:1; transform:translateY(0) } }
        @keyframes spin { to { transform:rotate(360deg) } }
        @keyframes checkPop { 0% { transform:scale(0); opacity:0 } 50% { transform:scale(1.3) } 100% { transform:scale(1); opacity:1 } }
        @keyframes gaugeRotate { from { stroke-dashoffset: var(--gauge-circumference) } to { stroke-dashoffset: var(--gauge-offset) } }
        * { box-sizing: border-box; transition-timing-function: cubic-bezier(0.16, 1, 0.3, 1); }
        textarea:focus, input:focus, select:focus { outline: none; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 2px; }
        html { scroll-behavior: smooth; }
      `}</style>

      <AnimatePresence>
        {showAddModal && <AddCandidateModal onAdd={handleAddCandidate} onClose={() => setShowAddModal(false)} t={t} />}
      </AnimatePresence>

      <div style={{ maxWidth: 1000, margin: "0 auto" }}>
        {/* HEADER */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: APPLE_EASE }}
          style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}
        >
          <div>
            <h1 style={{ margin: "0 0 4px", fontSize: "clamp(24px, 4vw, 36px)", fontWeight: 800, color: "#F8FAFC", letterSpacing: "-0.03em", fontFamily: "'DM Sans', sans-serif" }}>
              HR<span style={{ color: "#818CF8" }}>Scout</span>
              <span style={{ fontSize: 13, fontWeight: 500, color: "#6366F1", marginLeft: 10, verticalAlign: "middle", border: "1px solid #4F46E5", borderRadius: 5, padding: "2px 8px" }}>AI</span>
            </h1>
            <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.3)", fontFamily: "'DM Mono', monospace" }}>{t.subtitle}</p>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
            <div role="group" aria-label={t.langSwitch || "Idioma / Language"} style={{ display: "flex", ...glass, overflow: "hidden", height: 34, alignSelf: "center", padding: 0 }}>
              {["ES", "EN"].map((code) => {
                const isActive = lang === code.toLowerCase();
                return (<button key={code} onClick={() => setLang(code.toLowerCase())} aria-label={`${code === "ES" ? "Espanol" : "English"}`} aria-pressed={isActive} style={{ padding: "0 12px", background: isActive ? "rgba(99,102,241,0.18)" : "transparent", border: "none", cursor: "pointer", fontSize: 12, fontWeight: isActive ? 700 : 400, color: isActive ? "#818CF8" : "rgba(255,255,255,0.35)", fontFamily: "'DM Mono', monospace", letterSpacing: "0.05em", transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)", borderRight: code === "ES" ? "1px solid rgba(255,255,255,0.08)" : "none" }}>{code}</button>);
              })}
            </div>
            {[{ label: t.analyzed, value: `${analyzed}/${candidates.length}` }, { label: t.suitable, value: aptos, color: "#10B981" }, { label: t.avgScore, value: analyzed > 0 ? avgScore : "--", color: "#818CF8" }].map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 + i * 0.08, duration: 0.5, ease: APPLE_EASE }}
                aria-label={`${s.label}: ${s.value}`}
                style={{ ...glass, padding: "8px 14px", textAlign: "center" }}
              >
                <p style={{ margin: 0, fontSize: 18, fontWeight: 800, color: s.color || "#F8FAFC", fontFamily: "'DM Mono', monospace" }}>{s.value}</p>
                <p style={{ margin: 0, fontSize: 9, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.1em" }}>{s.label}</p>
              </motion.div>
            ))}
          </div>
        </motion.header>

        <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 20 }}>
          {/* PANEL IZQUIERDO -- JOB DESC */}
          <ErrorBoundary>
          <motion.section
            data-tour="job-desc"
            aria-label={t.jobDesc}
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: APPLE_EASE, delay: 0.15 }}
          >
            <div style={{ marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <label htmlFor="job-desc-textarea" style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)", fontFamily: "'DM Mono', monospace" }}>{t.jobDesc}</label>
            </div>
            <label htmlFor="preset-select" className="sr-only" style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0,0,0,0)" }}>{t.selectPreset}</label>
            <select id="preset-select" data-tour="preset-select" value={presetKey} onChange={e => handlePresetChange(e.target.value)} aria-label={t.selectPreset} style={{ width: "100%", marginBottom: 8, padding: "8px 10px", ...glass, color: "#A5B4FC", fontSize: 11, fontFamily: "'DM Mono', monospace", cursor: "pointer", appearance: "auto" }}>
              <option value="" style={{ background: "#1a1b26", color: "#A5B4FC" }}>{t.selectPreset}</option>
              {Object.keys(PRESET_JOBS).filter(k => k !== "").map(key => (<option key={key} value={key} style={{ background: "#1a1b26", color: "#D1D5DB" }}>{key}</option>))}
            </select>
            <textarea id="job-desc-textarea" value={jobDesc} onChange={e => { setJobDesc(e.target.value); setPresetKey(""); }} rows={14} aria-label={t.jobDesc} aria-invalid={!isJobDescValid} style={{ width: "100%", ...glass, padding: "12px 14px", borderColor: isJobDescValid ? "rgba(255,255,255,0.06)" : "rgba(239,68,68,0.3)", color: "#D1D5DB", fontSize: 12, lineHeight: 1.7, fontFamily: "'DM Sans', sans-serif", resize: "none", transition: "border-color 0.3s cubic-bezier(0.16, 1, 0.3, 1)" }} />
            {!isJobDescValid && <p role="alert" style={{ margin: "6px 0 0", fontSize: 11, color: "#EF4444", fontFamily: "'DM Mono', monospace" }}>{t.minChars(jobDesc.trim().length)}</p>}

            <button onClick={analyzeAll} disabled={analyzingAll || analyzingId !== null || !isJobDescValid} aria-label={analyzingAll ? (progressText || t.analyzing) : allAnalyzed ? t.reAnalyzeAll : t.analyzeAll} aria-busy={analyzingAll} style={{ width: "100%", marginTop: 10, padding: "13px", background: (analyzingAll || !isJobDescValid) ? "rgba(255,255,255,0.05)" : "linear-gradient(135deg, #6366F1, #4F46E5)", border: "none", borderRadius: 12, fontSize: 13, fontWeight: 700, color: (analyzingAll || !isJobDescValid) ? "#6B7280" : "#fff", cursor: (analyzingAll || !isJobDescValid) ? "default" : "pointer", fontFamily: "'DM Sans', sans-serif", boxShadow: (analyzingAll || !isJobDescValid) ? "none" : "0 0 24px rgba(99,102,241,0.4)", transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              {analyzingAll ? (<><div role="status" aria-label={t.analyzing} style={{ width: 14, height: 14, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.2)", borderTop: "2px solid #6366F1", animation: "spin 1s linear infinite" }} />{progressText || t.analyzing}</>) : allAnalyzed ? t.reAnalyzeAll : t.analyzeAll}
            </button>

            {/* API Key Input */}
            <div style={{ marginTop: 10, padding: 10, ...glass, borderColor: "rgba(99,102,241,0.12)" }}>
              {!showApiKeyInput && !apiKey ? (
                <button onClick={() => setShowApiKeyInput(true)} aria-label={t.apiKeyLabel} style={{ width: "100%", padding: "8px", borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: "pointer", background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.25)", color: "#A5B4FC", fontFamily: "'DM Mono', monospace", transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)" }}>{t.apiKeyLabel}</button>
              ) : apiKey ? (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 10, color: "#10B981", fontFamily: "'DM Mono', monospace" }}>&#10003; {t.apiKeySet}</span>
                  <button onClick={() => { setApiKey(""); setShowApiKeyInput(false); }} aria-label={t.apiKeyRemove} style={{ padding: "3px 8px", borderRadius: 6, fontSize: 10, cursor: "pointer", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#EF4444", fontFamily: "'DM Mono', monospace", transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)" }}>{t.apiKeyRemove}</button>
                </div>
              ) : (
                <div>
                  <label htmlFor="api-key-input" className="sr-only" style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0,0,0,0)" }}>{t.apiKeyPlaceholder}</label>
                  <input id="api-key-input" type="password" placeholder={t.apiKeyPlaceholder} value={apiKey} onChange={e => setApiKey(e.target.value)} aria-label={t.apiKeyPlaceholder} style={{ width: "100%", padding: "8px 10px", borderRadius: 8, fontSize: 11, ...glass, color: "#D1D5DB", fontFamily: "'DM Mono', monospace" }} onKeyDown={e => { if (e.key === "Escape") setShowApiKeyInput(false); }} />
                  <p style={{ margin: "4px 0 0", fontSize: 9, color: "rgba(255,255,255,0.25)", fontStyle: "italic" }}>{t.apiKeyLabel}</p>
                </div>
              )}
            </div>

            {/* Botones de descarga */}
            {analyzed > 0 && (
              <div data-tour="export-area" role="group" aria-label={t.downloadReport} style={{ display: "flex", gap: 6, marginTop: 8 }}>
                <button onClick={downloadReport} aria-label={t.downloadReport} style={{ flex: 1, padding: "11px", ...glass, background: "rgba(16,185,129,0.08)", borderColor: "rgba(16,185,129,0.2)", borderRadius: 12, fontSize: 12, fontWeight: 700, color: "#10B981", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)" }} onMouseEnter={e => { e.currentTarget.style.background = "rgba(16,185,129,0.18)"; e.currentTarget.style.boxShadow = "0 0 20px rgba(16,185,129,0.15)"; }} onMouseLeave={e => { e.currentTarget.style.background = "rgba(16,185,129,0.08)"; e.currentTarget.style.boxShadow = "none"; }}>{t.downloadReport}</button>
                <button onClick={() => {
                  const sorted = [...candidates].filter(c => results[c.id]).sort((a, b) => (results[b.id]?.score || 0) - (results[a.id]?.score || 0));
                  const data = sorted.map(c => ({ name: c.name, ...results[c.id] }));
                  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
                  const url = URL.createObjectURL(blob); const a = document.createElement("a");
                  a.href = url; a.download = `hrscout-${new Date().toISOString().slice(0, 10)}.json`; a.click(); URL.revokeObjectURL(url);
                }} aria-label={t.exportJSON} style={{ padding: "11px 14px", ...glass, background: "rgba(99,102,241,0.08)", borderColor: "rgba(99,102,241,0.2)", borderRadius: 12, fontSize: 12, fontWeight: 700, color: "#818CF8", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)" }} onMouseEnter={e => { e.currentTarget.style.background = "rgba(99,102,241,0.18)"; e.currentTarget.style.boxShadow = "0 0 20px rgba(99,102,241,0.15)"; }} onMouseLeave={e => { e.currentTarget.style.background = "rgba(99,102,241,0.08)"; e.currentTarget.style.boxShadow = "none"; }}>{t.exportJSON}</button>
              </div>
            )}

            {analyzed > 0 && (
              <button onClick={clearResults} aria-label={t.clearResults} style={{ width: "100%", marginTop: 6, padding: "9px", ...glass, background: "rgba(239,68,68,0.06)", borderColor: "rgba(239,68,68,0.15)", borderRadius: 12, fontSize: 11, fontWeight: 600, color: "#EF4444", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)" }} onMouseEnter={e => { e.currentTarget.style.background = "rgba(239,68,68,0.12)"; }} onMouseLeave={e => { e.currentTarget.style.background = "rgba(239,68,68,0.06)"; }}>{t.clearResults}</button>
            )}

            {analyzed > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: APPLE_EASE }}
                style={{ marginTop: 12, padding: 12, ...glass, background: "rgba(99,102,241,0.06)", borderColor: "rgba(99,102,241,0.15)" }}
              >
                <p style={{ margin: "0 0 8px", fontSize: 10, fontWeight: 700, color: "#818CF8", letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "'DM Mono', monospace" }}>{t.processSummary}</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {[{ label: t.totalCandidates, value: candidates.length }, { label: t.suitableGte80, value: aptos, color: "#10B981" }, { label: t.reviewRange, value: Object.values(results).filter(r => r.score >= 60 && r.score < 80).length, color: "#F59E0B" }, { label: t.notSuitableLt60, value: Object.values(results).filter(r => r.score < 60).length, color: "#EF4444" }].map((item, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{item.label}</span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: item.color || "#F8FAFC", fontFamily: "'DM Mono', monospace" }}>{item.value}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </motion.section>
          </ErrorBoundary>

          {/* PANEL DERECHO -- CANDIDATOS */}
          <ErrorBoundary>
          <motion.section
            data-tour="candidates"
            aria-label={t.candidates}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: APPLE_EASE, delay: 0.2 }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)", fontFamily: "'DM Mono', monospace" }}>
                {t.candidates} &middot; {ranked.length > 0 ? t.sortedByFit : t.unsorted}
              </label>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                {ranked.length > 0 && <span style={{ fontSize: 10, color: "#818CF8", fontFamily: "'DM Mono', monospace" }}>{t.top}: {sortedCandidates[0]?.name}</span>}
                <button onClick={() => setShowAddModal(true)} aria-label={t.addCandidate} style={{ padding: "5px 12px", borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: "pointer", ...glass, background: "rgba(245,158,11,0.12)", borderColor: "rgba(245,158,11,0.3)", color: "#F59E0B", fontFamily: "'DM Sans', sans-serif", transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)" }} onMouseEnter={e => { e.currentTarget.style.background = "rgba(245,158,11,0.22)"; e.currentTarget.style.boxShadow = "0 0 16px rgba(245,158,11,0.15)"; }} onMouseLeave={e => { e.currentTarget.style.background = "rgba(245,158,11,0.12)"; e.currentTarget.style.boxShadow = "none"; }}>{t.addCandidate}</button>
              </div>
            </div>

            {analyzed > 0 && (
              <div role="group" aria-label={t.filterAll} style={{ display: "flex", gap: 6, marginBottom: 12 }}>
                {[{ id: "all", label: t.filterAll, color: "#818CF8" }, { id: "apto", label: t.filterSuitable, color: "#10B981" }, { id: "revisar", label: t.filterReview, color: "#F59E0B" }, { id: "no_apto", label: t.filterNotSuitable, color: "#EF4444" }].map(f => (
                  <button key={f.id} onClick={() => setFilter(f.id)} aria-pressed={filter === f.id} aria-label={f.label} style={{
                    padding: "6px 14px", borderRadius: 20, fontSize: 11, fontWeight: 600,
                    background: filter === f.id ? `${f.color}18` : "rgba(255,255,255,0.03)",
                    backdropFilter: "blur(12px)",
                    border: `1px solid ${filter === f.id ? `${f.color}40` : "rgba(255,255,255,0.06)"}`,
                    color: filter === f.id ? f.color : "rgba(255,255,255,0.4)",
                    cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
                    transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
                    boxShadow: filter === f.id ? `0 0 16px ${f.color}20` : "none",
                  }}>{f.label}</button>
                ))}
              </div>
            )}

            <div aria-live="polite" aria-label={t.candidates} style={{ maxHeight: "calc(100vh - 200px)", overflowY: "auto", paddingRight: 4 }}>
              {filteredCandidates.map((c, i) => (
                <motion.div
                  key={c.id}
                  data-tour={i === 0 ? "candidate-0" : undefined}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08, duration: 0.5, ease: APPLE_EASE }}
                >
                  <CandidateCard candidate={c} rank={i + 1} onAnalyze={analyzeCandidate} analyzing={analyzingId === c.id} globalAnalyzing={analyzingAll} result={results[c.id]} cardRef={el => { cardRefs.current[c.id] = el; }} onRemove={handleRemoveCandidate} isCustom={customIds.current.has(c.id)} t={t} jobDescription={jobDesc} lang={lang} />
                </motion.div>
              ))}
              {filteredCandidates.length === 0 && analyzed > 0 && (
                <div role="status" style={{ textAlign: "center", padding: 40, color: "rgba(255,255,255,0.3)", fontSize: 13 }}>{t.noCandidatesInCategory}</div>
              )}
            </div>

            <ErrorBoundary>
              <ComparativePanel analysis={comparativeAnalysis} candidates={candidates} results={results} t={t} />
            </ErrorBoundary>
            <ErrorBoundary>
              <AnalyticsPanel results={results} candidates={candidates} t={t} />
            </ErrorBoundary>
          </motion.section>
          </ErrorBoundary>
        </div>

        <p style={{ textAlign: "center", marginTop: 20, fontSize: 10, color: "rgba(255,255,255,0.1)", fontFamily: "'DM Mono', monospace", letterSpacing: "0.1em" }}>{t.footer}</p>
      </div>
    </div>
    <ContactBar t={t} />
    </>
  );
}
