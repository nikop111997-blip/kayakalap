import { NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/authOptions"

export async function PUT(req, { params }) {
  const session = await getServerSession(authOptions)
  if(!session){
     return NextResponse.json(
      { message: "You are not auhtorise to access this" },
      { status: 409 }
    )
  }
  const { id } = await params
  const body = await req.json()
  const { name, slug } = body

  const client = await clientPromise
  const db = client.db("kayakalap")

  const existing = await db.collection("categories").findOne({
    slug: slug.trim(),
    _id: { $ne: new ObjectId(id) },
  })

  if (existing) {
    return NextResponse.json(
      { message: "Slug already exists" },
      { status: 400 }
    )
  }

  await db.collection("categories").updateOne(
    { _id: new ObjectId(id) },
    { $set: { name, slug } }
  )

  return NextResponse.json({ success: true })
}

export async function DELETE(req, { params }) {
  const session = await getServerSession(authOptions)
  if(!session){
     return NextResponse.json(
      { message: "You are not auhtorise to access this" },
      { status: 409 }
    )
  }
  const { id } = await params

  const client = await clientPromise
  const db = client.db("kayakalap")

  await db.collection("categories").deleteOne({
    _id: new ObjectId(id),
  })

  return NextResponse.json({ success: true })
}