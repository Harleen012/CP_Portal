// lib/flaskSharepoint.ts
type SiteInfo = { site_id: string; displayName: string; webUrl: string }
type ListInfo = { list_id: string; displayName?: string; template?: string }
type GraphListItem = { id: string; fields?: Record<string, any> }

const BACKEND = process.env.FLASK_BACKEND_URL || "http://127.0.0.1:5050"

async function flaskFetch<T>(path: string, token: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BACKEND}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
    cache: "no-store",
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Flask API error ${res.status}: ${text}`)
  }

  return (await res.json()) as T
}

export async function resolveSite(token: string) {
  return flaskFetch<SiteInfo>("/sharepoint/site", token)
}

export async function getLists(token: string, siteId: string) {
  return flaskFetch<ListInfo[]>(`/sharepoint/${siteId}/lists`, token)
}

export async function getListItems(token: string, siteId: string, listId: string) {
  return flaskFetch<any>(`/sharepoint/${siteId}/lists/${listId}/items`, token)
}

/**
 * Pick your "Tasks" list here.
 * Update `includes("task")` if your list is named differently (eg "CPA Tasks").
 */
export function pickTaskList(lists: ListInfo[]) {
  const byName =
    lists.find((l) => (l.displayName || "").toLowerCase() === "tasks") ||
    lists.find((l) => (l.displayName || "").toLowerCase().includes("task"))

  return byName || lists[0]
}
