import clientPromise from "@/lib/mongodb";
import { NextResponse } from "next/server";


// 🔹 CREATE TESTIMONIAL
export async function POST(req) {
  try {
    const body = await req.json();

    const {
      name,
      testimonial,
      age,
      location,
      youtubeUrl,
      image,
    } = body;

    // ✅ Validation
    if (!name || !testimonial) {
      return NextResponse.json(
        {
          error: "Name and testimonial are required",
        },
        { status: 400 }
      );
    }

    // ✅ MongoDB Connection
    const client = await clientPromise;

    const db = client.db("kayakalap"); // default DB

    // ✅ Insert Data
    const result = await db.collection("testimonials").insertOne({
      name,
      testimonial,
      age: age || "",
      location: location || "",
      youtubeUrl: youtubeUrl || "",
      image: image || "",
      createdAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      insertedId: result.insertedId,
    });

  } catch (error) {
    console.error("Create Testimonial Error:", error);

    return NextResponse.json(
      {
        error: "Failed to create testimonial",
      },
      { status: 500 }
    );
  }
}


// 🔹 GET TESTIMONIALS
export async function GET(req) {

  try {

    const { searchParams } = new URL(req.url)

    const page = Number(searchParams.get("page")) || 1
    const limit = Number(searchParams.get("limit")) || 20
    const search = searchParams.get("search") || ""

    const skip = (page - 1) * limit

    const client = await clientPromise

    const db = client.db("kayakalap")

    const query = search
      ? {
          $or: [
            {
              name: {
                $regex: search,
                $options: "i"
              }
            },
            {
              testimonial: {
                $regex: search,
                $options: "i"
              }
            },
            {
              location: {
                $regex: search,
                $options: "i"
              }
            }
          ]
        }
      : {}

    const total = await db
      .collection("testimonials")
      .countDocuments(query)

    const data = await db
      .collection("testimonials")
      .find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray()

    return NextResponse.json({
      data,
      total,
      pages: Math.ceil(total / limit),
    })

  } catch (error) {

    console.error(error)

    return NextResponse.json(
      {
        error: "Failed to fetch testimonials"
      },
      {
        status: 500
      }
    )

  }

}