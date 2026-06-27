import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { getAllBookings } from "@/lib/excel";
import { decryptString } from "@/lib/crypto";
import ExcelJS from "exceljs";

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rawBookings = await getAllBookings();

    // Create new workbook in memory
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Bookings Report");

    // Configure Columns
    sheet.columns = [
      { header: "Booking ID", key: "bookingId", width: 15 },
      { header: "Guest Name", key: "guestName", width: 20 },
      { header: "Mobile", key: "mobile", width: 15 },
      { header: "Aadhaar Number", key: "aadhaarNo", width: 20 },
      { header: "Address", key: "address", width: 25 },
      { header: "Room No", key: "roomNo", width: 10 },
      { header: "Check-In", key: "checkIn", width: 15 },
      { header: "Check-In Time", key: "checkInTime", width: 12 },
      { header: "Check-Out", key: "checkOut", width: 15 },
      { header: "Check-Out Time", key: "checkOutTime", width: 12 },
      { header: "Guests Count", key: "numGuests", width: 15 },
      { header: "Advance (INR)", key: "advance", width: 15 },
      { header: "Total (INR)", key: "total", width: 15 },
      { header: "Balance (INR)", key: "balance", width: 15 },
      { header: "Status", key: "status", width: 15 },
      { header: "Remarks", key: "remarks", width: 30 },
      { header: "Aadhaar Front File", key: "aadhaarFront", width: 30 },
      { header: "Aadhaar Back File", key: "aadhaarBack", width: 30 },
      { header: "Created At", key: "createdAt", width: 25 },
    ];

    // Style Header Row
    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 };
    headerRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF0F172A" }, // Slate 900
    };
    headerRow.alignment = { vertical: "middle", horizontal: "center" };
    headerRow.height = 28;

    // Decrypt and write records
    rawBookings.forEach((b) => {
      const decryptedAadhaar = decryptString(b.aadhaarNo);

      const row = sheet.addRow({
        bookingId: b.bookingId,
        guestName: b.guestName,
        mobile: b.mobile,
        aadhaarNo: decryptedAadhaar,
        address: b.address,
        roomNo: b.roomNo,
        checkIn: b.checkIn,
        checkInTime: b.checkInTime || "",
        checkOut: b.checkOut,
        checkOutTime: b.checkOutTime || "",
        numGuests: b.numGuests,
        advance: b.advance,
        total: b.total,
        balance: b.balance,
        status: b.status,
        remarks: b.remarks,
        aadhaarFront: b.aadhaarFront,
        aadhaarBack: b.aadhaarBack,
        createdAt: b.createdAt,
      });

      // Style cell borders and font size
      row.eachCell((cell) => {
        cell.font = { size: 10 };
        cell.border = {
          top: { style: "thin", color: { argb: "FFE2E8F0" } },
          bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
          left: { style: "thin", color: { argb: "FFE2E8F0" } },
          right: { style: "thin", color: { argb: "FFE2E8F0" } },
        };
      });

      // Status cell styling
      const statusCell = row.getCell("status");
      if (b.status === "Paid") {
        statusCell.font = { color: { argb: "FF15803D" }, bold: true, size: 10 }; // Green
      } else if (b.status === "Partial") {
        statusCell.font = { color: { argb: "FFB45309" }, bold: true, size: 10 }; // Orange
      } else {
        statusCell.font = { color: { argb: "FFB91C1C" }, bold: true, size: 10 }; // Red
      }
    });

    // Set auto-calculated heights for rows
    sheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;
      row.height = 22;
      row.alignment = { vertical: "middle" };
    });

    // Write to buffer
    const buffer = await workbook.xlsx.writeBuffer();
    const today = new Date().toISOString().split("T")[0];

    return new Response(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename=VRK_GRAND_Bookings_Report_${today}.xlsx`,
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  } catch (error) {
    console.error("Export Bookings Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to export bookings" },
      { status: 500 }
    );
  }
}
