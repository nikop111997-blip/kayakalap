import { NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/authOptions"

export async function GET(req) {
  const session = await getServerSession(authOptions)
  if(!session){
     return NextResponse.json(
      { message: "You are not auhtorise to access this" },
      { status: 409 }
    )
  }
  const { searchParams } = new URL(req.url)

  const page = parseInt(searchParams.get("page")) || 1
  const limit = parseInt(searchParams.get("limit")) || 5
  const search = searchParams.get("search") || ""

  const client = await clientPromise
  const db = client.db("kayakalap")

  const query = search
    ? { name: { $regex: search, $options: "i" } }
    : {}

  const total = await db.collection("categories").countDocuments(query)

  const data = await db
    .collection("categories")
    .find(query)
    .skip((page - 1) * limit)
    .limit(limit)
    .sort({ createdAt: -1 })
    .toArray()

  return NextResponse.json({
    data,
    total,
    page,
    pages: Math.ceil(total / limit),
  })
}

export async function POST(req) {
  const session = await getServerSession(authOptions)
  if(!session){
     return NextResponse.json(
      { message: "You are not auhtorise to access this" },
      { status: 409 }
    )
  }
  const body = await req.json()
  const { name, slug } = body

  const client = await clientPromise
  const db = client.db("kayakalap")

  const existing = await db.collection("categories").findOne({
    slug: slug.trim(),
  })

  if (existing) {
    return NextResponse.json(
      { message: "Slug already exists" },
      { status: 400 }
    )
  }

  await db.collection("categories").insertOne({
    name: name.trim(),
    slug: slug.trim(),
    createdAt: new Date(),
  })

  return NextResponse.json({ success: true })
}