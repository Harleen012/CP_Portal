// // "use client"

// // import { useEffect, useMemo, useState } from "react"
// // import { useRouter } from "next/navigation"
// // import { DashboardLayout } from "@/components/layouts/dashboard-layout"
// // import {
// //   Upload,
// //   MessageCircle,
// //   DollarSign,
// //   TrendingUp,
// //   Clock,
// //   CheckCircle2,
// //   AlertCircle,
// //   RefreshCw,
// //   ArrowRight,
// // } from "lucide-react"
// // import { getMsalAccessTokenFromSessionStorage } from "@/lib/msalToken"
// // import { getActivities, formatTime } from "@/lib/activityStore"


// // /* -------------------------------- types -------------------------------- */

// // type WorkStatus = "active" | "pending" | "completed"

// // type WorkItem = {
// //   id: string
// //   title: string
// //   description?: string
// //   status: WorkStatus
// //   dueDate?: string | null
// //   percentComplete?: number | null
// //   assignedTo?: string | null
// // }

// // /* ------------------------------ components ------------------------------ */

// // function StatusBadge({ status }: { status: WorkStatus }) {
// //   const cfg =
// //     status === "active"
// //       ? { cls: "bg-indigo-50/80 text-indigo-700 border-indigo-100", label: "Active" }
// //       : status === "pending"
// //       ? { cls: "bg-amber-50/80 text-amber-700 border-amber-100", label: "Pending" }
// //       : { cls: "bg-emerald-50/80 text-emerald-700 border-emerald-100", label: "Completed" }

// //   return (
// //     <span
// //       className={`px-2 py-0.5 rounded-full text-[11px] font-extrabold border ${cfg.cls}`}
// //     >
// //       {cfg.label}
// //     </span>
// //   )
// // }

// // function WorkRow({ item }: { item: WorkItem }) {
// //   const pct =
// //     typeof item.percentComplete === "number"
// //       ? Math.max(0, Math.min(100, Math.round(item.percentComplete)))
// //       : null

// //   return (
// //     <div className="rounded-2xl border border-slate-200/60 bg-white/70 backdrop-blur-md shadow-sm hover:shadow-md transition-all p-4 sm:p-5">
// //       <div className="flex items-start justify-between gap-3">
// //         <div className="min-w-0">
// //           <div className="flex items-center gap-2">
// //             <div className="text-[15px] sm:text-base font-extrabold text-slate-900 truncate">
// //               {item.title}
// //             </div>
// //             <StatusBadge status={item.status} />
// //           </div>

// //           {item.description ? (
// //             <div className="text-sm text-slate-600 mt-1 line-clamp-2">
// //               {item.description}
// //             </div>
// //           ) : null}

// //           <div className="mt-2 text-xs font-semibold text-slate-500 flex flex-wrap gap-2">
// //             {item.assignedTo ? (
// //               <span className="px-2 py-1 rounded-full bg-slate-50 border border-slate-200/70">
// //                 Assigned:{" "}
// //                 <span className="text-slate-800 font-extrabold">{item.assignedTo}</span>
// //               </span>
// //             ) : null}
// //             {item.dueDate ? (
// //               <span className="px-2 py-1 rounded-full bg-slate-50 border border-slate-200/70">
// //                 Due:{" "}
// //                 <span className="text-slate-800 font-extrabold">{String(item.dueDate)}</span>
// //               </span>
// //             ) : null}
// //           </div>
// //         </div>
// //       </div>

// //       {pct !== null ? (
// //         <div className="mt-4">
// //           <div className="flex justify-between text-xs font-bold text-slate-500">
// //             <span>Progress</span>
// //             <span className="text-slate-800">{pct}%</span>
// //           </div>
// //           <div className="mt-2 h-2.5 rounded-full bg-slate-200/80 overflow-hidden">
// //             <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-sky-500" style={{ width: `${pct}%` }} />
// //           </div>
// //         </div>
// //       ) : null}
// //     </div>
// //   )
// // }

// // /* ============================== PAGE ============================== */

// // export default function DashboardPage() {
// //   const router = useRouter()

// //   /* ---------- hydration safety ---------- */
// //   const [mounted, setMounted] = useState(false)

// //   /* ---------- work items ---------- */
// //   const [workItems, setWorkItems] = useState<WorkItem[]>([])
// //   const [loadingWork, setLoadingWork] = useState(true)
// //   const [workError, setWorkError] = useState("")

// //   /* ---------- activities ---------- */
// //   const [activities, setActivities] = useState<any[]>([])
// //   const [activitiesVersion, setActivitiesVersion] = useState(0)

// //   const loadWork = async () => {
// //     setLoadingWork(true)
// //     setWorkError("")

// //     const token = getMsalAccessTokenFromSessionStorage()
// //     if (!token) {
// //       setWorkError("MSAL token not found. Please login again.")
// //       setLoadingWork(false)
// //       return
// //     }

// //     try {
// //       const res = await fetch("/api/work-items", {
// //         headers: { Authorization: `Bearer ${token}` },
// //         cache: "no-store",
// //       })
// //       const json = await res.json()
// //       if (!res.ok) throw new Error(json?.details || "Failed to load work items")
// //       setWorkItems(json.items || [])
// //     } catch (e: any) {
// //       setWorkError(e?.message || "Failed to load work items")
// //     } finally {
// //       setLoadingWork(false)
// //     }
// //   }

// //   useEffect(() => {
// //     setMounted(true)
// //     loadWork()
// //     setActivities(getActivities(6))
// //     sessionStorage.setItem(
// //     "user",
// //     JSON.stringify({
// //       name: "Poris Frankly",
// //       email: "poris@example.com"
// //     })
// //   )
// //     // eslint-disable-next-line react-hooks/exhaustive-deps
// //   }, [])

// //   useEffect(() => {
// //     if (!mounted) return
// //     setActivities(getActivities(6))
// //   }, [activitiesVersion, mounted])

// //   useEffect(() => {
// //     const onFocus = () => setActivitiesVersion((v) => v + 1)
// //     window.addEventListener("focus", onFocus)
// //     return () => window.removeEventListener("focus", onFocus)
// //   }, [])

