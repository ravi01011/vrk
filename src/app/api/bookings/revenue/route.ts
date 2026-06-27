import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { getAllBookings, getAllPayments } from "@/lib/excel";

interface MonthlyReport {
  monthKey: string;     // "YYYY-MM"
  monthName: string;    // "Jun 2026"
  bookingCount: number;
  bookingsValue: number;
  advancesReceived: number;
  balancesPending: number;
  paymentsCollected: number; // Cash flow actually collected in this month
}

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const bookings = await getAllBookings();
    const payments = await getAllPayments();

    const monthlyData: Record<string, MonthlyReport> = {};

    // Helper to format key "YYYY-MM" into readable string "Jun 2026"
    const formatMonthName = (key: string): string => {
      const [year, month] = key.split("-");
      const monthIdx = parseInt(month, 10) - 1;
      return `${MONTH_NAMES[monthIdx]} ${year}`;
    };

    // 1. Process bookings to aggregate value, advance and balance by check-in month
    bookings.forEach((booking) => {
      if (!booking.checkIn) return;
      const monthKey = booking.checkIn.substring(0, 7); // "YYYY-MM"

      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = {
          monthKey,
          monthName: formatMonthName(monthKey),
          bookingCount: 0,
          bookingsValue: 0,
          advancesReceived: 0,
          balancesPending: 0,
          paymentsCollected: 0,
        };
      }

      monthlyData[monthKey].bookingCount += 1;
      monthlyData[monthKey].bookingsValue += booking.total;
      monthlyData[monthKey].advancesReceived += booking.advance;
      monthlyData[monthKey].balancesPending += booking.balance;
    });

    // 2. Process payments to aggregate cash flow collected by payment date month
    payments.forEach((payment) => {
      if (!payment.paymentDate) return;
      const monthKey = payment.paymentDate.substring(0, 7); // "YYYY-MM"

      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = {
          monthKey,
          monthName: formatMonthName(monthKey),
          bookingCount: 0,
          bookingsValue: 0,
          advancesReceived: 0,
          balancesPending: 0,
          paymentsCollected: 0,
        };
      }

      monthlyData[monthKey].paymentsCollected += payment.amount;
    });

    // Convert to sorted array descending
    const report: MonthlyReport[] = Object.values(monthlyData).sort((a, b) =>
      b.monthKey.localeCompare(a.monthKey)
    );

    // Calculate overall statistics
    const totals = {
      totalBookings: bookings.length,
      totalValue: bookings.reduce((sum, b) => sum + b.total, 0),
      totalCollected: payments.reduce((sum, p) => sum + p.amount, 0),
      totalPending: bookings.reduce((sum, b) => sum + b.balance, 0),
    };

    return NextResponse.json({
      success: true,
      report,
      totals,
    });
  } catch (error) {
    console.error("Revenue API Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to generate monthly revenue statistics" },
      { status: 500 }
    );
  }
}
