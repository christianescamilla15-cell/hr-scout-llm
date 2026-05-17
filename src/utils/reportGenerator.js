// Genera reporte de texto descargable con resultados del analisis
export function generateReport(candidates, results, jobDesc, t) {
  const lines = [];
  lines.push(t.reportTitle);
  lines.push(`${t.reportDate}: ${new Date().toLocaleDateString("es-MX")}`);
  lines.push("");
  lines.push(t.reportJobDesc);
  lines.push(jobDesc);
  lines.push("");
  lines.push("-".repeat(60));

  const sorted = [...candidates]
    .filter(c => results[c.id])
    .sort((a, b) => (results[b.id]?.score || 0) - (results[a.id]?.score || 0));

  sorted.forEach((c, i) => {
    const r = results[c.id];
    const label = r.score >= 80 ? t.reportSuitable : r.score >= 60 ? t.reportReview : t.reportNotSuitable;
    lines.push("");
    lines.push(`#${i + 1} -- ${c.name} [Score: ${r.score}/100 -- ${label}]`);
    lines.push(`   Titulo: ${r.titulo} | Experiencia: ${r.experiencia_anos} anos`);
    lines.push(`   Modo de analisis: ${r.analysisMode === "tool_use" ? "Claude Tool Use (Agentic)" : r.analysisMode === "ai" ? "Claude AI" : "Local (keywords)"}`);
    if (r.analysisMode === "ai" || r.analysisMode === "tool_use") {
      lines.push(`   AI Score: ${r.aiScore} | Keyword Score: ${r.localScore} | Final: ${r.score}`);
      lines.push(`   Confianza: ${r.confidence}${r.analysisMode === "tool_use" ? ` | Tool calls: ${r.toolCallCount || 0}` : ""}`);
    }
    lines.push(`   Habilidades: ${r.habilidades_clave?.join(", ")}`);
    lines.push(`   Fortalezas: ${r.fortalezas?.join("; ")}`);
    lines.push(`   Brechas: ${r.brechas?.join("; ")}`);
    lines.push(`   Veredicto: ${r.veredicto}`);
    lines.push(`   Siguiente paso: ${r.siguiente_paso}`);
    lines.push(`   Pregunta entrevista: ${r.pregunta_entrevista}`);
  });

  lines.push("");
  lines.push("-".repeat(60));
  const aptos = sorted.filter(c => results[c.id].score >= 80).length;
  const revisar = sorted.filter(c => results[c.id].score >= 60 && results[c.id].score < 80).length;
  const noAptos = sorted.filter(c => results[c.id].score < 60).length;
  lines.push(t.reportSummary(sorted.length, aptos, revisar, noAptos));

  return lines.join("\n");
}
