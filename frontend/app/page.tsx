// // "use client"

// // import { useEffect } from "react"
// // import { useRouter } from "next/navigation"

// // export default function HomePage() {
// //   const router = useRouter()

// //   useEffect(() => {
// //     router.push("/login")
// //   }, [router])

// //   return null
// // }



// "use client"

// import { useEffect, useMemo, useState } from "react"
// import { DashboardLayout } from "@/components/layouts/dashboard-layout"
// import { ListFilter, Clock, CheckCircle2, AlertCircle, RefreshCw, Info, Plus, X, Edit2, Save } from "lucide-react"

// type WorkStatus = "active" | "pending" | "completed"

// type WorkItem = {
//   id: string
//   title: string
//   description: string | null
//   taskStatus: WorkStatus
//   dueDate: string | null
//   percentComplete: number | null
//   lastUpdated: string | null
//   actionRequired: boolean
//   xeroID: string | null
//   sourceType: string | null
//   assignedStaff: string | null
//   emailAddress: string | null
// }

// type ColumnMetadata = {
//   name: string
//   displayName: string
//   type: string
//   choices?: string[]
// }

// function getMsalAccessTokenFromSessionStorage(): string | null {
//   if (typeof window === "undefined") return null
//   if (!window.sessionStorage) return null

//   const nowSec = Math.floor(Date.now() / 1000)
//   const candidates: Array<{ secret: string; expiresOn?: number }> = []

//   for (let i = 0; i < sessionStorage.length; i++) {
//     const key = sessionStorage.key(i)
//     if (!key) continue
//     if (!key.toLowerCase().startsWith("msal")) continue

//     const value = sessionStorage.getItem(key)
//     if (!value) continue
//     if (value[0] !== "{") continue

//     try {
//       const obj = JSON.parse(value)
//       if (obj?.credentialType !== "AccessToken") continue
//       if (!obj?.secret || typeof obj.secret !== "string") continue

//       const exp = obj.expiresOn ? Number(obj.expiresOn) : undefined
//       candidates.push({ secret: obj.secret, expiresOn: Number.isFinite(exp) ? exp : undefined })
//     } catch {
//       // ignore
//     }
//   }

//   if (!candidates.length) return null

//   const valid = candidates.filter((c) => !c.expiresOn || c.expiresOn > nowSec + 60)
//   if (valid.length) {
//     valid.sort((a, b) => (b.expiresOn || 0) - (a.expiresOn || 0))
//     return valid[0].secret
//   }

//   candidates.sort((a, b) => (b.expiresOn || 0) - (a.expiresOn || 0))
//   return candidates[0].secret
// }

// function StatusPill({ status }: { status: WorkStatus }) {
//   const cls =
//     status === "active"
//       ? "bg-blue-50 text-blue-700 border-blue-200"
//       : status === "pending"
//       ? "bg-orange-50 text-orange-700 border-orange-200"
//       : "bg-green-50 text-green-700 border-green-200"

//   const label = status === "active" ? "Active" : status === "pending" ? "Pending" : "Completed"
//   return <span className={`inline-flex px-2 py-1 text-xs font-bold rounded-lg border ${cls}`}>{label}</span>
// }

// function WorkCard({ item, onClick }: { item: WorkItem; onClick: () => void }) {
//   return (
//     <div
//       onClick={onClick}
//       className="rounded-xl border border-gray-200 bg-white p-5 transition-all duration-200 hover:shadow-lg hover:border-blue-300 cursor-pointer group"
//     >
//       <div className="flex items-start justify-between gap-3">
//         <div className="min-w-0 flex-1">
//           <div className="flex items-center gap-2 mb-3">
//             <h3 className="text-base font-bold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
//               {item.title}
//             </h3>
//             <StatusPill status={item.taskStatus} />
//           </div>