// //   const stats = useMemo(() => {
// //     const active = workItems.filter((i) => i.status === "active").length
// //     const completed = workItems.filter((i) => i.status === "completed").length
// //     const pending = workItems.filter((i) => i.status === "pending").length
// //     return { active, completed, pending }
// //   }, [workItems])

// //   const previewWork = useMemo(() => workItems.slice(0, 3), [workItems])

// //   return (
// //     <DashboardLayout>
// //       {/* Dim, soft background */}
// //       <div className="min-h-[calc(100vh-64px)] bg-gradient-to-br from-slate-50 via-indigo-50/25 to-sky-50/20">
// //         <div className="mx-auto max-w-7xl px-3 sm:px-6 py-5 sm:py-7 space-y-8 animate-fade-in">

// //           {/* ---------- HEADER ---------- */}
// //           <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
// //             <div>
// //               <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
// //                 Good Morning
// //               </h1>
              
// //             </div>

// //             <div className="flex flex-col sm:flex-row sm:items-center gap-3">
// //               <div className="px-4 py-2 bg-white/70 border border-slate-200/60 rounded-full flex items-center gap-2 shadow-sm">
// //                 <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
// //                 <span className="text-sm font-extrabold text-slate-700">All Systems Operational</span>
// //               </div>

// //               <button
// //                 onClick={loadWork}
// //                 className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/70 border border-slate-200/60 shadow-sm hover:shadow-md hover:bg-white transition text-sm font-extrabold text-slate-800"
// //                 type="button"
// //               >
// //                 <RefreshCw className={`w-4 h-4 ${loadingWork ? "animate-spin" : ""}`} />
// //                 Refresh
// //               </button>
// //             </div>
// //           </div>

// //           {/* ---------- STATS ---------- */}
// //           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
// //             <StatCard
// //               icon={<Clock className="w-5 h-5" />}
// //               label="Active"
// //               value={`${stats.active}`}
// //               hint="Tasks in progress"
// //               accent="indigo"
// //             />
// //             <StatCard
// //               icon={<CheckCircle2 className="w-5 h-5" />}
// //               label="Completed"
// //               value={`${stats.completed}`}
// //               hint="Finished tasks"
// //               accent="emerald"
// //             />
// //             <StatCard
// //               icon={<AlertCircle className="w-5 h-5" />}
// //               label="Pending"
// //               value={`${stats.pending}`}
// //               hint="Needs attention"
// //               accent="amber"
// //             />
// //           </div>

// //           {/* ---------- QUICK ACTIONS ---------- */}
// //           <div>
// //             <SectionHeader
// //               title="Quick Actions"
// //               actionLabel=""
// //               onAction={() => router.push("/documents")}

// //             />
// //             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
// //               <QuickAction
// //                 icon={<Upload className="w-6 h-6 text-indigo-700" />}
// //                 title="Upload Documents"
// //                 subtitle="Upload files to SharePoint"
// //                 accent="indigo"
// //                 onClick={() => router.push("/documents")}
// //               />
// //               <QuickAction
// //                 icon={<DollarSign className="w-6 h-6 text-sky-700" />}
// //                 title="Check Loan Eligibility"
// //                 subtitle="Run automated checks on income, documents, and debt ratio"
// //                 accent="sky"
// //                 onClick={() => router.push("/loans")}
// //               />
// //               <QuickAction
// //                 icon={<MessageCircle className="w-6 h-6 text-amber-700" />}
// //                 title="Message CPA"
// //                 subtitle="Get support from experts"
// //                 accent="amber"
// //                 onClick={() => alert("Connect chat module")}
// //               />
// //             </div>
// //           </div>

// //           {/* ---------- WORK PREVIEW ---------- */}
// //           <div>
// //             <SectionHeader title="Work In Progress" actionLabel="View All" onAction={() => router.push("/work")} />
// //             <div className="rounded-3xl border border-slate-200/60 bg-white/60 backdrop-blur-md shadow-sm overflow-hidden">
// //               {loadingWork ? (
// //                 <Placeholder text="Loading tasks from SharePoint…" />
// //               ) : workError ? (
// //                 <ErrorBox message={workError} />
// //               ) : previewWork.length ? (
// //                 <div className="p-4 sm:p-5 space-y-3">
// //                   {previewWork.map((item) => (
// //                     <WorkRow key={item.id} item={item} />
// //                   ))}
// //                 </div>
// //               ) : (
// //                 <EmptyBox
// //                   title="No work items found"
// //                   subtitle="Your SharePoint list has no tasks yet."
// //                 />
// //               )}
// //             </div>
// //           </div>

// //           {/* ---------- ACTIVITY ---------- */}
// //           <div>
// //             <SectionHeader
// //               title="Recent Activity"
// //               actionLabel="Refresh"
// //               onAction={() => setActivitiesVersion((v) => v + 1)}
// //             />

// //             <div className="rounded-3xl border border-slate-200/60 bg-white/60 backdrop-blur-md shadow-sm overflow-hidden">
// //               {!mounted ? (
// //                 <Placeholder text="Loading activity…" />
// //               ) : activities.length ? (
// //                 <div className="divide-y divide-slate-200/60">
// //                   {activities.map((a) => (
// //                     <div key={a.id} className="p-4 sm:p-5 hover:bg-white/50 transition">
// //                       <div className="flex items-start justify-between gap-3">
// //                         <div className="min-w-0">
// //                           <div className="text-sm sm:text-[15px] font-extrabold text-slate-900 truncate">
// //                             {a.title}
// //                           </div>
// //                           <div className="text-sm text-slate-600 mt-0.5">
// //                             {a.description}
// //                           </div>
// //                           <div className="text-xs text-slate-500 font-semibold mt-1">
// //                             {formatTime(a.createdAt)}
// //                           </div>
// //                         </div>

// //                         <span className="shrink-0 px-2 py-1 rounded-full text-[11px] font-extrabold bg-slate-50 border border-slate-200/70 text-slate-700">
// //                           {a.type}
// //                         </span>
// //                       </div>
// //                     </div>
// //                   ))}
// //                 </div>
// //               ) : (
// //                 <EmptyBox
// //                   title="No activity yet"
// //                   subtitle="Upload a document or edit profile to see activity here."
// //                 />
// //               )}
// //             </div>
// //           </div>

