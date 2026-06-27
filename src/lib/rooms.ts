import { getDatabase } from "@/lib/mongodb";
import { Room, ROOMS } from "@/config/rooms";

const COLLECTION_NAME = "rooms";

export async function getRooms(): Promise<Room[]> {
  const db = await getDatabase();
  const collection = db.collection<Room>(COLLECTION_NAME);
  const rooms = await collection.find().toArray();

  if (rooms.length === 0) {
    await collection.insertMany(ROOMS);
    return ROOMS;
  }

  return rooms.map(({ _id, ...room }) => room as Room);
}

export async function saveRooms(rooms: Room[]): Promise<void> {
  const db = await getDatabase();
  const collection = db.collection<Room>(COLLECTION_NAME);
  await collection.deleteMany({});
  if (rooms.length > 0) {
    await collection.insertMany(rooms);
  }
}

export async function addRoom(room: Room): Promise<Room[]> {
  const db = await getDatabase();
  const collection = db.collection<Room>(COLLECTION_NAME);
  const existing = await collection.findOne({ roomNumber: room.roomNumber });
  if (existing) {
    throw new Error(`Room ${room.roomNumber} already exists.`);
  }
  await collection.insertOne(room);
  return getRooms();
}

export async function deleteRoom(roomNumber: string): Promise<Room[]> {
  const db = await getDatabase();
  const collection = db.collection<Room>(COLLECTION_NAME);
  const result = await collection.deleteOne({ roomNumber });
  if (result.deletedCount === 0) {
    throw new Error(`Room ${roomNumber} not found.`);
  }
  return getRooms();
}

export async function updateRoomRate(roomNumber: string, pricePerNight: number): Promise<Room[]> {
  const db = await getDatabase();
  const collection = db.collection<Room>(COLLECTION_NAME);

  const result = await collection.findOneAndUpdate(
    { roomNumber },
    { $set: { pricePerNight } },
    { returnDocument: "after" }
  );

  if (!result) {
    throw new Error(`Room ${roomNumber} not found.`);
  }

  return getRooms();
}