//           <div className="flex flex-wrap gap-2 text-xs font-medium text-gray-600 mb-3">
//             {item.assignedStaff && (
//               <span className="px-2 py-1 rounded-md bg-gray-100 border border-gray-200">
//                 Assigned: <span className="font-bold text-gray-800">{item.assignedStaff}</span>
//               </span>
//             )}
//             {item.dueDate && (
//               <span className="px-2 py-1 rounded-md bg-gray-100 border border-gray-200">
//                 Due: <span className="font-bold text-gray-800">{item.dueDate}</span>
//               </span>
//             )}
//           </div>

//           <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
//             <div>Action Req: {item.actionRequired ? "Yes" : "No"}</div>
//             <div>Xero ID: {item.xeroID || "N/A"}</div>
//             <div>Source: {item.sourceType || "N/A"}</div>
//             <div className="col-span-2">Email: {item.emailAddress || "N/A"}</div>
//           </div>

//           {item.description && (
//             <p className="mt-3 text-sm text-gray-600 leading-relaxed line-clamp-2">{item.description}</p>
//           )}
//         </div>
//       </div>

//       {item.percentComplete !== null && (
//         <div className="mt-4">
//           <div className="flex items-center justify-between text-xs font-bold text-gray-500 mb-2">
//             <span>Progress</span>
//             <span className="text-gray-800">{item.percentComplete}%</span>
//           </div>
//           <div className="h-2 rounded-full bg-gray-200 overflow-hidden">
//             <div
//               className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-500"
//               style={{ width: `${item.percentComplete}%` }}
//             />
//           </div>
//         </div>
//       )}
//     </div>
//   )
// }

// function DetailModal({
//   item,
//   onClose,
//   onSave,
//   columns
// }: {
//   item: WorkItem;
//   onClose: () => void;
//   onSave: (updated: WorkItem) => void;
//   columns: ColumnMetadata[]
// }) {
//   const [isEditing, setIsEditing] = useState(false)
//   const [editedItem, setEditedItem] = useState<WorkItem>(item)
//   const [isSaving, setIsSaving] = useState(false)

//   const taskStatusChoices = columns.find(c => c.name === "TaskStatus")?.choices || ["Active", "Pending", "Completed"]
//   const sourceTypeChoices = columns.find(c => c.name === "SourceType")?.choices || []

//   const handleSave = async () => {
//     setIsSaving(true)
//     const token = getMsalAccessTokenFromSessionStorage()
//     if (!token) {
//       alert("Access token not found. Please login again.")
//       setIsSaving(false)
//       return
//     }

//     const fields: Record<string, any> = {
//       Title: editedItem.title,
//       Description: editedItem.description || null,
//       TaskStatus: editedItem.taskStatus.charAt(0).toUpperCase() + editedItem.taskStatus.slice(1),
//       DueDate: editedItem.dueDate || null,
//       ActionRequired: editedItem.actionRequired,
//       XeroID: editedItem.xeroID || null,
//       SourceType: editedItem.sourceType || null,
//       PercentComplete: editedItem.percentComplete ?? 0,
//       Emailaddress: editedItem.emailAddress || null,
//     }

//     if (editedItem.assignedStaff) {
//       fields.AssignedStaff = { claims: `i:0#.f|membership|${editedItem.assignedStaff}` }
//     }

//     const cleanedFields: Record<string, any> = {}
//     for (const [key, value] of Object.entries(fields)) {
//       if (value !== null && value !== undefined && (typeof value !== 'string' || value.trim() !== '')) {
//         cleanedFields[key] = value
//       }
//     }

//     try {
//       const res = await fetch("/api/work-items", {
//         method: "PATCH",
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `Bearer ${token}`,
//         },
//         body: JSON.stringify({ id: editedItem.id, fields: cleanedFields }),
//       })

//       if (!res.ok) {
//         const json = await res.json()
//         throw new Error(json?.details || json?.error || "Failed to update")
//       }

//       const updatedFromApi = await res.json()
//       const updatedLocal: WorkItem = {
//         ...editedItem,
//         title: updatedFromApi.fields?.Title || editedItem.title,
//         description: updatedFromApi.fields?.Description || editedItem.description,
//         percentComplete: Number(updatedFromApi.fields?.PercentComplete) || editedItem.percentComplete,
//       }
//       onSave(updatedLocal)
//       setIsEditing(false)
//     } catch (e: any) {
//       alert(`Failed to save: ${e.message}`)
//     } finally {
//       setIsSaving(false)
//     }
//   }

