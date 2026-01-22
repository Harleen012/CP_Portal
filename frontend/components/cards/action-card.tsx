import type { ReactNode } from "react"
import { ArrowRight } from "lucide-react"

interface ActionCardProps {
  icon: ReactNode
  title: string
  description: string
  color: "blue" | "green" | "orange"
}

export function ActionCard({ icon, title, description, color }: ActionCardProps) {
  const colorClasses = {
    blue: "bg-blue-50 text-blue-600 group-hover:bg-blue-100",
    green: "bg-[#E3F2FD] text-[#137FEC] group-hover:bg-[#BBDEFB]",
    orange: "bg-orange-50 text-orange-600 group-hover:bg-orange-100",
  }

  const borderClasses = {
    blue: "border-blue-100 group-hover:border-blue-200",
    green: "border-[#90CAF9] group-hover:border-[#64B5F6]",
    orange: "border-orange-100 group-hover:border-orange-200",
  }

  const shadowClasses = {
    blue: "group-hover:shadow-blue-100",
    green: "group-hover:shadow-[#BBDEFB]",
    orange: "group-hover:shadow-orange-100",
  }

  return (
    <button
      className={`group glass-card rounded-xl border ${borderClasses[color]} p-6 hover:shadow-lg ${shadowClasses[color]} transition-all duration-300 text-left w-full hover:-translate-y-1`}
    >
      <div
        className={`w-14 h-14 rounded-xl ${colorClasses[color]} flex items-center justify-center mb-4 transition-all duration-300 group-hover:scale-110 shadow-sm`}
      >
        {icon}
      </div>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-foreground mb-1.5 group-hover:text-primary transition-colors">{title}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all opacity-0 group-hover:opacity-100" />
      </div>
    </button>
  )
}
