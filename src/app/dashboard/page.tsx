"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Users, Bed, Coins, AlertCircle, Calendar, ArrowRight, ClipboardList } from "lucide-react";
import { Room } from "@/config/rooms";

interface DashboardStats {
  todayArrivals: number;
  occupiedRoomsCount: number;
  monthlyRevenue: number;
  pendingBalance: number;
}

interface MiniBooking {
  bookingId: string;
  guestName: string;
  mobile: string;
  roomNo: string;
  checkIn: string;
  checkOut: string;
  advance: number;
  total: number;
  balance: number;
  status: string;
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    todayArrivals: 0,
    occupiedRoomsCount: 0,
    monthlyRevenue: 0,
    pendingBalance: 0,
  });

  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split("T")[0];
  const consoleDateLabel = today.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  // Date-wise booking viewer date
  const [viewDate, setViewDate] = useState(todayStr);
  const [dateBookings, setDateBookings] = useState<MiniBooking[]>([]);
  const [dateLoading, setDateLoading] = useState(false);

  // Room checker date range (Default to today and tomorrow)
  const [checkIn, setCheckIn] = useState(todayStr);
  const [checkOut, setCheckOut] = useState(tomorrowStr);
  const [roomsList, setRoomsList] = useState<(Room & { available: boolean })[]>([]);
  const [roomsLoading, setRoomsLoading] = useState(false);

  const fetchStatsAndData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/bookings");
      const data = await res.json();

      const revRes = await fetch("/api/bookings/revenue");
      const revData = await revRes.json();

      if (res.ok && data.success) {
        const bookings: MiniBooking[] = data.bookings;

        // Calculate Stats
        const todayArrivals = bookings.filter((b) => b.checkIn === todayStr).length;

        const occupiedRoomsCount = bookings.filter((b) => {
          const checkInDate = new Date(b.checkIn);
          const checkOutDate = new Date(b.checkOut);
          const todayDate = new Date(todayStr);
          checkInDate.setHours(0, 0, 0, 0);
          checkOutDate.setHours(0, 0, 0, 0);
          todayDate.setHours(0, 0, 0, 0);
          return todayDate >= checkInDate && todayDate < checkOutDate;
        }).length;

        const pendingBalance = bookings.reduce((sum, b) => sum + b.balance, 0);

        let monthlyRevenue = 0;
        if (revRes.ok && revData.success) {
          const currentMonth = todayStr.slice(0, 7);
          const currentMonthReport = revData.report.find((r: { monthKey: string; paymentsCollected: number }) => r.monthKey === currentMonth);
          monthlyRevenue = currentMonthReport ? currentMonthReport.paymentsCollected : 0;
        }

        setStats({
          todayArrivals,
          occupiedRoomsCount,
          monthlyRevenue,
          pendingBalance,
        });
      }
      setLoading(false);
    } catch (error) {
      console.error("Dashboard stats load error:", error);
      setLoading(false);
    }
  };

  const fetchDateBookings = async (date: string) => {
    try {
      setDateLoading(true);
      const res = await fetch(`/api/bookings?date=${date}`);
      const data = await res.json();
      if (res.ok && data.success) {
        setDateBookings(data.bookings);
      }
      setDateLoading(false);
    } catch (error) {
      console.error("Error fetching date bookings:", error);
      setDateLoading(false);
    }
  };

  const fetchRoomsAvailability = async (cIn: string, cOut: string) => {
    if (!cIn || !cOut || cIn >= cOut) return;
    try {
      setRoomsLoading(true);
      const res = await fetch(`/api/bookings/rooms?checkIn=${cIn}&checkOut=${cOut}`);
      const data = await res.json();
      if (res.ok && data.success) {
        setRoomsList(data.rooms);
      }
      setRoomsLoading(false);
    } catch (error) {
      console.error("Error checking room availability:", error);
      setRoomsLoading(false);
    }
  };

  // Fetch Dashboard Stats and Initial Room Availability
  useEffect(() => {
    fetchStatsAndData();
    fetchRoomsAvailability(checkIn, checkOut);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch date bookings when viewDate changes
  useEffect(() => {
    fetchDateBookings(viewDate);
  }, [viewDate]);

  const handleRoomCheckSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchRoomsAvailability(checkIn, checkOut);
  };

  // Group rooms list by building
  const roomsByBuilding = roomsList.reduce((acc, room) => {
    const b = room.building || (["101", "102", "103", "104", "105"].includes(room.roomNumber) ? "Building A" : "Building B");
    if (!acc[b]) acc[b] = [];
    acc[b].push(room);
    return acc;
  }, {} as Record<string, typeof roomsList>);

  const sortedBuildingKeys = Object.keys(roomsByBuilding).sort();

  return (
    <div className="animate-fade-in" style={styles.container}>
      <header style={styles.header}>
        <div>
          <h1 style={styles.title}>Welcome back, Admin</h1>
          <p style={styles.subtitle}>Here is what is happening at Siri Beach Resort & Spa today.</p>
        </div>
        <div style={styles.dateBadge}>
          <Calendar size={16} color="var(--accent-gold)" />
          <span>Console Date: {consoleDateLabel}</span>
        </div>
      </header>

      {/* Stats Grid */}
      <section style={styles.statsGrid}>
        <div className="glass-panel" style={styles.statCard}>
          <div style={styles.statHeader}>
            <span style={styles.statLabel}>Today&apos;s Arrivals</span>
            <Users size={20} color="var(--accent-indigo)" />
          </div>
          <span style={styles.statValue}>{loading ? "..." : stats.todayArrivals}</span>
          <span style={styles.statSubText}>Scheduled check-ins today</span>
        </div>

        <div className="glass-panel" style={styles.statCard}>
          <div style={styles.statHeader}>
            <span style={styles.statLabel}>Occupied Rooms</span>
            <Bed size={20} color="var(--accent-gold)" />
          </div>
          <span style={styles.statValue}>{loading ? "..." : stats.occupiedRoomsCount}</span>
          <span style={styles.statSubText}>Rooms currently checked-in</span>
        </div>

        <div className="glass-panel" style={styles.statCard}>
          <div style={styles.statHeader}>
            <span style={styles.statLabel}>{`${today.toLocaleString("en-US", { month: "long" })} Revenue`}</span>
            <Coins size={20} color="var(--color-success)" />
          </div>
          <span style={{ ...styles.statValue, color: "var(--color-success)" }}>
            {loading ? "..." : `₹${stats.monthlyRevenue.toLocaleString("en-IN")}`}
          </span>
          <span style={styles.statSubText}>Cash collected this month</span>
        </div>

        <div className="glass-panel" style={styles.statCard}>
          <div style={styles.statHeader}>
            <span style={styles.statLabel}>Outstanding Balance</span>
            <AlertCircle size={20} color="var(--color-warning)" />
          </div>
          <span style={{ ...styles.statValue, color: "var(--color-warning)" }}>
            {loading ? "..." : `₹${stats.pendingBalance.toLocaleString("en-IN")}`}
          </span>
          <span style={styles.statSubText}>Pending guest settlements</span>
        </div>
      </section>

      {/* Main Sections: Left is Date-wise View, Right is Room Availability */}
      <div style={styles.splitContent}>

        {/* Date-wise Bookings Viewer */}
        <section className="glass-panel" style={styles.panelLeft}>
          <div style={styles.panelHeader}>
            <div>
              <h2 style={styles.panelTitle}>Date-wise Bookings</h2>
              <p style={styles.panelSubtitle}>View guest stays and reservations for any selected date.</p>
            </div>
            <div style={styles.filterWrapper}>
              <input
                type="date"
                className="form-input"
                style={styles.dateInputInline}
                value={viewDate}
                onChange={(e) => setViewDate(e.target.value)}
              />
            </div>
          </div>

          {dateLoading ? (
            <div style={styles.loaderArea}>
              <div className="pulse-glow-effect" style={styles.spinnerMini}></div>
              <span>Fetching bookings for {viewDate}...</span>
            </div>
          ) : dateBookings.length === 0 ? (
            <div style={styles.emptyArea}>
              <ClipboardList size={36} color="var(--text-muted)" style={{ marginBottom: "8px" }} />
              <span style={{ fontWeight: 600 }}>No Bookings Found</span>
              <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                There are no arrivals or stay-overs recorded for {viewDate}.
              </span>
              <Link href="/dashboard/new-booking" className="btn btn-secondary" style={{ marginTop: "16px", fontSize: "0.85rem", padding: "8px 16px" }}>
                Add New Booking
              </Link>
            </div>
          ) : (
            <div className="table-container" style={{ border: "none" }}>
              <table className="luxury-table">
                <thead>
                  <tr>
                    <th>Guest Name</th>
                    <th>Room</th>
                    <th>Check In</th>
                    <th>Check Out</th>
                    <th>Status</th>
                    <th>Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {dateBookings.map((b) => (
                    <tr key={b.bookingId} onClick={() => window.location.href = `/dashboard/bookings?search=${b.guestName}`}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{b.guestName}</div>
                        <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{b.mobile}</div>
                      </td>
                      <td style={{ fontWeight: 700, color: "var(--accent-gold)" }}>{b.roomNo}</td>
                      <td>{b.checkIn}</td>
                      <td>{b.checkOut}</td>
                      <td>
                        <span className={`badge badge-${b.status.toLowerCase()}`}>
                          {b.status}
                        </span>
                      </td>
                      <td style={{ color: b.balance > 0 ? "var(--color-warning)" : "var(--color-success)", fontWeight: 600 }}>
                        {b.balance > 0 ? `₹${b.balance}` : "Settled"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Room Availability Checker */}
        <section className="glass-panel" style={styles.panelRight}>
          <h2 style={styles.panelTitle}>Room Availability Grid</h2>
          <p style={styles.panelSubtitle}>Input dates to search vacant rooms and begin allocations.</p>

          <form onSubmit={handleRoomCheckSubmit} style={styles.roomForm}>
            <div style={styles.formRowInline}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Check In</label>
                <input
                  type="date"
                  className="form-input"
                  value={checkIn}
                  onChange={(e) => setCheckIn(e.target.value)}
                  required
                />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Check Out</label>
                <input
                  type="date"
                  className="form-input"
                  value={checkOut}
                  onChange={(e) => setCheckOut(e.target.value)}
                  required
                />
              </div>
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: "100%", height: "42px" }} disabled={roomsLoading}>
              {roomsLoading ? "Verifying..." : "Verify Availability"}
            </button>
          </form>

          {roomsLoading ? (
            <div style={styles.loaderArea}>
              <div className="pulse-glow-effect" style={styles.spinnerMini}></div>
              <span>Scanning room allocation sheets...</span>
            </div>
          ) : (
            <div style={styles.roomsGridContainer}>
              {sortedBuildingKeys.map((buildingName) => (
                <div key={buildingName} style={styles.buildingSection}>
                  <h3 style={styles.buildingHeader}>{buildingName}</h3>
                  <div style={styles.roomsGrid}>
                    {roomsByBuilding[buildingName].map((room) => (
                      <div
                        key={room.roomNumber}
                        style={{
                          ...styles.roomTile,
                          borderColor: room.available ? "rgba(16, 185, 129, 0.2)" : "rgba(239, 68, 68, 0.2)",
                          backgroundColor: room.available ? "rgba(16, 185, 129, 0.04)" : "rgba(239, 68, 68, 0.04)",
                        }}
                      >
                        <span style={{
                          ...styles.roomNumber,
                          color: room.available ? "var(--color-success)" : "var(--color-danger)",
                        }}>{room.roomNumber}</span>
                        <span style={styles.roomType}>{room.type}</span>
                        <span style={styles.roomPrice}>₹{room.pricePerNight}/night</span>
                        <div style={styles.roomStatusRow}>
                          <div style={{
                            ...styles.statusDot,
                            backgroundColor: room.available ? "var(--color-success)" : "var(--color-danger)",
                            boxShadow: room.available ? "0 0 8px var(--color-success)" : "0 0 8px var(--color-danger)",
                          }} />
                          <span style={{
                            fontSize: "0.75rem",
                            fontWeight: 600,
                            color: room.available ? "var(--color-success)" : "var(--color-danger)",
                          }}>{room.available ? "Vacant" : "Booked"}</span>
                        </div>
                        {room.available && (
                          <Link
                            href={`/dashboard/new-booking?room=${room.roomNumber}&checkIn=${checkIn}&checkOut=${checkOut}`}
                            style={styles.bookQuickBtn}
                            title="Quick Book"
                          >
                            <span>Book Room</span>
                            <ArrowRight size={14} />
                          </Link>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: "flex",
    flexDirection: "column",
  },
  buildingSection: {
    marginBottom: "24px",
  },
  buildingHeader: {
    fontSize: "0.95rem",
    fontWeight: 700,
    color: "var(--accent-gold)",
    marginBottom: "12px",
    paddingBottom: "6px",
    borderBottom: "1px solid rgba(212, 175, 55, 0.15)",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "32px",
    flexWrap: "wrap",
    gap: "16px",
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
  dateBadge: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    backgroundColor: "var(--bg-secondary)",
    border: "1px solid var(--border-color)",
    padding: "10px 16px",
    borderRadius: "var(--radius-sm)",
    fontSize: "0.85rem",
    fontWeight: 600,
    color: "var(--text-secondary)",
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: "20px",
    marginBottom: "36px",
  },
  statCard: {
    padding: "24px",
    borderRadius: "var(--radius-md)",
    display: "flex",
    flexDirection: "column",
  },
  statHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "12px",
  },
  statLabel: {
    fontSize: "0.85rem",
    fontWeight: 600,
    color: "var(--text-secondary)",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
  statValue: {
    fontSize: "2rem",
    fontWeight: 800,
    letterSpacing: "-0.01em",
    color: "var(--text-primary)",
    marginBottom: "4px",
  },
  statSubText: {
    fontSize: "0.75rem",
    color: "var(--text-muted)",
  },
  splitContent: {
    display: "grid",
    gridTemplateColumns: "1.4fr 1fr",
    gap: "30px",
    alignItems: "start",
  },
  panelLeft: {
    padding: "30px",
    borderRadius: "var(--radius-md)",
  },
  panelRight: {
    padding: "30px",
    borderRadius: "var(--radius-md)",
  },
  panelHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "24px",
    flexWrap: "wrap",
    gap: "12px",
  },
  panelTitle: {
    fontSize: "1.25rem",
    fontWeight: 700,
    color: "var(--text-primary)",
    marginBottom: "4px",
  },
  panelSubtitle: {
    fontSize: "0.85rem",
    color: "var(--text-secondary)",
    marginBottom: "16px",
  },
  filterWrapper: {
    display: "flex",
    alignItems: "center",
  },
  dateInputInline: {
    width: "160px",
    padding: "8px 12px",
    fontSize: "0.85rem",
  },
  loaderArea: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "60px 0",
    gap: "12px",
    color: "var(--text-secondary)",
    fontSize: "0.85rem",
  },
  spinnerMini: {
    width: "24px",
    height: "24px",
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
    padding: "60px 20px",
    color: "var(--text-secondary)",
    textAlign: "center",
  },
  roomForm: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    marginBottom: "24px",
    borderBottom: "1px solid var(--border-color)",
    paddingBottom: "24px",
  },
  formRowInline: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "12px",
  },
  roomsGridContainer: {
    maxHeight: "440px",
    overflowY: "auto",
    paddingRight: "6px",
  },
  roomsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))",
    gap: "12px",
  },
  roomTile: {
    border: "1px solid var(--border-color)",
    borderRadius: "var(--radius-sm)",
    padding: "12px",
    display: "flex",
    flexDirection: "column",
    position: "relative",
  },
  roomNumber: {
    fontSize: "1.2rem",
    fontWeight: 800,
    marginBottom: "2px",
  },
  roomType: {
    fontSize: "0.75rem",
    color: "var(--text-secondary)",
    fontWeight: 500,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    marginBottom: "2px",
  },
  roomPrice: {
    fontSize: "0.7rem",
    color: "var(--text-muted)",
    fontWeight: 600,
    marginBottom: "8px",
  },
  roomStatusRow: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    marginBottom: "10px",
  },
  statusDot: {
    width: "6px",
    height: "6px",
    borderRadius: "50%",
  },
  bookQuickBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "4px",
    padding: "6px 8px",
    backgroundColor: "rgba(99, 102, 241, 0.08)",
    border: "1px solid rgba(99, 102, 241, 0.15)",
    color: "var(--text-primary)",
    textDecoration: "none",
    fontSize: "0.7rem",
    fontWeight: 600,
    borderRadius: "4px",
    textAlign: "center",
    transition: "all 0.2s ease",
  },
};
