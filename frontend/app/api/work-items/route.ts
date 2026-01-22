// // app/api/work-items/route.ts
// import { NextResponse } from "next/server"
// import { getListItems, getLists, pickTaskList, resolveSite } from "@/lib/flaskSharepoint"

// type WorkStatus = "active" | "pending" | "completed"

// function normalizeStatus(fields: Record<string, any>): WorkStatus {
//   const raw =
//     fields.Status ??
//     fields.status ??
//     fields.TaskStatus ??
//     fields.ProgressStatus ??
//     fields.State ??
//     fields.state ??
//     fields["Work Status"] ??
//     ""

//   const v = String(raw).toLowerCase()

//   if (v.includes("complete") || v === "done" || v === "closed") return "completed"
//   if (v.includes("pending") || v.includes("hold") || v.includes("waiting")) return "pending"
//   return "active"
// }

// function pickTitle(fields: Record<string, any>) {
//   return fields.Title || fields.title || fields.TaskTitle || fields.Name || "Untitled"
// }

// function pickDescription(fields: Record<string, any>) {
//   return fields.Description || fields.description || fields.Notes || fields.Comments || ""
// }

// function pickDueDate(fields: Record<string, any>) {
//   return fields.DueDate || fields.Due || fields.Deadline || fields["Due Date"] || null
// }

// function pickPercent(fields: Record<string, any>) {
//   const v = fields.PercentComplete ?? fields.percentComplete ?? fields.Progress ?? null
//   if (v === null || v === undefined || v === "") return null
//   const n = Number(v)
//   return Number.isFinite(n) ? n : null
// }

// function pickAssignee(fields: Record<string, any>) {
//   // If your AssignedStaff is a "Person" field, Graph can return an object depending on column config.
//   const a = fields.AssignedStaff || fields.AssignedTo || fields.Assignee || null
//   if (!a) return null
//   if (typeof a === "string") return a
//   if (typeof a === "object") {
//     return a.displayName || a.email || a.userPrincipalName || null
//   }
//   return null
// }

// export async function GET(req: Request) {
//   try {
//     const auth = req.headers.get("authorization")
//     if (!auth?.startsWith("Bearer ")) {
//       return NextResponse.json({ error: "Missing Authorization header" }, { status: 401 })
//     }
//     const token = auth.replace("Bearer ", "").trim()

//     // STEP 1: Resolve site
//     const site = await resolveSite(token)

//     // STEP 2: Lists
//     const lists = await getLists(token, site.site_id)
//     if (!lists?.length) {
//       return NextResponse.json({ error: "No lists found", site }, { status: 404 })
//     }

//     // Pick list
//     const taskList = pickTaskList(lists)
//     if (!taskList?.list_id) {
//       return NextResponse.json({ error: "Could not determine task list" }, { status: 400 })
//     }

//     // STEP 3: Items (your Flask already uses expand=fields)
//     const raw = await getListItems(token, site.site_id, taskList.list_id)

//     const itemsArray = Array.isArray(raw) ? raw : raw?.value || []
//     const normalized = itemsArray.map((it: any) => {
//       const f = it.fields || {}
//       return {
//         id: String(it.id),
//         title: pickTitle(f),
//         description: pickDescription(f),
//         status: normalizeStatus(f),
//         dueDate: pickDueDate(f),
//         percentComplete: pickPercent(f),
//         assignedTo: pickAssignee(f),
//         rawFields: f,
//       }
//     })

//     return NextResponse.json({
//       site,
//       list: { list_id: taskList.list_id, displayName: taskList.displayName, template: taskList.template },
//       items: normalized,
//     })
//   } catch (e: any) {
//     return NextResponse.json(
//       { error: "Failed to load work items", details: e?.message || String(e) },
//       { status: 500 }
//     )
//   }
// }







// import { NextResponse } from "next/server";

// export async function POST(req: Request) {
//   try {
//     const auth = req.headers.get("authorization") || req.headers.get("Authorization");
//     if (!auth || !auth.toLowerCase().startsWith("bearer ")) {
//       return NextResponse.json({ error: "Missing Bearer token" }, { status: 401 });
//     }

//     const body = await req.json();

//     // Basic validation
//     if (!body?.Title || !body?.Email) {
//       return NextResponse.json(
//         { error: "Title and Email are required" },
//         { status: 400 }
//       );
//     }

