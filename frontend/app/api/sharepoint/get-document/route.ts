// // import { NextRequest, NextResponse } from "next/server";

// // export async function GET(req: NextRequest) {
// //   try {
// //     const { searchParams } = new URL(req.url);
// //     const fileUrl = searchParams.get("url");
// //     const authHeader = req.headers.get("authorization");

// //     if (!fileUrl) {
// //       return NextResponse.json(
// //         { error: "Missing file URL" },
// //         { status: 400 }
// //       );
// //     }

// //     if (!authHeader) {
// //       return NextResponse.json(
// //         { error: "Missing Authorization header" },
// //         { status: 401 }
// //       );
// //     }

// //     // Fetch file from SharePoint via Graph
// //     const response = await fetch(fileUrl, {
// //       headers: {
// //         Authorization: authHeader,
// //       },
// //     });

// //     if (!response.ok) {
// //       return NextResponse.json(
// //         { error: "Failed to fetch document from SharePoint" },
// //         { status: response.status }
// //       );
// //     }

// //     const blob = await response.arrayBuffer();

// //     return new NextResponse(blob, {
// //       headers: {
// //         "Content-Type":
// //           response.headers.get("content-type") ||
// //           "application/octet-stream",
// //       },
// //     });
// //   } catch (error: any) {
// //     return NextResponse.json(
// //       { error: error.message },
// //       { status: 500 }
// //     );
// //   }
// // }



// import { NextRequest, NextResponse } from "next/server";

// export async function GET(req: NextRequest) {
//   try {
//     const { searchParams } = new URL(req.url);

//     const driveId = searchParams.get("driveId");
//     const itemId = searchParams.get("itemId");

//     const authHeader = req.headers.get("authorization");

//     if (!driveId || !itemId) {
//       return NextResponse.json(
//         { error: "Missing driveId or itemId" },
//         { status: 400 }
//       );
//     }

//     if (!authHeader) {
//       return NextResponse.json(
//         { error: "Missing Authorization header" },
//         { status: 401 }
//       );
//     }

//     const graphUrl = `https://graph.microsoft.com/v1.0/drives/${driveId}/items/${itemId}/content`;

//     const response = await fetch(graphUrl, {
//       headers: {
//         Authorization: authHeader,
//       },
//     });

//     if (!response.ok) {
//       return NextResponse.json(
//         { error: "Failed to fetch file from Graph" },
//         { status: response.status }
//       );
//     }

//     const buffer = await response.arrayBuffer();

//     return new NextResponse(buffer, {
//       headers: {
//         "Content-Type":
//           response.headers.get("content-type") ||
//           "application/octet-stream",
//       },
//     });
//   } catch (error: any) {
//     return NextResponse.json(
//       { error: error.message },
//       { status: 500 }
//     );
//   }
// }








import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { webUrl, fileName } = await req.json();

    if (!webUrl) {
      return NextResponse.json({ error: "webUrl missing" }, { status: 400 });
    }

    const token = req.headers.get("authorization");

    const spRes = await fetch(webUrl, {
      headers: {
        Authorization: token || "",
      },
    });

    if (!spRes.ok) {
      return NextResponse.json(
        { error: "Failed to fetch from SharePoint" },
        { status: spRes.status }
      );
    }

    const blob = await spRes.blob();

    return new NextResponse(blob, {
      headers: {
        "Content-Type": blob.type,
        "Content-Disposition": `attachment; filename="${fileName || "document"}"`,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}
