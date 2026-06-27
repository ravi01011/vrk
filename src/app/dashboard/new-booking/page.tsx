"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronRight, UserPlus, Info, Check, Image as ImageIcon } from "lucide-react";
import { Room } from "@/config/rooms";

export default function NewBookingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const today = new Date();
  const defaultCheckIn = today.toISOString().split("T")[0];
  const defaultCheckInTime = today.toLocaleTimeString("en-GB", { hour12: false, hour: "2-digit", minute: "2-digit" });
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const defaultCheckOut = tomorrow.toISOString().split("T")[0];

  // Initial values from search parameters if redirected from dashboard grid
  const initialRoom = searchParams.get("room") || "";
  const initialCheckIn = searchParams.get("checkIn") || defaultCheckIn;
  const initialCheckInTime = searchParams.get("checkInTime") || defaultCheckInTime;
  const initialCheckOut = searchParams.get("checkOut") || defaultCheckOut;

  // Form States
  const [guestName, setGuestName] = useState("");
  const [mobile, setMobile] = useState("");
  const [address, setAddress] = useState("");
  const [aadhaarNo, setAadhaarNo] = useState("");
  const [roomNo, setRoomNo] = useState(initialRoom);
  const [checkIn, setCheckIn] = useState(initialCheckIn);
  const [checkInTime, setCheckInTime] = useState(initialCheckInTime);
  const [checkOut, setCheckOut] = useState(initialCheckOut);
  const [checkOutTime, setCheckOutTime] = useState("11:00");
  const [numGuests, setNumGuests] = useState(1);
  const [advance, setAdvance] = useState("");
  const [total, setTotal] = useState("");
  const [remarks, setRemarks] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Cash");



  // Status and Helpers
  const [availableRooms, setAvailableRooms] = useState<Room[]>([]);
  const [roomsLoading, setRoomsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  // Calculate balance dynamically
  const totalVal = Number(total) || 0;
  const advanceVal = Number(advance) || 0;
  const balance = Math.max(0, totalVal - advanceVal);

  // Fetch available rooms on dates changes
  useEffect(() => {
    const fetchAvailable = async () => {
      if (!checkIn || !checkOut || checkIn >= checkOut) return;
      try {
        setRoomsLoading(true);
        const res = await fetch(`/api/bookings/rooms?checkIn=${checkIn}&checkOut=${checkOut}`);
        const data = await res.json();
        if (res.ok && data.success) {
          // Filter to show only vacant rooms
          const vacant = data.rooms.filter((r: any) => r.available);
          setAvailableRooms(vacant);

          // Re-evaluate current selected room
          if (initialRoom && initialRoom === roomNo) {
            // Keep selected if redirecting
          } else {
            // Clear if previously selected room is now booked in this range
            const isStillAvailable = vacant.some((r: any) => r.roomNumber === roomNo);
            if (!isStillAvailable) setRoomNo("");
          }
        }
        setRoomsLoading(false);
      } catch (error) {
        console.error("Failed to load rooms:", error);
        setRoomsLoading(false);
      }
    };
    fetchAvailable();
  }, [checkIn, checkOut]);

  // Autofill room cost on room selection change
  useEffect(() => {
    if (roomNo && checkIn && checkOut) {
      const selected = availableRooms.find((r) => r.roomNumber === roomNo);
      if (selected) {
        const date1 = new Date(checkIn);
        const date2 = new Date(checkOut);
        const nights = Math.max(1, Math.round((date2.getTime() - date1.getTime()) / (1000 * 3600 * 24)));
        setTotal(String(selected.pricePerNight * nights));
      }
    }
  }, [roomNo, checkIn, checkOut, availableRooms]);



  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage({ type: "", text: "" });

    // Client-side validations
    if (!/^\d{10}$/.test(mobile)) {
      setMessage({ type: "error", text: "Mobile number must be exactly 10 digits." });
      return;
    }

    if (!/^\d{12}$/.test(aadhaarNo)) {
      setMessage({ type: "error", text: "Aadhaar number must be exactly 12 digits." });
      return;
    }

    if (!roomNo) {
      setMessage({ type: "error", text: "Please select an available room." });
      return;
    }

    try {
      setSubmitting(true);
      const formData = new FormData();
      formData.append("guestName", guestName);
      formData.append("mobile", mobile);
      formData.append("address", address);
      formData.append("aadhaarNo", aadhaarNo);
      formData.append("roomNo", roomNo);
      formData.append("checkIn", checkIn);
      formData.append("checkInTime", checkInTime);
      formData.append("checkOut", checkOut);
      formData.append("checkOutTime", checkOutTime);
      formData.append("numGuests", String(numGuests));
      formData.append("advance", advance || "0");
      formData.append("total", total);
      formData.append("remarks", remarks);
      formData.append("paymentMethod", paymentMethod);



      const response = await fetch("/api/bookings", {
        method: "POST",
        body: formData, // Automatically sets correct multipart header
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setMessage({ type: "success", text: "Booking created successfully!" });
        // Redirect after delay
        setTimeout(() => {
          router.push("/dashboard/bookings");
        }, 1500);
      } else {
        setMessage({ type: "error", text: data.error || "Failed to create booking." });
        setSubmitting(false);
      }
    } catch (error) {
      console.error("Booking error:", error);
      setMessage({ type: "error", text: "Network error occurred. Please try again." });
      setSubmitting(false);
    }
  };

  return (
    <div className="animate-fade-in" style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.title}>New Guest Check-in</h1>
        <p style={styles.subtitle}>Register guest details and allocate rooms securely.</p>
      </header>

      {message.text && (
        <div
          style={{
            ...styles.alert,
            backgroundColor: message.type === "success" ? "var(--color-success-bg)" : "var(--color-danger-bg)",
            borderColor: message.type === "success" ? "rgba(16, 185, 129, 0.2)" : "rgba(239, 68, 68, 0.2)",
          }}
        >
          <Info size={18} color={message.type === "success" ? "var(--color-success)" : "var(--color-danger)"} />
          <span style={{ color: message.type === "success" ? "#34d399" : "#f87171", fontSize: "0.9rem", fontWeight: 500 }}>
            {message.text}
          </span>
        </div>
      )}

      <form onSubmit={handleFormSubmit} style={styles.splitGrid}>

        {/* Left Side: Guest Personal Details */}
        <section className="glass-panel" style={styles.card}>
          <h2 style={styles.sectionTitle}>
            <span style={styles.stepNum}>1</span> Guest Information
          </h2>

          <div className="form-group">
            <label className="form-label" htmlFor="guest-name">Guest Name *</label>
            <input
              id="guest-name"
              type="text"
              className="form-input"
              placeholder="Full Name"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              required
              disabled={submitting}
            />
          </div>

          <div style={styles.formRow}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" htmlFor="mobile">Mobile Number *</label>
              <input
                id="mobile"
                type="tel"
                className="form-input"
                placeholder="10-digit number"
                value={mobile}
                onChange={(e) => setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))}
                required
                disabled={submitting}
              />
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" htmlFor="aadhaar-number">Aadhaar Number *</label>
              <input
                id="aadhaar-number"
                type="text"
                className="form-input"
                placeholder="12-digit UIDAI number"
                value={aadhaarNo}
                onChange={(e) => setAadhaarNo(e.target.value.replace(/\D/g, "").slice(0, 12))}
                required
                disabled={submitting}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="address">Permanent Address *</label>
            <input
              id="address"
              type="text"
              className="form-input"
              placeholder="Full Address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              required
              disabled={submitting}
            />
          </div>

          <div style={styles.formRow}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" htmlFor="num-guests">Total Guests</label>
              <select
                id="num-guests"
                className="form-select"
                value={numGuests}
                onChange={(e) => setNumGuests(Number(e.target.value))}
                disabled={submitting}
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                  <option key={n} value={n}>{n} {n === 1 ? "Guest" : "Guests"}</option>
                ))}
              </select>
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" htmlFor="payment-method">Payment Method</label>
              <select
                id="payment-method"
                className="form-select"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                disabled={submitting}
              >
                <option value="Cash">Cash</option>
                <option value="UPI">UPI / GPay</option>
                <option value="Card">Credit/Debit Card</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="remarks">Remarks</label>
            <textarea
              id="remarks"
              className="form-input"
              style={{ minHeight: "80px", resize: "vertical" }}
              placeholder="E.g., early check-in, extra bed, sea-view requested"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              disabled={submitting}
            />
          </div>
        </section>

        {/* Right Side: Stay, Pricing, and Aadhaar Photos */}
        <div style={styles.rightColumn}>

          <section className="glass-panel" style={styles.card}>
            <h2 style={styles.sectionTitle}>
              <span style={styles.stepNum}>2</span> Accommodation details
            </h2>

            <div style={styles.formRow}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Check-in Date *</label>
                <input
                  type="date"
                  className="form-input"
                  value={checkIn}
                  onChange={(e) => setCheckIn(e.target.value)}
                  required
                  disabled={submitting}
                />
                <label className="form-label" style={{ marginTop: "12px" }}>Check-in Time *</label>
                <input
                  type="time"
                  className="form-input"
                  value={checkInTime}
                  onChange={(e) => setCheckInTime(e.target.value)}
                  required
                  disabled={submitting}
                />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Check-out Date *</label>
                <input
                  type="date"
                  className="form-input"
                  value={checkOut}
                  onChange={(e) => setCheckOut(e.target.value)}
                  required
                  disabled={submitting}
                />
                <label className="form-label" style={{ marginTop: "12px" }}>Check-out Time *</label>
                <input
                  type="time"
                  className="form-input"
                  value={checkOutTime}
                  onChange={(e) => setCheckOutTime(e.target.value)}
                  required
                  disabled={submitting}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="room-number">Available Room *</label>
              <select
                id="room-number"
                className="form-select"
                value={roomNo}
                onChange={(e) => setRoomNo(e.target.value)}
                required
                disabled={submitting || roomsLoading}
              >
                <option value="">{roomsLoading ? "Verifying availability..." : "Select Available Room"}</option>
                {availableRooms.map((room) => (
                  <option key={room.roomNumber} value={room.roomNumber}>
                    Room {room.roomNumber} - {room.type} (₹{room.pricePerNight}/night)
                  </option>
                ))}
              </select>
            </div>

            <div style={styles.formRow}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" htmlFor="total-amount">Total Amount *</label>
                <input
                  id="total-amount"
                  type="number"
                  className="form-input"
                  placeholder="INR Total"
                  value={total}
                  onChange={(e) => setTotal(e.target.value)}
                  required
                  disabled={submitting}
                />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" htmlFor="advance-amount">Advance Paid</label>
                <input
                  id="advance-amount"
                  type="number"
                  className="form-input"
                  placeholder="INR Advance"
                  value={advance}
                  onChange={(e) => setAdvance(e.target.value)}
                  disabled={submitting}
                />
              </div>
            </div>

            <div style={styles.balanceSummary}>
              <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: 600 }}>OUTSTANDING BALANCE</span>
              <span style={{ fontSize: "1.4rem", fontWeight: 800, color: balance > 0 ? "var(--color-warning)" : "var(--color-success)" }}>
                ₹{balance.toLocaleString("en-IN")}
              </span>
            </div>
          </section>



          <button
            id="submit-booking-btn"
            type="submit"
            className="btn btn-primary"
            style={{ width: "100%", height: "48px", marginTop: "10px" }}
            disabled={submitting}
          >
            {submitting ? (
              <span style={styles.spinner}></span>
            ) : (
              <>
                <UserPlus size={18} />
                <span>Confirm Check-in & Register</span>
              </>
            )}
          </button>
        </div>

      </form>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: "1100px",
    margin: "0 auto",
  },
  header: {
    marginBottom: "30px",
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
  alert: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    border: "1px solid",
    borderRadius: "var(--radius-sm)",
    padding: "16px",
    marginBottom: "24px",
  },
  splitGrid: {
    display: "grid",
    gridTemplateColumns: "1.1fr 1fr",
    gap: "30px",
    alignItems: "start",
  },
  card: {
    padding: "30px",
    borderRadius: "var(--radius-md)",
    marginBottom: "24px",
  },
  sectionTitle: {
    fontSize: "1.2rem",
    fontWeight: 700,
    color: "var(--text-primary)",
    marginBottom: "24px",
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  stepNum: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "24px",
    height: "24px",
    borderRadius: "50%",
    backgroundColor: "rgba(212, 175, 55, 0.15)",
    border: "1px solid var(--accent-gold)",
    color: "var(--accent-gold)",
    fontSize: "0.8rem",
    fontWeight: 700,
  },
  formRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "16px",
    marginBottom: "20px",
  },
  rightColumn: {
    display: "flex",
    flexDirection: "column",
  },
  balanceSummary: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "rgba(9, 13, 22, 0.4)",
    border: "1px solid var(--border-color)",
    padding: "16px 20px",
    borderRadius: "var(--radius-sm)",
    marginTop: "8px",
  },
  uploadBox: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    width: "100%",
  },
  uploadBoxLabel: {
    fontSize: "0.8rem",
    fontWeight: 600,
    color: "var(--text-secondary)",
  },
  uploadDropZone: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    border: "2px dashed var(--border-color)",
    borderRadius: "var(--radius-sm)",
    padding: "24px 12px",
    cursor: "pointer",
    textAlign: "center",
    backgroundColor: "rgba(9, 13, 22, 0.3)",
    transition: "all 0.2s ease",
  },
  uploadZoneText: {
    fontSize: "0.75rem",
    color: "var(--text-secondary)",
    marginTop: "8px",
  },
  previewContainer: {
    position: "relative",
    borderRadius: "var(--radius-sm)",
    overflow: "hidden",
    border: "1px solid var(--border-color)",
    aspectRatio: "1.6",
    backgroundColor: "#000000",
  },
  previewImage: {
    width: "100%",
    height: "100%",
    objectFit: "contain",
  },
  clearUploadBtn: {
    position: "absolute",
    bottom: "8px",
    right: "8px",
    backgroundColor: "rgba(16, 23, 38, 0.8)",
    border: "1px solid var(--border-color)",
    color: "var(--text-primary)",
    fontSize: "0.7rem",
    fontWeight: 600,
    padding: "4px 10px",
    borderRadius: "4px",
    cursor: "pointer",
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
// Add media queries for responsive splitGrid
if (typeof window !== "undefined") {
  const styleTag = document.createElement("style");
  styleTag.innerHTML = `
    @media (max-width: 768px) {
      #split-grid {
        grid-template-columns: 1fr !important;
      }
    }
  `;
  document.head.appendChild(styleTag);
}
