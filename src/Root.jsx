import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import App from "./App.jsx";
import { AuthProvider } from "./auth/AuthContext";
import { RequireAuth } from "./auth/RequireAuth";
import { AppLayout } from "./components/layout/AppLayout";
import { DashboardPage } from "./pages/Dashboard";
import { JobDetailPage } from "./pages/JobDetail";
import { JobsListPage } from "./pages/JobsList";
import { LandingPage } from "./pages/Landing";
import { LoginPage } from "./pages/Login";
import { PricingPage } from "./pages/Pricing";
import { CookiesPage } from "./pages/legal/Cookies";
import { PrivacyPage } from "./pages/legal/Privacy";
import { TermsPage } from "./pages/legal/Terms";

export function Root() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Landing — commercial conversion page (Day 9). */}
          <Route path="/" element={<LandingPage />} />

          {/* Public interactive demo (original SPA from Phase 0). */}
          <Route path="/demo" element={<App />} />

          {/* Pricing — public, can be visited before login. CTA flows
              redirect to /login if no session. */}
          <Route
            path="/precios"
            element={
              <AppLayout>
                <PricingPage />
              </AppLayout>
            }
          />

          {/* Legal — public, no auth needed. */}
          <Route
            path="/terminos"
            element={
              <AppLayout>
                <TermsPage />
              </AppLayout>
            }
          />
          <Route
            path="/privacidad"
            element={
              <AppLayout>
                <PrivacyPage />
              </AppLayout>
            }
          />
          <Route
            path="/cookies"
            element={
              <AppLayout>
                <CookiesPage />
              </AppLayout>
            }
          />

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
