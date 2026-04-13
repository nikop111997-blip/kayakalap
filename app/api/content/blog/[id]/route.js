import { ObjectId } from "mongodb"
import { NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"

//
// ================= GET SINGLE BLOG =================
//
export async function GET(req, { params }) {
  try {
    const { id } = await params

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { message: "Invalid blog ID" },
        { status: 400 }
      )
    }

    const client = await clientPromise
    const db = client.db("kayakalap")

    const blog = await db.collection("blogs").findOne({
      _id: new ObjectId(id),
      isDeleted: { $ne: true },
    })

    if (!blog) {
      return NextResponse.json(
        { message: "Blog not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(blog)
  } catch (error) {
    console.error("GET Blog Error:", error)

    return NextResponse.json(
      { message: "Failed to fetch blog" },
      { status: 500 }
    )
  }
}

//
// ================= UPDATE BLOG =================
//
export async function PUT(req, { params }) {
  try {
    const { id } = await params
    const body = await req.json()

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { message: "Invalid blog ID" },
        { status: 400 }
      )
    }

    const client = await clientPromise
    const db = client.db("kayakalap")

    // 🔥 Check if blog exists & not deleted
    const existingBlog = await db.collection("blogs").findOne({
      _id: new ObjectId(id),
      isDeleted: { $ne: true },
    })

    if (!existingBlog) {
      return NextResponse.json(
        { message: "Blog not found" },
        { status: 404 }
      )
    }

    // 🔥 Check duplicate slug (if slug changed)
    if (body.slug && body.slug !== existingBlog.slug) {
      const slugExists = await db.collection("blogs").findOne({
        slug: body.slug,
        _id: { $ne: new ObjectId(id) },
        isDeleted: { $ne: true },
      })

      if (slugExists) {
        return NextResponse.json(
          { message: "Slug already exists" },
          { status: 409 }
        )
      }
    }

    await db.collection("blogs").updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          ...body,
          updatedAt: new Date(),
        },
      }
    )

    return NextResponse.json({
      success: true,
      message: "Blog updated successfully",
    })
  } catch (error) {
    console.error("Update Blog Error:", error)

    return NextResponse.json(
      { message: "Update failed" },
      { status: 500 }
    )
  }
}

//
// ================= SOFT DELETE BLOG =================
//
export async function DELETE(req, { params }) {
  try {
    const { id } = await params

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { message: "Invalid blog ID" },
        { status: 400 }
      )
    }

    const client = await clientPromise
    const db = client.db("aurette")

    const result = await db.collection("blogs").updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          isDeleted: true,
          deletedAt: new Date(),
        },
      }
    )

    if (!result.matchedCount) {
      return NextResponse.json(
        { message: "Blog not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "Blog deleted successfully",
    })
  } catch (error) {
    console.error("Delete Blog Error:", error)

    return NextResponse.json(
      { message: "Delete failed" },
      { status: 500 }
    )
  }
}