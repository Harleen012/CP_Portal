// lib/activityStore.ts
export type ActivityType = "UPLOAD" | "EDIT" | "SYSTEM"

export type ActivityRecord = {
  id: string
  type: ActivityType
  title: string
  description: string
  createdAt: number // epoch ms
}

const KEY = "app_activities_v1"

function readAll(): ActivityRecord[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeAll(list: ActivityRecord[]) {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(KEY, JSON.stringify(list.slice(0, 200)))
  } catch {
    // ignore
  }
}

export function trackActivity(input: Omit<ActivityRecord, "id" | "createdAt">) {
  const list = readAll()
  const record: ActivityRecord = {
    id: crypto?.randomUUID?.() ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
    createdAt: Date.now(),
    ...input,
  }
  writeAll([record, ...list])
  return record
}

export function getActivities(limit = 10): ActivityRecord[] {
  return readAll().slice(0, limit)
}

export function clearActivities() {
  writeAll([])
}

/** ✅ This is what your Dashboard imports */
export function formatTime(ts: number) {
  const d = new Date(ts)
  return d.toLocaleString()
}
