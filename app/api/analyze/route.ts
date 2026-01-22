// app/api/compliance/analyze/route.ts
import { NextRequest, NextResponse } from "next/server"

const BACKEND_URL = "http://127.0.0.1:8001"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()

    const response = await fetch(`${BACKEND_URL}/analyze-document`, {
      method: "POST",
      body: formData,
    })

    const data = await response.json()

    return NextResponse.json(data, { status: response.status })
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to reach compliance service" },
      { status: 500 }
    )
  }
}