//   return (
//     <div
//       className="fixed inset-0 z-50 flex items-center justify-center p-4"
//       onClick={onClose}
//     >
//       <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

//       <div
//         className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
//         onClick={(e) => e.stopPropagation()}
//       >
//         <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex items-center justify-between">
//           <h2 className="text-xl font-bold text-white">Work Item Details</h2>
//           <div className="flex items-center gap-2">
//             {!isEditing ? (
//               <button
//                 onClick={() => setIsEditing(true)}
//                 className="p-2 rounded-lg bg-white/20 hover:bg-white/30 text-white transition-all"
//               >
//                 <Edit2 className="w-5 h-5" />
//               </button>
//             ) : (
//               <button
//                 onClick={handleSave}
//                 disabled={isSaving}
//                 className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white text-blue-600 hover:bg-blue-50 font-bold transition-all disabled:opacity-50"
//               >
//                 {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
//                 {isSaving ? "Saving..." : "Save"}
//               </button>
//             )}
//             <button onClick={onClose} className="p-2 rounded-lg bg-white/20 hover:bg-white/30 text-white transition-all">
//               <X className="w-5 h-5" />
//             </button>
//           </div>
//         </div>

//         <div className="flex-1 overflow-y-auto p-6 space-y-4">
//           <div>
//             <label className="block text-sm font-bold text-gray-700 mb-2">Title</label>
//             {isEditing ? (
//               <input
//                 type="text"
//                 value={editedItem.title}
//                 onChange={(e) => setEditedItem({ ...editedItem, title: e.target.value })}
//                 className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
//               />
//             ) : (
//               <div className="px-4 py-2 rounded-lg bg-gray-50 border border-gray-200 font-medium text-gray-900">
//                 {editedItem.title || <span className="text-gray-400">N/A</span>}
//               </div>
//             )}
//           </div>

//           <div className="grid grid-cols-2 gap-4">
//             <div>
//               <label className="block text-sm font-bold text-gray-700 mb-2">Task Status</label>
//               {isEditing ? (
//                 <select
//                   value={editedItem.taskStatus}
//                   onChange={(e) => setEditedItem({ ...editedItem, taskStatus: e.target.value as WorkStatus })}
//                   className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
//                 >
//                   {taskStatusChoices.map(choice => (
//                     <option key={choice} value={choice.toLowerCase()}>{choice}</option>
//                   ))}
//                 </select>
//               ) : (
//                 <div className="px-4 py-2 rounded-lg bg-gray-50 border border-gray-200">
//                   <StatusPill status={editedItem.taskStatus} />
//                 </div>
//               )}
//             </div>

//             <div>
//               <label className="block text-sm font-bold text-gray-700 mb-2">Action Required</label>
//               {isEditing ? (
//                 <select
//                   value={editedItem.actionRequired ? "true" : "false"}
//                   onChange={(e) => setEditedItem({ ...editedItem, actionRequired: e.target.value === "true" })}
//                   className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
//                 >
//                   <option value="false">No</option>
//                   <option value="true">Yes</option>
//                 </select>
//               ) : (
//                 <div className="px-4 py-2 rounded-lg bg-gray-50 border border-gray-200 font-medium">
//                   {editedItem.actionRequired ? "Yes" : "No"}
//                 </div>
//               )}
//             </div>
//           </div>

//           <div className="grid grid-cols-2 gap-4">
//             <div>
//               <label className="block text-sm font-bold text-gray-700 mb-2">Due Date</label>
//               {isEditing ? (
//                 <input
//                   type="date"
//                   value={editedItem.dueDate || ""}
//                   onChange={(e) => setEditedItem({ ...editedItem, dueDate: e.target.value })}
//                   className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
//                 />
//               ) : (
//                 <div className="px-4 py-2 rounded-lg bg-gray-50 border border-gray-200 font-medium">
//                   {editedItem.dueDate || <span className="text-gray-400">N/A</span>}
//                 </div>
//               )}
//             </div>

