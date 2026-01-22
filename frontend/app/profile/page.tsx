"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/layouts/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { getMsalAccessTokenFromSessionStorage } from "@/lib/msalToken"

import {
  ArrowLeft,
  Pencil,
  User,
  IdCard,
  CalendarDays,
  Phone,
  Mail,
  MapPin,
  Fingerprint,
  Bell,
  ShieldCheck,
  KeyRound,
  LogOut,
  Copy,
  Check,
  X,
  Shield,
  Camera,
  Loader2,
  Hash,
  FileCheck,
  RefreshCw
} from "lucide-react"

// Configuration
const API_BASE_URL = "http://127.0.0.1:5050"
const SITE_ID = "aoscaustralia.sharepoint.com,e8b42e32-1d2a-4cd8-9dda-e8e5a70e533f,587af906-0cc5-4775-944f-86da48ae6261"
const LIST_ID = "26a8ef47-2958-442b-b8a5-1e1462110875"
const ONBOARDING_AGENT_URL = "http://127.0.0.1:8080"
const HOSTNAME = "aoscaustralia.sharepoint.com"
const SITE_NAME = "CPA"
const ONBOARDING_LIST_ID = "26a8ef47-2958-442b-b8a5-1e1462110875"

type ProfileState = {
  displayName: string
  legalName: string
  xeroId: string
  kycStatus: string
  taxIdMasked: string
  dob: string
  phone: string
  email: string
  addressLine1: string
  addressLine2: string
  city: string
  state: string
  zip: string
  country: string
  faceIdEnabled: boolean
  pushNotifications: boolean
  twoFactorEnabled: boolean
  clientType: string
  clientId: string
  appVersion: string
}

const STORAGE_KEY = "profile_settings_v2"

const DEFAULT_STATE: ProfileState = {
  displayName: "Jane Doe",
  legalName: "Jane Marie Doe",
  xeroId: "",
  kycStatus: "Pending",
  taxIdMasked: "••• •• •• •• 1234",
  dob: "Oct 24, 1985",
  phone: "(555) 123-4567",
  email: "jane.doe@example.com",
  addressLine1: "221B Example Street",
  addressLine2: "Apartment 12",
  city: "New York",
  state: "NY",
  zip: "10001",
  country: "United States",
  faceIdEnabled: false,
  pushNotifications: true,
  twoFactorEnabled: true,
  clientType: "CLIENT",
  clientId: "ID: 893-442",
  appVersion: "2.4.1 (Build 4092)",
}

function clsx(...s: Array<string | false | undefined | null>) {
  return s.filter(Boolean).join(" ")
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
}

function prettyAddress(s: ProfileState) {
  const line2 = s.addressLine2?.trim()
  return `${s.addressLine1}${line2 ? `, ${line2}` : ""}, ${s.city}, ${s.state} ${s.zip}, ${s.country}`
}

async function canUseWebAuthn() {
  try {
    if (typeof window === "undefined") return false
    if (!("PublicKeyCredential" in window)) return false
    if (typeof (PublicKeyCredential as any).isUserVerifyingPlatformAuthenticatorAvailable !== "function")
      return false
    return await (PublicKeyCredential as any).isUserVerifyingPlatformAuthenticatorAvailable()
  } catch {
    return false
  }
}

function generateBackupCodes() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
  const make = () =>
    Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join("")
  return Array.from({ length: 6 }, make)
}

function MiniToggle({
  checked,
  onChange,
  ariaLabel,
  disabled,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  ariaLabel: string
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        if (!disabled) onChange(!checked)
      }}
      className={clsx(
        "relative w-12 h-7 rounded-full transition-all outline-none",
        disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer",
        checked ? "bg-gradient-to-r from-indigo-500 to-purple-500 shadow-lg shadow-indigo-500/30" : "bg-slate-200"
      )}
    >
      <span
        className={clsx(
          "absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white shadow-md transition-transform duration-200",
          checked ? "translate-x-5" : ""
        )}
      />
    </button>
  )
}

