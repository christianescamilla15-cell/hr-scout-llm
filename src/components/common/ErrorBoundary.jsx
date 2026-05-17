import { Component } from "react";

// Boundary de error — class component requerido para componentDidCatch
export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("[ErrorBoundary] Caught error:", error);
    console.error("[ErrorBoundary] Component stack:", errorInfo?.componentStack);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          role="alert"
          style={{
            padding: 24,
            textAlign: "center",
            background: "rgba(239,68,68,0.06)",
            border: "1px solid rgba(239,68,68,0.2)",
            borderRadius: 12,
            margin: "12px 0",
          }}
        >
          <p style={{ color: "#EF4444", fontSize: 14, fontWeight: 600, margin: "0 0 4px" }}>
            Algo salio mal / Something went wrong
          </p>
          <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, margin: "0 0 14px", fontFamily: "'DM Mono', monospace" }}>
            {this.state.error?.message || "Error desconocido"}
          </p>
          <button
            onClick={this.handleRetry}
            aria-label="Reintentar / Retry"
            style={{
              padding: "8px 20px",
              borderRadius: 8,
              background: "rgba(99,102,241,0.15)",
              border: "1px solid rgba(99,102,241,0.3)",
              color: "#818CF8",
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 600,
              fontFamily: "'DM Sans', sans-serif",
              transition: "all 0.15s",
            }}
          >
            Reintentar / Retry
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
