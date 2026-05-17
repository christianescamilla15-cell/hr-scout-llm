import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

import { ScorePill } from "../ScorePill";

describe("ScorePill", () => {
  it("renders the score number and mode", () => {
    render(<ScorePill score={87} mode="groq" />);
    expect(screen.getByText("87")).toBeInTheDocument();
    expect(screen.getByText(/groq/)).toBeInTheDocument();
  });

  it("uses an aria-label that summarizes score + mode", () => {
    render(<ScorePill score={72} mode="local" />);
    const pill = screen.getByLabelText(/Puntuación 72 de 100/);
    expect(pill).toBeInTheDocument();
  });
});
