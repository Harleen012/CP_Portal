

// "use client"

// import { useEffect, useMemo, useState } from "react"
// import { useRouter } from "next/navigation"
// import { DashboardLayout } from "@/components/layouts/dashboard-layout"
// import { ListFilter, Clock, CheckCircle2, AlertCircle, RefreshCw, Info, Plus, X, Edit2, Save } from "lucide-react"

// type WorkStatus = "active" | "pending" | "completed"

// type WorkItem = {
//   id: string
//   title: string
//   description?: string
//   status: WorkStatus
//   dueDate?: string | null
//   percentComplete?: number | null
//   assignedTo?: string | null
//   rawFields?: Record<string, any>
// }

// /**
//  * MSAL stores tokens in sessionStorage.
//  * We find objects where:
//  *  - credentialType === "AccessToken"
//  *  - secret exists (the actual token)
//  *  - expiresOn is in the future (if present)
//  */
// function getMsalAccessTokenFromSessionStorage(): string | null {
//   if (typeof window === "undefined") return null
//   if (!window.sessionStorage) return null

//   const nowSec = Math.floor(Date.now() / 1000)

//   const candidates: Array<{ secret: string; expiresOn?: number }> = []

//   for (let i = 0; i < sessionStorage.length; i++) {
//     const key = sessionStorage.key(i)
//     if (!key) continue

//     // MSAL keys often start with "msal."
//     if (!key.toLowerCase().startsWith("msal")) continue

//     const value = sessionStorage.getItem(key)
//     if (!value) continue

//     // Values for access tokens are JSON strings
//     if (value[0] !== "{") continue

//     try {
//       const obj = JSON.parse(value)

//       // Access token records look like:
//       // { credentialType: "AccessToken", secret: "<JWT>", expiresOn: "<unix-seconds-as-string>", ... }
//       if (obj?.credentialType !== "AccessToken") continue
//       if (!obj?.secret || typeof obj.secret !== "string") continue

//       const exp = obj.expiresOn ? Number(obj.expiresOn) : undefined
//       candidates.push({ secret: obj.secret, expiresOn: Number.isFinite(exp) ? exp : undefined })
//     } catch {
//       // ignore
//     }
//   }

//   if (!candidates.length) return null

//   // Prefer non-expired tokens first
//   const valid = candidates.filter((c) => !c.expiresOn || c.expiresOn > nowSec + 60)
//   if (valid.length) {
//     valid.sort((a, b) => (b.expiresOn || 0) - (a.expiresOn || 0))
//     return valid[0].secret
//   }

//   // Fallback: newest expiry
//   candidates.sort((a, b) => (b.expiresOn || 0) - (a.expiresOn || 0))
//   return candidates[0].secret
// }

// function StatusPill({ status }: { status: WorkStatus }) {
//   const cls =
//     status === "active"
//       ? "bg-indigo-50 text-indigo-700 border-indigo-100"
//       : status === "pending"
//       ? "bg-amber-50 text-amber-700 border-amber-100"
//       : "bg-emerald-50 text-emerald-700 border-emerald-100"

//   const label = status === "active" ? "Active" : status === "pending" ? "Pending" : "Completed"
//   return <span className={`inline-flex px-2 py-1 text-xs font-extrabold rounded-full border ${cls}`}>{label}</span>
// }

// function WorkCard({ item, onClick }: { item: WorkItem; onClick: () => void }) {
//   const pct =
//     typeof item.percentComplete === "number"
//       ? Math.max(0, Math.min(100, Math.round(item.percentComplete)))
//       : null

//   return (
//     <div 
//       onClick={onClick}
//       className="rounded-2xl border border-slate-200/70 bg-white/70 backdrop-blur shadow-[0_14px_45px_rgba(15,23,42,0.06)] p-5 transition-all duration-300 hover:shadow-[0_18px_60px_rgba(15,23,42,0.10)] hover:scale-[1.02] hover:border-indigo-200 cursor-pointer group animate-slide-up"
//     >
//       <div className="flex items-start justify-between gap-3">
//         <div className="min-w-0 flex-1">
//           <div className="flex items-center gap-2">
//             <h3 className="text-[15px] sm:text-[16px] font-extrabold text-slate-900 truncate group-hover:text-indigo-700 transition-colors">
//               {item.title}
//             </h3>
//             <StatusPill status={item.status} />
//           </div>

//           {item.description ? <p className="text-sm text-slate-600 mt-1 line-clamp-2">{item.description}</p> : null}

//           <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-slate-600">
//             {item.assignedTo ? (
//               <span className="px-2 py-1 rounded-full bg-slate-100 border border-slate-200 transition-all group-hover:bg-indigo-50 group-hover:border-indigo-200">
//                 Assigned: <span className="font-extrabold text-slate-800">{item.assignedTo}</span>
//               </span>
//             ) : null}
//             {item.dueDate ? (
//               <span className="px-2 py-1 rounded-full bg-slate-100 border border-slate-200 transition-all group-hover:bg-indigo-50 group-hover:border-indigo-200">
//                 Due: <span className="font-extrabold text-slate-800">{String(item.dueDate)}</span>
//               </span>
//             ) : null}
//           </div>
//         </div>
//       </div>

//       {pct !== null ? (
//         <div className="mt-4">
//           <div className="flex items-center justify-between text-xs font-bold text-slate-500">
//             <span>Progress</span>
//             <span className="text-slate-800">{pct}%</span>
//           </div>
//           <div className="mt-2 h-2 rounded-full bg-slate-200 overflow-hidden">
//             <div 
//               className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-indigo-600 transition-all duration-500 ease-out" 
//               style={{ width: `${pct}%` }} 
//             />
//           </div>
//         </div>
//       ) : null}
//     </div>
//   )
// }

// function DetailModal({ 
//   item, 
//   onClose, 
//   onSave 
// }: { 
//   item: WorkItem; 
//   onClose: () => void; 
//   onSave: (updated: WorkItem) => void 
// }) {
//   const [isEditing, setIsEditing] = useState(false)
//   const [editedItem, setEditedItem] = useState<WorkItem>(item)
//   const [isSaving, setIsSaving] = useState(false)

//   const handleSave = async () => {
//     setIsSaving(true)
//     // Simulate save delay
//     await new Promise(resolve => setTimeout(resolve, 800))
//     onSave(editedItem)
//     setIsEditing(false)
//     setIsSaving(false)
//   }

