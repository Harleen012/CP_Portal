"use client"

import { type ReactNode, useState, useRef, useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Home,
  Briefcase,
  FileText,
  User,
  LogOut,
  Settings,
  BarChart3,
  CreditCard,
} from "lucide-react"

interface DashboardLayoutProps {
  children: ReactNode
}

/**
 * 🔑 Profile data source (written by Profile Page)
 */
const PROFILE_STORAGE_KEY = "profile_settings_v2"


/**
 * ⏱ Refresh every 1 second (as requested)
 */
const REFRESH_INTERVAL_MS = 1000

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname()
  const router = useRouter()
  const dropdownRef = useRef<HTMLDivElement>(null)
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false)

  // ✅ Live profile state
  const [displayName, setDisplayName] = useState<string>("Guest")
  const [displayEmail, setDisplayEmail] = useState<string>("")

  /**
   * ✅ Load latest profile data
   */
  const loadProfileFromStorage = () => {
    try {
      const raw = localStorage.getItem(PROFILE_STORAGE_KEY)
      if (!raw) return

      const parsed = JSON.parse(raw)

      const latestName =
        (parsed.displayName ||
          parsed.fullLegalName ||
          parsed.name ||
          "").trim()

      const latestEmail = (parsed.email || "").trim()

      setDisplayName((prev) =>
        latestName && latestName !== prev ? latestName : prev
      )

      setDisplayEmail((prev) =>
        latestEmail && latestEmail !== prev ? latestEmail : prev
      )
    } catch {
      // ignore invalid storage
    }
  }

  /**
   * 🔄 REAL-TIME SYNC (EVERY 1 SECOND)
   */
  useEffect(() => {
    // Initial read
    loadProfileFromStorage()

    // Every 1 second refresh
    const interval = setInterval(loadProfileFromStorage, REFRESH_INTERVAL_MS)

    // Cross-tab update support
    const onStorage = (e: StorageEvent) => {
      if (e.key === PROFILE_STORAGE_KEY) {
        loadProfileFromStorage()
      }
    }

    window.addEventListener("storage", onStorage)

    return () => {
      clearInterval(interval)
      window.removeEventListener("storage", onStorage)
    }
  }, [])

  /**
   * ✅ Generate initials from name
   */
  const getInitials = (name: string) => {
    if (!name || name === "Guest") return "??"
    const parts = name.trim().split(/\s+/)
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }

  const initials = getInitials(displayName)

  const navItems = [
    { icon: Home, label: "Dashboard", path: "/dashboard" },
    { icon: Briefcase, label: "Work", path: "/work" },
    { icon: BarChart3, label: "Performance", path: "/performance" },
    { icon: FileText, label: "Documents", path: "/documents" },
    { icon: CreditCard, label: "Loan Approval", path: "/LoanApproval" },
    { icon: User, label: "Profile", path: "/profile" },
  ]

  const handleLogout = () => router.push("/login")

  /**
   * Close dropdown when clicking outside
   */
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setProfileDropdownOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">

      {/* ================= SIDEBAR ================= */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-72 z-50">
        <div className="flex flex-col flex-grow bg-white border-r shadow-lg">
          <div className="px-6 pt-8 pb-6">
            <span className="text-2xl font-bold bg-gradient-to-r from-[#137FEC] to-[#4169E1] bg-clip-text text-transparent">
              Findashboard
            </span>
            <div className="text-xs text-gray-500">Professional Hub</div>
          </div>

          <nav className="flex-1 px-4 space-y-2">
            {navItems.map(({ icon: Icon, label, path }) => {
              const active = pathname === path
              return (
                <button
                  key={path}
                  onClick={() => router.push(path)}
                  className={`w-full flex items-center px-5 py-4 rounded-xl font-semibold transition ${
                    active
                      ? "bg-[#137FEC] text-white"
                      : "text-gray-600 hover:bg-[#E3F2FD]"
                  }`}
                >
                  <Icon className="mr-4 h-6 w-6" />
                  {label}
                </button>
              )
            })}
          </nav>
        </div>
      </aside>

      {/* ================= TOP BAR ================= */}
      <div className="hidden lg:flex lg:pl-72 sticky top-0 bg-white border-b shadow-sm z-30">
        <div className="flex flex-1 justify-end px-8 py-4">
          <div ref={dropdownRef} className="relative">
            <button
              onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
              className="flex items-center gap-3 p-2 hover:bg-gray-100 rounded-xl"
            >
              <Avatar className="w-9 h-9">
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>

              <div className="text-left">
                {/* ✅ ALWAYS LATEST PROFILE NAME */}
                <p className="text-sm font-semibold">{displayName}</p>
                <p className="text-xs text-muted-foreground">Manage Account</p>
              </div>
            </button>

            {profileDropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white border rounded-xl shadow-xl">
                <div className="p-3 border-b bg-gray-50">
                  <div className="font-semibold">{displayName}</div>
                  <div className="text-xs text-gray-500">{displayEmail}</div>
                </div>

                <button
                  onClick={() => router.push("/profile")}
                  className="w-full px-4 py-2 text-left hover:bg-gray-100"
                >
                  View Profile
                </button>

                {/* <button
                  onClick={() => router.push("/settings")}
                  className="w-full px-4 py-2 text-left hover:bg-gray-100"
                >
                  Settings
                </button> */}

                <button
                  onClick={handleLogout}
                  className="w-full px-4 py-2 text-left text-red-600 hover:bg-red-50"
                >
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ================= MAIN CONTENT ================= */}
      <main className="lg:pl-72 px-4 py-6">{children}</main>
    </div>
  )
}
