"""Extractor tests — generate PDFs/DOCXs in memory so the suite is hermetic.

PDF generation uses reportlab if available; if not, we skip the PDF cases
(the DOCX path is still covered, and the prod runtime doesn't generate
PDFs — only consumes them). Reportlab is a test-only dep; if it's
missing we degrade gracefully.
"""

import io

import pytest
from docx import Document

from app.upload.extractor import (
    ALLOWED_EXTENSIONS,
    ALLOWED_MIME_TYPES,
    ExtractedCV,
    ExtractionError,
    detect_kind,
    extract,
    extract_docx,
    extract_pdf,
)


# ──────────────────────────────────────────────────────────── DOCX helpers


def _make_docx(paragraphs: list[str]) -> bytes:
    doc = Document()
    for p in paragraphs:
        doc.add_paragraph(p)
    buf = io.BytesIO()
    doc.save(buf)
    return buf.getvalue()


# ──────────────────────────────────────────────────────────── kind detection


def test_detect_kind_from_extension():
    assert detect_kind("cv.pdf", None) == "pdf"
    assert detect_kind("cv.docx", None) == "docx"
    assert detect_kind("CV.PDF", "wrong/mime") == "pdf"  # extension wins


def test_detect_kind_from_mime_fallback():
    assert detect_kind("noext", "application/pdf") == "pdf"
    assert detect_kind(
        "", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) == "docx"


def test_detect_kind_rejects_unknown():
    with pytest.raises(ExtractionError, match="Unsupported"):
        detect_kind("cv.txt", "text/plain")


def test_allowed_constants_are_consistent():
    """ALLOWED_EXTENSIONS and ALLOWED_MIME_TYPES must agree on the kind names."""
    assert set(ALLOWED_EXTENSIONS.values()) == set(ALLOWED_MIME_TYPES.values())


# ──────────────────────────────────────────────────────────── DOCX extraction


def test_extract_docx_basic():
    data = _make_docx([
        "Ana García",
        "ana.garcia@example.mx",
        "Senior Backend Developer",
        "5 años de experiencia con Python y PostgreSQL.",
    ])
    result = extract_docx(data)
    assert isinstance(result, ExtractedCV)
    assert "Ana García" in result.text
    assert "PostgreSQL" in result.text
    assert result.source == "docx"
    assert result.pages == 1


def test_extract_docx_picks_up_email_heuristic():
    data = _make_docx(["Juan Perez", "juan@example.mx", "Backend dev"])
    result = extract_docx(data)
    assert result.email == "juan@example.mx"


def test_extract_docx_picks_up_name_heuristic():
    data = _make_docx(["María José Núñez", "maria@example.mx", "Senior Dev"])
    result = extract_docx(data)
    assert result.full_name == "María José Núñez"


def test_extract_docx_skips_line_with_email_as_name():
    """An email-shaped line shouldn't be picked as the name."""
    data = _make_docx(["alguien@example.mx", "Ana Lopez", "Dev"])
    result = extract_docx(data)
    assert result.full_name == "Ana Lopez"


def test_extract_docx_skips_line_with_digits_as_name():
    data = _make_docx(["Tel +52 55 1234 5678", "Carlos Ruiz", "Dev"])
    result = extract_docx(data)
    assert result.full_name == "Carlos Ruiz"


def test_extract_docx_empty_raises():
    data = _make_docx([])
    with pytest.raises(ExtractionError, match="no extractable text"):
        extract_docx(data)


def test_extract_docx_corrupt_bytes_raises():
    with pytest.raises(ExtractionError, match="DOCX parse failed"):
        extract_docx(b"this is not a docx")


def test_extract_dispatch_picks_docx_path():
    data = _make_docx(["Ana", "Dev", "Python"])
    result = extract(data, "cv.docx", None)
    assert result.source == "docx"


# ──────────────────────────────────────────────────────────── PDF extraction


reportlab = pytest.importorskip("reportlab", reason="reportlab not installed (test-only)")


def _make_pdf(lines: list[str]) -> bytes:
    from reportlab.pdfgen import canvas
    from reportlab.lib.pagesizes import letter

    buf = io.BytesIO()
    c = canvas.Canvas(buf, pagesize=letter)
    y = 750
    for line in lines:
        c.drawString(72, y, line)
        y -= 18
    c.save()
    return buf.getvalue()


def test_extract_pdf_basic():
    data = _make_pdf([
        "Carla Mendoza",
        "carla@example.mx",
        "Senior Backend Developer",
        "5 anos de experiencia Python PostgreSQL FastAPI",
    ])
    result = extract_pdf(data)
    assert isinstance(result, ExtractedCV)
    assert "Carla Mendoza" in result.text
    assert "Python" in result.text
    assert result.source == "pdf"
    assert result.pages == 1


def test_extract_pdf_picks_up_email():
    data = _make_pdf(["Test User", "test.user@example.mx", "Dev"])
    result = extract_pdf(data)
    assert result.email == "test.user@example.mx"


def test_extract_pdf_corrupt_bytes_raises():
    with pytest.raises(ExtractionError, match="PDF parse failed"):
        extract_pdf(b"not a pdf")


def test_extract_dispatch_picks_pdf_path():
    data = _make_pdf(["Ana", "Dev", "Python content for extraction"])
    result = extract(data, "cv.pdf", "application/pdf")
    assert result.source == "pdf"
