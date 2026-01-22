

"use client";
import React, { useEffect, useMemo, useState } from "react";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import {
  FileText,
  Upload,
  CheckCircle,
  XCircle,
  Loader2,
  User,
  DollarSign,
  FileCheck,
  Info,
  X,
  FileIcon,
  AlertCircle,
  TrendingUp,
  Shield,
  Clock,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
} from "lucide-react";
import {
  getMsalAccessTokenFromSessionStorage,
  refreshAccessToken,
} from "@/lib/msalToken";

// ──────────────────────────────────────────────────────────────────────────────
// TYPES
// ──────────────────────────────────────────────────────────────────────────────
type Status = "idle" | "creating" | "uploading" | "verifying" | "approved" | "rejected";
type ChoiceColumn = {
  name: string;
  displayName: string;
  choices: string[];
};
type UploadState = "idle" | "uploading" | "done" | "error";
type StepStatus = "pending" | "running" | "done" | "fail";
type AgentStep = { name: string; status: StepStatus; detail?: string };
type AgentResult = {
  loan_decision: "Approved" | "Not Approved";
  reason_of_status: string;
  steps?: AgentStep[];
  missing_fields?: string[];
  missing_documents?: string[];
  invalid_documents?: string[];
  fraud_risks?: string[];
  non_pdf_documents?: string[];
  documents_found?: string[];
  dti_value?: number;
  dti_threshold?: number;
};
type UploadedFileInfo = {
  file: File;
  uploadedAt: Date;
};

// ──────────────────────────────────────────────────────────────────────────────
// REUSABLE COMPONENTS
// ──────────────────────────────────────────────────────────────────────────────
const InputField = ({
  label,
  name,
  type = "text",
  placeholder,
  onChange,
  value,
  icon,
  required = false,
  disabled = false,
}: any) => (
  <div className="flex flex-col gap-2 group">
    <label className="text-sm font-bold text-slate-700 ml-1 uppercase tracking-wide flex items-center gap-2">
      {label}
      {required && <span className="text-rose-500">*</span>}
    </label>
    <div className="relative">
      {icon && (
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors">
          {icon}
        </div>
      )}
      <input
        name={name}
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={onChange}
        disabled={disabled}
        className={`w-full ${icon ? "pl-12" : "pl-4"} pr-4 py-3.5 rounded-xl border-2 ${
          disabled ? "bg-slate-50 text-slate-500" : "bg-white"
        } border-slate-200 text-sm font-medium focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all placeholder:text-slate-400 hover:border-slate-300`}
      />
    </div>
  </div>
);

