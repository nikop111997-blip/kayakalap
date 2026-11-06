import clientPromise from "@/lib/mongodb"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/authOptions"
import { sendMail } from "@/lib/mailer";
import { getTemplate } from "@/lib/template";
export async function GET(req) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== "admin" && session.user.role !== "counsellor") {
      return Response.json({ unauthorized: true })
    }

    const { searchParams } = new URL(req.url)

    const page = parseInt(searchParams.get("page")) || 1
    const limit = parseInt(searchParams.get("limit")) || 20
    const search = searchParams.get("search") || ""

    const sort = searchParams.get("sort")
    const fromDate = searchParams.get("fromDate")
    const toDate = searchParams.get("toDate")

    const status = searchParams.get("status")
    const goal = searchParams.get("goal")
    const program = searchParams.get("program")
    const dateFilter = searchParams.get("dateFilter")

    const skip = (page - 1) * limit

    const client = await clientPromise
    const db = client.db("kayakalap")

    let query = {}

    // 🔍 Search
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
        { ip: { $regex: search, $options: "i" } }
      ]
    }

    // 🎯 Filters
    if (status) query.status = status
    if (goal) query.goal = goal
    if (program) query.program = program

    // 📅 Date Handling (PRIORITY LOGIC)

    // 👉 Custom date range (highest priority)
    if (fromDate || toDate) {
      query.createdAt = {}

      if (fromDate) {
        query.createdAt.$gte = new Date(fromDate)
      }

      if (toDate) {
        const to = new Date(toDate)
        to.setHours(23, 59, 59, 999)
        query.createdAt.$lte = to
      }
    }

    // 👉 Quick filters (only if no custom date)
    else if (dateFilter && dateFilter !== "All") {
      const now = new Date()
      let from = new Date()

      if (dateFilter === "Today") {
        from.setHours(0, 0, 0, 0)
      } else if (dateFilter === "Last3") {
        from.setDate(now.getDate() - 3)
      } else if (dateFilter === "Last7") {
        from.setDate(now.getDate() - 7)
      } else if (dateFilter === "Last30") {
        from.setDate(now.getDate() - 30)
      }

      query.createdAt = { $gte: from }
    }

    // 🔽 Sorting
    let sortOption = { createdAt: -1 }

    if (sort === "oldest") sortOption = { createdAt: 1 }
    if (sort === "name") sortOption = { name: 1 }

    const contactsRaw  = await db
      .collection("contacts")
      .find(query)
      .sort(sortOption) // ✅ FIXED
      .skip(skip)
      .limit(limit)
      .toArray()
const contacts = contactsRaw.map((item) => ({
  ...item,
  source: item.source || "direct",
  medium: item.medium || "website",
  campaign: item.campaign || "default",
}))
    const total = await db.collection("contacts").countDocuments(query)

    return Response.json({
      data: contacts,
      pages: Math.ceil(total / limit)
    })

  } catch (error) {
    console.error(error)
    return Response.json({ error: true })
  }
}
export async function POST(req) {
  try {
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    const body = await req.json();

    // ✅ MATCHED WITH COMPONENT
    const {
  fullName,
  email,
  phone,
  fitnessGoal,
  program,
  notes,
  bookingDate,
  bookingTime,

  // 🔥 NEW FIELDS FROM FRONTEND
  source,
  medium,
  campaign,
} = body;

    // ================= CLEAN =================
    const trimmedName = fullName?.trim();
    const trimmedEmail = email?.trim();

    let cleanedPhone = phone?.replace(/\D/g, "");

    if (cleanedPhone?.startsWith("91") && cleanedPhone.length > 10) {
      cleanedPhone = cleanedPhone.slice(-10);
    }

    // ================= VALIDATION =================
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

    // ================= META =================
    const forwarded = req.headers.get("x-forwarded-for");
    const ip = forwarded
      ? forwarded.split(",")[0]
      : req.headers.get("x-real-ip") || "Unknown";

    const userAgent = req.headers.get("user-agent") || "Unknown";

    // ================= SAVE =================
    const client = await clientPromise;
    const db = client.db("kayakalap");

    const result = await db.collection("contacts").insertOne({
      name: trimmedName,
      email: trimmedEmail,
      phone: cleanedPhone,
      goal: fitnessGoal || null,
      program: program || null,
      message: notes || null,
      bookingDate: bookingDate || null,
      bookingTime: bookingTime || null,
      source: source || null,
      medium: medium || null,
      campaign: campaign || null,
      ip,
      userAgent,
      createdAt: new Date(),
    });

    // ================= EMAIL =================
    const userTemplate = getTemplate("callback", {
      name: trimmedName,
      email: trimmedEmail,
      phone: cleanedPhone,
      goal: fitnessGoal,
      program,
      message: notes,
      bookingDate,
      bookingTime,
    });

    await sendMail({
      to: trimmedEmail,
      subject: userTemplate.subject,
      html: userTemplate.html,
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
        error: "Server error. Please try again later.",
      }),
      {
        status: 500,
        headers: {
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }
}

// ✅ Handle preflight request (VERY IMPORTANT for CORS)
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  })
}