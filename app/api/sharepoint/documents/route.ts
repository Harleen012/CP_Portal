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

function normalize(s: string) {
  return s.trim().toLowerCase()
}

export async function GET(req: Request) {
  try {
    const auth = req.headers.get("authorization")
    if (!auth?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Missing Authorization" }, { status: 401 })
    }
    const token = auth.replace("Bearer ", "").trim()

    const { searchParams } = new URL(req.url)
    const libraryName = searchParams.get("libraryName")
    if (!libraryName) {
      return NextResponse.json({ error: "libraryName is required" }, { status: 400 })
    }

    // STEP 1: site
    const site = await callFlask("/sharepoint/site", token)

    // STEP 2: libraries
    const libraries = await callFlask(`/sharepoint/${site.site_id}/libraries`, token)

    // STEP 3: find drive by name
    const target = (libraries || []).find((d: any) => normalize(d.name || "") === normalize(libraryName))

    if (!target?.id) {
      return NextResponse.json(
        { error: `Library not found: ${libraryName}`, available: (libraries || []).map((x: any) => x.name) },
        { status: 404 }
      )
    }

    // STEP 4: list documents
    // const documents = await callFlask(`/sharepoint/${site.site_id}/libraries/${target.id}/documents`, token)

    // return NextResponse.json({ site, library: target, documents })
    const rawDocuments = await callFlask(
  `/sharepoint/${site.site_id}/libraries/${target.id}/documents`,
  token
    )
const documents = (rawDocuments || []).map((item: any) => ({
  id: item.id,
  name: item.name,
  webUrl: item.webUrl || item.web_url, 
  folder: !!item.folder,
}))

return NextResponse.json({
  site,
  library: target,
  documents,
})

  } catch (e: any) {
    return NextResponse.json({ error: "Failed", details: e?.message || String(e) }, { status: 500 })
  }
}
