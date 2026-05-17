import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

import { AnalysisCard } from "../AnalysisCard";

const sampleAnalysis = {
  score: 87,
  local_score: 80,
  ai_score: 92,
  confidence: "medium",
  strengths: ["Python", "FastAPI", "Liderazgo"],
  gaps: ["Docker"],
  verdict: "Candidato fuerte con experiencia relevante.",
  action: "interview",
  interview_question: "¿Cómo manejarías una caída de producción en FastAPI?",
  analysis_mode: "groq",
  latency_ms: 3200,
};

describe("AnalysisCard", () => {
  it("renders the score, strengths, gaps, verdict and question", () => {
    render(<AnalysisCard analysis={sampleAnalysis} />);
    expect(screen.getByText("87")).toBeInTheDocument();
    expect(screen.getByText(/Python/)).toBeInTheDocument();
    expect(screen.getByText(/Docker/)).toBeInTheDocument();
    expect(screen.getByText(/Candidato fuerte/)).toBeInTheDocument();
    expect(screen.getByText(/Cómo manejarías/)).toBeInTheDocument();
    expect(screen.getByText(/interview/)).toBeInTheDocument();
  });

  it("always shows the human-final-decision disclaimer", () => {
    render(<AnalysisCard analysis={sampleAnalysis} />);
    expect(screen.getByText(/decisión final de contratación es tuya/i)).toBeInTheDocument();
  });

  it("returns null when analysis is missing", () => {
    const { container } = render(<AnalysisCard analysis={null} />);
    expect(container.firstChild).toBeNull();
  });
});
