"""PDF report generator for a candidate analysis.

Produces a single-page A4 PDF using reportlab. Plan-Agency branding
(custom logo + colors) is NOT in this commit — landing the base report
first; branding is a follow-up commit once we have a paying Agency
customer who can supply assets.

Returns bytes so the router can stream it directly without ever
writing to disk.
"""

import io
from datetime import UTC, datetime

from reportlab.lib.colors import HexColor, white
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import (
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

PRIMARY = HexColor("#6366F1")
TEXT_PRIMARY = HexColor("#0B0B12")
TEXT_SECONDARY = HexColor("#334155")
TEXT_MUTED = HexColor("#64748B")
SURFACE = HexColor("#F1F5F9")
SUCCESS = HexColor("#10B981")
WARNING = HexColor("#F59E0B")
DANGER = HexColor("#EF4444")


def _score_color(score: int) -> HexColor:
    if score >= 80:
        return SUCCESS
    if score >= 60:
        return WARNING
    return DANGER


def _build_styles():
    styles = getSampleStyleSheet()
    styles.add(
        ParagraphStyle(
            name="HRScoutH1",
            parent=styles["Heading1"],
            fontName="Helvetica-Bold",
            fontSize=24,
            leading=28,
            spaceAfter=4,
            textColor=TEXT_PRIMARY,
        )
    )
    styles.add(
        ParagraphStyle(
            name="HRScoutH2",
            parent=styles["Heading2"],
            fontName="Helvetica-Bold",
            fontSize=14,
            leading=18,
            spaceBefore=14,
            spaceAfter=6,
            textColor=TEXT_PRIMARY,
        )
    )
    styles.add(
        ParagraphStyle(
            name="HRScoutBody",
            parent=styles["BodyText"],
            fontName="Helvetica",
            fontSize=10,
            leading=14,
            textColor=TEXT_SECONDARY,
        )
    )
    styles.add(
        ParagraphStyle(
            name="HRScoutMuted",
            parent=styles["BodyText"],
            fontName="Helvetica",
            fontSize=9,
            leading=12,
            textColor=TEXT_MUTED,
        )
    )
    styles.add(
        ParagraphStyle(
            name="HRScoutQuestion",
            parent=styles["BodyText"],
            fontName="Helvetica-Oblique",
            fontSize=10,
            leading=14,
            textColor=TEXT_PRIMARY,
            leftIndent=10,
            borderPadding=8,
            spaceBefore=4,
        )
    )
    return styles


def generate_analysis_pdf(
    *,
    job_title: str,
    candidate_name: str | None,
    candidate_email: str | None,
    score: int,
    local_score: int | None,
    ai_score: int | None,
    confidence: str | None,
    strengths: list[str] | None,
    gaps: list[str] | None,
    verdict: str | None,
    action: str | None,
    interview_question: str | None,
    analysis_mode: str,
    created_at: datetime | None = None,
) -> bytes:
    """Returns the PDF as bytes. Caller streams it; we never write to disk."""
    buf = io.BytesIO()
    doc = SimpleDocTemplate(
        buf,
        pagesize=A4,
        leftMargin=20 * mm,
        rightMargin=20 * mm,
        topMargin=18 * mm,
        bottomMargin=18 * mm,
        title=f"HRScout — {candidate_name or 'Candidato'}",
        author="HRScout",
    )
    styles = _build_styles()
    story = []

    # --- Header band -------------------------------------------------------
    score_color = _score_color(score)
    header_data = [[
        Paragraph(
            f'<font color="#6366F1" name="Helvetica-Bold">HRScout</font>',
            styles["HRScoutBody"],
        ),
        Paragraph(
            f'<para align="right"><font color="#64748B" size="9">'
            f'Generado {(created_at or datetime.now(UTC)).strftime("%d/%m/%Y %H:%M UTC")}</font></para>',
            styles["HRScoutBody"],
        ),
    ]]
    header = Table(header_data, colWidths=[80 * mm, 80 * mm])
    header.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
    ]))
    story.append(header)
    story.append(Spacer(1, 8))

    # --- Title -------------------------------------------------------------
    story.append(Paragraph(candidate_name or "Candidato sin nombre", styles["HRScoutH1"]))
    if candidate_email:
        story.append(Paragraph(candidate_email, styles["HRScoutMuted"]))
    story.append(Spacer(1, 4))
    story.append(Paragraph(f"Vacante: {job_title}", styles["HRScoutBody"]))
    story.append(Spacer(1, 14))

    # --- Score band --------------------------------------------------------
    score_table_data = [[
        Paragraph(
            f'<font name="Helvetica-Bold" size="36" color="{score_color.hexval()}">{score}</font>'
            f'<font color="#64748B" size="14"> / 100</font>',
            styles["HRScoutBody"],
        ),
        Paragraph(
            f'<font color="#64748B" size="9">MODO</font><br/>'
            f'<font name="Helvetica-Bold" size="11">{analysis_mode}</font>',
            styles["HRScoutBody"],
        ),
        Paragraph(
            f'<font color="#64748B" size="9">CONFIANZA</font><br/>'
            f'<font name="Helvetica-Bold" size="11">{confidence or "n/a"}</font>',
            styles["HRScoutBody"],
        ),
        Paragraph(
            f'<font color="#64748B" size="9">LOCAL · AI</font><br/>'
            f'<font name="Helvetica-Bold" size="11">{local_score or "—"} · {ai_score or "—"}</font>',
            styles["HRScoutBody"],
        ),
    ]]
    score_table = Table(score_table_data, colWidths=[55 * mm, 35 * mm, 35 * mm, 35 * mm])
    score_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), SURFACE),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 14),
        ("RIGHTPADDING", (0, 0), (-1, -1), 14),
        ("TOPPADDING", (0, 0), (-1, -1), 12),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 12),
        ("LINEBEFORE", (1, 0), (1, -1), 1, HexColor("#CBD5E1")),
        ("LINEBEFORE", (2, 0), (2, -1), 1, HexColor("#CBD5E1")),
        ("LINEBEFORE", (3, 0), (3, -1), 1, HexColor("#CBD5E1")),
    ]))
    story.append(score_table)
    story.append(Spacer(1, 16))

    # --- Verdict -----------------------------------------------------------
    if verdict:
        story.append(Paragraph("Veredicto", styles["HRScoutH2"]))
        story.append(Paragraph(verdict, styles["HRScoutBody"]))

    # --- Strengths + Gaps in two-column layout -----------------------------
    def _bullets(items, color):
        if not items:
            return Paragraph(
                '<font color="#64748B"><i>—</i></font>', styles["HRScoutBody"]
            )
        rows = "".join(
            f'<para spaceAfter="4"><font color="{color}">•</font> {item}</para>'
            for item in items
        )
        return Paragraph(rows, styles["HRScoutBody"])

    story.append(Spacer(1, 4))
    cols_data = [[
        Paragraph('<font color="#10B981" name="Helvetica-Bold" size="11">FORTALEZAS</font>', styles["HRScoutBody"]),
        Paragraph('<font color="#F59E0B" name="Helvetica-Bold" size="11">BRECHAS</font>', styles["HRScoutBody"]),
    ], [
        _bullets(strengths, "#10B981"),
        _bullets(gaps, "#F59E0B"),
    ]]
    cols_table = Table(cols_data, colWidths=[85 * mm, 85 * mm])
    cols_table.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 1), (-1, 1), 12),
    ]))
    story.append(cols_table)

    # --- Interview question ------------------------------------------------
    if interview_question:
        story.append(Paragraph("Pregunta sugerida de entrevista", styles["HRScoutH2"]))
        story.append(Paragraph(f"&ldquo;{interview_question}&rdquo;", styles["HRScoutQuestion"]))

    # --- Action ------------------------------------------------------------
    if action:
        story.append(Spacer(1, 8))
        story.append(Paragraph(f"Próximo paso recomendado: <b>{action}</b>", styles["HRScoutBody"]))

    # --- Footer disclaimer -------------------------------------------------
    story.append(Spacer(1, 24))
    story.append(Paragraph(
        '<font color="#64748B" size="8">'
        'Esta puntuación es una herramienta de apoyo. La decisión final de '
        'contratación es responsabilidad del reclutador. Generado por HRScout — '
        'hrscout.mx'
        '</font>',
        styles["HRScoutBody"],
    ))

    doc.build(story)
    _ = white  # silence unused import; kept for future use in branded variant
    return buf.getvalue()