function SettingsRow({
  icon,
  label,
  value,
  right,
  onClick,
  clickable = true,
}: {
  icon: any
  label: string
  value?: string
  right?: any
  onClick?: () => void
  clickable?: boolean
}) {
  return (
    <div
      role={clickable ? "button" : undefined}
      tabIndex={clickable ? 0 : undefined}
      onClick={clickable ? onClick : undefined}
      onKeyDown={
        clickable
          ? (e: any) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault()
                e.stopPropagation()
                onClick?.()
              }
            }
          : undefined
      }
      className={clsx(
        "w-full flex items-center gap-4 rounded-2xl border px-5 py-4 transition-all",
        "glass-card border-border shadow-sm",
        clickable ? "hover:border-primary/50 hover:shadow-md cursor-pointer" : "cursor-default"
      )}
    >
      <span className="grid place-items-center w-11 h-11 rounded-xl bg-gradient-to-br from-primary/10 to-purple-500/10 border border-primary/20 text-primary">
        {icon}
      </span>

      <span className="flex-1 min-w-0">
        <span className="block text-xs font-bold text-muted-foreground uppercase tracking-wider">{label}</span>
        {value ? (
          <span className="block text-sm font-semibold text-foreground truncate mt-1">{value}</span>
        ) : null}
      </span>

      {right ? <span className="shrink-0">{right}</span> : <span className="text-muted-foreground/40 text-xl">›</span>}
    </div>
  )
}

function SectionTitle({ children }: { children: string }) {
  return (
    <div className="px-1 mb-3">
      <p className="text-xs font-extrabold tracking-widest text-muted-foreground/70">{children}</p>
    </div>
  )
}

function Modal({
  open,
  title,
  subtitle,
  children,
  onClose,
  footer,
}: {
  open: boolean
  title: string
  subtitle?: string
  children: any
  onClose: () => void
  footer?: any
}) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-[999] flex items-end sm:items-center justify-center animate-fade-in">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full sm:max-w-[580px] glass-card rounded-t-3xl sm:rounded-3xl border border-border p-6 sm:p-7 m-0 sm:m-4 max-h-[85vh] overflow-auto animate-in zoom-in-95">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-xl font-extrabold text-foreground">{title}</div>
            {subtitle ? <div className="text-sm text-muted-foreground mt-1">{subtitle}</div> : null}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-11 h-11 rounded-2xl border border-border bg-secondary hover:bg-secondary/80 grid place-items-center transition-all"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-foreground" />
          </button>
        </div>

        <div className="mt-5">{children}</div>

        {footer ? <div className="mt-6">{footer}</div> : null}
      </div>
    </div>
  )
}

function Field({
  label,
  children,
  hint,
}: {
  label: string
  children: any
  hint?: string
}) {
  return (
    <div>
      <label className="text-sm font-bold text-foreground">{label}</label>
      <div className="mt-2">{children}</div>
      {hint ? <p className="text-xs text-muted-foreground mt-1.5">{hint}</p> : null}
    </div>
  )
}

