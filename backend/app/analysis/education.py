"""Education + certification detection. Port of `src/utils/educationDetector.js`."""

import re
from dataclasses import dataclass, field

from app.analysis.text_norm import normalize


@dataclass
class EducationResult:
    level: float
    label: str
    certifications: list[str] = field(default_factory=list)


_LEVEL_PATTERNS: list[tuple[re.Pattern, float, str]] = [
    (re.compile(r"doctorado|phd|ph\.d"), 4, "Doctorado"),
    (re.compile(r"maestria|master|mba|m\.sc|m\.s\."), 3, "Maestria"),
    (
        re.compile(
            r"licenciatura|ingenieria|ingeniero|ingeniera|bachelor|b\.sc|b\.s\.|carrera|universidad"
        ),
        2,
        "Licenciatura/Ingenieria",
    ),
    (re.compile(r"bootcamp|tecnico|tecnica|diplomado|curso"), 1, "Tecnico/Bootcamp"),
    (re.compile(r"preparatoria|bachillerato|high school"), 0.5, "Preparatoria"),
]

_CERT_PATTERNS = [
    re.compile(r"certificaci[oó]n\s+([^.,\n]+)", re.IGNORECASE),
    re.compile(r"certificad[oa]\s+(?:en\s+)?([^.,\n]+)", re.IGNORECASE),
    re.compile(r"certified\s+([^.,\n]+)", re.IGNORECASE),
]


def detect_education(cv_text: str) -> EducationResult:
    norm = normalize(cv_text)
    level: float = 0
    label = "No detectada"
    for pat, lvl, lbl in _LEVEL_PATTERNS:
        if pat.search(norm):
            level = lvl
            label = lbl
            break

    certs: list[str] = []
    for pat in _CERT_PATTERNS:
        for m in pat.finditer(cv_text):
            certs.append(m.group(1).strip()[:40])
    return EducationResult(level=level, label=label, certifications=certs)
