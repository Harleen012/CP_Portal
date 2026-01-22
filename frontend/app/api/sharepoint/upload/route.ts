import { NextResponse } from "next/server"

const FLASK = process.env.FLASK_BACKEND_URL || "http://127.0.0.1:5050"

async function callFlask(path: string, token: string, init?: RequestInit) {
  const res = await fetch(`${FLASK}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(init?.headers || {}),
    },
    cache: "no-store",
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

function normalize(s: string) {
  return s.trim().toLowerCase()
}

export async function POST(req: Request) {
  try {
    const auth = req.headers.get("authorization")
    if (!auth?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Missing Authorization" }, { status: 401 })
    }
    const token = auth.replace("Bearer ", "").trim()

    const form = await req.formData()
    const uploadLibraryName = form.get("uploadLibraryName")
    const file = form.get("file")

    if (!uploadLibraryName || typeof uploadLibraryName !== "string") {
      return NextResponse.json({ error: "uploadLibraryName is required" }, { status: 400 })
    }
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "file is required" }, { status: 400 })
    }

    // STEP 1: site
    const site = await callFlask("/sharepoint/site", token)

    // STEP 2: libraries
    const libraries = await callFlask(`/sharepoint/${site.site_id}/libraries`, token)

    // STEP 3: find upload library by name
    const uploadLib = (libraries || []).find((d: any) => normalize(d.name || "") === normalize(uploadLibraryName))

    if (!uploadLib?.id) {
      return NextResponse.json(
        { error: `Upload library not found: ${uploadLibraryName}`, available: (libraries || []).map((x: any) => x.name) },
        { status: 404 }
      )
    }

    // STEP 4: Forward file to Flask upload endpoint
    const forward = new FormData()
    forward.append("file", file, file.name)

    const result = await callFlask(
      `/sharepoint/${site.site_id}/libraries/${uploadLib.id}/upload`,
      token,
      { method: "POST", body: forward }
    )

    return NextResponse.json({ site, library: uploadLib, uploaded: result })
  } catch (e: any) {
    return NextResponse.json({ error: "Upload failed", details: e?.message || String(e) }, { status: 500 })
  }
}