export default function ProfilePage() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [data, setData] = useState<ProfileState>(DEFAULT_STATE)
  const [savedAt, setSavedAt] = useState<string>("")
  const [faceIdSupported, setFaceIdSupported] = useState<boolean>(false)
  const [activeModal, setActiveModal] = useState<null | "editAll" | "twofa">(null)
  
  const [currentPass, setCurrentPass] = useState("")
  const [newPass, setNewPass] = useState("")
  const [confirmPass, setConfirmPass] = useState("")
  const [passError, setPassError] = useState("")
  
  const [backupCodes, setBackupCodes] = useState<string[]>(generateBackupCodes())
  const [copied, setCopied] = useState(false)
  
  const [isSaving, setIsSaving] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [kycMessage, setKycMessage] = useState<string | null>(null)
  const [isRefreshingKyc, setIsRefreshingKyc] = useState(false)

  useEffect(() => {
    setMounted(true)
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as ProfileState
        setData({ ...DEFAULT_STATE, ...parsed })
      }
    } catch {}
  }, [])

  useEffect(() => {
    ;(async () => {
      const ok = await canUseWebAuthn()
      setFaceIdSupported(ok)
    })()
  }, [])

  const initials = useMemo(() => {
    const parts = data.displayName.trim().split(/\s+/).filter(Boolean)
    return (parts[0]?.[0] ?? "J") + (parts[1]?.[0] ?? "D")
  }, [data.displayName])

  const persistLocal = (next: ProfileState) => {
    setData(next)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      setSavedAt(new Date().toLocaleTimeString())
    } catch {}
  }

  const mapStateToSharePointFields = (state: ProfileState) => {
    return {
      Title: state.displayName,
      EmailAddress: state.email,
      XeroID: state.xeroId,
      PhoneNumber: state.phone,
      TaxID_x002f_SSN_x0028_masked_x00: state.taxIdMasked,
      FullLegalName: state.legalName,
      DateofBirth: state.dob,
      Addressline1: state.addressLine1,
      City: state.city,
      Country: state.country,
      ZIP: state.zip,
      NewYorkState: state.state,
    }
  }

  const handleVerifyKyc = async () => {
    if (!data.email) {
      alert("No email found. Please set an email in your profile.")
      return
    }

    setIsVerifying(true)
    setKycMessage(null)

    const token = getMsalAccessTokenFromSessionStorage()
    if (!token) {
      alert("Authentication token missing. Please log in again.")
      setIsVerifying(false)
      return
    }

    const query = data.email.trim()
    const url = `${ONBOARDING_AGENT_URL}/onboarding/${HOSTNAME}/sites/${SITE_NAME}/lists/${ONBOARDING_LIST_ID}?query=${encodeURIComponent(query)}`

    try {
      const res = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.detail || errorData.error || `HTTP ${res.status}`)
      }

      const result = await res.json()

      if (result.message.includes("complete") || result.message.includes("valid")) {
        persistLocal({ ...data, kycStatus: "Complete" })
      } else {
        persistLocal({ ...data, kycStatus: "Needs Attention" })
      }

      setKycMessage(result.message)
      alert(`AI KYC Validation Complete\n\n${result.message}`)

    } catch (error: any) {
      console.error("AI Agent Verification Failed:", error)
      setKycMessage("Verification failed")
      alert("AI verification failed: " + error.message)
    } finally {
      setIsVerifying(false)
    }
  }

  const handleRefreshKyc = async () => {
    if (!data.email) {
      alert("No email address found to search.")
      return
    }

    setIsRefreshingKyc(true)
    
    const token = getMsalAccessTokenFromSessionStorage()
    if (!token) {
      alert("Session expired. Please sign in again.")
      setIsRefreshingKyc(false)
      return
    }

    try {
      const safeEmail = data.email.trim()
      const rawFilter = `fields/EmailAddress eq '${safeEmail}'`
      const url = `https://graph.microsoft.com/v1.0/sites/${SITE_ID}/lists/${LIST_ID}/items?expand=fields&$filter=${encodeURIComponent(rawFilter)}`

      console.log("🔍 Direct Graph Search:", url)

      const res = await fetch(url, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Prefer": "HonorNonIndexedQueriesWarningMayFailRandomly"
        }
      })

      if (!res.ok) {
        const errorText = await res.text()
        console.error("Graph API Error:", errorText)
        throw new Error("Failed to search SharePoint directly")
      }

      const json = await res.json()
      console.log("✅ Search Result:", json)

      if (json.value && json.value.length > 0) {
        const remoteItem = json.value[0]
        const remoteKycStatus = remoteItem.fields.KYCStatus || "Pending"
        
        const updatedData = { ...data, kycStatus: remoteKycStatus }
        persistLocal(updatedData)
        
        alert(`Status Refreshed: ${remoteKycStatus}`)
      } else {
        alert(`No record found for: ${safeEmail}\n\nSince we are searching Microsoft directly, please check if the email in the SharePoint list matches exactly.`)
      }

    } catch (error) {
      console.error("Refresh KYC Failed:", error)
      alert("Connection failed. Check console.")
    } finally {
      setIsRefreshingKyc(false)
    }
  }

  const handleSaveToSharePoint = async () => {
    if (!isValidEmail(data.email)) {
      alert("Please enter a valid email address.")
      return
    }

    setIsSaving(true)

    const token = getMsalAccessTokenFromSessionStorage()
    if (!token) {
      alert("Session expired or invalid. Please sign in again.")
      setIsSaving(false)
      return
    }

    const payload = {
      fields: mapStateToSharePointFields(data)
    }

    try {
      const res = await fetch(`${API_BASE_URL}/sharepoint/${SITE_ID}/lists/${LIST_ID}/items`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.details || err.error || "Unknown error")
      }

      const result = await res.json()
      console.log("SharePoint Sync Success:", result)

      persistLocal(data)
      
      if (activeModal === "editAll") {
        setActiveModal(null)
      }

      alert("Profile saved successfully to SharePoint!")

    } catch (error: any) {
      console.error("Save Failed:", error)
      alert("Failed to save to SharePoint: " + error.message)
    } finally {
      setIsSaving(false)
    }
  }

  const handleBack = () => {
    if (mounted) router.back()
  }

  const handleAvatarUpload = () => {
    const input = document.createElement("input")
    input.type = "file"
    input.accept = "image/*"
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) alert("Avatar selected (demo). Connect your upload API to store it.")
    }
    input.click()
  }

  const handleLogout = () => {
    if (mounted) router.push("/login")
  }

  const runFaceIdAuth = async () => {
    if (!faceIdSupported) {
      alert("FaceID/TouchID is not supported on this device/browser.")
      return false
    }
    try {
      const challenge = crypto.getRandomValues(new Uint8Array(32))
      await (navigator.credentials as any).get({
        publicKey: {
          challenge,
          timeout: 60000,
          userVerification: "required",
        },
      })
      return true
    } catch (e: any) {
      return false
    }
  }

  const toggleFaceId = async (nextValue: boolean) => {
    if (nextValue) {
      const ok = await runFaceIdAuth()
      if (!ok) {
        alert("FaceID/TouchID verification failed or was cancelled.")
        return
      }
      persistLocal({ ...data, faceIdEnabled: true })
      alert("FaceID Login enabled (demo).")
    } else {
      persistLocal({ ...data, faceIdEnabled: false })
      alert("FaceID Login disabled.")
    }
  }

  const close = () => {
    setActiveModal(null)
    setPassError("")
  }

  const copyCodes = async () => {
    try {
      await navigator.clipboard.writeText(backupCodes.join("\n"))
      setCopied(true)
      setTimeout(() => setCopied(false), 1200)
    } catch {
      alert("Copy failed. Your browser blocked clipboard access.")
    }
  }

  const resetTwoFaCodes = () => setBackupCodes(generateBackupCodes())

  const changePasswordDemo = () => {
    setPassError("")
    if (!currentPass.trim()) return setPassError("Please enter your current password.")
    if (newPass.length < 8) return setPassError("New password must be at least 8 characters.")
    if (newPass !== confirmPass) return setPassError("New password and confirmation do not match.")
    alert("Password changed successfully (demo). Connect backend to make it real.")
    setCurrentPass("")
    setNewPass("")
    setConfirmPass("")
  }

  if (!mounted) {
    return (
      <DashboardLayout>
        <div className="min-h-[calc(100vh-64px)] flex items-center justify-center">
          <div className="text-muted-foreground">Loading...</div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="min-h-[calc(100vh-64px)] bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/20">
        <div className="w-full flex justify-center px-4 sm:px-6 py-8">
          <div className="w-full max-w-[520px] space-y-6 animate-fade-in">
            
            <div className="flex items-center justify-between px-1">
              <button
                type="button"
                onClick={handleBack}
                className="w-11 h-11 rounded-2xl glass-card border border-border grid place-items-center hover:border-primary/50 transition-all"
                aria-label="Back"
              >
                <ArrowLeft className="w-5 h-5 text-foreground" />
              </button>

              <div className="text-center">
                <h1 className="text-lg font-extrabold text-foreground">Profile & Settings</h1>
                <p className="text-xs text-muted-foreground mt-0.5">Manage your account</p>
              </div>

              <div className="w-11" />
            </div>

            <div className="rounded-3xl glass-card border border-border shadow-xl p-6">
              
              <div className="relative -mx-6 -mt-6 mb-6 px-6 pt-8 pb-6 rounded-t-3xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full blur-3xl" />
                
                <div className="relative flex flex-col items-center text-center">
                  <div className="relative group">
                    <Avatar className="w-24 h-24 ring-4 ring-white/90 shadow-2xl">
                      <AvatarImage src="" alt={data.displayName} />
                      <AvatarFallback className="bg-white text-indigo-600 font-extrabold text-2xl">
                        {initials}
                      </AvatarFallback>
                    </Avatar>

                    <button
                      type="button"
                      onClick={handleAvatarUpload}
                      className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full bg-white text-indigo-600 shadow-lg grid place-items-center hover:scale-110 transition-transform"
                      aria-label="Edit profile photo"
                    >
                      <Camera className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="mt-4">
                    <div className="text-2xl font-extrabold text-white leading-tight flex items-center gap-2 justify-center">
                      {data.displayName}
                    </div>

                    <div className="mt-2 flex items-center justify-center gap-2 text-sm">
                      <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur border border-white/30 text-white font-bold">
                        {data.clientType}
                      </span>
                      <span className="text-white/60">•</span>
                      <span className="text-white/90 font-semibold">{data.clientId}</span>
                    </div>

                    <div className="mt-3 flex items-center justify-center gap-3">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/20 backdrop-blur border border-emerald-400/30 text-xs font-bold text-white">
                        <Shield className="w-4 h-4" />
                        Verified Account
                      </span>
                      {savedAt && (
                        <span className="text-xs text-white/80 font-semibold">
                          Saved {savedAt}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mt-5 w-full grid grid-cols-2 gap-3">
                    <Button
                      onClick={() => setActiveModal("editAll")}
                      variant="outline"
                      className="h-11 rounded-2xl border-white/30 bg-white/10 backdrop-blur hover:bg-white/20 text-white font-bold"
                      disabled={isSaving}
                    >
                      <Pencil className="w-4 h-4 mr-2" />
                      Edit Profile
                    </Button>
                    <Button
                      onClick={handleSaveToSharePoint}
                      disabled={isSaving}
                      className="h-11 rounded-2xl bg-white hover:bg-white/90 text-indigo-600 font-extrabold shadow-lg"
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4 mr-2" />
                          Save Changes
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              <div className="space-y-7">
                
                <section>
                  <SectionTitle>PERSONAL INFORMATION</SectionTitle>
                  <div className="space-y-3">
                    <SettingsRow
                      icon={<User className="w-5 h-5" />}
                      label="Display Name"
                      value={data.displayName}
                      onClick={() => setActiveModal("editAll")}
                    />

                    <SettingsRow
                      icon={<Hash className="w-5 h-5" />}
                      label="Xero ID"
                      value={data.xeroId}
                      onClick={() => setActiveModal("editAll")}
                    />

                    <SettingsRow
                      icon={<User className="w-5 h-5" />}
                      label="Full Legal Name"
                      value={data.legalName}
                      onClick={() => setActiveModal("editAll")}
                    />
                    <SettingsRow
                      icon={<IdCard className="w-5 h-5" />}
                      label="Tax ID / SSN"
                      value={data.taxIdMasked}
                      onClick={() => setActiveModal("editAll")}
                    />
                    <SettingsRow
                      icon={<CalendarDays className="w-5 h-5" />}
                      label="Date of Birth"
                      value={data.dob}
                      onClick={() => setActiveModal("editAll")}
                    />
                  </div>
                </section>

                <section>
                  <SectionTitle>CONTACT DETAILS</SectionTitle>
                  <div className="space-y-3">
                    <SettingsRow
                      icon={<Phone className="w-5 h-5" />}
                      label="Phone Number"
                      value={data.phone}
                      onClick={() => setActiveModal("editAll")}
                    />
                    <SettingsRow
                      icon={<Mail className="w-5 h-5" />}
                      label="Email Address"
                      value={data.email}
                      onClick={() => setActiveModal("editAll")}
                      right={
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            setActiveModal("editAll")
                            setTimeout(() => {
                              const el = document.getElementById("editAllEmail")
                              el?.scrollIntoView({ behavior: "smooth", block: "center" })
                              ;(el as HTMLInputElement | null)?.focus?.()
                            }, 200)
                          }}
                          className="px-3 py-1.5 rounded-xl text-xs font-bold text-primary bg-primary/10 border border-primary/20 hover:bg-primary/20 transition-all"
                        >
                          Edit
                        </button>
                      }
                    />
                    <SettingsRow
                      icon={<MapPin className="w-5 h-5" />}
                      label="Mailing Address"
                      value={prettyAddress(data)}
                      onClick={() => setActiveModal("editAll")}
                    />
                  </div>
                </section>

                <section>
                  <SectionTitle>SECURITY & PREFERENCES</SectionTitle>
                  <div className="space-y-3">
                    <SettingsRow
                      icon={<Fingerprint className="w-5 h-5" />}
                      label="FaceID Login"
                      value={
                        faceIdSupported
                          ? data.faceIdEnabled
                            ? "Enabled"
                            : "Disabled"
                          : "Not supported"
                      }
                      onClick={() => toggleFaceId(!data.faceIdEnabled)}
                      right={
                        <MiniToggle
                          checked={data.faceIdEnabled}
                          onChange={toggleFaceId}
                          ariaLabel="Toggle FaceID"
                          disabled={!faceIdSupported}
                        />
                      }
                    />

                    <SettingsRow
                      icon={<Bell className="w-5 h-5" />}
                      label="Push Notifications"
                      value={data.pushNotifications ? "Enabled" : "Disabled"}
                      onClick={() => persistLocal({ ...data, pushNotifications: !data.pushNotifications })}
                      right={
                        <MiniToggle
                          checked={data.pushNotifications}
                          onChange={(v) => persistLocal({ ...data, pushNotifications: v })}
                          ariaLabel="Toggle Push Notifications"
                        />
                      }
                    />

                    <SettingsRow
                      icon={<ShieldCheck className="w-5 h-5" />}
                      label="Two-Factor Auth"
                      value={data.twoFactorEnabled ? "Enabled" : "Disabled"}
                      onClick={() => setActiveModal("twofa")}
                      right={
                        <span
                          className={clsx(
                            "px-3 py-1.5 rounded-xl text-xs font-bold border",
                            data.twoFactorEnabled
                              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600"
                              : "bg-secondary border-border text-muted-foreground"
                          )}
                        >
                          {data.twoFactorEnabled ? "Active" : "Inactive"}
                        </span>
                      }
                    />

                    <SettingsRow
                      icon={<KeyRound className="w-5 h-5" />}
                      label="Change Password"
                      onClick={() => setActiveModal("editAll")}
                    />
                  </div>
                </section>

                <section>
                  <SectionTitle>COMPLIANCE & STATUS</SectionTitle>
                  <div className="space-y-3">
                    <SettingsRow
                      icon={<FileCheck className="w-5 h-5" />}
                      label="KYC Status"
                      value={data.kycStatus}
                      clickable={false}
                      right={
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            disabled={isRefreshingKyc}
                            onClick={handleRefreshKyc}
                            className="w-9 h-9 rounded-xl hover:bg-secondary/80 text-muted-foreground"
                          >
                            <RefreshCw className={clsx("w-4 h-4", isRefreshingKyc && "animate-spin text-primary")} />
                          </Button>

                          <Button
                            size="sm"
                            className="px-4 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-700 text-white"
                            onClick={handleVerifyKyc}
                            disabled={isVerifying}
                          >
                            {isVerifying ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Verifying...
                              </>
                            ) : (
                              "Verify"
                            )}
                          </Button>
                        </div>
                      }
                    />
                  </div>
                </section>

                <div className="pt-2">
                  <Button
                    onClick={handleLogout}
                    className="w-full h-12 rounded-2xl bg-red-50 hover:bg-red-100 text-red-600 border-2 border-red-200 font-extrabold transition-all"
                    variant="outline"
                  >
                    <LogOut className="w-5 h-5 mr-2" />
                    Log Out
                  </Button>

                  <div className="mt-4 text-center text-xs font-semibold text-muted-foreground">
                    App Version {data.appVersion}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <Modal
          open={activeModal === "editAll"}
          title="Edit Profile"
          subtitle="Update your personal info, contact details, and security preferences."
          onClose={close}
          footer={
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" className="h-12 rounded-2xl" onClick={close} disabled={isSaving}>
                Cancel
              </Button>
              <Button
                className="h-12 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-extrabold shadow-lg"
                disabled={isSaving}
                onClick={handleSaveToSharePoint}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </div>
          }
        >
          <div className="space-y-6">
            <div>
              <div className="text-xs font-extrabold tracking-widest text-muted-foreground mb-4">PERSONAL</div>
              <div className="grid gap-4">
                <Field label="Display Name">
                  <Input
                    className="h-12 rounded-2xl border-2"
                    value={data.displayName}
                    onChange={(e) => setData({ ...data, displayName: e.target.value })}
                  />
                </Field>

                <Field label="Xero ID">
                  <Input
                    className="h-12 rounded-2xl border-2"
                    value={data.xeroId}
                    onChange={(e) => setData({ ...data, xeroId: e.target.value })}
                  />
                </Field>

                <Field label="Full Legal Name">
                  <Input
                    className="h-12 rounded-2xl border-2"
                    value={data.legalName}
                    onChange={(e) => setData({ ...data, legalName: e.target.value })}
                  />
                </Field>

                <Field label="Tax ID / SSN (masked)" hint="Typically updated via KYC flow (demo editable).">
                  <Input
                    className="h-12 rounded-2xl border-2"
                    value={data.taxIdMasked}
                    onChange={(e) => setData({ ...data, taxIdMasked: e.target.value })}
                  />
                </Field>

                <Field label="Date of Birth" hint="In production this is often locked (demo editable).">
                  <Input
                    className="h-12 rounded-2xl border-2"
                    value={data.dob}
                    onChange={(e) => setData({ ...data, dob: e.target.value })}
                  />
                </Field>
              </div>
            </div>

            <div>
              <div className="text-xs font-extrabold tracking-widest text-muted-foreground mb-4">CONTACT</div>
              <div className="grid gap-4">
                <Field label="Phone Number">
                  <Input
                    className="h-12 rounded-2xl border-2"
                    value={data.phone}
                    onChange={(e) => setData({ ...data, phone: e.target.value })}
                  />
                </Field>

                <Field label="Email Address">
                  <Input
                    id="editAllEmail"
                    className="h-12 rounded-2xl border-2"
                    type="email"
                    value={data.email}
                    onChange={(e) => setData({ ...data, email: e.target.value })}
                  />
                  {!isValidEmail(data.email) ? (
                    <p className="text-xs text-red-600 font-semibold mt-2">Invalid email format.</p>
                  ) : null}
                </Field>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Address line 1">
                    <Input
                      id="editAllAddress1"
                      className="h-12 rounded-2xl border-2"
                      value={data.addressLine1}
                      onChange={(e) => setData({ ...data, addressLine1: e.target.value })}
                    />
                  </Field>
                  <Field label="Address line 2">
                    <Input
                      className="h-12 rounded-2xl border-2"
                      value={data.addressLine2}
                      onChange={(e) => setData({ ...data, addressLine2: e.target.value })}
                    />
                  </Field>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="City">
                    <Input
                      className="h-12 rounded-2xl border-2"
                      value={data.city}
                      onChange={(e) => setData({ ...data, city: e.target.value })}
                    />
                  </Field>
                  <Field label="State">
                    <Input
                      className="h-12 rounded-2xl border-2"
                      value={data.state}
                      onChange={(e) => setData({ ...data, state: e.target.value })}
                    />
                  </Field>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="ZIP">
                    <Input
                      className="h-12 rounded-2xl border-2"
                      value={data.zip}
                      onChange={(e) => setData({ ...data, zip: e.target.value })}
                    />
                  </Field>
                  <Field label="Country">
                    <Input
                      className="h-12 rounded-2xl border-2"
                      value={data.country}
                      onChange={(e) => setData({ ...data, country: e.target.value })}
                    />
                  </Field>
                </div>
              </div>
            </div>

            <div>
              <div className="text-xs font-extrabold tracking-widest text-muted-foreground mb-4">
                SECURITY & PREFERENCES
              </div>

              <div className="space-y-3">
                <div className="rounded-2xl border-2 border-border glass-card p-5 flex items-center justify-between gap-4">
                  <div>
                    <div className="font-bold text-foreground">FaceID Login</div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {faceIdSupported
                        ? "Requires device biometric verification to enable."
                        : "Not supported on this device/browser."}
                    </div>
                  </div>

                  <MiniToggle
                    checked={data.faceIdEnabled}
                    onChange={toggleFaceId}
                    ariaLabel="Toggle FaceID"
                    disabled={!faceIdSupported}
                  />
                </div>

                <div className="rounded-2xl border-2 border-border glass-card p-5 flex items-center justify-between gap-4">
                  <div>
                    <div className="font-bold text-foreground">Push Notifications</div>
                    <div className="text-sm text-muted-foreground mt-1">
                      Turn on/off in-app notifications (demo).
                    </div>
                  </div>

                  <MiniToggle
                    checked={data.pushNotifications}
                    onChange={(v) => setData({ ...data, pushNotifications: v })}
                    ariaLabel="Toggle Push Notifications"
                  />
                </div>
              </div>
            </div>

            <div>
              <div className="text-xs font-extrabold tracking-widest text-muted-foreground mb-4">PASSWORD</div>
              <div className="grid gap-4">
                <Field label="Current password">
                  <Input
                    className="h-12 rounded-2xl border-2"
                    type="password"
                    value={currentPass}
                    onChange={(e) => setCurrentPass(e.target.value)}
                  />
                </Field>

                <Field label="New password" hint="Minimum 8 characters.">
                  <Input
                    className="h-12 rounded-2xl border-2"
                    type="password"
                    value={newPass}
                    onChange={(e) => setNewPass(e.target.value)}
                  />
                </Field>

                <Field label="Confirm new password">
                  <Input
                    className="h-12 rounded-2xl border-2"
                    type="password"
                    value={confirmPass}
                    onChange={(e) => setConfirmPass(e.target.value)}
                  />
                </Field>

                {passError ? <p className="text-sm font-semibold text-red-600">{passError}</p> : null}

                <Button
                  variant="outline"
                  className="h-12 rounded-2xl"
                  onClick={() => {
                    setPassError("")
                    if (!currentPass.trim()) return setPassError("Please enter your current password.")
                    if (newPass.length < 8) return setPassError("New password must be at least 8 characters.")
                    if (newPass !== confirmPass) return setPassError("New password and confirmation do not match.")
                    changePasswordDemo()
                  }}
                >
                  Update Password (demo)
                </Button>
              </div>
            </div>
          </div>
        </Modal>

        <Modal
          open={activeModal === "twofa"}
          title="Two-Factor Authentication"
          subtitle="Enable extra security for your account."
          onClose={close}
          footer={
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" className="h-12 rounded-2xl" onClick={close}>
                Close
              </Button>
              <Button
                className="h-12 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-extrabold shadow-lg"
                onClick={() => {
                  persistLocal({ ...data })
                  close()
                }}
              >
                Save
              </Button>
            </div>
          }
        >
          <div className="flex items-center justify-between rounded-2xl border-2 border-border p-5 glass-card">
            <div>
              <div className="font-bold text-foreground">Two-Factor Auth</div>
              <div className="text-sm text-muted-foreground mt-1">
                {data.twoFactorEnabled ? "Currently enabled" : "Currently disabled"}
              </div>
            </div>

            <MiniToggle
              checked={data.twoFactorEnabled}
              onChange={(v) => setData({ ...data, twoFactorEnabled: v })}
              ariaLabel="Toggle two factor auth"
            />
          </div>

          {data.twoFactorEnabled ? (
            <div className="mt-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-bold text-foreground">Backup Codes (demo)</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Save these somewhere safe. You can regenerate them.
                  </div>
                </div>

                <button
                  type="button"
                  onClick={copyCodes}
                  className="px-4 py-2.5 rounded-2xl glass-card border border-border hover:border-primary/50 text-sm font-bold text-foreground flex items-center gap-2 transition-all"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                {backupCodes.map((c) => (
                  <div
                    key={c}
                    className="rounded-2xl border-2 border-border glass-card px-4 py-3 font-mono text-sm font-bold text-foreground text-center"
                  >
                    {c}
                  </div>
                ))}
              </div>

              <Button variant="outline" className="w-full mt-4 h-12 rounded-2xl" onClick={resetTwoFaCodes}>
                Regenerate Backup Codes
              </Button>
            </div>
          ) : (
            <div className="mt-4 text-sm text-muted-foreground">
              Turn on Two-Factor Auth to view backup codes.
            </div>
          )}
        </Modal>
      </div>
    </DashboardLayout>
  )
}