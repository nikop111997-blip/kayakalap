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
            { firstName: { $regex: search, $options: "i" } },
            { lastName: { $regex: search, $options: "i" } },
            { email: { $regex: search, $options: "i" } },
            { phone: { $regex: search, $options: "i" } },
            { ip: { $regex: search, $options: "i" } }
          ]
        }
      : {}

    const contacts = await db
      .collection("contacts")
      .find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray()

    const total = await db.collection("contacts").countDocuments(query)

    const pages = Math.ceil(total / limit)

    return Response.json({
      data: contacts,
      pages
    })

  } catch (error) {

    console.error(error)

    return Response.json({ error: true })

  }

}
export async function POST(req) {
  try {
    const body = await req.json()

    const {
      firstName,
      lastName,
      email,
      phone,
      message,
    } = body

    // ================= TRIM VALUES =================
    const trimmedEmail = email?.trim()
    const trimmedPhone = phone?.trim()

    // ================= VALIDATION =================
    if (
      !firstName?.trim() ||
      !lastName?.trim() ||
      !trimmedEmail ||
      !trimmedPhone ||
      !message?.trim()
    ) {
      return Response.json(
        { success: false, error: "All fields are required." },
        { status: 400 }
      )
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(trimmedEmail)) {
      return Response.json(
        { success: false, error: "Invalid email format." },
        { status: 400 }
      )
    }

    // Indian phone validation
    const phoneRegex = /^[6-9]\d{9}$/
    if (!phoneRegex.test(trimmedPhone)) {
      return Response.json(
        { success: false, error: "Invalid mobile number." },
        { status: 400 }
      )
    }

    // ================= GET IP ADDRESS =================
    const forwarded = req.headers.get("x-forwarded-for")
    const ip = forwarded
      ? forwarded.split(",")[0]
      : req.headers.get("x-real-ip") || "Unknown"

    const userAgent = req.headers.get("user-agent") || "Unknown"

    // ================= SAVE TO DB =================
    const client = await clientPromise
    const db = client.db("kayakalap")

    const result = await db.collection("contacts").insertOne({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: trimmedEmail,
      phone: trimmedPhone,
      message: message.trim(),
      ip,
      userAgent,
      createdAt: new Date(),
    })

    return Response.json(
      {
        success: true,
        insertedId: result.insertedId,
      },
      { status: 201 }
    )

  } catch (error) {
    return Response.json(
      {
        success: false,
        error: "Server error. Please try again later.",
      },
      { status: 500 }
    )
  }
}