//             <div>
//               <label className="block text-sm font-bold text-gray-700 mb-2">Source Type</label>
//               {isEditing ? (
//                 <select
//                   value={editedItem.sourceType || ""}
//                   onChange={(e) => setEditedItem({ ...editedItem, sourceType: e.target.value })}
//                   className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
//                 >
//                   <option value="">Select...</option>
//                   {sourceTypeChoices.map(choice => (
//                     <option key={choice} value={choice}>{choice}</option>
//                   ))}
//                 </select>
//               ) : (
//                 <div className="px-4 py-2 rounded-lg bg-gray-50 border border-gray-200 font-medium">
//                   {editedItem.sourceType || <span className="text-gray-400">N/A</span>}
//                 </div>
//               )}
//             </div>
//           </div>

//           <div className="grid grid-cols-2 gap-4">
//             <div>
//               <label className="block text-sm font-bold text-gray-700 mb-2">Percent Complete (%)</label>
//               {isEditing ? (
//                 <input
//                   type="number"
//                   min="0"
//                   max="100"
//                   step="1"
//                   value={editedItem.percentComplete ?? ""}
//                   onChange={(e) => setEditedItem({ ...editedItem, percentComplete: Number(e.target.value) || null })}
//                   className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
//                   placeholder="0-100"
//                 />
//               ) : (
//                 <div className="px-4 py-2 rounded-lg bg-gray-50 border border-gray-200 font-medium">
//                   {editedItem.percentComplete !== null ? `${editedItem.percentComplete}%` : "N/A"}
//                 </div>
//               )}
//             </div>

//             <div>
//               <label className="block text-sm font-bold text-gray-700 mb-2">Email Address</label>
//               {isEditing ? (
//                 <input
//                   type="email"
//                   value={editedItem.emailAddress || ""}
//                   onChange={(e) => setEditedItem({ ...editedItem, emailAddress: e.target.value })}
//                   className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
//                 />
//               ) : (
//                 <div className="px-4 py-2 rounded-lg bg-gray-50 border border-gray-200 font-medium">
//                   {editedItem.emailAddress || <span className="text-gray-400">N/A</span>}
//                 </div>
//               )}
//             </div>
//           </div>

//           <div className="grid grid-cols-2 gap-4">
//             <div>
//               <label className="block text-sm font-bold text-gray-700 mb-2">Xero ID</label>
//               {isEditing ? (
//                 <input
//                   type="text"
//                   value={editedItem.xeroID || ""}
//                   onChange={(e) => setEditedItem({ ...editedItem, xeroID: e.target.value })}
//                   className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
//                 />
//               ) : (
//                 <div className="px-4 py-2 rounded-lg bg-gray-50 border border-gray-200 font-medium">
//                   {editedItem.xeroID || <span className="text-gray-400">N/A</span>}
//                 </div>
//               )}
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   )
// }

// function AddTaskModal({
//   onClose,
//   onAdd,
//   columns
// }: {
//   onClose: () => void;
//   onAdd: (newItem: WorkItem) => void;
//   columns: ColumnMetadata[]
// }) {
//   const [newItem, setNewItem] = useState<Omit<WorkItem, "id">>({
//     title: "",
//     description: null,
//     taskStatus: "active",
//     dueDate: null,
//     percentComplete: 0,
//     lastUpdated: null,
//     actionRequired: false,
//     xeroID: null,
//     sourceType: null,
//     assignedStaff: null,
//     emailAddress: null,
//   })
//   const [isAdding, setIsAdding] = useState(false)

//   const taskStatusChoices = columns.find(c => c.name === "TaskStatus")?.choices || ["Active", "Pending", "Completed"]
//   const sourceTypeChoices = columns.find(c => c.name === "SourceType")?.choices || []

