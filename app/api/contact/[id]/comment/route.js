import { ObjectId } from "mongodb"
import clientPromise from "@/lib/mongodb"
export async function POST(req, { params }) {
  try {
    const { id } = await params
    const { text } = await req.json()

    if (!text) {
      return Response.json({ error: "Comment required" }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db("kayakalap")

    const comment = {
      id: Date.now(),
      text,
      date: new Date()
    }

    await db.collection("contacts").updateOne(
      { _id: new ObjectId(id) },
      { $push: { comments: comment } }
    )

    return Response.json({ success: true })

  } catch (error) {
    console.error(error)
    return Response.json({ error: true })
  }
}