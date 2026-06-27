import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { getRooms, updateRoomRate, addRoom, deleteRoom } from "@/lib/rooms";

/**
 * GET: Retrieve list of all rooms
 */
export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const rooms = await getRooms();
    return NextResponse.json({ success: true, rooms });
  } catch (error) {
    console.error("GET Rooms Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch rooms" },
      { status: 500 }
    );
  }
}

/**
 * PUT: Update rate of a specific room
 */
export async function PUT(request: Request) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { roomNumber, pricePerNight } = await request.json();

    if (!roomNumber || pricePerNight === undefined || isNaN(Number(pricePerNight)) || Number(pricePerNight) < 0) {
      return NextResponse.json(
        { success: false, error: "Invalid room number or price parameters" },
        { status: 400 }
      );
    }

    const updatedRooms = await updateRoomRate(roomNumber, Number(pricePerNight));
    return NextResponse.json({ success: true, rooms: updatedRooms });
  } catch (error) {
    console.error("PUT Rooms Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update room rate" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { roomNumber, type, capacity, pricePerNight, building } = await request.json();

    if (
      !roomNumber ||
      !type ||
      !building ||
      isNaN(Number(capacity)) ||
      Number(capacity) <= 0 ||
      isNaN(Number(pricePerNight)) ||
      Number(pricePerNight) <= 0
    ) {
      return NextResponse.json(
        { success: false, error: "Invalid room details provided." },
        { status: 400 }
      );
    }

    const newRoom = {
      roomNumber: String(roomNumber).trim(),
      type: String(type).trim(),
      building: String(building).trim(),
      capacity: Number(capacity),
      pricePerNight: Number(pricePerNight),
    };

    const updatedRooms = await addRoom(newRoom);
    return NextResponse.json({ success: true, rooms: updatedRooms });
  } catch (error) {
    console.error("POST Rooms Error:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to add room." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { roomNumber } = await request.json();

    if (!roomNumber) {
      return NextResponse.json(
        { success: false, error: "Room number is required for deletion." },
        { status: 400 }
      );
    }

    const updatedRooms = await deleteRoom(String(roomNumber).trim());
    return NextResponse.json({ success: true, rooms: updatedRooms });
  } catch (error) {
    console.error("DELETE Rooms Error:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to delete room." },
      { status: 500 }
    );
  }
}
