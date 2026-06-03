import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import { NextResponse } from "next/server"

export async function PUT(req, { params }) {

  try {

    const { id } = await params

    const body = await req.json()

    const client = await clientPromise

    const db = client.db("kayakalap")

    await db.collection("testimonials").updateOne(
      {
        _id: new ObjectId(id)
      },
      {
        $set: {
          name: body.name,
          testimonial: body.testimonial,
          age: body.age,
          location: body.location,
          youtubeUrl: body.youtubeUrl,
          updatedAt: new Date()
        }
      }
    )

    return NextResponse.json({
      success: true
    })

  } catch (error) {

    console.error(error)

    return NextResponse.json(
      {
        error: "Failed to update testimonial"
      },
      {
        status: 500
      }
    )

  }

}