//   const pct =
//     typeof editedItem.percentComplete === "number"
//       ? Math.max(0, Math.min(100, Math.round(editedItem.percentComplete)))
//       : null

//   return (
//     <div 
//       className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
//       onClick={onClose}
//     >
//       {/* Backdrop with blur */}
//       <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
      
//       {/* Modal */}
//       <div 
//         className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden animate-scale-up max-h-[90vh] flex flex-col"
//         onClick={(e) => e.stopPropagation()}
//       >
//         {/* Header */}
//         <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 px-6 py-5 flex items-center justify-between">
//           <h2 className="text-xl font-extrabold text-white">Work Item Details</h2>
//           <div className="flex items-center gap-2">
//             {!isEditing ? (
//               <button
//                 onClick={() => setIsEditing(true)}
//                 className="p-2 rounded-xl bg-white/20 hover:bg-white/30 text-white transition-all"
//               >
//                 <Edit2 className="w-5 h-5" />
//               </button>
//             ) : (
//               <button
//                 onClick={handleSave}
//                 disabled={isSaving}
//                 className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-indigo-600 hover:bg-indigo-50 font-bold transition-all disabled:opacity-50"
//               >
//                 {isSaving ? (
//                   <RefreshCw className="w-4 h-4 animate-spin" />
//                 ) : (
//                   <Save className="w-4 h-4" />
//                 )}
//                 {isSaving ? "Saving..." : "Save"}
//               </button>
//             )}
//             <button
//               onClick={onClose}
//               className="p-2 rounded-xl bg-white/20 hover:bg-white/30 text-white transition-all"
//             >
//               <X className="w-5 h-5" />
//             </button>
//           </div>
//         </div>

//         {/* Content */}
//         <div className="flex-1 overflow-y-auto p-6 space-y-6">
//           {/* Title */}
//           <div>
//             <label className="block text-sm font-bold text-slate-700 mb-2">Title</label>
//             {isEditing ? (
//               <input
//                 type="text"
//                 value={editedItem.title}
//                 onChange={(e) => setEditedItem({ ...editedItem, title: e.target.value })}
//                 className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 outline-none transition-all font-semibold"
//               />
//             ) : (
//               <div className="px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 font-semibold text-slate-900">
//                 {editedItem.title}
//               </div>
//             )}
//           </div>

//           {/* Status */}
//           <div>
//             <label className="block text-sm font-bold text-slate-700 mb-2">Status</label>
//             {isEditing ? (
//               <select
//                 value={editedItem.status}
//                 onChange={(e) => setEditedItem({ ...editedItem, status: e.target.value as WorkStatus })}
//                 className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 outline-none transition-all font-semibold"
//               >
//                 <option value="active">Active</option>
//                 <option value="pending">Pending</option>
//                 <option value="completed">Completed</option>
//               </select>
//             ) : (
//               <div className="px-4 py-3 rounded-xl bg-slate-50 border border-slate-200">
//                 <StatusPill status={editedItem.status} />
//               </div>
//             )}
//           </div>

//           {/* Description */}
//           <div>
//             <label className="block text-sm font-bold text-slate-700 mb-2">Description</label>
//             {isEditing ? (
//               <textarea
//                 value={editedItem.description || ""}
//                 onChange={(e) => setEditedItem({ ...editedItem, description: e.target.value })}
//                 rows={4}
//                 className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 outline-none transition-all font-medium resize-none"
//                 placeholder="Add a description..."
//               />
//             ) : (
//               <div className="px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 min-h-[100px] font-medium text-slate-700">
//                 {editedItem.description || <span className="text-slate-400">No description</span>}
//               </div>
//             )}
//           </div>

//           {/* Assigned To */}
//           <div>
//             <label className="block text-sm font-bold text-slate-700 mb-2">Assigned To</label>
//             {isEditing ? (
//               <input
//                 type="text"
//                 value={editedItem.assignedTo || ""}
//                 onChange={(e) => setEditedItem({ ...editedItem, assignedTo: e.target.value })}
//                 className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 outline-none transition-all font-semibold"
//                 placeholder="Enter name..."
//               />
//             ) : (
//               <div className="px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 font-semibold text-slate-900">
//                 {editedItem.assignedTo || <span className="text-slate-400">Unassigned</span>}
//               </div>
//             )}
//           </div>

//           {/* Due Date */}
//           <div>
//             <label className="block text-sm font-bold text-slate-700 mb-2">Due Date</label>
//             {isEditing ? (
//               <input
//                 type="date"
//                 value={editedItem.dueDate || ""}
//                 onChange={(e) => setEditedItem({ ...editedItem, dueDate: e.target.value })}
//                 className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 outline-none transition-all font-semibold"
//               />
//             ) : (
//               <div className="px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 font-semibold text-slate-900">
//                 {editedItem.dueDate || <span className="text-slate-400">No due date</span>}
//               </div>
//             )}
//           </div>

//           {/* Progress */}
//           <div>
//             <label className="block text-sm font-bold text-slate-700 mb-2">Progress</label>
//             {isEditing ? (
//               <div className="space-y-3">
//                 <input
//                   type="range"
//                   min="0"
//                   max="100"
//                   value={editedItem.percentComplete || 0}
//                   onChange={(e) => setEditedItem({ ...editedItem, percentComplete: Number(e.target.value) })}
//                   className="w-full h-2 rounded-full bg-slate-200 accent-indigo-500"
//                 />
//                 <div className="text-center text-2xl font-extrabold text-indigo-600">
//                   {Math.round(editedItem.percentComplete || 0)}%
//                 </div>
//               </div>
//             ) : (
//               <div className="px-4 py-3 rounded-xl bg-slate-50 border border-slate-200">
//                 <div className="flex items-center justify-between text-sm font-bold text-slate-600 mb-2">
//                   <span>Completion</span>
//                   <span className="text-slate-900 text-lg">{pct !== null ? `${pct}%` : "N/A"}</span>
//                 </div>
//                 {pct !== null && (
//                   <div className="h-3 rounded-full bg-slate-200 overflow-hidden">
//                     <div 
//                       className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-indigo-600 transition-all duration-500" 
//                       style={{ width: `${pct}%` }} 
//                     />
//                   </div>
//                 )}
//               </div>
//             )}
//           </div>

