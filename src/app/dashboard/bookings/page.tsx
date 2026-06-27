"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Search, Download, Eye, FileText, X, CreditCard, Landmark, CheckCircle2, ChevronRight } from "lucide-react";
import { Booking } from "@/lib/excel";

export default function BookingsPage() {
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get("search") || "";

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [loading, setLoading] = useState(true);

  // Selected booking for detailed view / payment tracking
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [paymentRemarks, setPaymentRemarks] = useState("");
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentMessage, setPaymentMessage] = useState("");

  useEffect(() => {
    fetchBookings(initialSearch);
  }, []);

  const fetchBookings = async (queryStr: string) => {
    try {
      setLoading(true);
      const url = queryStr ? `/api/bookings?search=${encodeURIComponent(queryStr)}` : "/api/bookings";
      const res = await fetch(url);
      const data = await res.json();
      if (res.ok && data.success) {
        setBookings(data.bookings);

        // If details modal is open, update its state with latest data
        if (selectedBooking) {
          const updated = data.bookings.find((b: Booking) => b.bookingId === selectedBooking.bookingId);
          if (updated) setSelectedBooking(updated);
        }
      }
      setLoading(false);
    } catch (error) {
      console.error("Error fetching bookings:", error);
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchBookings(searchQuery);
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    fetchBookings("");
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBooking || !paymentAmount || Number(paymentAmount) <= 0) return;

    try {
      setPaymentLoading(true);
      setPaymentMessage("");

      const res = await fetch("/api/bookings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: selectedBooking.bookingId,
          amount: Number(paymentAmount),
          paymentMethod,
          remarks: paymentRemarks || "Balance Payment",
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setPaymentMessage("Payment recorded successfully!");
        setPaymentAmount("");
        setPaymentRemarks("");
        // Reload all data
        await fetchBookings(searchQuery);
      } else {
        setPaymentMessage(data.error || "Failed to record payment.");
      }
      setPaymentLoading(false);
    } catch (error) {
      console.error("Payment registration error:", error);
      setPaymentMessage("Error connecting to database.");
      setPaymentLoading(false);
    }
  };

  const downloadExcelReport = () => {
    window.open("/api/bookings/export", "_blank");
  };

  // Helper to construct secure image source url
  const getAadhaarUrl = (filePath: string) => {
    if (!filePath) return "";
    const filename = filePath.split("/").pop(); // Get filename e.g. 2026-06-06_Ravi_front.enc
    return `/api/bookings/aadhaar/${filename}`;
  };

  return (
    <div className="animate-fade-in" style={styles.container}>
      <header style={styles.header}>
        <div>
          <h1 style={styles.title}>Guest Ledger & Bookings</h1>
          <p style={styles.subtitle}>Search records, verify documents, and record guest payments.</p>
        </div>
        <button
          id="export-report-btn"
          className="btn btn-gold"
          style={styles.exportBtn}
          onClick={downloadExcelReport}
        >
          <Download size={18} />
          <span>Export Report (Excel)</span>
        </button>
      </header>

      {/* Search Input Bar */}
      <section className="glass-panel" style={styles.searchPanel}>
        <form onSubmit={handleSearchSubmit} style={styles.searchForm}>
          <div style={styles.searchWrapper}>
            <Search size={20} style={styles.searchIcon} />
            <input
              id="bookings-search-input"
              type="text"
              placeholder="Search by Guest Name, Mobile Number, or Aadhaar Card..."
              className="form-input"
              style={styles.searchInput}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button type="button" onClick={handleClearSearch} style={styles.clearSearchBtn}>
                <X size={16} />
              </button>
            )}
          </div>
          <button type="submit" className="btn btn-primary" style={{ height: "46px", padding: "0 28px" }}>
            Search Logs
          </button>
        </form>
      </section>

      {/* Main Ledger Table */}
      {loading ? (
        <div style={styles.loaderArea}>
          <div className="pulse-glow-effect" style={styles.spinner}></div>
          <span>Loading bookings database...</span>
        </div>
      ) : bookings.length === 0 ? (
        <div className="glass-panel" style={styles.emptyCard}>
          <FileText size={48} color="var(--text-muted)" style={{ marginBottom: "16px" }} />
          <h3>No Records Match</h3>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginTop: "4px" }}>
            {searchQuery ? `We found no guest bookings matching "${searchQuery}".` : "No guest registrations have been added yet."}
          </p>
        </div>
      ) : (
        <div className="table-container">
          <table className="luxury-table">
            <thead>
              <tr>
                <th>Booking ID</th>
                <th>Guest Name</th>
                <th>Room</th>
                <th>Dates</th>
                <th>Financials</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((booking) => (
                <tr key={booking.bookingId} onClick={() => setSelectedBooking(booking)}>
                  <td style={{ fontWeight: 600, color: "var(--text-muted)", fontSize: "0.8rem" }}>{booking.bookingId}</td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{booking.guestName}</div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>{booking.mobile}</div>
                  </td>
                  <td style={{ fontWeight: 700, color: "var(--accent-gold)" }}>{booking.roomNo}</td>
                  <td style={{ fontSize: "0.85rem" }}>
                    <div>Check In: {booking.checkIn}{booking.checkInTime ? ` at ${booking.checkInTime}` : ""}</div>
                    <div style={{ color: "var(--text-secondary)", fontSize: "0.75rem" }}>Check Out: {booking.checkOut}{booking.checkOutTime ? ` at ${booking.checkOutTime}` : ""}</div>
                  </td>
                  <td style={{ fontSize: "0.85rem" }}>
                    <div>Total: ₹{booking.total}</div>
                    <div style={{ color: "var(--text-secondary)", fontSize: "0.75rem" }}>Balance: ₹{booking.balance}</div>
                  </td>
                  <td>
                    <span className={`badge badge-${booking.status.toLowerCase()}`}>
                      {booking.status}
                    </span>
                  </td>
                  <td>
                    <button
                      className="btn btn-secondary"
                      style={styles.actionBtn}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedBooking(booking);
                      }}
                    >
                      <Eye size={14} />
                      <span>Ledger View</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Guest Details & Ledger Modal */}
      {selectedBooking && (
        <div style={styles.modalOverlay} onClick={() => { setSelectedBooking(null); setPaymentMessage(""); }}>
          <div className="glass-panel-glow animate-fade-in" style={styles.modalContent} onClick={(e) => e.stopPropagation()}>

            <header style={styles.modalHeader}>
              <div>
                <span style={styles.modalBookingId}>{selectedBooking.bookingId}</span>
                <h2 style={styles.modalTitle}>{selectedBooking.guestName}</h2>
                <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>Room {selectedBooking.roomNo} allocation ledger</span>
              </div>
              <button style={styles.closeBtn} onClick={() => { setSelectedBooking(null); setPaymentMessage(""); }} aria-label="Close details">
                <X size={20} />
              </button>
            </header>

            <div style={styles.modalBody}>
              {/* Left Column: Details & Document Verification */}
              <div style={styles.modalLeft}>

                <div style={styles.infoBlockGrid}>
                  <div>
                    <span style={styles.infoLabel}>Mobile Number</span>
                    <span style={styles.infoVal}>{selectedBooking.mobile}</span>
                  </div>
                  <div>
                    <span style={styles.infoLabel}>Aadhaar UID</span>
                    <span className="pulse-glow-effect" style={{ ...styles.infoVal, color: "var(--accent-gold)", fontWeight: 600 }}>
                      {selectedBooking.aadhaarNo || "Not Uploaded"}
                    </span>
                  </div>
                  <div>
                    <span style={styles.infoLabel}>Check-In Date</span>
                    <span style={styles.infoVal}>{selectedBooking.checkIn}</span>
                  </div>
                  <div>
                    <span style={styles.infoLabel}>Check-In Time</span>
                    <span style={styles.infoVal}>{selectedBooking.checkInTime || "N/A"}</span>
                  </div>
                  <div>
                    <span style={styles.infoLabel}>Check-Out Date</span>
                    <span style={styles.infoVal}>{selectedBooking.checkOut}</span>
                  </div>
                  <div>
                    <span style={styles.infoLabel}>Check-Out Time</span>
                    <span style={styles.infoVal}>{selectedBooking.checkOutTime || "N/A"}</span>
                  </div>
                  <div>
                    <span style={styles.infoLabel}>Guests Count</span>
                    <span style={styles.infoVal}>{selectedBooking.numGuests} Stayer(s)</span>
                  </div>
                  <div>
                    <span style={styles.infoLabel}>Registered Time</span>
                    <span style={{ ...styles.infoVal, fontSize: "0.75rem" }}>
                      {new Date(selectedBooking.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>

                <div style={styles.fullWidthInfo}>
                  <span style={styles.infoLabel}>Permanent Address</span>
                  <span style={styles.infoVal}>{selectedBooking.address}</span>
                </div>

                {selectedBooking.remarks && (
                  <div style={styles.fullWidthInfo}>
                    <span style={styles.infoLabel}>Remarks</span>
                    <span style={{ ...styles.infoVal, fontStyle: "italic" }}>"{selectedBooking.remarks}"</span>
                  </div>
                )}
              </div>

              {/* Right Column: Billing Summary & Payment recording */}
              <div style={styles.modalRight}>
                <div style={styles.billingSummaryCard}>
                  <h3 style={styles.billingTitle}>Billing Summary</h3>

                  <div style={styles.billingRow}>
                    <span>Total Cost</span>
                    <span>₹{selectedBooking.total}</span>
                  </div>

                  <div style={styles.billingRow}>
                    <span>Advances Paid</span>
                    <span style={{ color: "var(--color-success)" }}>₹{selectedBooking.advance}</span>
                  </div>

                  <hr style={styles.divider} />

                  <div style={styles.billingRowBalance}>
                    <span>Balance Due</span>
                    <span style={{ color: selectedBooking.balance > 0 ? "var(--color-warning)" : "var(--color-success)" }}>
                      ₹{selectedBooking.balance}
                    </span>
                  </div>
                </div>

                {/* Record New Payment */}
                {selectedBooking.balance > 0 ? (
                  <form onSubmit={handleRecordPayment} style={styles.paymentForm}>
                    <h4 style={styles.paymentFormTitle}>Record Balance Payment</h4>

                    {paymentMessage && (
                      <div style={{
                        ...styles.paymentMsg,
                        backgroundColor: paymentMessage.includes("successfully") ? "var(--color-success-bg)" : "var(--color-danger-bg)",
                        borderColor: paymentMessage.includes("successfully") ? "rgba(16, 185, 129, 0.2)" : "rgba(239, 68, 68, 0.2)",
                        color: paymentMessage.includes("successfully") ? "#34d399" : "#f87171"
                      }}>
                        {paymentMessage}
                      </div>
                    )}

                    <div className="form-group">
                      <label className="form-label" htmlFor="pay-amount">Amount Paid (INR)</label>
                      <input
                        id="pay-amount"
                        type="number"
                        className="form-input"
                        placeholder="E.g., 2000"
                        max={selectedBooking.balance}
                        value={paymentAmount}
                        onChange={(e) => setPaymentAmount(e.target.value)}
                        required
                        disabled={paymentLoading}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label" htmlFor="pay-method">Payment Method</label>
                      <select
                        id="pay-method"
                        className="form-select"
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        disabled={paymentLoading}
                      >
                        <option value="Cash">Cash</option>
                        <option value="UPI">UPI / PhonePe</option>
                        <option value="Card">Credit/Debit Card</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label" htmlFor="pay-remarks">Transaction Note</label>
                      <input
                        id="pay-remarks"
                        type="text"
                        className="form-input"
                        placeholder="E.g., final check-out payment"
                        value={paymentRemarks}
                        onChange={(e) => setPaymentRemarks(e.target.value)}
                        disabled={paymentLoading}
                      />
                    </div>

                    <button type="submit" className="btn btn-primary" style={{ width: "100%", height: "42px", marginTop: "6px" }} disabled={paymentLoading}>
                      {paymentLoading ? "Saving transaction..." : "Apply Payment"}
                    </button>
                  </form>
                ) : (
                  <div style={styles.settledCover}>
                    <CheckCircle2 size={36} color="var(--color-success)" style={{ marginBottom: "8px" }} />
                    <span style={{ color: "var(--color-success)", fontWeight: 700 }}>Invoice Fully Settled</span>
                    <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "4px" }}>
                      This guest has no outstanding dues.
                    </span>
                  </div>
                )}
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: "flex",
    flexDirection: "column",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
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
  exportBtn: {
    padding: "12px 20px",
  },
  searchPanel: {
    padding: "20px",
    borderRadius: "var(--radius-md)",
    marginBottom: "28px",
  },
  searchForm: {
    display: "flex",
    gap: "12px",
    flexWrap: "wrap",
  },
  searchWrapper: {
    position: "relative",
    display: "flex",
    alignItems: "center",
    flexGrow: 1,
    minWidth: "260px",
  },
  searchIcon: {
    position: "absolute",
    left: "14px",
    color: "var(--text-muted)",
  },
  searchInput: {
    paddingLeft: "44px",
    paddingRight: "44px",
    height: "46px",
  },
  clearSearchBtn: {
    position: "absolute",
    right: "14px",
    background: "none",
    border: "none",
    color: "var(--text-muted)",
    cursor: "pointer",
    padding: "4px",
    display: "flex",
    alignItems: "center",
  },
  loaderArea: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "80px 0",
    gap: "16px",
    color: "var(--text-secondary)",
  },
  spinner: {
    width: "32px",
    height: "32px",
    borderRadius: "50%",
    border: "2px solid var(--accent-indigo)",
    borderTopColor: "transparent",
    animation: "spin 1s linear infinite",
  },
  emptyCard: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "80px 20px",
    textAlign: "center",
  },
  actionBtn: {
    padding: "8px 14px",
    fontSize: "0.8rem",
    borderRadius: "var(--radius-sm)",
  },
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(9, 13, 22, 0.8)",
    backdropFilter: "blur(8px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
    padding: "20px",
  },
  modalContent: {
    width: "100%",
    maxWidth: "960px",
    maxHeight: "90vh",
    backgroundColor: "var(--bg-secondary)",
    borderRadius: "var(--radius-lg)",
    border: "1px solid var(--border-color)",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },
  modalHeader: {
    padding: "24px 30px",
    borderBottom: "1px solid var(--border-color)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "rgba(9, 13, 22, 0.3)",
  },
  modalBookingId: {
    fontSize: "0.75rem",
    fontWeight: 700,
    color: "var(--accent-gold)",
    textTransform: "uppercase",
    letterSpacing: "0.1em",
  },
  modalTitle: {
    fontSize: "1.4rem",
    fontWeight: 800,
    color: "var(--text-primary)",
    marginTop: "2px",
  },
  closeBtn: {
    background: "none",
    border: "none",
    color: "var(--text-secondary)",
    cursor: "pointer",
    padding: "6px",
    display: "flex",
    alignItems: "center",
    borderRadius: "50%",
    transition: "background-color 0.2s",
  },
  modalBody: {
    padding: "30px",
    overflowY: "auto",
    display: "grid",
    gridTemplateColumns: "1.4fr 1fr",
    gap: "30px",
  },
  modalLeft: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  modalRight: {
    display: "flex",
    flexDirection: "column",
    gap: "24px",
  },
  infoBlockGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
    gap: "16px 20px",
  },
  infoLabel: {
    fontSize: "0.75rem",
    fontWeight: 600,
    color: "var(--text-muted)",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    display: "block",
    marginBottom: "4px",
  },
  infoVal: {
    fontSize: "0.95rem",
    fontWeight: 500,
    color: "var(--text-primary)",
    display: "block",
  },
  fullWidthInfo: {
    borderTop: "1px solid var(--border-color)",
    paddingTop: "14px",
  },
  imagesSection: {
    borderTop: "1px solid var(--border-color)",
    paddingTop: "20px",
  },
  imagesTitle: {
    fontSize: "0.9rem",
    fontWeight: 700,
    color: "var(--text-primary)",
    marginBottom: "14px",
  },
  imagesGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "16px",
  },
  imageCard: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  imageCardLabel: {
    fontSize: "0.75rem",
    fontWeight: 600,
    color: "var(--text-secondary)",
  },
  imageContainer: {
    border: "1px solid var(--border-color)",
    borderRadius: "var(--radius-sm)",
    overflow: "hidden",
    aspectRatio: "1.6",
    backgroundColor: "rgba(9, 13, 22, 0.4)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  aadhaarImage: {
    width: "100%",
    height: "100%",
    objectFit: "contain",
  },
  noImagePlaceholder: {
    border: "2px dashed var(--border-color)",
    borderRadius: "var(--radius-sm)",
    aspectRatio: "1.6",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    color: "var(--text-muted)",
    fontSize: "0.75rem",
    gap: "8px",
    backgroundColor: "rgba(9, 13, 22, 0.2)",
  },
  billingSummaryCard: {
    backgroundColor: "rgba(9, 13, 22, 0.4)",
    border: "1px solid var(--border-color)",
    borderRadius: "var(--radius-md)",
    padding: "20px",
  },
  billingTitle: {
    fontSize: "0.95rem",
    fontWeight: 700,
    color: "var(--text-primary)",
    marginBottom: "16px",
  },
  billingRow: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: "0.85rem",
    color: "var(--text-secondary)",
    marginBottom: "10px",
  },
  divider: {
    border: "none",
    borderTop: "1px solid var(--border-color)",
    margin: "12px 0",
  },
  billingRowBalance: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: "1.05rem",
    fontWeight: 800,
  },
  paymentForm: {
    border: "1px solid var(--border-color)",
    borderRadius: "var(--radius-md)",
    padding: "20px",
    backgroundColor: "rgba(255, 255, 255, 0.01)",
  },
  paymentFormTitle: {
    fontSize: "0.9rem",
    fontWeight: 700,
    color: "var(--text-primary)",
    marginBottom: "16px",
  },
  paymentMsg: {
    padding: "10px 14px",
    border: "1px solid",
    borderRadius: "var(--radius-sm)",
    fontSize: "0.8rem",
    fontWeight: 500,
    marginBottom: "16px",
  },
  settledCover: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "36px 20px",
    border: "1px dashed var(--border-color)",
    borderRadius: "var(--radius-md)",
    textAlign: "center",
    backgroundColor: "rgba(16, 185, 129, 0.02)",
  },
};
// Append style tags for responsiveness on bookings modal split
if (typeof window !== "undefined") {
  const styleTag = document.createElement("style");
  styleTag.innerHTML = `
    @media (max-width: 768px) {
      #modal-body-layout {
        grid-template-columns: 1fr !important;
      }
    }
  `;
  document.head.appendChild(styleTag);
}
