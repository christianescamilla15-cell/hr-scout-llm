import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";

import { AuthProvider, useAuth } from "../AuthContext";

function Probe() {
  const { user, loading, error, logout } = useAuth();
  return (
    <div>
      <div data-testid="loading">{loading ? "loading" : "idle"}</div>
      <div data-testid="user">{user ? user.email : "anon"}</div>
      <div data-testid="error">{error ? error.message : ""}</div>
      <button onClick={logout}>logout</button>
    </div>
  );
}

const originalFetch = global.fetch;

beforeEach(() => {
  global.fetch = vi.fn();
});

afterEach(() => {
  global.fetch = originalFetch;
  vi.restoreAllMocks();
});

describe("AuthContext", () => {
  it("starts in loading state then hydrates with /api/auth/me", async () => {
    global.fetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ email: "ana@example.mx", plan: "trial", name: "Ana", id: "u1" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>
    );

    expect(screen.getByTestId("loading").textContent).toBe("loading");

    await waitFor(() => expect(screen.getByTestId("loading").textContent).toBe("idle"));
    expect(screen.getByTestId("user").textContent).toBe("ana@example.mx");
  });

  it("treats 401 as anonymous, not an error", async () => {
    global.fetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ detail: "Not authenticated" }), { status: 401 })
    );

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>
    );

    await waitFor(() => expect(screen.getByTestId("loading").textContent).toBe("idle"));
    expect(screen.getByTestId("user").textContent).toBe("anon");
    expect(screen.getByTestId("error").textContent).toBe("");
  });

  it("captures non-401 errors", async () => {
    global.fetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ detail: "boom" }), { status: 500 })
    );

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>
    );

    await waitFor(() => expect(screen.getByTestId("loading").textContent).toBe("idle"));
    expect(screen.getByTestId("user").textContent).toBe("anon");
    expect(screen.getByTestId("error").textContent).toBe("boom");
  });

  it("logout clears the user", async () => {
    global.fetch
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ email: "ana@example.mx", plan: "trial", name: "Ana", id: "u1" }), { status: 200 })
      )
      .mockResolvedValueOnce(new Response(JSON.stringify({ ok: true }), { status: 200 }));

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>
    );

    await waitFor(() => expect(screen.getByTestId("user").textContent).toBe("ana@example.mx"));

    await act(async () => {
      screen.getByText("logout").click();
    });

    await waitFor(() => expect(screen.getByTestId("user").textContent).toBe("anon"));
  });
});
