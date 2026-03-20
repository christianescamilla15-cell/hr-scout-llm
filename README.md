# 👥 HRScout — Sistema de Filtrado de CVs con LLMs

> Automatiza el screening inicial de candidatos. Evalúa CVs contra descripciones de puesto, genera score de compatibilidad 0-100 y recomienda la siguiente acción por candidato. Reduce el tiempo de filtrado de horas a minutos.

---

## ¿Cómo funciona?

1. **Pega la descripción del puesto** en el panel izquierdo
2. **Haz clic en "Analizar todos"** o analiza candidatos uno por uno
3. Los candidatos se **reordenan automáticamente** por score de compatibilidad
4. **Expande cada candidato** para ver el análisis completo

## Por cada candidato, Claude genera

| Campo | Descripción |
|-------|-------------|
| **Score** | Compatibilidad 0-100 con color (verde/amarillo/rojo) |
| **Fortalezas** | 3 puntos donde el candidato sobresale |
| **Brechas** | Habilidades o experiencia que le faltan |
| **Veredicto** | Evaluación ejecutiva en 2 líneas |
| **Siguiente paso** | Entrevistar / Lista de espera / Descartar |
| **Pregunta clave** | Una pregunta específica para validar su experiencia real |

## Panel de resumen automático

Al finalizar el análisis muestra:
- Total de candidatos procesados
- Aptos (score ≥ 80)
- Por revisar (score 60-79)
- No aptos (score < 60)

## Instalación

```bash
git clone https://github.com/christianescamilla15-cell/hr-scout-llm
cd hr-scout-llm
npm install
cp .env.example .env
npm run dev   # http://localhost:3004
```

## Variables de entorno

```env
VITE_ANTHROPIC_API_KEY=sk-ant-...
```

## Extensiones posibles

- Conectar con Notion o Airtable para guardar resultados automáticamente
- Integrar con Make.com para notificar a candidatos aptos por email
- Agregar módulo de generación de plan de capacitación personalizado por candidato

## Stack

`React` `Claude API` `Python` `FastAPI`

---

[![Portfolio](https://img.shields.io/badge/Portfolio-ch65--portfolio-6366F1?style=flat)](https://ch65-portfolio.vercel.app)