const SelectField = ({
  label,
  name,
  onChange,
  options,
  value,
  required = false,
  disabled = false,
}: any) => (
  <div className="flex flex-col gap-2">
    <label className="text-sm font-bold text-slate-700 ml-1 uppercase tracking-wide flex items-center gap-2">
      {label}
      {required && <span className="text-rose-500">*</span>}
    </label>
    <select
      name={name}
      value={value}
      onChange={onChange}
      disabled={disabled}
      className={`w-full px-4 py-3.5 rounded-xl border-2 border-slate-200 ${
        disabled ? "bg-slate-50 text-slate-500" : "bg-white"
      } text-sm font-medium focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all appearance-none cursor-pointer hover:border-slate-300`}
      style={{
        backgroundImage: disabled
          ? "none"
          : `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236366f1'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
        backgroundPosition: "right 0.75rem center",
        backgroundRepeat: "no-repeat",
        backgroundSize: "1.25rem",
      }}
    >
      <option value="">Select {label}</option>
      {options.map((o: string) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  </div>
);

const DocumentUpload = ({
  docName,
  uploadedFile,
  uploadStatus,
  onFileChange,
  onRemove,
  disabled = false,
}: {
  docName: string;
  uploadedFile: UploadedFileInfo | null;
  uploadStatus: UploadState;
  onFileChange: (docName: string, e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemove: (docName: string) => void;
  disabled?: boolean;
}) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  return (
    <div
      className={`relative group rounded-2xl border-2 transition-all duration-300 ${
        uploadStatus === "error"
          ? "border-rose-400 bg-rose-50/50"
          : uploadedFile
          ? "border-emerald-200 bg-emerald-50"
          : "border-slate-200 bg-slate-50 hover:border-indigo-300 hover:bg-white"
      } ${disabled ? "opacity-60 pointer-events-none" : ""}`}
    >
      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div
              className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all ${
                uploadStatus === "uploading"
                  ? "bg-indigo-500 text-white animate-pulse"
                  : uploadStatus === "error"
                  ? "bg-rose-500 text-white"
                  : uploadedFile
                  ? "bg-emerald-500 text-white"
                  : "bg-white border-2 border-slate-200 text-slate-400 group-hover:border-indigo-400 group-hover:text-indigo-600"
              }`}
            >
              {uploadStatus === "uploading" ? (
                <Loader2 className="animate-spin" size={20} />
              ) : uploadStatus === "error" ? (
                <XCircle size={20} />
              ) : uploadedFile ? (
                <CheckCircle size={20} />
              ) : (
                <FileIcon size={20} />
              )}
            </div>
            <div>
              <p className="text-sm font-black text-slate-800">{docName}</p>
              <p className="text-xs text-slate-500 mt-0.5">PDF • Max 10MB</p>
            </div>
          </div>
          {uploadStatus === "done" && (
            <div className="w-7 h-7 bg-emerald-500 rounded-lg flex items-center justify-center">
              <CheckCircle className="text-white" size={16} />
            </div>
          )}
          {uploadStatus === "error" && (
            <div className="w-7 h-7 bg-rose-500 rounded-lg flex items-center justify-center">
              <XCircle className="text-white" size={16} />
            </div>
          )}
        </div>
        {uploadedFile ? (
          <div className="bg-white rounded-xl p-3 border border-emerald-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <FileCheck className="text-emerald-600 flex-shrink-0" size={16} />
                <span className="text-xs font-semibold text-slate-700 truncate">
                  {uploadedFile.file.name}
                </span>
              </div>
              {!disabled && (
                <button
                  onClick={() => onRemove(docName)}
                  className="ml-2 w-7 h-7 bg-rose-100 hover:bg-rose-200 rounded-lg flex items-center justify-center transition-colors flex-shrink-0"
                  title="Remove file"
                >
                  <X className="text-rose-600" size={14} />
                </button>
              )}
            </div>
            <div className="mt-2 text-xs text-slate-500">
              {(uploadedFile.file.size / 1024 / 1024).toFixed(1)} MB • Uploaded{" "}
              {uploadedFile.uploadedAt.toLocaleTimeString()}
            </div>
          </div>
        ) : (
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled || uploadStatus === "uploading"}
            className="w-full py-3 rounded-xl bg-white border-2 border-dashed border-slate-300 hover:border-indigo-400 hover:bg-indigo-50 transition-all group/btn disabled:opacity-50"
          >
            <div className="flex items-center justify-center gap-2">
              <Upload
                className="text-slate-400 group-hover/btn:text-indigo-600 transition-colors"
                size={16}
              />
              <span className="text-sm font-bold text-slate-600 group-hover/btn:text-indigo-600 transition-colors">
                {uploadStatus === "uploading" ? "Uploading..." : "Choose File"}
              </span>
            </div>
          </button>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={(e) => onFileChange(docName, e)}
          disabled={disabled}
        />
      </div>
    </div>
  );
};

const AgentStepItem = ({ step }: { step: AgentStep }) => {
  const [isOpen, setIsOpen] = useState(false);
  const isDone = step.status === "done";
  const isFail = step.status === "fail";
  const isRunning = step.status === "running";
  const hasDetail = !!step.detail;
  return (
    <div
      className={`flex flex-col gap-2 p-4 rounded-xl border transition-all ${
        isDone
          ? "bg-emerald-500/10 border-emerald-400/30"
          : isFail
          ? "bg-rose-500/10 border-rose-400/30"
          : isRunning
          ? "bg-indigo-500/10 border-indigo-400/30 animate-pulse"
          : "bg-white/5 border-white/10"
      }`}
    >
      <div
        className="flex items-center gap-3 cursor-pointer"
        onClick={() => hasDetail && setIsOpen(!isOpen)}
      >
        <div
          className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
            isDone
              ? "bg-emerald-400 text-white"
              : isFail
              ? "bg-rose-400 text-white"
              : isRunning
              ? "bg-indigo-400 text-white"
              : "bg-white/10 text-white/50"
          }`}
        >
          {isRunning ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : isFail ? (
            <XCircle className="w-4 h-4" />
          ) : isDone ? (
            <CheckCircle className="w-4 h-4" />
          ) : (
            <Clock className="w-4 h-4" />
          )}
        </div>
        <div className="flex-1 min-w-0 flex items-center justify-between">
          <div
            className={`text-sm font-bold ${
              isFail ? "text-rose-300" : isDone ? "text-emerald-300" : "text-white"
            }`}
          >
            {step.name}
          </div>
          {hasDetail && (
            <button className="ml-2 text-indigo-200 hover:text-white transition-colors">
              {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          )}
        </div>
      </div>
      {hasDetail && isOpen && (
        <div className="text-xs text-indigo-200 leading-relaxed pl-10 pt-2 border-t border-white/10">
          <div className="bg-white/5 rounded-lg p-3 font-mono whitespace-pre-wrap">
            {step.detail}
          </div>
          {isFail && (
            <div className="mt-2 flex items-start gap-2 text-rose-300">
              <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />
              <span className="text-xs">
                This step failed. Please review the details above to understand what went wrong.
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ──────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ──────────────────────────────────────────────────────────────────────────────
export default function LoanApplicationPage() {
  // ================== CONFIG ==================
  const FASTAPI_BASE = "http://127.0.0.1:8000";
  const CONFIG_ROUTE = "/api/sharepoint/config";
  const requiredDocuments = [
    "Property Details",
    "GST Filings",
    "Personal Tax Returns",
    "Loan Application Form",
    "Driver License",
    "Passport",
    "Proof of Employment",
  ];
  // ================== STATE ==================
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    loanAmount: "",
    loanPurpose: "",
    annualIncome: "",
    preferredLoanTerm: "",
    bankAccountDetails: "",
    employmentStatus: "",
    existingDebts: "",
    creditScore: "",
  });
  const [choiceColumns, setChoiceColumns] = useState<ChoiceColumn[]>([]);
  const [loadingChoices, setLoadingChoices] = useState(true);
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, UploadedFileInfo | null>>({});
  const [uploadStatus, setUploadStatus] = useState<Record<string, UploadState>>(
    requiredDocuments.reduce((acc, d) => ({ ...acc, [d]: "idle" }), {})
  );
  const [loanItemId, setLoanItemId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [decision, setDecision] = useState<string>("");
  const [aiMessage, setAiMessage] = useState<string>("");
  const [agentSteps, setAgentSteps] = useState<AgentStep[]>([]);
  const [agentResult, setAgentResult] = useState<AgentResult | null>(null);
  const [sharepointConfig, setSharepointConfig] = useState<{
    siteId: string | null;
    listId: string | null;
    driveId: string | null;
  }>({ siteId: null, listId: null, driveId: null });
  const [configLoading, setConfigLoading] = useState(true);
  const [configError, setConfigError] = useState<string | null>(null);
  // ================== FETCH SHAREPOINT CONFIG ==================
  useEffect(() => {
    const fetchConfig = async () => {
      setConfigLoading(true);
      setConfigError(null);
      try {
        const res = await fetchWithAuth(CONFIG_ROUTE, { method: "GET" });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || "Failed to load SharePoint config");
        }
        const data = await res.json();
        if (!data.siteId || !data.listId) {
          throw new Error("Missing required SharePoint IDs");
        }
        setSharepointConfig({
          siteId: data.siteId,
          listId: data.listId,
          driveId: data.driveId || null,
        });
        setChoiceColumns(data.choiceColumns || []);
      } catch (err: any) {
        setConfigError(err.message || "Could not load SharePoint details");
      } finally {
        setConfigLoading(false);
        setLoadingChoices(false);
      }
    };
    fetchConfig();
  }, []);
  // ================== HELPERS ==================
  const getChoices = (internalName: string): string[] => {
    const col = choiceColumns.find((c) => c.name === internalName);
    return col?.choices || [];
  };
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errorMsg) setErrorMsg(null);
  };
  const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
    let token = await refreshAccessToken();
    if (!token) token = getMsalAccessTokenFromSessionStorage();
    if (!token) {
      const error = "No valid authentication token. Please sign in.";
      setErrorMsg(error);
      throw new Error(error);
    }
    const headers = new Headers(options.headers || {});
    headers.set("Authorization", `Bearer ${token}`);
    let res = await fetch(url, { ...options, headers });
    if (res.status === 401 || res.status === 403) {
      console.warn("Token rejected – retrying with fresh token");
      token = await refreshAccessToken();
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
        res = await fetch(url, { ...options, headers });
      }
    }
    if (res.status === 401 || res.status === 403) {
      const error = "Authentication failed. Please sign in again.";
      setErrorMsg(error);
      throw new Error(error);
    }
    return res;
  };
  const handleFileChange = async (
    docName: string,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== "application/pdf") {
      setErrorMsg(`${docName}: Only PDF files are allowed.`);
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg(`${docName}: File size must be less than 10MB.`);
      return;
    }
    setErrorMsg(null);
    setUploadedFiles((prev) => ({
      ...prev,
      [docName]: { file, uploadedAt: new Date() },
    }));
  };
  const removeFile = (docName: string) => {
    setUploadedFiles((prev) => {
      const updated = { ...prev };
      delete updated[docName];
      return updated;
    });
    setUploadStatus((s) => ({ ...s, [docName]: "idle" }));
  };
  const uploadSingleDocument = async (
    docName: string,
    file: File,
    itemId: string
  ) => {
    setUploadStatus((s) => ({ ...s, [docName]: "uploading" }));
    setStatus((prev) => (prev === "idle" ? "uploading" : prev));
    setErrorMsg(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("documentName", docName);
      const res = await fetchWithAuth(`${FASTAPI_BASE}/upload-loan-document/${itemId}`, {
        method: "POST",
        body: fd,
      });
      if (!res.ok) {
        const details = await res.json().catch(() => ({}));
        const errorDetail = details.error || details.detail || `Upload failed for ${docName}. Status: ${res.status}`;
        throw new Error(errorDetail);
      }
      setUploadStatus((s) => ({ ...s, [docName]: "done" }));
      return true;
    } catch (err: any) {
      setUploadStatus((s) => ({ ...s, [docName]: "error" }));
      setErrorMsg(err.message);
      return false;
    }
  };
  const createLoanItem = async () => {
    setStatus("creating");
    setErrorMsg(null);
    const payload = {
      Title: formData.fullName?.trim() || "Untitled Application",
      Email: formData.email?.trim() || "",
      AnnualIncome: formData.annualIncome ? Number(formData.annualIncome) : null,
      LoanAmount: formData.loanAmount ? Number(formData.loanAmount) : null,
      LoanPurpose: formData.loanPurpose?.trim() || "",
      PreferredLoanTerm: formData.preferredLoanTerm || "",
      BankAccountDetails: formData.bankAccountDetails
        ? String(formData.bankAccountDetails)
        : "",
      EmploymentStatus: formData.employmentStatus || "",
      ExistingDebts: formData.existingDebts ? Number(formData.existingDebts) : null,
      CreditScore: formData.creditScore ? Number(formData.creditScore) : null,
    };
    const cleanPayload = Object.fromEntries(
      Object.entries(payload).filter(([_, v]) => v !== null && v !== undefined)
    );
    try {
      const res = await fetchWithAuth(`${FASTAPI_BASE}/create-loan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cleanPayload),
      });
      if (!res.ok) {
        const details = await res.json().catch(() => ({}));
        const errorDetail = details.error || details.detail || `Failed to create loan item. Status: ${res.status}`;
        throw new Error(errorDetail);
      }
      const data = await res.json();
      if (!data?.itemId) throw new Error("No itemId returned from creation");
      setLoanItemId(String(data.itemId));
      return String(data.itemId);
    } catch (err: any) {
      setStatus("idle");
      setErrorMsg(err.message || "Network error during loan item creation.");
      return null;
    }
  };
  const bootstrapSteps = () => {
    const steps: AgentStep[] = [
      { name: "Create loan item in SharePoint", status: "pending" },
      { name: "Upload documents to SharePoint folder", status: "pending" },
      { name: "Resolve site", status: "pending" },
      { name: "Find list & drive", status: "pending" },
      { name: "Fetch loan application (initial fields)", status: "pending" },
      { name: "Fetch documents", status: "pending" },
      { name: "Analyze documents with AI", status: "pending" },
      { name: "Run AI decision (calculates DTI, decides Approved/Not Approved)", status: "pending" },
      { name: "Update SharePoint with decision, reason, and DTI", status: "pending" },
      { name: "Re-fetch the item (to get the latest fields after update)", status: "pending" },
      { name: "Perform Required fields check (on the updated data)", status: "pending" },
    ];
    setAgentSteps(steps);
  };
  const patchStep = (name: string, status: StepStatus, detail?: string) => {
    setAgentSteps((prev) =>
      prev.map((s) => (s.name === name ? { ...s, status, detail } : s))
    );
  };
  const submitToAgent = async () => {
    if (!sharepointConfig.siteId || !sharepointConfig.listId) {
      setErrorMsg("SharePoint configuration missing. Cannot proceed.");
      return;
    }
    setIsSubmitting(true);
    setErrorMsg(null);
    setDecision("");
    setAiMessage("");
    setAgentResult(null);
    bootstrapSteps();

    // Step 1: Create loan item
    patchStep("Create loan item in SharePoint", "running");
    const itemId = await createLoanItem();
    if (!itemId) {
      patchStep("Create loan item in SharePoint", "fail", errorMsg || "Failed to create loan item.");
      setIsSubmitting(false);
      return;
    }
    patchStep("Create loan item in SharePoint", "done", `Item ID: ${itemId}`);

    // Step 2: Upload documents (dependent on Step 1 success)
    setStatus("uploading");
    patchStep("Upload documents to SharePoint folder", "running");
    let allUploadsOk = true;
    let uploadErrorDetail = "";
    for (const doc of requiredDocuments) {
      const fileInfo = uploadedFiles[doc];
      if (!fileInfo) {
        uploadErrorDetail = `Missing file: ${doc}`;
        setErrorMsg(`Please upload all required documents. Missing: ${doc}`);
        allUploadsOk = false;
        break;
      }
      const ok = await uploadSingleDocument(doc, fileInfo.file, itemId);
      if (!ok) {
        uploadErrorDetail = errorMsg || `Upload failed for ${doc}`;
        allUploadsOk = false;
        break;
      }
    }
    if (!allUploadsOk) {
      patchStep("Upload documents to SharePoint folder", "fail", uploadErrorDetail);
      setStatus("idle");
      setIsSubmitting(false);
      return;
    }
    patchStep("Upload documents to SharePoint folder", "done", "All documents uploaded successfully.");

    // Validation steps (dependent on previous success): Call the backend validate endpoint, which runs the remaining steps sequentially
    setStatus("verifying");
    const validateUrl = `${FASTAPI_BASE}/validate-loan/${itemId}`;
    const validationSteps = [
      "Resolve site",
      "Find list & drive",
      "Fetch loan application (initial fields)",
      "Fetch documents",
      "Analyze documents with AI",
      "Run AI decision (calculates DTI, decides Approved/Not Approved)",
      "Update SharePoint with decision, reason, and DTI",
      "Re-fetch the item (to get the latest fields after update)",
      "Perform Required fields check (on the updated data)",
    ];

    // Set all validation steps to pending initially
    validationSteps.forEach((stepName) => patchStep(stepName, "pending"));

    try {
      // Call the validation API (backend runs steps sequentially and stops on failure)
      const approvalRes = await fetchWithAuth(validateUrl, { method: "POST" });

      if (!approvalRes.ok) {
        const errData = await approvalRes.json().catch(() => ({}));
        const errMsg = errData.detail || errData.error || `Validation failed. Status: ${approvalRes.status}`;
        setErrorMsg(errMsg);
        // Assume failure at "Run AI decision (calculates DTI, decides Approved/Not Approved)" if not specified
        patchStep("Run AI decision (calculates DTI, decides Approved/Not Approved)", "fail", errMsg);
        // Mark remaining steps as pending (not run)
        const failedIndex = validationSteps.indexOf("Run AI decision (calculates DTI, decides Approved/Not Approved)");
        validationSteps.slice(failedIndex + 1).forEach((step) => patchStep(step, "pending"));
        setIsSubmitting(false);
        return;
      }

      const result: AgentResult = await approvalRes.json();
      setAgentResult(result);

      // Animate patching the steps sequentially with delays for visual effect
      if (result?.steps) {
        for (const backendStep of result.steps) {
          patchStep(backendStep.name, backendStep.status, backendStep.detail);
          if (backendStep.status === "fail") {
            // Stop animating further if a step failed (backend should have stopped anyway)
            break;
          }
          await new Promise((r) => setTimeout(r, 500)); // Delay for animation
        }
        // If backend didn't run all steps due to failure, mark remaining as pending
        const lastProcessed = result.steps[result.steps.length - 1].name;
        const lastIndex = validationSteps.indexOf(lastProcessed);
        validationSteps.slice(lastIndex + 1).forEach((step) => patchStep(step, "pending"));
      } else {
        // Fallback: mark all done if no steps returned (though backend should return steps)
        for (const stepName of validationSteps) {
          patchStep(stepName, "done");
          await new Promise((r) => setTimeout(r, 300));
        }
      }

      if (result) {
        setDecision(result.loan_decision);
        setAiMessage(result.reason_of_status);
        setStatus(result.loan_decision === "Approved" ? "approved" : "rejected");
      }
    } catch (err: any) {
      const errMsg = err.message || "Unexpected error during validation.";
      setErrorMsg(errMsg);
      patchStep("Run AI decision (calculates DTI, decides Approved/Not Approved)", "fail", errMsg);
      // Mark remaining steps as pending
      const failedIndex = validationSteps.indexOf("Run AI decision (calculates DTI, decides Approved/Not Approved)");
      validationSteps.slice(failedIndex + 1).forEach((step) => patchStep(step, "pending"));
      setStatus("idle");
    } finally {
      setIsSubmitting(false);
    }
  };
  const resetApplication = () => {
    setStatus("idle");
    setDecision("");
    setAiMessage("");
    setAgentSteps([]);
    setAgentResult(null);
    setLoanItemId(null);
    setUploadStatus(
      requiredDocuments.reduce((acc, d) => {
        acc[d] = "idle";
        return acc;
      }, {} as Record<string, UploadState>)
    );
    setUploadedFiles({});
    setFormData({
      fullName: "",
      email: "",
      loanAmount: "",
      loanPurpose: "",
      annualIncome: "",
      preferredLoanTerm: "",
      bankAccountDetails: "",
      employmentStatus: "",
      existingDebts: "",
      creditScore: "",
    });
    setErrorMsg(null);
  };
  // ================== MEMOIZED VALUES ==================
  const loanTypeChoices = useMemo(() => getChoices("LoanType"), [choiceColumns]);
  const loanTermChoices = useMemo(() => getChoices("PreferredLoanTerm"), [choiceColumns]);
  const employmentChoices = useMemo(() => getChoices("EmploymentStatus"), [choiceColumns]);
  const uploadedCount = useMemo(
    () => requiredDocuments.filter((d) => uploadedFiles[d]).length,
    [uploadedFiles]
  );
  const basicInfoComplete = !!formData.fullName && !!formData.email;
  const financialComplete = !!formData.annualIncome && !!formData.loanAmount && !!formData.creditScore;
  const employmentDebtComplete = !!formData.employmentStatus && !!formData.existingDebts;
  const loanDetailsComplete = !!formData.loanPurpose && !!formData.preferredLoanTerm;
  const isFormComplete = basicInfoComplete && financialComplete && employmentDebtComplete && loanDetailsComplete && !!formData.bankAccountDetails;
  const documentsComplete = uploadedCount === requiredDocuments.length;
  const canSubmit = !isSubmitting && isFormComplete && documentsComplete && !configLoading && !configError && !!sharepointConfig.siteId && !!sharepointConfig.listId;
  let processingText = "";
  switch (status) {
    case "creating":
      processingText = "Creating loan request in SharePoint...";
      break;
    case "uploading":
      processingText = "Uploading supporting documents...";
      break;
    case "verifying":
      processingText = "AI is validating your application (including DTI calculation)...";
      break;
    default:
      processingText = "Processing...";
  }
  // ================== RENDER ==================
  return (
    <DashboardLayout>
      <div className="min-h-[calc(100vh-64px)] bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 text-slate-900">
        <div className="max-w-[1600px] mx-auto px-4 py-8 md:px-8 md:py-12">
          {/* Header */}
          <header className="mb-10">
            <div className="flex items-center gap-4 mb-3">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-indigo-500/30">
                <Shield className="text-white" size={32} />
              </div>
              <div>
                <h1 className="text-5xl font-black tracking-tight bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  Loan Application
                </h1>
                <p className="text-slate-500 font-semibold mt-1">
                  Secure, Fast & AI-Powered Approval
                </p>
              </div>
            </div>
          </header>
          {/* Config Loading/Error */}
          {configLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mr-3" />
              <p className="text-slate-600 font-medium">Loading SharePoint configuration...</p>
            </div>
          ) : configError ? (
            <div className="mb-6 rounded-2xl border border-rose-300 bg-rose-50 px-6 py-4 flex items-start gap-3">
              <XCircle className="text-rose-600 flex-shrink-0 mt-0.5" size={20} />
              <div className="flex-1">
                <div className="font-bold text-rose-900 mb-1">Configuration Error</div>
                <div className="text-sm text-rose-700">{configError}</div>
              </div>
            </div>
          ) : null}
          {/* Error */}
          {errorMsg && (
            <div className="mb-6 rounded-2xl border border-rose-300 bg-rose-50 px-6 py-4 flex items-start gap-3">
              <XCircle className="text-rose-600 flex-shrink-0 mt-0.5" size={20} />
              <div className="flex-1">
                <div className="font-bold text-rose-900 mb-1">Error</div>
                <div className="text-sm text-rose-700">{errorMsg}</div>
              </div>
              <button onClick={() => setErrorMsg(null)}>
                <X size={18} className="text-rose-400 hover:text-rose-600" />
              </button>
            </div>
          )}
          {loadingChoices ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mr-3" />
              <p className="text-slate-600 font-medium">Loading loan options from SharePoint...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* ─── LEFT: FORM ─── */}
              <div className="lg:col-span-2 space-y-6">
                {/* Personal Information */}
                <section className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
                  <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-6 text-white">
                    <div className="flex items-center gap-3">
                      <User size={28} />
                      <div>
                        <h2 className="text-2xl font-black">Personal Information</h2>
                        <p className="text-indigo-100 text-sm font-medium">Your identity matters</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <InputField
                        label="Full Legal Name"
                        name="fullName"
                        value={formData.fullName}
                        placeholder="John Michael Doe"
                        onChange={handleInputChange}
                        icon={<User size={18} />}
                        required
                      />
                      <InputField
                        label="Email Address"
                        name="email"
                        type="email"
                        value={formData.email}
                        placeholder="john.doe@example.com"
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>
                </section>
                {/* Financial Details */}
                <section className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
                  <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-8 py-6 text-white">
                    <div className="flex items-center gap-3">
                      <DollarSign size={28} />
                      <div>
                        <h2 className="text-2xl font-black">Financial Details</h2>
                        <p className="text-emerald-100 text-sm font-medium">
                          Income, loan amount & credit score
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="p-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <InputField
                        label="Annual Income"
                        name="annualIncome"
                        type="number"
                        value={formData.annualIncome}
                        placeholder="90000"
                        onChange={handleInputChange}
                        icon={<DollarSign size={18} />}
                        required
                      />
                      <InputField
                        label="Requested Loan Amount"
                        name="loanAmount"
                        type="number"
                        value={formData.loanAmount}
                        placeholder="250000"
                        onChange={handleInputChange}
                        icon={<DollarSign size={18} />}
                        required
                      />
                      <InputField
                        label="Credit Score"
                        name="creditScore"
                        type="number"
                        value={formData.creditScore}
                        placeholder="725"
                        onChange={handleInputChange}
                        icon={<TrendingUp size={18} />}
                        required
                      />
                      <InputField
                        label="Existing Debts / Liabilities"
                        name="existingDebts"
                        type="number"
                        value={formData.existingDebts}
                        placeholder="50000"
                        onChange={handleInputChange}
                        icon={<DollarSign size={18} />}
                        required
                      />
                      <SelectField
                        label="Employment Status"
                        name="employmentStatus"
                        value={formData.employmentStatus}
                        onChange={handleInputChange}
                        options={
                          employmentChoices.length
                            ? employmentChoices
                            : ["Employed", "Self-Employed", "Retired", "Unemployed"]
                        }
                        required
                      />
                    </div>
                  </div>
                </section>
                {/* Loan Details */}
                <section className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
                  <div className="bg-gradient-to-r from-violet-600 to-purple-600 px-8 py-6 text-white">
                    <div className="flex items-center gap-3">
                      <FileText size={28} />
                      <div>
                        <h2 className="text-2xl font-black">Loan Details</h2>
                        <p className="text-violet-100 text-sm font-medium">
                          Specify your loan requirements
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="p-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <InputField
                        label="Loan Purpose"
                        name="loanPurpose"
                        value={formData.loanPurpose}
                        placeholder="e.g., Home Renovation"
                        onChange={handleInputChange}
                        required
                      />
                      <SelectField
                        label="Preferred Loan Term"
                        name="preferredLoanTerm"
                        value={formData.preferredLoanTerm}
                        onChange={handleInputChange}
                        options={
                          loanTermChoices.length
                            ? loanTermChoices
                            : ["1 Year", "2 Years", "3 Years", "5 Years", "7 Years"]
                        }
                        required
                      />
                      <InputField
                        label="Bank Account Details"
                        name="bankAccountDetails"
                        value={formData.bankAccountDetails}
                        placeholder="Account Number / IBAN"
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>
                </section>
                {/* Documents */}
                <section className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
                  <div className="bg-gradient-to-r from-amber-600 to-orange-600 px-8 py-6 text-white">
                    <div className="flex items-center gap-3">
                      <Upload size={28} />
                      <div>
                        <h2 className="text-2xl font-black">Required Documents</h2>
                        <p className="text-amber-100 text-sm font-medium">
                          {uploadedCount} of {requiredDocuments.length} uploaded
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="p-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      {requiredDocuments.map((doc) => (
                        <DocumentUpload
                          key={doc}
                          docName={doc}
                          uploadedFile={uploadedFiles[doc]}
                          uploadStatus={uploadStatus[doc]}
                          onFileChange={handleFileChange}
                          onRemove={removeFile}
                        />
                      ))}
                    </div>
                    <div className="mt-6 p-4 bg-amber-50 rounded-2xl border border-amber-200">
                      <div className="flex items-start gap-3">
                        <Info className="text-amber-600 flex-shrink-0 mt-0.5" size={18} />
                        <div className="text-sm text-amber-900">
                          <span className="font-bold">Important:</span> Only PDF files under 10MB are accepted. Ensure all documents are clear and legible.
                        </div>
                      </div>
                    </div>
                  </div>
                </section>
              </div>
              {/* ─── RIGHT: STATUS PANEL ─── */}
              <aside className="space-y-6 lg:sticky lg:top-6 lg:self-start">
                {/* Ready to Submit */}
                {status === "idle" && (
                  <div className="bg-gradient-to-br from-slate-900 via-indigo-900 to-purple-900 rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden">
                    <div className="absolute inset-0 opacity-30">
                      <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl"></div>
                      <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl"></div>
                    </div>
                    <div className="relative z-10">
                      <div className="mb-6">
                        <Clock className="text-indigo-300 mb-3" size={32} />
                        <h3 className="text-2xl font-black mb-2">Ready to Submit</h3>
                        <p className="text-indigo-200 text-sm leading-relaxed">
                          Complete all fields and upload documents. AI will calculate your DTI.
                        </p>
                      </div>
                      <div className="space-y-3 mb-8">
                        {[
                          { label: "Personal Information", complete: basicInfoComplete },
                          { label: "Financial Details", complete: financialComplete },
                          { label: "Employment & Debts", complete: employmentDebtComplete },
                          { label: "Loan Requirements", complete: loanDetailsComplete },
                          {
                            label: "Documents Uploaded",
                            complete: documentsComplete,
                            extra: `${uploadedCount}/${requiredDocuments.length}`,
                          },
                        ].map((item, i) => (
                          <div
                            key={i}
                            className="flex items-center justify-between py-2 px-3 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10"
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-5 h-5 rounded-lg flex items-center justify-center transition-all ${
                                  item.complete
                                    ? "bg-emerald-400 text-white"
                                    : "bg-white/10 text-white/30"
                                }`}
                              >
                                <CheckCircle size={12} />
                              </div>
                              <span
                                className={`text-sm font-semibold ${
                                  item.complete ? "text-white" : "text-indigo-200"
                                }`}
                              >
                                {item.label}
                              </span>
                            </div>
                            {item.extra && (
                              <span className="text-xs font-black text-indigo-300 bg-white/10 px-2 py-1 rounded-lg">
                                {item.extra}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                      <button
                        onClick={submitToAgent}
                        disabled={!canSubmit}
                        className={`w-full py-5 rounded-2xl font-black text-base uppercase tracking-widest transition-all shadow-2xl ${
                          canSubmit
                            ? "bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white transform hover:scale-105 active:scale-95"
                            : "bg-slate-700/50 text-slate-400 cursor-not-allowed"
                        }`}
                      >
                        {canSubmit ? "Submit Application" : "Complete All Fields"}
                      </button>
                    </div>
                  </div>
                )}
                {/* Processing */}
                {(status === "creating" || status === "uploading" || status === "verifying") && (
                  <div className="bg-gradient-to-br from-slate-900 via-indigo-900 to-purple-900 rounded-3xl p-8 text-white shadow-2xl">
                    <div className="flex flex-col items-center justify-center py-4 mb-6">
                      <div className="relative mb-6">
                        <div className="absolute inset-0 rounded-full bg-indigo-400 blur-2xl opacity-30 animate-pulse"></div>
                        <Loader2 className="animate-spin text-white relative" size={64} />
                      </div>
                      <h3 className="text-xl font-black mb-2 text-center">
                        Processing Application
                      </h3>
                      <p className="text-indigo-200 text-sm text-center mb-2">
                        {processingText}
                      </p>
                    </div>
                    {agentSteps.length > 0 && (
                      <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2">
                        {agentSteps.map((step, idx) => (
                          <AgentStepItem key={`${step.name}-${idx}`} step={step} />
                        ))}
                      </div>
                    )}
                  </div>
                )}
                {/* Result */}
                {(status === "approved" || status === "rejected") && (
                  <div className="bg-gradient-to-br from-slate-900 via-indigo-900 to-purple-900 rounded-3xl p-8 text-white shadow-2xl">
                    <div className="text-center mb-6">
                      {status === "approved" ? (
                        <>
                          <div className="mx-auto w-24 h-24 bg-emerald-500/20 border-4 border-emerald-400 rounded-full flex items-center justify-center mb-6 animate-in zoom-in duration-500">
                            <CheckCircle className="text-emerald-400" size={48} />
                          </div>
                          <h3 className="text-4xl font-black text-emerald-400 mb-4">Approved!</h3>
                        </>
                      ) : (
                        <>
                          <div className="mx-auto w-24 h-24 bg-rose-500/20 border-4 border-rose-400 rounded-full flex items-center justify-center mb-6 animate-in zoom-in duration-500">
                            <XCircle className="text-rose-400" size={48} />
                          </div>
                          <h3 className="text-4xl font-black text-rose-400 mb-4">
                            {decision === "Not Approved" ? "Not Approved" : "Needs Review"}
                          </h3>
                        </>
                      )}
                      {aiMessage && (
                        <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 text-left mb-6">
                          <h4 className="text-sm font-black text-white uppercase tracking-wider mb-3">
                            Decision Details
                          </h4>
                          <div className="text-sm text-indigo-100 leading-relaxed whitespace-pre-wrap">
                            {aiMessage}
                          </div>
                        </div>
                      )}
                      {agentResult && (
                        <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 text-left mb-6">
                          <h4 className="text-sm font-black text-white uppercase tracking-wider mb-4">
                            Validation Summary
                          </h4>
                          {agentResult.missing_fields?.length ? (
                            <div className="mb-4 p-3 bg-rose-500/10 rounded-lg border border-rose-400/20">
                              <div className="text-xs font-bold text-rose-300 mb-2 flex items-center gap-2">
                                <XCircle size={14} />
                                Missing Fields:
                              </div>
                              <div className="text-xs text-indigo-200">
                                {agentResult.missing_fields.join(", ")}
                              </div>
                            </div>
                          ) : null}
                          {agentResult.missing_documents?.length ? (
                            <div className="mb-4 p-3 bg-rose-500/10 rounded-lg border border-rose-400/20">
                              <div className="text-xs font-bold text-rose-300 mb-2 flex items-center gap-2">
                                <FileIcon size={14} />
                                Missing Documents:
                              </div>
                              <div className="text-xs text-indigo-200">
                                {agentResult.missing_documents.join(", ")}
                              </div>
                            </div>
                          ) : null}
                          {agentResult.fraud_risks?.length ? (
                            <div className="mb-4 p-3 bg-rose-500/10 rounded-lg border border-rose-400/20">
                              <div className="text-xs font-bold text-rose-300 mb-2 flex items-center gap-2">
                                <AlertCircle size={14} />
                                Fraud Risks Detected:
                              </div>
                              <div className="text-xs text-indigo-200 space-y-1">
                                {agentResult.fraud_risks.map((risk, i) => (
                                  <div key={i}>• {risk}</div>
                                ))}
                              </div>
                            </div>
                          ) : null}
                          {agentResult.documents_found?.length ? (
                            <div className="mb-4 p-3 bg-emerald-500/10 rounded-lg border border-emerald-400/20">
                              <div className="text-xs font-bold text-emerald-300 mb-2 flex items-center gap-2">
                                <CheckCircle size={14} />
                                Documents Verified ({agentResult.documents_found.length}):
                              </div>
                              <div className="text-xs text-indigo-200">
                                {agentResult.documents_found.join(", ")}
                              </div>
                            </div>
                          ) : null}
                          {agentResult.dti_value !== undefined && (
                            <div className="p-3 bg-indigo-500/10 rounded-lg border border-indigo-400/20">
                              <div className="text-xs font-bold text-indigo-300 mb-2">
                                Debt-to-Income Ratio (calculated by AI):
                              </div>
                              <div className="text-lg font-black text-white">
                                {agentResult.dti_value.toFixed(2)}%
                                {agentResult.dti_threshold && (
                                  <span className="ml-2 text-indigo-200 text-sm">
                                    (Threshold: {agentResult.dti_threshold}%)
                                  </span>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                      {agentSteps.length > 0 && (
                        <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 text-left mb-6">
                          <h4 className="text-sm font-black text-white uppercase tracking-wider mb-4">
                            Processing Steps
                          </h4>
                          <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                            {agentSteps.map((step, idx) => (
                              <AgentStepItem key={`${step.name}-${idx}`} step={step} />
                            ))}
                          </div>
                        </div>
                      )}
                      <button
                        onClick={resetApplication}
                        className="w-full py-4 rounded-2xl font-bold text-sm uppercase tracking-wider bg-white/10 hover:bg-white/20 border border-white/20 transition-all"
                      >
                        Start New Application
                      </button>
                    </div>
                  </div>
                )}
                {/* Info Card */}
                <div className="bg-white rounded-3xl p-6 shadow-xl border border-slate-100">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Info className="text-blue-600" size={20} />
                    </div>
                    <div>
                      <h4 className="font-black text-slate-900 mb-1">Need Help?</h4>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        Our AI system calculates your Debt-to-Income Ratio automatically and
                        validates your application in real-time.
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2 pt-4 border-t border-slate-100">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-600"></div>
                      <span className="text-xs text-slate-600 font-medium">
                        Average approval time: 2-5 minutes
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-600"></div>
                      <span className="text-xs text-slate-600 font-medium">
                        AI-powered DTI calculation
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-600"></div>
                      <span className="text-xs text-slate-600 font-medium">
                        Real-time fraud detection
                      </span>
                    </div>
                  </div>
                </div>
              </aside>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}