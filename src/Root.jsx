import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import App from "./App.jsx";
import { AuthProvider } from "./auth/AuthContext";
import { RequireAuth } from "./auth/RequireAuth";
import { AppLayout } from "./components/layout/AppLayout";
import { DashboardPage } from "./pages/Dashboard";
import { JobDetailPage } from "./pages/JobDetail";
import { JobsListPage } from "./pages/JobsList";
import { LoginPage } from "./pages/Login";

export function Root() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public demo (current SPA) — landing for unauthenticated visitors. */}
          <Route path="/" element={<App />} />
          <Route path="/demo" element={<App />} />

          {/* Auth */}
          <Route
            path="/login"
            element={
              <AppLayout>
                <LoginPage />
              </AppLayout>
            }
          />

          {/* Authenticated app */}
          <Route
            path="/dashboard"
            element={
              <RequireAuth>
                <AppLayout>
                  <DashboardPage />
                </AppLayout>
              </RequireAuth>
            }
          />
          <Route
            path="/jobs"
            element={
              <RequireAuth>
                <AppLayout>
                  <JobsListPage />
                </AppLayout>
              </RequireAuth>
            }
          />
          <Route
            path="/jobs/:jobId"
            element={
              <RequireAuth>
                <AppLayout>
                  <JobDetailPage />
                </AppLayout>
              </RequireAuth>
            }
          />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