// //           {/* Small footer */}
// //           <div className="text-xs text-slate-500 font-semibold text-center">
// //             Tip: Activity updates automatically when you return to this tab.
// //           </div>
// //         </div>
// //       </div>
// //     </DashboardLayout>
// //   )
// // }

// // /* ------------------------------ UI helpers ------------------------------ */

// // function SectionHeader({
// //   title,
// //   actionLabel,
// //   onAction,
// // }: {
// //   title: string
// //   actionLabel: string
// //   onAction: () => void
// // }) {
// //   return (
// //     <div className="flex items-center justify-between mb-4">
// //       <div className="flex items-center gap-2">
// //         <h2 className="text-xl sm:text-[22px] font-extrabold text-slate-900">{title}</h2>
// //         <div className="h-1 w-10 sm:w-12 rounded-full bg-gradient-to-r from-indigo-500 to-sky-500" />
// //       </div>
// //       {/* <button
// //         onClick={onAction}
// //         className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white/70 border border-slate-200/60 hover:bg-white hover:shadow-sm transition text-sm font-extrabold text-slate-800"
// //         type="button"
// //       >
// //         {actionLabel}
// //         <ArrowRight className="w-4 h-4" />
// //       </button> */}
// //     </div>
// //   )
// // }

// // function StatCard({
// //   icon,
// //   label,
// //   value,
// //   hint,
// //   accent,
// // }: {
// //   icon: React.ReactNode
// //   label: string
// //   value: string
// //   hint: string
// //   accent: "indigo" | "emerald" | "amber"
// // }) {
// //   const cfg =
// //     accent === "indigo"
// //       ? {
// //           iconWrap: "bg-indigo-50 border-indigo-100 text-indigo-600",
// //           ring: "shadow-indigo-500/10",
// //           badge: "text-indigo-700",
// //         }
// //       : accent === "emerald"
// //       ? {
// //           iconWrap: "bg-emerald-50 border-emerald-100 text-emerald-600",
// //           ring: "shadow-emerald-500/10",
// //           badge: "text-emerald-700",
// //         }
// //       : {
// //           iconWrap: "bg-amber-50 border-amber-100 text-amber-600",
// //           ring: "shadow-amber-500/10",
// //           badge: "text-amber-700",
// //         }

// //   return (
// //     <div className={`rounded-3xl border border-slate-200/60 bg-white/60 backdrop-blur-md p-5 shadow-sm ${cfg.ring} hover:shadow-md transition`}>
// //       <div className="flex items-center justify-between">
// //         <div className={`p-2.5 rounded-2xl border ${cfg.iconWrap}`}>{icon}</div>
// //         <div className="flex items-center gap-1 text-slate-500 text-xs font-extrabold">
// //           <TrendingUp className="w-4 h-4" />
// //           <span className={cfg.badge}>Live</span>
// //         </div>
// //       </div>

// //       <div className="mt-4">
// //         <div className="text-3xl font-extrabold text-slate-900 leading-none">{value}</div>
// //         <div className="mt-1 text-sm font-extrabold text-slate-800">{label}</div>
// //         <div className="text-sm text-slate-600">{hint}</div>
// //       </div>
// //     </div>
// //   )
// // }

// // function QuickAction({
// //   icon,
// //   title,
// //   subtitle,
// //   accent,
// //   onClick,
// // }: {
// //   icon: React.ReactNode
// //   title: string
// //   subtitle: string
// //   accent: "indigo" | "sky" | "amber"
// //   onClick: () => void
// // }) {
// //   const bg =
// //     accent === "indigo"
// //       ? "bg-indigo-50/70 border-indigo-100"
// //       : accent === "sky"
// //       ? "bg-sky-50/70 border-sky-100"
// //       : "bg-amber-50/70 border-amber-100"

// //   return (
// //     <button
// //       onClick={onClick}
// //       className="group rounded-3xl border border-slate-200/60 bg-white/60 backdrop-blur-md p-5 shadow-sm hover:shadow-md transition text-left"
// //       type="button"
// //     >
// //       <div className={`w-12 h-12 rounded-2xl border ${bg} grid place-items-center`}>
// //         {icon}
// //       </div>
// //       <div className="mt-4 font-extrabold text-slate-900 group-hover:text-indigo-700 transition-colors">
// //         {title}
// //       </div>
// //       <div className="text-sm text-slate-600">{subtitle}</div>
// //       <div className="mt-3 inline-flex items-center gap-1 text-xs font-extrabold text-slate-500 group-hover:text-slate-800 transition">
// //         Open <ArrowRight className="w-3.5 h-3.5" />
// //       </div>
// //     </button>
// //   )
// // }

// // function Placeholder({ text }: { text: string }) {
// //   return (
// //     <div className="p-8 sm:p-10 text-center">
// //       <div className="mx-auto w-10 h-10 rounded-2xl bg-slate-100 border border-slate-200 grid place-items-center">
// //         <RefreshCw className="w-5 h-5 text-slate-500 animate-spin" />
// //       </div>
// //       <div className="mt-3 font-semibold text-slate-600">{text}</div>
// //     </div>
// //   )
// // }

// // function EmptyBox({ title, subtitle }: { title: string; subtitle: string }) {
// //   return (
// //     <div className="p-8 sm:p-10 text-center">
// //       <div className="text-slate-900 font-extrabold">{title}</div>
// //       <div className="text-slate-600 text-sm mt-1">{subtitle}</div>
// //     </div>
// //   )
// // }

// // function ErrorBox({ message }: { message: string }) {
// //   return (
// //     <div className="p-6 sm:p-8 bg-rose-50/70 border border-rose-200/70 text-rose-800">
// //       <div className="font-extrabold">Unable to load data</div>
// //       <div className="text-sm mt-1">{message}</div>
// //     </div>
// //   )
// // }






// "use client"

// import { useEffect, useMemo, useState } from "react"
// import { useRouter } from "next/navigation"
// import { DashboardLayout } from "@/components/layouts/dashboard-layout"
// import {
//   Upload,
//   MessageCircle,
//   DollarSign,
//   TrendingUp,
//   Clock,
//   CheckCircle2,
//   AlertCircle,
//   RefreshCw,
//   ArrowRight,
// } from "lucide-react"
// import { getMsalAccessTokenFromSessionStorage } from "@/lib/msalToken"
// import { getActivities, formatTime } from "@/lib/activityStore"


