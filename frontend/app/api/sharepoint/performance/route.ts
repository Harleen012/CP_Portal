// import { NextResponse } from "next/server"

// export async function GET() {
//   try {
//     const res = await fetch("http://127.0.0.1:8000/process-insight", {
//       method: "GET",
//       cache: "no-store",
//     })

//     if (!res.ok) {
//       const text = await res.text()
//       return NextResponse.json(
//         { error: "Backend failed", details: text },
//         { status: 500 }
//       )
//     }

//     // Backend returns HTML → convert to text
//     const html = await res.text()

//     return NextResponse.json({
//       success: true,
//       html,
//     })
//   } catch (err: any) {
//     return NextResponse.json(
//       { error: "API connection failed", message: err.message },
//       { status: 500 }
//     )
//   }
// }









// import { NextResponse } from "next/server"

// // 🔐 Read MSAL token from browser sessionStorage via header forwarded by client
// export async function GET(request: Request) {
//   const auth = request.headers.get("authorization")

//   if (!auth) {
//     return NextResponse.json(
//       { error: "Missing Microsoft access token" },
//       { status: 401 }
//     )
//   }

//   const res = await fetch("http://127.0.0.1:8000/process-insight", {
//     method: "GET",
//     headers: {
//       Authorization: auth,
//     },
//     cache: "no-store",
//   })

//   if (!res.ok) {
//     const text = await res.text()
//     return NextResponse.json(
//       { error: "Backend error", details: text },
//       { status: res.status }
//     )
//   }

//   const data = await res.json()
//   return NextResponse.json(data)
// }










































import { NextResponse } from "next/server"

export async function POST() {
  const res = await fetch("http://127.0.0.1:8000/run-report", {
    method: "POST",
    cache: "no-store",
  })

  if (!res.ok) {
    const text = await res.text()
    return NextResponse.json({ success: false, error: text }, { status: 500 })
  }

  const data = await res.json()
  return NextResponse.json({ success: true, data })
}
