import { NextResponse } from "next/server"

const FLASK = process.env.FLASK_BACKEND_URL || "http://127.0.0.1:5050"

async function callFlask(path: string, token: string) {
  const res = await fetch(`${FLASK}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export async function GET(req: Request) {
  try {
    const auth = req.headers.get("authorization")
    if (!auth?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Missing Authorization" }, { status: 401 })
    }
    const token = auth.replace("Bearer ", "").trim()

    // STEP 1: site
    const site = await callFlask("/sharepoint/site", token)

    // STEP 2: libraries
    const libraries = await callFlask(`/sharepoint/${site.site_id}/libraries`, token)

    return NextResponse.json({ site, libraries })
  } catch (e: any) {
    return NextResponse.json({ error: "Failed", details: e?.message || String(e) }, { status: 500 })
  }
}
