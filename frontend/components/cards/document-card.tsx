import { FileText, AlertCircle, Download } from "lucide-react"

interface Document {
  id: string
  title: string
  type: "uploaded" | "requested"
  actionRequired?: boolean
  date: string
  size?: string
}

interface DocumentCardProps {
  document: Document
}


export function DocumentCard({ document }: DocumentCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start gap-4">
        <div
          className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
            document.actionRequired ? "bg-[#FEE2E2] text-[#EF4444]" : "bg-[#EBF2FE] text-[#2563EB]"
          }`}
        >
          {document.actionRequired ? <AlertCircle className="w-6 h-6" /> : <FileText className="w-6 h-6" />}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-semibold text-[#0F172A] mb-1">{document.title}</h3>
              <div className="flex items-center gap-3 text-sm text-[#64748B]">
                <span>{document.date}</span>
                {document.size && <span>{document.size}</span>}
              </div>
            </div>
            <button className="p-2 hover:bg-gray-50 rounded-lg">
              <Download className="w-5 h-5 text-[#64748B]" />
            </button>
          </div>
          {document.actionRequired && (
            <div className="mt-2 px-3 py-1 bg-[#FEE2E2] text-[#EF4444] rounded-lg text-sm font-medium inline-block">
              Action Required
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