//           {/* Additional Fields */}
//           {editedItem.rawFields && Object.keys(editedItem.rawFields).length > 0 && (
//             <div>
//               <label className="block text-sm font-bold text-slate-700 mb-2">Additional Information</label>
//               <div className="px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 max-h-40 overflow-y-auto">
//                 <pre className="text-xs font-mono text-slate-600 whitespace-pre-wrap">
//                   {JSON.stringify(editedItem.rawFields, null, 2)}
//                 </pre>
//               </div>
//             </div>
//           )}
//         </div>
//       </div>
//     </div>
//   )
// }

// function AddTaskModal({ 
//   onClose, 
//   onAdd 
// }: { 
//   onClose: () => void; 
//   onAdd: (newItem: Omit<WorkItem, "id">) => void 
// }) {
//   const [newItem, setNewItem] = useState<Omit<WorkItem, "id">>({
//     title: "",
//     description: "",
//     status: "active",
//     dueDate: null,
//     percentComplete: 0,
//     assignedTo: null,
//   })
//   const [isAdding, setIsAdding] = useState(false)

//   const handleAdd = async () => {
//     if (!newItem.title.trim()) {
//       alert("Please enter a title")
//       return
//     }
    
//     setIsAdding(true)
//     await new Promise(resolve => setTimeout(resolve, 800))
//     onAdd(newItem)
//     setIsAdding(false)
//     onClose()
//   }

//   return (
//     <div 
//       className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
//       onClick={onClose}
//     >
//       <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
      
//       <div 
//         className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden animate-scale-up max-h-[90vh] flex flex-col"
//         onClick={(e) => e.stopPropagation()}
//       >
//         <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 px-6 py-5 flex items-center justify-between">
//           <h2 className="text-xl font-extrabold text-white">Add New Task</h2>
//           <button
//             onClick={onClose}
//             className="p-2 rounded-xl bg-white/20 hover:bg-white/30 text-white transition-all"
//           >
//             <X className="w-5 h-5" />
//           </button>
//         </div>

//         <div className="flex-1 overflow-y-auto p-6 space-y-6">
//           <div>
//             <label className="block text-sm font-bold text-slate-700 mb-2">Title *</label>
//             <input
//               type="text"
//               value={newItem.title}
//               onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
//               className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 outline-none transition-all font-semibold"
//               placeholder="Enter task title..."
//             />
//           </div>

//           <div>
//             <label className="block text-sm font-bold text-slate-700 mb-2">Status</label>
//             <select
//               value={newItem.status}
//               onChange={(e) => setNewItem({ ...newItem, status: e.target.value as WorkStatus })}
//               className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 outline-none transition-all font-semibold"
//             >
//               <option value="active">Active</option>
//               <option value="pending">Pending</option>
//               <option value="completed">Completed</option>
//             </select>
//           </div>

//           <div>
//             <label className="block text-sm font-bold text-slate-700 mb-2">Description</label>
//             <textarea
//               value={newItem.description || ""}
//               onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
//               rows={4}
//               className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 outline-none transition-all font-medium resize-none"
//               placeholder="Add a description..."
//             />
//           </div>

//           <div>
//             <label className="block text-sm font-bold text-slate-700 mb-2">Assigned To</label>
//             <input
//               type="text"
//               value={newItem.assignedTo || ""}
//               onChange={(e) => setNewItem({ ...newItem, assignedTo: e.target.value })}
//               className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 outline-none transition-all font-semibold"
//               placeholder="Enter name..."
//             />
//           </div>

//           <div>
//             <label className="block text-sm font-bold text-slate-700 mb-2">Due Date</label>
//             <input
//               type="date"
//               value={newItem.dueDate || ""}
//               onChange={(e) => setNewItem({ ...newItem, dueDate: e.target.value })}
//               className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 outline-none transition-all font-semibold"
//             />
//           </div>

//           <div>
//             <label className="block text-sm font-bold text-slate-700 mb-2">Initial Progress</label>
//             <div className="space-y-3">
//               <input
//                 type="range"
//                 min="0"
//                 max="100"
//                 value={newItem.percentComplete || 0}
//                 onChange={(e) => setNewItem({ ...newItem, percentComplete: Number(e.target.value) })}
//                 className="w-full h-2 rounded-full bg-slate-200 accent-emerald-500"
//               />
//               <div className="text-center text-2xl font-extrabold text-emerald-600">
//                 {Math.round(newItem.percentComplete || 0)}%
//               </div>
//             </div>
//           </div>
//         </div>

//         <div className="border-t border-slate-200 px-6 py-4 bg-slate-50 flex gap-3">
//           <button
//             onClick={onClose}
//             className="flex-1 px-4 py-3 rounded-xl border-2 border-slate-200 font-bold text-slate-700 hover:bg-slate-100 transition-all"
//           >
//             Cancel
//           </button>
//           <button
//             onClick={handleAdd}
//             disabled={isAdding}
//             className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 font-bold text-white hover:from-emerald-600 hover:to-emerald-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
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
//   const router = useRouter()
//   const [activeTab, setActiveTab] = useState<WorkStatus>("active")

//   const [items, setItems] = useState<WorkItem[]>([])
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
//       setError("MSAL access token not found in sessionStorage. Please login again.")
//       return
//     }

//     try {
//       const res = await fetch("/api/work-items", {
//         headers: { Authorization: `Bearer ${token}` },
//         cache: "no-store",
//       })

//       const json = await res.json()
//       if (!res.ok) throw new Error(json?.details || json?.error || "Failed to load")

//       setItems(json.items || [])
//     } catch (e: any) {
//       setError(e?.message || "Something went wrong")
//     } finally {
//       setLoading(false)
//     }
//   }

//   useEffect(() => {
//     loadData()
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [])

//   const stats = useMemo(() => {
//     return {
//       active: items.filter((i) => i.status === "active").length,
//       pending: items.filter((i) => i.status === "pending").length,
//       completed: items.filter((i) => i.status === "completed").length,
//     }
//   }, [items])

//   const filteredItems = useMemo(() => items.filter((i) => i.status === activeTab), [items, activeTab])

//   const handleSaveItem = (updated: WorkItem) => {
//     setItems(prev => prev.map(item => item.id === updated.id ? updated : item))
//     setSelectedItem(updated)
//   }

