"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const verifySession = async () => {
      try {
        const response = await fetch("/api/auth/check");
        if (response.ok) {
          router.replace("/dashboard");
        } else {
          router.replace("/login");
        }
      } catch (error) {
        console.error("Session verification failed:", error);
        router.replace("/login");
      }
    };
    verifySession();
  }, [router]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        gap: "16px",
        backgroundColor: "var(--bg-primary)",
      }}
    >
      <div
        className="pulse-glow-effect"
        style={{
          width: "50px",
          height: "50px",
          borderRadius: "50%",
          border: "3px solid var(--accent-indigo)",
          borderTopColor: "transparent",
          animation: "spin 1s linear infinite",
        }}
      />
      <span style={{ color: "var(--text-secondary)", fontSize: "0.95rem", letterSpacing: "0.05em" }}>
        INITIALIZING SECURITY SECURE SESSION...
      </span>

      <style jsx global>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