//     const flaskBase = process.env.FLASK_API_BASE_URL;
//     if (!flaskBase) {
//       return NextResponse.json({ error: "Missing FLASK_API_BASE_URL env" }, { status: 500 });
//     }

//     const res = await fetch(`${flaskBase}/create-loan`, {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//         Authorization: auth, // ✅ forward the exact bearer token
//       },
//       body: JSON.stringify(body),
//     });

//     const text = await res.text();
//     let data: any = text;
//     try {
//       data = JSON.parse(text);
//     } catch {}

//     if (!res.ok) {
//       return NextResponse.json(
//         { error: "Flask/Graph error", details: data },
//         { status: res.status }
//       );
//     }

//     return NextResponse.json(data, { status: 201 });
//   } catch (e: any) {
//     return NextResponse.json({ error: e?.message || "Unknown error" }, { status: 500 });
//   }
// }









import { NextResponse } from "next/server"

type WorkStatus = "active" | "pending" | "completed"

const FLASK_BASE = process.env.FLASK_BASE_URL || "http://127.0.0.1:5050"

async function callFlask<T>(path: string, token: string, init?: RequestInit): Promise<T> {
  const url = `${FLASK_BASE}${path}`
  const res = await fetch(url, {
    ...init,
    headers: { ...(init?.headers || {}), Authorization: `Bearer ${token}` },
    cache: "no-store",
  })
  const text = await res.text()
  let data: any = null
  try {
    data = text ? JSON.parse(text) : null
  } catch {
    data = text
  }
  if (!res.ok) {
    const details = typeof data === "string" ? data : data?.details || data?.error || data
    throw new Error(`Flask ${path} failed (${res.status}): ${details}`)
  }
  return data as T
}

function normalizeStatus(fields: Record<string, any>): WorkStatus {
  const raw = fields.Status ?? fields.status ?? fields.TaskStatus ?? fields.ProgressStatus ?? fields.State ?? fields.state ?? fields["Work Status"] ?? ""
  const v = String(raw).toLowerCase()
  if (v.includes("complete") || v === "done" || v === "closed") return "completed"
  if (v.includes("pending") || v.includes("hold") || v.includes("waiting")) return "pending"
  return "active"
}

function pickTitle(fields: Record<string, any>) {
  return fields.Title || fields.title || fields.TaskTitle || fields.Name || "Untitled"
}

function pickDescription(fields: Record<string, any>) {
  return fields.Description || fields.description || fields.Notes || fields.Comments || ""
}

function pickDueDate(fields: Record<string, any>) {
  return fields.DueDate || fields.Due || fields.Deadline || fields["Due Date"] || null
}

function pickPercent(fields: Record<string, any>) {
  const v = fields.PercentComplete ?? fields.percentComplete ?? fields.Progress ?? null
  if (v === null || v === undefined || v === "") return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

function pickAssignee(fields: Record<string, any>) {
  const a = fields.AssignedStaff || fields.AssignedTo || fields.Assignee || null
  if (!a) return null
  if (typeof a === "string") return a
  if (typeof a === "object") return a.displayName || a.email || a.userPrincipalName || null
  return null
}

function parseIncludeParam(req: Request) {
  const { searchParams } = new URL(req.url)
  const raw = (searchParams.get("include") || "").trim()
  const set = new Set(raw.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean))
  return {
    lists: set.has("lists"),
    libraries: set.has("libraries"),
    documents: set.has("documents"),
    users: set.has("users"),
    columns: set.has("columns"),
  }
}

