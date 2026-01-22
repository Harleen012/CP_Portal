

// "use client"

// import { useEffect, useState } from "react"
// import { DashboardLayout } from "@/components/layouts/dashboard-layout"
// import {
//   DollarSign,
//   TrendingUp,
//   TrendingDown,
//   RefreshCw,
//   Calendar,
// } from "lucide-react"

// /* ================= TYPES ================= */

// type Report = any

// /* ================= HELPERS ================= */

// const formatCurrency = (value: number) =>
//   new Intl.NumberFormat("en-AU", {
//     style: "currency",
//     currency: "AUD",
//   }).format(value)

// const extractMetric = (rows: any[], label: string): number => {
//   for (const section of rows) {
//     if (!section?.Rows) continue

//     for (const row of section.Rows) {
//       const key = row?.Cells?.[0]?.Value?.trim()?.toUpperCase()
//       const val = row?.Cells?.[1]?.Value

//       if (key === label.toUpperCase()) {
//         return Number(val || 0)
//       }
//     }
//   }
//   return 0
// }

// /* ================= COMPONENT ================= */

// export default function PerformancePage() {
//   const [loading, setLoading] = useState(false)
//   const [error, setError] = useState<string | null>(null)
//   const [report, setReport] = useState<Report | null>(null)

//   /* ---------- CONNECT XERO ---------- */
//   const connectXero = async () => {
//     try {
//       setError(null)
//       setLoading(true)

//       const res = await fetch("/api/xero/auth-url")
//       const data = await res.json()

//       if (!data?.auth_url) {
//         throw new Error("Failed to get Xero auth URL")
//       }

//       window.location.href = data.auth_url
//     } catch (err: any) {
//       setError(err.message)
//       setLoading(false)
//     }
//   }

//   /* ---------- RUN REPORT ---------- */
//   const runReport = async () => {
//     try {
//       setLoading(true)
//       setError(null)

//       const res = await fetch("/api/xero/run-report", {
//         method: "POST",
//       })

//       const data = await res.json()

//       if (!data?.success) {
//         throw new Error("Failed to generate report")
//       }

//       setReport(data.data)
//     } catch (err: any) {
//       setError(err.message)
//     } finally {
//       setLoading(false)
//     }
//   }

//   /* ---------- AUTO RUN AFTER CALLBACK ---------- */
//   useEffect(() => {
//     const params = new URLSearchParams(window.location.search)
//     if (params.get("xero") === "connected") {
//       runReport()
//     }
//   }, [])

//   /* ---------- SAFETY ---------- */
//   if (!report && loading) {
//     return (
//       <DashboardLayout>
//         <div className="flex justify-center items-center h-64">
//           <RefreshCw className="w-8 h-8 animate-spin text-indigo-600" />
//         </div>
//       </DashboardLayout>
//     )
//   }

//   const plReport = report?.profit_and_loss?.Reports?.[0]
//   const rows = plReport?.Rows ?? []

//   const totalRevenue = extractMetric(rows, "Total Income")
//   const grossProfit = extractMetric(rows, "GROSS PROFIT")
//   const operatingProfit = extractMetric(rows, "OPERATING PROFIT")
//   const netProfit = extractMetric(rows, "NET PROFIT")

//   return (
//     <DashboardLayout>
//       <div className="min-h-[calc(100vh-64px)] bg-slate-50">
//         <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">

//           {/* ---------- HEADER ---------- */}
//           <div className="flex justify-between items-center">
//             <div>
//               <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
//                 <Calendar className="w-3 h-3" />
//                 Xero Financial Report
//               </div>
//               <h1 className="text-3xl font-extrabold text-slate-900">
//                 Performance Insights
//               </h1>
//             </div>

//             <button
//               onClick={connectXero}
//               disabled={loading}
//               className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl
//                          bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow"
//             >
//               <RefreshCw className={loading ? "animate-spin" : ""} />
//               Connect Xero
//             </button>
//           </div>

//           {/* ---------- ERROR ---------- */}
//           {error && (
//             <div className="bg-red-50 border border-red-200 p-4 rounded-xl text-red-700">
//               {error}
//             </div>
//           )}

//           {/* ---------- METRIC CARDS (UNCHANGED UI) ---------- */}
//           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
//             <MetricCard
//               title="Total Revenue"
//               value={totalRevenue}
//               icon={DollarSign}
//             />
//             <MetricCard
//               title="Gross Profit"
//               value={grossProfit}
//               icon={TrendingUp}
//             />
//             <MetricCard
//               title="Operating Profit"
//               value={operatingProfit}
//               icon={operatingProfit >= 0 ? TrendingUp : TrendingDown}
//             />
//             <MetricCard
//               title="Net Profit"
//               value={netProfit}
//               icon={netProfit >= 0 ? TrendingUp : TrendingDown}
//               highlight
//             />
//           </div>

//           {/* ---------- REPORT DETAILS ---------- */}
//           {plReport && (
//             <div className="bg-white rounded-2xl border shadow-sm p-6">
//               <h2 className="text-xl font-bold mb-4">Detailed Breakdown</h2>

//               {rows.map((section: any, i: number) => {
//                 if (section.RowType !== "Section" || !section.Rows) return null
//                 if (!section.Title?.trim()) return null

//                 return (
//                   <div key={i} className="mb-6">
//                     <h3 className="font-semibold mb-2">
//                       {section.Title.trim()}
//                     </h3>

//                     <div className="border rounded-lg overflow-hidden">
//                       <table className="w-full text-sm">
//                         <tbody>
//                           {section.Rows.map((row: any, r: number) => {
//                             if (!row.Cells?.[1]) return null
//                             const amount = Number(row.Cells[1].Value || 0)

//                             return (
//                               <tr key={r} className="border-b last:border-0">
//                                 <td className="px-4 py-2">
//                                   {row.Cells[0].Value}
//                                 </td>
//                                 <td
//                                   className={`px-4 py-2 text-right font-mono ${
//                                     amount < 0 ? "text-red-600" : ""
//                                   }`}
//                                 >
//                                   {formatCurrency(amount)}
//                                 </td>
//                               </tr>
//                             )
//                           })}
//                         </tbody>
//                       </table>
//                     </div>
//                   </div>
//                 )
//               })}
//             </div>
//           )}

//         </div>
//       </div>
//     </DashboardLayout>
//   )
// }

// /* ================= CARD ================= */

// function MetricCard({
//   title,
//   value,
//   icon: Icon,
//   highlight,
// }: any) {
//   const negative = value < 0

//   return (
//     <div
//       className={`bg-white rounded-xl border p-5 shadow-sm ${
//         highlight ? "ring-2 ring-indigo-300" : ""
//       }`}
//     >
//       <div className="flex justify-between items-center mb-2">
//         <p className="text-sm text-gray-600">{title}</p>
//         <Icon
//           className={`w-5 h-5 ${
//             negative ? "text-red-600" : "text-green-600"
//           }`}
//         />
//       </div>
//       <p
//         className={`text-2xl font-bold ${
//           negative ? "text-red-600" : "text-gray-900"
//         }`}
//       >
//         {formatCurrency(value)}
//       </p>
//     </div>
//   )
// }




// "use client"

// import { useEffect, useState } from "react"
// import { DashboardLayout } from "@/components/layouts/dashboard-layout"
// import { RefreshCw, FileText, Calendar, AlertTriangle } from "lucide-react"

// export default function PerformancePage() {
//   const [loading, setLoading] = useState(false)
//   const [error, setError] = useState<string | null>(null)
//   const [report, setReport] = useState<any>(null)

//   // STEP 1: Get auth URL via Next API
//   const connectXero = async () => {
//     try {
//       setLoading(true)
//       setError(null)

//       const res = await fetch("/api/xero/auth-url")
//       const data = await res.json()

//       if (!data.success) throw new Error("Auth URL failed")

//       window.location.href = data.auth_url
//     } catch (err: any) {
//       setError(err.message)
//       setLoading(false)
//     }
//   }

//   // STEP 2: Run report after callback
//   const runReport = async () => {
//     try {
//       setLoading(true)

//       const res = await fetch("/api/xero/run-report", {
//         method: "POST",
//       })

//       const data = await res.json()

//       if (!data.success) throw new Error("Report failed")

//       setReport(data.data)
//     } catch (err: any) {
//       setError(err.message)
//     } finally {
//       setLoading(false)
//     }
//   }

//   // Detect Xero redirect
//   useEffect(() => {
//     const params = new URLSearchParams(window.location.search)
//     if (params.get("code")) {
//       runReport()
//     }
//   }, [])

//   return (
//     <DashboardLayout>
//       <div className="min-h-[calc(100vh-64px)] bg-slate-50">
//         <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">

//           <div className="flex justify-between items-center">
//             <div>
//               <div className="text-xs text-slate-500 flex gap-2">
//                 <Calendar className="w-3 h-3" /> AI Generated CPA Report
//               </div>
//               <h1 className="text-3xl font-bold">Performance Insights</h1>
//             </div>

//             <button
//               onClick={connectXero}
//               className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl flex gap-2"
//             >
//               <RefreshCw className={loading ? "animate-spin" : ""} />
//               Connect Xero
//             </button>
//           </div>

//           {loading && <p>Processing...</p>}

//           {error && (
//             <div className="bg-red-50 border border-red-200 p-4 rounded-xl text-red-700">
//               <AlertTriangle className="inline w-4 h-4 mr-2" />
//               {error}
//             </div>
//           )}

//           {report && (
//             <div className="bg-white p-4 rounded-xl border">
//               <FileText className="inline w-4 h-4 mr-2" />
//               <pre className="text-xs overflow-auto">
//                 {JSON.stringify(report, null, 2)}
//               </pre>
//             </div>
//           )}
//         </div>
//       </div>
//     </DashboardLayout>
//   )
// }







































// "use client"

// import { useEffect, useRef, useState } from "react"
// import { DashboardLayout } from "@/components/layouts/dashboard-layout"
// import { RefreshCw, FileText, Calendar, AlertTriangle } from "lucide-react"

// export default function PerformancePage() {
//   const [loading, setLoading] = useState(false)
//   const [error, setError] = useState<string | null>(null)
//   const [report, setReport] = useState<any>(null)

//   const authWindowRef = useRef<Window | null>(null)

//   // STEP 1 — OPEN XERO LOGIN IN NEW WINDOW
//   const connectXero = async () => {
//     try {
//       setLoading(true)
//       setError(null)

//       const res = await fetch("/api/xero/auth-url")
//       const data = await res.json()

//       if (!data?.auth_url) {
//         throw new Error("Failed to get Xero auth URL")
//       }

//       authWindowRef.current = window.open(
//         data.auth_url,
//         "xero-auth",
//         "width=600,height=700"
//       )