//   const handleAddItem = async (newItem: Omit<WorkItem, "id">) => {
//   const token = getMsalAccessTokenFromSessionStorage()
//   if (!token) {
//     alert("Session expired. Please login again.")
//     return
//   }

//   try {
//     const res = await fetch("http://127.0.0.1:5050/api/work-items", {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//         Authorization: `Bearer ${token}`,
//       },
//       body: JSON.stringify(newItem),
//     })

//     const json = await res.json()
//     if (!res.ok) throw new Error(json?.details || "Failed to create task")

//     // ✅ Use item returned from SharePoint
//     setItems(prev => [json.item, ...prev])
//   } catch (err: any) {
//     alert(err.message || "Failed to add task")
//   }
// }


//   // const handleAddItem = (newItem: Omit<WorkItem, "id">) => {
//   //   const item: WorkItem = {
//   //     ...newItem,
//   //     id: `task-${Date.now()}`,
//   //   }
//   //   setItems(prev => [item, ...prev])
//   // }

//   return (
//     <DashboardLayout>
//       <style jsx global>{`
//         @keyframes fade-in {
//           from {
//             opacity: 0;
//           }
//           to {
//             opacity: 1;
//           }
//         }

//         @keyframes slide-up {
//           from {
//             opacity: 0;
//             transform: translateY(20px);
//           }
//           to {
//             opacity: 1;
//             transform: translateY(0);
//           }
//         }

//         @keyframes scale-up {
//           from {
//             opacity: 0;
//             transform: scale(0.95);
//           }
//           to {
//             opacity: 1;
//             transform: scale(1);
//           }
//         }

//         .animate-fade-in {
//           animation: fade-in 0.3s ease-out;
//         }

//         .animate-slide-up {
//           animation: slide-up 0.4s ease-out backwards;
//         }

//         .animate-scale-up {
//           animation: scale-up 0.3s ease-out;
//         }

//         @keyframes spin {
//           to {
//             transform: rotate(360deg);
//           }
//         }

//         .animate-spin {
//           animation: spin 1s linear infinite;
//         }
//       `}</style>

//       <div className="min-h-[calc(100vh-64px)] bg-gradient-to-b from-slate-50 via-slate-50 to-indigo-50/40">
//         <div className="space-y-6 animate-fade-in px-2 sm:px-4 py-4 sm:py-6">
//           {/* Header */}
//           <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
//             <div>
//               <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-2 text-balance">
//                 Work In Progress
//               </h1>
//               <p className="text-slate-600 text-lg">SharePoint tasks loaded via your Flask Graph proxy</p>
//             </div>

//             <div className="flex flex-wrap items-center gap-3">
//               <button
//                 onClick={loadData}
//                 className="flex items-center gap-2 px-4 py-2.5 bg-white/70 hover:bg-white text-slate-800 rounded-xl font-bold transition-all border border-slate-200/70 shadow-sm hover:shadow-md hover:scale-105"
//               >
//                 <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
//                 Refresh
//               </button>

//               <button
//                 className="flex items-center gap-2 px-4 py-2.5 bg-white/70 hover:bg-white text-slate-800 rounded-xl font-bold transition-all border border-slate-200/70 shadow-sm hover:shadow-md hover:scale-105"
//                 onClick={() => alert("Filter UI (demo). Add filters here.")} 
//               >
//                 <ListFilter className="w-4 h-4" />
//                 Filter
//               </button>

//               <button
//                 onClick={() => setShowAddModal(true)}
//                 className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-xl font-bold transition-all shadow-md hover:shadow-lg hover:scale-105"
//               >
//                 <Plus className="w-4 h-4" />
//                 Add Task
//               </button>
//             </div>
//           </div>

//           {/* Tabs */}
//           <div className="rounded-2xl border border-slate-200/70 bg-white/60 backdrop-blur p-2 flex gap-2 shadow-sm">
//             <button
//               onClick={() => setActiveTab("active")}
//               className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 font-extrabold rounded-xl transition-all duration-300 ${
//                 activeTab === "active" ? "bg-indigo-500 text-white shadow-lg scale-105" : "text-slate-600 hover:bg-slate-100"
//               }`}
//             >
//               <Clock className="w-4 h-4" />
//               Active
//               <span className={`px-2 py-0.5 rounded-full text-xs font-extrabold transition-all ${activeTab === "active" ? "bg-white/20" : "bg-slate-200"}`}>
//                 {stats.active}
//               </span>
//             </button>

//             <button
//               onClick={() => setActiveTab("pending")}
//               className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 font-extrabold rounded-xl transition-all duration-300 ${
//                 activeTab === "pending" ? "bg-amber-500 text-white shadow-lg scale-105" : "text-slate-600 hover:bg-slate-100"
//               }`}
//             >
//               <AlertCircle className="w-4 h-4" />
//               Pending
//               <span className={`px-2 py-0.5 rounded-full text-xs font-extrabold transition-all ${activeTab === "pending" ? "bg-white/20" : "bg-slate-200"}`}>
//                 {stats.pending}
//               </span>
//             </button>

//             <button
//               onClick={() => setActiveTab("completed")}
//               className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 font-extrabold rounded-xl transition-all duration-300 ${
//                 activeTab === "completed" ? "bg-emerald-600 text-white shadow-lg scale-105" : "text-slate-600 hover:bg-slate-100"
//               }`}
//             >
//               <CheckCircle2 className="w-4 h-4" />
//               Completed
//               <span className={`px-2 py-0.5 rounded-full text-xs font-extrabold transition-all ${activeTab === "completed" ? "bg-white/20" : "bg-slate-200"}`}>
//                 {stats.completed}
//               </span>
//             </button>
//           </div>

//           {/* Content */}
//           {loading ? (
//             <div className="rounded-2xl border border-slate-200/70 bg-white/70 p-8 text-center animate-pulse">
//               <div className="flex items-center justify-center mb-4">
//                 <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
//               </div>
//               <div className="text-slate-800 font-extrabold text-lg">Loading work items…</div>
//               <div className="text-slate-500 text-sm mt-2">
//                 Step 1: site → Step 2: lists → Step 3: list items
//               </div>
//               <div className="mt-4 flex justify-center gap-2">
//                 <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
//                 <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
//                 <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
//               </div>
//             </div>
//           ) : error ? (
//             <div className="rounded-2xl border border-rose-200 bg-rose-50/70 p-8 text-center animate-slide-up">
//               <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
//                 <AlertCircle className="w-8 h-8 text-rose-500" />
//               </div>
//               <div className="text-rose-700 font-extrabold text-lg">Could not load data</div>
//               <div className="text-rose-700/80 text-sm mt-2 max-w-md mx-auto">{error}</div>