export async function GET(req: Request) {
  try {
    const auth = req.headers.get("authorization")
    if (!auth?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Missing Authorization header" }, { status: 401 })
    }
    const token = auth.replace("Bearer ", "").trim()
    const include = parseIncludeParam(req)

    const siteRes = await callFlask<any>(`/sharepoint/site`, token)
    const site = { site_id: siteRes.site_id, displayName: siteRes.displayName, webUrl: siteRes.webUrl }

    const lists = await callFlask<any[]>(`/sharepoint/${encodeURIComponent(site.site_id)}/lists`, token)
    if (!lists?.length) {
      return NextResponse.json({ error: "No lists found", site }, { status: 404 })
    }

    const taskList = lists.find(l => l.displayName?.toLowerCase().includes("task")) || lists[0]
    if (!taskList?.list_id) {
      return NextResponse.json({ error: "Could not determine task list", lists }, { status: 400 })
    }

    let columns: any[] | undefined
    if (include.columns) {
      const colsRes = await callFlask<{ value: any[] }>(`/sharepoint/${encodeURIComponent(site.site_id)}/lists/${encodeURIComponent(taskList.list_id)}/columns`, token)
      columns = colsRes.value || []
    }

    const itemsRes = await callFlask<any[]>(`/sharepoint/${encodeURIComponent(site.site_id)}/lists/${encodeURIComponent(taskList.list_id)}/items`, token)
    const itemsArray = Array.isArray(itemsRes) ? itemsRes : []

    const normalized = itemsArray.map((it: any) => {
      const f = it.fields || {}
      return {
        id: String(it.id),
        title: pickTitle(f),
        description: pickDescription(f),
        status: normalizeStatus(f),
        dueDate: pickDueDate(f),
        percentComplete: pickPercent(f),
        assignedTo: pickAssignee(f),
        rawFields: f,
      }
    })

    let libraries: any[] | undefined
    let users: any[] | undefined

    if (include.libraries) {
      libraries = await callFlask<any[]>(`/sharepoint/${encodeURIComponent(site.site_id)}/libraries`, token)
    }
    if (include.users) {
      users = await callFlask<any[]>(`/graph/users`, token)
    }

    const listPayload = include.lists ? { selected: taskList, all: lists } : { selected: taskList }

    return NextResponse.json({
      site,
      list: listPayload,
      items: normalized,
      ...(include.columns ? { columns } : {}),
      ...(include.libraries ? { libraries } : {}),
      ...(include.users ? { users } : {}),
    })
  } catch (e: any) {
    return NextResponse.json({ error: "Failed to load work items", details: e?.message || String(e) }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const auth = req.headers.get("authorization")
    if (!auth?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Missing Authorization header" }, { status: 401 })
    }
    const token = auth.replace("Bearer ", "").trim()
    const body = await req.json()

    const siteRes = await callFlask<any>(`/sharepoint/site`, token)
    const site = { site_id: siteRes.site_id, displayName: siteRes.displayName, webUrl: siteRes.webUrl }

    const lists = await callFlask<any[]>(`/sharepoint/${encodeURIComponent(site.site_id)}/lists`, token)
    if (!lists?.length) {
      return NextResponse.json({ error: "No lists found", site }, { status: 404 })
    }

    const taskList = lists.find(l => l.displayName?.toLowerCase().includes("task")) || lists[0]
    if (!taskList?.list_id) {
      return NextResponse.json({ error: "Could not determine task list", lists }, { status: 400 })
    }

    const createRes = await callFlask<any>(`/sharepoint/${encodeURIComponent(site.site_id)}/lists/${encodeURIComponent(taskList.list_id)}/items`, token, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })

    return NextResponse.json(createRes, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: "Failed to create work item", details: e?.message || String(e) }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  try {
    const auth = req.headers.get("authorization")
    if (!auth?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Missing Authorization header" }, { status: 401 })
    }
    const token = auth.replace("Bearer ", "").trim()
    const body = await req.json()
    const { id, fields } = body

    if (!id || !fields) {
      return NextResponse.json({ error: "id and fields are required" }, { status: 400 })
    }

    const siteRes = await callFlask<any>(`/sharepoint/site`, token)
    const site = { site_id: siteRes.site_id, displayName: siteRes.displayName, webUrl: siteRes.webUrl }

    const lists = await callFlask<any[]>(`/sharepoint/${encodeURIComponent(site.site_id)}/lists`, token)
    if (!lists?.length) {
      return NextResponse.json({ error: "No lists found", site }, { status: 404 })
    }

    const taskList = lists.find(l => l.displayName?.toLowerCase().includes("task")) || lists[0]
    if (!taskList?.list_id) {
      return NextResponse.json({ error: "Could not determine task list", lists }, { status: 400 })
    }

    const updateUrl = `/sharepoint/${encodeURIComponent(site.site_id)}/lists/${encodeURIComponent(taskList.list_id)}/items/${encodeURIComponent(id)}`
    const updateRes = await callFlask<any>(updateUrl, token, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fields }),
    })

    return NextResponse.json(updateRes)
  } catch (e: any) {
    return NextResponse.json({ error: "Failed to update work item", details: e?.message || String(e) }, { status: 500 })
  }
}