//   const handleAdd = async () => {
//     if (!newItem.title.trim()) {
//       alert("Please enter a title")
//       return
//     }

//     setIsAdding(true)
//     const token = getMsalAccessTokenFromSessionStorage()
//     if (!token) {
//       alert("Access token not found. Please login again.")
//       setIsAdding(false)
//       return
//     }

//     const fields: Record<string, any> = {
//       Title: newItem.title,
//       TaskStatus: newItem.taskStatus.charAt(0).toUpperCase() + newItem.taskStatus.slice(1),
//       DueDate: newItem.dueDate || null,
//       ActionRequired: newItem.actionRequired,
//       XeroID: newItem.xeroID || null,
//       SourceType: newItem.sourceType || null,
//       PercentComplete: newItem.percentComplete ?? 0,
//       Emailaddress: newItem.emailAddress || null,
//     }

//     if (newItem.assignedStaff) {
//       fields.AssignedStaff = { claims: `i:0#.f|membership|${newItem.assignedStaff}` }
//     }

//     const cleanedFields: Record<string, any> = {}
//     for (const [key, value] of Object.entries(fields)) {
//       if (value !== null && value !== undefined && (typeof value !== 'string' || value.trim() !== '')) {
//         cleanedFields[key] = value
//       }
//     }

//     try {
//       const res = await fetch("/api/work-items", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `Bearer ${token}`,
//         },
//         body: JSON.stringify({ fields: cleanedFields }),
//       })

//       if (!res.ok) {
//         const json = await res.json()
//         throw new Error(json?.details || json?.error || "Failed to create")
//       }

//       const created = await res.json()
//       const newLocalItem: WorkItem = {
//         id: created.id,
//         title: created.fields?.Title || newItem.title,
//         description: null,
//         taskStatus: (created.fields?.TaskStatus?.toLowerCase() || newItem.taskStatus) as WorkStatus,
//         dueDate: created.fields?.DueDate || newItem.dueDate,
//         percentComplete: Number(created.fields?.PercentComplete) || newItem.percentComplete,
//         lastUpdated: created.fields?.LastUpdated || newItem.lastUpdated,
//         actionRequired: created.fields?.ActionRequired ?? newItem.actionRequired,
//         xeroID: created.fields?.XeroID || newItem.xeroID,
//         sourceType: created.fields?.SourceType || newItem.sourceType,
//         assignedStaff: created.fields?.AssignedStaff?.Email || newItem.assignedStaff,
//         emailAddress: created.fields?.Emailaddress || newItem.emailAddress,
//       }
//       onAdd(newLocalItem)
//       onClose()
//     } catch (e: any) {
//       alert(`Failed to add: ${e.message}`)
//     } finally {
//       setIsAdding(false)
//     }
//   }

//   return (
//     <div
//       className="fixed inset-0 z-50 flex items-center justify-center p-4"
//       onClick={onClose}
//     >
//       <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

//       <div
//         className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
//         onClick={(e) => e.stopPropagation()}
//       >
//         <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-4 flex items-center justify-between">
//           <h2 className="text-xl font-bold text-white">Add New Task</h2>
//           <button onClick={onClose} className="p-2 rounded-lg bg-white/20 hover:bg-white/30 text-white transition-all">
//             <X className="w-5 h-5" />
//           </button>
//         </div>

//         <div className="flex-1 overflow-y-auto p-6 space-y-4">
//           <div>
//             <label className="block text-sm font-bold text-gray-700 mb-2">Title *</label>
//             <input
//               type="text"
//               value={newItem.title}
//               onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
//               className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-100 outline-none transition-all"
//               placeholder="Enter task title..."
//             />
//           </div>

//           <div className="grid grid-cols-2 gap-4">
//             <div>
//               <label className="block text-sm font-bold text-gray-700 mb-2">Task Status</label>
//               <select
//                 value={newItem.taskStatus}
//                 onChange={(e) => setNewItem({ ...newItem, taskStatus: e.target.value as WorkStatus })}
//                 className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-100 outline-none transition-all"
//               >
//                 {taskStatusChoices.map(choice => (
//                   <option key={choice} value={choice.toLowerCase()}>{choice}</option>
//                 ))}
//               </select>
//             </div>

