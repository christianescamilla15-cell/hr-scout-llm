# HRScout LLM

AI-assisted candidate screening workflow for faster and more structured CV evaluation.

## Overview
HRScout helps automate the first pass of candidate screening by comparing CVs against a job description, assigning a compatibility score, surfacing strengths and gaps, and recommending next actions.

## Problem
Manual CV screening is slow, repetitive, and inconsistent. Recruiters need a faster way to prioritize candidates while preserving useful context for follow-up decisions.

## Solution
HRScout provides:
- Compatibility scoring (0-100)
- Strengths and gaps analysis
- Verdict recommendation (fit / review / reject)
- Next-step suggestion per candidate
- Summary dashboard across candidates

## Workflow

```text
Job Description Input
        ↓
Candidate CV Upload (PDF/TXT)
        ↓
4-Agent AI Pipeline
  ├ Skill Extractor
  ├ Experience Evaluator
  ├ Job Fit Analyzer
  └ Recommendation Engine
        ↓
Compatibility Score (0-100)
        ↓
Recruiter Summary Panel + Radar Chart
```

## Key Outputs per Candidate
- Score 0-100 with confidence indicator
- Strengths identified
- Skill gaps flagged
- Executive verdict
- Suggested next step
- Validation question for interview

## Engineering Decisions

### Why 4-agent pipeline?
To separate concerns: extraction, evaluation, analysis, and recommendation each handled by a specialized agent.

### Why Claude Tool Use?
5 tools in an agentic loop allow the LLM to call specific analysis functions rather than generating everything in one pass.

### Why radar chart?
Visual skill coverage gives recruiters instant understanding of candidate fit.

## Tech Stack
| Layer | Technology |
|-------|-----------|
| Frontend | React 18 / Vite |
| AI | Claude API + Tool Use (5 tools) |
| Backend | FastAPI |
| Testing | 103 tests |

## Key Metrics
| Metric | Value |
|--------|-------|
| Tests | 103 |
| AI Agents | 4 |
| Scoring Range | 0-100 |
| Commits | 5 |

## How to Run
```bash
npm install
npm run dev
```

## Roadmap
- [ ] Batch upload support
- [ ] Semantic skill matching
- [ ] Recruiter feedback loop
- [ ] Scoring explainability

---
Built by [Christian Hernandez](https://ch65-portfolio.vercel.app) · AI Engineer
