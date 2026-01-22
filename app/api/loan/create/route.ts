// app/api/loan/create/route.ts
import { NextResponse } from "next/server";

const FASTAPI_BASE = process.env.FASTAPI_BASE_URL || "http://127.0.0.1:9001";

export async function POST(req: Request) {
  try {
    // ── 1. Extract & validate Bearer token ───────────────────────────────
    const authHeader = req.headers.get("authorization");

    if (!authHeader) {
      console.error("[/api/loan/create] No Authorization header received");
      return NextResponse.json({ error: "Missing Authorization header" }, { status: 401 });
    }

    if (!authHeader.startsWith("Bearer ")) {
      console.error("[/api/loan/create] Authorization header does not start with 'Bearer '");
      return NextResponse.json({ error: "Invalid auth header format (must be Bearer)" }, { status: 401 });
    }

    const token = authHeader.replace("Bearer ", "").trim();

    if (!token || token.length < 50) {  // rough check for valid JWT length
      console.error("[/api/loan/create] Bearer token is empty or too short");
      return NextResponse.json({ error: "Invalid or empty Bearer token" }, { status: 401 });
    }

    console.log("[/api/loan/create] Bearer token parsed successfully (first 20 chars):", token.substring(0, 20) + "...");

    // ── 2. Parse request body safely ─────────────────────────────────────
    let bodyData;
    try {
      bodyData = await req.json();
      console.log("[/api/loan/create] Payload received:", bodyData);
    } catch (jsonErr) {
      console.error("[/api/loan/create] Body JSON parse failed:", jsonErr);
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    // ── 3. Forward to FastAPI with exact same token ──────────────────────
    const fastapiRes = await fetch(`${FASTAPI_BASE}/create-loan`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,   // ← token is passed correctly
        "Content-Type": "application/json",
      },
      body: JSON.stringify(bodyData),
      cache: "no-store",
    });

    console.log("[/api/loan/create] FastAPI returned status:", fastapiRes.status);

    // ── 4. Handle FastAPI errors ─────────────────────────────────────────
    if (!fastapiRes.ok) {
      let errorBody = {};
      try {
        errorBody = await fastapiRes.json();
      } catch {
        errorBody = { raw: await fastapiRes.text() || "No response body" };
      }

      console.error("[/api/loan/create] FastAPI failed →", fastapiRes.status, errorBody);

      return NextResponse.json(
        {
          error: "FastAPI request failed",
          fastapiStatus: fastapiRes.status,
          details: errorBody,
        },
        { status: fastapiRes.status }
      );
    }

    // ── 5. Parse successful response ─────────────────────────────────────
    let data;
    try {
      data = await fastapiRes.json();
      console.log("[/api/loan/create] FastAPI success →", data);
    } catch (parseErr) {
      console.error("[/api/loan/create] Failed to parse FastAPI JSON:", parseErr);
      return NextResponse.json({ error: "Invalid JSON from FastAPI" }, { status: 500 });
    }

    // ── 6. Validate itemId exists ────────────────────────────────────────
    if (!data?.itemId) {
      console.error("[/api/loan/create] Missing itemId in FastAPI response");
      return NextResponse.json({ error: "Backend did not return itemId" }, { status: 500 });
    }

    // ── 7. Success response to frontend ──────────────────────────────────
    return NextResponse.json({ itemId: data.itemId }, { status: 201 });

  } catch (err: any) {
    console.error("[/api/loan/create] Proxy crashed:", err);
    return NextResponse.json(
      { error: "Proxy internal error", details: err.message || "Unknown" },
      { status: 500 }
    );
  }
}