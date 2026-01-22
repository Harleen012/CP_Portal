import { AlertCircle, Clock, Calendar } from "lucide-react"

interface WorkItem {
  id: string
  title: string
  progress: number
  status: "active" | "pending" | "completed"
  dueDate?: string
  actionRequired?: boolean
}

interface WorkInProgressCardProps {
  item: WorkItem
  showDetails?: boolean
}

export function WorkInProgressCard({ item, showDetails }: WorkInProgressCardProps) {
  const getStatusColor = () => {
    switch (item.status) {
      case "active":
        return "bg-gradient-to-r from-[#137FEC] to-[#1976D2]"
      case "pending":
        return "bg-gradient-to-r from-orange-500 to-orange-600"
      case "completed":
        return "bg-gradient-to-r from-slate-400 to-slate-500"
      default:
        return "bg-gradient-to-r from-slate-400 to-slate-500"
    }
  }

  const getStatusBadge = () => {
    switch (item.status) {
      case "active":
        return "bg-[#E3F2FD] text-[#0D47A1] border-[#90CAF9]"
      case "pending":
        return "bg-orange-50 text-orange-700 border-orange-200"
      case "completed":
        return "bg-slate-50 text-slate-700 border-slate-200"
      default:
        return "bg-slate-50 text-slate-700 border-slate-200"
    }
  }

  return (
    <div className="glass-card rounded-xl border border-border p-5 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 cursor-pointer group">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="font-semibold text-foreground text-lg group-hover:text-primary transition-colors">
              {item.title}
            </h3>
            {item.actionRequired && (
              <div className="flex items-center gap-1 px-2 py-1 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="w-3.5 h-3.5 text-red-600" />
                <span className="text-xs font-medium text-red-600">Action Required</span>
              </div>
            )}
          </div>
          {showDetails && item.dueDate && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="w-4 h-4" />
              <span>Due: {item.dueDate}</span>
            </div>
          )}
        </div>
        <div className="flex flex-col items-end gap-2">
          <span className="text-lg font-bold text-primary">{item.progress}%</span>
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border capitalize ${getStatusBadge()}`}>
            {item.status}
          </span>
        </div>
      </div>

      <div className="space-y-2">
        <div className="relative w-full h-2.5 bg-secondary rounded-full overflow-hidden">
          <div
            className={`absolute inset-y-0 left-0 ${getStatusColor()} rounded-full transition-all duration-500 shadow-sm`}
            style={{ width: `${item.progress}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            <span>Updated 2h ago</span>
          </div>
          <span>{item.progress === 100 ? "Complete" : `${100 - item.progress}% remaining`}</span>
        </div>
      </div>
    </div>
  )
}