// /* -------------------------------- types -------------------------------- */

// type WorkStatus = "active" | "pending" | "completed"

// type WorkItem = {
//   id: string
//   title: string
//   description?: string
//   status: WorkStatus
//   dueDate?: string | null
//   percentComplete?: number | null
//   assignedTo?: string | null
// }

// /* ------------------------------ components ------------------------------ */

// function StatusBadge({ status }: { status: WorkStatus }) {
//   const cfg =
//     status === "active"
//       ? { cls: "bg-indigo-50/80 text-indigo-700 border-indigo-100", label: "Active" }
//       : status === "pending"
//       ? { cls: "bg-amber-50/80 text-amber-700 border-amber-100", label: "Pending" }
//       : { cls: "bg-emerald-50/80 text-emerald-700 border-emerald-100", label: "Completed" }

//   return (
//     <span
//       className={`px-2 py-0.5 rounded-full text-[11px] font-extrabold border ${cfg.cls}`}
//     >
//       {cfg.label}
//     </span>
//   )
// }

// function WorkRow({ item }: { item: WorkItem }) {
//   const pct =
//     typeof item.percentComplete === "number"
//       ? Math.max(0, Math.min(100, Math.round(item.percentComplete)))
//       : null

//   return (
//     <div className="rounded-2xl border border-slate-200/60 bg-white/70 backdrop-blur-md shadow-sm hover:shadow-md transition-all p-4 sm:p-5">
//       <div className="flex items-start justify-between gap-3">
//         <div className="min-w-0">
//           <div className="flex items-center gap-2">
//             <div className="text-[15px] sm:text-base font-extrabold text-slate-900 truncate">
//               {item.title}
//             </div>
//             <StatusBadge status={item.status} />
//           </div>

//           {item.description ? (
//             <div className="text-sm text-slate-600 mt-1 line-clamp-2">
//               {item.description}
//             </div>
//           ) : null}

//           <div className="mt-2 text-xs font-semibold text-slate-500 flex flex-wrap gap-2">
//             {item.assignedTo ? (
//               <span className="px-2 py-1 rounded-full bg-slate-50 border border-slate-200/70">
//                 Assigned:{" "}
//                 <span className="text-slate-800 font-extrabold">{item.assignedTo}</span>
//               </span>
//             ) : null}
//             {item.dueDate ? (
//               <span className="px-2 py-1 rounded-full bg-slate-50 border border-slate-200/70">
//                 Due:{" "}
//                 <span className="text-slate-800 font-extrabold">{String(item.dueDate)}</span>
//               </span>
//             ) : null}
//           </div>
//         </div>
//       </div>

//       {pct !== null ? (
//         <div className="mt-4">
//           <div className="flex justify-between text-xs font-bold text-slate-500">
//             <span>Progress</span>
//             <span className="text-slate-800">{pct}%</span>
//           </div>
//           <div className="mt-2 h-2.5 rounded-full bg-slate-200/80 overflow-hidden">
//             <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-sky-500" style={{ width: `${pct}%` }} />
//           </div>
//         </div>
//       ) : null}
//     </div>
//   )
// }

// /* ============================== PAGE ============================== */

// export default function DashboardPage() {
//   const router = useRouter()

//   /* ---------- hydration safety ---------- */
//   const [mounted, setMounted] = useState(false)

//   /* ---------- work items ---------- */
//   const [workItems, setWorkItems] = useState<WorkItem[]>([])
//   const [loadingWork, setLoadingWork] = useState(true)
//   const [workError, setWorkError] = useState("")

//   /* ---------- activities ---------- */
//   const [activities, setActivities] = useState<any[]>([])
//   const [activitiesVersion, setActivitiesVersion] = useState(0)

//   const loadWork = async () => {
//     setLoadingWork(true)
//     setWorkError("")

//     const token = getMsalAccessTokenFromSessionStorage()
//     if (!token) {
//       setWorkError("MSAL token not found. Please login again.")
//       setLoadingWork(false)
//       return
//     }

//     try {
//       const res = await fetch("/api/work-items", {
//         headers: { Authorization: `Bearer ${token}` },
//         cache: "no-store",
//       })
//       const json = await res.json()
//       if (!res.ok) throw new Error(json?.details || "Failed to load work items")
//       setWorkItems(json.items || [])
//     } catch (e: any) {
//       setWorkError(e?.message || "Failed to load work items")
//     } finally {
//       setLoadingWork(false)
//     }
//   }

//   useEffect(() => {
//     setMounted(true)
//     loadWork()
//     setActivities(getActivities(6))
//     sessionStorage.setItem(
//     "user",
//     JSON.stringify({
//       name: "Poris Frankly",
//       email: "poris@example.com"
//     })
//   )
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [])

//   useEffect(() => {
//     if (!mounted) return
//     setActivities(getActivities(6))
//   }, [activitiesVersion, mounted])

//   useEffect(() => {
//     const onFocus = () => setActivitiesVersion((v) => v + 1)
//     window.addEventListener("focus", onFocus)
//     return () => window.removeEventListener("focus", onFocus)
//   }, [])

//   const stats = useMemo(() => {
//     const active = workItems.filter((i) => i.status === "active").length
//     const completed = workItems.filter((i) => i.status === "completed").length
//     const pending = workItems.filter((i) => i.status === "pending").length
//     return { active, completed, pending }
//   }, [workItems])

//   const previewWork = useMemo(() => workItems.slice(0, 3), [workItems])

//   return (
//     <DashboardLayout>
//       {/* Dim, soft background */}
//       <div className="min-h-[calc(100vh-64px)] bg-gradient-to-br from-slate-50 via-indigo-50/25 to-sky-50/20">
//         <div className="mx-auto max-w-7xl px-3 sm:px-6 py-5 sm:py-7 space-y-8 animate-fade-in">

//           {/* ---------- HEADER ---------- */}
//           <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
//             <div>
//               <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
//                 Good Morning
//               </h1>
              
//             </div>

//             <div className="flex flex-col sm:flex-row sm:items-center gap-3">
//               <div className="px-4 py-2 bg-white/70 border border-slate-200/60 rounded-full flex items-center gap-2 shadow-sm">
//                 <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
//                 <span className="text-sm font-extrabold text-slate-700">All Systems Operational</span>
//               </div>

