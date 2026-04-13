export async function POST(req) {
  try {
    const { name, mobile } = await req.json()

    const client = await clientPromise
    const db = client.db("kayakalap")

    await db.collection("chatbotenquiry").updateOne(
      { mobile },
      { $set: { name, mobile, updatedAt: new Date() } },
      { upsert: true }
    )

    return new Response(
      JSON.stringify({ success: true }),
      {
        status: 200,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      }
    )

  } catch (error) {
    console.error("DB Error:", error)

    return new Response(
      JSON.stringify({ error: "Database error" }),
      {
        status: 500,
        headers: {
          "Access-Control-Allow-Origin": "*",
        },
      }
    )
  }
}

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