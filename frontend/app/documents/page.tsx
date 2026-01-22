"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/layouts/dashboard-layout"
import { getMsalAccessTokenFromSessionStorage } from "@/lib/msalToken"
import { trackActivity } from "@/lib/activityStore"
import {
  ArrowLeft,
  UploadCloud,
  Folder,
  FileText,
  RefreshCw,
  Upload,
  X,
  CheckCircle,
  Grid,
  List,
  Sparkles,
  FolderOpen,
  AlertTriangle,
  AlertCircle,
  Info,
  ChevronDown,
  ChevronUp
} from "lucide-react"
import { Button } from "@/components/ui/button"

type Library = { id: string; name?: string; webUrl?: string }
type Document = { id: string; name: string; webUrl?: string; folder?: boolean }

type ValidationResponse = {
  document_type?: string
  status: "CLEAR" | "NEEDS_ATTENTION"
  issues?: {
    missing_fields?: string[] 
    invalid_fields?: string[] 
    risks?: string[] 
  }
  message?: string
}

export default function UploadPage() {
  const router = useRouter()

  const [mounted, setMounted] = useState(false)
  const [token, setToken] = useState<string | null>(null)
  const [libraries, setLibraries] = useState<Library[]>([])
  const [viewLibraryName, setViewLibraryName] = useState<string>("")
  const [uploadLibraryName, setUploadLibraryName] = useState<string>("")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [viewMode, setViewMode] = useState<"grid" | "list">("list")

  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingDocs, setLoadingDocs] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState("")
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")

  const [validating, setValidating] = useState(false)
  const [validationResponse, setValidationResponse] = useState<ValidationResponse | null>(null)
  const [validationError, setValidationError] = useState<string>("")

  const [validatingDocId, setValidatingDocId] = useState<string | null>(null)
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null)
  const [showMissingFields, setShowMissingFields] = useState(true)
  const [showInvalidFields, setShowInvalidFields] = useState(true)
  const [showRisks, setShowRisks] = useState(true)
  const [showValidationModal, setShowValidationModal] = useState(false)

  
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setMounted(true)
    const msalToken = getMsalAccessTokenFromSessionStorage()
    setToken(msalToken)
  }, [])

  const loadLibraries = async () => {
    if (!token) return

    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/sharepoint/libraries", {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.details || json?.error || "Failed to load libraries")

      const libs: Library[] = json.libraries || []
      setLibraries(libs)

      const firstName = libs[0]?.name || ""
      setViewLibraryName((prev) => prev || firstName)
      setUploadLibraryName((prev) => prev || firstName)
    } catch (e: any) {
      setError(e?.message || "Failed to load libraries")
    } finally {
      setLoading(false)
    }
  }

  const loadDocuments = async (libraryName: string) => {
    if (!libraryName || !token) return

    setLoadingDocs(true)
    setError("")
    try {
      const res = await fetch(`/api/sharepoint/documents?libraryName=${encodeURIComponent(libraryName)}`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.details || json?.error || "Failed to load documents")

      setDocuments(json.documents || [])
    } catch (e: any) {
      setError(e?.message || "Failed to load documents")
      setDocuments([])
    } finally {
      setLoadingDocs(false)
    }
  }

  useEffect(() => {
    if (mounted && token) {
      loadLibraries()
    }
  }, [mounted, token])

  useEffect(() => {
    if (mounted && token && viewLibraryName) {
      loadDocuments(viewLibraryName)
    }
  }, [mounted, token, viewLibraryName])

  const validateDocument = async (input: File | Document) => {
    setValidating(true)
    setValidationResponse(null)
    setValidationError("")
  
    try {
      let res;
      if (input instanceof File) {
        const form = new FormData()
        form.append("file", input)
  
        res = await fetch("/api/validate-document", {
          method: "POST",
          body: form,
        })
      } else {
        res = await fetch("/api/validate-document", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({documentId: input.id,accessToken: token}),
          // body: JSON.stringify({ documentId: input.id }),
        })
      }
  
      const json = await res.json()
  
      if (!res.ok) {
        setValidationError(json?.detail || "Validation server error. Please ensure the validation service is running on port 8080.")
        return
      }
  
      setValidationResponse(json)
    } catch (err: any) {
      setValidationError("Cannot connect to validation server. Please ensure the validation service is running on port 8080.")
    } finally {
      setValidating(false)
    }
  }

  useEffect(() => {
    if (selectedFile) {
      validateDocument(selectedFile)
    } else {
      setValidationResponse(null)
      setValidationError("")
    }
  }, [selectedFile])

  const handleValidateExisting = (doc: Document) => {
    if (doc.folder) return; // Skip folders
    setSelectedDocument(doc)
    validateDocument(doc)
    setShowValidationModal(true)
    setShowMissingFields(true)
    setShowInvalidFields(true)
    setShowRisks(true)
  }

  const canUpload = () => {
    if (!selectedFile || !uploadLibraryName || uploading || validating) {
      return false
    }
    if (validationError) return false
    if (validationResponse) {
      return validationResponse.status === "CLEAR"
    }
    return false
  }

  const onUpload = async () => {
    if (!canUpload()) return

    setUploading(true)
    setError("")
    try {
      const form = new FormData()
      form.append("uploadLibraryName", uploadLibraryName)
      form.append("file", selectedFile!)

      const res = await fetch("/api/sharepoint/upload", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.details || json?.error || "Upload failed")

      trackActivity({
        type: "UPLOAD",
        title: "Document uploaded",
        description: `Uploaded "${selectedFile!.name}" to library "${uploadLibraryName}"`,
      })

      setSuccessMessage(`Successfully uploaded "${selectedFile!.name}" to "${uploadLibraryName}" library!`)
      setShowUploadModal(false)
      setSelectedFile(null)
      setValidationResponse(null)
      setValidationError("")

      if (viewLibraryName === uploadLibraryName) {
        await loadDocuments(viewLibraryName)
      }

      setTimeout(() => setSuccessMessage(""), 5000)
    } catch (e: any) {
      setError(e?.message || "Upload failed")
    } finally {
      setUploading(false)
    }
  }

  const handleBack = () => {
    if (mounted) {
      router.back()
    }
  }

  const resetUploadModal = () => {
    setShowUploadModal(false)
    setSelectedFile(null)
    setValidationResponse(null)
    setValidationError("")
    setError("")
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const resetValidationModal = () => {
    setShowValidationModal(false)
    setSelectedDocument(null)
    setValidationResponse(null)
    setValidationError("")
    setError("")
  }

  if (!mounted) {
    return (
      <DashboardLayout>
        <div className="space-y-8">
          <div className="glass-card rounded-xl border border-border p-12 text-center">
            <RefreshCw className="w-8 h-8 text-primary animate-spin mx-auto mb-3" />
            <div className="text-muted-foreground font-semibold">Loading...</div>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  const hasValidationIssues = validationResponse && validationResponse.status === "NEEDS_ATTENTION"
  const hasMissingFields = validationResponse?.issues?.missing_fields && validationResponse.issues.missing_fields.length > 0
  const hasInvalidFields = validationResponse?.issues?.invalid_fields && validationResponse.issues.invalid_fields.length > 0
  const hasRisks = validationResponse?.issues?.risks && validationResponse.issues.risks.length > 0

  return (
    <DashboardLayout>
      <div className="min-h-[calc(100vh-64px)] bg-gradient-to-br from-violet-50 via-pink-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6 animate-fade-in">
          
          <div className="relative rounded-3xl overflow-hidden glass-card border border-border shadow-xl p-4 sm:p-8">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 opacity-90" />
            <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl" />

            <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl md:text-4xl font-extrabold text-white">Document Library</h1>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={handleBack}
                  variant="outline"
                  size="sm"
                  className="rounded-xl border-white/30 bg-white/10 backdrop-blur hover:bg-white/20 text-white font-semibold"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                <Button
                  onClick={loadLibraries}
                  variant="outline"
                  size="sm"
                  className="rounded-xl border-white/30 bg-white/10 backdrop-blur hover:bg-white/20 text-white font-semibold"
                  disabled={loading || !token}
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                  Refresh
                </Button>
                <Button
                  onClick={() => setShowUploadModal(true)}
                  size="sm"
                  className="rounded-xl bg-white hover:bg-white/90 text-indigo-600 shadow-xl font-bold"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Document
                </Button>
              </div>
            </div>
          </div>

          {successMessage && (
            <div className="glass-card rounded-2xl p-5 flex items-start gap-3 animate-fade-in border-2 border-emerald-300 bg-gradient-to-r from-emerald-50 to-teal-50 shadow-lg">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center flex-shrink-0">
                <CheckCircle className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1 pt-1">
                <div className="font-bold text-emerald-900">{successMessage}</div>
              </div>
              <button 
                onClick={() => setSuccessMessage("")} 
                className="w-9 h-9 rounded-lg hover:bg-emerald-100 flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5 text-emerald-700" />
              </button>
            </div>
          )}

          {error && (
            <div className="glass-card rounded-2xl p-5 flex items-start gap-3 border-2 border-red-300 bg-gradient-to-r from-red-50 to-rose-50 shadow-lg">
              <div className="flex-1">
                <div className="font-bold text-red-900">{error}</div>
              </div>
              <button 
                onClick={() => setError("")} 
                className="w-9 h-9 rounded-lg hover:bg-red-100 flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5 text-red-700" />
              </button>
            </div>
          )}

          <div className="grid md:grid-cols-3 gap-4">
            <div className="md:col-span-2 glass-card rounded-2xl border-2 border-indigo-200 bg-gradient-to-br from-indigo-50 to-purple-50 p-5 shadow-lg">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-lg">
                  <FolderOpen className="w-8 h-8 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-2">Viewing Library</div>
                  {loading ? (
                    <div className="text-muted-foreground font-medium">Loading libraries...</div>
                  ) : libraries.length > 0 ? (
                    <select
                      value={viewLibraryName}
                      onChange={(e) => setViewLibraryName(e.target.value)}
                      className="w-full h-11 rounded-xl border-2 border-indigo-300 bg-white px-4 font-bold text-indigo-900 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all"
                    >
                      {libraries.map((l) => (
                        <option key={l.id} value={l.name || ""}>
                          {l.name || l.id}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="text-muted-foreground font-medium">No libraries available</div>
                  )}
                </div>
              </div>
            </div>

            <div className="glass-card rounded-2xl border-2 border-pink-200 bg-gradient-to-br from-pink-50 to-rose-50 p-5 shadow-lg">
              <div className="flex items-center justify-between h-full">
                <div>
                  <div className="text-xs font-bold text-pink-600 uppercase tracking-wider">Total Documents</div>
                  <div className="text-4xl font-extrabold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent mt-2">
                    {documents.length}
                  </div>
                </div>
                <Button
                  onClick={() => viewLibraryName && loadDocuments(viewLibraryName)}
                  variant="outline"
                  size="sm"
                  className="rounded-xl border-pink-300 hover:bg-pink-100 text-pink-700 font-bold"
                  disabled={loadingDocs || !viewLibraryName}
                >
                  {loadingDocs ? "Loading..." : "Reload"}
                </Button>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <div className="glass-card rounded-2xl border-2 border-violet-200 bg-gradient-to-r from-violet-50 to-purple-50 p-1.5 flex gap-1.5 shadow-md">
              <button
                onClick={() => setViewMode("list")}
                className={`px-4 py-2.5 rounded-xl font-bold transition-all ${
                  viewMode === "list" 
                    ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg" 
                    : "text-violet-700 hover:bg-violet-100"
                }`}
              >
                <List className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode("grid")}
                className={`px-4 py-2.5 rounded-xl font-bold transition-all ${
                  viewMode === "grid" 
                    ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg" 
                    : "text-violet-700 hover:bg-violet-100"
                }`}
              >
                <Grid className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="glass-card rounded-2xl border-2 border-blue-200 bg-white/80 p-6 shadow-xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-foreground">Documents</h2>
                <p className="text-sm text-muted-foreground">View and manage your files</p>
              </div>
            </div>

            <div className="space-y-3">
              {loadingDocs ? (
                <div className="rounded-2xl border-2 border-dashed border-blue-200 bg-blue-50/50 p-16 text-center">
                  <RefreshCw className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
                  <div className="text-blue-900 font-bold text-lg">Loading documents...</div>
                </div>
              ) : documents?.length ? (
                viewMode === "list" ? (
                  documents.map((d: any, index) => (
                    <div
                      key={d.id}
                      style={{ animationDelay: `${index * 50}ms` }}
                      className="glass-card rounded-xl border-2 border-transparent hover:border-indigo-300 bg-gradient-to-r from-white to-indigo-50/30 p-5 flex items-center gap-4 transition-all animate-fade-in hover:shadow-lg"
                    >
                      <div
                        className={`w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md ${
                          d.folder 
                            ? "bg-gradient-to-br from-amber-400 to-orange-500" 
                            : "bg-gradient-to-br from-indigo-500 to-purple-600"
                        }`}
                      >
                        {d.folder ? (
                          <Folder className="w-7 h-7 text-white" />
                        ) : (
                          <FileText className="w-7 h-7 text-white" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-foreground truncate text-lg">{d.name}</div>
                        <div className="text-sm text-muted-foreground font-semibold mt-0.5">
                          {d.folder ? "📁 Folder" : "📄 Document"}
                        </div>
                      </div>

                      {d.webUrl && (
                        <a
                          href={d.webUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white font-bold shadow-lg transition-all"
                        >
                          Open → 
                        </a>
                      )}
                      {!d.folder && (
                        <Button
  variant="outline"
  
  disabled={validatingDocId === d.id}
  onClick={async () => {
    if (validatingDocId === d.id) return // prevent double click

    setValidatingDocId(d.id) // start loading

    try {
      const res = await fetch("/api/analyze-document", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          documentId: d.id,
          accessToken: token,
        }),
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData?.error || "Analysis failed")
      }

      const data = await res.json()
      console.log("FULL API RESPONSE:", data)

      let message = `
Compliance Analysis Result

Document Type: ${data.documentType || "Unknown"}
Overall Alignment: ${data.overallAlignment || 0}%
Confidence Level: ${data.confidenceLevel || "N/A"}

Rule Analysis:
`

      data.ruleAnalysis?.forEach((rule: any) => {
        message += `
• ${rule.rule}
  Status: ${rule.status}
  Remarks: ${rule.remarks}
`
      })

      alert(message)
    } catch (err: any) {
      console.error("Validation error:", err)
      alert(err.message || "Failed to validate document")
    } finally {
      setValidatingDocId(null) // stop loading
    }
  }}
>
  {validatingDocId === d.id ? (
    <>
      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
      Validating...
    </>
  ) : (
    "Validate"
  )}
</Button>

                             )}
                             </div>
                  ))
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {documents.map((d: any, index) => (
                      <div
                        key={d.id}
                        style={{ animationDelay: `${index * 50}ms` }}
                        className="glass-card rounded-xl border-2 border-transparent hover:border-indigo-300 bg-gradient-to-br from-white to-indigo-50/30 p-5 transition-all animate-fade-in hover:shadow-xl group"
                      >
                        <div className="flex flex-col items-center text-center">
                          <div
                            className={`w-20 h-20 rounded-2xl flex items-center justify-center shadow-lg mb-4 group-hover:scale-110 transition-transform ${
                              d.folder 
                                ? "bg-gradient-to-br from-amber-400 to-orange-500" 
                                : "bg-gradient-to-br from-indigo-500 to-purple-600"
                            }`}
                          >
                            {d.folder ? (
                              <Folder className="w-10 h-10 text-white" />
                            ) : (
                              <FileText className="w-10 h-10 text-white" />
                            )}
                          </div>

                          <div className="font-bold text-foreground truncate w-full text-lg mb-1">{d.name}</div>
                          <div className="text-xs text-muted-foreground font-semibold mb-3">
                            {d.folder ? "📁 Folder" : "📄 Document"}
                          </div>

                          {d.webUrl && (
                            <a
                              href={d.webUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="w-full px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white text-sm font-bold shadow-lg transition-all"
                            >
                              Open Document
                            </a>
                          )}
                          {!d.folder && (
                            // <Button
                            //   onClick={() => handleValidateExisting(d)}
                            //   variant="outline"
                            //   className="w-full mt-2 px-4 py-2 rounded-xl border-indigo-300 hover:bg-indigo-100 text-indigo-700 text-sm font-bold shadow-lg transition-all"
                            // >
                            //   Validate
                            // </Button>

                            <Button
  variant="outline"
  className="w-full mt-2 px-4 py-2 rounded-xl border-indigo-300 hover:bg-indigo-100 text-indigo-700 text-sm font-bold shadow-lg transition-all"
  disabled={validatingDocId === d.id}
  onClick={async () => {
    if (validatingDocId === d.id) return // prevent double click

    setValidatingDocId(d.id) // start loading

    try {
      const res = await fetch("/api/analyze-document", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          documentId: d.id,
          accessToken: token,
        }),
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData?.error || "Analysis failed")
      }

      const data = await res.json()
      console.log("FULL API RESPONSE:", data)

      let message = `
Compliance Analysis Result

Document Type: ${data.documentType || "Unknown"}
Overall Alignment: ${data.overallAlignment || 0}%
Confidence Level: ${data.confidenceLevel || "N/A"}

Rule Analysis:
`

      data.ruleAnalysis?.forEach((rule: any) => {
        message += `
• ${rule.rule}
  Status: ${rule.status}
  Remarks: ${rule.remarks}
`
      })

      alert(message)
    } catch (err: any) {
      console.error("Validation error:", err)
      alert(err.message || "Failed to validate document")
    } finally {
      setValidatingDocId(null) // stop loading
    }
  }}
>
  {validatingDocId === d.id ? (
    <>
      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
      Validating...
    </>
  ) : (
    "Validate"
  )}
</Button>

                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )
              ) : (
                <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-gradient-to-br from-slate-50 to-indigo-50/30 p-16 text-center">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center mx-auto mb-4">
                    <FileText className="w-12 h-12 text-indigo-600" />
                  </div>
                  <div className="font-extrabold text-foreground text-2xl mb-2">No documents found</div>
                  <div className="text-muted-foreground mb-4">Upload your first document to get started</div>
                  <Button
                    onClick={() => setShowUploadModal(true)}
                    className="rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white font-bold shadow-lg"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Now
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="glass-card rounded-3xl border-2 border-indigo-200 max-w-3xl w-full max-h-[90vh] overflow-y-auto p-4 sm:p-8 animate-in zoom-in-95 shadow-2xl bg-white">
            <div className="flex flex-col sm:flex-row items-start justify-between mb-6 gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                    <Upload className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-2xl font-extrabold text-purple-600">Upload Document</h2>
                </div>
                <p className="text-muted-foreground font-medium">Choose a file and library to upload</p>
              </div>
              <button
                onClick={resetUploadModal}
                className="w-11 h-11 rounded-xl bg-red-50 hover:bg-red-100 border-2 border-red-200 text-red-600 transition-all flex items-center justify-center"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-5">
              {/* Library Selection */}
              <div>
                <label className="block text-sm font-bold text-foreground mb-2 flex items-center gap-2">
                  <Folder className="w-4 h-4 text-indigo-600" />
                  Select Library <span className="text-red-500">*</span>
                </label>
                <select
                  value={uploadLibraryName}
                  onChange={(e) => setUploadLibraryName(e.target.value)}
                  className="w-full h-12 rounded-xl border-2 border-gray-200 bg-white px-4 font-medium text-foreground outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all"
                >
                  <option value="">Choose a library...</option>
                  {libraries.map((l) => (
                    <option key={l.id} value={l.name || ""}>
                      {l.name || l.id}
                    </option>
                  ))}
                </select>
              </div>

              {/* File Upload */}
              <div>
                <label className="block text-sm font-bold text-foreground mb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-indigo-600" />
                  Choose File <span className="text-red-500">*</span>
                </label>

                <input
                  type="file"
                  className="hidden"
                  ref={fileInputRef}
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    if (f) {
                      setSelectedFile(f)
                    }
                  }}
                />

                <label className="block cursor-pointer">
                  <div
                    className={`rounded-2xl border-2 border-dashed p-4 sm:p-6 text-center transition-all ${selectedFile
                      ? validationResponse?.status === "CLEAR"
                        ? "border-green-300 bg-green-50/50"
                        : validationError
                        ? "border-orange-300 bg-orange-50/50"
                        : "border-red-300 bg-red-50/50"
                      : "border-gray-300 bg-gray-50/50 hover:border-purple-400"
                    }`}
                    onClick={() => !selectedFile && fileInputRef.current?.click()}
                  >
                    {selectedFile ? (
                      <>
                        <div
                          className={`w-12 sm:w-16 h-12 sm:h-16 rounded-full flex items-center justify-center mx-auto mb-3 shadow-md ${validationResponse?.status === "CLEAR"
                            ? "bg-green-500"
                            : validationError
                            ? "bg-orange-500"
                            : validating
                            ? "bg-blue-500"
                            : "bg-red-500"
                          }`}
                        >
                          {validationResponse?.status === "CLEAR" ? (
                            <CheckCircle className="w-8 sm:w-10 h-8 sm:h-10 text-white" />
                          ) : validationError ? (
                            <AlertCircle className="w-8 sm:w-10 h-8 sm:h-10 text-white" />
                          ) : validating ? (
                            <RefreshCw className="w-8 sm:w-10 h-8 sm:h-10 text-white animate-spin" />
                          ) : (
                            <AlertTriangle className="w-8 sm:w-10 h-8 sm:h-10 text-white" />
                          )}
                        </div>
                        <div
                          className={`font-bold text-base sm:text-lg ${validationError ? "text-orange-800" : hasValidationIssues ? "text-red-800" : "text-gray-800"}`}
                        >
                          {selectedFile.name}
                        </div>
                        <div className="text-xs sm:text-sm text-gray-600 mt-1 font-medium">
                          {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            setSelectedFile(null)
                            setValidationResponse(null)
                            setValidationError("")
                            if (fileInputRef.current) fileInputRef.current.value = ""
                          }}
                          className="mt-3 px-4 py-1.5 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm font-medium transition-all"
                        >
                          Change file
                        </button>
                      </>
                    ) : (
                      <>
                        <div className="w-12 sm:w-16 h-12 sm:h-16 rounded-full bg-purple-500 flex items-center justify-center mx-auto mb-3 shadow-md">
                          <UploadCloud className="w-8 sm:w-10 h-8 sm:h-10 text-white" />
                        </div>
                        <div className="font-bold text-gray-800 text-base sm:text-lg">Click to choose file</div>
                        <div className="text-xs sm:text-sm text-gray-500 mt-1">or drag and drop your file here</div>
                      </>
                    )}
                  </div>
                </label>

                {validating && (
                  <div className="mt-4 text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 font-medium">
                      <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                      Validating document...
                    </div>
                  </div>
                )}

                {validationError && (
                  <div className="mt-4 rounded-xl bg-orange-50 border border-orange-200 p-3 shadow-sm">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-5 h-5 text-orange-600 mt-0.5" />
                      <div className="flex-1">
                        <div className="font-medium text-orange-800 mb-1">Connection Error</div>
                        <div className="text-sm text-orange-700">{validationError}</div>
                      </div>
                    </div>
                  </div>
                )}

                {validationResponse?.status === "CLEAR" && (
                  <div className="mt-4 rounded-xl bg-green-50 border border-green-200 p-3 shadow-sm">
                    <div className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                      <div className="flex-1">
                        <div className="font-medium text-green-800 mb-1">Document Validated Successfully</div>
                        {validationResponse.document_type && (
                          <div className="text-sm text-green-700 mb-1">
                            <span className="font-medium">Document Type:</span> {validationResponse.document_type}
                          </div>
                        )}
                        {validationResponse.message && (
                          <div className="text-sm text-green-700">
                            {validationResponse.message}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {hasValidationIssues && (
                  <div className="mt-4 space-y-3">
                    <div className="rounded-xl bg-red-50 border border-red-200 p-3 shadow-sm">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
                        <div className="flex-1">
                          <div className="font-medium text-red-800 mb-1">Document Validation Issues Detected</div>
                          {validationResponse.document_type && (
                            <div className="text-sm text-red-700 mb-1">
                              <span className="font-medium">Document Type:</span> {validationResponse.document_type}
                            </div>
                          )}
                          {validationResponse.message && (
                            <div className="text-sm text-red-700">
                              {validationResponse.message}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {hasMissingFields && (
                      <div className="rounded-xl bg-white border border-red-200 p-3 shadow-sm">
                        <button
                          onClick={() => setShowMissingFields(!showMissingFields)}
                          className="w-full flex items-center justify-between text-left"
                        >
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-md bg-red-100 flex items-center justify-center">
                              <FileText className="w-3 h-3 text-red-600" />
                            </div>
                            <div>
                              <div className="font-medium text-red-800">Missing Fields</div>
                              <div className="text-xs text-red-600">{validationResponse.issues!.missing_fields!.length} field(s) missing</div>
                            </div>
                          </div>
                          {showMissingFields ? (
                            <ChevronUp className="w-4 h-4 text-red-600" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-red-600" />
                          )}
                        </button>
                        {showMissingFields && (
                          <ul className="mt-2 space-y-1 pl-8 text-sm text-red-700">
                            {validationResponse.issues!.missing_fields!.map((field, idx) => (
                              <li key={idx} className="flex items-start gap-1">
                                <span className="text-red-500">•</span>
                                <span>{field}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}

                    {hasInvalidFields && (
                      <div className="rounded-xl bg-white border border-red-200 p-3 shadow-sm">
                        <button
                          onClick={() => setShowInvalidFields(!showInvalidFields)}
                          className="w-full flex items-center justify-between text-left"
                        >
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-md bg-red-100 flex items-center justify-center">
                              <X className="w-3 h-3 text-red-600" />
                            </div>
                            <div>
                              <div className="font-medium text-red-800">Invalid Fields</div>
                              <div className="text-xs text-red-600">{validationResponse.issues!.invalid_fields!.length} field(s) invalid</div>
                            </div>
                          </div>
                          {showInvalidFields ? (
                            <ChevronUp className="w-4 h-4 text-red-600" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-red-600" />
                          )}
                        </button>
                        {showInvalidFields && (
                          <ul className="mt-2 space-y-1 pl-8 text-sm text-red-700">
                            {validationResponse.issues!.invalid_fields!.map((field, idx) => (
                              <li key={idx} className="flex items-start gap-1">
                                <span className="text-red-500">•</span>
                                <span>{field}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}

                    {hasRisks && (
                      <div className="rounded-xl bg-white border border-red-200 p-3 shadow-sm">
                        <button
                          onClick={() => setShowRisks(!showRisks)}
                          className="w-full flex items-center justify-between text-left"
                        >
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-md bg-red-100 flex items-center justify-center">
                              <AlertTriangle className="w-3 h-3 text-red-600" />
                            </div>
                            <div>
                              <div className="font-medium text-red-800">Compliance Risks</div>
                              <div className="text-xs text-red-600">{validationResponse.issues!.risks!.length} risk(s) identified</div>
                            </div>
                          </div>
                          {showRisks ? (
                            <ChevronUp className="w-4 h-4 text-red-600" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-red-600" />
                          )}
                        </button>
                        {showRisks && (
                          <ul className="mt-2 space-y-1 pl-8 text-sm text-red-700">
                            {validationResponse.issues!.risks!.map((risk, idx) => (
                              <li key={idx} className="flex items-start gap-1">
                                <span className="text-red-500">•</span>
                                <span>{risk}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200">
                <Button
                  variant="outline"
                  onClick={resetUploadModal}
                  className="flex-1 h-11 rounded-xl border border-gray-300 bg-white hover:bg-gray-100 text-gray-700 font-medium"
                >
                  Cancel
                </Button>

                <Button
                  onClick={onUpload}
                  disabled={!canUpload()}
                  className={`flex-1 h-11 rounded-xl font-medium transition-all ${canUpload()
                    ? "bg-purple-500 hover:bg-purple-600 text-white"
                    : "bg-gray-200 text-gray-400 cursor-not-allowed"
                  }`}
                >
                  {uploading ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Document
                    </>
                  )}
                </Button>
              </div>

              {selectedFile && !canUpload() && !uploading && !validating && (
                <div className="rounded-xl bg-yellow-50 border border-yellow-200 p-3">
                  <div className="flex items-start gap-2">
                    <Info className="w-4 h-4 text-yellow-600 mt-0.5" />
                    <div className="text-sm text-yellow-800 font-medium">
                      {validationError ? (
                        "Upload disabled due to server connection error. Please check the validation service."
                      ) : hasValidationIssues ? (
                        "Upload disabled. Please resolve all validation issues before uploading."
                      ) : (
                        "Waiting for validation to complete..."
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Validation Modal for Existing Documents */}
      {showValidationModal && selectedDocument && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="glass-card rounded-3xl border-2 border-indigo-200 max-w-3xl w-full max-h-[90vh] overflow-y-auto p-4 sm:p-8 animate-in zoom-in-95 shadow-2xl bg-white">
            <div className="flex flex-col sm:flex-row items-start justify-between mb-6 gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-2xl font-extrabold text-purple-600">Document Validation</h2>
                </div>
                <p className="text-muted-foreground font-medium">Validation results for {selectedDocument.name}</p>
              </div>
              <button
                onClick={resetValidationModal}
                className="w-11 h-11 rounded-xl bg-red-50 hover:bg-red-100 border-2 border-red-200 text-red-600 transition-all flex items-center justify-center"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-5">
              {/* Document Info */}
              <div>
                <label className="block text-sm font-bold text-foreground mb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-indigo-600" />
                  Selected Document
                </label>
                <div className="w-full h-12 rounded-xl border-2 border-gray-200 bg-white px-4 font-medium text-foreground flex items-center">
                  {selectedDocument.name}
                </div>
              </div>

              {/* Validation Results */}
              <div>
                {validating && (
                  <div className="mt-4 text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 font-medium">
                      <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                      Validating document...
                    </div>
                  </div>
                )}

                {validationError && (
                  <div className="mt-4 rounded-xl bg-orange-50 border border-orange-200 p-3 shadow-sm">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-5 h-5 text-orange-600 mt-0.5" />
                      <div className="flex-1">
                        <div className="font-medium text-orange-800 mb-1">Connection Error</div>
                        <div className="text-sm text-orange-700">{validationError}</div>
                      </div>
                    </div>
                  </div>
                )}

                {validationResponse?.status === "CLEAR" && (
                  <div className="mt-4 rounded-xl bg-green-50 border border-green-200 p-3 shadow-sm">
                    <div className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                      <div className="flex-1">
                        <div className="font-medium text-green-800 mb-1">Document Validated Successfully</div>
                        {validationResponse.document_type && (
                          <div className="text-sm text-green-700 mb-1">
                            <span className="font-medium">Document Type:</span> {validationResponse.document_type}
                          </div>
                        )}
                        {validationResponse.message && (
                          <div className="text-sm text-green-700">
                            {validationResponse.message}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {hasValidationIssues && (
                  <div className="mt-4 space-y-3">
                    <div className="rounded-xl bg-red-50 border border-red-200 p-3 shadow-sm">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
                        <div className="flex-1">
                          <div className="font-medium text-red-800 mb-1">Document Validation Issues Detected</div>
                          {validationResponse.document_type && (
                            <div className="text-sm text-red-700 mb-1">
                              <span className="font-medium">Document Type:</span> {validationResponse.document_type}
                            </div>
                          )}
                          {validationResponse.message && (
                            <div className="text-sm text-red-700">
                              {validationResponse.message}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {hasMissingFields && (
                      <div className="rounded-xl bg-white border border-red-200 p-3 shadow-sm">
                        <button
                          onClick={() => setShowMissingFields(!showMissingFields)}
                          className="w-full flex items-center justify-between text-left"
                        >
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-md bg-red-100 flex items-center justify-center">
                              <FileText className="w-3 h-3 text-red-600" />
                            </div>
                            <div>
                              <div className="font-medium text-red-800">Missing Fields</div>
                              <div className="text-xs text-red-600">{validationResponse.issues!.missing_fields!.length} field(s) missing</div>
                            </div>
                          </div>
                          {showMissingFields ? (
                            <ChevronUp className="w-4 h-4 text-red-600" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-red-600" />
                          )}
                        </button>
                        {showMissingFields && (
                          <ul className="mt-2 space-y-1 pl-8 text-sm text-red-700">
                            {validationResponse.issues!.missing_fields!.map((field, idx) => (
                              <li key={idx} className="flex items-start gap-1">
                                <span className="text-red-500">•</span>
                                <span>{field}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}

                    {hasInvalidFields && (
                      <div className="rounded-xl bg-white border border-red-200 p-3 shadow-sm">
                        <button
                          onClick={() => setShowInvalidFields(!showInvalidFields)}
                          className="w-full flex items-center justify-between text-left"
                        >
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-md bg-red-100 flex items-center justify-center">
                              <X className="w-3 h-3 text-red-600" />
                            </div>
                            <div>
                              <div className="font-medium text-red-800">Invalid Fields</div>
                              <div className="text-xs text-red-600">{validationResponse.issues!.invalid_fields!.length} field(s) invalid</div>
                            </div>
                          </div>
                          {showInvalidFields ? (
                            <ChevronUp className="w-4 h-4 text-red-600" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-red-600" />
                          )}
                        </button>
                        {showInvalidFields && (
                          <ul className="mt-2 space-y-1 pl-8 text-sm text-red-700">
                            {validationResponse.issues!.invalid_fields!.map((field, idx) => (
                              <li key={idx} className="flex items-start gap-1">
                                <span className="text-red-500">•</span>
                                <span>{field}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}

                    {hasRisks && (
                      <div className="rounded-xl bg-white border border-red-200 p-3 shadow-sm">
                        <button
                          onClick={() => setShowRisks(!showRisks)}
                          className="w-full flex items-center justify-between text-left"
                        >
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-md bg-red-100 flex items-center justify-center">
                              <AlertTriangle className="w-3 h-3 text-red-600" />
                            </div>
                            <div>
                              <div className="font-medium text-red-800">Compliance Risks</div>
                              <div className="text-xs text-red-600">{validationResponse.issues!.risks!.length} risk(s) identified</div>
                            </div>
                          </div>
                          {showRisks ? (
                            <ChevronUp className="w-4 h-4 text-red-600" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-red-600" />
                          )}
                        </button>
                        {showRisks && (
                          <ul className="mt-2 space-y-1 pl-8 text-sm text-red-700">
                            {validationResponse.issues!.risks!.map((risk, idx) => (
                              <li key={idx} className="flex items-start gap-1">
                                <span className="text-red-500">•</span>
                                <span>{risk}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200">
                <Button
                  variant="outline"
                  onClick={resetValidationModal}
                  className="flex-1 h-11 rounded-xl border border-gray-300 bg-white hover:bg-gray-100 text-gray-700 font-medium"
                >
                  Close
                </Button>
                {selectedDocument.webUrl && (
                  <a
                    href={selectedDocument.webUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1"
                  >
                    <Button
                      className="w-full h-11 rounded-xl bg-purple-500 hover:bg-purple-600 text-white font-medium"
                    >
                      Open Document
                    </Button>
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}