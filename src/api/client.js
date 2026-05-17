// API client — sends cookies for session auth, normalizes errors, JSON in/out.
//
// Backend URL: VITE_API_URL env var. Defaults to http://localhost:8004 for dev.
// In prod (Render): set VITE_API_URL=https://hrscout-api.onrender.com via Vercel.

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8004";

export class ApiError extends Error {
  constructor(status, detail, payload) {
    super(typeof detail === "string" ? detail : "Request failed");
    this.status = status;
    this.detail = detail;
    this.payload = payload;
  }
}

async function request(path, { method = "GET", body, headers = {}, signal } = {}) {
  const opts = {
    method,
    credentials: "include", // critical: send the hrscout_session cookie
    headers: { ...headers },
    signal,
  };
  if (body !== undefined) {
    opts.headers["Content-Type"] = "application/json";
    opts.body = typeof body === "string" ? body : JSON.stringify(body);
  }

  let response;
  try {
    response = await fetch(API_BASE + path, opts);
  } catch (err) {
    if (err.name === "AbortError") throw err;
    throw new ApiError(0, "Network error — backend unreachable", { cause: err.message });
  }

  let payload = null;
  const text = await response.text();
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = text;
    }
  }

  if (!response.ok) {
    const detail = (payload && payload.detail) || response.statusText || "Request failed";
    throw new ApiError(response.status, detail, payload);
  }
  return payload;
}

export const api = {
  get: (path, opts) => request(path, { ...opts, method: "GET" }),
  post: (path, body, opts) => request(path, { ...opts, method: "POST", body }),
  patch: (path, body, opts) => request(path, { ...opts, method: "PATCH", body }),
  delete: (path, opts) => request(path, { ...opts, method: "DELETE" }),
};

// Convenience: full URL helper for redirects (e.g. Google OAuth start)
export function apiUrl(path) {
  return API_BASE + path;
}