//     } catch (err: any) {
//       setError(err.message)
//       setLoading(false)
//     }
//   }

//   // STEP 2 — RUN REPORT (TOKEN IS ALREADY STORED IN BACKEND)
//   const runReport = async () => {
//     try {
//       setLoading(true)

//       const res = await fetch("/api/xero/run-report", {
//         method: "POST",
//       })

//       const data = await res.json()

//       if (!data.success) {
//         throw new Error("Failed to generate report")
//       }

//       setReport(data.data)
//     } catch (err: any) {
//       setError(err.message)
//     } finally {
//       setLoading(false)
//     }
//   }

//   // STEP 3 — LISTEN FOR TOKEN READY MESSAGE
//   useEffect(() => {
//     const handler = (event: MessageEvent) => {
//       if (event.data === "XERO_AUTH_SUCCESS") {
//         authWindowRef.current?.close()
//         runReport()
//       }
//     }

//     window.addEventListener("message", handler)
//     return () => window.removeEventListener("message", handler)
//   }, [])

//   return (
//     <DashboardLayout>
//       <div className="min-h-[calc(100vh-64px)] bg-slate-50">
//         <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">

//           {/* HEADER */}
//           <div className="flex justify-between items-center">
//             <div>
//               <div className="text-xs text-slate-500 flex gap-2">
//                 <Calendar className="w-3 h-3" />
//                 AI Generated CPA Report
//               </div>
//               <h1 className="text-3xl font-bold">Performance Insights</h1>
//             </div>

//             <button
//               onClick={connectXero}
//               className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl flex gap-2"
//               disabled={loading}
//             >
//               <RefreshCw className={loading ? "animate-spin" : ""} />
//               Connect Xero
//             </button>
//           </div>

//           {/* LOADING */}
//           {loading && (
//             <p className="text-slate-600">Processing Xero data…</p>
//           )}

//           {/* ERROR */}
//           {error && (
//             <div className="bg-red-50 border border-red-200 p-4 rounded-xl text-red-700">
//               <AlertTriangle className="inline w-4 h-4 mr-2" />
//               {error}
//             </div>
//           )}

//           {/* REPORT */}
//           {report && (
//             <div className="bg-white p-4 rounded-xl border">
//               <FileText className="inline w-4 h-4 mr-2" />
//               <pre className="text-xs overflow-auto">
//                 {JSON.stringify(report, null, 2)}
//               </pre>
//             </div>
//           )}

//         </div>
//       </div>
//     </DashboardLayout>
//   )
// }

































// "use client"

// import { useEffect, useState } from "react"
// import { DashboardLayout } from "@/components/layouts/dashboard-layout"

// export default function PerformancePage() {
//   const [loading, setLoading] = useState(false)
//   const [report, setReport] = useState<any>(null)

//   const connectXero = async () => {
//     const res = await fetch("/api/xero/auth-url")
//     const data = await res.json()
//     window.location.href = data.auth_url
//   }

//   const runReport = async () => {
//     setLoading(true)
//     const res = await fetch("/api/xero/run-report", { method: "POST" })
//     const data = await res.json()
//     setReport(data.data)
//     setLoading(false)
//   }

//   // 🔥 AUTO RUN AFTER CALLBACK
//   useEffect(() => {
//     const params = new URLSearchParams(window.location.search)
//     if (params.get("xero") === "connected") {
//       runReport()
//     }
//   }, [])

//   return (
//     <DashboardLayout>
//       <button onClick={connectXero}>Connect Xero</button>

//       {loading && <p>Running report…</p>}
//       {report && <pre>{JSON.stringify(report, null, 2)}</pre>}
//     </DashboardLayout>
//   )
// }




































// Previous *********************************************************************************************





// "use client"

// import { useEffect, useState } from "react"
// import { DashboardLayout } from "@/components/layouts/dashboard-layout"
// import {
//   DollarSign,
//   TrendingUp,
//   TrendingDown,
//   RefreshCw,
//   Calendar,
// } from "lucide-react"

// /* ================= TYPES ================= */

// type Report = any

// /* ================= HELPERS ================= */

// const formatCurrency = (value: number) =>
//   new Intl.NumberFormat("en-AU", {
//     style: "currency",
//     currency: "AUD",
//   }).format(value)

// const extractMetric = (rows: any[], label: string): number => {
//   for (const section of rows) {
//     if (!section?.Rows) continue

//     for (const row of section.Rows) {
//       const key = row?.Cells?.[0]?.Value?.trim()?.toUpperCase()
//       const val = row?.Cells?.[1]?.Value

//       if (key === label.toUpperCase()) {
//         return Number(val || 0)
//       }
//     }
//   }
//   return 0
// }

// /* ================= COMPONENT ================= */

// export default function PerformancePage() {
//   const [loading, setLoading] = useState(false)
//   const [error, setError] = useState<string | null>(null)
//   const [report, setReport] = useState<Report | null>(null)

//   /* ---------- CONNECT XERO ---------- */
//   const connectXero = async () => {
//     try {
//       setError(null)
//       setLoading(true)

//       const res = await fetch("/api/xero/auth-url")
//       const data = await res.json()

//       if (!data?.auth_url) {
//         throw new Error("Failed to get Xero auth URL")
//       }

//       window.location.href = data.auth_url
//     } catch (err: any) {
//       setError(err.message)
//       setLoading(false)
//     }
//   }

//   /* ---------- RUN REPORT ---------- */
//   const runReport = async () => {
//     try {
//       setLoading(true)
//       setError(null)

//       const res = await fetch("/api/xero/run-report", {
//         method: "POST",
//       })

//       const data = await res.json()

//       if (!data?.success) {
//         throw new Error("Failed to generate report")
//       }

//       setReport(data.data)
//     } catch (err: any) {
//       setError(err.message)
//     } finally {
//       setLoading(false)
//     }
//   }

//   /* ---------- AUTO RUN AFTER CALLBACK ---------- */
//   useEffect(() => {
//     const params = new URLSearchParams(window.location.search)
//     if (params.get("xero") === "connected") {
//       runReport()
//     }
//   }, [])

//   /* ---------- SAFETY ---------- */
//   if (!report && loading) {
//     return (
//       <DashboardLayout>
//         <div className="flex justify-center items-center h-64">
//           <RefreshCw className="w-8 h-8 animate-spin text-indigo-600" />
//         </div>
//       </DashboardLayout>
//     )
//   }

//   const plReport = report?.profit_and_loss?.Reports?.[0]
//   const rows = plReport?.Rows ?? []

//   const totalRevenue = extractMetric(rows, "Total Income")
//   const grossProfit = extractMetric(rows, "GROSS PROFIT")
//   const operatingProfit = extractMetric(rows, "OPERATING PROFIT")
//   const netProfit = extractMetric(rows, "NET PROFIT")

//   return (
//     <DashboardLayout>
//       <div className="min-h-[calc(100vh-64px)] bg-slate-50">
//         <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">

//           {/* ---------- HEADER ---------- */}
//           <div className="flex justify-between items-center">
//             <div>
//               <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
//                 <Calendar className="w-3 h-3" />
//                 Xero Financial Report
//               </div>
//               <h1 className="text-3xl font-extrabold text-slate-900">
//                 Performance Insights
//               </h1>
//             </div>

//             <button
//               onClick={connectXero}
//               disabled={loading}
//               className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl
//                          bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow"
//             >
//               <RefreshCw className={loading ? "animate-spin" : ""} />
//               Connect Xero
//             </button>
//           </div>

//           {/* ---------- ERROR ---------- */}
//           {error && (
//             <div className="bg-red-50 border border-red-200 p-4 rounded-xl text-red-700">
//               {error}
//             </div>
//           )}

//           {/* ---------- METRIC CARDS (UNCHANGED UI) ---------- */}
//           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
//             <MetricCard
//               title="Total Revenue"
//               value={totalRevenue}
//               icon={DollarSign}
//             />
//             <MetricCard
//               title="Gross Profit"
//               value={grossProfit}
//               icon={TrendingUp}
//             />
//             <MetricCard
//               title="Operating Profit"
//               value={operatingProfit}
//               icon={operatingProfit >= 0 ? TrendingUp : TrendingDown}
//             />
//             <MetricCard
//               title="Net Profit"
//               value={netProfit}
//               icon={netProfit >= 0 ? TrendingUp : TrendingDown}
//               highlight
//             />
//           </div>

//           {/* ---------- REPORT DETAILS ---------- */}
//           {plReport && (
//             <div className="bg-white rounded-2xl border shadow-sm p-6">
//               <h2 className="text-xl font-bold mb-4">Detailed Breakdown</h2>

//               {rows.map((section: any, i: number) => {
//                 if (section.RowType !== "Section" || !section.Rows) return null
//                 if (!section.Title?.trim()) return null

//                 return (
//                   <div key={i} className="mb-6">
//                     <h3 className="font-semibold mb-2">
//                       {section.Title.trim()}
//                     </h3>

//                     <div className="border rounded-lg overflow-hidden">
//                       <table className="w-full text-sm">
//                         <tbody>
//                           {section.Rows.map((row: any, r: number) => {
//                             if (!row.Cells?.[1]) return null
//                             const amount = Number(row.Cells[1].Value || 0)

//                             return (
//                               <tr key={r} className="border-b last:border-0">
//                                 <td className="px-4 py-2">
//                                   {row.Cells[0].Value}
//                                 </td>
//                                 <td
//                                   className={`px-4 py-2 text-right font-mono ${
//                                     amount < 0 ? "text-red-600" : ""
//                                   }`}
//                                 >
//                                   {formatCurrency(amount)}
//                                 </td>
//                               </tr>
//                             )
//                           })}
//                         </tbody>
//                       </table>
//                     </div>
//                   </div>
//                 )
//               })}
//             </div>
//           )}

//         </div>
//       </div>
//     </DashboardLayout>
//   )
// }

// /* ================= CARD ================= */

// function MetricCard({
//   title,
//   value,
//   icon: Icon,
//   highlight,
// }: any) {
//   const negative = value < 0

//   return (
//     <div
//       className={`bg-white rounded-xl border p-5 shadow-sm ${
//         highlight ? "ring-2 ring-indigo-300" : ""
//       }`}
//     >
//       <div className="flex justify-between items-center mb-2">
//         <p className="text-sm text-gray-600">{title}</p>
//         <Icon
//           className={`w-5 h-5 ${
//             negative ? "text-red-600" : "text-green-600"
//           }`}
//         />
//       </div>
//       <p
//         className={`text-2xl font-bold ${
//           negative ? "text-red-600" : "text-gray-900"
//         }`}
//       >
//         {formatCurrency(value)}
//       </p>
//     </div>
//   )
// }










// ********************************************************************************************










// My Code Version 1 #####################################################################




// "use client"

