import { NextResponse } from "next/server"

export async function GET() {
  try {
    const csv = `name,email,phone,program,goal
John Doe,john@example.com,9876543210,Pro,Lose Weight / Burn Fat
Jane Smith,jane@example.com,9123456780,Elite,Build Muscle & Strength`

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": "attachment; filename=sample-leads.csv"
      }
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: true })
  }
}