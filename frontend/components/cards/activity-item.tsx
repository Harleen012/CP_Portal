import { FileText, MessageCircle, CheckCircle, DollarSign } from "lucide-react"

interface Activity {
  id: string
  type: "document" | "message" | "payment" | "update"
  title: string
  description: string
  time: string
}

interface ActivityItemProps {
  activity: Activity
}

export function ActivityItem({ activity }: ActivityItemProps) {
  const getIcon = () => {
    switch (activity.type) {
      case "document":
        return <FileText className="w-5 h-5" />
      case "message":
        return <MessageCircle className="w-5 h-5" />
      case "payment":
        return <DollarSign className="w-5 h-5" />
      case "update":
        return <CheckCircle className="w-5 h-5" />
      default:
        return <FileText className="w-5 h-5" />
    }
  }

  const getIconColor = () => {
    switch (activity.type) {
      case "document":
        return "bg-blue-50 text-blue-600 border-blue-100"
      case "message":
        return "bg-[#E3F2FD] text-[#137FEC] border-[#90CAF9]"
      case "payment":
        return "bg-orange-50 text-orange-600 border-orange-100"
      case "update":
        return "bg-purple-50 text-purple-600 border-purple-100"
      default:
        return "bg-secondary text-muted-foreground border-border"
    }
  }

  return (
    <div className="flex items-start gap-4 p-4 hover:bg-secondary/50 transition-all duration-200 cursor-pointer group">
      <div
        className={`w-11 h-11 rounded-xl ${getIconColor()} border flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform shadow-sm`}
      >
        {getIcon()}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">
          {activity.title}
        </h4>
        <p className="text-sm text-muted-foreground leading-relaxed">{activity.description}</p>
      </div>
      <span className="text-xs text-muted-foreground whitespace-nowrap font-medium px-2.5 py-1 bg-secondary rounded-lg">
        {activity.time}
      </span>
    </div>
  )
}
