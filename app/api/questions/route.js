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