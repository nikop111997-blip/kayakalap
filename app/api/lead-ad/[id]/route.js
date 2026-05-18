import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

export async function PUT(req, { params }) {
  try {
    // ================= AUTH =================
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "admin") {
      return Response.json(
        {
          success: false,
          unauthorized: true,
        },
        { status: 401 }
      );
    }

    // ================= PARAMS =================
    const { id } = await params;

    const body = await req.json();

    // ================= VALIDATION =================
    if (!id) {
      return Response.json(
        {
          success: false,
          message: "Lead ID is required",
        },
        { status: 400 }
      );
    }

    if (!ObjectId.isValid(id)) {
      return Response.json(
        {
          success: false,
          message: "Invalid Lead ID",
        },
        { status: 400 }
      );
    }

    // ================= DATABASE =================
    const client = await clientPromise;

    const db = client.db("kayakalap");

    const updateData = {};

    // Optional updates
    if (body.status) {
      updateData.status = body.status;
    }

    if (body.notes) {
      updateData.notes = body.notes;
    }

    // Track updated time
    updateData.updatedAt = new Date();

    // ================= UPDATE =================
    const result = await db.collection("lead_ad").updateOne(
      {
        _id: new ObjectId(id),
      },
      {
        $set: updateData,
      }
    );

    // ================= NOT FOUND =================
    if (result.matchedCount === 0) {
      return Response.json(
        {
          success: false,
          message: "Lead not found",
        },
        { status: 404 }
      );
    }

    // ================= RESPONSE =================
    return Response.json({
      success: true,
      message: "Lead updated successfully",
    });

  } catch (error) {
    console.error("UPDATE LEAD ERROR:", error);

    return Response.json(
      {
        success: false,
        error: true,
        message: "Something went wrong",
      },
      {
        status: 500,
      }
    );
  }
}