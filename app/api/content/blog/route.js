import { NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"

// ================= CREATE BLOG =================
export async function POST(req) {
  try {
    const body = await req.json()

    const {
      title,
      slug,
      status,
      category,
      content,
      metaTitle,
      metaDescription,
      featuredImage,
      featuredImageKey,
      featuredImageAlt,
      featuredImageTitle,
    } = body

    if (!title || !slug) {
      return NextResponse.json(
        { message: "Title and slug are required" },
        { status: 400 }
      )
    }

    const client = await clientPromise
    const db = client.db("kayakalap")

    // 🔥 Check duplicate slug
    const existing = await db.collection("blogs").findOne({ slug })

    if (existing) {
      return NextResponse.json(
        { message: "Slug already exists" },
        { status: 409 }
      )
    }

    await db.collection("blogs").insertOne({
      title,
      slug,
      status: status || "draft",
      category,
      content,
      metaTitle,
      metaDescription,
      featuredImage,
      featuredImageKey,
      featuredImageAlt,
      featuredImageTitle,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    return NextResponse.json({
      success: true,
      message: "Blog created successfully",
    })
  } catch (error) {
    console.error("Create Blog Error:", error)
    return NextResponse.json(
      { message: "Server error" },
      { status: 500 }
    )
  }
}

// ================= GET ALL BLOGS =================
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url)

    const search = searchParams.get("search") || ""
    const status = searchParams.get("status") || ""
    const category = searchParams.get("category") || ""
    const page = Math.max(parseInt(searchParams.get("page")) || 1, 1)
    const limit = Math.max(parseInt(searchParams.get("limit")) || 10, 1)

    const skip = (page - 1) * limit

    const client = await clientPromise
    const db = client.db("kayakalap")

    // 🔥 Base filter (exclude soft deleted)
    const filter = {
      isDeleted: { $ne: true },
    }

    // 🔍 Search filter
    if (search) {
      filter.title = {
        $regex: search,
        $options: "i",
      }
    }

    // 🔎 Status filter (optional)
    if (status) {
      filter.status = status
    }

    // 🗂 Category filter (optional)
    if (category) {
      filter.category = category
    }

    // 📊 Total count
    const total = await db
      .collection("blogs")
      .countDocuments(filter)

    const blogs = await db
      .collection("blogs")
      .find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray()

    const pages = Math.ceil(total / limit)

    return NextResponse.json({
      data: blogs,
      total,
      page,
      pages,
    })
  } catch (error) {
    console.error("Fetch Blogs Error:", error)

    return NextResponse.json(
      { message: "Failed to fetch blogs" },
      { status: 500 }
    )
  }
}