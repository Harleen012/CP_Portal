// "use client"

// import { useRouter } from "next/navigation"
// import { DashboardLayout } from "@/components/layouts/dashboard-layout"
// import { ActivityItem } from "@/components/cards/activity-item"
// import { ArrowLeft } from "lucide-react"
// import { mockActivities } from "@/data/mock-data"

// const allActivities = [
//   ...mockActivities,
//   {
//     id: "6",
//     type: "update" as const,
//     title: "Account Statement Ready",
//     description: "Your February statement is available",
//     time: "4d ago",
//   },
//   {
//     id: "7",
//     type: "message" as const,
//     title: "Meeting Scheduled",
//     description: "Tax planning consultation set for next week",
//     time: "5d ago",
//   },
//   {
//     id: "8",
//     type: "document" as const,
//     title: "Document Approved",
//     description: "Business expense report reviewed",
//     time: "6d ago",
//   },
//   {
//     id: "9",
//     type: "payment" as const,
//     title: "Payment Received",
//     description: "Thank you for your payment",
//     time: "1w ago",
//   },
//   {
//     id: "10",
//     type: "update" as const,
//     title: "Profile Updated",
//     description: "Your contact information has been updated",
//     time: "1w ago",
//   },
//   {
//     id: "11",
//     type: "document" as const,
//     title: "Tax Documents Finalized",
//     description: "2023 tax return completed and filed",
//     time: "2w ago",
//   },
//   {
//     id: "12",
//     type: "message" as const,
//     title: "Welcome Message",
//     description: "Welcome to your new client portal",
//     time: "3w ago",
//   },
// ]

// export default function ActivitiesPage() {
//   const router = useRouter()

//   return (
//     <DashboardLayout>
//       <div className="space-y-6 animate-fade-in">
//         <div className="flex items-center gap-4">
//           <button
//             onClick={() => router.push("/dashboard")}
//             className="flex items-center gap-2 px-4 py-2.5 bg-[#E3F2FD] hover:bg-[#BBDEFB] text-[#0D47A1] rounded-xl font-medium transition-all hover-lift"
//           >
//             <ArrowLeft className="w-4 h-4" />
//             View Less
//           </button>
//           <div>
//             <h1 className="text-3xl md:text-4xl font-bold text-foreground text-balance">All Activities</h1>
//             <p className="text-muted-foreground">Complete history of your account activities</p>
//           </div>
//         </div>

//         <div className="glass-card rounded-xl border border-border divide-y divide-border overflow-hidden">
//           {allActivities.map((activity, index) => (
//             <div key={activity.id} style={{ animationDelay: `${index * 50}ms` }} className="animate-fade-in">
//               <ActivityItem activity={activity} />
//             </div>
//           ))}
//         </div>
//       </div>
//     </DashboardLayout>
//   )
// }




// "use client"

// import { useRouter } from "next/navigation"
// import { DashboardLayout } from "@/components/layouts/dashboard-layout"
// import { ActivityItem } from "@/components/cards/activity-item"
// import { ArrowLeft } from "lucide-react"
// import { mockActivities } from "@/data/mock-data"

// const allActivities = [
//   ...mockActivities,
//   {
//     id: "6",
//     type: "update" as const,
//     title: "Account Statement Ready",
//     description: "Your February statement is available",
//     time: "4d ago",
//   },
//   {
//     id: "7",
//     type: "message" as const,
//     title: "Meeting Scheduled",
//     description: "Tax planning consultation set for next week",
//     time: "5d ago",
//   },
//   {
//     id: "8",
//     type: "document" as const,
//     title: "Document Approved",
//     description: "Business expense report reviewed",
//     time: "6d ago",
//   },
//   {
//     id: "9",
//     type: "payment" as const,
//     title: "Payment Received",
//     description: "Thank you for your payment",
//     time: "1w ago",
//   },
//   {
//     id: "10",
//     type: "update" as const,
//     title: "Profile Updated",
//     description: "Your contact information has been updated",
//     time: "1w ago",
//   },
//   {
//     id: "11",
//     type: "document" as const,
//     title: "Tax Documents Finalized",
//     description: "2023 tax return completed and filed",
//     time: "2w ago",
//   },
//   {
//     id: "12",
//     type: "message" as const,
//     title: "Welcome Message",
//     description: "Welcome to your new client portal",
//     time: "3w ago",
//   },
// ]

// export default function ActivitiesPage() {
//   const router = useRouter()

//   return (
//     <DashboardLayout>
//       <div className="space-y-6 animate-fade-in">
//         <div className="flex items-center gap-4">
//           <button
//             onClick={() => router.push("/dashboard")}
//             className="flex items-center gap-2 px-4 py-2.5 bg-[#E3F2FD] hover:bg-[#BBDEFB] text-[#0D47A1] rounded-xl font-medium transition-all hover-lift"
//           >
//             <ArrowLeft className="w-4 h-4" />
//             View Less
//           </button>
//           <div>
//             <h1 className="text-3xl md:text-4xl font-bold text-foreground text-balance">All Activities</h1>
//             <p className="text-muted-foreground">Complete history of your account activities</p>
//           </div>
//         </div>

//         <div className="glass-card rounded-xl border border-border divide-y divide-border overflow-hidden">
//           {allActivities.map((activity, index) => (
//             <div key={activity.id} style={{ animationDelay: `${index * 50}ms` }} className="animate-fade-in">
//               <ActivityItem activity={activity} />
//             </div>
//           ))}
//         </div>
//       </div>
//     </DashboardLayout>
//   )
// }










// *****************************************************************************************************




// My Code Version 1 ###############################################################


"use client"

import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/layouts/dashboard-layout"
import { ActivityItem } from "@/components/cards/activity-item"
import { ArrowLeft } from "lucide-react"
import { mockActivities } from "@/data/mock-data"

// Combine static system notifications with your mock data
const allActivities = [
  ...mockActivities,
  {
    id: "tx-101",
    type: "payment",
    title: "Gateway Motors",
    description: "Payment - INV-2024-001",
    time: "Today",
  },
  {
    id: "tx-102",
    type: "payment",
    title: "Adobe Creative Cloud",
    description: "Subscription Payment",
    time: "Yesterday",
  },
  {
    id: "sys-1",
    type: "update",
    title: "Account Statement Ready",
    description: "Your February statement is available",
    time: "4d ago",
  }
]

export default function ActivitiesPage() {
  const router = useRouter()

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-in fade-in duration-500">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/dashboard")}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl font-medium transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Activity Log</h1>
            <p className="text-gray-500">Recent transactions and system updates</p>
          </div>
        </div>

        {/* List */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200 divide-y divide-gray-100 overflow-hidden shadow-sm">
          {allActivities.map((activity: any, index: number) => (
            <div key={activity.id} style={{ animationDelay: `${index * 50}ms` }} className="animate-in slide-in-from-bottom-2 duration-500">
              <ActivityItem activity={activity} />
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  )
}
