import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

import { JobsListPage } from "../JobsList";

const originalFetch = global.fetch;

beforeEach(() => {
  global.fetch = vi.fn();
});
afterEach(() => {
  global.fetch = originalFetch;
});

function renderPage() {
  return render(
    <MemoryRouter>
      <JobsListPage />
    </MemoryRouter>
  );
}

describe("JobsListPage", () => {
  it("renders loading state then empty state when there are no jobs", async () => {
    global.fetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ items: [], total: 0 }), { status: 200 })
    );
    renderPage();
    expect(screen.getByText(/cargando vacantes/i)).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByText(/aún no creaste vacantes/i)).toBeInTheDocument()
    );
  });

  it("renders the list when jobs exist", async () => {
    global.fetch.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          items: [
            {
              id: "j1",
              title: "Backend Senior",
              description: "Python + FastAPI + Postgres",
              language: "es",
              created_at: "2026-05-17T12:00:00Z",
            },
          ],
          total: 1,
        }),
        { status: 200 }
      )
    );
    renderPage();
    await waitFor(() =>
      expect(screen.getByText("Backend Senior")).toBeInTheDocument()
    );
    expect(screen.getByText(/Python \+ FastAPI/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /archivar/i })).toBeInTheDocument();
  });

  it("shows an error banner when the API fails", async () => {
    global.fetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ detail: "Boom" }), { status: 500 })
    );
    renderPage();
    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("Boom"));
  });
});
