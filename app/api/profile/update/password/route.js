import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import bcrypt from "bcryptjs"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/authOptions"

export async function PUT(req) {
 const session = await getServerSession(authOptions)

    if (!session ) {
      return Response.json({ unauthorized: true })
    }
  try {

    const { id, password } = await req.json()

    const hash = await bcrypt.hash(password, 10)

    const client = await clientPromise
    const db = client.db("kayakalap")

    await db.collection("users").updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          password: hash,
          lastPasswordChange: new Date()
        }
      }
    )

    return Response.json({ success: true })

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}