// import { useState } from "react"
// import { DashboardLayout } from "@/components/layouts/dashboard-layout"
// import { 
//   FileText, 
//   Layers, 
//   Activity, 
//   CreditCard, 
//   Calendar, 
//   MessageCircle 
// } from "lucide-react"

// // --- MOCK DATA (Matches your screenshot content) ---
// const mockData = {
//   org_name: "Demo Company (AU)",
//   period: "Jan 20, 2025 to Jan 20, 2026",
//   metrics: {
//     Revenue: 53378.32,
//     Expense: 61469.47,
//     Profit: -8091.15
//   },
//   // This matches the text in your screenshot exactly
//   report_html: `
//     <h3 class="text-lg font-bold text-gray-800 mb-4">Annual Financial Performance Report</h3>
//     <p class="mb-2 text-sm text-gray-600"><strong>Period:</strong> Year Ended 31 January 2026</p>
    
//     <h4 class="text-md font-bold text-gray-800 mt-6 mb-2">1. Executive Summary</h4>
//     <p class="mb-4 text-gray-700 leading-relaxed">
//       The business experienced a challenging financial period, resulting in a net loss. Total revenue generated was <strong>$53,378.32</strong>, while total expenses reached <strong>$61,469.47</strong>. Consequently, the business recorded a <strong>Net Profit of -$8,091.15</strong>. Despite a healthy Gross Profit of $52,614.68, operating expenses significantly exceeded the gross profit, leading to an overall loss for the period.
//     </p>

//     <h4 class="text-md font-bold text-gray-800 mt-6 mb-2">2. Profitability Analysis</h4>
//     <p class="mb-4 text-gray-700 leading-relaxed">
//       The business maintained a strong Gross Profit Margin of approximately <strong>98.6%</strong>. However, the Net Profit Margin was negative at <strong>-15.2%</strong>. The primary drivers of the net loss were high operating expenses relative to revenue.
//     </p>
    
//     <p class="font-semibold text-gray-800 mb-2">Top Operating Expenses:</p>
//     <ul class="list-disc pl-5 space-y-1 text-gray-700 mb-4">
//         <li><strong>Advertising:</strong> $4,726.20 (Nearly 9% of total revenue).</li>
//         <li><strong>Motor Vehicle Expenses:</strong> $4,589.00 (A significant operational cost).</li>
//         <li><strong>Rent:</strong> $3,600.00 (Fixed overhead cost).</li>
//         <li><strong>Wages and Salaries:</strong> $3,300.00 (Direct labor costs).</li>
//     </ul>

//     <h4 class="text-md font-bold text-gray-800 mt-6 mb-2">5. Recommendations</h4>
//     <p class="mb-4 text-gray-700 leading-relaxed">
//       <strong>Immediate Cash Flow Management:</strong> The most critical issue is the negative bank balance. The business must prioritize converting Accounts Receivable ($25,056.55) into cash immediately to cover the overdraft and pay overdue liabilities.
//     </p>
//   `,
//   gl: [
//     { Code: "200", Name: "Sales", Type: "REVENUE", Balance: 53378.32 },
//     { Code: "400", Name: "Advertising", Type: "EXPENSE", Balance: 4726.20 },
//     { Code: "404", Name: "Rent", Type: "EXPENSE", Balance: 3600.00 },
//     { Code: "410", Name: "Wages & Salaries", Type: "EXPENSE", Balance: 3300.00 },
//     { Code: "610", Name: "Accounts Payable", Type: "LIABILITY", Balance: 4500.00 },
//   ],
//   transactions: [
//     { Date: "20 Jan 2026", Type: "SPEND", Amount: 120.50, Ref: "Uber Trip" },
//     { Date: "19 Jan 2026", Type: "RECEIVE", Amount: 4500.00, Ref: "INV-001" },
//     { Date: "18 Jan 2026", Type: "SPEND", Amount: 330.00, Ref: "Officeworks" },
//   ]
// };

// export default function PerformancePage() {
//   const [activeTab, setActiveTab] = useState("report");

//   return (
//     <DashboardLayout>
//       <div className="space-y-6 animate-in fade-in duration-500 font-sans pb-20">
        
//         {/* TOP HEADER (Dark bar style from screenshot) */}
//         <div className="bg-[#2c3e50] text-white p-5 rounded-t-xl shadow-lg flex justify-between items-center">
//           <div>
//             <h1 className="text-xl font-bold flex items-center gap-3">
//               <span className="bg-white/10 p-1.5 rounded text-blue-300"><Activity size={20} /></span>
//               {mockData.org_name}
//               <span className="text-white/40 text-sm font-light border-l border-white/20 pl-3 ml-1">Annual Performance Portal</span>
//             </h1>
//           </div>
//           <button className="text-xs bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded transition">
//             Switch Org
//           </button>
//         </div>

//         {/* MAIN CONTENT CONTAINER */}
//         <div className="bg-white rounded-b-xl shadow-sm border border-gray-200 min-h-[600px] -mt-6">
          
//           {/* TABS NAVIGATION */}
//           <div className="flex border-b border-gray-200 px-4 pt-4 bg-gray-50/50 rounded-t-xl">
//             <TabButton id="report" label="AI Report" active={activeTab} set={setActiveTab} />
//             <TabButton id="gl" label="General Ledger" active={activeTab} set={setActiveTab} />
//             <TabButton id="pnl" label="Profit & Loss" active={activeTab} set={setActiveTab} />
//             <TabButton id="bs" label="Balance Sheet" active={activeTab} set={setActiveTab} />
//             <TabButton id="tx" label="Transactions" active={activeTab} set={setActiveTab} />
//           </div>

//           {/* TAB CONTENT AREA */}
//           <div className="p-8">
            
//             {/* DATA PERIOD BADGE */}
//             <div className="inline-flex items-center gap-2 bg-gray-100 text-gray-600 px-3 py-1.5 rounded text-xs font-semibold mb-8 border border-gray-200">
//                <Calendar size={14} />
//                Data Period: {mockData.period}
//             </div>

//             {/* --- TAB 1: AI REPORT --- */}
//             {activeTab === 'report' && (
//               <div className="space-y-8 animate-in slide-in-from-bottom-2 duration-300">
                
//                 {/* METRIC CARDS ROW */}
//                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
//                   {/* Revenue Card (Green) */}
//                   <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-100 border-l-4 border-l-green-500">
//                     <div className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-1">TOTAL REVENUE</div>
//                     <div className="text-2xl font-bold text-gray-800">
//                         ${mockData.metrics.Revenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
//                     </div>
//                   </div>

//                   {/* Expense Card (Red) */}
//                   <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-100 border-l-4 border-l-red-500">
//                     <div className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-1">TOTAL EXPENSES</div>
//                     <div className="text-2xl font-bold text-gray-800">
//                         ${mockData.metrics.Expense.toLocaleString('en-US', { minimumFractionDigits: 2 })}
//                     </div>
//                   </div>

//                   {/* Profit Card (Blue/Dark) */}
//                   <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-100 border-l-4 border-l-[#2c3e50]">
//                     <div className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-1">NET PROFIT</div>
//                     <div className="text-2xl font-bold text-gray-800">
//                         ${mockData.metrics.Profit.toLocaleString('en-US', { minimumFractionDigits: 2 })}
//                     </div>
//                   </div>
//                 </div>

//                 {/* STRATEGIC ANALYSIS CONTENT */}
//                 <div>
//                    <h3 className="flex items-center gap-2 font-bold text-gray-800 mb-4">
//                       <span className="text-xl">🤖</span> Strategic Analysis
//                    </h3>
//                    <div 
//                       className="prose max-w-none text-gray-600 bg-gray-50/50 p-6 rounded-xl border border-gray-100"
//                       dangerouslySetInnerHTML={{ __html: mockData.report_html }} 
//                    />
//                 </div>
//               </div>
//             )}

//             {/* --- TAB 2: GENERAL LEDGER --- */}
//             {activeTab === 'gl' && (
//               <div className="overflow-hidden rounded-lg border border-gray-200">
//                 <table className="w-full text-sm text-left">
//                   <thead className="bg-gray-50 text-gray-500 font-semibold border-b border-gray-200">
//                       <tr>
//                           <th className="p-4">Code</th>
//                           <th className="p-4">Account Name</th>
//                           <th className="p-4">Type</th>
//                           <th className="p-4 text-right">Balance</th>
//                       </tr>
//                   </thead>
//                   <tbody className="divide-y divide-gray-100">
//                       {mockData.gl.map((row, i) => (
//                           <tr key={i} className="hover:bg-gray-50 bg-white">
//                               <td className="p-4 text-gray-500 font-mono text-xs">{row.Code}</td>
//                               <td className="p-4 font-medium text-gray-800">{row.Name}</td>
//                               <td className="p-4"><span className="bg-gray-100 px-2 py-1 rounded text-[10px] uppercase font-bold tracking-wider text-gray-500">{row.Type}</span></td>
//                               <td className="p-4 text-right font-bold text-gray-700 font-mono">
//                                 ${row.Balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
//                               </td>
//                           </tr>
//                       ))}
//                   </tbody>
//                 </table>
//               </div>
//             )}

//             {/* --- PLACEHOLDERS FOR OTHER TABS --- */}
//             {(activeTab === 'pnl' || activeTab === 'bs' || activeTab === 'tx') && (
//                <div className="flex flex-col items-center justify-center py-20 text-gray-400 bg-gray-50 rounded-lg border border-dashed border-gray-300">
//                  <Layers size={40} className="mb-4 opacity-20" />
//                  <p>Table data will appear here once connected.</p>
//                </div>
//             )}
//           </div>
//         </div>
//       </div>
      
//       {/* FLOATING CHATBOT BUTTON (Visual Only) */}
//       <div className="fixed bottom-10 right-10">
//         <button className="bg-[#4285F4] hover:bg-blue-600 text-white p-4 rounded-full shadow-xl hover:scale-105 transition-transform">
//             <MessageCircle size={28} />
//         </button>
//       </div>
//     </DashboardLayout>
//   )
// }

// // --- SUB-COMPONENTS ---

// function TabButton({ id, label, active, set }: any) {
//     const isActive = active === id;
//     return (
//         <button
//             onClick={() => set(id)}
//             className={`px-6 py-4 text-sm font-semibold transition-all border-b-2 relative top-[1px]
//             ${isActive 
//                 ? 'border-[#4285F4] text-[#4285F4]' 
//                 : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-t'}`}
//         >
//             {label}
//         </button>
//     )
// }

















// My code Version 2 #########################################################################################





// "use client"

// import { useState } from "react"
// import { DashboardLayout } from "@/components/layouts/dashboard-layout"
// import { 
//   FileText, 
//   Layers, 
//   Activity, 
//   CreditCard, 
//   Calendar, 
//   MessageCircle,
//   ArrowUpRight,
//   ArrowDownRight,
//   TrendingDown,
//   TrendingUp
// } from "lucide-react"

