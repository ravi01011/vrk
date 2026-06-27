import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { getAllBookings, saveBooking, savePayment, addPaymentToBooking, Booking } from "@/lib/excel";
import { encryptString, decryptString } from "@/lib/crypto";

/**
 * GET: Retrieve bookings (supports searching and filtering)
 */
export async function GET(request: Request) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.toLowerCase() || "";
    const date = searchParams.get("date") || ""; // Format: YYYY-MM-DD

    const rawBookings = await getAllBookings();

    const bookings: Booking[] = rawBookings.map((b) => ({
      ...b,
      aadhaarNo: decryptString(b.aadhaarNo),
    }));

    let filteredBookings = bookings;

    // Filter by search query (Name, Mobile, Aadhaar)
    if (search) {
      filteredBookings = filteredBookings.filter(
        (b) =>
          b.guestName.toLowerCase().includes(search) ||
          b.mobile.includes(search) ||
          b.aadhaarNo.includes(search)
      );
    }

    // Filter by Date-wise view (guest staying/arriving/departing on selected date)
    if (date) {
      filteredBookings = filteredBookings.filter((b) => {
        const checkInDate = new Date(b.checkIn);
        const checkOutDate = new Date(b.checkOut);
        const targetDate = new Date(date);

        // Remove times to compare dates accurately
        checkInDate.setHours(0, 0, 0, 0);
        checkOutDate.setHours(0, 0, 0, 0);
        targetDate.setHours(0, 0, 0, 0);

        return targetDate >= checkInDate && targetDate <= checkOutDate;
      });
    }

    // Sort by creation or checkIn date descending
    filteredBookings.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    return NextResponse.json({ success: true, bookings: filteredBookings });
  } catch (error) {
    console.error("GET Bookings Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch bookings" },
      { status: 500 }
    );
  }
}

/**
 * POST: Create a new booking
 */
export async function POST(request: Request) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();

    const guestName = formData.get("guestName") as string;
    const mobile = formData.get("mobile") as string;
    const address = formData.get("address") as string;
    const aadhaarNo = formData.get("aadhaarNo") as string;
    const roomNo = formData.get("roomNo") as string;
    const checkIn = formData.get("checkIn") as string; // YYYY-MM-DD
    const checkInTime = (formData.get("checkInTime") as string) || "14:00"; // HH:mm
    const checkOut = formData.get("checkOut") as string; // YYYY-MM-DD
    const checkOutTime = (formData.get("checkOutTime") as string) || "11:00"; // HH:mm
    const numGuests = Number(formData.get("numGuests") || 1);
    const advance = Number(formData.get("advance") || 0);
    const total = Number(formData.get("total") || 0);
    const remarks = (formData.get("remarks") as string) || "";
    const paymentMethod = (formData.get("paymentMethod") as string) || "Cash";

    if (!guestName || !mobile || !aadhaarNo || !roomNo || !checkIn || !checkInTime || !checkOut || !total) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    const encryptedAadhaar = encryptString(aadhaarNo);
    const balance = total - advance;
    const status = balance <= 0 ? "Paid" : advance > 0 ? "Partial" : "Unpaid";
    const bookingId = `BKG-${Date.now().toString().slice(-6)}`;
    const createdAt = new Date().toISOString();

    const bookingData: Booking = {
      bookingId,
      guestName,
      mobile,
      aadhaarNo: encryptedAadhaar,
      aadhaarFront: "",
      aadhaarBack: "",
      address,
      roomNo,
      checkIn,
      checkInTime,
      checkOut,
      checkOutTime,
      numGuests,
      advance,
      total,
      balance,
      status,
      remarks,
      createdAt,
    };

    await saveBooking(bookingData);

    if (advance > 0) {
      const paymentId = `PAY-${Date.now().toString().slice(-6)}`;
      await savePayment({
        paymentId,
        bookingId,
        guestName,
        roomNo,
        amount: advance,
        paymentDate: checkIn,
        paymentMethod,
        remarks: "Advance Payment on Check-in",
      });
    }

    return NextResponse.json({ success: true, bookingId });
  } catch (error) {
    console.error("POST Booking Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create booking" },
      { status: 500 }
    );
  }
}

/**
 * PUT: Record a payment update to a booking
 */
export async function PUT(request: Request) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { bookingId, amount, paymentMethod, remarks } = await request.json();

    if (!bookingId || !amount || amount <= 0) {
      return NextResponse.json(
        { success: false, error: "Invalid booking ID or amount" },
        { status: 400 }
      );
    }

    const todayStr = new Date().toISOString().split("T")[0];
    const updatedBooking = await addPaymentToBooking(
      bookingId,
      Number(amount),
      paymentMethod || "Cash",
      todayStr,
      remarks || "Balance Settlement"
    );

    updatedBooking.aadhaarNo = decryptString(updatedBooking.aadhaarNo);

    return NextResponse.json({ success: true, booking: updatedBooking });
  } catch (error) {
    console.error("PUT Booking Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update booking payment" },
      { status: 500 }
    );
  }
}
