import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

import { AuthProvider } from "../../auth/AuthContext";
import { LandingPage } from "../Landing";

const originalFetch = global.fetch;

beforeEach(() => {
  global.fetch = vi.fn();
});
afterEach(() => {
  global.fetch = originalFetch;
  vi.restoreAllMocks();
});

function renderLanding() {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <LandingPage />
      </AuthProvider>
    </MemoryRouter>
  );
}

describe("LandingPage", () => {
  beforeEach(() => {
    global.fetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ detail: "Not authenticated" }), { status: 401 })
    );
  });

  it("renders the hero headline and subhead", async () => {
    renderLanding();
    await waitFor(() => expect(screen.getByText(/Filtra 100 CVs en 5 minutos/)).toBeInTheDocument());
    expect(screen.getByText(/Sin sesgos\. Sin maratón/)).toBeInTheDocument();
  });

  it("renders the LFPDPPP trust strip", async () => {
    renderLanding();
    await waitFor(() => expect(screen.getByText(/Cumple LFPDPPP/)).toBeInTheDocument());
  });

  it("includes the demo CTA and pricing CTA", async () => {
    renderLanding();
    await waitFor(() => expect(screen.getAllByText(/Ver demo en vivo|Probar demo/).length).toBeGreaterThan(0));
    expect(screen.getByText(/Ver planes/)).toBeInTheDocument();
  });

  it("renders the FAQ items", async () => {
    renderLanding();
    await waitFor(() => expect(screen.getByText(/Es legal usar IA/)).toBeInTheDocument());
    expect(screen.getByText(/Aceptan PDF y Word/)).toBeInTheDocument();
  });

  it("renders the honest social-proof block instead of fake testimonials", async () => {
    renderLanding();
    await waitFor(() =>
      expect(screen.getByText(/Próximamente — primeros 20 usuarios/)).toBeInTheDocument()
    );
  });
});