//             <div>
//               <label className="block text-sm font-bold text-gray-700 mb-2">Action Required</label>
//               <select
//                 value={newItem.actionRequired ? "true" : "false"}
//                 onChange={(e) => setNewItem({ ...newItem, actionRequired: e.target.value === "true" })}
//                 className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-100 outline-none transition-all"
//               >
//                 <option value="false">No</option>
//                 <option value="true">Yes</option>
//               </select>
//             </div>
//           </div>

//           <div className="grid grid-cols-2 gap-4">
//             <div>
//               <label className="block text-sm font-bold text-gray-700 mb-2">Due Date</label>
//               <input
//                 type="date"
//                 value={newItem.dueDate || ""}
//                 onChange={(e) => setNewItem({ ...newItem, dueDate: e.target.value })}
//                 className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-100 outline-none transition-all"
//               />
//             </div>

//             <div>
//               <label className="block text-sm font-bold text-gray-700 mb-2">Source Type</label>
//               <select
//                 value={newItem.sourceType || ""}
//                 onChange={(e) => setNewItem({ ...newItem, sourceType: e.target.value })}
//                 className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-100 outline-none transition-all"
//               >
//                 <option value="">Select...</option>
//                 {sourceTypeChoices.map(choice => (
//                   <option key={choice} value={choice}>{choice}</option>
//                 ))}
//               </select>
//             </div>
//           </div>

//           <div className="grid grid-cols-2 gap-4">
//             <div>
//               <label className="block text-sm font-bold text-gray-700 mb-2">Percent Complete (%)</label>
//               <input
//                 type="number"
//                 min="0"
//                 max="100"
//                 step="1"
//                 value={newItem.percentComplete ?? ""}
//                 onChange={(e) => setNewItem({ ...newItem, percentComplete: Number(e.target.value) || 0 })}
//                 className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-100 outline-none transition-all"
//                 placeholder="0-100"
//               />
//             </div>

//             <div>
//               <label className="block text-sm font-bold text-gray-700 mb-2">Email Address</label>
//               <input
//                 type="email"
//                 value={newItem.emailAddress || ""}
//                 onChange={(e) => setNewItem({ ...newItem, emailAddress: e.target.value })}
//                 className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-100 outline-none transition-all"
//                 placeholder="email@example.com"
//               />
//             </div>
//           </div>

//           <div className="grid grid-cols-2 gap-4">
//             <div>
//               <label className="block text-sm font-bold text-gray-700 mb-2">Xero ID</label>
//               <input
//                 type="text"
//                 value={newItem.xeroID || ""}
//                 onChange={(e) => setNewItem({ ...newItem, xeroID: e.target.value })}
//                 className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-100 outline-none transition-all"
//                 placeholder="Enter Xero ID..."
//               />
//             </div>
//           </div>
//         </div>

//         <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 flex gap-3">
//           <button
//             onClick={onClose}
//             className="flex-1 px-4 py-3 rounded-lg border-2 border-gray-200 font-bold text-gray-700 hover:bg-gray-100 transition-all"
//           >
//             Cancel
//           </button>
//           <button
//             onClick={handleAdd}
//             disabled={isAdding}
//             className="flex-1 px-4 py-3 rounded-lg bg-gradient-to-r from-green-600 to-green-700 font-bold text-white hover:from-green-700 hover:to-green-800 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
//           >
//             {isAdding ? (
//               <>
//                 <RefreshCw className="w-4 h-4 animate-spin" />
//                 Adding...
//               </>
//             ) : (
//               <>
//                 <Plus className="w-4 h-4" />
//                 Add Task
//               </>
//             )}
//           </button>
//         </div>
//       </div>
//     </div>
//   )
// }