// // --- STATIC DATA (Matches your HTML Screenshot exactly) ---
// const mockData = {
//   org_name: "Demo Company (AU)",
//   period: "Jan 20, 2025 to Jan 20, 2026",
//   metrics: {
//     Revenue: 53378.32,
//     Expense: 61469.47,
//     Profit: -8091.15
//   },
//   // This HTML matches your screenshot text
//   report_html: `
//     <h3 class="text-lg font-bold text-gray-800 mb-4">Annual Financial Performance Report</h3>
//     <p class="mb-2 text-sm text-gray-600"><strong>Period:</strong> Year Ended 31 January 2026</p>
    
//     <h4 class="text-md font-bold text-gray-800 mt-6 mb-2">1. Executive Summary</h4>
//     <p class="mb-4 text-gray-700 leading-relaxed text-sm">
//       The business experienced a challenging financial period, resulting in a net loss. Total revenue generated was <strong>$53,378.32</strong>, while total expenses reached <strong>$61,469.47</strong>. Consequently, the business recorded a <strong>Net Profit of -$8,091.15</strong>. Despite a healthy Gross Profit of $52,614.68, operating expenses significantly exceeded the gross profit, leading to an overall loss for the period.
//     </p>

//     <h4 class="text-md font-bold text-gray-800 mt-6 mb-2">2. Profitability Analysis</h4>
//     <p class="mb-4 text-gray-700 leading-relaxed text-sm">
//       The business maintained a strong Gross Profit Margin of approximately <strong>98.6%</strong>. However, the Net Profit Margin was negative at <strong>-15.2%</strong>. The primary drivers of the net loss were high operating expenses relative to revenue.
//     </p>
    
//     <p class="font-semibold text-gray-800 mb-2 text-sm">Top Operating Expenses:</p>
//     <ul class="list-disc pl-5 space-y-1 text-gray-700 mb-4 text-sm">
//         <li><strong>Advertising:</strong> $4,726.20 (Nearly 9% of total revenue).</li>
//         <li><strong>Motor Vehicle Expenses:</strong> $4,589.00 (A significant operational cost).</li>
//         <li><strong>Rent:</strong> $3,600.00 (Fixed overhead cost).</li>
//         <li><strong>Wages and Salaries:</strong> $3,300.00 (Direct labor costs).</li>
//     </ul>

//     <h4 class="text-md font-bold text-gray-800 mt-6 mb-2">5. Recommendations</h4>
//     <p class="mb-4 text-gray-700 leading-relaxed text-sm">
//       <strong>Immediate Cash Flow Management:</strong> The most critical issue is the negative bank balance. The business must prioritize converting Accounts Receivable ($25,056.55) into cash immediately to cover the overdraft and pay overdue liabilities.
//     </p>
//   `,
//   gl: [
//     { Code: "200", Name: "Sales", Type: "REVENUE", Balance: 53378.32 },
//     { Code: "400", Name: "Advertising", Type: "EXPENSE", Balance: 4726.20 },
//     { Code: "404", Name: "Rent", Type: "EXPENSE", Balance: 3600.00 },
//     { Code: "410", Name: "Wages & Salaries", Type: "EXPENSE", Balance: 3300.00 },
//     { Code: "610", Name: "Accounts Payable", Type: "LIABILITY", Balance: 4500.00 },
//   ],
//   transactions: [
//     { Date: "20 Jan 2026", Type: "SPEND", Amount: 120.50, Ref: "Uber Trip" },
//     { Date: "19 Jan 2026", Type: "RECEIVE", Amount: 4500.00, Ref: "INV-001" },
//     { Date: "18 Jan 2026", Type: "SPEND", Amount: 330.00, Ref: "Officeworks" },
//   ]
// };

// export default function PerformancePage() {
//   const [activeTab, setActiveTab] = useState("report");
//   // We use mockData directly, no loading state needed
//   const data = mockData;

//   return (
//     <DashboardLayout>
//       <div className="space-y-6 animate-in fade-in duration-500 font-sans pb-20">
        
//         {/* TOP HEADER */}
//         <div className="bg-[#2c3e50] text-white p-5 rounded-t-xl shadow-lg flex justify-between items-center">
//           <div>
//             <h1 className="text-xl font-bold flex items-center gap-3">
//               <span className="bg-white/10 p-1.5 rounded text-blue-300"><Activity size={20} /></span>
//               {data.org_name}
//               <span className="text-white/40 text-sm font-light border-l border-white/20 pl-3 ml-1">Annual Performance Portal</span>
//             </h1>
//           </div>
//           <button className="text-xs bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded transition">
//             Switch Org
//           </button>
//         </div>

//         {/* MAIN CONTENT CONTAINER */}
//         <div className="bg-white rounded-b-xl shadow-sm border border-gray-200 min-h-[600px] -mt-6">
          
//           {/* TABS NAVIGATION */}
//           <div className="flex border-b border-gray-200 px-4 pt-4 bg-gray-50/50 rounded-t-xl overflow-x-auto">
//             <TabButton id="report" label="AI Report" icon={<FileText size={16}/>} active={activeTab} set={setActiveTab} />
//             <TabButton id="gl" label="General Ledger" icon={<Layers size={16}/>} active={activeTab} set={setActiveTab} />
//             <TabButton id="pnl" label="Profit & Loss" icon={<Activity size={16}/>} active={activeTab} set={setActiveTab} />
//             <TabButton id="bs" label="Balance Sheet" icon={<Activity size={16}/>} active={activeTab} set={setActiveTab} />
//             <TabButton id="tx" label="Transactions" icon={<CreditCard size={16}/>} active={activeTab} set={setActiveTab} />
//           </div>

//           {/* TAB CONTENT AREA */}
//           <div className="p-8">
            
//             {/* DATA PERIOD BADGE */}
//             <div className="inline-flex items-center gap-2 bg-gray-100 text-gray-600 px-3 py-1.5 rounded text-xs font-semibold mb-8 border border-gray-200">
//                <Calendar size={14} />
//                Data Period: {data.period}
//             </div>

//             {/* --- TAB 1: AI REPORT --- */}
//             {activeTab === 'report' && (
//               <div className="space-y-8 animate-in slide-in-from-bottom-2 duration-300">
                
//                 {/* METRIC CARDS ROW */}
//                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
//                   <MetricCard title="TOTAL REVENUE" value={data.metrics.Revenue} type="pos" />
//                   <MetricCard title="TOTAL EXPENSES" value={data.metrics.Expense} type="neg" />
//                   {/* Profit is negative here, so we use 'neg' type for red styling */}
//                   <MetricCard title="NET PROFIT" value={data.metrics.Profit} type="neg" isProfit={true} />
//                 </div>

//                 {/* STRATEGIC ANALYSIS CONTENT */}
//                 <div>
//                    <h3 className="flex items-center gap-2 font-bold text-gray-800 mb-4">
//                       <span className="text-xl">🤖</span> Strategic Analysis
//                    </h3>
//                    <div 
//                       className="prose max-w-none text-gray-600 bg-gray-50/50 p-6 rounded-xl border border-gray-100 shadow-sm"
//                       dangerouslySetInnerHTML={{ __html: data.report_html }} 
//                    />
//                 </div>
//               </div>
//             )}

//             {/* --- TAB 2: GENERAL LEDGER --- */}
//             {activeTab === 'gl' && (
//               <div className="overflow-hidden rounded-lg border border-gray-200">
//                 <table className="w-full text-sm text-left">
//                   <thead className="bg-gray-50 text-gray-500 font-semibold border-b border-gray-200">
//                       <tr>
//                           <th className="p-4">Code</th>
//                           <th className="p-4">Account Name</th>
//                           <th className="p-4">Type</th>
//                           <th className="p-4 text-right">Balance</th>
//                       </tr>
//                   </thead>
//                   <tbody className="divide-y divide-gray-100">
//                       {data.gl.map((row, i) => (
//                           <tr key={i} className="hover:bg-gray-50 bg-white">
//                               <td className="p-4 text-gray-500 font-mono text-xs">{row.Code}</td>
//                               <td className="p-4 font-medium text-gray-800">{row.Name}</td>
//                               <td className="p-4"><span className="bg-gray-100 px-2 py-1 rounded text-[10px] uppercase font-bold tracking-wider text-gray-500">{row.Type}</span></td>
//                               <td className="p-4 text-right font-bold text-gray-700 font-mono">
//                                 ${row.Balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
//                               </td>
//                           </tr>
//                       ))}
//                   </tbody>
//                 </table>
//               </div>
//             )}

//             {/* --- PLACEHOLDERS FOR OTHER TABS --- */}
//             {(activeTab === 'pnl' || activeTab === 'bs' || activeTab === 'tx') && (
//                <div className="flex flex-col items-center justify-center py-20 text-gray-400 bg-gray-50 rounded-lg border border-dashed border-gray-300">
//                  <Layers size={40} className="mb-4 opacity-20" />
//                  <p>Table data will appear here once connected.</p>
//                </div>
//             )}
//           </div>
//         </div>
//       </div>
      
//       {/* FLOATING CHATBOT BUTTON */}
//       <div className="fixed bottom-10 right-10">
//         <button className="bg-[#4285F4] hover:bg-blue-600 text-white p-4 rounded-full shadow-xl hover:scale-105 transition-transform flex items-center justify-center">
//             <MessageCircle size={28} />
//         </button>
//       </div>
//     </DashboardLayout>
//   )
// }

// // --- SUB-COMPONENTS ---

// function TabButton({ id, label, icon, active, set }: any) {
//     const isActive = active === id;
//     return (
//         <button
//             onClick={() => set(id)}
//             className={`flex items-center gap-2 px-6 py-4 text-sm font-semibold transition-all border-b-2 relative top-[1px] whitespace-nowrap
//             ${isActive 
//                 ? 'border-[#4285F4] text-[#4285F4]' 
//                 : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-t'}`}
//         >
//             {icon} {label}
//         </button>
//     )
// }

// function MetricCard({ title, value, type, isProfit }: any) {
//     // Logic: If it's profit and negative, show red. Revenue (pos) is green. Expenses (neg) are red.
//     const isNegative = value < 0;
    
//     let colorClass = "";
//     let borderClass = "";
//     let Icon = null;

