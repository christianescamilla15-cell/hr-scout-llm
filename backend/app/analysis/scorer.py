"""Local CV scoring engine (0-100). Port of `src/utils/cvAnalyzer.js`.

Pure-function: no I/O, no LLM. Always returns a result so the API never
fails an analysis just because the LLM was unavailable. The LLM
augments this score; this is the floor.
"""

import re
from dataclasses import dataclass, field

from app.analysis.education import detect_education
from app.analysis.experience import extract_experience_years, extract_required_years
from app.analysis.keyword_extract import extract_keywords, match_keywords
from app.analysis.language import detect_languages
from app.analysis.synonyms import SKILLS_DISPLAY
from app.analysis.text_norm import normalize

_LEADERSHIP_RE = re.compile(r"lider|equipo|gestio|coordin|dirigi")
_PROJECTS_RE = re.compile(r"produccion|deploy|portafolio|portfolio|proyecto")
_METRICS_RE = re.compile(r"roi|metrica|kpi|resultado|logro|aument|reduj|mejor")
_ENGLISH_REQUIRED_RE = re.compile(r"ingles|english|b2|c1")


@dataclass
class LocalAnalysis:
    score: int
    titulo: str
    experiencia_anos: int
    habilidades_clave: list[str] = field(default_factory=list)
    fortalezas: list[str] = field(default_factory=list)
    brechas: list[str] = field(default_factory=list)
    veredicto: str = ""
    siguiente_paso: str = ""
    pregunta_entrevista: str = ""
    matched_keywords: list[str] = field(default_factory=list)
    unmatched_keywords: list[str] = field(default_factory=list)


