"""Years-of-experience extraction. Port of `src/utils/experienceParser.js`."""

import re

_PATTERNS = [
    re.compile(r"(\d+)\s*a[nñ]os?\s*de\s*experiencia", re.IGNORECASE),
    re.compile(r"(\d+)\s*years?\s*(?:of\s*)?experience", re.IGNORECASE),
    re.compile(r"experiencia[:\s]*(\d+)\s*a[nñ]os?", re.IGNORECASE),
]
_DATE_RANGE = re.compile(r"\(?\d{4}\s*[-–]\s*\d{4}\)?")
_DATE_PAIR = re.compile(r"(\d{4})\s*[-–]\s*(\d{4})")
_REQ_YEARS = re.compile(r"(\d+)\+?\s*a[nñ]os?\s*(?:de\s*)?experiencia", re.IGNORECASE)
_REQ_YEARS_EN = re.compile(r"(\d+)\+?\s*years", re.IGNORECASE)


def extract_experience_years(cv_text: str) -> int:
    if not cv_text:
        return 0
    for pat in _PATTERNS:
        m = pat.search(cv_text)
        if m:
            return int(m.group(1))

    # Fallback: sum date-range deltas like "2020-2025"
    ranges = _DATE_RANGE.findall(cv_text)
    if ranges:
        total = 0
        for r in ranges:
            pair = _DATE_PAIR.search(r)
            if pair:
                total += int(pair.group(2)) - int(pair.group(1))
        if total > 0:
            return total
    return 0


def extract_required_years(job_desc: str) -> int:
    if not job_desc:
        return 2
    m = _REQ_YEARS.search(job_desc) or _REQ_YEARS_EN.search(job_desc)
    return int(m.group(1)) if m else 2
