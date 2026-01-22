import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const { documentId, accessToken } = await req.json()

    if (!documentId || !accessToken) {
      return NextResponse.json(
        { error: "documentId or accessToken missing" },
        { status: 400 }
      )
    }

    // ✅ STEP 1: Get site
    const siteRes = await fetch(
      "http://127.0.0.1:5050/sharepoint/site",
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    )
    if (!siteRes.ok) {
      const error = await siteRes.json();
      throw new Error(error?.error || "Failed to get site");
    }
    const site = await siteRes.json()

    // ✅ STEP 2: Get libraries
    const libsRes = await fetch(
      `http://127.0.0.1:5050/sharepoint/${site.site_id}/libraries`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    )
    if (!libsRes.ok) {
      const error = await libsRes.json();
      throw new Error(error?.error || "Failed to get libraries");
    }
    const libraries = await libsRes.json()

    // ✅ STEP 3: Find Documents library
    const documentsLibrary = libraries.find(
      (l: any) => l.name === "Documents"
    )
    if (!documentsLibrary) {
      throw new Error("Documents library not found");
    }

    // ✅ STEP 3.5: Get document metadata to fetch filename
    const metadataUrl = `https://graph.microsoft.com/v1.0/sites/${site.site_id}/drives/${documentsLibrary.id}/items/${documentId}`;
    const metadataRes = await fetch(metadataUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    if (!metadataRes.ok) {
      const error = await metadataRes.json();
      throw new Error(error?.error?.message || "Failed to get document metadata");
    }
    const metadata = await metadataRes.json();
    const filename = metadata.name;  // e.g., "document.pdf"

    // ✅ STEP 4: Download file using Graph
    const downloadUrl = `https://graph.microsoft.com/v1.0/sites/${site.site_id}/drives/${documentsLibrary.id}/items/${documentId}/content`

    const downloadRes = await fetch(downloadUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    if (!downloadRes.ok) {
      const error = await downloadRes.json();
      throw new Error(error?.error?.message || "Failed to download document from SharePoint");
    }

    const blob = await downloadRes.blob();

    // ✅ STEP 5: Send file to AI Agent (FastAPI)
    const formData = new FormData();
    formData.append('file', blob, filename);  // Append blob with filename

    const agentUrl = 'http://localhost:5000/analyze-document';
    const agentRes = await fetch(agentUrl, {
      method: 'POST',
      body: formData,
    });

    if (!agentRes.ok) {
      const error = await agentRes.json();
      throw new Error(error?.error || "AI Agent analysis failed");
    }

    const agentData = await agentRes.json();

    // Transform to match frontend expected structure
    const transformedData = {
      documentType: agentData.analysis?.document_type || "Unknown",
      overallAlignment: agentData.alignment_score_percent || 0,
      confidenceLevel: agentData.confidence_level || "N/A",
      ruleAnalysis: agentData.analysis?.rule_alignment?.map((r: any) => ({
        rule: r.rule,
        status: r.status,
        remarks: r.reason  // Matches backend 'reason'
      })) || []
    };

    return NextResponse.json(transformedData);

  } catch (e: any) {
    console.error("Error in analyze-document:", e);
    return NextResponse.json(
      { error: e.message || "Internal error" },
      { status: 500 }
    )
  }
}