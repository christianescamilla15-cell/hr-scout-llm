"""Keyword extraction + matching. Port of `src/utils/keywordExtraction.js`.

Two halves:
- `extract_keywords(job_desc)` — parses a job description into
  ordered keywords + the subset marked "required" (indispensable,
  obligatorio, etc.)
- `match_keywords(cv_text, keywords, required_set)` — finds which
  keywords (via synonyms) appear in the CV and computes the weighted
  match score (required keywords weighted 2x).
"""

import re
from dataclasses import dataclass

from app.analysis.synonyms import STOPWORDS, SYNONYMS
from app.analysis.text_norm import normalize

_REQUIRED_RE = re.compile(r"indispensable|requerido|requisito|obligatorio|necesario")
_DESIRABLE_RE = re.compile(r"deseable|plus|valorable|preferible|opcional")
_LINE_SPLIT = re.compile(r"[\n,;]+")
_WORD_SPLIT = re.compile(r"[\s,;/()]+")
_LIST_PREFIX = re.compile(r"^[-*\d.)\s]+")
_KEEP_CHARS = re.compile(r"[^a-z0-9.#+]")


@dataclass
class ExtractedKeywords:
    keywords: list[str]
    required_keywords: set[str]


def extract_keywords(job_desc: str) -> ExtractedKeywords:
    norm = normalize(job_desc)
    lines = [s.strip() for s in _LINE_SPLIT.split(norm) if s.strip()]

    keywords: list[str] = []
    required: set[str] = set()
    in_required_section = False
    known_terms = list(SYNONYMS.keys())

    for line in lines:
        if _REQUIRED_RE.search(line):
            in_required_section = True
        if _DESIRABLE_RE.search(line):
            in_required_section = False

        # Multi-word known terms (e.g. "machine learning")
        for term in known_terms:
            if term in line and term not in keywords:
                keywords.append(term)
                if in_required_section:
                    required.add(term)

        # Single-word skill candidates
        stripped = _LIST_PREFIX.sub("", line)
        for raw in _WORD_SPLIT.split(stripped):
            clean = _KEEP_CHARS.sub("", raw)
            if (
                len(clean) >= 2
                and clean not in STOPWORDS
                and clean in SYNONYMS
                and clean not in keywords
            ):
                keywords.append(clean)
                if in_required_section:
                    required.add(clean)

    # Fallback: nothing extracted, scan whole text for known terms
    if not keywords:
        for term in known_terms:
            if term in norm and term not in keywords:
                keywords.append(term)

    return ExtractedKeywords(keywords=keywords, required_keywords=required)


@dataclass
class MatchResult:
    matched: list[str]
    unmatched: list[str]
    keyword_score: float  # 0.0 - 1.0


def match_keywords(
    cv_text: str, keywords: list[str], required_keywords: set[str]
) -> MatchResult:
    norm_cv = normalize(cv_text)
    matched: list[str] = []
    unmatched: list[str] = []

    for kw in keywords:
        synonyms = SYNONYMS.get(kw, [kw])
        found = any(normalize(syn) in norm_cv for syn in synonyms)
        (matched if found else unmatched).append(kw)

    total_weight = 0
    matched_weight = 0
    matched_set = set(matched)
    for kw in keywords:
        w = 2 if kw in required_keywords else 1
        total_weight += w
        if kw in matched_set:
            matched_weight += w

    score = matched_weight / total_weight if total_weight > 0 else 0.0
    return MatchResult(matched=matched, unmatched=unmatched, keyword_score=score)