// export default function WorkPage() {
//   const [activeTab, setActiveTab] = useState<WorkStatus>("active")
//   const [items, setItems] = useState<WorkItem[]>([])
//   const [columns, setColumns] = useState<ColumnMetadata[]>([])
//   const [loading, setLoading] = useState(true)
//   const [error, setError] = useState<string>("")
//   const [selectedItem, setSelectedItem] = useState<WorkItem | null>(null)
//   const [showAddModal, setShowAddModal] = useState(false)

//   const loadData = async () => {
//     setLoading(true)
//     setError("")

//     const token = getMsalAccessTokenFromSessionStorage()
//     if (!token) {
//       setLoading(false)
//       setError("MSAL access token not found. Please login again.")
//       return
//     }

//     try {
//       const res = await fetch("/api/work-items?include=columns", {
//         headers: { Authorization: `Bearer ${token}` },
//         cache: "no-store",
//       })

//       if (!res.ok) {
//         const json = await res.json()
//         throw new Error(json?.details || json?.error || "Failed to load")
//       }

//       const json = await res.json()

//       if (json.columns) {
//         const parsedColumns: ColumnMetadata[] = json.columns.map((col: any) => ({
//           name: col.name,
//           displayName: col.displayName || col.name,
//           type: col.columnGroup || col.type || "text",
//           choices: col.choice?.choices || []
//         }))
//         setColumns(parsedColumns)
//       }

//       const mappedItems = (json.items || []).map((item: any) => ({
//         id: item.id || String(Math.random()),
//         title: item.title || "",
//         description: item.description || null,
//         taskStatus: item.status || "active",
//         dueDate: item.dueDate || null,
//         percentComplete: Number(item.rawFields?.PercentComplete) || null,
//         lastUpdated: item.rawFields?.LastUpdated || null,
//         actionRequired: item.rawFields?.ActionRequired ?? false,
//         xeroID: item.rawFields?.XeroID || null,
//         sourceType: item.rawFields?.SourceType || null,
//         assignedStaff: item.assignedTo || null,
//         emailAddress: item.rawFields?.Emailaddress || null,
//       }))

//       setItems(mappedItems)
//     } catch (e: any) {
//       setError(e?.message || "Something went wrong")
//     } finally {
//       setLoading(false)
//     }
//   }

//   useEffect(() => {
//     loadData()
//   }, [])

//   const stats = useMemo(() => {
//     return {
//       active: items.filter((i) => i.taskStatus === "active").length,
//       pending: items.filter((i) => i.taskStatus === "pending").length,
//       completed: items.filter((i) => i.taskStatus === "completed").length,
//     }
//   }, [items])

//   const filteredItems = useMemo(() => items.filter((i) => i.taskStatus === activeTab), [items, activeTab])

//   const handleSaveItem = (updated: WorkItem) => {
//     setItems(prev => prev.map(item => item.id === updated.id ? updated : item))
//     setSelectedItem(updated)
//     loadData()
//   }

//   const handleAddItem = (newItem: WorkItem) => {
//     setItems(prev => [newItem, ...prev])
//     loadData()
//   }

//   return (
//     <DashboardLayout>
//       <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
//         <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
//           <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
//             <div>
//               <h1 className="text-4xl font-bold text-gray-900 mb-2">Work In Progress</h1>
//               <p className="text-gray-600 text-lg">SharePoint tasks from your list</p>
//             </div>

//             <div className="flex flex-wrap items-center gap-3">
//               <button
//                 onClick={loadData}
//                 className="flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-gray-50 text-gray-800 rounded-lg font-bold transition-all border border-gray-200 shadow-sm hover:shadow-md"
//               >
//                 <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
//                 Refresh
//               </button>

//               <button
//                 onClick={() => setShowAddModal(true)}
//                 className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-lg font-bold transition-all shadow-md hover:shadow-lg"
//               >
//                 <Plus className="w-4 h-4" />
//                 Add Task
//               </button>
//             </div>
//           </div>

