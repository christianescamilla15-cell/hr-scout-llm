import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";

import { AuthProvider } from "../../auth/AuthContext";
import { PricingPage } from "../Pricing";

const originalFetch = global.fetch;

beforeEach(() => {
  global.fetch = vi.fn();
});
afterEach(() => {
  global.fetch = originalFetch;
  vi.restoreAllMocks();
});

function renderPricing() {
  return render(
    <MemoryRouter initialEntries={["/precios"]}>
      <AuthProvider>
        <Routes>
          <Route path="/precios" element={<PricingPage />} />
          <Route path="/login" element={<div data-testid="at-login">login</div>} />
          <Route path="/dashboard" element={<div data-testid="at-dashboard">dashboard</div>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>
  );
}

describe("PricingPage", () => {
  it("renders 3 plan cards with prices", async () => {
    global.fetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ detail: "Not authenticated" }), { status: 401 })
    );
    renderPricing();
    await waitFor(() => expect(screen.getByText(/Precios honestos/i)).toBeInTheDocument());
    expect(screen.getByText(/Free trial/)).toBeInTheDocument();
    expect(screen.getByText(/Individual/)).toBeInTheDocument();
    expect(screen.getByText(/Agency/)).toBeInTheDocument();
    expect(screen.getByText(/\$97 USD/)).toBeInTheDocument();
    expect(screen.getByText(/\$297 USD/)).toBeInTheDocument();
  });

  it("toggles yearly pricing showing the $970 annual amount", async () => {
    global.fetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ detail: "Not authenticated" }), { status: 401 })
    );
    renderPricing();
    await waitFor(() => expect(screen.getByText(/Mensual/i)).toBeInTheDocument());
    fireEvent.click(screen.getByRole("tab", { name: /Anual/ }));
    expect(screen.getByText(/\$970 USD/)).toBeInTheDocument();
    expect(screen.getByText(/\$2,970 USD/)).toBeInTheDocument();
  });

  it("anonymous user clicking a paid plan goes to /login", async () => {
    global.fetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ detail: "Not authenticated" }), { status: 401 })
    );
    renderPricing();
    await waitFor(() => expect(screen.getByText(/Individual/)).toBeInTheDocument());
    const individualButton = screen.getAllByRole("button", { name: /Iniciar prueba/i })[0];
    fireEvent.click(individualButton);
    await waitFor(() => expect(screen.getByTestId("at-login")).toBeInTheDocument());
  });

  it("highlights Agency with the badge", async () => {
    global.fetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ detail: "Not authenticated" }), { status: 401 })
    );
    renderPricing();
    await waitFor(() => expect(screen.getByText(/Más popular/i)).toBeInTheDocument());
  });
});