//               <div className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-rose-700/80 bg-rose-100 px-4 py-2 rounded-full">
//                 <Info className="w-4 h-4" />
//                 Ensure Flask is running on 127.0.0.1:5050 and you are logged in.
//               </div>

//               <button
//                 onClick={loadData}
//                 className="mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white border-2 border-rose-200 font-bold text-rose-700 hover:bg-rose-50 transition-all hover:scale-105 shadow-sm hover:shadow-md"
//               >
//                 <RefreshCw className="w-4 h-4" />
//                 Try Again
//               </button>
//             </div>
//           ) : (
//             <div className="space-y-4">
//               {filteredItems.map((item, index) => (
//                 <div 
//                   key={item.id} 
//                   style={{ animationDelay: `${index * 50}ms` }}
//                 >
//                   <WorkCard item={item} onClick={() => setSelectedItem(item)} />
//                 </div>
//               ))}

//               {filteredItems.length === 0 && (
//                 <div className="rounded-2xl border border-slate-200/70 bg-white/70 p-12 text-center animate-slide-up">
//                   <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
//                     <CheckCircle2 className="w-8 h-8 text-slate-500" />
//                   </div>
//                   <h3 className="text-lg font-extrabold text-slate-900 mb-2">No {activeTab} items</h3>
//                   <p className="text-slate-600 mb-6">You don't have any {activeTab} work items right now.</p>
//                   <button
//                     onClick={() => setShowAddModal(true)}
//                     className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-bold hover:from-emerald-600 hover:to-emerald-700 transition-all hover:scale-105 shadow-md"
//                   >
//                     <Plus className="w-4 h-4" />
//                     Add Your First Task
//                   </button>
//                 </div>
//               )}
//             </div>
//           )}
//         </div>
//       </div>

//       {/* Detail Modal */}
//       {selectedItem && (
//         <DetailModal 
//           item={selectedItem} 
//           onClose={() => setSelectedItem(null)} 
//           onSave={handleSaveItem}
//         />
//       )}

//       {/* Add Task Modal */}
//       {showAddModal && (
//         <AddTaskModal 
//           onClose={() => setShowAddModal(false)} 
//           onAdd={handleAddItem}
//         />
//       )}
//     </DashboardLayout>
//   )
// }









"use client"

import { useEffect, useMemo, useState } from "react"
import { DashboardLayout } from "@/components/layouts/dashboard-layout"
import { ListFilter, Clock, CheckCircle2, AlertCircle, RefreshCw, Info, Plus, X, Edit2, Save } from "lucide-react"

type WorkStatus = "active" | "pending" | "completed"

type WorkItem = {
  id: string
  title: string
  description: string | null
  taskStatus: WorkStatus
  dueDate: string | null
  percentComplete: number | null
  lastUpdated: string | null
  actionRequired: boolean
  xeroID: string | null
  sourceType: string | null
  assignedStaff: string | null
  emailAddress: string | null
}

type ColumnMetadata = {
  name: string
  displayName: string
  type: string
  choices?: string[]
}

function getMsalAccessTokenFromSessionStorage(): string | null {
  if (typeof window === "undefined") return null
  if (!window.sessionStorage) return null

  const nowSec = Math.floor(Date.now() / 1000)
  const candidates: Array<{ secret: string; expiresOn?: number }> = []

  for (let i = 0; i < sessionStorage.length; i++) {
    const key = sessionStorage.key(i)
    if (!key) continue
    if (!key.toLowerCase().startsWith("msal")) continue

    const value = sessionStorage.getItem(key)
    if (!value) continue
    if (value[0] !== "{") continue

    try {
      const obj = JSON.parse(value)
      if (obj?.credentialType !== "AccessToken") continue
      if (!obj?.secret || typeof obj.secret !== "string") continue

      const exp = obj.expiresOn ? Number(obj.expiresOn) : undefined
      candidates.push({ secret: obj.secret, expiresOn: Number.isFinite(exp) ? exp : undefined })
    } catch {
      // ignore
    }
  }

  if (!candidates.length) return null

  const valid = candidates.filter((c) => !c.expiresOn || c.expiresOn > nowSec + 60)
  if (valid.length) {
    valid.sort((a, b) => (b.expiresOn || 0) - (a.expiresOn || 0))
    return valid[0].secret
  }

  candidates.sort((a, b) => (b.expiresOn || 0) - (a.expiresOn || 0))
  return candidates[0].secret
}

function StatusPill({ status }: { status: WorkStatus }) {
  const cls =
    status === "active"
      ? "bg-blue-50 text-blue-700 border-blue-200"
      : status === "pending"
      ? "bg-orange-50 text-orange-700 border-orange-200"
      : "bg-green-50 text-green-700 border-green-200"

  const label = status === "active" ? "Active" : status === "pending" ? "Pending" : "Completed"
  return <span className={`inline-flex px-2 py-1 text-xs font-bold rounded-lg border ${cls}`}>{label}</span>
}

