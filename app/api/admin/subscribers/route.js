import clientPromise from "@/lib/mongodb"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/authOptions"

export async function GET(req) {
  try {

    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== "admin") {
      return Response.json({ unauthorized: true })
    }

    const { searchParams } = new URL(req.url)

    const page = parseInt(searchParams.get("page")) || 1
    const limit = parseInt(searchParams.get("limit")) || 20
    const search = searchParams.get("search") || ""

    const skip = (page - 1) * limit

    const client = await clientPromise
    const db = client.db("kayakalap")

    const query = search
      ? {
          $or: [
            { email: { $regex: search, $options: "i" } },
            { ip: { $regex: search, $options: "i" } }
          ]
        }
      : {}

    const subscribers = await db
      .collection("newsletter")
      .find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray()

    const total = await db.collection("subscribers").countDocuments(query)

    const pages = Math.ceil(total / limit)

    return Response.json({
      data: subscribers,
      pages
    })

  } catch (error) {

    console.error(error)

    return Response.json({ error: true })
  }
}