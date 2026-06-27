"use client";

import React, { useState, useEffect } from "react";
import { Bed, Edit3, Save, X, Info, CheckCircle2, Plus, Trash2 } from "lucide-react";
import { Room } from "@/config/rooms";

export default function RoomRatesPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Modal / Editing states
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [newPrice, setNewPrice] = useState("");
  const [saving, setSaving] = useState(false);
  const [newRoomNumber, setNewRoomNumber] = useState("");
  const [newRoomType, setNewRoomType] = useState("");
  const [newCapacity, setNewCapacity] = useState("2");
  const [newPricePerNight, setNewPricePerNight] = useState("");
  const [newBuilding, setNewBuilding] = useState("");
  const [submittingNewRoom, setSubmittingNewRoom] = useState(false);
  const [deletingRoomNumber, setDeletingRoomNumber] = useState<string | null>(null);

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/rooms");
      const data = await res.json();
      if (res.ok && data.success) {
        setRooms(data.rooms);
      } else {
        setError(data.error || "Failed to fetch rooms data.");
      }
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError("Network error fetching rooms.");
      setLoading(false);
    }
  };

  const handleEditClick = (room: Room) => {
    setEditingRoom(room);
    setNewPrice(String(room.pricePerNight));
    setError("");
    setSuccess("");
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRoom || !newPrice) return;

    const parsedPrice = Number(newPrice);
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      setError("Please enter a valid price greater than 0.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const res = await fetch("/api/rooms", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          roomNumber: editingRoom.roomNumber,
          pricePerNight: parsedPrice,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setRooms(data.rooms);
        setSuccess(`Successfully updated Room ${editingRoom.roomNumber} price to ₹${parsedPrice}.`);
        setEditingRoom(null);
      } else {
        setError(data.error || "Failed to update room price.");
      }
    } catch (err) {
      console.error(err);
      setError("Network error saving room rate.");
    } finally {
      setSaving(false);
    }
  };

  const clearNewRoomForm = () => {
    setNewRoomNumber("");
    setNewRoomType("");
    setNewCapacity("2");
    setNewPricePerNight("");
    setNewBuilding("");
  };

  const handleAddRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    const roomNumber = newRoomNumber.trim();
    const type = newRoomType.trim();
    const building = newBuilding.trim();
    const capacity = Number(newCapacity);
    const pricePerNight = Number(newPricePerNight);

    if (!roomNumber || !type || !building || isNaN(capacity) || capacity <= 0 || isNaN(pricePerNight) || pricePerNight <= 0) {
      setError("Please complete the new room form with valid values.");
      return;
    }

    try {
      setSubmittingNewRoom(true);
      setError("");
      setSuccess("");

      const res = await fetch("/api/rooms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          roomNumber,
          type,
          capacity,
          pricePerNight,
          building,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setRooms(data.rooms);
        setSuccess(`Room ${roomNumber} added successfully.`);
        clearNewRoomForm();
      } else {
        setError(data.error || "Failed to add room.");
      }
    } catch (err) {
      console.error(err);
      setError("Network error adding new room.");
    } finally {
      setSubmittingNewRoom(false);
    }
  };

  const handleDeleteRoom = async (roomNumber: string) => {
    if (!window.confirm(`Delete room ${roomNumber}? This cannot be undone.`)) {
      return;
    }

    try {
      setDeletingRoomNumber(roomNumber);
      setError("");
      setSuccess("");

      const res = await fetch("/api/rooms", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ roomNumber }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setRooms(data.rooms);
        setSuccess(`Room ${roomNumber} deleted successfully.`);
      } else {
        setError(data.error || "Failed to delete room.");
      }
    } catch (err) {
      console.error(err);
      setError("Network error deleting room.");
    } finally {
      setDeletingRoomNumber(null);
    }
  };

  // Group rooms by building
  const roomsByBuilding = rooms.reduce((acc, room) => {
    const building = room.building || (["101", "102", "103", "104", "105"].includes(room.roomNumber) ? "Building A" : "Building B");
    if (!acc[building]) {
      acc[building] = [];
    }
    acc[building].push(room);
    return acc;
  }, {} as Record<string, Room[]>);

  // Sorted list of buildings
  const sortedBuildings = Object.keys(roomsByBuilding).sort();

  return (
    <div className="animate-fade-in" style={styles.container}>
      <header style={styles.header}>
        <div>
          <h1 style={styles.title}>Room Rates Manager</h1>
          <p style={styles.subtitle}>Configure and update pricing matrices across properties.</p>
        </div>
      </header>

      {/* Alert Banners */}
      {success && (
        <div style={{ ...styles.alert, ...styles.alertSuccess }}>
          <CheckCircle2 size={18} color="var(--color-success)" />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div style={{ ...styles.alert, ...styles.alertDanger }}>
          <Info size={18} color="var(--color-danger)" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div style={styles.loaderArea}>
          <div className="pulse-glow-effect" style={styles.spinner}></div>
          <span>Loading rate sheets...</span>
        </div>
      ) : (
        <>
          <section className="glass-panel" style={styles.addCard}>
            <div style={styles.addCardHeader}>
              <div>
                <h2 style={styles.buildingTitle}>
                  <Plus size={18} /> Add New Room
                </h2>
                <p style={styles.subtitle}>Create a new room entry in the room manager.</p>
              </div>
            </div>

            <form onSubmit={handleAddRoom} style={styles.addRoomForm}>
              <div style={styles.formRow}>
                <div style={styles.formColumn}>
                  <label className="form-label">Room Number</label>
                  <input
                    type="text"
                    className="form-input"
                    value={newRoomNumber}
                    onChange={(e) => setNewRoomNumber(e.target.value)}
                    placeholder="e.g. 401"
                    disabled={submittingNewRoom}
                    required
                  />
                </div>
                <div style={styles.formColumn}>
                  <label className="form-label">Building</label>
                  <input
                    type="text"
                    className="form-input"
                    value={newBuilding}
                    onChange={(e) => setNewBuilding(e.target.value)}
                    placeholder="Building C"
                    disabled={submittingNewRoom}
                    required
                  />
                </div>
              </div>
              <div style={styles.formRow}>
                <div style={styles.formColumn}>
                  <label className="form-label">Room Type</label>
                  <input
                    type="text"
                    className="form-input"
                    value={newRoomType}
                    onChange={(e) => setNewRoomType(e.target.value)}
                    placeholder="e.g. Superior Suite"
                    disabled={submittingNewRoom}
                    required
                  />
                </div>
                <div style={styles.formColumn}>
                  <label className="form-label">Capacity</label>
                  <input
                    type="number"
                    className="form-input"
                    value={newCapacity}
                    onChange={(e) => setNewCapacity(e.target.value)}
                    min={1}
                    disabled={submittingNewRoom}
                    required
                  />
                </div>
              </div>
              <div style={styles.formRow}>
                <div style={{ ...styles.formColumn, flex: 1 }}>
                  <label className="form-label">Price Per Night (₹)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={newPricePerNight}
                    onChange={(e) => setNewPricePerNight(e.target.value)}
                    placeholder="e.g. 4500"
                    min={0}
                    disabled={submittingNewRoom}
                    required
                  />
                </div>
                <button type="submit" className="btn btn-primary" style={styles.addRoomButton} disabled={submittingNewRoom}>
                  {submittingNewRoom ? "Saving..." : "Add Room"}
                </button>
              </div>
            </form>
          </section>

          <div style={styles.sectionsContainer}>
            {sortedBuildings.map((buildingName) => (
              <section key={buildingName} className="glass-panel" style={styles.buildingCard}>
                <h2 style={styles.buildingTitle}>
                  <span style={styles.accentBar} />
                  {buildingName} Rates
                </h2>

                <div className="table-container" style={{ border: "none" }}>
                  <table className="luxury-table">
                    <thead>
                      <tr>
                        <th style={{ width: "15%" }}>Room No</th>
                        <th style={{ width: "35%" }}>Room Type</th>
                        <th style={{ width: "20%" }}>Capacity</th>
                        <th style={{ width: "20%" }}>Price / Night</th>
                        <th style={{ width: "10%", textAlign: "right" }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {roomsByBuilding[buildingName].map((room) => (
                        <tr key={room.roomNumber} onClick={() => handleEditClick(room)}>
                          <td style={{ fontWeight: 800, color: "var(--accent-gold)" }}>{room.roomNumber}</td>
                          <td>{room.type}</td>
                          <td>{room.capacity} Guest{room.capacity > 1 ? "s" : ""}</td>
                          <td style={{ fontWeight: 700, fontSize: "1rem" }}>
                            ₹{room.pricePerNight.toLocaleString("en-IN")}
                          </td>
                          <td style={{ textAlign: "right" }}>
                            <div style={styles.actionButtons}>
                              <button
                                className="btn btn-secondary"
                                style={styles.editBtn}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditClick(room);
                                }}
                              >
                                <Edit3 size={14} />
                                <span>Edit</span>
                              </button>
                              <button
                                className="btn btn-danger"
                                style={styles.deleteBtn}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteRoom(room.roomNumber);
                                }}
                                disabled={deletingRoomNumber === room.roomNumber}
                              >
                                <Trash2 size={14} />
                                <span>{deletingRoomNumber === room.roomNumber ? "Deleting" : "Delete"}</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            ))}
          </div>
        </>
      )}

      {/* Edit Overlay Modal */}
      {editingRoom && (
        <div style={styles.modalOverlay} onClick={() => setEditingRoom(null)}>
          <div className="glass-panel-glow animate-fade-in" style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <header style={styles.modalHeader}>
              <div>
                <h3 style={styles.modalTitle}>Edit Room Rate</h3>
                <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                  Room {editingRoom.roomNumber} • {editingRoom.type}
                </span>
              </div>
              <button style={styles.closeBtn} onClick={() => setEditingRoom(null)}>
                <X size={20} />
              </button>
            </header>

            <form onSubmit={handleSave} style={styles.modalForm}>
              <div className="form-group">
                <label className="form-label" htmlFor="room-price-input">Price Per Night (₹)</label>
                <input
                  id="room-price-input"
                  type="number"
                  className="form-input"
                  placeholder="E.g. 3000"
                  value={newPrice}
                  onChange={(e) => setNewPrice(e.target.value)}
                  required
                  disabled={saving}
                  autoFocus
                />
              </div>

              <div style={styles.modalActions}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ flex: 1 }}
                  onClick={() => setEditingRoom(null)}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ flex: 1 }}
                  disabled={saving}
                >
                  {saving ? (
                    <span style={styles.spinnerMini}></span>
                  ) : (
                    <>
                      <Save size={16} />
                      <span>Save Rate</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
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
  sectionsContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "30px",
  },
  buildingCard: {
    padding: "30px",
    borderRadius: "var(--radius-md)",
  },
  buildingTitle: {
    fontSize: "1.25rem",
    fontWeight: 700,
    color: "var(--text-primary)",
    marginBottom: "20px",
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  accentBar: {
    width: "4px",
    height: "20px",
    backgroundColor: "var(--accent-gold)",
    borderRadius: "2px",
  },
  editBtn: {
    padding: "6px 12px",
    fontSize: "0.8rem",
    borderRadius: "var(--radius-sm)",
  },
  alert: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    border: "1px solid",
    borderRadius: "var(--radius-sm)",
    padding: "14px 16px",
    marginBottom: "24px",
    fontSize: "0.9rem",
    fontWeight: 500,
  },
  alertSuccess: {
    backgroundColor: "var(--color-success-bg)",
    borderColor: "rgba(16, 185, 129, 0.2)",
    color: "#34d399",
  },
  alertDanger: {
    backgroundColor: "var(--color-danger-bg)",
    borderColor: "rgba(239, 68, 68, 0.2)",
    color: "#f87171",
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
  spinnerMini: {
    display: "inline-block",
    width: "18px",
    height: "18px",
    borderRadius: "50%",
    border: "2px solid rgba(255, 255, 255, 0.3)",
    borderTopColor: "#ffffff",
    animation: "spin 0.8s linear infinite",
  },
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(9, 13, 22, 0.85)",
    backdropFilter: "blur(8px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
    padding: "20px",
  },
  modalContent: {
    width: "100%",
    maxWidth: "420px",
    backgroundColor: "var(--bg-secondary)",
    borderRadius: "var(--radius-md)",
    border: "1px solid var(--border-color)",
    overflow: "hidden",
  },
  modalHeader: {
    padding: "20px 24px",
    borderBottom: "1px solid var(--border-color)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "rgba(9, 13, 22, 0.3)",
  },
  modalTitle: {
    fontSize: "1.1rem",
    fontWeight: 700,
    color: "var(--text-primary)",
  },
  closeBtn: {
    background: "none",
    border: "none",
    color: "var(--text-secondary)",
    cursor: "pointer",
    padding: "4px",
    display: "flex",
    alignItems: "center",
  },
  modalForm: {
    padding: "24px",
  },
  modalActions: {
    display: "flex",
    gap: "12px",
    marginTop: "24px",
  },
  addCard: {
    padding: "26px",
    borderRadius: "var(--radius-md)",
  },
  addCardHeader: {
    marginBottom: "18px",
  },
  addRoomForm: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  formRow: {
    display: "flex",
    gap: "16px",
    flexWrap: "wrap",
    alignItems: "flex-end",
  },
  formColumn: {
    flex: "1 1 240px",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  addRoomButton: {
    width: "180px",
    minHeight: "42px",
    alignSelf: "flex-end",
  },
  actionButtons: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "8px",
    flexWrap: "wrap",
  },
  deleteBtn: {
    padding: "6px 12px",
    fontSize: "0.8rem",
    borderRadius: "var(--radius-sm)",
    backgroundColor: "var(--color-danger)",
    color: "#fff",
    border: "1px solid transparent",
  },
};
