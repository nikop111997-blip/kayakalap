import { NextResponse } from "next/server"
import csv from "csv-parser"
import { Readable } from "stream"
import clientPromise from "@/lib/mongodb"
export async function POST(req) {
  try {
    const formData = await req.formData()
    const file = formData.get("file")

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())

    const results = []

    await new Promise((resolve, reject) => {
      Readable.from(buffer)
        .pipe(csv())
        .on("data", (data) => results.push(data))
        .on("end", resolve)
        .on("error", reject)
    })

    const client = await clientPromise
    const db = client.db("kayakalap")

    const formatted = results.map((r) => ({
      name: r.name,
      email: r.email,
      phone: r.phone,
      program: r.program,
      goal: r.goal,
      status: "New",
      comments: [],
      createdAt: new Date()
    }))

    await db.collection("contacts").insertMany(formatted)

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: true })
  }
}