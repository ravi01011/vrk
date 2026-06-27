"use client";

import React, { useState, useEffect } from "react";
import { BadgeIndianRupee, TrendingUp, Landmark, ShieldCheck, BarChart3, AlertCircle } from "lucide-react";

interface MonthlyReport {
  monthKey: string;     // "YYYY-MM"
  monthName: string;    // "Jun 2026"
  bookingCount: number;
  bookingsValue: number;
  advancesReceived: number;
  balancesPending: number;
  paymentsCollected: number; // Actual cash flow in this month
}

interface FinancialTotals {
  totalBookings: number;
  totalValue: number;
  totalCollected: number;
  totalPending: number;
}

export default function RevenuePage() {
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<MonthlyReport[]>([]);
  const [totals, setTotals] = useState<FinancialTotals>({
    totalBookings: 0,
    totalValue: 0,
    totalCollected: 0,
    totalPending: 0,
  });

  const fetchRevenueData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/bookings/revenue");
      const data = await res.json();
      if (res.ok && data.success) {
        setReports(data.report);
        setTotals(data.totals);
      }
      setLoading(false);
    } catch (error) {
      console.error("Error fetching revenue report:", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRevenueData();
  }, []);

  return (
    <div className="animate-fade-in" style={styles.container}>
      <header style={styles.header}>
        <div>
          <h1 style={styles.title}>Financial Analytics & Revenue</h1>
          <p style={styles.subtitle}>Track monthly cash flows, total check-in volumes, and outstanding guest balances.</p>
        </div>
      </header>

      {/* Financial Summary Cards */}
      <section style={styles.summaryGrid}>
        <div className="glass-panel" style={styles.summaryCard}>
          <div style={styles.iconWrapperGold}>
            <TrendingUp size={22} color="var(--accent-gold)" />
          </div>
          <div style={styles.summaryMeta}>
            <span style={styles.summaryLabel}>Total Billing Value</span>
            <span style={styles.summaryValue}>
              {loading ? "..." : `₹${totals.totalValue.toLocaleString("en-IN")}`}
            </span>
            <span style={styles.summarySubText}>From {totals.totalBookings} guest check-ins</span>
          </div>
        </div>

        <div className="glass-panel" style={styles.summaryCard}>
          <div style={styles.iconWrapperGreen}>
            <Landmark size={22} color="var(--color-success)" />
          </div>
          <div style={styles.summaryMeta}>
            <span style={styles.summaryLabel}>Cash Collected (Revenue)</span>
            <span style={{ ...styles.summaryValue, color: "var(--color-success)" }}>
              {loading ? "..." : `₹${totals.totalCollected.toLocaleString("en-IN")}`}
            </span>
            <span style={styles.summarySubText}>
              {loading ? "..." : `${Math.round((totals.totalCollected / (totals.totalValue || 1)) * 100)}% of total billings`}
            </span>
          </div>
        </div>

        <div className="glass-panel" style={styles.summaryCard}>
          <div style={styles.iconWrapperWarning}>
            <AlertCircle size={22} color="var(--color-warning)" />
          </div>
          <div style={styles.summaryMeta}>
            <span style={styles.summaryLabel}>Outstanding Dues</span>
            <span style={{ ...styles.summaryValue, color: "var(--color-warning)" }}>
              {loading ? "..." : `₹${totals.totalPending.toLocaleString("en-IN")}`}
            </span>
            <span style={styles.summarySubText}>
              {loading ? "..." : `${Math.round((totals.totalPending / (totals.totalValue || 1)) * 100)}% pending collection`}
            </span>
          </div>
        </div>
      </section>

      {/* Monthly reports ledger table */}
      <section className="glass-panel" style={styles.ledgerSection}>
        <div style={styles.ledgerHeader}>
          <BarChart3 size={20} color="var(--accent-indigo)" />
          <h2 style={styles.ledgerTitle}>Month-by-Month Analytics</h2>
        </div>

        {loading ? (
          <div style={styles.loaderArea}>
            <div className="pulse-glow-effect" style={styles.spinner}></div>
            <span>Compiling revenue spreadsheets...</span>
          </div>
        ) : reports.length === 0 ? (
          <div style={styles.emptyArea}>
            <BadgeIndianRupee size={40} color="var(--text-muted)" style={{ marginBottom: "8px" }} />
            <span>No financial activity logged.</span>
          </div>
        ) : (
          <div className="table-container" style={{ border: "none" }}>
            <table className="luxury-table">
              <thead>
                <tr>
                  <th>Month</th>
                  <th>Bookings Count</th>
                  <th>Booking Volume Value</th>
                  <th>Cash Collected Flow</th>
                  <th>Outstanding Dues</th>
                  <th>Collection Efficiency</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((report) => {
                  const collectionRate = report.bookingsValue > 0
                    ? Math.round(((report.bookingsValue - report.balancesPending) / report.bookingsValue) * 100)
                    : 100;

                  return (
                    <tr key={report.monthKey} style={{ cursor: "default" }}>
                      <td style={{ fontWeight: 700, fontSize: "0.95rem" }}>{report.monthName}</td>
                      <td style={{ fontWeight: 600 }}>{report.bookingCount} bookings</td>
                      <td>₹{report.bookingsValue.toLocaleString("en-IN")}</td>
                      <td style={{ color: "var(--color-success)", fontWeight: 600 }}>
                        ₹{report.paymentsCollected.toLocaleString("en-IN")}
                      </td>
                      <td style={{ color: report.balancesPending > 0 ? "var(--color-warning)" : "var(--color-success)", fontWeight: 600 }}>
                        ₹{report.balancesPending.toLocaleString("en-IN")}
                      </td>
                      <td>
                        <div style={styles.efficiencyContainer}>
                          <div style={styles.progressTrack}>
                            <div
                              style={{
                                ...styles.progressFill,
                                width: `${collectionRate}%`,
                                backgroundColor: collectionRate > 80
                                  ? "var(--color-success)"
                                  : collectionRate > 50
                                    ? "var(--color-warning)"
                                    : "var(--color-danger)"
                              }}
                            />
                          </div>
                          <span style={{ fontSize: "0.8rem", fontWeight: 700, width: "36px", textAlign: "right" }}>
                            {collectionRate}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <footer style={styles.footer}>
        <ShieldCheck size={14} color="var(--color-success)" />
        <span>Financial summary reconciled against MongoDB-backed booking and payment records.</span>
      </footer>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: "flex",
    flexDirection: "column",
  },
  header: {
    marginBottom: "32px",
  },
  title: {
    fontSize: "1.8rem",
    fontWeight: 800,
    letterSpacing: "-0.03em",
    color: "var(--text-primary)",
    marginBottom: "4px",
  },
  subtitle: {
    fontSize: "0.95rem",
    color: "var(--text-secondary)",
  },
  summaryGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "24px",
    marginBottom: "36px",
  },
  summaryCard: {
    padding: "24px",
    display: "flex",
    alignItems: "center",
    gap: "20px",
  },
  iconWrapperGold: {
    width: "48px",
    height: "48px",
    borderRadius: "var(--radius-sm)",
    backgroundColor: "rgba(212, 175, 55, 0.1)",
    border: "1px solid rgba(212, 175, 55, 0.2)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  iconWrapperGreen: {
    width: "48px",
    height: "48px",
    borderRadius: "var(--radius-sm)",
    backgroundColor: "var(--color-success-bg)",
    border: "1px solid rgba(16, 185, 129, 0.2)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  iconWrapperWarning: {
    width: "48px",
    height: "48px",
    borderRadius: "var(--radius-sm)",
    backgroundColor: "var(--color-warning-bg)",
    border: "1px solid rgba(245, 158, 11, 0.2)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  summaryMeta: {
    display: "flex",
    flexDirection: "column",
  },
  summaryLabel: {
    fontSize: "0.75rem",
    fontWeight: 600,
    color: "var(--text-muted)",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
  summaryValue: {
    fontSize: "1.5rem",
    fontWeight: 800,
    color: "var(--text-primary)",
    margin: "2px 0",
  },
  summarySubText: {
    fontSize: "0.75rem",
    color: "var(--text-muted)",
  },
  ledgerSection: {
    padding: "30px",
    borderRadius: "var(--radius-md)",
    marginBottom: "30px",
  },
  ledgerHeader: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginBottom: "24px",
  },
  ledgerTitle: {
    fontSize: "1.2rem",
    fontWeight: 700,
    color: "var(--text-primary)",
  },
  loaderArea: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "60px 0",
    gap: "12px",
    color: "var(--text-secondary)",
  },
  spinner: {
    width: "28px",
    height: "28px",
    borderRadius: "50%",
    border: "2px solid var(--accent-indigo)",
    borderTopColor: "transparent",
    animation: "spin 1s linear infinite",
  },
  emptyArea: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "40px",
    color: "var(--text-secondary)",
  },
  efficiencyContainer: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  progressTrack: {
    flexGrow: 1,
    height: "8px",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: "4px",
    overflow: "hidden",
    minWidth: "80px",
  },
  progressFill: {
    height: "100%",
    borderRadius: "4px",
    transition: "width 0.4s ease-out",
  },
  footer: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    justifyContent: "center",
    fontSize: "0.75rem",
    color: "var(--text-muted)",
    marginTop: "10px",
  },
};