//     if (title === "TOTAL REVENUE") {
//         colorClass = "text-green-600";
//         borderClass = "border-l-green-500";
//         Icon = <ArrowUpRight size={20} className="text-green-500" />;
//     } else if (title === "TOTAL EXPENSES") {
//         colorClass = "text-red-600";
//         borderClass = "border-l-red-500";
//         Icon = <ArrowUpRight size={20} className="text-red-500" />; // Expenses going up is usually bad, or neutral
//     } else {
//         // Profit Logic
//         colorClass = isNegative ? "text-red-600" : "text-[#2c3e50]";
//         borderClass = isNegative ? "border-l-red-500" : "border-l-[#2c3e50]";
//         Icon = isNegative ? <TrendingDown size={20} className="text-red-500"/> : <TrendingUp size={20} className="text-[#2c3e50]"/>;
//     }

//     return (
//         <div className={`bg-white p-5 rounded-lg shadow-sm border border-gray-100 border-l-4 ${borderClass}`}>
//             <div className="flex justify-between items-start mb-2">
//                 <div className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">{title}</div>
//                 {Icon}
//             </div>
//             <div className={`text-2xl font-bold ${colorClass}`}>
//                 ${value.toLocaleString('en-US', { minimumFractionDigits: 2 })}
//             </div>
//         </div>
//     )
// }









// My code version 3 ################################################################################






// "use client"

// import { useState, useEffect } from "react"
// import { DashboardLayout } from "@/components/layouts/dashboard-layout"
// import { 
//   FileText, 
//   Layers, 
//   Activity, 
//   CreditCard, 
//   Calendar, 
//   MessageCircle,
//   ArrowUpRight,
//   TrendingDown,
//   TrendingUp,
//   Loader2,
//   AlertCircle
// } from "lucide-react"

// // --- TYPES (Matches your Python Backend Response) ---
// type DashboardData = {
//   org_name: string;
//   metrics: { Revenue: number; Expense: number; Profit: number };
//   report_html: string;
//   meta: { start: string; end: string };
//   gl: any[];            // General Ledger Rows
//   pnl_rows: any[];      // Profit & Loss Rows (Nested Xero Structure)
//   bs_rows: any[];       // Balance Sheet Rows (Nested Xero Structure)
//   transactions: any[];  // Bank Transactions
// }

// export default function PerformancePage() {
//   const [activeTab, setActiveTab] = useState("report")
//   const [data, setData] = useState<DashboardData | null>(null)
//   const [loading, setLoading] = useState(true)
//   const [error, setError] = useState(false)

//   // 1. FETCH REAL DATA FROM PYTHON BACKEND
//   useEffect(() => {
//     fetch("http://localhost:8000/api/dashboard")
//       .then(async (res) => {
//         if (res.status === 401) {
//             // Not logged in: Redirect to login or show connect button
//             setLoading(false);
//             return null;
//         }
//         if (!res.ok) throw new Error("Backend Error");
//         return res.json();
//       })
//       .then((json) => {
//         if (json) setData(json);
//         setLoading(false);
//       })
//       .catch((err) => {
//         console.error("Connection Error:", err);
//         setError(true);
//         setLoading(false);
//       });
//   }, [])

//   // 2. CONNECTION HELPER
//   const connectXero = () => {
//     window.location.href = "http://localhost:8000/login";
//   }

//   // --- LOADING STATE ---
//   if (loading) {
//     return (
//       <DashboardLayout>
//         <div className="h-[70vh] flex flex-col items-center justify-center text-gray-500 gap-4">
//           <Loader2 className="animate-spin text-blue-600" size={40} />
//           <p className="font-medium">Analyzing Real-Time Xero Data...</p>
//         </div>
//       </DashboardLayout>
//     )
//   }

//   // --- ERROR STATE ---
//   if (error) {
//     return (
//       <DashboardLayout>
//         <div className="h-[70vh] flex flex-col items-center justify-center text-red-500 gap-4">
//           <AlertCircle size={48} />
//           <h3 className="text-xl font-bold">Cannot Connect to Analysis Engine</h3>
//           <p className="text-gray-500">Is your Python backend running on port 8000?</p>
//           <button onClick={() => window.location.reload()} className="px-4 py-2 bg-gray-100 rounded hover:bg-gray-200 text-sm text-gray-700">Retry Connection</button>
//         </div>
//       </DashboardLayout>
//     )
//   }

//   // --- NOT CONNECTED STATE ---
//   if (!data) {
//     return (
//       <DashboardLayout>
//          <div className="min-h-[70vh] flex flex-col items-center justify-center bg-gray-50 rounded-xl border border-dashed border-gray-300 p-10">
//             <div className="bg-white p-4 rounded-full shadow-sm mb-6">
//                 <Activity size={40} className="text-blue-600" />
//             </div>
//             <h2 className="text-2xl font-bold text-gray-800 mb-2">Connect Your Data</h2>
//             <p className="text-gray-500 max-w-md text-center mb-8">
//                 Connect your Xero organization to generate the Annual Performance Report and AI insights.
//             </p>
//             <button 
//                 onClick={connectXero}
//                 className="bg-[#2c3e50] hover:bg-[#34495e] text-white px-8 py-3 rounded-lg font-semibold transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
//             >
//                 Connect Xero
//             </button>
//          </div>
//       </DashboardLayout>
//     )
//   }

//   // --- SUCCESS STATE (RENDER DATA) ---
//   return (
//     <DashboardLayout>
//       <div className="space-y-6 animate-in fade-in duration-500 font-sans pb-20">
        
//         {/* TOP HEADER */}
//         <div className="bg-[#2c3e50] text-white p-5 rounded-t-xl shadow-lg flex justify-between items-center">
//           <div>
//             <h1 className="text-xl font-bold flex items-center gap-3">
//               <span className="bg-white/10 p-1.5 rounded text-blue-300"><Activity size={20} /></span>
//               {data.org_name}
//               <span className="text-white/40 text-sm font-light border-l border-white/20 pl-3 ml-1">Annual Performance Portal</span>
//             </h1>
//           </div>
//           <a href="http://localhost:8000/select-org" className="text-xs bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded transition no-underline">
//             Switch Org
//           </a>
//         </div>

//         {/* MAIN CONTENT CONTAINER */}
//         <div className="bg-white rounded-b-xl shadow-sm border border-gray-200 min-h-[600px] -mt-6">
          
//           {/* TABS NAVIGATION */}
//           <div className="flex border-b border-gray-200 px-4 pt-4 bg-gray-50/50 rounded-t-xl overflow-x-auto">
//             <TabButton id="report" label="AI Report" icon={<FileText size={16}/>} active={activeTab} set={setActiveTab} />
//             <TabButton id="gl" label="General Ledger" icon={<Layers size={16}/>} active={activeTab} set={setActiveTab} />
//             <TabButton id="pnl" label="Profit & Loss" icon={<Activity size={16}/>} active={activeTab} set={setActiveTab} />
//             <TabButton id="bs" label="Balance Sheet" icon={<Activity size={16}/>} active={activeTab} set={setActiveTab} />
//             <TabButton id="tx" label="Transactions" icon={<CreditCard size={16}/>} active={activeTab} set={setActiveTab} />
//           </div>

//           {/* TAB CONTENT AREA */}
//           <div className="p-8">
            
//             {/* DATA PERIOD BADGE */}
//             <div className="inline-flex items-center gap-2 bg-gray-100 text-gray-600 px-3 py-1.5 rounded text-xs font-semibold mb-8 border border-gray-200">
//                <Calendar size={14} />
//                Data Period: {data.meta.start} to {data.meta.end}
//             </div>

//             {/* --- TAB 1: AI REPORT --- */}
//             {activeTab === 'report' && (
//               <div className="space-y-8 animate-in slide-in-from-bottom-2 duration-300">
//                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
//                   <MetricCard title="TOTAL REVENUE" value={data.metrics.Revenue} type="pos" />
//                   <MetricCard title="TOTAL EXPENSES" value={data.metrics.Expense} type="neg" />
//                   <MetricCard title="NET PROFIT" value={data.metrics.Profit} type="neu" isProfit={true} />
//                 </div>
//                 <div>
//                    <h3 className="flex items-center gap-2 font-bold text-gray-800 mb-4">
//                       <span className="text-xl">🤖</span> Strategic Analysis
//                    </h3>
//                    <div 
//                       className="prose max-w-none text-gray-600 bg-gray-50/50 p-6 rounded-xl border border-gray-100 shadow-sm"
//                       dangerouslySetInnerHTML={{ __html: data.report_html }} 
//                    />
//                 </div>
//               </div>
//             )}

//             {/* --- TAB 2: GENERAL LEDGER --- */}
//             {activeTab === 'gl' && (
//               <div className="overflow-hidden rounded-lg border border-gray-200">
//                 <table className="w-full text-sm text-left">
//                   <thead className="bg-gray-50 text-gray-500 font-semibold border-b border-gray-200">
//                       <tr>
//                           <th className="p-4">Code</th>
//                           <th className="p-4">Account Name</th>
//                           <th className="p-4">Type</th>
//                           <th className="p-4 text-right">Balance</th>
//                       </tr>
//                   </thead>
//                   <tbody className="divide-y divide-gray-100">
//                       {data.gl.map((row, i) => (
//                           <tr key={i} className="hover:bg-gray-50 bg-white">
//                               <td className="p-4 text-gray-500 font-mono text-xs">{row.Code}</td>
//                               <td className="p-4 font-medium text-gray-800">{row.Name}</td>
//                               <td className="p-4"><span className="bg-gray-100 px-2 py-1 rounded text-[10px] uppercase font-bold tracking-wider text-gray-500">{row.Type}</span></td>
//                               <td className="p-4 text-right font-bold text-gray-700 font-mono">
//                                 {row.BalanceFmt}
//                               </td>
//                           </tr>
//                       ))}
//                   </tbody>
//                 </table>
//               </div>
//             )}

//             {/* --- TAB 3: PROFIT & LOSS (Dynamic Xero Table) --- */}
//             {activeTab === 'pnl' && <XeroTable rows={data.pnl_rows} />}

//             {/* --- TAB 4: BALANCE SHEET (Dynamic Xero Table) --- */}
//             {activeTab === 'bs' && <XeroTable rows={data.bs_rows} />}

//             {/* --- TAB 5: TRANSACTIONS --- */}
//             {activeTab === 'tx' && (
//                <div className="overflow-hidden rounded-lg border border-gray-200">
//                <table className="w-full text-sm text-left">
//                  <thead className="bg-gray-50 text-gray-500 font-semibold border-b border-gray-200">
//                      <tr>
//                          <th className="p-4">Date</th>
//                          <th className="p-4">Type</th>
//                          <th className="p-4">Reference</th>
//                          <th className="p-4 text-right">Amount</th>
//                      </tr>
//                  </thead>
//                  <tbody className="divide-y divide-gray-100">
//                      {data.transactions.map((tx: any, i: number) => (
//                          <tr key={i} className="hover:bg-gray-50 bg-white">
//                              <td className="p-4 text-gray-600">{tx.DateString}</td>
//                              <td className="p-4 text-xs font-bold text-gray-500 uppercase">{tx.Type}</td>
//                              <td className="p-4 text-gray-600">{tx.Reference || '-'}</td>
//                              <td className="p-4 text-right font-bold text-gray-700 font-mono">
//                                ${parseFloat(tx.Total).toLocaleString(undefined, {minimumFractionDigits: 2})}
//                              </td>
//                          </tr>
//                      ))}
//                  </tbody>
//                </table>
//              </div>
//             )}
//           </div>
//         </div>
//       </div>
      
