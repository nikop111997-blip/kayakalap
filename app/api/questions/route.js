import clientPromise from "@/lib/mongodb"

export async function POST(req) {
  try {
    const body = await req.json()

    const {
      name,
      email,
      whatsapp,
      age,
      schedule,
      frustration,
      q1,
      q2,
      q3,
      q4,
      q5,
      score,
      submittedAt,
    } = body

    if (!name || !email || !whatsapp) {
      return new Response(
        JSON.stringify({ success: false, message: "Missing required fields" }),
        {
          status: 400,
          headers: corsHeaders(),
        }
      )
    }

    const client = await clientPromise
    const db = client.db("kayakalap")

    const leadData = {
      name,
      email,
      whatsapp,
      age,
      schedule,
      frustration,
      answers: { q1, q2, q3, q4, q5 },
      score,
      submittedAt: submittedAt || new Date().toISOString(),
      createdAt: new Date(),
      source: "framer-quiz",
      ip: req.headers.get("x-forwarded-for") || "unknown",
      userAgent: req.headers.get("user-agent"),
    }

    const result = await db.collection("leads").insertOne(leadData)

    return new Response(
      JSON.stringify({
        success: true,
        id: result.insertedId,
        score: score,
      }),
      {
        status: 200,
        headers: corsHeaders(),
      }
    )
  } catch (error) {
    console.error("API ERROR:", error)

    return new Response(
      JSON.stringify({
        success: false,
        message: "Internal Server Error",
      }),
      {
        status: 500,
        headers: corsHeaders(),
      }
    )
  }
}
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url)

    const page = parseInt(searchParams.get("page")) || 1
    const limit = parseInt(searchParams.get("limit")) || 20
    const search = searchParams.get("search") || ""

    const skip = (page - 1) * limit

    const client = await clientPromise
    const db = client.db("kayakalap")

    // 🔍 SEARCH FILTER
    let query = {}

    if (search) {
      query = {
        $or: [
          { name: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
          { whatsapp: { $regex: search, $options: "i" } },
        ],
      }
    }

    // 📊 FETCH DATA
    const leads = await db
      .collection("leads")
      .find(query)
      .sort({ createdAt: -1 }) // latest first
      .skip(skip)
      .limit(limit)
      .toArray()

    // 📊 TOTAL COUNT
    const total = await db.collection("leads").countDocuments(query)

    const pages = Math.ceil(total / limit)

    return new Response(
      JSON.stringify({
        success: true,
        data: leads,
        page,
        pages,
        total,
      }),
      {
        status: 200,
        headers: corsHeaders(),
      }
    )
  } catch (error) {
    console.error("GET API ERROR:", error)

    return new Response(
      JSON.stringify({
        success: false,
        message: "Internal Server Error",
      }),
      {
        status: 500,
        headers: corsHeaders(),
      }
    )
  }
}

// ✅ HANDLE PREFLIGHT (IMPORTANT)
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: corsHeaders(),
  })
}

// ✅ CORS HEADERS
function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  }
}