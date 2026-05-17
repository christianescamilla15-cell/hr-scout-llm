import { useEffect, useState } from "react";

import { ApiError, api } from "../api/client";
import { TOKENS } from "../constants/tokens";

function formatDate(iso) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString("es-MX", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso.split("T")[0];
  }
}

export function JobsListPage() {
  const [jobs, setJobs] = useState(null);
  const [error, setError] = useState(null);
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", language: "es" });

  useEffect(() => {
    document.title = "Vacantes · HRScout";
  }, []);

  const load = async () => {
    setError(null);
    try {
      const data = await api.get("/api/jobs");
      setJobs(data.items);
    } catch (err) {
      setError(err);
      setJobs([]);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || form.description.trim().length < 10) {
      setError(new ApiError(400, "El título y la descripción son obligatorios (mín. 10 caracteres en descripción)."));
      return;
    }
    setCreating(true);
    setError(null);
    try {
      const created = await api.post("/api/jobs", form);
      setJobs((prev) => [created, ...(prev || [])]);
      setForm({ title: "", description: "", language: "es" });
      setShowForm(false);
    } catch (err) {
      setError(err);
    } finally {
      setCreating(false);
    }
  };

  const handleArchive = async (id) => {
    if (!confirm("¿Archivar esta vacante?")) return;
    try {
      await api.delete(`/api/jobs/${id}`);
      setJobs((prev) => (prev || []).filter((j) => j.id !== id));
    } catch (err) {
      setError(err);
    }
  };

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto" }}>
      <header
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          marginBottom: TOKENS.space[5],
          flexWrap: "wrap",
          gap: TOKENS.space[3],
        }}
      >
        <h1
          style={{
            fontSize: TOKENS.text.h1.size,
            fontWeight: TOKENS.text.h1.weight,
            color: TOKENS.color.textPrimary,
          }}
        >
          Tus vacantes
        </h1>
        <button
          onClick={() => setShowForm((v) => !v)}
          style={{
            padding: `${TOKENS.space[3]} ${TOKENS.space[5]}`,
            background: showForm ? TOKENS.color.surfaceGlass : TOKENS.color.accent,
            border: `1px solid ${TOKENS.color.borderSubtle}`,
            color: TOKENS.color.textPrimary,
            borderRadius: TOKENS.radius.md,
            cursor: "pointer",
            fontWeight: 600,
            fontSize: TOKENS.text.bodySm.size,
          }}
        >
          {showForm ? "Cancelar" : "+ Nueva vacante"}
        </button>
      </header>

      {showForm && (
        <form
          onSubmit={handleCreate}
          style={{
            padding: TOKENS.space[5],
            background: TOKENS.color.surfaceGlass,
            backdropFilter: "blur(12px)",
            border: `1px solid ${TOKENS.color.borderSubtle}`,
            borderRadius: TOKENS.radius.lg,
            marginBottom: TOKENS.space[5],
            display: "flex",
            flexDirection: "column",
            gap: TOKENS.space[3],
          }}
        >
          <label style={{ display: "flex", flexDirection: "column", gap: TOKENS.space[1] }}>
            <span style={{ fontSize: TOKENS.text.caption.size, color: TOKENS.color.textMuted }}>
              Título
            </span>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Ej. Backend Senior Python"
              required
              minLength={2}
              maxLength={255}
              style={{
                padding: TOKENS.space[3],
                background: TOKENS.color.canvas,
                border: `1px solid ${TOKENS.color.borderSubtle}`,
                borderRadius: TOKENS.radius.md,
                color: TOKENS.color.textPrimary,
                fontSize: TOKENS.text.body.size,
                fontFamily: TOKENS.font.body,
              }}
            />
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: TOKENS.space[1] }}>
            <span style={{ fontSize: TOKENS.text.caption.size, color: TOKENS.color.textMuted }}>
              Descripción · mín. 10 caracteres
            </span>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Requisitos, experiencia mínima, tecnologías..."
              required
              minLength={10}
              rows={6}
              style={{
                padding: TOKENS.space[3],
                background: TOKENS.color.canvas,
                border: `1px solid ${TOKENS.color.borderSubtle}`,
                borderRadius: TOKENS.radius.md,
                color: TOKENS.color.textPrimary,
                fontSize: TOKENS.text.body.size,
                fontFamily: TOKENS.font.body,
                resize: "vertical",
              }}
            />
          </label>
          <button
            type="submit"
            disabled={creating}
            style={{
              padding: `${TOKENS.space[3]} ${TOKENS.space[5]}`,
              background: TOKENS.color.accent,
              color: TOKENS.color.textPrimary,
              border: "none",
              borderRadius: TOKENS.radius.md,
              cursor: creating ? "wait" : "pointer",
              fontWeight: 600,
              opacity: creating ? 0.6 : 1,
              alignSelf: "flex-start",
            }}
          >
            {creating ? "Creando…" : "Crear vacante"}
          </button>
        </form>
      )}

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

      {jobs === null ? (
        <div style={{ color: TOKENS.color.textMuted, padding: TOKENS.space[6], textAlign: "center" }}>
          Cargando vacantes…
        </div>
      ) : jobs.length === 0 ? (
        <div
          style={{
            padding: TOKENS.space[7],
            textAlign: "center",
            background: TOKENS.color.surfaceGlass,
            border: `1px dashed ${TOKENS.color.borderSubtle}`,
            borderRadius: TOKENS.radius.lg,
            color: TOKENS.color.textSecondary,
          }}
        >
          Aún no creaste vacantes. Empezá con el botón &quot;+ Nueva vacante&quot; arriba.
        </div>
      ) : (
        <ul
          style={{
            display: "flex",
            flexDirection: "column",
            gap: TOKENS.space[3],
            padding: 0,
            listStyle: "none",
          }}
        >
          {jobs.map((job) => (
            <li
              key={job.id}
              style={{
                padding: TOKENS.space[5],
                background: TOKENS.color.surfaceGlass,
                backdropFilter: "blur(12px)",
                border: `1px solid ${TOKENS.color.borderSubtle}`,
                borderRadius: TOKENS.radius.lg,
                display: "grid",
                gridTemplateColumns: "1fr auto",
                gap: TOKENS.space[3],
                alignItems: "start",
              }}
            >
              <div>
                <h2
                  style={{
                    fontSize: TOKENS.text.h3.size,
                    fontWeight: 600,
                    color: TOKENS.color.textPrimary,
                    marginBottom: TOKENS.space[2],
                  }}
                >
                  {job.title}
                </h2>
                <p
                  style={{
                    fontSize: TOKENS.text.bodySm.size,
                    color: TOKENS.color.textSecondary,
                    margin: 0,
                    whiteSpace: "pre-wrap",
                    maxHeight: "4.5em",
                    overflow: "hidden",
                  }}
                >
                  {job.description}
                </p>
                <div
                  style={{
                    marginTop: TOKENS.space[3],
                    fontSize: TOKENS.text.caption.size,
                    color: TOKENS.color.textMuted,
                  }}
                >
                  Creada {formatDate(job.created_at)} · {job.language.toUpperCase()}
                </div>
              </div>
              <button
                onClick={() => handleArchive(job.id)}
                aria-label={`Archivar ${job.title}`}
                style={{
                  background: "transparent",
                  border: `1px solid ${TOKENS.color.borderSubtle}`,
                  borderRadius: TOKENS.radius.sm,
                  color: TOKENS.color.textMuted,
                  padding: `${TOKENS.space[2]} ${TOKENS.space[3]}`,
                  fontSize: TOKENS.text.bodySm.size,
                  cursor: "pointer",
                }}
              >
                Archivar
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