//       {/* FLOATING CHATBOT BUTTON */}
//       <div className="fixed bottom-10 right-10">
//         <button className="bg-[#4285F4] hover:bg-blue-600 text-white p-4 rounded-full shadow-xl hover:scale-105 transition-transform flex items-center justify-center">
//             <MessageCircle size={28} />
//         </button>
//       </div>
//     </DashboardLayout>
//   )
// }

// // --- SUB-COMPONENTS ---

// function TabButton({ id, label, icon, active, set }: any) {
//     const isActive = active === id;
//     return (
//         <button
//             onClick={() => set(id)}
//             className={`flex items-center gap-2 px-6 py-4 text-sm font-semibold transition-all border-b-2 relative top-[1px] whitespace-nowrap
//             ${isActive 
//                 ? 'border-[#4285F4] text-[#4285F4]' 
//                 : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-t'}`}
//         >
//             {icon} {label}
//         </button>
//     )
// }

// function MetricCard({ title, value, type, isProfit }: any) {
//     const isNegative = value < 0;
    
//     let colorClass = "";
//     let borderClass = "";
//     let Icon = null;

//     if (title === "TOTAL REVENUE") {
//         colorClass = "text-green-600";
//         borderClass = "border-l-green-500";
//         Icon = <ArrowUpRight size={20} className="text-green-500" />;
//     } else if (title === "TOTAL EXPENSES") {
//         colorClass = "text-red-600";
//         borderClass = "border-l-red-500";
//         Icon = <ArrowUpRight size={20} className="text-red-500" />; 
//     } else {
//         colorClass = isNegative ? "text-red-600" : "text-[#2c3e50]";
//         borderClass = isNegative ? "border-l-red-500" : "border-l-[#2c3e50]";
//         Icon = isNegative ? <TrendingDown size={20} className="text-red-500"/> : <TrendingUp size={20} className="text-[#2c3e50]"/>;
//     }

//     return (
//         <div className={`bg-white p-5 rounded-lg shadow-sm border border-gray-100 border-l-4 ${borderClass}`}>
//             <div className="flex justify-between items-start mb-2">
//                 <div className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">{title}</div>
//                 {Icon}
//             </div>
//             <div className={`text-2xl font-bold ${colorClass}`}>
//                 ${value?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
//             </div>
//         </div>
//     )
// }

// // This helper parses Xero's nested "Section -> Rows" structure dynamically
// function XeroTable({ rows }: { rows: any[] }) {
//     if (!rows || rows.length === 0) return <div className="text-center p-10 text-gray-400 border border-dashed rounded">No Data Available</div>;

//     return (
//         <div className="overflow-x-auto rounded-lg border border-gray-200">
//         <table className="w-full text-sm border-collapse">
//             <tbody>
//                 {rows.map((section, idx) => {
//                     if (section.RowType === "Header") return null;
//                     if (section.RowType === "Section") {
//                         return (
//                             <>
//                                 <tr key={idx} className="bg-gray-50 border-b border-gray-200">
//                                     <td colSpan={2} className="p-3 pl-4 font-bold text-gray-700 text-xs uppercase tracking-wide">{section.Title}</td>
//                                 </tr>
//                                 {section.Rows && section.Rows.map((row: any, rIdx: number) => (
//                                     <tr key={`${idx}-${rIdx}`} className="border-b border-gray-100 hover:bg-gray-50 bg-white">
//                                         <td className="p-3 pl-6 text-gray-600">{row.Cells[0].Value}</td>
//                                         <td className="p-3 pr-6 text-right font-mono text-gray-800">
//                                             {row.Cells.length > 1 ? row.Cells[1].Value : ""}
//                                         </td>
//                                     </tr>
//                                 ))}
//                             </>
//                         );
//                     }
//                     if (section.RowType === "Row") {
//                          return (
//                             <tr key={idx} className="bg-gray-50 border-t border-gray-200 font-bold">
//                                 <td className="p-3 pl-4 text-gray-800">{section.Cells[0].Value}</td>
//                                 <td className="p-3 pr-6 text-right text-gray-900">{section.Cells[1].Value}</td>
//                             </tr>
//                          )
//                     }
//                     return null;
//                 })}
//             </tbody>
//         </table>
//         </div>
//     );
// }












// My code Version 4 (Correct one) #######################################################################################









// "use client"

// import { useState, useEffect } from "react"
// import { DashboardLayout } from "@/components/layouts/dashboard-layout"
// import { 
//   FileText, 
//   Layers, 
//   Activity, 
//   CreditCard, 
//   Calendar, 
//   MessageCircle,
//   ArrowUpRight,
//   TrendingDown,
//   TrendingUp,
//   Loader2,
//   AlertCircle
// } from "lucide-react"

// // --- TYPES ---
// type DashboardData = {
//   org_name: string;
//   metrics: { Revenue: number; Expense: number; Profit: number };
//   report_html: string;
//   meta: { start: string; end: string };
//   gl: any[];
//   pnl_rows: any[];
//   bs_rows: any[];
//   transactions: any[];
// }

// // --- MAIN COMPONENT (MUST HAVE 'export default') ---
// export default function PerformancePage() {
//   const [activeTab, setActiveTab] = useState("report")
//   const [data, setData] = useState<DashboardData | null>(null)
//   const [loading, setLoading] = useState(true)
//   const [error, setError] = useState(false)

//   // 1. FETCH REAL DATA FROM PYTHON BACKEND
//   useEffect(() => {
//     fetch("http://localhost:8000/api/dashboard")
//       .then(async (res) => {
//         if (res.status === 401) {
//             // Not logged in
//             setLoading(false);
//             return null;
//         }
//         if (!res.ok) throw new Error("Backend Error");
//         return res.json();
//       })
//       .then((json) => {
//         if (json) setData(json);
//         setLoading(false);
//       })
//       .catch((err) => {
//         console.error("Connection Error:", err);
//         setError(true);
//         setLoading(false);
//       });
//   }, [])

//   // 2. CONNECTION HELPER
//   const connectXero = () => {
//     window.location.href = "http://localhost:8000/login";
//   }

//   // --- LOADING STATE ---
//   if (loading) {
//     return (
//       <DashboardLayout>
//         <div className="h-[70vh] flex flex-col items-center justify-center text-gray-500 gap-4">
//           <Loader2 className="animate-spin text-blue-600" size={40} />
//           <p className="font-medium">Analyzing Real-Time Xero Data...</p>
//         </div>
//       </DashboardLayout>
//     )
//   }

//   // --- ERROR STATE ---
//   if (error) {
//     return (
//       <DashboardLayout>
//         <div className="h-[70vh] flex flex-col items-center justify-center text-red-500 gap-4">
//           <AlertCircle size={48} />
//           <h3 className="text-xl font-bold">Cannot Connect to Analysis Engine</h3>
//           <p className="text-gray-500">Is your Python backend running on port 8000?</p>
//           <button onClick={() => window.location.reload()} className="px-4 py-2 bg-gray-100 rounded hover:bg-gray-200 text-sm text-gray-700">Retry Connection</button>
//         </div>
//       </DashboardLayout>
//     )
//   }

//   // --- NOT CONNECTED STATE ---
//   if (!data) {
//     return (
//       <DashboardLayout>
//          <div className="min-h-[70vh] flex flex-col items-center justify-center bg-gray-50 rounded-xl border border-dashed border-gray-300 p-10">
//             <div className="bg-white p-4 rounded-full shadow-sm mb-6">
//                 <Activity size={40} className="text-blue-600" />
//             </div>
//             <h2 className="text-2xl font-bold text-gray-800 mb-2">Connect Your Data</h2>
//             <p className="text-gray-500 max-w-md text-center mb-8">
//                 Connect your Xero organization to generate the Annual Performance Report and AI insights.
//             </p>
//             <button 
//                 onClick={connectXero}
//                 className="bg-[#2c3e50] hover:bg-[#34495e] text-white px-8 py-3 rounded-lg font-semibold transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
//             >
//                 Connect Xero
//             </button>
//          </div>
//       </DashboardLayout>
//     )
//   }

//   // --- SUCCESS STATE (RENDER DATA) ---
//   return (
//     <DashboardLayout>
//       <div className="space-y-6 animate-in fade-in duration-500 font-sans pb-20">
        
//         {/* TOP HEADER */}
//         <div className="bg-[#2c3e50] text-white p-5 rounded-t-xl shadow-lg flex justify-between items-center">
//           <div>
//             <h1 className="text-xl font-bold flex items-center gap-3">
//               <span className="bg-white/10 p-1.5 rounded text-blue-300"><Activity size={20} /></span>
//               {data.org_name}
//               <span className="text-white/40 text-sm font-light border-l border-white/20 pl-3 ml-1">Annual Performance Portal</span>
//             </h1>
//           </div>
//           <a href="http://localhost:8000/select-org" className="text-xs bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded transition no-underline">
//             Switch Org
//           </a>
//         </div>

//         {/* MAIN CONTENT CONTAINER */}
//         <div className="bg-white rounded-b-xl shadow-sm border border-gray-200 min-h-[600px] -mt-6">
          
//           {/* TABS NAVIGATION */}
//           <div className="flex border-b border-gray-200 px-4 pt-4 bg-gray-50/50 rounded-t-xl overflow-x-auto">
//             <TabButton id="report" label="AI Report" icon={<FileText size={16}/>} active={activeTab} set={setActiveTab} />
//             <TabButton id="gl" label="General Ledger" icon={<Layers size={16}/>} active={activeTab} set={setActiveTab} />
//             <TabButton id="pnl" label="Profit & Loss" icon={<Activity size={16}/>} active={activeTab} set={setActiveTab} />
//             <TabButton id="bs" label="Balance Sheet" icon={<Activity size={16}/>} active={activeTab} set={setActiveTab} />
//             <TabButton id="tx" label="Transactions" icon={<CreditCard size={16}/>} active={activeTab} set={setActiveTab} />
//           </div>

//           {/* TAB CONTENT AREA */}
//           <div className="p-8">
            
//             {/* DATA PERIOD BADGE */}
//             <div className="inline-flex items-center gap-2 bg-gray-100 text-gray-600 px-3 py-1.5 rounded text-xs font-semibold mb-8 border border-gray-200">
//                <Calendar size={14} />
//                Data Period: {data.meta.start} to {data.meta.end}
//             </div>

