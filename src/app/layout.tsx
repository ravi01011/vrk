import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VRK GRAND | Admin Management Console",
  description: "Secure Hotel Admin Panel for Room Allocations, Guest Bookings, Aadhaar Verification Records, and Payment Tracking.",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <head>
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body style={{ backgroundColor: "var(--bg-primary)", color: "var(--text-primary)" }}>
        {children}
      </body>
    </html>
  );
}

