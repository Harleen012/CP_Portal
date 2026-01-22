// // lib/msalToken.ts
// export function getMsalAccessTokenFromSessionStorage(): string | null {
//   if (typeof window === "undefined") return null
//   const nowSec = Math.floor(Date.now() / 1000)

//   const candidates: Array<{ secret: string; expiresOn?: number }> = []

//   for (let i = 0; i < sessionStorage.length; i++) {
//     const key = sessionStorage.key(i)
//     if (!key) continue
//     if (!key.toLowerCase().startsWith("msal")) continue

//     const value = sessionStorage.getItem(key)
//     if (!value || value[0] !== "{") continue

//     try {
//       const obj = JSON.parse(value)
//       if (obj?.credentialType !== "AccessToken") continue
//       if (!obj?.secret || typeof obj.secret !== "string") continue

//       const exp = obj.expiresOn ? Number(obj.expiresOn) : undefined
//       candidates.push({ secret: obj.secret, expiresOn: Number.isFinite(exp) ? exp : undefined })
//     } catch {}
//   }

//   if (!candidates.length) return null

//   const valid = candidates.filter((c) => !c.expiresOn || c.expiresOn > nowSec + 60)
//   if (valid.length) {
//     valid.sort((a, b) => (b.expiresOn || 0) - (a.expiresOn || 0))
//     return valid[0].secret
//   }

//   candidates.sort((a, b) => (b.expiresOn || 0) - (a.expiresOn || 0))
//   return candidates[0].secret
// }







// lib/msalToken.ts

import { msalConfig } from "@/lib/msalConfig";
import { PublicClientApplication } from "@azure/msal-browser";

// Create an instance of MSAL PublicClientApplication
const msalInstance = new PublicClientApplication(msalConfig);

// Global promise to ensure initialization happens only once
let initializePromise: Promise<void> | null = null;

async function ensureInitialized() {
  if (!initializePromise) {
    initializePromise = msalInstance.initialize();
  }
  await initializePromise;
}

export function getMsalAccessTokenFromSessionStorage(): string | null {
  // Ensure this runs only in the browser environment (for Next.js or SSR apps)
  if (typeof window === "undefined") return null;

  const nowSec = Math.floor(Date.now() / 1000);  // Current time in seconds
  const candidates: Array<{ secret: string; expiresOn?: number }> = [];  // Array to store token candidates

  // Iterate through sessionStorage to find MSAL tokens
  for (let i = 0; i < sessionStorage.length; i++) {
    const key = sessionStorage.key(i);  // Get each key in sessionStorage
    if (!key || !key.toLowerCase().startsWith("msal")) continue;  // Skip non-MSAL keys

    const value = sessionStorage.getItem(key);  // Get the value of the sessionStorage item
    if (!value || value[0] !== "{") continue;  // Skip invalid values

    try {
      const obj = JSON.parse(value);  // Parse the JSON object
      if (obj?.credentialType !== "AccessToken") continue;  // Only process access tokens
      if (!obj?.secret || typeof obj.secret !== "string") continue;  // Ensure the token secret is a valid string

      const exp = obj.expiresOn ? Number(obj.expiresOn) : undefined;  // Check for expiration timestamp
      candidates.push({ secret: obj.secret, expiresOn: Number.isFinite(exp) ? exp : undefined });
    } catch (err) {
      console.error("Error parsing token in sessionStorage", err);  // Log any parsing errors
    }
  }

  if (!candidates.length) return null;  // If no tokens are found, return null

  // Filter out expired tokens (allow a small buffer of 60 seconds)
  const valid = candidates.filter((c) => !c.expiresOn || c.expiresOn > nowSec + 60);
  if (valid.length) {
    // Sort valid tokens by expiration time (most recent first)
    valid.sort((a, b) => (b.expiresOn || 0) - (a.expiresOn || 0));
    return valid[0].secret;  // Return the valid token with the latest expiration time
  }

  // If no valid tokens, return the most recently expired token (as a fallback)
  candidates.sort((a, b) => (b.expiresOn || 0) - (a.expiresOn || 0));
  return candidates[0].secret;  // Return the most recently expired token (fallback)
}

// New function to refresh the token silently if it is expired
export async function refreshAccessToken() {
  try {
    // Ensure MSAL is initialized before any API calls
    await ensureInitialized();

    // Check if the user is signed in
    const currentAccount = msalInstance.getAllAccounts()[0];
    if (!currentAccount) {
      console.error("No signed-in user found.");
      return null;
    }

    // Attempt to acquire a new token silently
    const response = await msalInstance.acquireTokenSilent({
      scopes: ["User.Read", "Sites.Manage.All", "openid", "offline_access"],  // Add required scopes
      account: currentAccount,
    });

    return response.accessToken;  // Return the new access token
  } catch (error) {
    console.error("Error refreshing access token:", error);
    return null;  // Return null if the token couldn't be refreshed
  }
}