//               <button
//                 onClick={loadWork}
//                 className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/70 border border-slate-200/60 shadow-sm hover:shadow-md hover:bg-white transition text-sm font-extrabold text-slate-800"
//                 type="button"
//               >
//                 <RefreshCw className={`w-4 h-4 ${loadingWork ? "animate-spin" : ""}`} />
//                 Refresh
//               </button>
//             </div>
//           </div>

//           {/* ---------- STATS ---------- */}
//           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//             <StatCard
//               icon={<Clock className="w-5 h-5" />}
//               label="Active"
//               value={`${stats.active}`}
//               hint="Tasks in progress"
//               accent="indigo"
//             />
//             <StatCard
//               icon={<CheckCircle2 className="w-5 h-5" />}
//               label="Completed"
//               value={`${stats.completed}`}
//               hint="Finished tasks"
//               accent="emerald"
//             />
//             <StatCard
//               icon={<AlertCircle className="w-5 h-5" />}
//               label="Pending"
//               value={`${stats.pending}`}
//               hint="Needs attention"
//               accent="amber"
//             />
//           </div>

//           {/* ---------- QUICK ACTIONS ---------- */}
//           <div>
//             <SectionHeader
//               title="Quick Actions"
//               actionLabel=""
//               onAction={() => router.push("/documents")}

//             />
//             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//               <QuickAction
//                 icon={<Upload className="w-6 h-6 text-indigo-700" />}
//                 title="Upload Documents"
//                 subtitle="Upload files to SharePoint"
//                 accent="indigo"
//                 onClick={() => router.push("/documents")}
//               />
//               <QuickAction
//                 icon={<DollarSign className="w-6 h-6 text-sky-700" />}
//                 title="Check Loan Eligibility"
//                 subtitle="Run automated checks on income, documents, and debt ratio"
//                 accent="sky"
//                 onClick={() => router.push("/LoanApproval")}
//               />
//               <QuickAction
//                 icon={<MessageCircle className="w-6 h-6 text-amber-700" />}
//                 title="Message CPA"
//                 subtitle="Get support from experts"
//                 accent="amber"
//                 onClick={() => alert("Connect chat module")}
//               />
//             </div>
//           </div>

//           {/* ---------- WORK PREVIEW ---------- */}
//           <div>
//             <SectionHeader title="Work In Progress" actionLabel="View All" onAction={() => router.push("/work")} />
//             <div className="rounded-3xl border border-slate-200/60 bg-white/60 backdrop-blur-md shadow-sm overflow-hidden">
//               {loadingWork ? (
//                 <Placeholder text="Loading tasks from SharePoint…" />
//               ) : workError ? (
//                 <ErrorBox message={workError} />
//               ) : previewWork.length ? (
//                 <div className="p-4 sm:p-5 space-y-3">
//                   {previewWork.map((item) => (
//                     <WorkRow key={item.id} item={item} />
//                   ))}
//                 </div>
//               ) : (
//                 <EmptyBox
//                   title="No work items found"
//                   subtitle="Your SharePoint list has no tasks yet."
//                 />
//               )}
//             </div>
//           </div>

//           {/* ---------- ACTIVITY ---------- */}
//           <div>
//             <SectionHeader
//               title="Recent Activity"
//               actionLabel="Refresh"
//               onAction={() => setActivitiesVersion((v) => v + 1)}
//             />

//             <div className="rounded-3xl border border-slate-200/60 bg-white/60 backdrop-blur-md shadow-sm overflow-hidden">
//               {!mounted ? (
//                 <Placeholder text="Loading activity…" />
//               ) : activities.length ? (
//                 <div className="divide-y divide-slate-200/60">
//                   {activities.map((a) => (
//                     <div key={a.id} className="p-4 sm:p-5 hover:bg-white/50 transition">
//                       <div className="flex items-start justify-between gap-3">
//                         <div className="min-w-0">
//                           <div className="text-sm sm:text-[15px] font-extrabold text-slate-900 truncate">
//                             {a.title}
//                           </div>
//                           <div className="text-sm text-slate-600 mt-0.5">
//                             {a.description}
//                           </div>
//                           <div className="text-xs text-slate-500 font-semibold mt-1">
//                             {formatTime(a.createdAt)}
//                           </div>
//                         </div>

//                         <span className="shrink-0 px-2 py-1 rounded-full text-[11px] font-extrabold bg-slate-50 border border-slate-200/70 text-slate-700">
//                           {a.type}
//                         </span>
//                       </div>
//                     </div>
//                   ))}
//                 </div>
//               ) : (
//                 <EmptyBox
//                   title="No activity yet"
//                   subtitle="Upload a document or edit profile to see activity here."
//                 />
//               )}
//             </div>
//           </div>

//           {/* Small footer */}
//           <div className="text-xs text-slate-500 font-semibold text-center">
//             Tip: Activity updates automatically when you return to this tab.
//           </div>
//         </div>
//       </div>
//     </DashboardLayout>
//   )
// }

// /* ------------------------------ UI helpers ------------------------------ */

// function SectionHeader({
//   title,
//   actionLabel,
//   onAction,
// }: {
//   title: string
//   actionLabel: string
//   onAction: () => void
// }) {
//   return (
//     <div className="flex items-center justify-between mb-4">
//       <div className="flex items-center gap-2">
//         <h2 className="text-xl sm:text-[22px] font-extrabold text-slate-900">{title}</h2>
//         <div className="h-1 w-10 sm:w-12 rounded-full bg-gradient-to-r from-indigo-500 to-sky-500" />
//       </div>
//       {/* <button
//         onClick={onAction}
//         className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white/70 border border-slate-200/60 hover:bg-white hover:shadow-sm transition text-sm font-extrabold text-slate-800"
//         type="button"
//       >
//         {actionLabel}
//         <ArrowRight className="w-4 h-4" />
//       </button> */}
//     </div>
//   )
// }

