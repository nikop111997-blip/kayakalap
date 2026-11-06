import clientPromise from "@/lib/mongodb";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

// ✅ Universal CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*", // 🔥 change to your domain if using cookies
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "*",
};

// ================= GET =================
export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "admin" && session.user.role !== "counsellor") {
      return new Response(
        JSON.stringify({ unauthorized: true }),
        { status: 401, headers: corsHeaders }
      );
    }

    const { searchParams } = new URL(req.url);

    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 20;
    const search = searchParams.get("search") || "";
    const sort = searchParams.get("sort");
    const status = searchParams.get("status");
    const plan = searchParams.get("plan");
    const fromDate = searchParams.get("fromDate");
    const toDate = searchParams.get("toDate");
    const dateFilter = searchParams.get("dateFilter");

    const skip = (page - 1) * limit;

    const client = await clientPromise;
    const db = client.db("kayakalap");

    let query = {};

    // 🔍 Search
    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { mobile: { $regex: search, $options: "i" } },
        { city: { $regex: search, $options: "i" } },
        { occupation: { $regex: search, $options: "i" } },
      ];
    }

    // 📌 Status Filter
    if (status && status !== "All") {
      query.status = status;
    }

    // 📌 Plan Filter
    if (plan && plan !== "All") {
      query.plan = plan;
    }

    // 📅 Date Filter
    if (fromDate || toDate) {
      query.createdAt = {};

      if (fromDate) {
        query.createdAt.$gte = new Date(fromDate);
      }

      if (toDate) {
        const to = new Date(toDate);
        to.setHours(23, 59, 59, 999);
        query.createdAt.$lte = to;
      }
    } else if (dateFilter && dateFilter !== "All") {
      const now = new Date();
      let from = new Date();

      switch (dateFilter) {
        case "Today":
          from.setHours(0, 0, 0, 0);
          break;
        case "Last3":
          from.setDate(now.getDate() - 3);
          break;
        case "Last7":
          from.setDate(now.getDate() - 7);
          break;
        case "Last30":
          from.setDate(now.getDate() - 30);
          break;
      }

      query.createdAt = { $gte: from };
    }

    // 🔽 Sorting
    let sortOption = { createdAt: -1 };

    switch (sort) {
      case "oldest":
        sortOption = { createdAt: 1 };
        break;

      case "name":
        sortOption = { fullName: 1 };
        break;

      case "city":
        sortOption = { city: 1 };
        break;

      case "plan":
        sortOption = { plan: 1 };
        break;

      case "status":
        sortOption = { status: 1 };
        break;
    }

    const leads = await db
      .collection("plan_applications") // Change to your collection name
      .find(query)
      .sort(sortOption)
      .skip(skip)
      .limit(limit)
      .toArray();

    const total = await db
      .collection("plan_applications")
      .countDocuments(query);

    return new Response(
      JSON.stringify({
        data: leads,
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      }),
      {
        status: 200,
        headers: corsHeaders,
      }
    );
  } catch (error) {
    console.error(error);

    return new Response(
      JSON.stringify({
        error: true,
        message: error.message,
      }),
      {
        status: 500,
        headers: corsHeaders,
      }
    );
  }
}
// ================= POST =================
export async function POST(req) {
  try {
    const body = await req.json();

    const { name, email, phone } = body;

    const trimmedName = name?.trim();
    const trimmedEmail = email?.trim();

    let cleanedPhone = phone?.replace(/\D/g, "");

    if (cleanedPhone?.startsWith("91") && cleanedPhone.length > 10) {
      cleanedPhone = cleanedPhone.slice(-10);
    }

    // ✅ Validation
    if (!trimmedName || !trimmedEmail || !cleanedPhone) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Name, Email, and Phone are required.",
        }),
        { status: 400, headers: corsHeaders }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid email format." }),
        { status: 400, headers: corsHeaders }
      );
    }

    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(cleanedPhone)) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid mobile number." }),
        { status: 400, headers: corsHeaders }
      );
    }

    // ================= SAVE =================
    const client = await clientPromise;
    const db = client.db("kayakalap");

    const result = await db.collection("popup").insertOne({
      name: trimmedName,
      email: trimmedEmail,
      phone: cleanedPhone,
      createdAt: new Date(),
    });

    return new Response(
      JSON.stringify({
        success: true,
        insertedId: result.insertedId,
      }),
      { status: 201, headers: corsHeaders }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: "Server error",
      }),
      { status: 500, headers: corsHeaders }
    );
  }
}

// ================= OPTIONS (CORS PREFLIGHT) =================
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: corsHeaders,
  });
}