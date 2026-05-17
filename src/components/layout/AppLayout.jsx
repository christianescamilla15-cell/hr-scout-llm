import { Link, NavLink, useNavigate } from "react-router-dom";

import { useAuth } from "../../auth/AuthContext";
import { TOKENS } from "../../constants/tokens";

const navLinkStyle = ({ isActive }) => ({
  padding: `${TOKENS.space[2]} ${TOKENS.space[3]}`,
  borderRadius: TOKENS.radius.sm,
  color: isActive ? TOKENS.color.textPrimary : TOKENS.color.textSecondary,
  background: isActive ? TOKENS.color.surfaceGlass : "transparent",
  textDecoration: "none",
  fontSize: TOKENS.text.bodySm.size,
  fontWeight: 500,
});

export function AppLayout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/", { replace: true });
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: TOKENS.color.canvas,
        color: TOKENS.color.textPrimary,
        fontFamily: TOKENS.font.body,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <header
        style={{
          display: "flex",
          alignItems: "center",
          gap: TOKENS.space[5],
          padding: `${TOKENS.space[3]} ${TOKENS.space[5]}`,
          borderBottom: `1px solid ${TOKENS.color.borderSubtle}`,
          background: TOKENS.color.surfaceGlass,
          backdropFilter: "blur(12px)",
          position: "sticky",
          top: 0,
          zIndex: 10,
        }}
      >
        <Link
          to={user ? "/dashboard" : "/"}
          style={{
            fontSize: TOKENS.text.h4.size,
            fontWeight: 700,
            color: TOKENS.color.textPrimary,
            textDecoration: "none",
            letterSpacing: "-0.02em",
          }}
        >
          HRScout
        </Link>

        <nav style={{ display: "flex", gap: TOKENS.space[2], flex: 1 }}>
          {user && (
            <>
              <NavLink to="/dashboard" style={navLinkStyle}>Dashboard</NavLink>
              <NavLink to="/jobs" style={navLinkStyle}>Vacantes</NavLink>
              <NavLink to="/demo" style={navLinkStyle}>Demo</NavLink>
            </>
          )}
          {!user && (
            <NavLink to="/demo" style={navLinkStyle}>Probar demo</NavLink>
          )}
        </nav>

        <div style={{ display: "flex", alignItems: "center", gap: TOKENS.space[3] }}>
          {user ? (
            <>
              <span style={{ fontSize: TOKENS.text.bodySm.size, color: TOKENS.color.textMuted }}>
                {user.email} · {user.plan}
              </span>
              <button
                onClick={handleLogout}
                style={{
                  background: "transparent",
                  border: `1px solid ${TOKENS.color.borderSubtle}`,
                  borderRadius: TOKENS.radius.sm,
                  color: TOKENS.color.textSecondary,
                  padding: `${TOKENS.space[2]} ${TOKENS.space[3]}`,
                  fontSize: TOKENS.text.bodySm.size,
                  cursor: "pointer",
                }}
              >
                Cerrar sesión
              </button>
            </>
          ) : (
            <Link
              to="/login"
              style={{
                background: TOKENS.color.accent,
                color: TOKENS.color.textPrimary,
                padding: `${TOKENS.space[2]} ${TOKENS.space[4]}`,
                borderRadius: TOKENS.radius.md,
                textDecoration: "none",
                fontSize: TOKENS.text.bodySm.size,
                fontWeight: 600,
              }}
            >
              Iniciar sesión
            </Link>
          )}
        </div>
      </header>

      <main style={{ flex: 1, padding: TOKENS.space[5] }}>{children}</main>
    </div>
  );
}