// function StatCard({
//   icon,
//   label,
//   value,
//   hint,
//   accent,
// }: {
//   icon: React.ReactNode
//   label: string
//   value: string
//   hint: string
//   accent: "indigo" | "emerald" | "amber"
// }) {
//   const cfg =
//     accent === "indigo"
//       ? {
//           iconWrap: "bg-indigo-50 border-indigo-100 text-indigo-600",
//           ring: "shadow-indigo-500/10",
//           badge: "text-indigo-700",
//         }
//       : accent === "emerald"
//       ? {
//           iconWrap: "bg-emerald-50 border-emerald-100 text-emerald-600",
//           ring: "shadow-emerald-500/10",
//           badge: "text-emerald-700",
//         }
//       : {
//           iconWrap: "bg-amber-50 border-amber-100 text-amber-600",
//           ring: "shadow-amber-500/10",
//           badge: "text-amber-700",
//         }

//   return (
//     <div className={`rounded-3xl border border-slate-200/60 bg-white/60 backdrop-blur-md p-5 shadow-sm ${cfg.ring} hover:shadow-md transition`}>
//       <div className="flex items-center justify-between">
//         <div className={`p-2.5 rounded-2xl border ${cfg.iconWrap}`}>{icon}</div>
//         <div className="flex items-center gap-1 text-slate-500 text-xs font-extrabold">
//           <TrendingUp className="w-4 h-4" />
//           <span className={cfg.badge}>Live</span>
//         </div>
//       </div>

//       <div className="mt-4">
//         <div className="text-3xl font-extrabold text-slate-900 leading-none">{value}</div>
//         <div className="mt-1 text-sm font-extrabold text-slate-800">{label}</div>
//         <div className="text-sm text-slate-600">{hint}</div>
//       </div>
//     </div>
//   )
// }

// function QuickAction({
//   icon,
//   title,
//   subtitle,
//   accent,
//   onClick,
// }: {
//   icon: React.ReactNode
//   title: string
//   subtitle: string
//   accent: "indigo" | "sky" | "amber"
//   onClick: () => void
// }) {
//   const bg =
//     accent === "indigo"
//       ? "bg-indigo-50/70 border-indigo-100"
//       : accent === "sky"
//       ? "bg-sky-50/70 border-sky-100"
//       : "bg-amber-50/70 border-amber-100"

//   return (
//     <button
//       onClick={onClick}
//       className="group rounded-3xl border border-slate-200/60 bg-white/60 backdrop-blur-md p-5 shadow-sm hover:shadow-md transition text-left"
//       type="button"
//     >
//       <div className={`w-12 h-12 rounded-2xl border ${bg} grid place-items-center`}>
//         {icon}
//       </div>
//       <div className="mt-4 font-extrabold text-slate-900 group-hover:text-indigo-700 transition-colors">
//         {title}
//       </div>
//       <div className="text-sm text-slate-600">{subtitle}</div>
//       <div className="mt-3 inline-flex items-center gap-1 text-xs font-extrabold text-slate-500 group-hover:text-slate-800 transition">
//         Open <ArrowRight className="w-3.5 h-3.5" />
//       </div>
//     </button>
//   )
// }

// function Placeholder({ text }: { text: string }) {
//   return (
//     <div className="p-8 sm:p-10 text-center">
//       <div className="mx-auto w-10 h-10 rounded-2xl bg-slate-100 border border-slate-200 grid place-items-center">
//         <RefreshCw className="w-5 h-5 text-slate-500 animate-spin" />
//       </div>
//       <div className="mt-3 font-semibold text-slate-600">{text}</div>
//     </div>
//   )
// }

// function EmptyBox({ title, subtitle }: { title: string; subtitle: string }) {
//   return (
//     <div className="p-8 sm:p-10 text-center">
//       <div className="text-slate-900 font-extrabold">{title}</div>
//       <div className="text-slate-600 text-sm mt-1">{subtitle}</div>
//     </div>
//   )
// }

// function ErrorBox({ message }: { message: string }) {
//   return (
//     <div className="p-6 sm:p-8 bg-rose-50/70 border border-rose-200/70 text-rose-800">
//       <div className="font-extrabold">Unable to load data</div>
//       <div className="text-sm mt-1">{message}</div>
//     </div>
//   )
// }




"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/layouts/dashboard-layout"
import {
  Upload,
  MessageCircle,
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ArrowRight,
} from "lucide-react"
import { getMsalAccessTokenFromSessionStorage } from "@/lib/msalToken"
import { getActivities, formatTime } from "@/lib/activityStore"


/* -------------------------------- types -------------------------------- */

type WorkStatus = "active" | "pending" | "completed"

type WorkItem = {
  id: string
  title: string
  description?: string
  status: WorkStatus
  dueDate?: string | null
  percentComplete?: number | null
  assignedTo?: string | null
  actionReq?: string | null
  xeroId?: string | null
  source?: string | null
  emailAddress?: string | null
}

/* ------------------------------ components ------------------------------ */

function StatusBadge({ status }: { status: WorkStatus }) {
  const cfg =
    status === "active"
      ? { cls: "bg-indigo-50/80 text-indigo-700 border-indigo-100", label: "Active" }
      : status === "pending"
      ? { cls: "bg-amber-50/80 text-amber-700 border-amber-100", label: "Pending" }
      : { cls: "bg-emerald-50/80 text-emerald-700 border-emerald-100", label: "Completed" }

  return (
    <span
      className={`px-2 py-0.5 rounded-full text-[11px] font-extrabold border ${cfg.cls}`}
    >
      {cfg.label}
    </span>
  )
}

