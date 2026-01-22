// import { NextResponse } from "next/server";

// const GRAPH_BASE = "https://graph.microsoft.com/v1.0";
// const HOSTNAME = "aoscaustralia.sharepoint.com";
// const SITE_PATH = "/sites/CPA";
// const LIST_NAME = "Loan Application";
// const LIBRARY_NAME = "LOAN APPROVALS";

// export async function GET(request: Request) {
//   try {
//     // 1. Get Authorization header (same as your other protected routes)
//     const authHeader = request.headers.get("authorization");
//     if (!authHeader || !authHeader.startsWith("Bearer ")) {
//       return NextResponse.json(
//         { error: "Missing or invalid Authorization header (Bearer token required)" },
//         { status: 401 }
//       );
//     }

//     const token = authHeader.replace("Bearer ", "").trim();

//     const headers = {
//       Authorization: `Bearer ${token}`,
//       Accept: "application/json",
//     };

//     // 2. Resolve SharePoint Site ID
//     const siteUrl = `${GRAPH_BASE}/sites/${HOSTNAME}:${SITE_PATH}`;
//     const siteResponse = await fetch(siteUrl, { headers });

//     if (!siteResponse.ok) {
//       const errorData = await siteResponse.json().catch(() => ({}));
//       return NextResponse.json(
//         {
//           error: "Failed to resolve SharePoint site",
//           details: errorData?.error?.message || siteResponse.statusText,
//           status: siteResponse.status,
//         },
//         { status: siteResponse.status }
//       );
//     }

//     const siteData = await siteResponse.json();
//     const siteId = siteData.id;

//     if (!siteId) {
//       return NextResponse.json(
//         { error: "Site ID not found in response" },
//         { status: 500 }
//       );
//     }

//     // 3. Get all lists in the site → find "Loan Application"
//     const listsUrl = `${GRAPH_BASE}/sites/${siteId}/lists`;
//     const listsResponse = await fetch(listsUrl, { headers });

//     if (!listsResponse.ok) {
//       const errorData = await listsResponse.json().catch(() => ({}));
//       return NextResponse.json(
//         {
//           error: "Failed to fetch lists",
//           details: errorData?.error?.message || listsResponse.statusText,
//         },
//         { status: listsResponse.status }
//       );
//     }

//     const listsData = await listsResponse.json();
//     const loanList = listsData.value?.find(
//       (list: any) => list.displayName?.toLowerCase() === LIST_NAME.toLowerCase()
//     );

//     if (!loanList) {
//       return NextResponse.json(
//         {
//           error: `List "${LIST_NAME}" not found in site`,
//           availableLists: listsData.value?.map((l: any) => l.displayName) || [],
//         },
//         { status: 404 }
//       );
//     }

//     const listId = loanList.id;

//     // 4. Get all drives (document libraries) → find "Loan Approvals"
//     const drivesUrl = `${GRAPH_BASE}/sites/${siteId}/drives`;
//     const drivesResponse = await fetch(drivesUrl, { headers });

//     if (!drivesResponse.ok) {
//       const errorData = await drivesResponse.json().catch(() => ({}));
//       return NextResponse.json(
//         {
//           error: "Failed to fetch drives/libraries",
//           details: errorData?.error?.message || drivesResponse.statusText,
//         },
//         { status: drivesResponse.status }
//       );
//     }

//     const drivesData = await drivesResponse.json();
//     const loanLibrary = drivesData.value?.find(
//       (drive: any) => drive.name?.toLowerCase() === LIBRARY_NAME.toLowerCase()
//     );

//     let driveId = null;
//     if (loanLibrary) {
//       driveId = loanLibrary.id;
//     } else {
//       // Not critical — we can proceed without it if backend resolves it anyway
//       console.warn(`Document library "${LIBRARY_NAME}" not found`);
//     }

//     // 5. Get List Columns (integrated from Flask logic)
//     const columnsUrl = `${GRAPH_BASE}/sites/${siteId}/lists/${listId}/columns`;
//     const columnsResponse = await fetch(columnsUrl, { headers });

//     if (!columnsResponse.ok) {
//       const errorData = await columnsResponse.json().catch(() => ({}));
//       return NextResponse.json(
//         {
//           error: "Failed to fetch list columns",
//           details: errorData?.error?.message || columnsResponse.statusText,
//         },
//         { status: columnsResponse.status }
//       );
//     }

//     const columnsData = await columnsResponse.json();
//     const choiceColumns = columnsData.value
//       ?.filter((col: any) => col.type === "choice" && col.choice?.choices?.length > 0)
//       ?.map((col: any) => ({
//         name: col.name, // Internal name
//         displayName: col.displayName,
//         choices: col.choice.choices || [],
//       })) || [];

