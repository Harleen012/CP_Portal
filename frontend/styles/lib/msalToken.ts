// lib/msalToken.ts
export function getMsalAccessTokenFromSessionStorage(): string | null {
  if (typeof window === "undefined") return null
  const nowSec = Math.floor(Date.now() / 1000)

  const candidates: Array<{ secret: string; expiresOn?: number }> = []

  for (let i = 0; i < sessionStorage.length; i++) {
    const key = sessionStorage.key(i)
    if (!key) continue
    if (!key.toLowerCase().startsWith("msal")) continue

    const value = sessionStorage.getItem(key)
    if (!value || value[0] !== "{") continue

    try {
      const obj = JSON.parse(value)
      if (obj?.credentialType !== "AccessToken") continue
      if (!obj?.secret || typeof obj.secret !== "string") continue

      const exp = obj.expiresOn ? Number(obj.expiresOn) : undefined
      candidates.push({ secret: obj.secret, expiresOn: Number.isFinite(exp) ? exp : undefined })
    } catch {}
  }

  if (!candidates.length) return null

  const valid = candidates.filter((c) => !c.expiresOn || c.expiresOn > nowSec + 60)
  if (valid.length) {
    valid.sort((a, b) => (b.expiresOn || 0) - (a.expiresOn || 0))
    return valid[0].secret
  }

  candidates.sort((a, b) => (b.expiresOn || 0) - (a.expiresOn || 0))
  return candidates[0].secret
}
