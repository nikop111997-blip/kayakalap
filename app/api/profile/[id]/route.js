import { authOptions } from "@/lib/authOptions"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import { getServerSession } from "next-auth"

export async function GET(req, { params }) {
     const session = await getServerSession(authOptions)
    
        if (!session) {
          return Response.json({ unauthorized: true })
        }
  try {

    const { id } = await params

    const client = await clientPromise
    const db = client.db("kayakalap")

    const user = await db.collection("users").findOne(
      { _id: new ObjectId(id) },
      { projection: { password: 0 } }
    )

    if (!user) {
      return Response.json({ error: "User not found" }, { status: 404 })
    }

    return Response.json(user)

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}