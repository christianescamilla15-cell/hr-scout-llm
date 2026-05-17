import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { ApiError, api } from "../api/client";
import { AnalysisCard } from "../components/analysis/AnalysisCard";
import { ScorePill } from "../components/analysis/ScorePill";
import { AddCandidateForm } from "../components/upload/AddCandidateForm";
import { TOKENS } from "../constants/tokens";

function dateLine(iso) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return iso.split("T")[0];
  }
}

export function JobDetailPage() {
  const { jobId } = useParams();
  const [job, setJob] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [analyses, setAnalyses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [analyzingId, setAnalyzingId] = useState(null);

  useEffect(() => {
    document.title = job ? `${job.title} · HRScout` : "Vacante · HRScout";
  }, [job]);

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const [jobData, candData, analysesData] = await Promise.all([
        api.get(`/api/jobs/${jobId}`),
        api.get(`/api/candidates`),
        api.get(`/api/analyses?job_id=${jobId}`),
      ]);
      setJob(jobData);
      setCandidates(candData.items);
      setAnalyses(analysesData.items);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  useEffect(() => {
    load();
  }, [load]);

  const analysesByCandidate = useMemo(() => {
    const map = new Map();
    for (const a of analyses) {
      const existing = map.get(a.candidate_id);
      if (!existing || new Date(a.created_at) > new Date(existing.created_at)) {
        map.set(a.candidate_id, a);
      }
    }
    return map;
  }, [analyses]);

  const handleCandidateCreated = (created) => {
    setCandidates((prev) => [created, ...prev]);
  };

  const handleAnalyze = async (candidateId) => {
    setAnalyzingId(candidateId);
    setError(null);
    try {
      const created = await api.post("/api/analyses", {
        job_id: jobId,
        candidate_id: candidateId,
      });
      setAnalyses((prev) => [created, ...prev]);
    } catch (err) {
      setError(err);
    } finally {
      setAnalyzingId(null);
    }
  };

  if (loading) {
    return <div style={{ color: TOKENS.color.textMuted, padding: TOKENS.space[6] }}>Cargando…</div>;
  }
  if (error && !job) {
    return (
      <div role="alert" style={errorBoxStyle()}>
        {error.detail || error.message}
        {error instanceof ApiError && error.status === 404 && (
          <div style={{ marginTop: TOKENS.space[3] }}>
            <Link to="/jobs" style={{ color: TOKENS.color.accent }}>Volver a vacantes</Link>
          </div>
        )}
      </div>
    );
  }
  if (!job) return null;

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", display: "flex", flexDirection: "column", gap: TOKENS.space[6] }}>
      <header>
        <Link to="/jobs" style={{ color: TOKENS.color.textMuted, fontSize: TOKENS.text.bodySm.size, textDecoration: "none" }}>
          ← Vacantes
        </Link>
        <h1 style={{ fontSize: TOKENS.text.h1.size, fontWeight: TOKENS.text.h1.weight, margin: `${TOKENS.space[2]} 0 ${TOKENS.space[2]}` }}>
          {job.title}
        </h1>
        <div style={{ color: TOKENS.color.textMuted, fontSize: TOKENS.text.bodySm.size }}>
          Creada {dateLine(job.created_at)} · {job.language.toUpperCase()}
        </div>
        <details style={{ marginTop: TOKENS.space[3], color: TOKENS.color.textSecondary }}>
          <summary style={{ cursor: "pointer", color: TOKENS.color.textMuted, fontSize: TOKENS.text.bodySm.size }}>
            Ver descripción completa
          </summary>
          <pre
            style={{
              whiteSpace: "pre-wrap",
              fontFamily: TOKENS.font.body,
              padding: TOKENS.space[3],
              marginTop: TOKENS.space[2],
              background: TOKENS.color.surfaceRaised,
              borderRadius: TOKENS.radius.md,
              fontSize: TOKENS.text.bodySm.size,
            }}
          >
            {job.description}
          </pre>
        </details>
      </header>

      {error && (
        <div role="alert" style={errorBoxStyle()}>
          {error.detail || error.message}
        </div>
      )}

      <section>
        <h2 style={{ fontSize: TOKENS.text.h3.size, fontWeight: 600, marginBottom: TOKENS.space[3] }}>
          Agregar candidato
        </h2>
        <AddCandidateForm onCreated={handleCandidateCreated} />
      </section>

      <section>
        <h2 style={{ fontSize: TOKENS.text.h3.size, fontWeight: 600, marginBottom: TOKENS.space[3] }}>
          Candidatos ({candidates.length})
        </h2>
        {candidates.length === 0 ? (
          <div style={emptyBoxStyle()}>
            Aún no hay candidatos para esta vacante. Subí un CV o pegá el texto arriba.
          </div>
        ) : (
          <ul style={{ display: "flex", flexDirection: "column", gap: TOKENS.space[3], padding: 0, listStyle: "none" }}>
            {candidates.map((c) => {
              const latest = analysesByCandidate.get(c.id);
              const isAnalyzing = analyzingId === c.id;
              return (
                <li
                  key={c.id}
                  style={{
                    padding: TOKENS.space[4],
                    background: TOKENS.color.surfaceGlass,
                    backdropFilter: "blur(12px)",
                    border: `1px solid ${TOKENS.color.borderSubtle}`,
                    borderRadius: TOKENS.radius.lg,
                    display: "flex",
                    flexDirection: "column",
                    gap: TOKENS.space[3],
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: TOKENS.space[3], flexWrap: "wrap" }}>
                    <div>
                      <div style={{ fontWeight: 600, color: TOKENS.color.textPrimary }}>
                        {c.full_name || "Candidato sin nombre"}
                      </div>
                      {c.email && (
                        <div style={{ fontSize: TOKENS.text.caption.size, color: TOKENS.color.textMuted }}>
                          {c.email}
                        </div>
                      )}
                      <div style={{ fontSize: TOKENS.text.caption.size, color: TOKENS.color.textMuted, marginTop: TOKENS.space[1] }}>
                        Origen: {c.cv_source} · {dateLine(c.created_at)}
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: TOKENS.space[3] }}>
                      {latest && <ScorePill score={latest.score} mode={latest.analysis_mode} />}
                      <button
                        onClick={() => handleAnalyze(c.id)}
                        disabled={isAnalyzing}
                        style={{
                          padding: `${TOKENS.space[2]} ${TOKENS.space[4]}`,
                          background: TOKENS.color.accent,
                          border: "none",
                          color: TOKENS.color.textPrimary,
                          borderRadius: TOKENS.radius.md,
                          fontWeight: 600,
                          fontSize: TOKENS.text.bodySm.size,
                          cursor: isAnalyzing ? "wait" : "pointer",
                          opacity: isAnalyzing ? 0.6 : 1,
                        }}
                      >
                        {isAnalyzing ? "Analizando…" : latest ? "Re-analizar" : "Analizar"}
                      </button>
                    </div>
                  </div>
                  {latest && <AnalysisCard analysis={latest} />}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

function errorBoxStyle() {
  return {
    padding: TOKENS.space[4],
    background: TOKENS.color.dangerSoft,
    border: `1px solid ${TOKENS.color.danger}`,
    borderRadius: TOKENS.radius.md,
    color: TOKENS.color.textPrimary,
  };
}

function emptyBoxStyle() {
  return {
    padding: TOKENS.space[6],
    textAlign: "center",
    background: TOKENS.color.surfaceGlass,
    border: `1px dashed ${TOKENS.color.borderSubtle}`,
    borderRadius: TOKENS.radius.lg,
    color: TOKENS.color.textSecondary,
  };
}
