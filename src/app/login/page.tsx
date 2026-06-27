"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Lock, User, CheckCircle, AlertTriangle } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Check if already authenticated on load
  useEffect(() => {
    fetch("/api/auth/check").then((res) => {
      if (res.ok) {
        router.replace("/dashboard");
      }
    });
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccess(true);
        setTimeout(() => {
          router.replace("/dashboard");
        }, 1200);
      } else {
        setError(data.error || "Invalid username or password");
        setLoading(false);
      }
    } catch (err) {
      console.error("Login request error:", err);
      setError("Unable to connect to the server. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      {/* Visual decorative background lights */}
      <div style={styles.glow1} />
      <div style={styles.glow2} />

      <main className="glass-panel-glow animate-fade-in" style={styles.loginCard}>
        <div style={styles.header}>
          <div style={styles.logoBadge}>VRK GRAND</div>
          <h1 style={styles.title}>VRK GRAND</h1>
          <p style={styles.subtitle}>Admin Portal & Booking Console</p>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          {error && (
            <div style={styles.errorContainer}>
              <AlertTriangle size={18} color="var(--color-danger)" />
              <span style={styles.errorText}>{error}</span>
            </div>
          )}

          {success && (
            <div style={styles.successContainer}>
              <CheckCircle size={18} color="var(--color-success)" />
              <span style={styles.successText}>Authentication Approved. Redirecting...</span>
            </div>
          )}

          <div className="form-group">
            <label className="form-label" htmlFor="admin-username">Username</label>
            <div style={styles.inputWrapper}>
              <User size={18} style={styles.inputIcon} />
              <input
                id="admin-username"
                type="text"
                placeholder="Enter username"
                className="form-input"
                style={styles.inputWithIcon}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                disabled={loading || success}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="admin-password">Password</label>
            <div style={styles.inputWrapper}>
              <Lock size={18} style={styles.inputIcon} />
              <input
                id="admin-password"
                type="password"
                placeholder="Enter password"
                className="form-input"
                style={styles.inputWithIcon}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading || success}
              />
            </div>
          </div>

          <button
            id="login-btn"
            type="submit"
            className="btn btn-primary"
            style={styles.submitBtn}
            disabled={loading || success}
          >
            {loading ? (
              <span style={styles.spinner}></span>
            ) : success ? (
              "Access Granted"
            ) : (
              "Sign In to Console"
            )}
          </button>
        </form>

        <footer style={styles.footer}>
          <span>Secured with AES-256 Aadhaar Encryption</span>
        </footer>
      </main>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "100vh",
    backgroundColor: "var(--bg-primary)",
    position: "relative",
    overflow: "hidden",
    padding: "20px",
  },
  glow1: {
    position: "absolute",
    width: "400px",
    height: "400px",
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, rgba(99, 102, 241, 0) 70%)",
    top: "-100px",
    left: "-100px",
    pointerEvents: "none",
  },
  glow2: {
    position: "absolute",
    width: "500px",
    height: "500px",
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(212, 175, 55, 0.08) 0%, rgba(212, 175, 55, 0) 70%)",
    bottom: "-150px",
    right: "-100px",
    pointerEvents: "none",
  },
  loginCard: {
    width: "100%",
    maxWidth: "420px",
    padding: "40px",
    borderRadius: "var(--radius-lg)",
    zIndex: 1,
  },
  header: {
    textAlign: "center",
    marginBottom: "32px",
  },
  logoBadge: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(212, 175, 55, 0.1)",
    border: "1px solid var(--accent-gold)",
    color: "var(--accent-gold)",
    fontSize: "0.85rem",
    fontWeight: 700,
    textTransform: "uppercase",
    padding: "4px 12px",
    borderRadius: "20px",
    letterSpacing: "0.1em",
    marginBottom: "16px",
  },
  title: {
    fontSize: "1.6rem",
    fontWeight: 700,
    letterSpacing: "-0.02em",
    color: "var(--text-primary)",
    marginBottom: "6px",
  },
  subtitle: {
    fontSize: "0.9rem",
    color: "var(--text-secondary)",
  },
  form: {
    display: "flex",
    flexDirection: "column",
  },
  inputWrapper: {
    position: "relative",
    display: "flex",
    alignItems: "center",
  },
  inputIcon: {
    position: "absolute",
    left: "14px",
    color: "var(--text-muted)",
    pointerEvents: "none",
  },
  inputWithIcon: {
    paddingLeft: "42px",
  },
  submitBtn: {
    marginTop: "8px",
    height: "48px",
  },
  errorContainer: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    backgroundColor: "var(--color-danger-bg)",
    border: "1px solid rgba(239, 68, 68, 0.2)",
    borderRadius: "var(--radius-sm)",
    padding: "12px 16px",
    marginBottom: "20px",
    animation: "fadeIn 0.2s ease-out",
  },
  errorText: {
    color: "#f87171",
    fontSize: "0.85rem",
    fontWeight: 500,
  },
  successContainer: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    backgroundColor: "var(--color-success-bg)",
    border: "1px solid rgba(16, 185, 129, 0.2)",
    borderRadius: "var(--radius-sm)",
    padding: "12px 16px",
    marginBottom: "20px",
    animation: "fadeIn 0.2s ease-out",
  },
  successText: {
    color: "#34d399",
    fontSize: "0.85rem",
    fontWeight: 500,
  },
  footer: {
    textAlign: "center",
    marginTop: "32px",
    fontSize: "0.75rem",
    color: "var(--text-muted)",
    letterSpacing: "0.02em",
  },
  spinner: {
    display: "inline-block",
    width: "20px",
    height: "20px",
    border: "2px solid rgba(255, 255, 255, 0.3)",
    borderTopColor: "#ffffff",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
  },
};
