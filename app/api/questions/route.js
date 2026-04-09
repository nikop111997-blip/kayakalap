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

    // ✅ Validation
    if (!name || !email || !whatsapp) {
      return Response.json(
        { success: false, message: "Missing required fields" },
        { status: 400 }
      )
    }

    const client = await clientPromise
    const db = client.db("kayakalap")

    // ✅ Save EVERYTHING
    const leadData = {
      name,
      email,
      whatsapp,
      age,
      schedule,
      frustration,

      answers: {
        q1,
        q2,
        q3,
        q4,
        q5,
      },

      score,
      submittedAt: submittedAt || new Date().toISOString(),
      createdAt: new Date(),

      // 🔥 extra useful fields
      source: "framer-quiz",
      ip: req.headers.get("x-forwarded-for") || "unknown",
      userAgent: req.headers.get("user-agent"),
    }

    const result = await db.collection("leads").insertOne(leadData)

    return Response.json({
      success: true,
      id: result.insertedId,
      score: score,
    })
  } catch (error) {
    console.error("API ERROR:", error)

    return Response.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 }
    )
  }
}