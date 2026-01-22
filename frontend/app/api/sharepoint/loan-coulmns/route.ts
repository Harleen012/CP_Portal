import { NextResponse } from "next/server";

const GRAPH_BASE = "https://graph.microsoft.com/v1.0";

async function resolveSiteId(accessToken: string) {
  const hostname = process.env.SP_HOSTNAME!;
  const sitePath = process.env.SP_SITE_PATH!;
  const url = `${GRAPH_BASE}/sites/${hostname}:${sitePath}`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) throw new Error(await res.text());
  const data = await res.json();
  return data.id as string;
}

export async function GET(req: Request) {
  try {
    const auth = req.headers.get("authorization") || req.headers.get("Authorization");
    if (!auth || !auth.toLowerCase().startsWith("bearer ")) {
      return NextResponse.json({ error: "Missing Bearer token" }, { status: 401 });
    }

    const accessToken = auth.split(" ")[1];
    const listId = process.env.SP_LOAN_LIST_ID!;
    if (!listId) return NextResponse.json({ error: "Missing SP_LOAN_LIST_ID env" }, { status: 500 });

    const siteId = await resolveSiteId(accessToken);

    const colsRes = await fetch(`${GRAPH_BASE}/sites/${siteId}/lists/${listId}/columns`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!colsRes.ok) {
      return NextResponse.json(
        { error: "Failed to fetch columns", details: await colsRes.text() },
        { status: colsRes.status }
      );
    }

    const colsData = await colsRes.json();

    const choiceColumns = (colsData.value || [])
      .filter((c: any) => c?.choice?.choices?.length)
      .map((c: any) => ({
        name: c.name,
        displayName: c.displayName,
        choices: c.choice.choices,
      }));

    return NextResponse.json({ choiceColumns }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Unknown error" }, { status: 500 });
  }
}
