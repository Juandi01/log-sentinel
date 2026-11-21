import type { AnalysisResult, DiagnosisResult } from "../services/api";

export function exportPostMortemMarkdown(
  analysis: AnalysisResult,
  diagnosis: DiagnosisResult | null
) {
  const errorTotal =
    (analysis.level_counts.ERROR || 0) + (analysis.level_counts.CRITICAL || 0);

  const lines: string[] = [
    `# Post-Mortem de Incidente: \`\${analysis.filename}\``,
    ``,
    `> Generado automáticamente por **Log Sentinel** el ${new Date().toLocaleString("es-ES")}`,
    ``,
    `## Resumen de Métricas`,
    `- **Archivo:** \`${analysis.filename}\` (${analysis.size_mb} MB)`,
    `- **Líneas procesadas:** ${analysis.total_lines.toLocaleString()} en ${analysis.processing_time_sec} s`,
    `- **Errores totales (ERROR + CRITICAL):** ${errorTotal.toLocaleString()}`,
    `- **Picos anómalos detectados:** ${analysis.anomalies.length}`,
    ``,
  ];

  if (analysis.anomalies.length > 0) {
    lines.push(`## Picos Anómalos (Z-Score)`);
    lines.push(`| Minuto | Errores | Z-Score | Media Base |`);
    lines.push(`| --- | ---: | ---: | ---: |`);
    for (const a of analysis.anomalies) {
      lines.push(
        `| ${a.minute} | ${a.error_count.toLocaleString()} | ${a.z_score} | ${a.baseline_mean} |`
      );
    }
    lines.push(``);
  }

  if (diagnosis) {
    lines.push(`## Diagnóstico SRE con IA (\`${diagnosis.model_used}\`)`);
    lines.push(`- **Severidad:** **${diagnosis.severity}**`);
    lines.push(`- **Causa raíz:** ${diagnosis.root_cause}`);
    lines.push(``);
    lines.push(`### Cadena de fallos`);
    lines.push(diagnosis.explanation);
    lines.push(``);
    lines.push(`### Acciones recomendadas`);
    for (const action of diagnosis.recommended_actions) {
      lines.push(`- [ ] ${action}`);
    }
    lines.push(``);
  }

  if (analysis.top_clusters.length > 0) {
    lines.push(`## Principales Patrones de Error (PII Sanitizado)`);
    for (const c of analysis.top_clusters) {
      lines.push(`### [${c.level}] ×${c.count.toLocaleString()}`);
      lines.push("```text");
      lines.push(c.sample);
      lines.push("```");
      lines.push(``);
    }
  }

  const blob = new Blob([lines.join("\n")], {
    type: "text/markdown;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const cleanName = analysis.filename.replace(/\.[^/.]+$/, "");
  a.href = url;
  a.download = `postmortem-${cleanName}.md`;
  a.click();
  URL.revokeObjectURL(url);
}