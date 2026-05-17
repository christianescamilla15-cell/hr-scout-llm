import { useRef, useState } from "react";

import { ApiError, api, apiUrl } from "../../api/client";
import { TOKENS } from "../../constants/tokens";

const TAB_UPLOAD = "upload";
const TAB_PASTE = "paste";

export function AddCandidateForm({ onCreated }) {
  const [tab, setTab] = useState(TAB_UPLOAD);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const [pasteText, setPasteText] = useState("");
  const [pasteName, setPasteName] = useState("");
  const [pasteEmail, setPasteEmail] = useState("");

  const reset = () => {
    setPasteText("");
    setPasteName("");
    setPasteEmail("");
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      setError(new ApiError(400, "Elegí un archivo PDF o DOCX."));
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const response = await fetch(apiUrl("/api/candidates/upload"), {
        method: "POST",
        credentials: "include",
        body: form,
      });
      const text = await response.text();
      const payload = text ? JSON.parse(text) : null;
      if (!response.ok) {
        throw new ApiError(response.status, payload?.detail || "Falló la subida", payload);
      }
      onCreated?.(payload);
      reset();
    } catch (err) {
      setError(err instanceof ApiError ? err : new ApiError(0, "Network error"));
    } finally {
      setBusy(false);
    }
  };

  const handlePaste = async (e) => {
    e.preventDefault();
    if (pasteText.trim().length < 50) {
      setError(new ApiError(400, "El CV debe tener al menos 50 caracteres."));
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const created = await api.post("/api/candidates", {
        cv_text: pasteText,
        full_name: pasteName || null,
        email: pasteEmail || null,
      });
      onCreated?.(created);
      reset();
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  };

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
        role="tablist"
        style={{
          display: "inline-flex",
          gap: TOKENS.space[1],
          padding: TOKENS.space[1],
          background: TOKENS.color.surfaceRaised,
          borderRadius: TOKENS.radius.md,
          marginBottom: TOKENS.space[4],
        }}
      >
        <TabButton active={tab === TAB_UPLOAD} onClick={() => setTab(TAB_UPLOAD)}>
          Subir archivo
        </TabButton>
        <TabButton active={tab === TAB_PASTE} onClick={() => setTab(TAB_PASTE)}>
          Pegar texto
        </TabButton>
      </div>

      {error && (
        <div
          role="alert"
          style={{
            padding: TOKENS.space[3],
            background: TOKENS.color.dangerSoft,
            border: `1px solid ${TOKENS.color.danger}`,
            borderRadius: TOKENS.radius.md,
            marginBottom: TOKENS.space[3],
            color: TOKENS.color.textPrimary,
            fontSize: TOKENS.text.bodySm.size,
          }}
        >
          {error.detail || error.message}
        </div>
      )}

      {tab === TAB_UPLOAD ? (
        <form onSubmit={handleUpload} style={{ display: "flex", flexDirection: "column", gap: TOKENS.space[3] }}>
          <label style={{ fontSize: TOKENS.text.caption.size, color: TOKENS.color.textMuted }}>
            Archivo (PDF o DOCX, máx. 10 MB)
          </label>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            style={{
              padding: TOKENS.space[3],
              background: TOKENS.color.canvas,
              border: `1px solid ${TOKENS.color.borderSubtle}`,
              borderRadius: TOKENS.radius.md,
              color: TOKENS.color.textSecondary,
              fontSize: TOKENS.text.body.size,
              fontFamily: TOKENS.font.body,
            }}
          />
          <button type="submit" disabled={busy} style={primaryButtonStyle(busy)}>
            {busy ? "Subiendo…" : "Subir CV"}
          </button>
          <p style={{ fontSize: TOKENS.text.caption.size, color: TOKENS.color.textMuted, margin: 0 }}>
            Extraemos el texto y eliminamos el archivo original. Nombre y email del candidato
            se guardan encriptados.
          </p>
        </form>
      ) : (
        <form onSubmit={handlePaste} style={{ display: "flex", flexDirection: "column", gap: TOKENS.space[3] }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: TOKENS.space[3] }}>
            <label style={{ display: "flex", flexDirection: "column", gap: TOKENS.space[1] }}>
              <span style={{ fontSize: TOKENS.text.caption.size, color: TOKENS.color.textMuted }}>
                Nombre (opcional)
              </span>
              <input
                type="text"
                value={pasteName}
                onChange={(e) => setPasteName(e.target.value)}
                placeholder="Ej. Ana García"
                style={inputStyle()}
              />
            </label>
            <label style={{ display: "flex", flexDirection: "column", gap: TOKENS.space[1] }}>
              <span style={{ fontSize: TOKENS.text.caption.size, color: TOKENS.color.textMuted }}>
                Email (opcional)
              </span>
              <input
                type="email"
                value={pasteEmail}
                onChange={(e) => setPasteEmail(e.target.value)}
                placeholder="ana@ejemplo.mx"
                style={inputStyle()}
              />
            </label>
          </div>
          <label style={{ display: "flex", flexDirection: "column", gap: TOKENS.space[1] }}>
            <span style={{ fontSize: TOKENS.text.caption.size, color: TOKENS.color.textMuted }}>
              Texto del CV · mínimo 50 caracteres
            </span>
            <textarea
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              rows={8}
              required
              style={{ ...inputStyle(), resize: "vertical", fontFamily: TOKENS.font.body }}
            />
          </label>
          <button type="submit" disabled={busy} style={primaryButtonStyle(busy)}>
            {busy ? "Guardando…" : "Guardar candidato"}
          </button>
        </form>
      )}
    </div>
  );
}

function TabButton({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      role="tab"
      aria-selected={active}
      style={{
        padding: `${TOKENS.space[2]} ${TOKENS.space[4]}`,
        background: active ? TOKENS.color.surfaceGlass : "transparent",
        border: "none",
        borderRadius: TOKENS.radius.sm,
        color: active ? TOKENS.color.textPrimary : TOKENS.color.textMuted,
        cursor: "pointer",
        fontSize: TOKENS.text.bodySm.size,
        fontWeight: active ? 600 : 400,
      }}
    >
      {children}
    </button>
  );
}

function inputStyle() {
  return {
    padding: TOKENS.space[3],
    background: TOKENS.color.canvas,
    border: `1px solid ${TOKENS.color.borderSubtle}`,
    borderRadius: TOKENS.radius.md,
    color: TOKENS.color.textPrimary,
    fontSize: TOKENS.text.body.size,
    fontFamily: TOKENS.font.body,
  };
}

function primaryButtonStyle(busy) {
  return {
    padding: `${TOKENS.space[3]} ${TOKENS.space[5]}`,
    background: TOKENS.color.accent,
    color: TOKENS.color.textPrimary,
    border: "none",
    borderRadius: TOKENS.radius.md,
    cursor: busy ? "wait" : "pointer",
    fontWeight: 600,
    opacity: busy ? 0.6 : 1,
    alignSelf: "flex-start",
  };
}
