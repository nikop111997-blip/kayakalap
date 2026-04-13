
import clientPromise from "@/lib/mongodb"
export async function POST(req) {
  try {
    const body = await req.json()

    const {
      name,
      email,
      phone,
      program,
      goal,
      date,
      referredBy,
      message
    } = body

    if (!name || !email || !phone) {
      return Response.json({ error: "Missing fields" }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db("kayakalap")

    const newLead = {
      name,
      email,
      phone,
      program,
      goal,
      date: date || null,
      referredBy: referredBy || "",
      message: message || "",
      status: "New",
      comments: [],
      createdAt: new Date()
    }

    await db.collection("contacts").insertOne(newLead)

    return Response.json({ success: true })

  } catch (error) {
    console.error(error)
    return Response.json({ error: true })
  }
}