def analyze_cv_local(cv_text: str, job_description: str) -> LocalAnalysis:
    extracted = extract_keywords(job_description)
    keywords = extracted.keywords
    required_keywords = extracted.required_keywords
    matches = match_keywords(cv_text, keywords, required_keywords)
    matched = matches.matched
    unmatched = matches.unmatched

    experience_years = extract_experience_years(cv_text)
    required_years = extract_required_years(job_description)
    education = detect_education(cv_text)
    languages = detect_languages(cv_text)

    # Score = weighted keyword match (70%) + experience (12pts) + education (12pts) + lang (6pts)
    score = matches.keyword_score * 70

    if experience_years >= required_years:
        score += 12
    elif experience_years > 0:
        score += round((experience_years / required_years) * 12)

    if education.level >= 3:
        score += 8
    elif education.level >= 2:
        score += 6
    elif education.level >= 1:
        score += 3
    score += min(4, len(education.certifications) * 2)

    eng_lang = next((lng for lng in languages if lng.lang == "Ingles"), None)
    if eng_lang:
        if eng_lang.score >= 5:
            score += 6
        elif eng_lang.score >= 4:
            score += 4
        elif eng_lang.score >= 3:
            score += 2

    score = min(98, max(5, round(score)))

    # Title extraction
    first_line = cv_text.split("\n")[0] if cv_text else ""
    titulo_raw = (first_line.split("|")[0] if "|" in first_line else first_line).strip()
    display_title = (
        titulo_raw[:42] + "..." if len(titulo_raw) > 45 else titulo_raw
    )

    # Skills display
    habilidades: list[str] = []
    for k in matched:
        display = SKILLS_DISPLAY.get(k, k)
        if display not in habilidades:
            habilidades.append(display)
        if len(habilidades) >= 5:
            break
    if not habilidades:
        habilidades.append("Generales")

    # Strengths
    fortalezas: list[str] = []
    norm_cv = normalize(cv_text)

    if experience_years >= required_years and experience_years > 0:
        fortalezas.append(
            f"{experience_years} anos de experiencia, cumple o supera el "
            f"requerimiento de {required_years}+ anos"
        )
    if keywords and len(matched) >= len(keywords) * 0.7:
        fortalezas.append(
            f"Cubre {len(matched)} de {len(keywords)} competencias clave del puesto"
        )
    if education.level >= 3:
        fortalezas.append(f"Formacion academica solida: {education.label}")
    if education.certifications:
        fortalezas.append(
            "Certificaciones relevantes: " + ", ".join(education.certifications[:2])
        )
    if eng_lang and eng_lang.score >= 5:
        fortalezas.append(
            f"Nivel de ingles avanzado ({eng_lang.level}), ideal para entornos internacionales"
        )
    if _LEADERSHIP_RE.search(norm_cv):
        fortalezas.append("Experiencia en liderazgo y gestion de equipos")
    if _PROJECTS_RE.search(norm_cv):
        fortalezas.append("Proyectos concretos y experiencia practica demostrada")
    if _METRICS_RE.search(norm_cv):
        fortalezas.append("Orientacion a resultados con metricas cuantificables")
    if len(fortalezas) < 2:
        fortalezas.append("Perfil con potencial de desarrollo en el area requerida")

    # Gaps
    brechas: list[str] = []
    required_unmatched = [k for k in unmatched if k in required_keywords]
    other_unmatched = [k for k in unmatched if k not in required_keywords]
    for gap in required_unmatched:
        brechas.append(f"Falta competencia requerida: {SKILLS_DISPLAY.get(gap, gap)}")
    for gap in other_unmatched[: max(0, 3 - len(brechas))]:
        brechas.append(f"No se evidencia experiencia en {SKILLS_DISPLAY.get(gap, gap)}")
    if 0 < experience_years < required_years:
        brechas.append(
            f"Solo {experience_years} anos de experiencia (requeridos {required_years}+)"
        )
    if experience_years == 0:
        brechas.append("No se detecta experiencia profesional especifica")
    if (
        eng_lang
        and eng_lang.score < 4
        and _ENGLISH_REQUIRED_RE.search(normalize(job_description))
    ):
        brechas.append(
            f"Nivel de ingles {eng_lang.level or 'no especificado'} por debajo del requerimiento"
        )
    if not brechas:
        brechas.append("Podria requerir onboarding en procesos internos especificos")

    # Verdict + next-step + interview question
    if score >= 80:
        veredicto = (
            f"Candidato fuerte con {len(matched)} de {len(keywords)} competencias "
            "cubiertas. Perfil altamente alineado con los requerimientos del puesto."
        )
        siguiente_paso = "Agendar entrevista tecnica en los proximos 3 dias. Candidato prioritario."
        top_skill = habilidades[0] if habilidades else "su area"
        pregunta_entrevista = (
            f"Describe un proyecto donde hayas implementado {top_skill} de principio a fin. "
            "Cual fue el mayor desafio tecnico y como lo resolviste?"
            if experience_years >= 3
            else f"Cual ha sido tu proyecto mas complejo con {top_skill} y que metricas de exito definiste?"
        )
    elif score >= 60:
        veredicto = (
            "Perfil parcialmente compatible. Tiene fortalezas relevantes pero existen "
            "brechas que requeririan capacitacion o periodo de adaptacion."
        )
        siguiente_paso = (
            "Anadir a lista de espera. Evaluar si las brechas son capacitables en 1-2 meses."
        )
        main_gap = (brechas[0] if brechas else "areas pendientes").lower()
        main_gap = main_gap.replace("falta competencia requerida: ", "").replace(
            "no se evidencia experiencia en ", ""
        )
        pregunta_entrevista = (
            f"Respecto a {main_gap}: tienes experiencia o interes? "
            "Como abordarias la curva de aprendizaje?"
        )
    else:
        veredicto = (
            "El perfil no se alinea con los requerimientos criticos del puesto. "
            "Las brechas identificadas son significativas."
        )
        siguiente_paso = (
            "Descartar para este puesto. Considerar para roles alternativos si aplica."
        )
        pregunta_entrevista = (
            "Que te motiva a postularte para este rol dado tu background actual? "
            "Como planeas cerrar las brechas identificadas?"
        )

    return LocalAnalysis(
        score=score,
        titulo=display_title,
        experiencia_anos=experience_years,
        habilidades_clave=habilidades,
        fortalezas=fortalezas[:4],
        brechas=brechas[:3],
        veredicto=veredicto,
        siguiente_paso=siguiente_paso,
        pregunta_entrevista=pregunta_entrevista,
        matched_keywords=matched,
        unmatched_keywords=unmatched,
    )
