export interface Room {
  roomNumber: string;
  type: string;
  capacity: number;
  pricePerNight: number;
  building?: string;
}

export const ROOMS: Room[] = [
  // 1st Floor - Deluxe Rooms
  { roomNumber: "101", type: "Deluxe Room", capacity: 2, pricePerNight: 2500, building: "Building A" },
  { roomNumber: "102", type: "Deluxe Room", capacity: 2, pricePerNight: 2500, building: "Building A" },
  { roomNumber: "103", type: "Deluxe Room", capacity: 2, pricePerNight: 2500, building: "Building A" },
  { roomNumber: "104", type: "Deluxe Family Room", capacity: 4, pricePerNight: 3500, building: "Building A" },
  { roomNumber: "105", type: "Deluxe Family Room", capacity: 4, pricePerNight: 3500, building: "Building A" },

  // 2nd Floor - Executive Rooms (Sea View)
  { roomNumber: "201", type: "Executive Sea View", capacity: 2, pricePerNight: 4000, building: "Building B" },
  { roomNumber: "202", type: "Executive Sea View", capacity: 2, pricePerNight: 4000, building: "Building B" },
  { roomNumber: "203", type: "Executive Sea View", capacity: 2, pricePerNight: 4000, building: "Building B" },
  { roomNumber: "204", type: "Executive Family Suite", capacity: 4, pricePerNight: 5500, building: "Building B" },
  { roomNumber: "205", type: "Executive Family Suite", capacity: 4, pricePerNight: 5500, building: "Building B" },

  // 3rd Floor - Luxury Suites
  { roomNumber: "301", type: "Presidential Suite", capacity: 2, pricePerNight: 8000, building: "Building B" },
  { roomNumber: "302", type: "Presidential Suite", capacity: 2, pricePerNight: 8000, building: "Building B" },
  { roomNumber: "303", type: "Honeymoon Suite", capacity: 2, pricePerNight: 9000, building: "Building B" },
];
