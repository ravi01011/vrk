"use client";

import React, { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { LayoutDashboard, CalendarPlus, Users, BadgeIndianRupee, LogOut, Menu, X, ShieldAlert, Bed } from "lucide-react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [adminUser, setAdminUser] = useState("");

  // 1. Session verification check
  useEffect(() => {
    const verifyAuth = async () => {
      try {
        const res = await fetch("/api/auth/check");
        if (res.ok) {
          const data = await res.json();
          setAuthenticated(true);
          setAdminUser(data.username || "Admin");
        } else {
          setAuthenticated(false);
          router.replace("/login");
        }
      } catch (err) {
        setAuthenticated(false);
        router.replace("/login");
      }
    };
    
    verifyAuth();
  }, [router]);

  const handleLogout = async () => {
    try {
      const res = await fetch("/api/auth/logout", { method: "POST" });
      if (res.ok) {
        router.replace("/login");
      }
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "New Booking", href: "/dashboard/new-booking", icon: CalendarPlus },
    { name: "Manage Bookings", href: "/dashboard/bookings", icon: Users },
    { name: "Room Rates", href: "/dashboard/room-rates", icon: Bed },
    { name: "Revenue Reports", href: "/dashboard/revenue", icon: BadgeIndianRupee },
  ];

  if (authenticated === null) {
    return (
      <div style={styles.loadingContainer}>
        <div className="pulse-glow-effect" style={styles.spinner}></div>
        <span style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>VERIFYING CREDENTIALS...</span>
      </div>
    );
  }

  if (authenticated === false) {
    return (
      <div style={styles.loadingContainer}>
        <ShieldAlert size={48} color="var(--color-danger)" style={{ marginBottom: "12px" }} />
        <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>Access Denied</span>
        <span style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>Redirecting to login...</span>
      </div>
    );
  }

  return (
    <div style={styles.layout}>
      {/* Mobile Header Bar */}
      <header style={styles.mobileHeader}>
        <span style={styles.mobileLogo}>VRK GRAND Admin</span>
        <button
          id="mobile-menu-toggle"
          style={styles.hamburgerBtn}
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle Navigation Menu"
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </header>

      {/* Sidebar Navigation */}
      <aside
        className={`glass-panel ${mobileMenuOpen ? "open" : ""}`}
        style={{
          ...styles.sidebar,
          transform: mobileMenuOpen ? "translateX(0)" : undefined,
        }}
      >
        <div style={styles.logoContainer}>
          <span style={styles.logoBadge}>VRK GRAND</span>
          <span style={styles.logoSubtitle}>Hotel Console</span>
        </div>

        <nav style={styles.nav}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                id={`nav-${item.name.toLowerCase().replace(" ", "-")}`}
                style={{
                  ...styles.navItem,
                  ...(isActive ? styles.navItemActive : {}),
                }}
                onClick={() => setMobileMenuOpen(false)}
              >
                <Icon size={20} color={isActive ? "var(--accent-gold)" : "var(--text-secondary)"} />
                <span>{item.name}</span>
                {isActive && <div style={styles.activeDot} />}
              </Link>
            );
          })}
        </nav>

        <div style={styles.sidebarFooter}>
          <div style={styles.adminProfile}>
            <div style={styles.avatar}>{adminUser.charAt(0).toUpperCase()}</div>
            <div style={styles.adminMeta}>
              <span style={styles.adminName}>{adminUser}</span>
              <span style={styles.adminRole}>System Administrator</span>
            </div>
          </div>
          <button id="logout-btn" onClick={handleLogout} style={styles.logoutBtn}>
            <LogOut size={18} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main style={styles.mainContent}>
        <div style={styles.contentWrapper}>
          {children}
        </div>
      </main>

      {/* CSS injection for mobile transition layout */}
      <style jsx global>{`
        @media (max-width: 991px) {
          aside {
            transform: translateX(-100%);
            transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          }
          aside.open {
            transform: translateX(0) !important;
          }
        }
      `}</style>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  layout: {
    display: "flex",
    minHeight: "100vh",
    backgroundColor: "var(--bg-primary)",
    color: "var(--text-primary)",
  },
  loadingContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "100vh",
    gap: "16px",
    backgroundColor: "var(--bg-primary)",
  },
  spinner: {
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    border: "3px solid var(--accent-indigo)",
    borderTopColor: "transparent",
    animation: "spin 1s linear infinite",
  },
  mobileHeader: {
    display: "none",
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    height: "60px",
    backgroundColor: "var(--bg-secondary)",
    borderBottom: "1px solid var(--border-color)",
    padding: "0 20px",
    zIndex: 999,
    alignItems: "center",
    justifyContent: "space-between",
  },
  mobileLogo: {
    fontWeight: 700,
    fontSize: "1rem",
    letterSpacing: "-0.01em",
  },
  hamburgerBtn: {
    background: "none",
    border: "none",
    color: "var(--text-primary)",
    cursor: "pointer",
    padding: "6px",
    display: "flex",
    alignItems: "center",
  },
  sidebar: {
    width: "280px",
    height: "100vh",
    position: "fixed",
    top: 0,
    left: 0,
    display: "flex",
    flexDirection: "column",
    zIndex: 100,
    borderRadius: "0",
    borderRight: "1px solid var(--border-color)",
    borderTop: "none",
    borderBottom: "none",
    borderLeft: "none",
    padding: "30px 20px 20px 20px",
  },
  logoContainer: {
    display: "flex",
    flexDirection: "column",
    marginBottom: "40px",
    paddingLeft: "10px",
  },
  logoBadge: {
    fontSize: "1.2rem",
    fontWeight: 800,
    color: "var(--text-primary)",
    letterSpacing: "-0.02em",
  },
  logoSubtitle: {
    fontSize: "0.75rem",
    fontWeight: 600,
    color: "var(--accent-gold)",
    textTransform: "uppercase",
    letterSpacing: "0.15em",
    marginTop: "2px",
  },
  nav: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    flexGrow: 1,
  },
  navItem: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
    padding: "14px 16px",
    color: "var(--text-secondary)",
    textDecoration: "none",
    fontSize: "0.95rem",
    fontWeight: 500,
    borderRadius: "var(--radius-sm)",
    position: "relative",
    transition: "all 0.2s ease",
  },
  navItemActive: {
    backgroundColor: "rgba(99, 102, 241, 0.08)",
    color: "var(--text-primary)",
    fontWeight: 600,
    border: "1px solid rgba(99, 102, 241, 0.15)",
  },
  activeDot: {
    position: "absolute",
    right: "16px",
    width: "6px",
    height: "6px",
    borderRadius: "50%",
    backgroundColor: "var(--accent-gold)",
    boxShadow: "0 0 10px var(--accent-gold)",
  },
  sidebarFooter: {
    borderTop: "1px solid var(--border-color)",
    paddingTop: "20px",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  adminProfile: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "4px 8px",
  },
  avatar: {
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    backgroundColor: "var(--accent-indigo)",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 700,
    fontSize: "1.1rem",
    boxShadow: "0 4px 10px rgba(99, 102, 241, 0.2)",
  },
  adminMeta: {
    display: "flex",
    flexDirection: "column",
  },
  adminName: {
    fontSize: "0.9rem",
    fontWeight: 600,
    color: "var(--text-primary)",
  },
  adminRole: {
    fontSize: "0.75rem",
    color: "var(--text-muted)",
  },
  logoutBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    padding: "12px",
    backgroundColor: "rgba(239, 68, 68, 0.08)",
    border: "1px solid rgba(239, 68, 68, 0.15)",
    color: "#ef4444",
    borderRadius: "var(--radius-sm)",
    cursor: "pointer",
    fontWeight: 600,
    fontSize: "0.9rem",
    transition: "all 0.2s ease",
  },
  mainContent: {
    flexGrow: 1,
    marginLeft: "280px",
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
  },
  contentWrapper: {
    flexGrow: 1,
    padding: "40px",
    maxWidth: "1400px",
    width: "100%",
    margin: "0 auto",
  },
};
// Add responsive query styles injection in JSX
if (typeof window !== "undefined") {
  const styleTag = document.createElement("style");
  styleTag.innerHTML = `
    @media (max-width: 991px) {
      body {
        padding-top: 60px;
      }
      #mobile-header {
        display: flex !important;
      }
      #main-content {
        margin-left: 0 !important;
        padding: 24px !important;
      }
      #content-wrapper {
        padding: 0 !important;
      }
    }
  `;
  document.head.appendChild(styleTag);
}
