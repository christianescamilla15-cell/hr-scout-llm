import { useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";

const APPLE_EASE = [0.16, 1, 0.3, 1];

const glass = {
  background: 'rgba(255,255,255,0.03)',
  backdropFilter: 'blur(12px)',
  border: '1px solid rgba(255,255,255,0.06)',
  borderRadius: 16,
};

const MAX_BATCH_FILES = 10;
const MAX_FILE_SIZE = 500 * 1024; // 500KB

// Modal para agregar candidato con CV (pegar texto o subir archivo)
export function AddCandidateModal({ onAdd, onClose, t }) {
  const [name, setName] = useState("");
  const [cvText, setCvText] = useState("");
  const [mode, setMode] = useState("paste"); // "paste" | "file" | "batch"
  const [batchFiles, setBatchFiles] = useState([]); // { name, text, fileName, status }
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef(null);
  const batchRef = useRef(null);

  const CV_MIN_LENGTH = 50;
  const CV_MAX_LENGTH = 50000;
  const cvLen = cvText.trim().length;
  const nameLen = name.trim().length;
  const isCvTooLong = cvLen > CV_MAX_LENGTH;
  const isCvTooShort = cvLen < CV_MIN_LENGTH && cvLen > 0;
  const isNameTooShort = nameLen > 0 && nameLen < 2;
  const isValid = nameLen >= 2 && cvLen >= CV_MIN_LENGTH && cvLen <= CV_MAX_LENGTH;
  const isBatchValid = batchFiles.length > 0 && batchFiles.every(f => f.status === "ok");

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      let text = ev.target?.result || "";
      // Para PDFs leidos como texto, limpiar contenido binario
      if (file.name.toLowerCase().endsWith(".pdf")) {
        const readable = text.replace(/[^\x20-\x7E\n\r\t]/g, " ").replace(/\s{3,}/g, "\n").trim();
        setCvText(readable.length > 50 ? readable : "");
      } else {
        setCvText(text);
      }
    };
    reader.readAsText(file);
  };

  // --- Batch file processing ---
  const parseBatchFiles = useCallback((fileList) => {
    const files = Array.from(fileList).filter(f =>
      f.name.toLowerCase().endsWith(".txt") || f.name.toLowerCase().endsWith(".text")
    );

    if (files.length === 0) return;
    if (batchFiles.length + files.length > MAX_BATCH_FILES) {
      return; // silently ignore excess
    }

    for (const file of files) {
      if (file.size > MAX_FILE_SIZE) {
        setBatchFiles(prev => {
          if (prev.length >= MAX_BATCH_FILES) return prev;
          return [...prev, {
            fileName: file.name,
            name: file.name.replace(/\.(txt|text)$/i, "").replace(/[_-]/g, " "),
            text: "",
            status: "too_large",
          }];
        });
        continue;
      }

      const reader = new FileReader();
      reader.onload = (ev) => {
        const text = ev.target?.result || "";
        const candidateName = file.name.replace(/\.(txt|text)$/i, "").replace(/[_-]/g, " ");
        setBatchFiles(prev => {
          if (prev.length >= MAX_BATCH_FILES) return prev;
          return [...prev, {
            fileName: file.name,
            name: candidateName,
            text: text.trim(),
            status: text.trim().length >= CV_MIN_LENGTH ? "ok" : "too_short",
          }];
        });
      };
      reader.readAsText(file);
    }
  }, [batchFiles.length]);

  const handleBatchDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    parseBatchFiles(e.dataTransfer.files);
  }, [parseBatchFiles]);

  const handleBatchFileSelect = (e) => {
    parseBatchFiles(e.target.files);
    if (batchRef.current) batchRef.current.value = "";
  };

  const removeBatchFile = (index) => {
    setBatchFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleBatchSubmit = () => {
    if (!isBatchValid) return;
    for (const file of batchFiles) {
      if (file.status === "ok") {
        onAdd({ name: file.name, cv: file.text });
      }
    }
    onClose();
  };

  const handleSubmit = () => {
    if (!isValid) return;
    onAdd({ name: name.trim(), cv: cvText.trim() });
    onClose();
  };

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label={t.addCandidateTitle}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3, ease: APPLE_EASE }}
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: "rgba(0,0,0,0.7)", backdropFilter: "blur(12px)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}
      onClick={onClose}
      onKeyDown={e => { if (e.key === "Escape") onClose(); }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.4, ease: APPLE_EASE }}
        style={{
          ...glass,
          background: "#12131A", borderColor: "rgba(255,255,255,0.1)",
          borderRadius: 20, padding: 28, width: "90%", maxWidth: 560,
          boxShadow: "0 24px 48px rgba(0,0,0,0.5), 0 0 40px rgba(99,102,241,0.1)",
          maxHeight: "90vh", overflowY: "auto",
        }}
        onClick={e => e.stopPropagation()}
      >
        <h3 style={{ margin: "0 0 4px", fontSize: 18, fontWeight: 700, color: "#F8FAFC" }}>
          {t.addCandidateTitle}
        </h3>
        <p style={{ margin: "0 0 18px", fontSize: 12, color: "rgba(255,255,255,0.4)" }}>
          {t.addCandidateDesc}
        </p>

        {/* Toggle de modo — ahora con 3 opciones */}
        <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
          {[
            { key: "paste", label: t.pasteText },
            { key: "file", label: t.uploadFilePdf },
            { key: "batch", label: t.batchUpload || "Batch Upload" },
          ].map(m => (
            <button key={m.key} onClick={() => setMode(m.key)} aria-pressed={mode === m.key} aria-label={m.label} style={{
              padding: "6px 14px", borderRadius: 20, fontSize: 11, fontWeight: 600, cursor: "pointer",
              background: mode === m.key ? "rgba(99,102,241,0.18)" : "rgba(255,255,255,0.04)",
              backdropFilter: "blur(12px)",
              border: `1px solid ${mode === m.key ? "rgba(99,102,241,0.4)" : "rgba(255,255,255,0.06)"}`,
              color: mode === m.key ? "#A5B4FC" : "rgba(255,255,255,0.4)",
              fontFamily: "'DM Sans', sans-serif",
              transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
              boxShadow: mode === m.key ? "0 0 12px rgba(99,102,241,0.15)" : "none",
            }}>
              {m.label}
            </button>
          ))}
        </div>

        {/* ============ BATCH MODE ============ */}
        {mode === "batch" ? (
          <div>
            {/* Drop zone */}
            <div
              role="button"
              tabIndex={0}
              aria-label={t.batchDropzone || "Arrastra archivos .txt aqui"}
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleBatchDrop}
              onClick={() => batchRef.current?.click()}
              onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); batchRef.current?.click(); } }}
              style={{
                padding: 24,
                textAlign: "center",
                ...glass,
                background: dragOver ? "rgba(99,102,241,0.1)" : "rgba(255,255,255,0.03)",
                border: `2px dashed ${dragOver ? "rgba(99,102,241,0.5)" : "rgba(255,255,255,0.1)"}`,
                borderRadius: 12,
                cursor: "pointer",
                transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
              }}
            >
              <input
                ref={batchRef}
                type="file"
                accept=".txt,.text"
                multiple
                onChange={handleBatchFileSelect}
                style={{ display: "none" }}
              />
              <p style={{ margin: 0, fontSize: 13, color: dragOver ? "#A5B4FC" : "rgba(255,255,255,0.4)" }}>
                {t.batchDropzone || "Arrastra archivos .txt aqui o haz clic para seleccionar"}
              </p>
              <p style={{ margin: "6px 0 0", fontSize: 10, color: "rgba(255,255,255,0.25)", fontStyle: "italic" }}>
                {t.maxFiles ? t.maxFiles(MAX_BATCH_FILES) : `Max ${MAX_BATCH_FILES} archivos, 500KB c/u`}
              </p>
            </div>

            {/* Queued files list */}
            {batchFiles.length > 0 && (
              <div style={{ marginTop: 12 }}>
                <p style={{ margin: "0 0 8px", fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.4)", letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "'DM Mono', monospace" }}>
                  {t.queuedFiles || "Archivos en cola"} ({batchFiles.length}/{MAX_BATCH_FILES})
                </p>
                {batchFiles.map((file, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05, duration: 0.3, ease: APPLE_EASE }}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "7px 10px",
                      marginBottom: 4,
                      ...glass,
                      background: file.status === "ok" ? "rgba(16,185,129,0.06)" : "rgba(239,68,68,0.06)",
                      borderColor: file.status === "ok" ? "rgba(16,185,129,0.2)" : "rgba(239,68,68,0.2)",
                      borderRadius: 10,
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: 12, color: "#D1D5DB", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {file.name}
                      </p>
                      <p style={{ margin: "2px 0 0", fontSize: 9, color: "rgba(255,255,255,0.3)", fontFamily: "'DM Mono', monospace" }}>
                        {file.fileName}
                        {file.status === "ok" && ` — ${file.text.length} chars`}
                        {file.status === "too_short" && ` — ${t.batchTooShort || "Texto muy corto"}`}
                        {file.status === "too_large" && ` — ${t.batchTooLarge || "Archivo muy grande"}`}
                      </p>
                    </div>
                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                      {file.status === "ok" && (
                        <span style={{ fontSize: 12, color: "#10B981" }}>&#10003;</span>
                      )}
                      {file.status !== "ok" && (
                        <span style={{ fontSize: 12, color: "#EF4444" }}>&#10007;</span>
                      )}
                      <button
                        onClick={() => removeBatchFile(i)}
                        aria-label={`${t.removeCandidateTitle || "Eliminar"} ${file.name}`}
                        style={{
                          background: "rgba(239,68,68,0.08)",
                          border: "1px solid rgba(239,68,68,0.2)",
                          borderRadius: 6,
                          padding: "2px 6px",
                          cursor: "pointer",
                          fontSize: 10,
                          color: "#EF4444",
                          lineHeight: 1,
                          transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
                        }}
                      >
                        &#10005;
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Batch buttons */}
            <div style={{ display: "flex", gap: 10, marginTop: 18, justifyContent: "flex-end" }}>
              <button onClick={onClose} aria-label={t.cancel} style={{
                padding: "10px 20px", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer",
                ...glass, background: "rgba(255,255,255,0.05)",
                color: "rgba(255,255,255,0.5)", fontFamily: "'DM Sans', sans-serif",
                transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
              }}>
                {t.cancel}
              </button>
              <button onClick={handleBatchSubmit} disabled={!isBatchValid} aria-label={t.processAll || "Procesar todos"} style={{
                padding: "10px 20px", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: isBatchValid ? "pointer" : "default",
                background: isBatchValid ? "linear-gradient(135deg, #6366F1, #4F46E5)" : "rgba(255,255,255,0.05)",
                border: "none",
                color: isBatchValid ? "#fff" : "#6B7280", fontFamily: "'DM Sans', sans-serif",
                boxShadow: isBatchValid ? "0 0 20px rgba(99,102,241,0.4)" : "none",
                transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
              }}>
                {t.processAll || "Procesar todos"} ({batchFiles.filter(f => f.status === "ok").length})
              </button>
            </div>
          </div>
        ) : mode === "paste" ? (
          <>
            {/* Nombre */}
            <label htmlFor="candidate-name-input" style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)", fontFamily: "'DM Mono', monospace" }}>
              {t.candidateName}
            </label>
            <input
              id="candidate-name-input"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder={t.candidateNamePlaceholder}
              aria-label={t.candidateName}
              style={{
                width: "100%", marginTop: 4, marginBottom: 14, padding: "10px 12px",
                ...glass, borderRadius: 10, color: "#D1D5DB", fontSize: 13,
                fontFamily: "'DM Sans', sans-serif",
              }}
            />

            <label htmlFor="cv-text-input" style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)", fontFamily: "'DM Mono', monospace" }}>
              {t.cvText}
            </label>
            <textarea
              id="cv-text-input"
              value={cvText}
              onChange={e => setCvText(e.target.value)}
              placeholder={t.cvPlaceholder}
              aria-label={t.cvText}
              rows={10}
              style={{
                width: "100%", marginTop: 4, padding: "10px 12px",
                ...glass, borderRadius: 10, color: "#D1D5DB", fontSize: 12, lineHeight: 1.6,
                fontFamily: "'DM Sans', sans-serif", resize: "vertical",
              }}
            />
            <p style={{ margin: "6px 0 0", fontSize: 10, color: cvLen >= CV_MIN_LENGTH && !isCvTooLong ? "rgba(255,255,255,0.3)" : "#EF4444", fontFamily: "'DM Mono', monospace" }}>
              {t.minCharsCV(cvLen)}
            </p>
            {isCvTooLong && (
              <p role="alert" style={{ margin: "4px 0 0", fontSize: 10, color: "#EF4444", fontFamily: "'DM Mono', monospace" }}>
                {t.maxCharsCV ? t.maxCharsCV(cvLen, CV_MAX_LENGTH) : `Texto demasiado largo: ${cvLen.toLocaleString()} / ${CV_MAX_LENGTH.toLocaleString()} max`}
              </p>
            )}
            {isNameTooShort && (
              <p role="alert" style={{ margin: "4px 0 0", fontSize: 10, color: "#EF4444", fontFamily: "'DM Mono', monospace" }}>
                {t.nameMinChars || "El nombre debe tener al menos 2 caracteres"}
              </p>
            )}

            {/* Botones */}
            <div style={{ display: "flex", gap: 10, marginTop: 18, justifyContent: "flex-end" }}>
              <button onClick={onClose} aria-label={t.cancel} style={{
                padding: "10px 20px", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer",
                ...glass, background: "rgba(255,255,255,0.05)",
                color: "rgba(255,255,255,0.5)", fontFamily: "'DM Sans', sans-serif",
                transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
              }}>
                {t.cancel}
              </button>
              <button onClick={handleSubmit} disabled={!isValid} aria-label={t.addCandidateBtn} style={{
                padding: "10px 20px", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: isValid ? "pointer" : "default",
                background: isValid ? "linear-gradient(135deg, #6366F1, #4F46E5)" : "rgba(255,255,255,0.05)",
                border: "none",
                color: isValid ? "#fff" : "#6B7280", fontFamily: "'DM Sans', sans-serif",
                boxShadow: isValid ? "0 0 20px rgba(99,102,241,0.4)" : "none",
                transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
              }}>
                {t.addCandidateBtn}
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Nombre */}
            <label htmlFor="candidate-name-input" style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)", fontFamily: "'DM Mono', monospace" }}>
              {t.candidateName}
            </label>
            <input
              id="candidate-name-input"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder={t.candidateNamePlaceholder}
              aria-label={t.candidateName}
              style={{
                width: "100%", marginTop: 4, marginBottom: 14, padding: "10px 12px",
                ...glass, borderRadius: 10, color: "#D1D5DB", fontSize: 13,
                fontFamily: "'DM Sans', sans-serif",
              }}
            />

            <div role="button" tabIndex={0} aria-label={t.clickToSelect} style={{
              marginTop: 4, padding: 20, textAlign: "center",
              ...glass, borderRadius: 12,
              border: "2px dashed rgba(255,255,255,0.1)",
              cursor: "pointer",
              transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
            }} onClick={() => fileRef.current?.click()} onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); fileRef.current?.click(); } }}>
              <input ref={fileRef} type="file" accept=".txt,.text,.pdf" onChange={handleFileUpload} style={{ display: "none" }} />
              <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.4)" }}>
                {cvText ? t.fileLoaded(cvText.length) : t.clickToSelect}
              </p>
              <p style={{ margin: "6px 0 0", fontSize: 10, color: "rgba(255,255,255,0.25)", fontStyle: "italic" }}>
                {t.pdfNote}
              </p>
              {cvText && (
                <p style={{ margin: "6px 0 0", fontSize: 11, color: "#818CF8" }}>
                  {t.preview}: {cvText.substring(0, 80)}...
                </p>
              )}
            </div>

            <p style={{ margin: "6px 0 0", fontSize: 10, color: cvLen >= CV_MIN_LENGTH && !isCvTooLong ? "rgba(255,255,255,0.3)" : "#EF4444", fontFamily: "'DM Mono', monospace" }}>
              {t.minCharsCV(cvLen)}
            </p>
            {isCvTooLong && (
              <p role="alert" style={{ margin: "4px 0 0", fontSize: 10, color: "#EF4444", fontFamily: "'DM Mono', monospace" }}>
                {t.maxCharsCV ? t.maxCharsCV(cvLen, CV_MAX_LENGTH) : `Texto demasiado largo: ${cvLen.toLocaleString()} / ${CV_MAX_LENGTH.toLocaleString()} max`}
              </p>
            )}
            {isNameTooShort && (
              <p role="alert" style={{ margin: "4px 0 0", fontSize: 10, color: "#EF4444", fontFamily: "'DM Mono', monospace" }}>
                {t.nameMinChars || "El nombre debe tener al menos 2 caracteres"}
              </p>
            )}

            {/* Botones */}
            <div style={{ display: "flex", gap: 10, marginTop: 18, justifyContent: "flex-end" }}>
              <button onClick={onClose} aria-label={t.cancel} style={{
                padding: "10px 20px", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer",
                ...glass, background: "rgba(255,255,255,0.05)",
                color: "rgba(255,255,255,0.5)", fontFamily: "'DM Sans', sans-serif",
                transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
              }}>
                {t.cancel}
              </button>
              <button onClick={handleSubmit} disabled={!isValid} aria-label={t.addCandidateBtn} style={{
                padding: "10px 20px", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: isValid ? "pointer" : "default",
                background: isValid ? "linear-gradient(135deg, #6366F1, #4F46E5)" : "rgba(255,255,255,0.05)",
                border: "none",
                color: isValid ? "#fff" : "#6B7280", fontFamily: "'DM Sans', sans-serif",
                boxShadow: isValid ? "0 0 20px rgba(99,102,241,0.4)" : "none",
                transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
              }}>
                {t.addCandidateBtn}
              </button>
            </div>
          </>
        )}
      </motion.div>
    </motion.div>
  );
}
