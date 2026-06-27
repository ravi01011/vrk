import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { getAllBookings } from "@/lib/excel";
import { getRooms } from "@/lib/rooms";

export async function GET(request: Request) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const checkInStr = searchParams.get("checkIn");
    const checkOutStr = searchParams.get("checkOut");

    const currentRooms = await getRooms();

    if (!checkInStr || !checkOutStr) {
      // Return all rooms if no date range is provided
      return NextResponse.json({ success: true, rooms: currentRooms, occupiedRooms: [] });
    }

    const checkInDate = new Date(checkInStr);
    const checkOutDate = new Date(checkOutStr);

    if (isNaN(checkInDate.getTime()) || isNaN(checkOutDate.getTime()) || checkInDate >= checkOutDate) {
      return NextResponse.json(
        { success: false, error: "Invalid date range parameters" },
        { status: 400 }
      );
    }

    // Retrieve all bookings
    const bookings = await getAllBookings();

    // Check which rooms are occupied during this range
    const occupiedRooms = new Set<string>();

    bookings.forEach((booking) => {
      const bCheckIn = new Date(booking.checkIn);
      const bCheckOut = new Date(booking.checkOut);

      // Overlap formula: (StartA < EndB) and (EndA > StartB)
      const isOverlapping = bCheckIn < checkOutDate && bCheckOut > checkInDate;

      if (isOverlapping) {
        occupiedRooms.add(booking.roomNo);
      }
    });

    const availableRooms = currentRooms.map((room) => ({
      ...room,
      available: !occupiedRooms.has(room.roomNumber),
    }));

    return NextResponse.json({
      success: true,
      rooms: availableRooms,
      occupiedRoomNumbers: Array.from(occupiedRooms),
    });
  } catch (error) {
    console.error("Room Availability API Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to verify room availability" },
      { status: 500 }
    );
  }
}
