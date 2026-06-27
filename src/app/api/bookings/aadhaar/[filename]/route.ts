import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json(
      { success: false, error: "Aadhaar photo retrieval is disabled in MongoDB deployment." },
      { status: 404 }
    );
  } catch (error) {
    console.error("Aadhaar route disabled error:", error);
    return NextResponse.json(
      { success: false, error: "Aadhaar route is not available." },
      { status: 500 }
    );
  }
}