//             {/* --- TAB 1: AI REPORT --- */}
//             {activeTab === 'report' && (
//               <div className="space-y-8 animate-in slide-in-from-bottom-2 duration-300">
//                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
//                   <MetricCard title="TOTAL REVENUE" value={data.metrics.Revenue} type="pos" />
//                   <MetricCard title="TOTAL EXPENSES" value={data.metrics.Expense} type="neg" />
//                   <MetricCard title="NET PROFIT" value={data.metrics.Profit} type="neu" isProfit={true} />
//                 </div>
//                 <div>
//                    <h3 className="flex items-center gap-2 font-bold text-gray-800 mb-4">
//                       <span className="text-xl">🤖</span> Strategic Analysis
//                    </h3>
//                    <div 
//                       className="prose max-w-none text-gray-600 bg-gray-50/50 p-6 rounded-xl border border-gray-100 shadow-sm"
//                       dangerouslySetInnerHTML={{ __html: data.report_html }} 
//                    />
//                 </div>
//               </div>
//             )}

//             {/* --- TAB 2: GENERAL LEDGER --- */}
//             {activeTab === 'gl' && (
//               <div className="overflow-hidden rounded-lg border border-gray-200">
//                 <table className="w-full text-sm text-left">
//                   <thead className="bg-gray-50 text-gray-500 font-semibold border-b border-gray-200">
//                       <tr>
//                           <th className="p-4">Code</th>
//                           <th className="p-4">Account Name</th>
//                           <th className="p-4">Type</th>
//                           <th className="p-4 text-right">Balance</th>
//                       </tr>
//                   </thead>
//                   <tbody className="divide-y divide-gray-100">
//                       {data.gl.map((row, i) => (
//                           <tr key={i} className="hover:bg-gray-50 bg-white">
//                               <td className="p-4 text-gray-500 font-mono text-xs">{row.Code}</td>
//                               <td className="p-4 font-medium text-gray-800">{row.Name}</td>
//                               <td className="p-4"><span className="bg-gray-100 px-2 py-1 rounded text-[10px] uppercase font-bold tracking-wider text-gray-500">{row.Type}</span></td>
//                               <td className="p-4 text-right font-bold text-gray-700 font-mono">
//                                 {row.BalanceFmt}
//                               </td>
//                           </tr>
//                       ))}
//                   </tbody>
//                 </table>
//               </div>
//             )}

//             {/* --- TAB 3: PROFIT & LOSS --- */}
//             {activeTab === 'pnl' && <XeroTable rows={data.pnl_rows} />}

//             {/* --- TAB 4: BALANCE SHEET --- */}
//             {activeTab === 'bs' && <XeroTable rows={data.bs_rows} />}

//             {/* --- TAB 5: TRANSACTIONS --- */}
//             {activeTab === 'tx' && (
//                <div className="overflow-hidden rounded-lg border border-gray-200">
//                <table className="w-full text-sm text-left">
//                  <thead className="bg-gray-50 text-gray-500 font-semibold border-b border-gray-200">
//                      <tr>
//                          <th className="p-4">Date</th>
//                          <th className="p-4">Type</th>
//                          <th className="p-4">Reference</th>
//                          <th className="p-4 text-right">Amount</th>
//                      </tr>
//                  </thead>
//                  <tbody className="divide-y divide-gray-100">
//                      {data.transactions.map((tx: any, i: number) => (
//                          <tr key={i} className="hover:bg-gray-50 bg-white">
//                              <td className="p-4 text-gray-600">{tx.DateString}</td>
//                              <td className="p-4 text-xs font-bold text-gray-500 uppercase">{tx.Type}</td>
//                              <td className="p-4 text-gray-600">{tx.Reference || '-'}</td>
//                              <td className="p-4 text-right font-bold text-gray-700 font-mono">
//                                ${parseFloat(tx.Total).toLocaleString(undefined, {minimumFractionDigits: 2})}
//                              </td>
//                          </tr>
//                      ))}
//                  </tbody>
//                </table>
//              </div>
//             )}
//           </div>
//         </div>
//       </div>
      
//       {/* FLOATING CHATBOT BUTTON */}
//       <div className="fixed bottom-10 right-10">
//         <button className="bg-[#4285F4] hover:bg-blue-600 text-white p-4 rounded-full shadow-xl hover:scale-105 transition-transform flex items-center justify-center">
//             <MessageCircle size={28} />
//         </button>
//       </div>
//     </DashboardLayout>
//   )
// }

// // --- SUB-COMPONENTS ---

// function TabButton({ id, label, icon, active, set }: any) {
//     const isActive = active === id;
//     return (
//         <button
//             onClick={() => set(id)}
//             className={`flex items-center gap-2 px-6 py-4 text-sm font-semibold transition-all border-b-2 relative top-[1px] whitespace-nowrap
//             ${isActive 
//                 ? 'border-[#4285F4] text-[#4285F4]' 
//                 : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-t'}`}
//         >
//             {icon} {label}
//         </button>
//     )
// }

// function MetricCard({ title, value, type, isProfit }: any) {
//     const isNegative = value < 0;
    
//     let colorClass = "";
//     let borderClass = "";
//     let Icon = null;

//     if (title === "TOTAL REVENUE") {
//         colorClass = "text-green-600";
//         borderClass = "border-l-green-500";
//         Icon = <ArrowUpRight size={20} className="text-green-500" />;
//     } else if (title === "TOTAL EXPENSES") {
//         colorClass = "text-red-600";
//         borderClass = "border-l-red-500";
//         Icon = <ArrowUpRight size={20} className="text-red-500" />; 
//     } else {
//         colorClass = isNegative ? "text-red-600" : "text-[#2c3e50]";
//         borderClass = isNegative ? "border-l-red-500" : "border-l-[#2c3e50]";
//         Icon = isNegative ? <TrendingDown size={20} className="text-red-500"/> : <TrendingUp size={20} className="text-[#2c3e50]"/>;
//     }

//     return (
//         <div className={`bg-white p-5 rounded-lg shadow-sm border border-gray-100 border-l-4 ${borderClass}`}>
//             <div className="flex justify-between items-start mb-2">
//                 <div className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">{title}</div>
//                 {Icon}
//             </div>
//             <div className={`text-2xl font-bold ${colorClass}`}>
//                 ${value?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
//             </div>
//         </div>
//     )
// }

// function XeroTable({ rows }: { rows: any[] }) {
//     if (!rows || rows.length === 0) return <div className="text-center p-10 text-gray-400 border border-dashed rounded">No Data Available</div>;

//     return (
//         <div className="overflow-x-auto rounded-lg border border-gray-200">
//         <table className="w-full text-sm border-collapse">
//             <tbody>
//                 {rows.map((section, idx) => {
//                     if (section.RowType === "Header") return null;
//                     if (section.RowType === "Section") {
//                         return (
//                             <>
//                                 <tr key={idx} className="bg-gray-50 border-b border-gray-200">
//                                     <td colSpan={2} className="p-3 pl-4 font-bold text-gray-700 text-xs uppercase tracking-wide">{section.Title}</td>
//                                 </tr>
//                                 {section.Rows && section.Rows.map((row: any, rIdx: number) => (
//                                     <tr key={`${idx}-${rIdx}`} className="border-b border-gray-100 hover:bg-gray-50 bg-white">
//                                         <td className="p-3 pl-6 text-gray-600">{row.Cells[0].Value}</td>
//                                         <td className="p-3 pr-6 text-right font-mono text-gray-800">
//                                             {row.Cells.length > 1 ? row.Cells[1].Value : ""}
//                                         </td>
//                                     </tr>
//                                 ))}
//                             </>
//                         );
//                     }
//                     if (section.RowType === "Row") {
//                          return (
//                             <tr key={idx} className="bg-gray-50 border-t border-gray-200 font-bold">
//                                 <td className="p-3 pl-4 text-gray-800">{section.Cells[0].Value}</td>
//                                 <td className="p-3 pr-6 text-right text-gray-900">{section.Cells[1].Value}</td>
//                             </tr>
//                          )
//                     }
//                     return null;
//                 })}
//             </tbody>
//         </table>
//         </div>
//     );
// }










// My code version 5 With proper formating of report #####################################################




"use client"

import { useState, useEffect, Fragment } from "react" // <--- Added Fragment here
import { DashboardLayout } from "@/components/layouts/dashboard-layout"
import { 
  FileText, 
  Layers, 
  Activity, 
  CreditCard, 
  Calendar, 
  MessageCircle,
  ArrowUpRight,
  TrendingDown,
  TrendingUp,
  Loader2,
  AlertCircle
} from "lucide-react"

// --- TYPES ---
type DashboardData = {
  org_name: string;
  metrics: { Revenue: number; Expense: number; Profit: number };
  report_html: string;
  meta: { start: string; end: string };
  gl: any[];
  pnl_rows: any[];
  bs_rows: any[];
  transactions: any[];
}