function WorkRow({ item }: { item: WorkItem }) {
  const pct =
    typeof item.percentComplete === "number"
      ? Math.max(0, Math.min(100, Math.round(item.percentComplete)))
      : null

  return (
    <div className="rounded-2xl border border-slate-200/60 bg-white/70 backdrop-blur-md shadow-sm hover:shadow-md transition-all p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <div className="text-[15px] sm:text-base font-extrabold text-slate-900 truncate">
              {item.title}
            </div>
            <StatusBadge status={item.status} />
          </div>

          {item.description ? (
            <div className="text-sm text-slate-600 mt-1 line-clamp-2">
              {item.description}
            </div>
          ) : null}

          <div className="mt-2 space-y-1 text-xs font-semibold text-slate-500">
            {item.dueDate ? (
              <div>
                Due: <span className="text-slate-800 font-extrabold">{String(item.dueDate)}</span>
              </div>
            ) : null}
            <div className="flex justify-between gap-4">
              {item.actionReq ? (
                <span>
                  Action Req: <span className="text-slate-800 font-extrabold">{item.actionReq}</span>
                </span>
              ) : null}
              {item.xeroId ? (
                <span>
                  Xero ID: <span className="text-slate-800 font-extrabold">{item.xeroId}</span>
                </span>
              ) : null}
            </div>
            {item.source ? (
              <div>
                Source: <span className="text-slate-800 font-extrabold">{item.source}</span>
              </div>
            ) : null}
            {item.emailAddress ? (
              <div>
                Email: <span className="text-slate-800 font-extrabold">{item.emailAddress}</span>
              </div>
            ) : null}
            {item.assignedTo ? (
              <div>
                Assigned: <span className="text-slate-800 font-extrabold">{item.assignedTo}</span>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {pct !== null ? (
        <div className="mt-4">
          <div className="flex justify-between text-xs font-bold text-slate-500">
            <span>Progress</span>
            <span className="text-slate-800">{pct}%</span>
          </div>
          <div className="mt-2 h-2.5 rounded-full bg-slate-200/80 overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-sky-500" style={{ width: `${pct}%` }} />
          </div>
        </div>
      ) : null}
    </div>
  )
}

/* ============================== PAGE ============================== */

export default function DashboardPage() {
  const router = useRouter()

  /* ---------- hydration safety ---------- */
  const [mounted, setMounted] = useState(false)

  /* ---------- work items ---------- */
  const [workItems, setWorkItems] = useState<WorkItem[]>([])
  const [loadingWork, setLoadingWork] = useState(true)
  const [workError, setWorkError] = useState("")

  /* ---------- activities ---------- */
  const [activities, setActivities] = useState<any[]>([])
  const [activitiesVersion, setActivitiesVersion] = useState(0)

  const loadWork = async () => {
    setLoadingWork(true)
    setWorkError("")

    const token = getMsalAccessTokenFromSessionStorage()
    if (!token) {
      setWorkError("MSAL token not found. Please login again.")
      setLoadingWork(false)
      return
    }

    try {
      const res = await fetch("/api/work-items", {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.details || "Failed to load work items")
      setWorkItems(json.items || [])
    } catch (e: any) {
      setWorkError(e?.message || "Failed to load work items")
    } finally {
      setLoadingWork(false)
    }
  }

  useEffect(() => {
    setMounted(true)
    loadWork()
    setActivities(getActivities(6))
    sessionStorage.setItem(
    "user",
    JSON.stringify({
      name: "Poris Frankly",
      email: "poris@example.com"
    })
  )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!mounted) return
    setActivities(getActivities(6))
  }, [activitiesVersion, mounted])

  useEffect(() => {
    const onFocus = () => setActivitiesVersion((v) => v + 1)
    window.addEventListener("focus", onFocus)
    return () => window.removeEventListener("focus", onFocus)
  }, [])

  const stats = useMemo(() => {
    const active = workItems.filter((i) => i.status === "active").length
    const completed = workItems.filter((i) => i.status === "completed").length
    const pending = workItems.filter((i) => i.status === "pending").length
    return { active, completed, pending }
  }, [workItems])

  const previewWork = useMemo(() => workItems.slice(0, 3), [workItems])

  return (
    <DashboardLayout>
      {/* Dim, soft background */}
      <div className="min-h-[calc(100vh-64px)] bg-gradient-to-br from-slate-50 via-indigo-50/25 to-sky-50/20">
        <div className="mx-auto max-w-7xl px-3 sm:px-6 py-5 sm:py-7 space-y-8 animate-fade-in">

          {/* ---------- HEADER ---------- */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
                Good Morning
              </h1>
              
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="px-4 py-2 bg-white/70 border border-slate-200/60 rounded-full flex items-center gap-2 shadow-sm">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-extrabold text-slate-700">All Systems Operational</span>
              </div>

              <button
                onClick={loadWork}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/70 border border-slate-200/60 shadow-sm hover:shadow-md hover:bg-white transition text-sm font-extrabold text-slate-800"
                type="button"
              >
                <RefreshCw className={`w-4 h-4 ${loadingWork ? "animate-spin" : ""}`} />
                Refresh
              </button>
            </div>
          </div>

          {/* ---------- STATS ---------- */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard
              icon={<Clock className="w-5 h-5" />}
              label="Active"
              value={`${stats.active}`}
              hint="Tasks in progress"
              accent="indigo"
            />
            <StatCard
              icon={<CheckCircle2 className="w-5 h-5" />}
              label="Completed"
              value={`${stats.completed}`}
              hint="Finished tasks"
              accent="emerald"
            />
            <StatCard
              icon={<AlertCircle className="w-5 h-5" />}
              label="Pending"
              value={`${stats.pending}`}
              hint="Needs attention"
              accent="amber"
            />
          </div>

          {/* ---------- QUICK ACTIONS ---------- */}
          <div>
            <SectionHeader
              title="Quick Actions"
              actionLabel=""
              onAction={() => router.push("/documents")}

            />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <QuickAction
                icon={<Upload className="w-6 h-6 text-indigo-700" />}
                title="Upload Documents"
                subtitle="Upload files to SharePoint"
                accent="indigo"
                onClick={() => router.push("/documents")}
              />
              <QuickAction
                icon={<DollarSign className="w-6 h-6 text-sky-700" />}
                title="Check Loan Eligibility"
                subtitle="Run automated checks on income, documents, and debt ratio"
                accent="sky"
                onClick={() => router.push("/LoanApproval")}
              />
              <QuickAction
                icon={<MessageCircle className="w-6 h-6 text-amber-700" />}
                title="Message CPA"
                subtitle="Get support from experts"
                accent="amber"
                onClick={() => alert("Connect chat module")}
              />
            </div>
          </div>

          {/* ---------- WORK PREVIEW ---------- */}
          <div>
            <SectionHeader title="Work In Progress" actionLabel="View All" onAction={() => router.push("/work")} />
            <div className="rounded-3xl border border-slate-200/60 bg-white/60 backdrop-blur-md shadow-sm overflow-hidden">
              {loadingWork ? (
                <Placeholder text="Loading tasks from SharePoint…" />
              ) : workError ? (
                <ErrorBox message={workError} />
              ) : previewWork.length ? (
                <div className="p-4 sm:p-5 space-y-3">
                  {previewWork.map((item) => (
                    <WorkRow key={item.id} item={item} />
                  ))}
                </div>
              ) : (
                <EmptyBox
                  title="No work items found"
                  subtitle="Your SharePoint list has no tasks yet."
                />
              )}
            </div>
          </div>

          {/* ---------- ACTIVITY ---------- */}
          <div>
            <SectionHeader
              title="Recent Activity"
              actionLabel="Refresh"
              onAction={() => setActivitiesVersion((v) => v + 1)}
            />

            <div className="rounded-3xl border border-slate-200/60 bg-white/60 backdrop-blur-md shadow-sm overflow-hidden">
              {!mounted ? (
                <Placeholder text="Loading activity…" />
              ) : activities.length ? (
                <div className="divide-y divide-slate-200/60">
                  {activities.map((a) => (
                    <div key={a.id} className="p-4 sm:p-5 hover:bg-white/50 transition">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-sm sm:text-[15px] font-extrabold text-slate-900 truncate">
                            {a.title}
                          </div>
                          <div className="text-sm text-slate-600 mt-0.5">
                            {a.description}
                          </div>
                          <div className="text-xs text-slate-500 font-semibold mt-1">
                            {formatTime(a.createdAt)}
                          </div>
                        </div>

                        <span className="shrink-0 px-2 py-1 rounded-full text-[11px] font-extrabold bg-slate-50 border border-slate-200/70 text-slate-700">
                          {a.type}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyBox
                  title="No activity yet"
                  subtitle="Upload a document or edit profile to see activity here."
                />
              )}
            </div>
          </div>

          {/* Small footer */}
          <div className="text-xs text-slate-500 font-semibold text-center">
            Tip: Activity updates automatically when you return to this tab.
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

/* ------------------------------ UI helpers ------------------------------ */

function SectionHeader({
  title,
  actionLabel,
  onAction,
}: {
  title: string
  actionLabel: string
  onAction: () => void
}) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <h2 className="text-xl sm:text-[22px] font-extrabold text-slate-900">{title}</h2>
        <div className="h-1 w-10 sm:w-12 rounded-full bg-gradient-to-r from-indigo-500 to-sky-500" />
      </div>
      <button
        onClick={onAction}
        className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white/70 border border-slate-200/60 hover:bg-white hover:shadow-sm transition text-sm font-extrabold text-slate-800"
        type="button"
      >
        {actionLabel}
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  )
}

function StatCard({
  icon,
  label,
  value,
  hint,
  accent,
}: {
  icon: React.ReactNode
  label: string
  value: string
  hint: string
  accent: "indigo" | "emerald" | "amber"
}) {
  const cfg =
    accent === "indigo"
      ? {
          iconWrap: "bg-indigo-50 border-indigo-100 text-indigo-600",
          ring: "shadow-indigo-500/10",
          badge: "text-indigo-700",
        }
      : accent === "emerald"
      ? {
          iconWrap: "bg-emerald-50 border-emerald-100 text-emerald-600",
          ring: "shadow-emerald-500/10",
          badge: "text-emerald-700",
        }
      : {
          iconWrap: "bg-amber-50 border-amber-100 text-amber-600",
          ring: "shadow-amber-500/10",
          badge: "text-amber-700",
        }

  return (
    <div className={`rounded-3xl border border-slate-200/60 bg-white/60 backdrop-blur-md p-5 shadow-sm ${cfg.ring} hover:shadow-md transition`}>
      <div className="flex items-center justify-between">
        <div className={`p-2.5 rounded-2xl border ${cfg.iconWrap}`}>{icon}</div>
        <div className="flex items-center gap-1 text-slate-500 text-xs font-extrabold">
          <TrendingUp className="w-4 h-4" />
          <span className={cfg.badge}>Live</span>
        </div>
      </div>

      <div className="mt-4">
        <div className="text-3xl font-extrabold text-slate-900 leading-none">{value}</div>
        <div className="mt-1 text-sm font-extrabold text-slate-800">{label}</div>
        <div className="text-sm text-slate-600">{hint}</div>
      </div>
    </div>
  )
}

function QuickAction({
  icon,
  title,
  subtitle,
  accent,
  onClick,
}: {
  icon: React.ReactNode
  title: string
  subtitle: string
  accent: "indigo" | "sky" | "amber"
  onClick: () => void
}) {
  const bg =
    accent === "indigo"
      ? "bg-indigo-50/70 border-indigo-100"
      : accent === "sky"
      ? "bg-sky-50/70 border-sky-100"
      : "bg-amber-50/70 border-amber-100"

  return (
    <button
      onClick={onClick}
      className="group rounded-3xl border border-slate-200/60 bg-white/60 backdrop-blur-md p-5 shadow-sm hover:shadow-md transition text-left"
      type="button"
    >
      <div className={`w-12 h-12 rounded-2xl border ${bg} grid place-items-center`}>
        {icon}
      </div>
      <div className="mt-4 font-extrabold text-slate-900 group-hover:text-indigo-700 transition-colors">
        {title}
      </div>
      <div className="text-sm text-slate-600">{subtitle}</div>
      <div className="mt-3 inline-flex items-center gap-1 text-xs font-extrabold text-slate-500 group-hover:text-slate-800 transition">
        Open <ArrowRight className="w-3.5 h-3.5" />
      </div>
    </button>
  )
}

function Placeholder({ text }: { text: string }) {
  return (
    <div className="p-8 sm:p-10 text-center">
      <div className="mx-auto w-10 h-10 rounded-2xl bg-slate-100 border border-slate-200 grid place-items-center">
        <RefreshCw className="w-5 h-5 text-slate-500 animate-spin" />
      </div>
      <div className="mt-3 font-semibold text-slate-600">{text}</div>
    </div>
  )
}

function EmptyBox({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="p-8 sm:p-10 text-center">
      <div className="text-slate-900 font-extrabold">{title}</div>
      <div className="text-slate-600 text-sm mt-1">{subtitle}</div>
    </div>
  )
}

function ErrorBox({ message }: { message: string }) {
  return (
    <div className="p-6 sm:p-8 bg-rose-50/70 border border-rose-200/70 text-rose-800">
      <div className="font-extrabold">Unable to load data</div>
      <div className="text-sm mt-1">{message}</div>
    </div>
  )
}