function WorkCard({ item, onClick }: { item: WorkItem; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      className="rounded-xl border border-gray-200 bg-white p-5 transition-all duration-200 hover:shadow-lg hover:border-blue-300 cursor-pointer group"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-3">
            <h3 className="text-base font-bold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
              {item.title}
            </h3>
            <StatusPill status={item.taskStatus} />
          </div>

          <div className="flex flex-wrap gap-2 text-xs font-medium text-gray-600 mb-3">
            {item.assignedStaff && (
              <span className="px-2 py-1 rounded-md bg-gray-100 border border-gray-200">
                Assigned: <span className="font-bold text-gray-800">{item.assignedStaff}</span>
              </span>
            )}
            {item.dueDate && (
              <span className="px-2 py-1 rounded-md bg-gray-100 border border-gray-200">
                Due: <span className="font-bold text-gray-800">{item.dueDate}</span>
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
            <div>Action Req: {item.actionRequired ? "Yes" : "No"}</div>
            <div>Xero ID: {item.xeroID || "N/A"}</div>
            <div>Source: {item.sourceType || "N/A"}</div>
            <div className="col-span-2">Email: {item.emailAddress || "N/A"}</div>
          </div>

          {item.description && (
            <p className="mt-3 text-sm text-gray-600 leading-relaxed line-clamp-2">{item.description}</p>
          )}
        </div>
      </div>

      {item.percentComplete !== null && (
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs font-bold text-gray-500 mb-2">
            <span>Progress</span>
            <span className="text-gray-800">{item.percentComplete}%</span>
          </div>
          <div className="h-2 rounded-full bg-gray-200 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-500"
              style={{ width: `${item.percentComplete}%` }}
            />
          </div>
        </div>
      )}
    </div>
  )
}

function DetailModal({
  item,
  onClose,
  onSave,
  columns
}: {
  item: WorkItem;
  onClose: () => void;
  onSave: (updated: WorkItem) => void;
  columns: ColumnMetadata[]
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedItem, setEditedItem] = useState<WorkItem>(item)
  const [isSaving, setIsSaving] = useState(false)

  const taskStatusChoices = columns.find(c => c.name === "TaskStatus")?.choices || ["Active", "Pending", "Completed"]
  const sourceTypeChoices = columns.find(c => c.name === "SourceType")?.choices || []

  const handleSave = async () => {
    setIsSaving(true)
    const token = getMsalAccessTokenFromSessionStorage()
    if (!token) {
      alert("Access token not found. Please login again.")
      setIsSaving(false)
      return
    }

    const fields: Record<string, any> = {
      Title: editedItem.title,
      Description: editedItem.description || null,
      TaskStatus: editedItem.taskStatus.charAt(0).toUpperCase() + editedItem.taskStatus.slice(1),
      DueDate: editedItem.dueDate || null,
      ActionRequired: editedItem.actionRequired,
      XeroID: editedItem.xeroID || null,
      SourceType: editedItem.sourceType || null,
      PercentComplete: editedItem.percentComplete ?? 0,
      Emailaddress: editedItem.emailAddress || null,
    }

    if (editedItem.assignedStaff) {
      fields.AssignedStaff = { claims: `i:0#.f|membership|${editedItem.assignedStaff}` }
    }

    const cleanedFields: Record<string, any> = {}
    for (const [key, value] of Object.entries(fields)) {
      if (value !== null && value !== undefined && (typeof value !== 'string' || value.trim() !== '')) {
        cleanedFields[key] = value
      }
    }

    try {
      const res = await fetch("/api/work-items", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id: editedItem.id, fields: cleanedFields }),
      })

      if (!res.ok) {
        const json = await res.json()
        throw new Error(json?.details || json?.error || "Failed to update")
      }

      const updatedFromApi = await res.json()
      const updatedLocal: WorkItem = {
        ...editedItem,
        title: updatedFromApi.fields?.Title || editedItem.title,
        description: updatedFromApi.fields?.Description || editedItem.description,
        percentComplete: Number(updatedFromApi.fields?.PercentComplete) || editedItem.percentComplete,
      }
      onSave(updatedLocal)
      setIsEditing(false)
    } catch (e: any) {
      alert(`Failed to save: ${e.message}`)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      <div
        className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">Work Item Details</h2>
          <div className="flex items-center gap-2">
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="p-2 rounded-lg bg-white/20 hover:bg-white/30 text-white transition-all"
              >
                <Edit2 className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white text-blue-600 hover:bg-blue-50 font-bold transition-all disabled:opacity-50"
              >
                {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {isSaving ? "Saving..." : "Save"}
              </button>
            )}
            <button onClick={onClose} className="p-2 rounded-lg bg-white/20 hover:bg-white/30 text-white transition-all">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Title</label>
            {isEditing ? (
              <input
                type="text"
                value={editedItem.title}
                onChange={(e) => setEditedItem({ ...editedItem, title: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
              />
            ) : (
              <div className="px-4 py-2 rounded-lg bg-gray-50 border border-gray-200 font-medium text-gray-900">
                {editedItem.title || <span className="text-gray-400">N/A</span>}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Task Status</label>
              {isEditing ? (
                <select
                  value={editedItem.taskStatus}
                  onChange={(e) => setEditedItem({ ...editedItem, taskStatus: e.target.value as WorkStatus })}
                  className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                >
                  {taskStatusChoices.map(choice => (
                    <option key={choice} value={choice.toLowerCase()}>{choice}</option>
                  ))}
                </select>
              ) : (
                <div className="px-4 py-2 rounded-lg bg-gray-50 border border-gray-200">
                  <StatusPill status={editedItem.taskStatus} />
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Action Required</label>
              {isEditing ? (
                <select
                  value={editedItem.actionRequired ? "true" : "false"}
                  onChange={(e) => setEditedItem({ ...editedItem, actionRequired: e.target.value === "true" })}
                  className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                >
                  <option value="false">No</option>
                  <option value="true">Yes</option>
                </select>
              ) : (
                <div className="px-4 py-2 rounded-lg bg-gray-50 border border-gray-200 font-medium">
                  {editedItem.actionRequired ? "Yes" : "No"}
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Due Date</label>
              {isEditing ? (
                <input
                  type="date"
                  value={editedItem.dueDate || ""}
                  onChange={(e) => setEditedItem({ ...editedItem, dueDate: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                />
              ) : (
                <div className="px-4 py-2 rounded-lg bg-gray-50 border border-gray-200 font-medium">
                  {editedItem.dueDate || <span className="text-gray-400">N/A</span>}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Source Type</label>
              {isEditing ? (
                <select
                  value={editedItem.sourceType || ""}
                  onChange={(e) => setEditedItem({ ...editedItem, sourceType: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                >
                  <option value="">Select...</option>
                  {sourceTypeChoices.map(choice => (
                    <option key={choice} value={choice}>{choice}</option>
                  ))}
                </select>
              ) : (
                <div className="px-4 py-2 rounded-lg bg-gray-50 border border-gray-200 font-medium">
                  {editedItem.sourceType || <span className="text-gray-400">N/A</span>}
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Percent Complete (%)</label>
              {isEditing ? (
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  value={editedItem.percentComplete ?? ""}
                  onChange={(e) => setEditedItem({ ...editedItem, percentComplete: Number(e.target.value) || null })}
                  className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                  placeholder="0-100"
                />
              ) : (
                <div className="px-4 py-2 rounded-lg bg-gray-50 border border-gray-200 font-medium">
                  {editedItem.percentComplete !== null ? `${editedItem.percentComplete}%` : "N/A"}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Email Address</label>
              {isEditing ? (
                <input
                  type="email"
                  value={editedItem.emailAddress || ""}
                  onChange={(e) => setEditedItem({ ...editedItem, emailAddress: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                />
              ) : (
                <div className="px-4 py-2 rounded-lg bg-gray-50 border border-gray-200 font-medium">
                  {editedItem.emailAddress || <span className="text-gray-400">N/A</span>}
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Xero ID</label>
              {isEditing ? (
                <input
                  type="text"
                  value={editedItem.xeroID || ""}
                  onChange={(e) => setEditedItem({ ...editedItem, xeroID: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                />
              ) : (
                <div className="px-4 py-2 rounded-lg bg-gray-50 border border-gray-200 font-medium">
                  {editedItem.xeroID || <span className="text-gray-400">N/A</span>}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function AddTaskModal({
  onClose,
  onAdd,
  columns
}: {
  onClose: () => void;
  onAdd: (newItem: WorkItem) => void;
  columns: ColumnMetadata[]
}) {
  const [newItem, setNewItem] = useState<Omit<WorkItem, "id">>({
    title: "",
    description: null,
    taskStatus: "active",
    dueDate: null,
    percentComplete: 0,
    lastUpdated: null,
    actionRequired: false,
    xeroID: null,
    sourceType: null,
    assignedStaff: null,
    emailAddress: null,
  })
  const [isAdding, setIsAdding] = useState(false)

  const taskStatusChoices = columns.find(c => c.name === "TaskStatus")?.choices || ["Active", "Pending", "Completed"]
  const sourceTypeChoices = columns.find(c => c.name === "SourceType")?.choices || []

  const handleAdd = async () => {
    if (!newItem.title.trim()) {
      alert("Please enter a title")
      return
    }

    setIsAdding(true)
    const token = getMsalAccessTokenFromSessionStorage()
    if (!token) {
      alert("Access token not found. Please login again.")
      setIsAdding(false)
      return
    }

    const fields: Record<string, any> = {
      Title: newItem.title,
      TaskStatus: newItem.taskStatus.charAt(0).toUpperCase() + newItem.taskStatus.slice(1),
      DueDate: newItem.dueDate || null,
      ActionRequired: newItem.actionRequired,
      XeroID: newItem.xeroID || null,
      SourceType: newItem.sourceType || null,
      PercentComplete: newItem.percentComplete ?? 0,
      Emailaddress: newItem.emailAddress || null,
    }

    if (newItem.assignedStaff) {
      fields.AssignedStaff = { claims: `i:0#.f|membership|${newItem.assignedStaff}` }
    }

    const cleanedFields: Record<string, any> = {}
    for (const [key, value] of Object.entries(fields)) {
      if (value !== null && value !== undefined && (typeof value !== 'string' || value.trim() !== '')) {
        cleanedFields[key] = value
      }
    }

    try {
      const res = await fetch("/api/work-items", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ fields: cleanedFields }),
      })

      if (!res.ok) {
        const json = await res.json()
        throw new Error(json?.details || json?.error || "Failed to create")
      }

      const created = await res.json()
      const newLocalItem: WorkItem = {
        id: created.id,
        title: created.fields?.Title || newItem.title,
        description: null,
        taskStatus: (created.fields?.TaskStatus?.toLowerCase() || newItem.taskStatus) as WorkStatus,
        dueDate: created.fields?.DueDate || newItem.dueDate,
        percentComplete: Number(created.fields?.PercentComplete) || newItem.percentComplete,
        lastUpdated: created.fields?.LastUpdated || newItem.lastUpdated,
        actionRequired: created.fields?.ActionRequired ?? newItem.actionRequired,
        xeroID: created.fields?.XeroID || newItem.xeroID,
        sourceType: created.fields?.SourceType || newItem.sourceType,
        assignedStaff: created.fields?.AssignedStaff?.Email || newItem.assignedStaff,
        emailAddress: created.fields?.Emailaddress || newItem.emailAddress,
      }
      onAdd(newLocalItem)
      onClose()
    } catch (e: any) {
      alert(`Failed to add: ${e.message}`)
    } finally {
      setIsAdding(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      <div
        className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">Add New Task</h2>
          <button onClick={onClose} className="p-2 rounded-lg bg-white/20 hover:bg-white/30 text-white transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Title *</label>
            <input
              type="text"
              value={newItem.title}
              onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
              className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-100 outline-none transition-all"
              placeholder="Enter task title..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Task Status</label>
              <select
                value={newItem.taskStatus}
                onChange={(e) => setNewItem({ ...newItem, taskStatus: e.target.value as WorkStatus })}
                className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-100 outline-none transition-all"
              >
                {taskStatusChoices.map(choice => (
                  <option key={choice} value={choice.toLowerCase()}>{choice}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Action Required</label>
              <select
                value={newItem.actionRequired ? "true" : "false"}
                onChange={(e) => setNewItem({ ...newItem, actionRequired: e.target.value === "true" })}
                className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-100 outline-none transition-all"
              >
                <option value="false">No</option>
                <option value="true">Yes</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Due Date</label>
              <input
                type="date"
                value={newItem.dueDate || ""}
                onChange={(e) => setNewItem({ ...newItem, dueDate: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-100 outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Source Type</label>
              <select
                value={newItem.sourceType || ""}
                onChange={(e) => setNewItem({ ...newItem, sourceType: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-100 outline-none transition-all"
              >
                <option value="">Select...</option>
                {sourceTypeChoices.map(choice => (
                  <option key={choice} value={choice}>{choice}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Percent Complete (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                step="1"
                value={newItem.percentComplete ?? ""}
                onChange={(e) => setNewItem({ ...newItem, percentComplete: Number(e.target.value) || 0 })}
                className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-100 outline-none transition-all"
                placeholder="0-100"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Email Address</label>
              <input
                type="email"
                value={newItem.emailAddress || ""}
                onChange={(e) => setNewItem({ ...newItem, emailAddress: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-100 outline-none transition-all"
                placeholder="email@example.com"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Xero ID</label>
              <input
                type="text"
                value={newItem.xeroID || ""}
                onChange={(e) => setNewItem({ ...newItem, xeroID: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-100 outline-none transition-all"
                placeholder="Enter Xero ID..."
              />
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 rounded-lg border-2 border-gray-200 font-bold text-gray-700 hover:bg-gray-100 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleAdd}
            disabled={isAdding}
            className="flex-1 px-4 py-3 rounded-lg bg-gradient-to-r from-green-600 to-green-700 font-bold text-white hover:from-green-700 hover:to-green-800 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isAdding ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Adding...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                Add Task
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function WorkPage() {
  const [activeTab, setActiveTab] = useState<WorkStatus>("active")
  const [items, setItems] = useState<WorkItem[]>([])
  const [columns, setColumns] = useState<ColumnMetadata[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>("")
  const [selectedItem, setSelectedItem] = useState<WorkItem | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)

  const loadData = async () => {
    setLoading(true)
    setError("")

    const token = getMsalAccessTokenFromSessionStorage()
    if (!token) {
      setLoading(false)
      setError("MSAL access token not found. Please login again.")
      return
    }

    try {
      const res = await fetch("/api/work-items?include=columns", {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      })

      if (!res.ok) {
        const json = await res.json()
        throw new Error(json?.details || json?.error || "Failed to load")
      }

      const json = await res.json()

      if (json.columns) {
        const parsedColumns: ColumnMetadata[] = json.columns.map((col: any) => ({
          name: col.name,
          displayName: col.displayName || col.name,
          type: col.columnGroup || col.type || "text",
          choices: col.choice?.choices || []
        }))
        setColumns(parsedColumns)
      }

      const mappedItems = (json.items || []).map((item: any) => ({
        id: item.id || String(Math.random()),
        title: item.title || "",
        description: item.description || null,
        taskStatus: item.status || "active",
        dueDate: item.dueDate || null,
        percentComplete: Number(item.rawFields?.PercentComplete) || null,
        lastUpdated: item.rawFields?.LastUpdated || null,
        actionRequired: item.rawFields?.ActionRequired ?? false,
        xeroID: item.rawFields?.XeroID || null,
        sourceType: item.rawFields?.SourceType || null,
        assignedStaff: item.assignedTo || null,
        emailAddress: item.rawFields?.Emailaddress || null,
      }))

      setItems(mappedItems)
    } catch (e: any) {
      setError(e?.message || "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const stats = useMemo(() => {
    return {
      active: items.filter((i) => i.taskStatus === "active").length,
      pending: items.filter((i) => i.taskStatus === "pending").length,
      completed: items.filter((i) => i.taskStatus === "completed").length,
    }
  }, [items])

  const filteredItems = useMemo(() => items.filter((i) => i.taskStatus === activeTab), [items, activeTab])

  const handleSaveItem = (updated: WorkItem) => {
    setItems(prev => prev.map(item => item.id === updated.id ? updated : item))
    setSelectedItem(updated)
    loadData()
  }

  const handleAddItem = (newItem: WorkItem) => {
    setItems(prev => [newItem, ...prev])
    loadData()
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Work In Progress</h1>
              <p className="text-gray-600 text-lg">SharePoint tasks from your list</p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={loadData}
                className="flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-gray-50 text-gray-800 rounded-lg font-bold transition-all border border-gray-200 shadow-sm hover:shadow-md"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                Refresh
              </button>

              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-lg font-bold transition-all shadow-md hover:shadow-lg"
              >
                <Plus className="w-4 h-4" />
                Add Task
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-2 flex gap-2 shadow-sm">
            <button
              onClick={() => setActiveTab("active")}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 font-bold rounded-lg transition-all ${activeTab === "active" ? "bg-blue-500 text-white shadow-md" : "text-gray-600 hover:bg-gray-100"}`}
            >
              <Clock className="w-4 h-4" />
              Active
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${activeTab === "active" ? "bg-white/20" : "bg-gray-200"}`}>
                {stats.active}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("pending")}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 font-bold rounded-lg transition-all ${activeTab === "pending" ? "bg-orange-500 text-white shadow-md" : "text-gray-600 hover:bg-gray-100"}`}
            >
              <AlertCircle className="w-4 h-4" />
              Pending
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${activeTab === "pending" ? "bg-white/20" : "bg-gray-200"}`}>
                {stats.pending}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("completed")}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 font-bold rounded-lg transition-all ${activeTab === "completed" ? "bg-green-600 text-white shadow-md" : "text-gray-600 hover:bg-gray-100"}`}
            >
              <CheckCircle2 className="w-4 h-4" />
              Completed
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${activeTab === "completed" ? "bg-white/20" : "bg-gray-200"}`}>
                {stats.completed}
              </span>
            </button>
          </div>

          {loading ? (
            <div className="rounded-xl border border-gray-200 bg-white p-12 text-center">
              <div className="flex items-center justify-center mb-4">
                <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
              </div>
              <div className="text-gray-800 font-bold text-lg">Loading work items...</div>
              <div className="text-gray-500 text-sm mt-2">Fetching data from SharePoint</div>
            </div>
          ) : error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-12 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-red-500" />
              </div>
              <div className="text-red-700 font-bold text-lg">Could not load data</div>
              <div className="text-red-600 text-sm mt-2 max-w-md mx-auto">{error}</div>
              <button
                onClick={loadData}
                className="mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-white border-2 border-red-200 font-bold text-red-700 hover:bg-red-50 transition-all shadow-sm"
              >
                <RefreshCw className="w-4 h-4" />
                Try Again
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredItems.map((item) => (
                <WorkCard key={item.id} item={item} onClick={() => setSelectedItem(item)} />
              ))}

              {filteredItems.length === 0 && (
                <div className="rounded-xl border border-gray-200 bg-white p-12 text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="w-8 h-8 text-gray-500" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">No {activeTab} items</h3>
                  <p className="text-gray-600 mb-6">You don't have any {activeTab} work items right now.</p>
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-r from-green-600 to-green-700 text-white font-bold hover:from-green-700 hover:to-green-800 transition-all shadow-md"
                  >
                    <Plus className="w-4 h-4" />
                    Add Your First Task
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {selectedItem && (
          <DetailModal
            item={selectedItem}
            onClose={() => setSelectedItem(null)}
            onSave={handleSaveItem}
            columns={columns}
          />
        )}

        {showAddModal && (
          <AddTaskModal
            onClose={() => setShowAddModal(false)}
            onAdd={handleAddItem}
            columns={columns}
          />
        )}
      </div>
    </DashboardLayout>
  )
}