import { getDatabase } from "@/lib/mongodb";

export interface Booking {
  bookingId: string;
  guestName: string;
  mobile: string;
  aadhaarNo: string; // Stored encrypted in MongoDB
  aadhaarFront: string; // Kept for compatibility but not used in DB landing
  aadhaarBack: string; // Kept for compatibility but not used in DB landing
  address: string;
  roomNo: string;
  checkIn: string; // YYYY-MM-DD
  checkInTime?: string; // HH:mm
  checkOut: string; // YYYY-MM-DD
  checkOutTime?: string; // HH:mm
  numGuests: number;
  advance: number;
  total: number;
  balance: number;
  status: string; // "Paid" | "Partial" | "Unpaid"
  remarks: string;
  createdAt: string;
}

export interface Payment {
  paymentId: string;
  bookingId: string;
  guestName: string;
  roomNo: string;
  amount: number;
  paymentDate: string; // YYYY-MM-DD
  paymentMethod: string; // "Cash" | "UPI" | "Card"
  remarks: string;
}

const BOOKINGS_COLLECTION = "bookings";
const PAYMENTS_COLLECTION = "payments";

export async function getAllBookings(): Promise<Booking[]> {
  const db = await getDatabase();
  const bookings = await db
    .collection<Booking>(BOOKINGS_COLLECTION)
    .find()
    .sort({ createdAt: -1 })
    .toArray();

  return bookings.map(({ _id, ...booking }) => booking as Booking);
}

export async function saveBooking(booking: Booking): Promise<void> {
  const db = await getDatabase();
  await db
    .collection<Booking>(BOOKINGS_COLLECTION)
    .updateOne({ bookingId: booking.bookingId }, { $set: booking }, { upsert: true });
}

export async function getAllPayments(): Promise<Payment[]> {
  const db = await getDatabase();
  const payments = await db
    .collection<Payment>(PAYMENTS_COLLECTION)
    .find()
    .sort({ paymentDate: -1 })
    .toArray();

  return payments.map(({ _id, ...payment }) => payment as Payment);
}

export async function savePayment(payment: Payment): Promise<void> {
  const db = await getDatabase();
  await db.collection<Payment>(PAYMENTS_COLLECTION).insertOne(payment);
}

export async function addPaymentToBooking(
  bookingId: string,
  amount: number,
  method: string,
  date: string,
  remarks: string
): Promise<Booking> {
  const db = await getDatabase();
  const bookingDoc = await db.collection<Booking>(BOOKINGS_COLLECTION).findOne({ bookingId });

  if (!bookingDoc) {
    throw new Error(`Booking with ID ${bookingId} not found`);
  }

  const { _id, ...booking } = bookingDoc as Booking & { _id?: unknown };
  const updatedAdvance = booking.advance + amount;
  const updatedBalance = Math.max(0, booking.total - updatedAdvance);
  const updatedStatus = updatedBalance <= 0 ? "Paid" : updatedAdvance > 0 ? "Partial" : "Unpaid";
  const updatedBooking: Booking = {
    ...booking,
    advance: updatedAdvance,
    balance: updatedBalance,
    status: updatedStatus,
  };

  await db
    .collection<Booking>(BOOKINGS_COLLECTION)
    .updateOne({ bookingId }, { $set: updatedBooking });

  const paymentId = `PAY-${Date.now().toString().slice(-6)}`;

  await savePayment({
    paymentId,
    bookingId,
    guestName: booking.guestName,
    roomNo: booking.roomNo,
    amount,
    paymentDate: date,
    paymentMethod: method,
    remarks: remarks || "Balance Payment",
  });

  return updatedBooking;
}
