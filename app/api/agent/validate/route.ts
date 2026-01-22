import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const auth = req.headers.get("authorization") || "";
    if (!auth.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Missing bearer token" }, { status: 401 });
    }

    const body = await req.json();
    const { hostname, siteName, listId, itemId } = body;

    if (!hostname || !siteName || !listId || !itemId) {
      return NextResponse.json({ error: "hostname, siteName, listId, itemId are required" }, { status: 400 });
    }

    const url = `http://127.0.0.1:9001/validate-loan/${hostname}/sites/${siteName}/lists/${listId}/items/${itemId}`;

    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: auth,
      },
    });

    const data = await res.json().catch(() => ({}));

    return NextResponse.json(data, { status: res.status });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Validate API failed" }, { status: 500 });
  }
}
