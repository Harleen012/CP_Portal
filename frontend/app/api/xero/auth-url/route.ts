// import { NextResponse } from "next/server"

// export async function GET() {
//   const res = await fetch("http://127.0.0.1:8000/auth/url", {
//     method: "GET",
//     cache: "no-store",
//   })

//   if (!res.ok) {
//     return NextResponse.json(
//       { success: false, error: "Failed to get auth url" },
//       { status: 500 }
//     )
//   }

//   const data = await res.json()
//   return NextResponse.json({ success: true, auth_url: data.auth_url })
// }

















import { NextResponse } from "next/server"

export async function GET() {
  const res = await fetch("http://127.0.0.1:8000/auth/url", {
    cache: "no-store",
  })
  const data = await res.json()
  return NextResponse.json(data)
}
