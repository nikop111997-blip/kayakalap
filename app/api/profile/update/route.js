import { authOptions } from "@/lib/authOptions"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import { getServerSession } from "next-auth"

export async function PUT(req) {
 const session = await getServerSession(authOptions)

    if (!session ) {
      return Response.json({ unauthorized: true })
    }
  try {

    const { id, name, mobile } = await req.json()

    const client = await clientPromise
    const db = client.db("kayakalap")

    await db.collection("users").updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          name,
          mobile
        }
      }
    )

    return Response.json({ success: true })

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}