//     // 6. Return the configuration with added choiceColumns
//     return NextResponse.json({
//       success: true,
//       siteId,
//       listId,
//       driveId,              // may be null if library not found
//       siteName: siteData.displayName || "CPA",
//       listName: LIST_NAME,
//       libraryName: LIBRARY_NAME,
//       choiceColumns,        // Added: Array of choice columns with choices
//       timestamp: new Date().toISOString(),
//     });
//   } catch (error: any) {
//     console.error("Error in /api/sharepoint/config:", error);
//     return NextResponse.json(
//       {
//         error: "Internal server error while fetching SharePoint config",
//         details: error.message || "Unknown error",
//       },
//       { status: 500 }
//     );
//   }
// }















// import { NextResponse } from "next/server";

// const GRAPH_BASE = "https://graph.microsoft.com/v1.0";
// const HOSTNAME = "aoscaustralia.sharepoint.com";
// const SITE_PATH = "/sites/CPA";
// const LIST_NAME = "Loan Application";
// const LIBRARY_NAME = "LOAN APPROVALS";

// // These should match exactly what's in your Python backend
// const REQUIRED_DOCUMENTS = [
//   "Property Details",
//   "GST Filings",
//   "Personal Tax Returns",
//   "Loan Application Form",
//   "Driver License",
//   "Passport",
//   "Proof of Employment",
// ];

// export async function GET(request: Request) {
//   try {
//     // ── 1. Authorization check ───────────────────────────────────────
//     const authHeader = request.headers.get("authorization");
//     if (!authHeader || !authHeader.startsWith("Bearer ")) {
//       return NextResponse.json(
//         { error: "Missing or invalid Authorization header (Bearer token required)" },
//         { status: 401 }
//       );
//     }

//     const token = authHeader.replace("Bearer ", "").trim();
//     const headers = {
//       Authorization: `Bearer ${token}`,
//       Accept: "application/json",
//     };

//     // ── 2. Resolve SharePoint Site ───────────────────────────────────
//     const siteUrl = `${GRAPH_BASE}/sites/${HOSTNAME}:${SITE_PATH}`;
//     const siteResponse = await fetch(siteUrl, { headers });

//     if (!siteResponse.ok) {
//       const errorData = await siteResponse.json().catch(() => ({}));
//       return NextResponse.json(
//         {
//           error: "Failed to resolve SharePoint site",
//           details: errorData?.error?.message || siteResponse.statusText,
//           status: siteResponse.status,
//         },
//         { status: siteResponse.status }
//       );
//     }

//     const siteData = await siteResponse.json();
//     const siteId = siteData.id;

//     if (!siteId) {
//       return NextResponse.json({ error: "Site ID not found" }, { status: 500 });
//     }

//     // ── 3. Find Loan Application List ────────────────────────────────
//     const listsUrl = `${GRAPH_BASE}/sites/${siteId}/lists`;
//     const listsResponse = await fetch(listsUrl, { headers });

//     if (!listsResponse.ok) {
//       return NextResponse.json(
//         { error: "Failed to fetch lists", status: listsResponse.status },
//         { status: listsResponse.status }
//       );
//     }

//     const listsData = await listsResponse.json();
//     const loanList = listsData.value?.find(
//       (list: any) => list.displayName?.toLowerCase() === LIST_NAME.toLowerCase()
//     );

//     if (!loanList) {
//       return NextResponse.json(
//         {
//           error: `List "${LIST_NAME}" not found`,
//           availableLists: listsData.value?.map((l: any) => l.displayName) || [],
//         },
//         { status: 404 }
//       );
//     }

//     const listId = loanList.id;

//     // ── 4. Find LOAN APPROVALS Document Library ──────────────────────
//     const drivesUrl = `${GRAPH_BASE}/sites/${siteId}/drives`;
//     const drivesResponse = await fetch(drivesUrl, { headers });

//     let driveId: string | null = null;
//     let libraryExists = false;

//     if (drivesResponse.ok) {
//       const drivesData = await drivesResponse.json();
//       const loanLibrary = drivesData.value?.find(
//         (d: any) => d.name?.toLowerCase() === LIBRARY_NAME.toLowerCase()
//       );
//       if (loanLibrary) {
//         driveId = loanLibrary.id;
//         libraryExists = true;
//       }
//     }

//     // ── 5. Get List Columns (choice fields) ──────────────────────────
//     const columnsUrl = `${GRAPH_BASE}/sites/${siteId}/lists/${listId}/columns`;
//     const columnsResponse = await fetch(columnsUrl, { headers });

//     let choiceColumns: any[] = [];

//     if (columnsResponse.ok) {
//       const columnsData = await columnsResponse.json();
//       choiceColumns = columnsData.value
//         ?.filter((col: any) => col.type === "choice" && col.choice?.choices?.length > 0)
//         ?.map((col: any) => ({
//           name: col.name,
//           displayName: col.displayName,
//           choices: col.choice.choices || [],
//         })) || [];
//     }

//     // ── 6. Prepare upload-related info for frontend ──────────────────
//     const uploadInfo = {
//       libraryExists,
//       driveId,                    // null if not found
//       requiredDocuments: REQUIRED_DOCUMENTS,
//       folderStructureDescription: "Documents are stored in: <itemId>/<documentType>/<filename>",
//       suggestedUploadPattern: (itemId: string, docType: string, filename: string) =>
//         `${itemId}/${docType.replace(/ /g, "%20")}/${filename.replace(/ /g, "%20")}`,
//       note: "Use PUT to /drives/{driveId}/root:/{path}:/content with Content-Type of the file",
//     };

