import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import clientPromise from "@/lib/mongodb";

export async function POST(req) {
  try {
    const token = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token?.sessionId) {
      return NextResponse.json(
        { success: false, message: "No active session" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db("kayakalap");

    await db.collection("adminSessions").updateOne(
      { sessionId: token.sessionId },
      { $set: { isActive: false } }
    );

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Logout error:", error);

    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}