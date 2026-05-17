import { Navigate, useLocation } from "react-router-dom";

import { useAuth } from "./AuthContext";

export function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{
        minHeight: "60vh",
        display: "grid",
        placeItems: "center",
        color: "rgba(255,255,255,0.5)",
        fontSize: 14,
      }}>
        Cargando…
      </div>
    );
  }
  if (!user) {
    // Preserve attempted path so login can redirect back after success
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }
  return children;
}