export default function PerformancePage() {
  const [activeTab, setActiveTab] = useState("report")
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  // 1. FETCH REAL DATA
  useEffect(() => {
    fetch("http://localhost:8000/api/dashboard")
      .then(async (res) => {
        if (res.status === 401) {
            setLoading(false);
            return null;
        }
        if (!res.ok) throw new Error("Backend Error");
        return res.json();
      })
      .then((json) => {
        if (json) setData(json);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Connection Error:", err);
        setError(true);
        setLoading(false);
      });
  }, [])

  // 2. CONNECTION HELPER
  const connectXero = () => {
    window.location.href = "http://localhost:8000/login";
  }

  // --- LOADING STATE ---
  if (loading) {
    return (
      <DashboardLayout>
        <div className="h-[70vh] flex flex-col items-center justify-center text-gray-500 gap-4">
          <Loader2 className="animate-spin text-blue-600" size={40} />
          <p className="font-medium">Analyzing Real-Time Xero Data...</p>
        </div>
      </DashboardLayout>
    )
  }

  // --- ERROR STATE ---
  if (error) {
    return (
      <DashboardLayout>
        <div className="h-[70vh] flex flex-col items-center justify-center text-red-500 gap-4">
          <AlertCircle size={48} />
          <h3 className="text-xl font-bold">Cannot Connect to Analysis Engine</h3>
          <p className="text-gray-500">Is your Python backend running on port 8000?</p>
          <button onClick={() => window.location.reload()} className="px-4 py-2 bg-gray-100 rounded hover:bg-gray-200 text-sm text-gray-700">Retry Connection</button>
        </div>
      </DashboardLayout>
    )
  }

  // --- NOT CONNECTED STATE ---
  if (!data) {
    return (
      <DashboardLayout>
         <div className="min-h-[70vh] flex flex-col items-center justify-center bg-gray-50 rounded-xl border border-dashed border-gray-300 p-10">
            <div className="bg-white p-4 rounded-full shadow-sm mb-6">
                <Activity size={40} className="text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Connect Your Data</h2>
            <p className="text-gray-500 max-w-md text-center mb-8">
                Connect your Xero organization to generate the Annual Performance Report and AI insights.
            </p>
            <button 
                onClick={connectXero}
                className="bg-[#2c3e50] hover:bg-[#34495e] text-white px-8 py-3 rounded-lg font-semibold transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
            >
                Connect Xero
            </button>
         </div>
      </DashboardLayout>
    )
  }

  // --- SUCCESS STATE ---
  return (
    <DashboardLayout>
      <div className="space-y-6 animate-in fade-in duration-500 font-sans pb-20">
        
        {/* CSS TO FIX HEADINGS */}
        <style jsx global>{`
          .report-content h3 { font-size: 1.25rem; font-weight: 700; color: #111827; margin-top: 1.75rem; margin-bottom: 0.75rem; }
          .report-content h4 { font-size: 1.1rem; font-weight: 600; color: #374151; margin-top: 1.5rem; margin-bottom: 0.5rem; }
          .report-content p { margin-bottom: 1rem; line-height: 1.7; color: #4b5563; }
          .report-content ul { list-style-type: disc; padding-left: 1.5rem; margin-bottom: 1.5rem; }
          .report-content li { margin-bottom: 0.5rem; color: #4b5563; }
          .report-content strong { color: #111827; font-weight: 600; }
        `}</style>

        {/* TOP HEADER */}
        <div className="bg-[#2c3e50] text-white p-5 rounded-t-xl shadow-lg flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold flex items-center gap-3">
              <span className="bg-white/10 p-1.5 rounded text-blue-300"><Activity size={20} /></span>
              {data.org_name}
              <span className="text-white/40 text-sm font-light border-l border-white/20 pl-3 ml-1">Annual Performance Portal</span>
            </h1>
          </div>
          <a href="http://localhost:8000/select-org" className="text-xs bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded transition no-underline">
            Switch Org
          </a>
        </div>

        {/* MAIN CONTENT CONTAINER */}
        <div className="bg-white rounded-b-xl shadow-sm border border-gray-200 min-h-[600px] -mt-6">
          
          {/* TABS NAVIGATION */}
          <div className="flex border-b border-gray-200 px-4 pt-4 bg-gray-50/50 rounded-t-xl overflow-x-auto">
            <TabButton id="report" label="AI Report" icon={<FileText size={16}/>} active={activeTab} set={setActiveTab} />
            <TabButton id="gl" label="General Ledger" icon={<Layers size={16}/>} active={activeTab} set={setActiveTab} />
            <TabButton id="pnl" label="Profit & Loss" icon={<Activity size={16}/>} active={activeTab} set={setActiveTab} />
            <TabButton id="bs" label="Balance Sheet" icon={<Activity size={16}/>} active={activeTab} set={setActiveTab} />
            <TabButton id="tx" label="Transactions" icon={<CreditCard size={16}/>} active={activeTab} set={setActiveTab} />
          </div>

          {/* TAB CONTENT AREA */}
          <div className="p-8">
            
            {/* DATA PERIOD BADGE */}
            <div className="inline-flex items-center gap-2 bg-gray-100 text-gray-600 px-3 py-1.5 rounded text-xs font-semibold mb-8 border border-gray-200">
               <Calendar size={14} />
               Data Period: {data.meta.start} to {data.meta.end}
            </div>

            {/* --- TAB 1: AI REPORT --- */}
            {activeTab === 'report' && (
              <div className="space-y-8 animate-in slide-in-from-bottom-2 duration-300">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <MetricCard title="TOTAL REVENUE" value={data.metrics.Revenue} type="pos" />
                  <MetricCard title="TOTAL EXPENSES" value={data.metrics.Expense} type="neg" />
                  <MetricCard title="NET PROFIT" value={data.metrics.Profit} type="neu" isProfit={true} />
                </div>
                <div>
                   <h3 className="flex items-center gap-2 font-bold text-gray-800 mb-4">
                      <span className="text-xl">🤖</span> Strategic Analysis
                   </h3>
                   <div 
                      className="report-content bg-gray-50/50 p-8 rounded-xl border border-gray-100 shadow-sm"
                      dangerouslySetInnerHTML={{ __html: data.report_html }} 
                   />
                </div>
              </div>
            )}

            {/* --- TAB 2: GENERAL LEDGER --- */}
            {activeTab === 'gl' && (
              <div className="overflow-hidden rounded-lg border border-gray-200">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50 text-gray-500 font-semibold border-b border-gray-200">
                      <tr>
                          <th className="p-4">Code</th>
                          <th className="p-4">Account Name</th>
                          <th className="p-4">Type</th>
                          <th className="p-4 text-right">Balance</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                      {data.gl.map((row, i) => (
                          <tr key={i} className="hover:bg-gray-50 bg-white">
                              <td className="p-4 text-gray-500 font-mono text-xs">{row.Code}</td>
                              <td className="p-4 font-medium text-gray-800">{row.Name}</td>
                              <td className="p-4"><span className="bg-gray-100 px-2 py-1 rounded text-[10px] uppercase font-bold tracking-wider text-gray-500">{row.Type}</span></td>
                              <td className="p-4 text-right font-bold text-gray-700 font-mono">
                                {row.BalanceFmt}
                              </td>
                          </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* --- TAB 3: PROFIT & LOSS --- */}
            {activeTab === 'pnl' && <XeroTable rows={data.pnl_rows} />}

            {/* --- TAB 4: BALANCE SHEET --- */}
            {activeTab === 'bs' && <XeroTable rows={data.bs_rows} />}

            {/* --- TAB 5: TRANSACTIONS --- */}
            {activeTab === 'tx' && (
               <div className="overflow-hidden rounded-lg border border-gray-200">
               <table className="w-full text-sm text-left">
                 <thead className="bg-gray-50 text-gray-500 font-semibold border-b border-gray-200">
                     <tr>
                         <th className="p-4">Date</th>
                         <th className="p-4">Type</th>
                         <th className="p-4">Reference</th>
                         <th className="p-4 text-right">Amount</th>
                     </tr>
                 </thead>
                 <tbody className="divide-y divide-gray-100">
                     {data.transactions.map((tx: any, i: number) => (
                         <tr key={i} className="hover:bg-gray-50 bg-white">
                             <td className="p-4 text-gray-600">{tx.DateString}</td>
                             <td className="p-4 text-xs font-bold text-gray-500 uppercase">{tx.Type}</td>
                             <td className="p-4 text-gray-600">{tx.Reference || '-'}</td>
                             <td className="p-4 text-right font-bold text-gray-700 font-mono">
                               ${parseFloat(tx.Total).toLocaleString(undefined, {minimumFractionDigits: 2})}
                             </td>
                         </tr>
                     ))}
                 </tbody>
               </table>
             </div>
            )}
          </div>
        </div>
      </div>
      
      {/* FLOATING CHATBOT BUTTON */}
      <div className="fixed bottom-10 right-10">
        <button className="bg-[#4285F4] hover:bg-blue-600 text-white p-4 rounded-full shadow-xl hover:scale-105 transition-transform flex items-center justify-center">
            <MessageCircle size={28} />
        </button>
      </div>
    </DashboardLayout>
  )
}

// --- SUB-COMPONENTS ---

function TabButton({ id, label, icon, active, set }: any) {
    const isActive = active === id;
    return (
        <button
            onClick={() => set(id)}
            className={`flex items-center gap-2 px-6 py-4 text-sm font-semibold transition-all border-b-2 relative top-[1px] whitespace-nowrap
            ${isActive 
                ? 'border-[#4285F4] text-[#4285F4]' 
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-t'}`}
        >
            {icon} {label}
        </button>
    )
}

function MetricCard({ title, value, type, isProfit }: any) {
    const isNegative = value < 0;
    
    let colorClass = "";
    let borderClass = "";
    let Icon = null;

    if (title === "TOTAL REVENUE") {
        colorClass = "text-green-600";
        borderClass = "border-l-green-500";
        Icon = <ArrowUpRight size={20} className="text-green-500" />;
    } else if (title === "TOTAL EXPENSES") {
        colorClass = "text-red-600";
        borderClass = "border-l-red-500";
        Icon = <ArrowUpRight size={20} className="text-red-500" />; 
    } else {
        colorClass = isNegative ? "text-red-600" : "text-[#2c3e50]";
        borderClass = isNegative ? "border-l-red-500" : "border-l-[#2c3e50]";
        Icon = isNegative ? <TrendingDown size={20} className="text-red-500"/> : <TrendingUp size={20} className="text-[#2c3e50]"/>;
    }

    return (
        <div className={`bg-white p-5 rounded-lg shadow-sm border border-gray-100 border-l-4 ${borderClass}`}>
            <div className="flex justify-between items-start mb-2">
                <div className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">{title}</div>
                {Icon}
            </div>
            <div className={`text-2xl font-bold ${colorClass}`}>
                ${value?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
        </div>
    )
}

function XeroTable({ rows }: { rows: any[] }) {
    if (!rows || rows.length === 0) return <div className="text-center p-10 text-gray-400 border border-dashed rounded">No Data Available</div>;

    return (
        <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full text-sm border-collapse">
            <tbody>
                {rows.map((section, idx) => {
                    if (section.RowType === "Header") return null;
                    // FIX: Use Fragment instead of <> to allow 'key' prop
                    if (section.RowType === "Section") {
                        return (
                            <Fragment key={idx}> 
                                <tr className="bg-gray-50 border-b border-gray-200">
                                    <td colSpan={2} className="p-3 pl-4 font-bold text-gray-700 text-xs uppercase tracking-wide">{section.Title}</td>
                                </tr>
                                {section.Rows && section.Rows.map((row: any, rIdx: number) => (
                                    <tr key={`${idx}-${rIdx}`} className="border-b border-gray-100 hover:bg-gray-50 bg-white">
                                        <td className="p-3 pl-6 text-gray-600">{row.Cells[0].Value}</td>
                                        <td className="p-3 pr-6 text-right font-mono text-gray-800">
                                            {row.Cells.length > 1 ? row.Cells[1].Value : ""}
                                        </td>
                                    </tr>
                                ))}
                            </Fragment>
                        );
                    }
                    if (section.RowType === "Row") {
                         return (
                            <tr key={idx} className="bg-gray-50 border-t border-gray-200 font-bold">
                                <td className="p-3 pl-4 text-gray-800">{section.Cells[0].Value}</td>
                                <td className="p-3 pr-6 text-right text-gray-900">{section.Cells[1].Value}</td>
                            </tr>
                         )
                    }
                    return null;
                })}
            </tbody>
        </table>
        </div>
    );
}