//           <div className="rounded-xl border border-gray-200 bg-white p-2 flex gap-2 shadow-sm">
//             <button
//               onClick={() => setActiveTab("active")}
//               className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 font-bold rounded-lg transition-all ${activeTab === "active" ? "bg-blue-500 text-white shadow-md" : "text-gray-600 hover:bg-gray-100"}`}
//             >
//               <Clock className="w-4 h-4" />
//               Active
//               <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${activeTab === "active" ? "bg-white/20" : "bg-gray-200"}`}>
//                 {stats.active}
//               </span>
//             </button>

//             <button
//               onClick={() => setActiveTab("pending")}
//               className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 font-bold rounded-lg transition-all ${activeTab === "pending" ? "bg-orange-500 text-white shadow-md" : "text-gray-600 hover:bg-gray-100"}`}
//             >
//               <AlertCircle className="w-4 h-4" />
//               Pending
//               <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${activeTab === "pending" ? "bg-white/20" : "bg-gray-200"}`}>
//                 {stats.pending}
//               </span>
//             </button>

//             <button
//               onClick={() => setActiveTab("completed")}
//               className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 font-bold rounded-lg transition-all ${activeTab === "completed" ? "bg-green-600 text-white shadow-md" : "text-gray-600 hover:bg-gray-100"}`}
//             >
//               <CheckCircle2 className="w-4 h-4" />
//               Completed
//               <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${activeTab === "completed" ? "bg-white/20" : "bg-gray-200"}`}>
//                 {stats.completed}
//               </span>
//             </button>
//           </div>

//           {loading ? (
//             <div className="rounded-xl border border-gray-200 bg-white p-12 text-center">
//               <div className="flex items-center justify-center mb-4">
//                 <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
//               </div>
//               <div className="text-gray-800 font-bold text-lg">Loading work items...</div>
//               <div className="text-gray-500 text-sm mt-2">Fetching data from SharePoint</div>
//             </div>
//           ) : error ? (
//             <div className="rounded-xl border border-red-200 bg-red-50 p-12 text-center">
//               <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
//                 <AlertCircle className="w-8 h-8 text-red-500" />
//               </div>
//               <div className="text-red-700 font-bold text-lg">Could not load data</div>
//               <div className="text-red-600 text-sm mt-2 max-w-md mx-auto">{error}</div>
//               <button
//                 onClick={loadData}
//                 className="mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-white border-2 border-red-200 font-bold text-red-700 hover:bg-red-50 transition-all shadow-sm"
//               >
//                 <RefreshCw className="w-4 h-4" />
//                 Try Again
//               </button>
//             </div>
//           ) : (
//             <div className="space-y-4">
//               {filteredItems.map((item) => (
//                 <WorkCard key={item.id} item={item} onClick={() => setSelectedItem(item)} />
//               ))}

//               {filteredItems.length === 0 && (
//                 <div className="rounded-xl border border-gray-200 bg-white p-12 text-center">
//                   <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
//                     <CheckCircle2 className="w-8 h-8 text-gray-500" />
//                   </div>
//                   <h3 className="text-lg font-bold text-gray-900 mb-2">No {activeTab} items</h3>
//                   <p className="text-gray-600 mb-6">You don't have any {activeTab} work items right now.</p>
//                   <button
//                     onClick={() => setShowAddModal(true)}
//                     className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-r from-green-600 to-green-700 text-white font-bold hover:from-green-700 hover:to-green-800 transition-all shadow-md"
//                   >
//                     <Plus className="w-4 h-4" />
//                     Add Your First Task
//                   </button>
//                 </div>
//               )}
//             </div>
//           )}
//         </div>

//         {selectedItem && (
//           <DetailModal
//             item={selectedItem}
//             onClose={() => setSelectedItem(null)}
//             onSave={handleSaveItem}
//             columns={columns}
//           />
//         )}

//         {showAddModal && (
//           <AddTaskModal
//             onClose={() => setShowAddModal(false)}
//             onAdd={handleAddItem}
//             columns={columns}
//           />
//         )}
//       </div>
//     </DashboardLayout>
//   )
// }









"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    router.push("/login")
  }, [router])

  return null
}