//     // ── Final Response ───────────────────────────────────────────────
//     return NextResponse.json({
//       success: true,
//       siteId,
//       listId,
//       driveId,
//       siteName: siteData.displayName || "CPA",
//       listName: LIST_NAME,
//       libraryName: LIBRARY_NAME,
//       libraryExists,
//       requiredDocuments: REQUIRED_DOCUMENTS,
//       choiceColumns,
//       uploadInfo,
//       timestamp: new Date().toISOString(),
//     });
//   } catch (error: any) {
//     console.error("Error in /api/sharepoint/config:", error);
//     return NextResponse.json(
//       {
//         error: "Internal server error while fetching SharePoint configuration",
//         details: error.message || "Unknown error",
//       },
//       { status: 500 }
//     );
//   }
// }


















import { NextResponse } from "next/server";

const GRAPH_BASE = "https://graph.microsoft.com/v1.0";
const HOSTNAME = "aoscaustralia.sharepoint.com";
const SITE_PATH = "/sites/CPA";
const LIST_NAME = "Loan Application";
const LIBRARY_NAME = "LOAN APPROVALS";

const REQUIRED_DOCUMENTS = [
  "Property Details",
  "GST Filings",
  "Personal Tax Returns",
  "Loan Application Form",
  "Driver License",
  "Passport",
  "Proof of Employment",
];

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Missing or invalid Authorization header (Bearer token required)" },
        { status: 401 }
      );
    }

    const token = authHeader.replace("Bearer ", "").trim();
    const headers = {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    };

    const siteUrl = `${GRAPH_BASE}/sites/${HOSTNAME}:${SITE_PATH}`;
    const siteResponse = await fetch(siteUrl, { headers });

    if (!siteResponse.ok) {
      const errorData = await siteResponse.json().catch(() => ({}));
      return NextResponse.json(
        {
          error: "Failed to resolve SharePoint site",
          details: errorData?.error?.message || siteResponse.statusText,
          status: siteResponse.status,
        },
        { status: siteResponse.status }
      );
    }

    const siteData = await siteResponse.json();
    const siteId = siteData.id;

    if (!siteId) {
      return NextResponse.json({ error: "Site ID not found in response" }, { status: 500 });
    }

    const listsUrl = `${GRAPH_BASE}/sites/${siteId}/lists`;
    const listsResponse = await fetch(listsUrl, { headers });

    if (!listsResponse.ok) {
      const errorData = await listsResponse.json().catch(() => ({}));
      return NextResponse.json(
        {
          error: "Failed to fetch lists",
          details: errorData?.error?.message || listsResponse.statusText,
        },
        { status: listsResponse.status }
      );
    }

    const listsData = await listsResponse.json();
    const loanList = listsData.value?.find(
      (list: any) => list.displayName?.toLowerCase() === LIST_NAME.toLowerCase()
    );

    if (!loanList) {
      return NextResponse.json(
        {
          error: `List "${LIST_NAME}" not found in site`,
          availableLists: listsData.value?.map((l: any) => l.displayName) || [],
        },
        { status: 404 }
      );
    }

    const listId = loanList.id;

    const drivesUrl = `${GRAPH_BASE}/sites/${siteId}/drives`;
    const drivesResponse = await fetch(drivesUrl, { headers });

    if (!drivesResponse.ok) {
      const errorData = await drivesResponse.json().catch(() => ({}));
      return NextResponse.json(
        {
          error: "Failed to fetch drives/libraries",
          details: errorData?.error?.message || drivesResponse.statusText,
        },
        { status: drivesResponse.status }
      );
    }

    const drivesData = await drivesResponse.json();
    const loanLibrary = drivesData.value?.find(
      (drive: any) => drive.name?.toLowerCase() === LIBRARY_NAME.toLowerCase()
    );

    const driveId = loanLibrary ? loanLibrary.id : null;

    const columnsUrl = `${GRAPH_BASE}/sites/${siteId}/lists/${listId}/columns`;
    const columnsResponse = await fetch(columnsUrl, { headers });

    let choiceColumns = [];
    if (columnsResponse.ok) {
      const columnsData = await columnsResponse.json();
      choiceColumns = columnsData.value
        ?.filter((col: any) => col.type === "choice" && col.choice?.choices?.length > 0)
        ?.map((col: any) => ({
          name: col.name,
          displayName: col.displayName,
          choices: col.choice.choices || [],
        })) || [];
    }

    return NextResponse.json({
      success: true,
      siteId,
      listId,
      driveId,
      siteName: siteData.displayName || "CPA",
      listName: LIST_NAME,
      libraryName: LIBRARY_NAME,
      choiceColumns,
      requiredDocuments: REQUIRED_DOCUMENTS,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Error in /api/sharepoint/config:", error);
    return NextResponse.json(
      {
        error: "Internal server error while fetching SharePoint config",
        details: error.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}