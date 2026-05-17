"""Language proficiency detection. Port of `src/utils/languageDetector.js`."""

import re
from dataclasses import dataclass

from app.analysis.text_norm import normalize


@dataclass
class LanguageLevel:
    lang: str
    level: str
    score: int


_LEVEL_MAP: dict[str, int] = {
    "c2": 6, "c1": 5, "b2": 4, "b1": 3, "a2": 2, "a1": 1,
    "nativo": 6, "native": 6, "avanzado": 5, "advanced": 5,
    "intermedio": 3, "intermediate": 3,
    "basico": 1, "basic": 1,
}

_PATTERNS = [
    re.compile(
        r"ingl[eé]s\s+(c2|c1|b2|b1|a2|a1|nativo|native|avanzado|intermedio|basico)",
        re.IGNORECASE,
    ),
    re.compile(
        r"english\s+(c2|c1|b2|b1|a2|a1|native|advanced|intermediate|basic)",
        re.IGNORECASE,
    ),
]

_ONLY_SPANISH = re.compile(
    r"solo\s+espa[nñ]ol|espa[nñ]ol\s+[uú]nicamente|unicamente", re.IGNORECASE
)


def detect_languages(cv_text: str) -> list[LanguageLevel]:
    if not cv_text:
        return []
    languages: list[LanguageLevel] = []
    for pat in _PATTERNS:
        m = pat.search(cv_text)
        if m:
            level = m.group(1)
            languages.append(
                LanguageLevel(
                    lang="Ingles",
                    level=level,
                    score=_LEVEL_MAP.get(normalize(level), 0),
                )
            )
    if not languages and _ONLY_SPANISH.search(cv_text):
        languages.append(LanguageLevel(lang="Ingles", level="No", score=0))
    return languages
