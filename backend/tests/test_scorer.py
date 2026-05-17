"""Local scoring engine tests. Must match the behavior of the frontend
reference engine (src/utils/cvAnalyzer.js + matching test fixtures)."""

from app.analysis.experience import extract_experience_years, extract_required_years
from app.analysis.keyword_extract import extract_keywords, match_keywords
from app.analysis.scorer import analyze_cv_local
from app.analysis.text_norm import normalize


def test_normalize_strips_accents_and_lowercase():
    assert normalize("Maria José ÑOÑO") == "maria jose nono"


def test_normalize_handles_empty():
    assert normalize("") == ""


def test_normalize_keeps_dots_slashes_plusses():
    out = normalize("Node.js + React/Redux")
    assert "node.js" in out
    assert "react/redux" in out


def test_extract_keywords_finds_known_terms():
    jd = "Buscamos desarrollador con Python, React y SQL"
    result = extract_keywords(jd)
    assert "python" in result.keywords
    assert "react" in result.keywords
    assert "sql" in result.keywords


def test_extract_keywords_marks_required_section():
    jd = "Requisitos obligatorios:\nPython\nSQL\n\nDeseable:\nDocker"
    result = extract_keywords(jd)
    assert "python" in result.required_keywords
    assert "sql" in result.required_keywords
    assert "docker" not in result.required_keywords


def test_match_keywords_uses_synonyms():
    cv = "Experiencia con ReactJS y Node.js"
    result = match_keywords(cv, ["react", "node"], set())
    assert "react" in result.matched
    assert "node" in result.matched


def test_match_keywords_weighted_score():
    """Required keywords count 2x."""
    cv = "Python expert"
    keywords = ["python", "react"]
    required = {"python"}
    r = match_keywords(cv, keywords, required)
    # python matched (weight 2), react unmatched (weight 1) → 2 / 3
    assert abs(r.keyword_score - 2 / 3) < 0.001


def test_extract_experience_years_spanish():
    assert extract_experience_years("Tengo 5 años de experiencia en Python") == 5


def test_extract_experience_years_english():
    assert extract_experience_years("7 years of experience as backend dev") == 7


def test_extract_experience_years_from_date_ranges():
    cv = "Empresa A 2020-2023\nEmpresa B 2018-2020"
    assert extract_experience_years(cv) == 5


def test_extract_required_years_default():
    assert extract_required_years("Backend developer wanted") == 2


def test_extract_required_years_explicit():
    assert extract_required_years("5+ años de experiencia") == 5


def test_analyze_cv_local_strong_candidate():
    cv = """Ana Garcia
Senior Developer
8 años de experiencia con Python, React, PostgreSQL.
Maestría en Ciencias Computacionales.
Inglés C1.
Líder de equipo de 5 ingenieros."""
    jd = """Buscamos Backend Senior
Requisitos obligatorios:
Python
SQL
3+ años de experiencia"""
    result = analyze_cv_local(cv, jd)
    assert result.score >= 70
    assert result.experiencia_anos == 8
    assert len(result.fortalezas) >= 2
    assert "python" in result.matched_keywords


def test_analyze_cv_local_weak_candidate():
    cv = "Juan novato, sin experiencia"
    jd = "Buscamos Python developer con 5 años experiencia. Obligatorio Docker."
    result = analyze_cv_local(cv, jd)
    assert result.score < 60
    assert len(result.brechas) >= 1


def test_analyze_cv_local_clamps_score_range():
    """Score is always between 5 and 98 inclusive."""
    empty_cv = "a"
    jd = "Looking for python, react, sql, docker, aws, k8s, ml, ai, node"
    r = analyze_cv_local(empty_cv, jd)
    assert 5 <= r.score <= 98


def test_analyze_cv_local_returns_verdict_for_score():
    cv = "Senior dev 10 años, Python expert, líder de equipo, MBA"
    jd = "Backend lead\nObligatorio: Python, 5+ años"
    r = analyze_cv_local(cv, jd)
    assert "fuerte" in r.veredicto.lower() or "compatible" in r.veredicto.lower() or "no se alinea" in r.veredicto.lower()
    assert r.siguiente_paso
    assert r.pregunta_entrevista
